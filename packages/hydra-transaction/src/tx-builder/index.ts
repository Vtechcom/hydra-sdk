import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import {
	Asset,
	Converter,
	DEFAULT_PROTOCOL_PARAMETERS,
	Deserializer,
	IFetcher,
	ISubmitter,
	ParserUtils,
	PLACEHOLDER_ADDRESS,
	Protocol,
	Resolver,
	TxOutput,
	UTxO,
	UTxOObject,
	LanguageVersion,
	CostModels
} from '@hydra-sdk/core'

import {
	Certificate,
	CollateralInput,
	CoinSelectionStrategy,
	Datum,
	MintAsset,
	Redeemer,
	TxIn,
	TxMetadata,
	ValidityRange,
	Withdrawal,
	Metadatum,
	TxBuilderOptions,
	ScriptRef,
	COIN_SELECTION_STRATEGY,
	PolicyScript,
	IEvaluator,
	EvalAction
} from '../types'
import { metadataObjToMetadatum } from '../utils/metadata'
import { safeStringify } from '../utils/bigint.utils'
import { emptyRedeemer } from '../utils/redeemer-builder'

export class TxBuilder {
	protected _protocolParams: Protocol = DEFAULT_PROTOCOL_PARAMETERS
	protected _txBuilder!: CardanoWASM.TransactionBuilder
	protected _fetcher?: IFetcher
	protected _submitter?: ISubmitter
	protected _evaluator?: IEvaluator
	protected _txEvaluationMultiplier: number = 1
	protected _isHydra: boolean = false
	protected _verbose: boolean = false
	protected _errorLogger: boolean = false

	// Transaction building state
	protected _inputs: TxIn[] = []
	protected _inputUTxOObject: UTxOObject = {}
	protected _outputs: TxOutput[] = []
	protected _collaterals: CollateralInput[] = []
	protected _referenceInputs: TxIn[] = []
	protected _mints: MintAsset[] = []
	protected _certificates: Certificate[] = []
	protected _withdrawals: Withdrawal[] = []
	protected _requiredSigners: string[] = []
	protected _metadata = CardanoWASM.GeneralTransactionMetadata.new()
	protected _validityRange?: ValidityRange
	protected _changeAddress?: string
	protected _changeConfig: CardanoWASM.ChangeConfig | null = null
	protected _totalCollateral?: string
	protected _collateralReturn?: TxOutput
	protected _auxiliaryDataHash?: string

	protected _selectionStrategy: CoinSelectionStrategy = 'LargestFirstMultiAsset'

	// Script context
	protected _plutusScripts: CardanoWASM.PlutusScripts | null = null

	/**
	 * Transient WASM objects allocated during a single build (complete()).
	 * CSL objects live in WASM linear memory and are NOT reclaimed by the JS GC
	 * in a timely manner (FinalizationRegistry is non-deterministic and lags far
	 * behind under load). We track every internal allocation here and free them
	 * deterministically after build_tx() returns — see _freeScratch().
	 *
	 * IMPORTANT: only objects that TxBuilder itself allocates go here. Objects
	 * supplied by the caller (datum/redeemer/script) are owned by the caller and
	 * must never be freed by the builder.
	 */
	protected _scratch: Array<{ free(): void }> = []
	protected _disposed = false

	constructor(options: TxBuilderOptions = {}) {
		const {
			params,
			fetcher,
			submitter,
			evaluator,
			txEvaluationMultiplier = 1,
			isHydra = false,
			verbose = false,
			errorLogger = false
		} = options

		this._fetcher = fetcher
		this._submitter = submitter
		this._evaluator = evaluator
		this._txEvaluationMultiplier = txEvaluationMultiplier
		this._isHydra = isHydra
		this._verbose = verbose
		this._errorLogger = errorLogger

		if (params) {
			// updateProtocolParams() already builds this._txBuilder from the merged
			// params. Building it again here would orphan (leak) the first one.
			this.updateProtocolParams(params)
		} else {
			this._txBuilder = TxBuilder.getTxBuilder(this._protocolParams)
		}
	}

	updateProtocolParams(params: Partial<Protocol>) {
		this._protocolParams = { ...this._protocolParams, ...params }
		// Free the previous TransactionBuilder before replacing it, otherwise it
		// lingers in WASM memory until a non-deterministic GC pass.
		try {
			this._txBuilder?.free()
		} catch {
			/* ignore */
		}
		this._txBuilder = TxBuilder.getTxBuilder(this._protocolParams)
		return this
	}

	// ============================================================================
	// Transaction Input Methods (Enhanced from Mesh SDK patterns)
	// ============================================================================

	/**
	 * Add transaction input (similar to Mesh txIn)
	 */
	txIn(txHash: string, outputIndex: number, amount?: Asset[], address?: string): TxBuilder {
		const input: TxIn = {
			txHash,
			outputIndex,
			amount,
			address
		}
		this._inputs.push(input)
		return this
	}

	/**
	 * Add script input
	 */
	txInInlineDatum(inlineDatum: Datum): TxBuilder {
		if (!this._inputs.length) {
			throw new Error('No input to attach inline datum to. Call txIn() first.')
		}
		const lastInput = this._inputs[this._inputs.length - 1]
		if (lastInput.datum) {
			throw new Error('Cannot use both inlineDatum and datumHash')
		}
		lastInput.inlineDatum = inlineDatum
		return this
	}

	/**
	 * TODO: Implement in the next version (v2.x)
	 */
	public setInputUtxo(utxoobject: UTxOObject) {
		this._inputUTxOObject = utxoobject
		return this
	}

	/**
	 * TODO: Implement in the next version (v2.x)
	 */
	public addInputUtxo(utxoobject: UTxOObject) {
		this._inputUTxOObject = { ...this._inputUTxOObject, ...utxoobject }
		return this
	}

	/**
	 * Add datum hash to the script input
	 */
	txInDatumHash(datum: Datum): TxBuilder {
		if (!this._inputs.length) {
			throw new Error('No input to attach datum hash to. Call txIn() first.')
		}
		const lastInput = this._inputs[this._inputs.length - 1]
		if (lastInput.inlineDatum) {
			throw new Error('Cannot use both inlineDatum and datumHash')
		}
		lastInput.datum = datum
		return this
	}

	/**
	 * Add redeemer to the script input
	 */
	txInRedeemerValue(redeemer: CardanoWASM.Redeemer): TxBuilder {
		if (!this._inputs.length) {
			throw new Error('No input to attach redeemer to. Call txIn() first.')
		}
		const lastInput = this._inputs[this._inputs.length - 1]
		lastInput.redeemer = redeemer

		return this
	}

	/**
	 * Add redeemer to the script input
	 */
	txInEmptyRedeemer(): TxBuilder {
		if (!this._inputs.length) {
			throw new Error('No input to attach redeemer to. Call txIn() first.')
		}
		const lastInput = this._inputs[this._inputs.length - 1]
		lastInput.redeemer = emptyRedeemer({ type: 'constr' })
		return this
	}

	/**
	 * Add script to the last input
	 */
	txInScript(scriptCbor: string, version: LanguageVersion = 'V3'): TxBuilder {
		if (!this._inputs.length) {
			throw new Error('No input to attach script to. Call txIn() first.')
		}
		const scriptRef: ScriptRef = {
			scriptCbor,
			version
		}
		const lastInput = this._inputs[this._inputs.length - 1]
		lastInput.scriptRef = scriptRef

		this._plutusScripts = this._plutusScripts || CardanoWASM.PlutusScripts.new()
		let language: CardanoWASM.Language
		if (version === 'V1') {
			language = CardanoWASM.Language.new_plutus_v1()
		} else if (version === 'V2') {
			language = CardanoWASM.Language.new_plutus_v2()
		} else {
			language = CardanoWASM.Language.new_plutus_v3()
		}
		const plutusScript = CardanoWASM.PlutusScript.from_hex_with_version(scriptCbor, language)
		this._plutusScripts.add(plutusScript)
		return this
	}

