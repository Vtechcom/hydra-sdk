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
	LanguageVersion
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
	PolicyScript
} from '../types'
import { metadataObjToMetadatum } from '../utils/metadata'
import { safeStringify } from '../utils/bigint.utils'
import { emptyRedeemer } from '../utils/redeemer-builder'

export class TxBuilder {
	protected _protocolParams: Protocol = DEFAULT_PROTOCOL_PARAMETERS
	protected _txBuilder: CardanoWASM.TransactionBuilder
	protected _fetcher?: IFetcher
	protected _submitter?: ISubmitter
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
	protected _scriptDataHash?: string
	protected _auxiliaryDataHash?: string

	protected _selectionStrategy: CoinSelectionStrategy = 'LargestFirstMultiAsset'

	// Script context
	protected _plutusScripts: CardanoWASM.PlutusScripts | null = null
	protected _nativeScripts: Map<string, string> = new Map()

	constructor(options: TxBuilderOptions = {}) {
		const { params, fetcher, submitter, isHydra = false, verbose = false, errorLogger = false } = options

		this._fetcher = fetcher
		this._submitter = submitter
		this._isHydra = isHydra
		this._verbose = verbose
		this._errorLogger = errorLogger

		if (params) {
			this.updateProtocolParams(params)
		}
		this._txBuilder = TxBuilder.getTxBuilder(this._protocolParams)
	}

