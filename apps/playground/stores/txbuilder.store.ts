import {
	AppWallet,
	Deserializer,
	EmbeddedWallet,
	MetadataUtils,
	RedeemerUtils,
	Resolver,
	type Asset,
	type LanguageVersion,
	type UTxO
} from '@hydra-sdk/core'
import type { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { TxBuilder } from '@hydra-sdk/transaction'
import { toast } from 'vue-sonner'
import { createBlockfrostEvaluator } from '~/lib/evaluator'
import { createDefaultDraft, emptyOutput, uid, type MetadataDraft, type TxDraft } from '~/lib/tx-draft'
import { SAMPLE_ADDRESS, TX_PRESETS } from '~/lib/tx-fixtures'

export * from '~/lib/tx-draft'

export interface BuildSummary {
	fee: string
	size: number
	inputCount: number
	outputCount: number
	totalIn: string
	totalOut: string
	change: string
	/** Every amount across all outputs, merged by unit. */
	outputAmounts: Asset[]
}

interface DecodedOutput {
	amount?: { coin?: string; multiasset?: Record<string, Record<string, string>> | null }
}

/** Merge every amount across the decoded outputs by unit (`policyId + assetNameHex`). */
const collectOutputAmounts = (outputs: DecodedOutput[]): Asset[] => {
	const totals = new Map<string, bigint>()
	for (const output of outputs) {
		totals.set('lovelace', (totals.get('lovelace') ?? 0n) + BigInt(output.amount?.coin ?? 0))
		for (const [policyId, assets] of Object.entries(output.amount?.multiasset ?? {})) {
			for (const [assetName, quantity] of Object.entries(assets)) {
				const unit = `${policyId}${assetName}`
				totals.set(unit, (totals.get(unit) ?? 0n) + BigInt(quantity))
			}
		}
	}
	return [...totals.entries()].map(([unit, quantity]) => ({ unit, quantity: quantity.toString() }))
}


export const useTxBuilderStore = defineStore('txbuilder', () => {
	const mainStore = useMainStore()
	const providerStore = useProviderStore()
	const { networkInfo, walletPrvKeyHex } = storeToRefs(mainStore)

	/**
	 * The whole builder state lives in one persisted object: it makes schema
	 * versioning, "reset", presets and share-links a single operation each.
	 * `mergeDefaults` lets fields added in later versions appear on old drafts
	 * instead of coming back `undefined`.
	 */
	const draft = useLocalStorage<TxDraft>('hydra-playground.tx-draft.v1', createDefaultDraft(), { mergeDefaults: true })

	// ── Build / sign / submit results ──────────────────────────────────────────
	const building = ref(false)
	const buildError = ref('')
	const buildWarnings = ref<string[]>([])
	const cborHex = ref('')
	const txId = ref('')
	const txJson = ref('')
	const summary = ref<BuildSummary | null>(null)

	const signing = ref(false)
	const signError = ref('')
	const signedCborHex = ref('')
	const partialSign = ref(false)

	const submitting = ref(false)
	const submitError = ref('')
	const submittedTxId = ref('')

	const stage = computed<'draft' | 'built' | 'signed' | 'submitted'>(() => {
		if (submittedTxId.value) return 'submitted'
		if (signedCborHex.value) return 'signed'
		if (cborHex.value) return 'built'
		return 'draft'
	})

	// ── Derived input totals ───────────────────────────────────────────────────
	const totalInputLovelace = computed(() =>
		draft.value.inputs.reduce((acc, utxo) => acc + BigInt(utxo.output.amount.find(a => a.unit === 'lovelace')?.quantity || 0), 0n)
	)

	/** Distinct non-ADA units across the selected inputs — feeds the asset picker. */
	const availableAssets = computed(() => {
		const map = new Map<string, bigint>()
		for (const utxo of draft.value.inputs) {
			for (const asset of utxo.output.amount) {
				if (asset.unit === 'lovelace') continue
				map.set(asset.unit, (map.get(asset.unit) ?? 0n) + BigInt(asset.quantity || 0))
			}
		}
		return [...map.entries()].map(([unit, quantity]) => ({ unit, quantity: quantity.toString() }))
	})

	const totalOutputLovelace = computed(() =>
		draft.value.outputs.reduce((acc, out) => {
			const lovelace = out.amount.find(a => a.unit === 'lovelace')?.quantity
			return acc + (lovelace && !isNaN(Number(lovelace)) ? BigInt(lovelace) : 0n)
		}, 0n)
	)

	// ── Input actions ──────────────────────────────────────────────────────────
	const hasInput = (utxo: UTxO) =>
		draft.value.inputs.some(u => u.input.txHash === utxo.input.txHash && u.input.outputIndex === utxo.input.outputIndex)

	const addInput = (utxo: UTxO) => {
		if (hasInput(utxo)) {
			toast.warning('UTxO already selected as an input.')
			return
		}
		draft.value.inputs.push(utxo)
	}

	const toggleInput = (utxo: UTxO) => {
		const index = draft.value.inputs.findIndex(
			u => u.input.txHash === utxo.input.txHash && u.input.outputIndex === utxo.input.outputIndex
		)
		if (index >= 0) draft.value.inputs.splice(index, 1)
		else draft.value.inputs.push(utxo)
	}

	const removeInput = (index: number) => draft.value.inputs.splice(index, 1)
	const clearInputs = () => (draft.value.inputs = [])

	// ── Output actions ─────────────────────────────────────────────────────────
	const addOutput = () => draft.value.outputs.push(emptyOutput())
	const removeOutput = (index: number) => draft.value.outputs.splice(index, 1)
	const clearOutputs = () => (draft.value.outputs = [])

	// ── Row helpers for the advanced/expert sections ───────────────────────────
	const addScriptInput = () =>
		draft.value.scriptInputs.push({
			id: uid(),
			txHash: '',
			outputIndex: 0,
			address: '',
			amount: [{ unit: 'lovelace', quantity: '' }],
			scriptCborHex: '',
			version: 'V3',
			datumMode: 'inlinedatum',
			datumCborHex: '',
			redeemerMode: 'unit',
			redeemerCborHex: '',
			exUnits: { mem: '5000000', steps: '2000000000' }
		})
	const addReferenceInput = () => draft.value.referenceInputs.push({ id: uid(), txHash: '', outputIndex: 0 })
	const addCollateral = () => draft.value.collateral.push({ id: uid(), txHash: '', outputIndex: 0, address: '', lovelace: '5000000' })
	const addMint = () =>
		draft.value.mints.push({
			id: uid(),
			policyId: '',
			assetName: '',
			quantity: '1',
			scriptType: 'Native',
			scriptCborHex: '',
			redeemerMode: 'none',
			redeemerCborHex: ''
		})
	const addCertificate = () => draft.value.certificates.push({ id: uid(), kind: 'StakeRegistration', rewardAddress: '', poolKeyHash: '' })
	const addWithdrawal = () => draft.value.withdrawals.push({ id: uid(), rewardAddress: '', amount: '' })
	const addMetadata = () => draft.value.metadata.push({ id: uid(), label: '674', json: '{\n  "msg": ["Hello from Hydra SDK"]\n}' })
	const addRequiredSigner = () => draft.value.requiredSigners.push('')

	const removeById = <T extends { id: string }>(list: T[], id: string) => {
		const index = list.findIndex(item => item.id === id)
		if (index >= 0) list.splice(index, 1)
	}

	// ── Reset ──────────────────────────────────────────────────────────────────
	const clearResults = () => {
		buildError.value = ''
		buildWarnings.value = []
		cborHex.value = ''
		txId.value = ''
		txJson.value = ''
		summary.value = null
		signError.value = ''
		signedCborHex.value = ''
		submitError.value = ''
		submittedTxId.value = ''
	}

	const resetDraft = () => {
		draft.value = createDefaultDraft()
		clearResults()
	}

	/** Base address of the configured wallet, or '' when there is none. */
	const walletAddress = computed(() => {
		if (!walletPrvKeyHex.value) return ''
		try {
			const wallet = new AppWallet({
				networkId: networkInfo.value.networkId,
				key: { type: 'root', bech32: EmbeddedWallet.privateKeyHexToBech32(walletPrvKeyHex.value) }
			})
			return wallet.getAccount().baseAddressBech32
		} catch {
			return ''
		}
	})

	/**
	 * Presets build against the real wallet when one is configured — that is what
	 * makes the mint preset's `sig` policy signable rather than a dead example.
	 */
	const applyPreset = (id: string) => {
		const preset = TX_PRESETS.find(entry => entry.id === id)
		if (!preset) return
		try {
			draft.value = preset.build({ address: walletAddress.value || SAMPLE_ADDRESS })
			clearResults()
			toast.success(`Loaded preset: ${preset.name}`)
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to load preset')
		}
	}

	// ── Validation (pre-build, cheap) ──────────────────────────────────────────
	const validationErrors = computed(() => {
		const errors: string[] = []
		const d = draft.value

		if (!d.inputs.length && !d.scriptInputs.length) errors.push('No inputs selected — add at least one UTxO or script input.')
		if (!d.outputs.length && !d.mints.length) errors.push('No outputs defined — add at least one recipient.')

		d.outputs.forEach((out, index) => {
			if (!out.address.trim()) errors.push(`Output #${index + 1}: address is empty.`)
			out.amount.forEach(asset => {
				if (!asset.unit.trim()) errors.push(`Output #${index + 1}: an asset has no unit.`)
				const quantity = asset.quantity?.trim()
				if (!quantity || isNaN(Number(quantity)) || BigInt(quantity || 0) <= 0n)
					errors.push(`Output #${index + 1}: invalid quantity for "${asset.unit || 'unit'}".`)
			})
		})

		if (d.withChangeAddress && !d.changeAddress.trim()) errors.push('Change address is enabled but empty.')
		if (d.withCustomFee && !d.customFee.trim()) errors.push('Custom fee is enabled but empty.')
		if (d.scriptInputs.length && !d.collateral.length && !d.isHydra)
			errors.push('Script inputs need at least one collateral UTxO on L1.')

		// Rows below used to be skipped silently when incomplete, which built a
		// transaction quietly missing the thing the user had just filled in. They
		// are validation errors now, so the Build button says what is missing.
		d.mints.forEach((mint, index) => {
			if (!mint.policyId.trim()) errors.push(`Mint #${index + 1}: policy id is empty.`)
			if (!mint.quantity.trim() || isNaN(Number(mint.quantity)) || BigInt(mint.quantity || 0) === 0n)
				errors.push(`Mint #${index + 1}: quantity must be a non-zero number (negative burns).`)
			if (!mint.scriptCborHex.trim()) errors.push(`Mint #${index + 1}: policy script CBOR is empty.`)
			if (mint.redeemerMode === 'custom' && !mint.redeemerCborHex.trim())
				errors.push(`Mint #${index + 1}: custom redeemer is empty.`)
		})

		d.scriptInputs.forEach((script, index) => {
			if (!script.txHash.trim()) errors.push(`Script input #${index + 1}: txHash is empty.`)
			if (!script.address.trim()) errors.push(`Script input #${index + 1}: address is empty.`)
			if (!script.scriptCborHex.trim()) errors.push(`Script input #${index + 1}: validator CBOR is empty.`)
			if (script.datumMode !== 'none' && !script.datumCborHex.trim())
				errors.push(`Script input #${index + 1}: datum is empty.`)
			if (script.redeemerMode === 'custom' && !script.redeemerCborHex.trim())
				errors.push(`Script input #${index + 1}: custom redeemer is empty.`)
		})

		d.referenceInputs.forEach((ref, index) => {
			if (!ref.txHash.trim()) errors.push(`Reference input #${index + 1}: txHash is empty.`)
		})

		d.collateral.forEach((entry, index) => {
			if (!entry.txHash.trim()) errors.push(`Collateral #${index + 1}: txHash is empty.`)
			if (!entry.address.trim()) errors.push(`Collateral #${index + 1}: address is empty.`)
		})

		d.certificates.forEach((cert, index) => {
			if (!cert.rewardAddress.trim()) errors.push(`Certificate #${index + 1}: stake address is empty.`)
			if (cert.kind === 'StakeDelegation' && !cert.poolKeyHash.trim())
				errors.push(`Certificate #${index + 1}: delegation needs a pool key hash.`)
		})

		d.withdrawals.forEach((withdrawal, index) => {
			if (!withdrawal.rewardAddress.trim()) errors.push(`Withdrawal #${index + 1}: stake address is empty.`)
			if (!withdrawal.amount.trim()) errors.push(`Withdrawal #${index + 1}: amount is empty.`)
		})

		d.metadata.forEach((entry, index) => {
			if (!entry.label.trim()) errors.push(`Metadata #${index + 1}: label is empty.`)
			const jsonError = metadataError(entry)
			if (jsonError) errors.push(`Metadata #${index + 1}: ${jsonError}`)
		})

		d.requiredSigners.forEach((signer, index) => {
			if (!signer.trim()) errors.push(`Required signer #${index + 1} is empty.`)
		})

		return errors
	})

	const canBuild = computed(() => validationErrors.value.length === 0)

	// ── Build ──────────────────────────────────────────────────────────────────
	/**
	 * Every CSL object created here lives in WASM linear memory and is only
	 * reclaimed by an explicit `.free()` — the JS GC will not do it in time. The
	 * builder frees what *it* allocates (transaction 1.2.0+), but datum/redeemer
	 * values are caller-owned, so we collect them and free them ourselves once
	 * the build has returned.
	 */
	const build = async () => {
		if (building.value) return
		building.value = true
		buildError.value = ''
		buildWarnings.value = []

		const d = draft.value
		const owned: Array<{ free: () => void }> = []
		const track = <T extends { free: () => void }>(obj: T): T => {
			owned.push(obj)
			return obj
		}

		let builder: TxBuilder | undefined
		let tx: CardanoWASM.Transaction | undefined

		try {
			if (!canBuild.value) throw new Error(validationErrors.value[0])

			let evaluator
			if (d.useEvaluator) {
				const { apiEndpoint, apiKey } = providerStore.blockfrostConfig
				if (!apiKey) throw new Error('ExUnits evaluation needs a Blockfrost API key.')
				evaluator = createBlockfrostEvaluator({ apiEndpoint, apiKey })
			}

			builder = new TxBuilder({
				params: d.useCustomPParams ? d.customPParams : undefined,
				isHydra: d.isHydra,
				evaluator,
				txEvaluationMultiplier: d.useEvaluator ? Number(d.evaluatorMultiplier) || 1 : undefined,
				verbose: d.verbose
			})

			// setInputs() replaces the whole input list and must run before any
			// txIn(), so normal UTxOs go first and script inputs are appended after.
			if (d.inputs.length) builder.setInputs(toRaw(d.inputs) as UTxO[], { strategy: d.strategy })

			for (const script of d.scriptInputs) {
				builder.txIn(script.txHash, Number(script.outputIndex), toRaw(script.amount), script.address)
				builder.txInScript(script.scriptCborHex, script.version)
				if (script.datumMode === 'inlinedatum' && script.datumCborHex)
					builder.txInInlineDatum(track(Deserializer.deserializePlutusData(script.datumCborHex)))
				if (script.datumMode === 'datumhash' && script.datumCborHex)
					builder.txInDatumHash(track(Deserializer.deserializePlutusData(script.datumCborHex)))
				if (script.redeemerMode === 'unit') {
					builder.txInRedeemerValue(track(RedeemerUtils.mkUnitRedeemer({ tag: 'spend', exUnits: script.exUnits })))
				} else if (script.redeemerMode === 'custom' && script.redeemerCborHex) {
					const data = track(Deserializer.deserializePlutusData(script.redeemerCborHex))
					builder.txInRedeemerValue(track(RedeemerUtils.mkSpendRedeemer(data, { exUnits: script.exUnits })))
				}
			}

			for (const ref of d.referenceInputs) {
				if (ref.txHash) builder.txInReference(ref.txHash, Number(ref.outputIndex))
			}

			for (const output of d.outputs) {
				builder.addOutput({ address: output.address, amount: toRaw(output.amount) })
				if (output.datum) builder.txOutDatumHashValue(track(Deserializer.deserializePlutusData(output.datum)))
				if (output.inlineDatum) builder.txOutInlineDatumValue(track(Deserializer.deserializePlutusData(output.inlineDatum)))
			}

			for (const mint of d.mints) {
				if (!mint.policyId || !mint.quantity) continue
				// mintingScript()/mintRedeemerValue() attach to the *last* staged mint,
				// so mint() has to come first.
				if (mint.scriptType !== 'Native') builder.mintPlutusScript(mint.scriptType.replace('Plutus', '') as LanguageVersion)
				builder.mint(mint.quantity, mint.policyId, mint.assetName)
				if (mint.scriptCborHex) builder.mintingScript({ type: mint.scriptType, scriptCborHex: mint.scriptCborHex })
				if (mint.redeemerMode === 'unit') {
					builder.mintRedeemerValue(track(RedeemerUtils.mkUnitRedeemer({ tag: 'mint' })))
				} else if (mint.redeemerMode === 'custom' && mint.redeemerCborHex) {
					const data = track(Deserializer.deserializePlutusData(mint.redeemerCborHex))
					builder.mintRedeemerValue(track(RedeemerUtils.mkMintRedeemer(data)))
				}
			}

			for (const cert of d.certificates) {
				if (!cert.rewardAddress) continue
				if (cert.kind === 'StakeRegistration') builder.registerStake(cert.rewardAddress)
				else if (cert.kind === 'StakeDeregistration') builder.deregisterStake(cert.rewardAddress)
				else builder.delegateStake(cert.rewardAddress, cert.poolKeyHash)
			}

			for (const withdrawal of d.withdrawals) {
				if (withdrawal.rewardAddress && withdrawal.amount) builder.withdrawal(withdrawal.rewardAddress, withdrawal.amount)
			}

			for (const entry of d.metadata) {
				if (!entry.label) continue
				builder.metadataValue(entry.label, JSON.parse(entry.json))
			}

			for (const collateral of d.collateral) {
				if (!collateral.txHash) continue
				builder.txInCollateral(collateral.txHash, Number(collateral.outputIndex), [{ unit: 'lovelace', quantity: collateral.lovelace }], collateral.address)
			}
			if (d.totalCollateral) builder.totalCollateral(d.totalCollateral)
			if (d.collateralReturnAddress && d.collateralReturnLovelace)
				builder.collateralReturn(d.collateralReturnAddress, [{ unit: 'lovelace', quantity: d.collateralReturnLovelace }])

			for (const signer of d.requiredSigners) {
				if (signer.trim()) builder.requiredSignerHash(signer.trim())
			}

			if (d.withValidity) {
				if (d.invalidBefore) builder.invalidBefore(Number(d.invalidBefore))
				if (d.invalidAfter) builder.invalidAfter(Number(d.invalidAfter))
			}

			if (d.withChangeAddress) builder.setChangeAddress(d.changeAddress)
			if (d.withCustomFee) builder.setFee(BigInt(d.customFee).toString())
			if (d.withMinFee && d.minFee) builder.setMinFee(d.minFee)

			tx = await builder.complete()

			const hex = tx.to_hex()
			const json = tx.to_json()

			cborHex.value = hex
			txId.value = Resolver.resolveTxHash(hex)
			txJson.value = json
			summary.value = buildSummary(hex, json, d.inputs)
			signedCborHex.value = ''
			submittedTxId.value = ''
			buildError.value = ''
			toast.success('Transaction built successfully')
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			buildError.value = message
			cborHex.value = ''
			txId.value = ''
			txJson.value = ''
			summary.value = null
			toast.error(message)
		} finally {
			// Order matters: release the transaction, then the caller-owned datum /
			// redeemer values, then the builder's own arena.
			try {
				tx?.free()
			} catch {
				/* already freed */
			}
			for (const obj of owned) {
				try {
					obj.free()
				} catch {
					/* already freed */
				}
			}
			builder?.dispose()
			building.value = false
		}
	}

	const buildSummary = (hex: string, json: string, inputs: UTxO[]): BuildSummary => {
		const parsed = JSON.parse(json)
		const body = parsed?.body ?? {}
		const fee = String(body.fee ?? '0')

		const usedInputs: Array<{ transaction_id: string; index: number }> = body.inputs ?? []
		const totalIn = usedInputs.reduce((acc, input) => {
			const match = inputs.find(u => u.input.txHash === input.transaction_id && u.input.outputIndex === Number(input.index))
			return acc + BigInt(match?.output.amount.find(a => a.unit === 'lovelace')?.quantity || 0)
		}, 0n)

		// Amounts come from the decoded body rather than
		// `Deserializer.deserializeAmountsFromTx()`: as of core 1.4.1 that helper
		// builds its unit from `AssetName.to_hex()`, which is the CBOR encoding of
		// the name (a `4d494e` name comes back as `434d494e`), so its units don't
		// match the `policyId + assetNameHex` form used everywhere else.
		const outputAmounts = collectOutputAmounts(body.outputs ?? [])
		const totalOut = BigInt(outputAmounts.find(a => a.unit === 'lovelace')?.quantity || 0)

		// What the change address got back = total out minus what we explicitly asked for.
		const requested = draft.value.outputs.reduce(
			(acc, out) => acc + BigInt(out.amount.find(a => a.unit === 'lovelace')?.quantity || 0),
			0n
		)

		return {
			fee,
			size: hex.length / 2,
			inputCount: usedInputs.length,
			outputCount: (body.outputs ?? []).length,
			totalIn: totalIn.toString(),
			totalOut: totalOut.toString(),
			change: (totalOut - requested).toString(),
			outputAmounts
		}
	}

	// ── Sign ───────────────────────────────────────────────────────────────────
	const signTx = async (hex?: string) => {
		const target = hex ?? cborHex.value
		signing.value = true
		signError.value = ''
		try {
			if (!target) throw new Error('Nothing to sign — build a transaction first.')
			if (!walletPrvKeyHex.value) throw new Error('No wallet configured. Set one up in the Context panel.')

			const wallet = new AppWallet({
				networkId: networkInfo.value.networkId,
				key: { type: 'root', bech32: EmbeddedWallet.privateKeyHexToBech32(walletPrvKeyHex.value) }
			})
			signedCborHex.value = await wallet.signTx(target, partialSign.value)
			toast.success('Transaction signed')
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			signError.value = message
			signedCborHex.value = ''
			toast.error(message)
		} finally {
			signing.value = false
		}
	}

	// ── Submit ─────────────────────────────────────────────────────────────────
	const submitTx = async (hex?: string) => {
		const target = hex ?? signedCborHex.value ?? cborHex.value
		submitting.value = true
		submitError.value = ''
		try {
			if (!target) throw new Error('Nothing to submit — sign a transaction first.')
			const provider = providerStore.getBlockfrostProvider()
			const result = await provider.submitter.submitTx(target)
			if (!result) throw new Error('Submit failed: the provider returned no transaction id.')
			submittedTxId.value = result
			toast.success('Transaction submitted')
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			submitError.value = message
			submittedTxId.value = ''
			toast.error(message)
		} finally {
			submitting.value = false
		}
	}

	/** Metadata JSON is validated here rather than at build time so the field can flag itself. */
	const metadataError = (entry: MetadataDraft) => {
		let metadatum: { free: () => void } | undefined
		try {
			metadatum = MetadataUtils.metadataObjToMetadatum(JSON.parse(entry.json))
			return ''
		} catch (error) {
			return error instanceof Error ? error.message : 'Invalid metadata JSON'
		} finally {
			// The probe allocates a WASM metadatum; validation runs on every
			// keystroke, so it has to be released right away.
			try {
				metadatum?.free()
			} catch {
				/* already freed */
			}
		}
	}

	return {
		draft,
		// results
		building,
		buildError,
		buildWarnings,
		cborHex,
		txId,
		txJson,
		summary,
		signing,
		signError,
		signedCborHex,
		partialSign,
		submitting,
		submitError,
		submittedTxId,
		stage,
		// derived
		totalInputLovelace,
		totalOutputLovelace,
		availableAssets,
		validationErrors,
		canBuild,
		// actions
		hasInput,
		addInput,
		toggleInput,
		removeInput,
		clearInputs,
		addOutput,
		removeOutput,
		clearOutputs,
		addScriptInput,
		addReferenceInput,
		addCollateral,
		addMint,
		addCertificate,
		addWithdrawal,
		addMetadata,
		addRequiredSigner,
		removeById,
		clearResults,
		resetDraft,
		walletAddress,
		applyPreset,
		build,
		signTx,
		submitTx,
		metadataError
	}
})