	/**
	 * Add UTxO reference input
	 */
	txInReference(txHash: string, outputIndex: number): TxBuilder {
		const input: TxIn = {
			txHash,
			outputIndex
		}
		this._referenceInputs.push(input)
		return this
	}

	/**
	 * Set spending Plutus script version
	 */
	spendingPlutusScript(version: LanguageVersion): TxBuilder {
		if (!this._inputs.length) {
			throw new Error('No input to set script version for. Call setInputScriptTx() first.')
		}
		const lastInput = this._inputs[this._inputs.length - 1]
		if (!lastInput.scriptRef) {
			throw new Error('No script attached to input. Call txInScript() first.')
		}
		lastInput.scriptRef.version = version
		return this
	}

	// ============================================================================
	// Transaction Output Methods (Enhanced from Mesh SDK patterns)
	// ============================================================================

	/**
	 * Add transaction output (similar to Mesh txOut)
	 */
	txOut(address: string, amount: Asset[]): TxBuilder {
		const output: TxOutput = {
			address,
			amount
		}
		this._outputs.push(output)
		return this
	}

	/**
	 * Add transaction output with inline datum
	 */
	txOutInlineDatumValue(inlineDatum: Datum): TxBuilder {
		if (this._outputs.length === 0) {
			throw new Error('No output to attach datum to. Call txOut() first.')
		}
		const lastOutput = this._outputs[this._outputs.length - 1]
		if (lastOutput.datum) {
			throw new Error('txOutInlineDatumValue: datumHash already set, no need to inline')
		}
		lastOutput.inlineDatum = inlineDatum
		return this
	}

	/**
	 * Add transaction output with datum hash
	 */
	txOutDatumHashValue(datum: Datum): TxBuilder {
		if (this._outputs.length === 0) {
			throw new Error('No output to attach datum to. Call txOut() first.')
		}
		const lastOutput = this._outputs[this._outputs.length - 1]

		if (lastOutput.inlineDatum) {
			throw new Error('txOutDatumHashValue: inlineDatum already set, no need to hash')
		}
		lastOutput.datum = datum
		return this
	}

	/**
	 * Add script reference to output
	 */
	txOutReferenceScript(scriptCbor: string, version: LanguageVersion = 'V3'): TxBuilder {
		if (this._outputs.length === 0) {
			throw new Error('No output to attach script to. Call txOut() first.')
		}
		const lastOutput = this._outputs[this._outputs.length - 1]

		lastOutput.scriptRef = {
			scriptCbor,
			version
		}
		return this
	}

	// ============================================================================
	// UTxO Selection Methods (Enhanced)
	// ============================================================================

	/**
	 * Select UTxOs from provided list using coin selection strategy
	 */
	private selectUtxosFrom(
		simpleUTxOs: UTxO[],
		strategy: CoinSelectionStrategy = 'LargestFirstMultiAsset',
		options?: { recalculateScriptDataHash?: boolean }
	): TxBuilder {
		try {
			if (!simpleUTxOs.length) {
				throw new Error('UTxO inputs Insufficient')
			}
			// this._verbose && console.log('[🛠️][TxBuilder] [simpleUTxOs]: ', safeStringify(simpleUTxOs, 2))
			const wasmUtxos = this._track(CardanoWASM.TransactionUnspentOutputs.new())
			simpleUTxOs.forEach(utxo => {
				const { txInput, txOutput } = this.buildSimpleUtxo(utxo)

				if (utxo.output.datum) {
					// utxo.output.datum is caller-owned — the derived hash is tracked
					const txHash = this._track(CardanoWASM.hash_plutus_data(utxo.output.datum))
					txOutput.set_data_hash(txHash)
				}

				// NOTE: Nếu input chứa inlineDatum thì không cần set data hash
				const transactionUnspendOutput = this._track(CardanoWASM.TransactionUnspentOutput.new(txInput, txOutput))
				wasmUtxos.add(transactionUnspendOutput)
			})
			this._verbose && console.log('[🛠️][TxBuilder] [wasmUtxos]: ', wasmUtxos.to_json())
			// NOTE: Thay vì gọi add_inputs_from thì gọi add_inputs_from_and_change để tự động tính change luôn
			// this._txBuilder.add_inputs_from(wasmUtxos, COIN_SELECTION_STRATEGY[strategy])
			if (!this._changeConfig || !this._changeAddress) {
				if (!this._isHydra) {
					throw new Error('Change address is required for UTxO selection. Call changeAddress() first.')
				} else {
					this._verbose && console.warn('[🛠️][TxBuilder] [selectUtxosFrom] Without change address for Hydra')
				}
			}
			this._txBuilder.add_inputs_from(wasmUtxos, COIN_SELECTION_STRATEGY[strategy])

			if (this._collaterals.length && this._collateralReturn) {
				try {
					this._txBuilder.set_collateral_return(
						this._track(
							CardanoWASM.TransactionOutput.new(
								this._track(CardanoWASM.Address.from_bech32(this._collateralReturn.address)),
								this._track(
									CardanoWASM.Value.new(
										this._track(
											CardanoWASM.BigNum.from_str(
												this._collateralReturn.amount.find(a => a.unit === 'lovelace')?.quantity || '0'
											)
										)
									)
								)
							)
						)
					)
					if (this._changeConfig) {
						this._txBuilder.add_inputs_from_and_change_with_collateral_return(
							wasmUtxos,
							COIN_SELECTION_STRATEGY[strategy],
							this._changeConfig,
							this._track(CardanoWASM.BigNum.from_str(String(this._protocolParams.collateralPercent || 150)))
						)
					}
				} catch (error) {
					this._errorLogger &&
						console.error('[error][selectUtxosFrom][add_inputs_from_and_change_with_collateral_return]: ', error)
					throw error
				}
			} else {
				try {
					if (this._changeConfig && this._changeAddress) {
						this._txBuilder.add_inputs_from_and_change(wasmUtxos, COIN_SELECTION_STRATEGY[strategy], this._changeConfig)
					} else {
						if (this._isHydra) {
							// NOTE: Với Hydra thì không cần change address
							// Cho phép build blueprint tx không có change address
							this._txBuilder.add_inputs_from(wasmUtxos, COIN_SELECTION_STRATEGY[strategy])
						} else {
							// NOTE: Với non-Hydra thì cần change address
							throw new Error('Change address is required for UTxO selection. Call changeAddress() first.')
						}
					}
				} catch (error) {
					this._errorLogger && console.error('[error][selectUtxosFrom][add_inputs_from_and_change]: ', error)
					throw error
				}
			}

			/**
			 * If there are script inputs, we need to recalculate script data hash
			 * because the change output may contain script data hash
			 * VI: nếu có input script thì mới cần recalculate lại script data hash
			 */
			if (options?.recalculateScriptDataHash) {
				const costMdls = this._buildCostModels()
				this._txBuilder.remove_script_data_hash()
				this._txBuilder.calc_script_data_hash(costMdls)
			}

			return this
		} catch (error) {
			this._errorLogger && console.error('[error][selectUtxosFrom]: ', error)
			throw error
		}
	}