	updateProtocolParams(params: Partial<Protocol>) {
		this._protocolParams = { ...this._protocolParams, ...params }
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
			const wasmUtxos = CardanoWASM.TransactionUnspentOutputs.new()
			simpleUTxOs.forEach(utxo => {
				const { txInput, txOutput } = this.buildSimpleUtxo(utxo)

				if (utxo.output.datum) {
					const txHash = CardanoWASM.hash_plutus_data(utxo.output.datum)
					txOutput.set_data_hash(txHash)
				}

				// NOTE: Nếu input chứa inlineDatum thì không cần set data hash
				const transactionUnspendOutput = CardanoWASM.TransactionUnspentOutput.new(txInput, txOutput)
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
						CardanoWASM.TransactionOutput.new(
							CardanoWASM.Address.from_bech32(this._collateralReturn.address),
							CardanoWASM.Value.new(
								CardanoWASM.BigNum.from_str(this._collateralReturn.amount.find(a => a.unit === 'lovelace')?.quantity || '0')
							)
						)
					)
					if (this._changeConfig) {
						this._txBuilder.add_inputs_from_and_change_with_collateral_return(
							wasmUtxos,
							COIN_SELECTION_STRATEGY[strategy],
							this._changeConfig,
							CardanoWASM.BigNum.from_str(String(this._protocolParams.collateralPercent || 150))
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

		const txOutMultiAsset = CardanoWASM.MultiAsset.new()
		for (const policyId in multiAsset) {
			const assets = CardanoWASM.Assets.new()
			for (const assetName in multiAsset[policyId]) {
				assets.insert(
					CardanoWASM.AssetName.new(ParserUtils.hexToBytes(assetName)),
					CardanoWASM.BigNum.from_str(multiAsset[policyId][assetName])
				)
			}
			txOutMultiAsset.insert(CardanoWASM.ScriptHash.from_hex(policyId), assets)
		}

		const txOutValue = CardanoWASM.Value.new(CardanoWASM.BigNum.from_str(lovelace))
		withAssets.length && txOutValue.set_multiasset(txOutMultiAsset)
		const txOutput = CardanoWASM.TransactionOutput.new(CardanoWASM.Address.from_bech32(utxo.output.address), txOutValue)
		const txInput = CardanoWASM.TransactionInput.new(
			CardanoWASM.TransactionHash.from_hex(utxo.input.txHash),
			utxo.input.outputIndex
		)
		if (options.withDatum && utxo.output.datum) {
			const datumHash = CardanoWASM.hash_plutus_data(utxo.output.datum).to_hex()
			txOutput.set_data_hash(CardanoWASM.DataHash.from_hex(datumHash))
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
	 * Mint assets with native script
	 */
	mintPlutusScript(version: LanguageVersion): TxBuilder {
		// This sets the context for the next mint operation
		console.log('mintPlutusScript: ', version)
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
			const _label = CardanoWASM.BigNum.from_str(label.toString())
			const _value = metadataObjToMetadatum(value)
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
		this._changeConfig = CardanoWASM.ChangeConfig.new(CardanoWASM.Address.from_bech32(address))
		return this
	}

	/**
	 * Calculate minimum fee
	 */
	calculateFee(): CardanoWASM.BigNum {
		// Build a temporary transaction to get accurate fee calculation

		// const tempBuilder = this._txBuilder

		// console.log('>>> / this._txBuilder.min_fee():', this._txBuilder.min_fee().to_str())

		// // this.txBuilder.set_fee(CardanoWASM.BigNum.from_str('1000000')) // Set a temporary fee
		// const tx = this.prepare()
		// const linearFee = CardanoWASM.LinearFee.new(
		// 	CardanoWASM.BigNum.from_str(this._protocolParams.minFeeA.toString()),
		// 	CardanoWASM.BigNum.from_str(this._protocolParams.minFeeB.toString())
		// )
		// console.log('fee', tx.body().fee().to_str())
		// const minFee = CardanoWASM.min_fee(tx, linearFee)
		// console.log('>>> / minFee:', minFee.to_str())

		//
		// this._txBuilder = tempBuilder
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
	 * Build and complete the transaction
	 */
	async complete(): Promise<CardanoWASM.Transaction> {
		// Add all outputs to the transaction builder
		for (const output of this._outputs) {
			this._addOutputToBuilder(output)
		}

		// Add collaterals
		for (const collateral of this._collaterals) {
			this._addCollateralToBuilder(collateral)
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
		for (const cert of this._certificates) {
			this._addCertificateToBuilder(cert)
		}

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

		// Add auxiliary data if present
		let auxiliaryData: CardanoWASM.AuxiliaryData | undefined
		if (this._metadata.len() || this._auxiliaryDataHash) {
			auxiliaryData = CardanoWASM.AuxiliaryData.new()
			// TODO: Add metadata and auxiliary data handling
			this._metadata.len() && auxiliaryData.set_metadata(this._metadata)
		}

		// const txWitnessSet = CardanoWASM.TransactionWitnessSet.new()
		// if (this._plutusScripts && this._plutusScripts.len()) {
		// 	this._verbose && console.log('[🛠️][TxBuilder] [txWitnessSet PlutusScripts]: ', this._plutusScripts.to_js_value())
		// 	txWitnessSet.set_plutus_scripts(this._plutusScripts)

		// 	auxiliaryData = auxiliaryData || CardanoWASM.AuxiliaryData.new()
		// 	auxiliaryData.set_plutus_scripts(this._plutusScripts)
		// }

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
		this._metadata.free()
		this._validityRange = undefined
		this._changeAddress = undefined
		this._totalCollateral = undefined
		this._collateralReturn = undefined
		this._scriptDataHash = undefined
		this._auxiliaryDataHash = undefined
		this._plutusScripts = null
		this._nativeScripts.clear()

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
		const shelleyOutputAddress = CardanoWASM.Address.from_bech32(output.address)
		const lovelaceSend = output.amount.find(el => el.unit === 'lovelace')?.quantity || '0'
		const lovelaceBigNum = CardanoWASM.BigNum.from_str(lovelaceSend)

		const withAssets = output.amount.filter(el => el.unit !== 'lovelace')

		let txOutput: CardanoWASM.TransactionOutput
		if (withAssets.length > 0) {
			const multiAsset = CardanoWASM.MultiAsset.new()
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
				const outputPolicyId = CardanoWASM.ScriptHash.from_hex(policyId)
				const outputAssets = CardanoWASM.Assets.new()

				assetNames.forEach((quantity, assetName) => {
					const outputAssetName = CardanoWASM.AssetName.new(ParserUtils.hexToBytes(assetName))
					outputAssets.insert(outputAssetName, CardanoWASM.BigNum.from_str(quantity.toString()))
				})
				multiAsset.insert(outputPolicyId, outputAssets)
			})
			txOutput = CardanoWASM.TransactionOutput.new(
				shelleyOutputAddress,
				CardanoWASM.Value.new_with_assets(lovelaceBigNum, multiAsset)
			)
		} else {
			txOutput = CardanoWASM.TransactionOutput.new(shelleyOutputAddress, CardanoWASM.Value.new(lovelaceBigNum))
		}
		// Add datum if present
		if (output?.inlineDatum && output?.datum) {
			console.error('Cannot use both inlineDatum and datumHash. Trace: ', output)
			throw new Error('Cannot use both inlineDatum and datumHash')
		}
		if (output?.inlineDatum) {
			this._verbose && console.log('[🛠️][TxBuilder] [Output inlineDatum]: ', output.inlineDatum)
			txOutput.set_plutus_data(output.inlineDatum)
		}
		if (output?.datum) {
			const datumHash = CardanoWASM.hash_plutus_data(output.datum).to_hex()
			txOutput.set_data_hash(CardanoWASM.DataHash.from_hex(datumHash))
		}
		// Add script reference if present
		if (output?.scriptRef) {
			// txOutput.set_script_ref(CardanoWASM.ScriptRef.from_json(''))
			let plutusVersion: CardanoWASM.Language
			if (output.scriptRef.version === 'V2') {
				plutusVersion = CardanoWASM.Language.new_plutus_v2()
			} else if (output.scriptRef.version === 'V3') {
				plutusVersion = CardanoWASM.Language.new_plutus_v3()
			} else if (output.scriptRef.version === 'V1') {
				plutusVersion = CardanoWASM.Language.new_plutus_v1()
			} else {
				throw new Error(`Unsupported Plutus version: ${output.scriptRef.version}`)
			}
			this._verbose && console.log('[🛠️][TxBuilder] [Output scriptRef]: ', output.scriptRef)
			const plutusScript = CardanoWASM.PlutusScript.from_hex_with_version(output.scriptRef.scriptCbor, plutusVersion)
			const scriptRef = CardanoWASM.ScriptRef.new_plutus_script(plutusScript)
			txOutput.set_script_ref(scriptRef)
			this._verbose && console.log('[🛠️][TxBuilder] [Output has scriptRef]: ', txOutput.has_script_ref())
		}
		this._txBuilder.add_output(txOutput)
		this._verbose && console.log('[🛠️][TxBuilder] [Output]: ', txOutput.to_json())
	}

	private _outputAmountToValue(amount: Asset[]): CardanoWASM.Value {
		const lovelace = amount.find(el => el.unit === 'lovelace')?.quantity || '0'
		const value = CardanoWASM.Value.new(CardanoWASM.BigNum.from_str(lovelace))
		const withAssets = amount.filter(el => el.unit !== 'lovelace')
		if (withAssets.length > 0) {
			const multiAsset = CardanoWASM.MultiAsset.new()
			for (const asset of withAssets) {
				const { policyId, assetName } = Deserializer.deserializeAssetUnit(asset.unit)

				const outputAssets = CardanoWASM.Assets.new()
				const outputAssetName = CardanoWASM.AssetName.new(ParserUtils.hexToBytes(assetName))
				const outputPolicyId = CardanoWASM.ScriptHash.from_hex(policyId)
				outputAssets.insert(outputAssetName, CardanoWASM.BigNum.from_str(asset.quantity))
				multiAsset.insert(outputPolicyId, outputAssets)
			}
			value.set_multiasset(multiAsset)
		}
		return value
	}

	/**
	 * Add input to the CardanoWASM transaction builder
	 * @deprecated
	 * @description it did not work correctly
	 */
	private _addInputToBuilder(input: TxIn): void {
		const txInput = CardanoWASM.TransactionInput.new(
			CardanoWASM.TransactionHash.from_hex(input.txHash),
			input.outputIndex
		)

		if (input.amount && input.address) {
			// Create value for the input
			const lovelace = input.amount.find(el => el.unit === 'lovelace')?.quantity || '0'
			const value = CardanoWASM.Value.new(CardanoWASM.BigNum.from_str(lovelace))

			// Add assets if present
			const withAssets = input.amount.filter(el => el.unit !== 'lovelace')
			if (withAssets.length > 0) {
				const multiAsset = CardanoWASM.MultiAsset.new()
				for (const asset of withAssets) {
					const _policyId = asset.unit.substring(0, 56)
					const _assetName = asset.unit.substring(56)

					const inputAssets = CardanoWASM.Assets.new()
					const inputAssetName = CardanoWASM.AssetName.new(ParserUtils.hexToBytes(_assetName))
					const inputPolicyId = CardanoWASM.ScriptHash.from_hex(_policyId)
					inputAssets.insert(inputAssetName, CardanoWASM.BigNum.from_str(asset.quantity))
					multiAsset.insert(inputPolicyId, inputAssets)
				}
				value.set_multiasset(multiAsset)
			}

			// Add the input with value
			this._txBuilder.add_key_input(
				CardanoWASM.Ed25519KeyHash.from_hex(input.address.substring(2, 58)), // Extract key hash from address
				txInput,
				value
			)
		} else {
			// Simple input without explicit value - use add_key_input with dummy values
			const dummyKeyHash = CardanoWASM.Ed25519KeyHash.from_hex('0'.repeat(56))
			this._txBuilder.add_key_input(dummyKeyHash, txInput, CardanoWASM.Value.new(CardanoWASM.BigNum.from_str('0')))
		}
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
				const datumHash = CardanoWASM.hash_plutus_data(scriptInput.datum)
				txOutput.set_data_hash(datumHash)
			}

			let plutusWitness: CardanoWASM.PlutusWitness | null = null
			if (scriptInput.datum) {
				const datum = scriptInput.datum
				plutusWitness = CardanoWASM.PlutusWitness.new(
					this._plutusScripts?.get(index)!,
					datum!,
					scriptInput.redeemer || emptyRedeemer({ type: 'constr' })
				)
				this._verbose && console.log('[🛠️][TxBuilder] [PlutusWitness] [with datum]: ', datum.to_hex())
			} else {
				/**
				 * NOTE: Nếu dùng inlineDatum thì cũng không cần inject datum vào witness
				 */
				plutusWitness = CardanoWASM.PlutusWitness.new_without_datum(
					this._plutusScripts?.get(index)!,
					scriptInput.redeemer || emptyRedeemer({ type: 'constr' })
				)
				this._verbose && console.log('[🛠️][TxBuilder] [PlutusWitness] [without datum]: ', plutusWitness)
			}
			this._txBuilder.add_plutus_script_input(plutusWitness, txInput, txOutput.amount())
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
			const txInput = CardanoWASM.TransactionInput.new(
				CardanoWASM.TransactionHash.from_hex(refInput.txHash),
				refInput.outputIndex
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
		const collateralTxIn = CardanoWASM.TransactionInput.new(
			CardanoWASM.TransactionHash.from_hex(collateral.txHash),
			collateral.outputIndex
		)
		// Reject collateral if it has assets
		if (collateral.amount.length > 1 || (collateral.amount.length === 1 && collateral.amount[0].unit !== 'lovelace')) {
			throw new Error('Collateral UTxO must contain only lovelace')
		}
		const lovelace = collateral.amount.find(el => el.unit === 'lovelace')?.quantity || '0'
		const collateralValue = CardanoWASM.Value.new(CardanoWASM.BigNum.from_str(String(lovelace)))
		const collateralAddress = CardanoWASM.Address.from_bech32(collateral.address)
		const collateralUTxO = CardanoWASM.TransactionUnspentOutput.new(
			collateralTxIn,
			CardanoWASM.TransactionOutput.new(collateralAddress, collateralValue)
		)

		const collateralOutput = CardanoWASM.TxInputsBuilder.new()
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
				mintPolicyScript = CardanoWASM.PlutusScript.from_bytes(ParserUtils.hexToBytes(_mint.policyScript.scriptCborHex))
			} else if (_mint.policyScript?.type === 'PlutusV2') {
				mintPolicyScript = CardanoWASM.PlutusScript.from_bytes_v2(ParserUtils.hexToBytes(_mint.policyScript.scriptCborHex))
			} else if (_mint.policyScript?.type === 'PlutusV3') {
				mintPolicyScript = CardanoWASM.PlutusScript.from_bytes_v3(ParserUtils.hexToBytes(_mint.policyScript.scriptCborHex))
			} else if (_mint.policyScript?.type === 'Native') {
				mintPolicyScript = CardanoWASM.NativeScript.from_hex(_mint.policyScript.scriptCborHex)
			} else {
				throw new Error('Unsupported mint policy script version')
			}
			const scriptHash = mintPolicyScript.hash().to_hex()
			if (scriptHash !== _mint.policyId) {
				throw new Error(`Mint policy ID does not match script hash. Expected ${_mint.policyId}, got ${scriptHash}`)
			}

			let mintWitness: CardanoWASM.MintWitness
			if (mintPolicyScript instanceof CardanoWASM.PlutusScript) {
				mintWitness = CardanoWASM.MintWitness.new_plutus_script(
					CardanoWASM.PlutusScriptSource.new(mintPolicyScript),
					_mint.redeemer || emptyRedeemer({ type: 'constr', tag: 'MINT' })
				)
			} else if (mintPolicyScript instanceof CardanoWASM.NativeScript) {
				const scriptSrc = CardanoWASM.NativeScriptSource.new(mintPolicyScript)
				mintWitness = CardanoWASM.MintWitness.new_native_script(scriptSrc)
			} else {
				throw new Error('Unsupported mint policy script type')
			}

			mintBuilder.add_asset(
				mintWitness,
				CardanoWASM.AssetName.new(ParserUtils.toBytes(_mint.assetName)),
				CardanoWASM.Int.from_str(_mint.quantity.toString())
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
	 * Add certificate to the CardanoWASM transaction builder
	 */
	private _addCertificateToBuilder(_cert: Certificate): void {
		// TODO: Implement certificate handling
		// This would involve creating appropriate certificate types based on cert.type
	}

	/**
	 * Add withdrawal to the CardanoWASM transaction builder
	 */
	private _addWithdrawalToBuilder(withdrawal: Withdrawal): void {
		try {
			const rewardAddress = CardanoWASM.RewardAddress.from_address(
				CardanoWASM.Address.from_bech32(withdrawal.rewardAddress)
			)
			const amount = CardanoWASM.BigNum.from_str(withdrawal.amount)

			if (rewardAddress) {
				// Use the correct method name for withdrawals
				const withdrawals = CardanoWASM.Withdrawals.new()
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
				CardanoWASM.BigNum.from_str(this._validityRange.invalidBefore.toString())
			)
		}
		if (this._validityRange?.invalidAfter) {
			this._txBuilder.set_ttl_bignum(
				CardanoWASM.BigNum.from_str(this._validityRange.invalidAfter.toString()) //
			)
		}
	}

	/**
	 * Add required signer to the transaction builder
	 */
	private _addRequiredSigner(pubKeyHash: string): void {
		const keyHash = CardanoWASM.Ed25519KeyHash.from_hex(pubKeyHash)
		this._txBuilder.add_required_signer(keyHash)
	}

	/**
	 * Add metadata to the transaction builder
	 */
	private _addMetadata(): void {
		if (!this._metadata) return

		// TODO: Implement proper metadata handling
		// This would involve converting the metadata object to CardanoWASM format
		this._txBuilder.set_metadata(this._metadata)
	}

	// TODO: Add plutus v2, v1 cost models
	private _buildCostModels() {
		const PlutusV3 = [
			100788, 420, 1, 1, 1000, 173, 0, 1, 1000, 59957, 4, 1, 11183, 32, 201305, 8356, 4, 16000, 100, 16000, 100, 16000,
			100, 16000, 100, 16000, 100, 16000, 100, 100, 100, 16000, 100, 94375, 32, 132994, 32, 61462, 4, 72010, 178, 0, 1,
			22151, 32, 91189, 769, 4, 2, 85848, 123203, 7305, -900, 1716, 549, 57, 85848, 0, 1, 1, 1000, 42921, 4, 2, 24548,
			29498, 38, 1, 898148, 27279, 1, 51775, 558, 1, 39184, 1000, 60594, 1, 141895, 32, 83150, 32, 15299, 32, 76049, 1,
			13169, 4, 22100, 10, 28999, 74, 1, 28999, 74, 1, 43285, 552, 1, 44749, 541, 1, 33852, 32, 68246, 32, 72362, 32, 7243,
			32, 7391, 32, 11546, 32, 85848, 123203, 7305, -900, 1716, 549, 57, 85848, 0, 1, 90434, 519, 0, 1, 74433, 32, 85848,
			123203, 7305, -900, 1716, 549, 57, 85848, 0, 1, 1, 85848, 123203, 7305, -900, 1716, 549, 57, 85848, 0, 1, 955506,
			213312, 0, 2, 270652, 22588, 4, 1457325, 64566, 4, 20467, 1, 4, 0, 141992, 32, 100788, 420, 1, 1, 81663, 32, 59498,
			32, 20142, 32, 24588, 32, 20744, 32, 25933, 32, 24623, 32, 43053543, 10, 53384111, 14333, 10, 43574283, 26308, 10,
			16000, 100, 16000, 100, 962335, 18, 2780678, 6, 442008, 1, 52538055, 3756, 18, 267929, 18, 76433006, 8868, 18,
			52948122, 18, 1995836, 36, 3227919, 12, 901022, 1, 166917843, 4307, 36, 284546, 36, 158221314, 26549, 36, 74698472,
			36, 333849714, 1, 254006273, 72, 2174038, 72, 2261318, 64571, 4, 207616, 8310, 4, 1293828, 28716, 63, 0, 1, 1006041,
			43623, 251, 0, 1, 100181, 726, 719, 0, 1, 100181, 726, 719, 0, 1, 100181, 726, 719, 0, 1, 107878, 680, 0, 1, 95336,
			1, 281145, 18848, 0, 1, 180194, 159, 1, 1, 158519, 8942, 0, 1, 159378, 8813, 0, 1, 107490, 3298, 1, 106057, 655, 1,
			1964219, 24520, 3
		]
		const costModel = CardanoWASM.CostModel.new()
		PlutusV3.forEach((val, i) => {
			costModel.set(i, CardanoWASM.Int.from_str(val.toString()))
		})
		const costmdls = CardanoWASM.Costmdls.new()
		costmdls.insert(CardanoWASM.Language.new_plutus_v3(), costModel)
		return costmdls
	}

	static getTxBuilder(pp: Protocol) {
		// config tx builder
		const linearFee = CardanoWASM.LinearFee.new(
			CardanoWASM.BigNum.from_str(pp.minFeeA.toString()),
			CardanoWASM.BigNum.from_str(pp.minFeeB.toString())
		)
		// config cost for script
		/**
		 * 
			"executionUnitPrices": {
				"priceMemory": 0,
				"priceSteps": 0
			}
			"maxTxExecutionUnits": {
				"memory": 14000000,
				"steps": 10000000000
			},
			"maxBlockExecutionUnits": {
				"memory": 62000000,
				"steps": 20000000000
			},
		*/
		const exUnitPrices = CardanoWASM.ExUnitPrices.from_json(
			JSON.stringify({
				mem_price: {
					numerator: '0',
					denominator: '1'
				},
				step_price: {
					numerator: '0',
					denominator: '1'
				}
			})
		)
		const txBuilderCfg = CardanoWASM.TransactionBuilderConfigBuilder.new()
			.fee_algo(linearFee)
			.pool_deposit(CardanoWASM.BigNum.from_str(pp.poolDeposit.toString())) // stakePoolDeposit
			.key_deposit(CardanoWASM.BigNum.from_str(pp.keyDeposit.toString())) // stakeAddressDeposit
			.max_value_size(pp.maxValSize) // maxValueSize
			.max_tx_size(pp.maxTxSize) // maxTxSize
			.ex_unit_prices(exUnitPrices)
			.coins_per_utxo_byte(CardanoWASM.BigNum.from_str(pp.coinsPerUtxoSize.toString()))
			.ref_script_coins_per_byte(
				CardanoWASM.UnitInterval.new(CardanoWASM.BigNum.from_str('15'), CardanoWASM.BigNum.from_str('1'))
			)
			.build()
		const txBuilder = CardanoWASM.TransactionBuilder.new(txBuilderCfg)
		return txBuilder
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
