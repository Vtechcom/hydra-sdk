import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { Asset, TxHash, TxOutput, UTxO, UTxOObject, UTxOObjectValue } from '../../types/cardano'
import { deserializeAssetUnit } from './deserializer'
import { isValidAddress } from '../address'
import { Deserializer, ParserUtils } from '../..'

type ConvertUTxOObjectToUTxOOptions = {
	maxDatumCacheSize?: number
}

const DEFAULT_MAX_DATUM_CACHE_SIZE = 1024

export const convertUTxOToUTxOObject = (utxos: UTxO[]): UTxOObject => {
	const result = {} as UTxOObject

	for (let i = 0; i < utxos.length; i++) {
		const cur = utxos[i]
		let datumhash = null
		let inlineDatum = null
		let inlineDatumhash = null

		if (cur.output.inlineDatum) {
			datumhash = null
			inlineDatumhash = CardanoWASM.hash_plutus_data(cur.output.inlineDatum).to_hex()
			inlineDatum = JSON.parse(cur.output.inlineDatum.to_json(CardanoWASM.PlutusDatumSchema.DetailedSchema))
		} else {
			datumhash = cur.output.datumHash || null
		}

		const value: Record<string, unknown> = {}
		for (let j = 0; j < cur.output.amount.length; j++) {
			const amount = cur.output.amount[j]
			if (amount.unit === 'lovelace') {
				value.lovelace = Number(amount.quantity)
				continue
			}

			const { policyId, assetName } = deserializeAssetUnit(amount.unit)
			let policyAssets = value[policyId] as Record<string, number> | undefined
			if (!policyAssets) {
				policyAssets = {}
				value[policyId] = policyAssets
			}
			policyAssets[assetName] = Number(amount.quantity)
		}

		result[`${cur.input.txHash}#${cur.input.outputIndex}` as TxHash] = {
			address: cur.output.address,

			// datum
			datum: cur.output.datum ? cur.output.datum.to_hex() : null,
			datumhash,

			// inlineDatum
			inlineDatumhash,
			inlineDatum,
			inlineDatumRaw: cur.output.inlineDatum ? cur.output.inlineDatum.to_hex() : null,

			// TODO: update it if using scriptRef
			referenceScript: null,
			value: value as UTxOObjectValue['value']
		}
	}

	return result
}

/**
 * Convert UTxO Object to UTxO[]
 * @param utxoObject UTxO Object
 * @returns `tsUTxO[]`
 *
 * Note: If performance is critical, consider using a Web Worker to offload the conversion process
 * to a separate thread, preventing UI blocking in frontend applications.
 */
export const convertUTxOObjectToUTxO = (utxoObject: UTxOObject): UTxO[] => {
	return convertUTxOObjectToUTxOWithOptions(utxoObject)
}

export const convertUTxOObjectToUTxOWithOptions = (
	utxoObject: UTxOObject,
	options: ConvertUTxOObjectToUTxOOptions = {}
): UTxO[] => {
	const result: UTxO[] = []
	const maxDatumCacheSize = options.maxDatumCacheSize ?? DEFAULT_MAX_DATUM_CACHE_SIZE
	const datumCache = new Map<string, CardanoWASM.PlutusData>()
	const setDatumCache = (key: string, datum: CardanoWASM.PlutusData) => {
		if (maxDatumCacheSize > 0 && datumCache.size >= maxDatumCacheSize) {
			const oldestKey = datumCache.keys().next().value
			if (oldestKey) {
				datumCache.delete(oldestKey)
			}
		}
		datumCache.set(key, datum)
	}

	for (const txHash in utxoObject) {
		const utxo = utxoObject[txHash as TxHash]
		if (!utxo) continue

		const hashIndex = txHash.indexOf('#')
		if (hashIndex <= 0 || hashIndex === txHash.length - 1) continue

		const txId = txHash.slice(0, hashIndex)
		const outputIndex = Number(txHash.slice(hashIndex + 1))

		const value = utxo.value as Record<string, unknown> & { lovelace?: number }
		const amount: Asset[] = [
			{
				unit: 'lovelace',
				quantity: String(value.lovelace ?? 0)
			}
		]

		for (const policyId in value) {
			if (policyId === 'lovelace') continue

			const assets = value[policyId] as Record<string, number> | undefined
			if (!assets || typeof assets !== 'object') continue

			for (const assetName in assets) {
				amount.push({
					unit: policyId + assetName,
					quantity: String(assets[assetName])
				})
			}
		}

		let inlineDatum: CardanoWASM.PlutusData | undefined
		const inlineDatumValue = utxo.inlineDatum
		const inlineDatumRaw = utxo.inlineDatumRaw

		if (inlineDatumRaw) {
			const cached = datumCache.get(inlineDatumRaw)
			if (cached) {
				inlineDatum = cached
			} else {
				inlineDatum = CardanoWASM.PlutusData.from_hex(inlineDatumRaw)
				setDatumCache(inlineDatumRaw, inlineDatum)
			}
		} else if (typeof inlineDatumValue === 'string') {
			const cached = datumCache.get(inlineDatumValue)
			if (cached) {
				inlineDatum = cached
			} else {
				inlineDatum = CardanoWASM.PlutusData.from_hex(inlineDatumValue)
				setDatumCache(inlineDatumValue, inlineDatum)
			}
		} else if (inlineDatumValue && typeof inlineDatumValue === 'object') {
			inlineDatum = CardanoWASM.PlutusData.from_json(
				JSON.stringify(inlineDatumValue),
				CardanoWASM.PlutusDatumSchema.DetailedSchema
			)
		}

		result.push({
			input: {
				outputIndex,
				txHash: txId
			},
			output: {
				address: utxo.address,
				amount,
				datum: undefined,
				datumHash: utxo.datumhash,
				inlineDatum,
				scriptRef: undefined,
				scriptHash: undefined
			}
		})
	}

	return result
}

export const convertTxOutputToWasm = (output: TxOutput): CardanoWASM.TransactionOutput => {
	try {
		if (!isValidAddress(output.address)) throw new Error('Invalid address')
		if (!Array.isArray(output.amount)) throw new Error('Invalid amount')

		const shelleyOutputAddress = CardanoWASM.Address.from_bech32(output.address)
		let lovelaceSend = '0'
		const withAssets: Asset[] = []
		for (let i = 0; i < output.amount.length; i++) {
			const asset = output.amount[i]
			if (asset.unit === 'lovelace') {
				lovelaceSend = asset.quantity
				continue
			}
			withAssets.push(asset)
		}
		const lovelaceBigNum = CardanoWASM.BigNum.from_str(lovelaceSend)

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
			throw new Error('Cannot use both inlineDatum and datumHash')
		}
		if (output?.inlineDatum) {
			txOutput.set_plutus_data(output.inlineDatum)
		}
		if (output?.datum) {
			const datumHash = CardanoWASM.hash_plutus_data(output.datum).to_hex()
			txOutput.set_data_hash(CardanoWASM.DataHash.from_hex(datumHash))
		}
		// FIXME:
		if (output?.scriptRef) {
			// txOutput.set_script_ref(CardanoWASM.ScriptRef.from_json('').)
		}
		return txOutput
	} catch (e) {
		throw e
	}
}