	private buildSimpleUtxo(utxo: UTxO, options: { withDatum: boolean } = { withDatum: true }) {
		const lovelace = utxo.output.amount.find(el => el.unit === 'lovelace')?.quantity || '0'
		const withAssets = utxo.output.amount.filter(el => el.unit !== 'lovelace')

		/**
		 * @example
		 * ```ts
		 * {
		 * 	"policyId": {
		 * 		"assetName1": "quantity1",
		 * 		"assetName2": "quantity2"
		 * 	}
		 * }
		 * ```
		 */
		const multiAsset: CardanoWASM.MultiAssetJSON = {}
		for (const asset of withAssets) {
			const { policyId, assetName } = Deserializer.deserializeAssetUnit(asset.unit)
			const assets: CardanoWASM.AssetsJSON = {}
			assets[assetName] = asset.quantity

			if (!multiAsset[policyId]) {
				multiAsset[policyId] = {}
			}
			multiAsset[policyId] = { ...multiAsset[policyId], ...assets }
		}

		const txOutMultiAsset = this._track(CardanoWASM.MultiAsset.new())
		for (const policyId in multiAsset) {
			const assets = this._track(CardanoWASM.Assets.new())
			for (const assetName in multiAsset[policyId]) {
				assets.insert(
					this._track(CardanoWASM.AssetName.new(ParserUtils.hexToBytes(assetName))),
					this._track(CardanoWASM.BigNum.from_str(multiAsset[policyId][assetName]))
				)
			}
			txOutMultiAsset.insert(this._track(CardanoWASM.ScriptHash.from_hex(policyId)), assets)
		}

		const txOutValue = this._track(CardanoWASM.Value.new(this._track(CardanoWASM.BigNum.from_str(lovelace))))
		withAssets.length && txOutValue.set_multiasset(txOutMultiAsset)
		const txOutput = this._track(
			CardanoWASM.TransactionOutput.new(this._track(CardanoWASM.Address.from_bech32(utxo.output.address)), txOutValue)
		)
		const txInput = this._track(
			CardanoWASM.TransactionInput.new(
				this._track(CardanoWASM.TransactionHash.from_hex(utxo.input.txHash)),
				utxo.input.outputIndex
			)
		)
		if (options.withDatum && utxo.output.datum) {
			// utxo.output.datum is caller-owned — only derived hash objects are tracked
			const datumHash = this._track(CardanoWASM.hash_plutus_data(utxo.output.datum)).to_hex()
			txOutput.set_data_hash(this._track(CardanoWASM.DataHash.from_hex(datumHash)))
		}
		return {
			txInput,
			txOutput
		}
	}

	/**
	 * Legacy method for backward compatibility
	 * @warn This method will override all inputs
	 * @tip Always call this method before txIn()
	 */
	setInputs(utxos: UTxO[], options: { strategy: CoinSelectionStrategy } = { strategy: 'LargestFirstMultiAsset' }) {
		this._selectionStrategy = options.strategy
		this._inputs = utxos.map(utxo => ({
			txHash: utxo.input.txHash,
			outputIndex: utxo.input.outputIndex,
			amount: utxo.output.amount,
			address: utxo.output.address,
			datum: undefined,
			redeemer: undefined,
			scriptRef: undefined
		}))
		return this
	}

	// ============================================================================
	// Collateral Methods
	// ============================================================================

	/**
	 * Add collateral input
	 */
	txInCollateral(txHash: string, outputIndex: number, amount: Asset[], address: string): TxBuilder {
		const collateral: CollateralInput = {
			txHash,
			outputIndex,
			amount,
			address
		}
		this._collaterals.push(collateral)
		return this
	}

	/**
	 * Set total collateral amount
	 */
	totalCollateral(amount: string): TxBuilder {
		this._totalCollateral = amount
		return this
	}

	/**
	 * Set collateral return output
	 */
	collateralReturn(address: string, amount: Asset[]): TxBuilder {
		this._collateralReturn = {
			address,
			amount
		}
		return this
	}

	// ============================================================================
	// Minting Methods (Enhanced from Mesh SDK patterns)
	// ============================================================================

	/**
	 * Reserved for setting the Plutus script version context of the next mint
	 * operation. Currently a no-op kept for API/chaining compatibility — the mint
	 * script version is derived from the policy script passed to mintingScript().
	 */
	mintPlutusScript(version: LanguageVersion): TxBuilder {
		this._verbose && console.log('[🛠️][TxBuilder] [mintPlutusScript]: ', version)
		return this
	}

	/**
	 * Add mint asset
	 */
	mint(quantity: string, policyId: string, assetName: string): TxBuilder {
		const mintAsset: MintAsset = {
			assetName,
			quantity,
			policyId
		}
		this._mints.push(mintAsset)
		return this
	}

	/**
	 * Add minting script
	 */
	mintingScript(mintingScript: PolicyScript): TxBuilder {
		if (this._mints.length === 0) {
			throw new Error('No mint to attach script to. Call mint() first.')
		}
		const lastMint = this._mints[this._mints.length - 1]
		lastMint.policyScript = mintingScript
		return this
	}

	/**
	 * Add mint redeemer
	 */
	mintRedeemerValue(redeemer: Redeemer): TxBuilder {
		if (this._mints.length === 0) {
			throw new Error('No mint to attach redeemer to. Call mint() first.')
		}
		const lastMint = this._mints[this._mints.length - 1]
		lastMint.redeemer = redeemer
		return this
	}

	// ============================================================================
	// Certificate Methods
	// ============================================================================

	/**
	 * Register stake address
	 */
	registerStake(rewardAddress: string): TxBuilder {
		const cert: Certificate = {
			type: 'StakeRegistration',
			rewardAddress
		}
		this._certificates.push(cert)
		return this
	}

	/**
	 * Deregister stake address
	 */
	deregisterStake(rewardAddress: string): TxBuilder {
		const cert: Certificate = {
			type: 'StakeDeregistration',
			rewardAddress
		}
		this._certificates.push(cert)
		return this
	}

	/**
	 * Delegate stake to pool
	 */
	delegateStake(rewardAddress: string, poolKeyHash: string): TxBuilder {
		const cert: Certificate = {
			type: 'StakeDelegation',
			rewardAddress,
			poolKeyHash
		}
		this._certificates.push(cert)
		return this
	}

	// ============================================================================
	// Withdrawal Methods
	// ============================================================================

	/**
	 * Withdraw rewards
	 */
	withdrawal(rewardAddress: string, amount: string): TxBuilder {
		const withdrawal: Withdrawal = {
			rewardAddress,
			amount
		}
		this._withdrawals.push(withdrawal)
		return this
	}

	// ============================================================================
	// Metadata and Auxiliary Data Methods
	// ============================================================================

	/**
	 * Add metadata to transaction
	 */
	metadataValue(label: number | bigint | string | CardanoWASM.BigNum, value: string | object | number): TxBuilder {
		try {
			const _label = this._track(CardanoWASM.BigNum.from_str(label.toString()))
			const _value = this._track(metadataObjToMetadatum(value))
			this._metadata.insert(_label, _value)
		} catch (error: any) {
			this._verbose && console.error('[🛠️][TxBuilder] [metadataValue] Error: ', error)
			throw new Error(`Failed to add metadata: ${error.message}`)
		}
		return this
	}

	/**
	 * Add auxiliary data hash
	 */
	auxiliaryData(hash: string): TxBuilder {
		this._auxiliaryDataHash = hash
		return this
	}

	// ============================================================================
	// Validity Range Methods
	// ============================================================================

	/**
	 * Set invalid before slot
	 */
	invalidBefore(slot: number): TxBuilder {
		if (!this._validityRange) {
			this._validityRange = {}
		}
		this._validityRange.invalidBefore = slot
		return this
	}

	/**
	 * Set invalid after slot
	 */
	invalidAfter(slot: number): TxBuilder {
		if (!this._validityRange) {
			this._validityRange = {}
		}
		this._validityRange.invalidAfter = slot
		return this
	}

	// ============================================================================
	// Required Signers Methods
	// ============================================================================

	/**
	 * Add required signer by public key hash
	 */
	requiredSignerHash(pubKeyHash: string): TxBuilder {
		if (!this._requiredSigners.includes(pubKeyHash)) {
			this._requiredSigners.push(pubKeyHash)
		}
		return this
	}

	// ============================================================================
	// Change Address and Fee Methods
	// ============================================================================

	/**
	 * Set change address
	 */
	changeAddress(address: string): TxBuilder {
		this._changeAddress = address
		// Free a previously-set change config to avoid leaking it on re-assignment.
		try {
			this._changeConfig?.free()
		} catch {
			/* ignore */
		}
		this._changeConfig = CardanoWASM.ChangeConfig.new(this._track(CardanoWASM.Address.from_bech32(address)))
		return this
	}

	/**
	 * Placeholder that returns zero. The real minimum fee is computed by CSL
	 * during complete()/build_tx() from the fully-assembled transaction, so
	 * standalone pre-build fee estimation is not implemented here. Kept for API
	 * compatibility.
	 */
	calculateFee(): CardanoWASM.BigNum {
		return CardanoWASM.BigNum.zero()
	}

	/**
	 * Set specific fee amount
	 */
	setFee(fee: CardanoWASM.BigNum | string): TxBuilder {
		if (typeof fee === 'string') {
			fee = CardanoWASM.BigNum.from_str(fee)
		}
		this._txBuilder.set_fee(fee)
		return this
	}

	/**
	 * Set specific fee amount
	 */
	setMinFee(minFee: string | CardanoWASM.BigNum): TxBuilder {
		if (typeof minFee === 'string') {
			minFee = CardanoWASM.BigNum.from_str(minFee)
		}
		this._txBuilder.set_min_fee(minFee)
		return this
	}

	// ============================================================================
	// Legacy Methods (for backward compatibility)
	// ============================================================================

	/**
	 * Legacy method: Add output
	 */
	addOutput(output: TxOutput): TxBuilder {
		return this.txOut(output.address, output.amount)
	}

	/**
	 * Legacy method: Add multiple outputs
	 */
	addOutputs(outputs: TxOutput[]): TxBuilder {
		for (const output of outputs) {
			this.addOutput(output)
		}
		return this
	}

	/**
	 * Legacy method: Add lovelace-only output
	 */
	addLovelaceOutput(address: string, lovelace: string): TxBuilder {
		return this.txOut(address, [{ unit: 'lovelace', quantity: lovelace }])
	}

	/**
	 * Legacy method: Set change address
	 */
	setChangeAddress(address: string): TxBuilder {
		return this.changeAddress(address)
	}

	/**
	 * Legacy method: Calculate min ada for assets
	 */
	static minAda(
		placeholderOutput: CardanoWASM.TransactionOutput,
		protocolParams = DEFAULT_PROTOCOL_PARAMETERS
	): CardanoWASM.BigNum {
		const coinsPerByte = CardanoWASM.BigNum.from_str(protocolParams.coinsPerUtxoSize.toString())
		const dataCost = CardanoWASM.DataCost.new_coins_per_byte(coinsPerByte)
		const minAda = CardanoWASM.min_ada_for_output(placeholderOutput, dataCost)
		return minAda
	}

	/**
	 * Legacy method: Calculate min ada for assets
	 */
	static minAdaForAssets(assets: Asset[]): CardanoWASM.BigNum {
		const multiAsset = CardanoWASM.MultiAsset.new()
		const policyIds = new Map<string, Map<string, bigint>>()
		for (const asset of assets) {
			const { policyId, assetName } = Deserializer.deserializeAssetUnit(asset.unit)
			if (!policyIds.has(policyId)) {
				policyIds.set(policyId, new Map<string, bigint>())
			}
			if (!policyIds.get(policyId)!.has(assetName)) {
				policyIds.get(policyId)!.set(assetName, BigInt(0))
			}
			const currentQty = policyIds.get(policyId)!.get(assetName)!
			policyIds.get(policyId)!.set(assetName, currentQty + BigInt(asset.quantity))
		}
		policyIds.forEach((assetNames, policyId) => {
			const outputPolicyId = CardanoWASM.ScriptHash.from_hex(policyId)
			const outputAssets = CardanoWASM.Assets.new()

			assetNames.forEach((quantity, assetName) => {
				const outputAssetName = CardanoWASM.AssetName.new(ParserUtils.hexToBytes(assetName))
				outputAssets.insert(outputAssetName, CardanoWASM.BigNum.from_str(quantity.toString()))
			})
			multiAsset.insert(outputPolicyId, outputAssets)
		})

		const placeholderOutput = CardanoWASM.TransactionOutput.new(
			CardanoWASM.Address.from_bech32(PLACEHOLDER_ADDRESS[CardanoWASM.NetworkInfo.mainnet().network_id()]),
			CardanoWASM.Value.new_with_assets(CardanoWASM.BigNum.from_str('0'), multiAsset)
		)
		return TxBuilder.minAda(placeholderOutput)
	}

	// ============================================================================
	// Transaction Building and Completion Methods
	// ============================================================================

	/**
	 * Build and complete the transaction.
	 *
	 * When a transaction `evaluator` was supplied and the transaction contains
	 * Plutus redeemers, this runs a second build pass: the draft transaction is
	 * evaluated to obtain the real script execution units, those are written back
	 * into the redeemers, and the transaction is rebuilt so the fee is accurate.
	 * Without an evaluator (e.g. for Hydra), the single-pass build is returned
	 * unchanged.
	 */
	async complete(): Promise<CardanoWASM.Transaction> {
		let tx = await this._assembleAndBuild()

		if (this._evaluator && this._hasRedeemers()) {
			const txHex = tx.to_hex()
			let evals: EvalAction[]
			try {
				evals = await this._evaluator.evaluateTx(txHex)
			} catch (error) {
				this._errorLogger && console.error('[error][TxBuilder][evaluateTx]: ', error)
				throw error
			}
			const changed = this._applyEvaluatedExUnits(tx, evals)
			if (changed) {
				// Rebuild with the evaluated exUnits so CSL computes the correct fee.
				try {
					tx.free()
				} catch {
					/* ignore */
				}
				this._resetTxBuilderForRebuild()
				tx = await this._assembleAndBuild()
			} else {
				// Free the transient WASM objects _applyEvaluatedExUnits allocated.
				this._freeScratch()
			}
		}

		return tx
	}

	/** True if any staged input or mint carries a Plutus redeemer to evaluate. */
	private _hasRedeemers(): boolean {
		return this._inputs.some(i => i.redeemer) || this._mints.some(m => m.redeemer)
	}

	/**
	 * Map evaluated execution budgets back onto the staged redeemers, keyed by the
	 * redeemer pointer (SPEND → input by txHash#index, MINT → policy id). Returns
	 * true if any redeemer's exUnits changed. CERT/REWARD/VOTE/PROPOSE evaluation
	 * results are not remapped yet.
	 */
	private _applyEvaluatedExUnits(tx: CardanoWASM.Transaction, evals: EvalAction[]): boolean {
		if (!evals.length) return false
		const body = this._track(tx.body())
		const inputs = this._track(body.inputs())

		// Build the canonical mint policy-id ordering (redeemer MINT index → policy).
		const mintPolicyIds: string[] = []
		const mint = body.mint()
		if (mint) {
			this._track(mint)
			const keys = this._track(mint.keys())
			for (let i = 0; i < keys.len(); i++) {
				mintPolicyIds.push(this._track(keys.get(i)).to_hex())
			}
		}

		let changed = false
		for (const action of evals) {
			const budget = {
				mem: Math.floor(action.budget.mem * this._txEvaluationMultiplier),
				steps: Math.floor(action.budget.steps * this._txEvaluationMultiplier)
			}
			if (action.tag === 'SPEND') {
				if (action.index < 0 || action.index >= inputs.len()) continue
				const txIn = this._track(inputs.get(action.index))
				const txHash = this._track(txIn.transaction_id()).to_hex()
				const outputIndex = txIn.index()
				const target = this._inputs.find(i => i.txHash === txHash && i.outputIndex === outputIndex && i.redeemer)
				if (target?.redeemer) {
					target.redeemer = this._redeemerWithExUnits(target.redeemer, budget)
					changed = true
				}
			} else if (action.tag === 'MINT') {
				const policyId = mintPolicyIds[action.index]
				if (!policyId) continue
				for (const m of this._mints) {
					if (m.policyId === policyId && m.redeemer) {
						m.redeemer = this._redeemerWithExUnits(m.redeemer, budget)
						changed = true
					}
				}
			}
			// CERT / REWARD / VOTE / PROPOSE: evaluated but not remapped yet.
		}
		return changed
	}

	/** Clone a redeemer, replacing only its execution units. */
	private _redeemerWithExUnits(redeemer: CardanoWASM.Redeemer, budget: { mem: number; steps: number }): CardanoWASM.Redeemer {
		const tag = this._track(redeemer.tag())
		const index = this._track(redeemer.index())
		const data = this._track(redeemer.data())
		const exUnits = this._track(
			CardanoWASM.ExUnits.new(
				this._track(CardanoWASM.BigNum.from_str(String(budget.mem))),
				this._track(CardanoWASM.BigNum.from_str(String(budget.steps)))
			)
		)
		return CardanoWASM.Redeemer.new(tag, index, data, exUnits)
	}

	/**
	 * Discard the current TransactionBuilder and start a fresh one for the rebuild
	 * pass, keeping all staged descriptors (inputs/outputs/mints/metadata/scripts).
	 */
	private _resetTxBuilderForRebuild(): void {
		this._freeScratch()
		try {
			this._txBuilder?.free()
		} catch {
			/* ignore */
		}
		this._txBuilder = TxBuilder.getTxBuilder(this._protocolParams)
	}

	/**
	 * Assemble the staged transaction parts into the CardanoWASM builder and build
	 * the transaction. Freeing of transient WASM objects happens here (see
	 * _freeScratch in the finally block).
	 */
	private async _assembleAndBuild(): Promise<CardanoWASM.Transaction> {
		// Add all outputs to the transaction builder
		for (const output of this._outputs) {
			this._addOutputToBuilder(output)
		}

		// Add collaterals
		for (const collateral of this._collaterals) {
			this._addCollateralToBuilder(collateral)
		}

		// Apply explicit total collateral, if provided
		if (this._totalCollateral) {
			this._txBuilder.set_total_collateral(this._track(CardanoWASM.BigNum.from_str(this._totalCollateral)))
		}

		// Add mints
		for (const mint of this._mints) {
			this._addMintToBuilder(mint)
		}
		if (this._txBuilder.get_mint_builder()) {
			const mint = this._txBuilder.get_mint_builder()?.build()
			this._verbose && console.log('[🛠️][TxBuilder] [Mint]: ', mint?.to_json())
		}

		// Add certificates
		this._addCertificatesToBuilder()

		// Add withdrawals
		for (const withdrawal of this._withdrawals) {
			this._addWithdrawalToBuilder(withdrawal)
		}

		// Set validity range
		if (this._validityRange) {
			this._setValidityRange()
		}

		// Add required signers
		for (const signer of this._requiredSigners) {
			this._addRequiredSigner(signer)
		}

		// Add metadata
		if (this._metadata) {
			this._addMetadata()
		}

		// Add auxiliary data if present. The auxiliary-data hash is derived by CSL
		// from the auxiliary data itself when set_auxiliary_data() is called.
		let auxiliaryData: CardanoWASM.AuxiliaryData | undefined
		if (this._metadata.len() || this._auxiliaryDataHash) {
			auxiliaryData = this._track(CardanoWASM.AuxiliaryData.new())
			this._metadata.len() && auxiliaryData.set_metadata(this._metadata)
		}

		// Set auxiliary data
		if (auxiliaryData) {
			this._verbose && console.log('[🛠️][TxBuilder] [AuxiliaryData]: ', auxiliaryData.to_js_value())
			this._txBuilder.set_auxiliary_data(auxiliaryData)
		}

		// Add all inputs to the transaction builder
		this._verbose && console.log('[🛠️][TxBuilder] [Input Before]: ', safeStringify(this._inputs, 2))
		this._addInputsToBuilder(this._inputs, 'LargestFirstMultiAsset')
		this._verbose &&
			console.log('[🛠️][TxBuilder] [Input After]: ', safeStringify(this._txBuilder.get_total_input().to_js_value()))

		// Add all reference inputs to the transaction builder
		this._addReferenceInputsToBuilder(this._referenceInputs)

		try {
			let tx: CardanoWASM.Transaction
			if (this._isHydra) {
				// Xây dựng tx không kiểm tra cân bằng input/output vì có thể là blueprint tx
				// Chỉ hỗ trợ cho Hydra
				// VI: Hydra cần build tx không kiểm tra cân bằng input/output vì có thể là blueprint tx
				// Chứ không phải tx thật
				// Nên không cần thiết phải có change address
				// Cũng không cần thiết phải đủ ADA để cover fee
				// Vì tx này sẽ được hoàn thiện (complete) bởi Hydra head
				// Khi đó mới cần đủ ADA để cover fee và cân bằng input/output
				tx = await this._txBuilder.build_tx_unsafe()
			} else {
				tx = await this._txBuilder.build_tx()
			}
			this._verbose && console.log('[🛠️][TxBuilder] [Tx]: ', safeStringify(tx.body().to_js_value()))
			this._verbose && console.log('[🛠️][TxBuilder] [Tx Redeemer witness_set]: ', tx.witness_set().redeemers()?.to_json())
			this._verbose && console.log('[🛠️][TxBuilder] [Tx inputs ]: ', safeStringify(tx.body().inputs().to_js_value()))
			return tx
		} catch (error) {
			this._errorLogger && console.error('[error][TxBuilder][build_tx]: ', error)
			throw error
		} finally {
			// Deterministically free every transient WASM object allocated during
			// this build. build_tx() has already consumed them, and the returned
			// Transaction is an independent Rust struct, so this is always safe.
			this._freeScratch()
		}
	}

	/**
	 * Build the transaction and return its CBOR hex, freeing the intermediate
	 * Transaction object immediately. This is the leak-free path for high-volume
	 * workloads where you only need the serialized bytes — prefer it over
	 * `complete()` + `.to_hex()`, which leaves the caller responsible for calling
	 * `.free()` on the returned Transaction.
	 */
	async completeCbor(): Promise<string> {
		const tx = await this.complete()
		try {
			return tx.to_hex()
		} finally {
			try {
				tx.free()
			} catch {
				/* ignore */
			}
		}
	}

	/**
	 * Get transaction hex string
	 */
	get txHex(): string {
		// This would be called after complete() in a real implementation
		throw new Error('Call complete() first to build the transaction')
	}

	/**
	 * Get the underlying CardanoWASM transaction builder
	 */
	get txBuilder(): CardanoWASM.TransactionBuilder {
		return this._txBuilder
	}

	/**
	 * Reset the transaction builder to initial state
	 */
	reset(): TxBuilder {
		this._inputs = []
		this._outputs = []
		this._collaterals = []
		this._referenceInputs = []
		this._mints = []
		this._certificates = []
		this._withdrawals = []
		this._requiredSigners = []
		// Free every WASM object held from the previous build before dropping the
		// references, then recreate the ones we still need.
		const freeSafe = (o?: { free(): void } | null) => {
			try {
				o?.free()
			} catch {
				/* ignore */
			}
		}
		this._freeScratch()
		freeSafe(this._metadata)
		freeSafe(this._plutusScripts)
		freeSafe(this._changeConfig)
		freeSafe(this._txBuilder)
		this._metadata = CardanoWASM.GeneralTransactionMetadata.new()
		this._validityRange = undefined
		this._changeAddress = undefined
		this._changeConfig = null
		this._totalCollateral = undefined
		this._collateralReturn = undefined
		this._auxiliaryDataHash = undefined
		this._plutusScripts = null

		// Recreate the transaction builder
		this._txBuilder = TxBuilder.getTxBuilder(this._protocolParams)

		return this
	}

	// ============================================================================
	// Private Helper Methods
	// ============================================================================

	/**
	 * Add output to the CardanoWASM transaction builder
	 */
	private _addOutputToBuilder(output: TxOutput): void {
		const shelleyOutputAddress = this._track(CardanoWASM.Address.from_bech32(output.address))
		const lovelaceSend = output.amount.find(el => el.unit === 'lovelace')?.quantity || '0'
		const lovelaceBigNum = this._track(CardanoWASM.BigNum.from_str(lovelaceSend))

		const withAssets = output.amount.filter(el => el.unit !== 'lovelace')

		let txOutput: CardanoWASM.TransactionOutput
		if (withAssets.length > 0) {
			const multiAsset = this._track(CardanoWASM.MultiAsset.new())
			const policyIds = new Map<string, Map<string, bigint>>()
			for (const asset of withAssets) {
				const { policyId, assetName } = Deserializer.deserializeAssetUnit(asset.unit)
				if (!policyIds.has(policyId)) {
					policyIds.set(policyId, new Map<string, bigint>())
				}
				if (!policyIds.get(policyId)!.has(assetName)) {
					policyIds.get(policyId)!.set(assetName, BigInt(0))
				}
				const currentQty = policyIds.get(policyId)!.get(assetName)!
				policyIds.get(policyId)!.set(assetName, currentQty + BigInt(asset.quantity))
			}
			policyIds.forEach((assetNames, policyId) => {
				const outputPolicyId = this._track(CardanoWASM.ScriptHash.from_hex(policyId))
				const outputAssets = this._track(CardanoWASM.Assets.new())

				assetNames.forEach((quantity, assetName) => {
					const outputAssetName = this._track(CardanoWASM.AssetName.new(ParserUtils.hexToBytes(assetName)))
					outputAssets.insert(outputAssetName, this._track(CardanoWASM.BigNum.from_str(quantity.toString())))
				})
				multiAsset.insert(outputPolicyId, outputAssets)
			})
			txOutput = this._track(
				CardanoWASM.TransactionOutput.new(
					shelleyOutputAddress,
					this._track(CardanoWASM.Value.new_with_assets(lovelaceBigNum, multiAsset))
				)
			)
		} else {
			txOutput = this._track(
				CardanoWASM.TransactionOutput.new(shelleyOutputAddress, this._track(CardanoWASM.Value.new(lovelaceBigNum)))
			)
		}
		// Add datum if present
		if (output?.inlineDatum && output?.datum) {
			this._errorLogger && console.error('Cannot use both inlineDatum and datumHash. Trace: ', output)
			throw new Error('Cannot use both inlineDatum and datumHash')
		}
		if (output?.inlineDatum) {
			this._verbose && console.log('[🛠️][TxBuilder] [Output inlineDatum]: ', output.inlineDatum)
			// output.inlineDatum is caller-owned — do NOT free it
			txOutput.set_plutus_data(output.inlineDatum)
		}
		if (output?.datum) {
			// output.datum is caller-owned — only the hash objects we derive are tracked
			const datumHash = this._track(CardanoWASM.hash_plutus_data(output.datum)).to_hex()
			txOutput.set_data_hash(this._track(CardanoWASM.DataHash.from_hex(datumHash)))
		}
		// Add script reference if present
		if (output?.scriptRef) {
			// txOutput.set_script_ref(CardanoWASM.ScriptRef.from_json(''))
			let plutusVersion: CardanoWASM.Language
			if (output.scriptRef.version === 'V2') {
				plutusVersion = this._track(CardanoWASM.Language.new_plutus_v2())
			} else if (output.scriptRef.version === 'V3') {
				plutusVersion = this._track(CardanoWASM.Language.new_plutus_v3())
			} else if (output.scriptRef.version === 'V1') {
				plutusVersion = this._track(CardanoWASM.Language.new_plutus_v1())
			} else {
				throw new Error(`Unsupported Plutus version: ${output.scriptRef.version}`)
			}
			this._verbose && console.log('[🛠️][TxBuilder] [Output scriptRef]: ', output.scriptRef)
			const plutusScript = this._track(
				CardanoWASM.PlutusScript.from_hex_with_version(output.scriptRef.scriptCbor, plutusVersion)
			)
			const scriptRef = this._track(CardanoWASM.ScriptRef.new_plutus_script(plutusScript))
			txOutput.set_script_ref(scriptRef)
			this._verbose && console.log('[🛠️][TxBuilder] [Output has scriptRef]: ', txOutput.has_script_ref())
		}
		this._txBuilder.add_output(txOutput)
		this._verbose && console.log('[🛠️][TxBuilder] [Output]: ', txOutput.to_json())
	}

	private _addInputsToBuilder(inputs: TxIn[], strategy: CoinSelectionStrategy = 'LargestFirstMultiAsset'): void {
		const scriptInputs = inputs.filter(input => input.scriptRef || input.datum || input.redeemer || input.inlineDatum)
		const normalInputs = inputs.filter(input => !input.scriptRef && !input.datum && !input.redeemer && !input.inlineDatum)
		const rawUTxOs: UTxO[] = normalInputs.map(input => {
			return {
				input: {
					outputIndex: input.outputIndex,
					txHash: input.txHash
				},
				output: {
					address: input.address!,
					amount: input.amount!,
					datum: input.datum ? input.datum : undefined,
					inlineDatum: input.inlineDatum ? input.inlineDatum : undefined
				}
			}
		})

		scriptInputs.forEach((scriptInput, index) => {
			const { txInput, txOutput } = this.buildSimpleUtxo({
				input: {
					outputIndex: scriptInput.outputIndex,
					txHash: scriptInput.txHash
				},
				output: {
					address: scriptInput.address!,
					amount: scriptInput.amount!
				}
			})

			// NOTE: Nếu input chứa inlineDatum thì không cần set data hash
			if (scriptInput.datum) {
				// scriptInput.datum is caller-owned — the derived hash is tracked
				const datumHash = this._track(CardanoWASM.hash_plutus_data(scriptInput.datum))
				txOutput.set_data_hash(datumHash)
			}

			// PlutusScripts.get() returns a fresh clone — track it. Caller-supplied
			// datum/redeemer are NOT tracked; the fallback emptyRedeemer() is.
			const witnessScript = this._track(this._plutusScripts?.get(index)!)
			const redeemer = scriptInput.redeemer || this._track(emptyRedeemer({ type: 'constr' }))
			let plutusWitness: CardanoWASM.PlutusWitness | null = null
			if (scriptInput.datum) {
				const datum = scriptInput.datum
				plutusWitness = this._track(CardanoWASM.PlutusWitness.new(witnessScript, datum!, redeemer))
				this._verbose && console.log('[🛠️][TxBuilder] [PlutusWitness] [with datum]: ', datum.to_hex())
			} else {
				/**
				 * NOTE: Nếu dùng inlineDatum thì cũng không cần inject datum vào witness
				 */
				plutusWitness = this._track(CardanoWASM.PlutusWitness.new_without_datum(witnessScript, redeemer))
				this._verbose && console.log('[🛠️][TxBuilder] [PlutusWitness] [without datum]: ', plutusWitness)
			}
			this._txBuilder.add_plutus_script_input(plutusWitness, txInput, this._track(txOutput.amount()))
		})
		// Recalculate script data hash if there are script inputs
		const recalculateScriptDataHash = scriptInputs.length > 0 || this._mints.length > 0
		if (recalculateScriptDataHash) {
			const costMdls = this._buildCostModels()
			this._txBuilder.remove_script_data_hash()
			this._txBuilder.calc_script_data_hash(costMdls)
		}
		this.selectUtxosFrom(rawUTxOs, strategy, { recalculateScriptDataHash })
	}

	private _addReferenceInputsToBuilder(referenceInputs: TxIn[]): void {
		referenceInputs.forEach(refInput => {
			const txInput = this._track(
				CardanoWASM.TransactionInput.new(
					this._track(CardanoWASM.TransactionHash.from_hex(refInput.txHash)),
					refInput.outputIndex
				)
			)
			this._txBuilder.add_reference_input(txInput)
		})
	}

	/**
	 * Add collateral to the CardanoWASM transaction builder
	 */
	private _addCollateralToBuilder(collateral: CollateralInput): void {
		if (this._verbose) {
			console.log('Adding collateral:', collateral.txHash, collateral.outputIndex)
		}
		const collateralTxIn = this._track(
			CardanoWASM.TransactionInput.new(
				this._track(CardanoWASM.TransactionHash.from_hex(collateral.txHash)),
				collateral.outputIndex
			)
		)
		// Reject collateral if it has assets
		if (collateral.amount.length > 1 || (collateral.amount.length === 1 && collateral.amount[0].unit !== 'lovelace')) {
			throw new Error('Collateral UTxO must contain only lovelace')
		}
		const lovelace = collateral.amount.find(el => el.unit === 'lovelace')?.quantity || '0'
		const collateralValue = this._track(CardanoWASM.Value.new(this._track(CardanoWASM.BigNum.from_str(String(lovelace)))))
		const collateralAddress = this._track(CardanoWASM.Address.from_bech32(collateral.address))
		const collateralUTxO = this._track(
			CardanoWASM.TransactionUnspentOutput.new(
				collateralTxIn,
				this._track(CardanoWASM.TransactionOutput.new(collateralAddress, collateralValue))
			)
		)

		const collateralOutput = this._track(CardanoWASM.TxInputsBuilder.new())
		collateralOutput.add_regular_utxo(collateralUTxO)
		this._txBuilder.set_collateral(collateralOutput)
	}

	/**
	 * Add mint to the CardanoWASM transaction builder
	 */
	private _addMintToBuilder(_mint: MintAsset): void {
		try {
			let mintBuilder = this._txBuilder.get_mint_builder()
			if (!mintBuilder) {
				mintBuilder = CardanoWASM.MintBuilder.new()
			}

			let mintPolicyScript: CardanoWASM.PlutusScript | CardanoWASM.NativeScript
			if (!_mint.policyScript) {
				throw new Error('Mint policy script is required')
			}
			if (_mint.policyScript?.type === 'PlutusV1') {
				mintPolicyScript = this._track(CardanoWASM.PlutusScript.from_bytes(ParserUtils.hexToBytes(_mint.policyScript.scriptCborHex)))
			} else if (_mint.policyScript?.type === 'PlutusV2') {
				mintPolicyScript = this._track(CardanoWASM.PlutusScript.from_bytes_v2(ParserUtils.hexToBytes(_mint.policyScript.scriptCborHex)))
			} else if (_mint.policyScript?.type === 'PlutusV3') {
				mintPolicyScript = this._track(CardanoWASM.PlutusScript.from_bytes_v3(ParserUtils.hexToBytes(_mint.policyScript.scriptCborHex)))
			} else if (_mint.policyScript?.type === 'Native') {
				mintPolicyScript = this._track(CardanoWASM.NativeScript.from_hex(_mint.policyScript.scriptCborHex))
			} else {
				throw new Error('Unsupported mint policy script version')
			}
			const scriptHash = this._track(mintPolicyScript.hash()).to_hex()
			if (scriptHash !== _mint.policyId) {
				throw new Error(`Mint policy ID does not match script hash. Expected ${_mint.policyId}, got ${scriptHash}`)
			}

			// _mint.redeemer is caller-owned — the fallback emptyRedeemer() is tracked
			let mintWitness: CardanoWASM.MintWitness
			if (mintPolicyScript instanceof CardanoWASM.PlutusScript) {
				mintWitness = this._track(
					CardanoWASM.MintWitness.new_plutus_script(
						this._track(CardanoWASM.PlutusScriptSource.new(mintPolicyScript)),
						_mint.redeemer || this._track(emptyRedeemer({ type: 'constr', tag: 'MINT' }))
					)
				)
			} else if (mintPolicyScript instanceof CardanoWASM.NativeScript) {
				const scriptSrc = this._track(CardanoWASM.NativeScriptSource.new(mintPolicyScript))
				mintWitness = this._track(CardanoWASM.MintWitness.new_native_script(scriptSrc))
			} else {
				throw new Error('Unsupported mint policy script type')
			}

			mintBuilder.add_asset(
				mintWitness,
				this._track(CardanoWASM.AssetName.new(ParserUtils.toBytes(_mint.assetName))),
				this._track(CardanoWASM.Int.from_str(_mint.quantity.toString()))
			)
			this._txBuilder.set_mint_builder(mintBuilder)
		} catch (error) {
			if (this._verbose) {
				console.warn('Failed to add mint:', error)
			}
			throw error
		}
	}

	/**
	 * Build all staged certificates into a single Certificates set and attach it to
	 * the transaction builder. Called once during complete().
	 */
	private _addCertificatesToBuilder(): void {
		if (!this._certificates.length) return
		const certs = this._track(CardanoWASM.Certificates.new())
		for (const cert of this._certificates) {
			certs.add(this._buildCertificate(cert))
		}
		if (certs.len() > 0) {
			this._txBuilder.set_certs(certs)
		}
	}

	/**
	 * Convert a staged Certificate descriptor into a CardanoWASM Certificate.
	 * The stake credential is resolved from the bech32 reward (stake) address.
	 */
	private _buildCertificate(cert: Certificate): CardanoWASM.Certificate {
		const resolveCredential = (rewardAddress?: string): CardanoWASM.Credential => {
			if (!rewardAddress) {
				throw new Error(`Certificate ${cert.type} requires a rewardAddress`)
			}
			const address = this._track(CardanoWASM.Address.from_bech32(rewardAddress))
			const reward = CardanoWASM.RewardAddress.from_address(address)
			if (!reward) {
				throw new Error(`Invalid reward address for ${cert.type}: ${rewardAddress}`)
			}
			this._track(reward)
			return this._track(reward.payment_cred())
		}

		switch (cert.type) {
			case 'StakeRegistration': {
				const credential = resolveCredential(cert.rewardAddress)
				const registration = this._track(CardanoWASM.StakeRegistration.new(credential))
				return this._track(CardanoWASM.Certificate.new_stake_registration(registration))
			}
			case 'StakeDeregistration': {
				const credential = resolveCredential(cert.rewardAddress)
				const deregistration = this._track(CardanoWASM.StakeDeregistration.new(credential))
				return this._track(CardanoWASM.Certificate.new_stake_deregistration(deregistration))
			}
			case 'StakeDelegation': {
				if (!cert.poolKeyHash) {
					throw new Error('StakeDelegation requires a poolKeyHash')
				}
				const credential = resolveCredential(cert.rewardAddress)
				const poolKeyHash = this._track(CardanoWASM.Ed25519KeyHash.from_hex(cert.poolKeyHash))
				const delegation = this._track(CardanoWASM.StakeDelegation.new(credential, poolKeyHash))
				return this._track(CardanoWASM.Certificate.new_stake_delegation(delegation))
			}
			case 'PoolRegistration':
			case 'PoolRetirement':
				throw new Error(`Certificate type not supported yet: ${cert.type}`)
			default:
				throw new Error(`Unknown certificate type: ${(cert as Certificate).type}`)
		}
	}

	/**
	 * Add withdrawal to the CardanoWASM transaction builder
	 */
	private _addWithdrawalToBuilder(withdrawal: Withdrawal): void {
		try {
			const rewardAddress = CardanoWASM.RewardAddress.from_address(
				this._track(CardanoWASM.Address.from_bech32(withdrawal.rewardAddress))
			)
			const amount = this._track(CardanoWASM.BigNum.from_str(withdrawal.amount))

			if (rewardAddress) {
				this._track(rewardAddress)
				// Use the correct method name for withdrawals
				const withdrawals = this._track(CardanoWASM.Withdrawals.new())
				withdrawals.insert(rewardAddress, amount)
				this._txBuilder.set_withdrawals(withdrawals)
			}
		} catch (error) {
			if (this._verbose) {
				console.warn('Failed to add withdrawal:', error)
			}
		}
	}

	/**
	 * Set validity range on the transaction builder
	 */
	private _setValidityRange(): void {
		if (this._validityRange?.invalidBefore) {
			this._txBuilder.set_validity_start_interval_bignum(
				this._track(CardanoWASM.BigNum.from_str(this._validityRange.invalidBefore.toString()))
			)
		}
		if (this._validityRange?.invalidAfter) {
			this._txBuilder.set_ttl_bignum(
				this._track(CardanoWASM.BigNum.from_str(this._validityRange.invalidAfter.toString())) //
			)
		}
	}

	/**
	 * Add required signer to the transaction builder
	 */
	private _addRequiredSigner(pubKeyHash: string): void {
		const keyHash = this._track(CardanoWASM.Ed25519KeyHash.from_hex(pubKeyHash))
		this._txBuilder.add_required_signer(keyHash)
	}

	/**
	 * Add metadata to the transaction builder
	 */
	private _addMetadata(): void {
		if (!this._metadata) return
		this._txBuilder.set_metadata(this._metadata)
	}

	private _buildCostModels() {
		// NOTE: defaultCostModels is a shared module-level singleton — must NOT be
		// tracked/freed here, otherwise later builds would hit a freed pointer.
		return CostModels.defaultCostModels
	}

	// ============================================================================
	// WASM memory management
	// ============================================================================

	/**
	 * Register a transient WASM object allocated internally during a build so it
	 * can be freed deterministically once build_tx() has consumed it. Returns the
	 * same object for convenient inline wrapping.
	 */
	private _track<T extends { free(): void }>(obj: T): T {
		this._scratch.push(obj)
		return obj
	}

	/**
	 * Free every tracked transient WASM object. Safe to call multiple times and
	 * safe against objects already consumed/freed by CSL (their pointer is 0, so
	 * free() is a no-op). Freed in reverse allocation order.
	 */
	private _freeScratch(): void {
		for (let i = this._scratch.length - 1; i >= 0; i--) {
			try {
				this._scratch[i].free()
			} catch {
				// already freed or consumed by a CSL ownership-taking call — ignore
			}
		}
		this._scratch = []
	}

	/**
	 * Release all WASM memory held by this builder (the underlying
	 * TransactionBuilder plus builder-lifetime state: metadata, plutus scripts,
	 * change config). Call this once you are done with the builder — especially in
	 * high-volume/spike workloads — instead of relying on the GC/FinalizationRegistry.
	 *
	 * After dispose() the builder must not be used again.
	 */
	dispose(): void {
		if (this._disposed) return
		this._freeScratch()
		const freeSafe = (o?: { free(): void } | null) => {
			try {
				o?.free()
			} catch {
				/* ignore */
			}
		}
		freeSafe(this._txBuilder)
		freeSafe(this._metadata)
		freeSafe(this._plutusScripts)
		freeSafe(this._changeConfig)
		this._plutusScripts = null
		this._changeConfig = null
		this._disposed = true
	}

	/** Allow `using tx = new TxBuilder(...)` (TS 5.2+/Node 20+ explicit resource management). */
	[Symbol.dispose](): void {
		this.dispose()
	}

	static getTxBuilder(pp: Protocol) {
		// config tx builder
		const scratch: Array<{ free(): void }> = []
		const keep = <T extends { free(): void }>(o: T): T => (scratch.push(o), o)
		const linearFee = keep(
			CardanoWASM.LinearFee.new(
				keep(CardanoWASM.BigNum.from_str(pp.minFeeA.toString())),
				keep(CardanoWASM.BigNum.from_str(pp.minFeeB.toString()))
			)
		)
		// Script execution unit prices — sourced from protocol params, NOT hardcoded
		// to zero. With zero prices CSL omits the script-execution component of the
		// fee (priceMem·exMem + priceStep·exSteps), under-funding every script tx.
		// Cardano prices are decimals (e.g. priceMem 0.0577, priceStep 0.0000721);
		// convert to the exact rational CSL expects. Denominator 1e9 covers the
		// precision of real protocol values without loss.
		const priceToRational = (value: number) => {
			const denominator = 1_000_000_000
			return { numerator: Math.round(value * denominator).toString(), denominator: denominator.toString() }
		}
		const exUnitPrices = keep(
			CardanoWASM.ExUnitPrices.from_json(
				JSON.stringify({
					mem_price: priceToRational(pp.priceMem),
					step_price: priceToRational(pp.priceStep)
				})
			)
		)
		// NOTE: The config-builder is immutable — every chained call returns a NEW
		// TransactionBuilderConfigBuilder and orphans the previous one, and each
		// value passed in (LinearFee/BigNum/…) is cloned by CSL. Un-chain the calls
		// so we can capture and free every intermediate; only the returned
		// TransactionBuilder survives (it clones the config, so `cfg` is freed too).
		try {
			const cb0 = keep(CardanoWASM.TransactionBuilderConfigBuilder.new())
			const cb1 = keep(cb0.fee_algo(linearFee))
			const cb2 = keep(cb1.pool_deposit(keep(CardanoWASM.BigNum.from_str(pp.poolDeposit.toString())))) // stakePoolDeposit
			const cb3 = keep(cb2.key_deposit(keep(CardanoWASM.BigNum.from_str(pp.keyDeposit.toString())))) // stakeAddressDeposit
			const cb4 = keep(cb3.max_value_size(pp.maxValSize)) // maxValueSize
			const cb5 = keep(cb4.max_tx_size(pp.maxTxSize)) // maxTxSize
			const cb6 = keep(cb5.ex_unit_prices(exUnitPrices))
			const cb7 = keep(cb6.coins_per_utxo_byte(keep(CardanoWASM.BigNum.from_str(pp.coinsPerUtxoSize.toString()))))
			const cb8 = keep(
				cb7.ref_script_coins_per_byte(
					keep(
						CardanoWASM.UnitInterval.new(
							keep(CardanoWASM.BigNum.from_str(pp.minFeeRefScriptCostPerByte.toString())),
							keep(CardanoWASM.BigNum.from_str('1'))
						)
					)
				)
			)
			const txBuilderCfg = keep(cb8.build())
			const txBuilder = CardanoWASM.TransactionBuilder.new(txBuilderCfg)
			return txBuilder
		} finally {
			for (let i = scratch.length - 1; i >= 0; i--) {
				try {
					scratch[i].free()
				} catch {
					/* ignore */
				}
			}
		}
	}
}

// ============================================================================
// Export Enhanced Transaction Builder
// ============================================================================

/**
 * Enhanced Transaction Builder inspired by Mesh SDK patterns
 *
 * This transaction builder provides a fluent API similar to Mesh SDK's MeshTxBuilder
 * but uses your custom interfaces and CardanoWASM directly.
 *
 * Key Features:
 * - Fluent API with method chaining
 * - Support for Plutus scripts (V1, V2, V3)
 * - Comprehensive transaction building (inputs, outputs, mints, certificates, etc.)
 * - Datum and redeemer handling
 * - Collateral management
 * - Metadata support
 * - Validity range configuration
 * - Required signers
 * - Backward compatibility with existing methods
 *
 * Usage Examples:
 *
 * // Basic transaction
 * const txBuilder = new TxBuilder({ fetcher, submitter })
 * const tx = await txBuilder
 *   .txOut(recipientAddress, [{ unit: 'lovelace', quantity: '1000000' }])
 *   .selectUtxosFrom(utxos)
 *   .changeAddress(senderAddress)
 *   .complete()
 *
 * // Smart contract interaction
 * const tx = await txBuilder
 *   .txIn(scriptUtxo.txHash, scriptUtxo.outputIndex, scriptUtxo.amount, scriptUtxo.address)
 *   .txInScript(scriptCbor)
 *   .txInDatumValue(datum)
 *   .txInRedeemerValue(redeemer)
 *   .spendingPlutusScript('V3')
 *   .txInCollateral(collateralTxHash, collateralIndex, collateralAmount, collateralAddress)
 *   .requiredSignerHash(signerPubKeyHash)
 *   .changeAddress(changeAddress)
 *   .complete()
 *
 * // Minting tokens
 * const tx = await txBuilder
 *   .mint('1000', policyId, assetName)
 *   .mintingScript(mintingScriptCbor)
 *   .mintRedeemerValue(mintRedeemer)
 *   .txOut(recipientAddress, [{ unit: policyId + assetName, quantity: '1000' }])
 *   .selectUtxosFrom(utxos)
 *   .changeAddress(senderAddress)
 *   .complete()
 */
// Default export
export default TxBuilder
