import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { Asset, TxHash, TxOutput, UTxO, UTxOObject, UTxOObjectValue } from '../../types/cardano'
import { deserializeAssetUnit } from './deserializer'
import { isValidAddress } from '../validator.util'
import { Deserializer, ParserUtils } from '../..'

export const convertUTxOToUTxOObject = (utxos: UTxO[]): UTxOObject => {
	return utxos.reduce((acc, cur) => {
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

		acc[`${cur.input.txHash}#${cur.input.outputIndex}` as TxHash] = {
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
			value: cur.output.amount.reduce(
				(acc, cur) => {
					if (cur.unit === 'lovelace') {
						acc.lovelace = Number(cur.quantity)
					} else {
						const { policyId, assetName } = deserializeAssetUnit(cur.unit)
						// @ts-ignore
						if (!acc[policyId]) {
							// @ts-ignore
							acc[policyId] = {}
						}
						// @ts-ignore
						acc[policyId][assetName] = Number(cur.quantity)
					}
					return acc
				},
				{} as UTxOObjectValue['value']
			)
		}
		return acc
	}, {} as UTxOObject)
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
	const entries = Object.entries(utxoObject)
	const length = entries.length
	const result: UTxO[] = new Array(length)
	const datumCache = new Map<string, CardanoWASM.PlutusData>()

	for (let i = 0; i < length; i++) {
		const [txHash, utxo] = entries[i]

		// Parse txHash - tối ưu bằng cách tính toán trực tiếp
		const hashIndex = txHash.indexOf('#')
		const txId = txHash.slice(0, hashIndex)
		const outputIndex = Number(txHash.slice(hashIndex + 1))

		// Pre-calculate total assets để allocate chính xác size
		const value = utxo.value
		let assetCount = 1 // lovelace
		const policyIds = Object.keys(value)
		for (let j = 0; j < policyIds.length; j++) {
			const policyId = policyIds[j]
			if (policyId !== 'lovelace') {
				// @ts-ignore
				assetCount += Object.keys(value[policyId]).length
			}
		}

		// Pre-allocate amount array với size chính xác
		const amount: Asset[] = new Array(assetCount)
		let amountIndex = 0

		// Add lovelace first
		amount[amountIndex++] = {
			unit: 'lovelace',
			quantity: String(value.lovelace)
		}

		// Process assets - optimize bằng cách giảm scope lookups
		for (let j = 0; j < policyIds.length; j++) {
			const policyId = policyIds[j]
			if (policyId === 'lovelace') continue

			// @ts-ignore
			const assets = value[policyId]
			const assetNames = Object.keys(assets)

			for (let k = 0; k < assetNames.length; k++) {
				const assetName = assetNames[k]
				amount[amountIndex++] = {
					unit: policyId + assetName, // Concatenation nhanh hơn template literal
					quantity: String(assets[assetName])
				}
			}
		}

		// Parse inlineDatum - early return pattern
		let inlineDatum: CardanoWASM.PlutusData | undefined
		const inlineDatumValue = utxo.inlineDatum

		if (inlineDatumValue) {
			// Fast path first - raw hex (common case)
			if (utxo.inlineDatumRaw) {
				if (datumCache.has(utxo.inlineDatumRaw)) {
					inlineDatum = datumCache.get(utxo.inlineDatumRaw)
				} else {
					inlineDatum = CardanoWASM.PlutusData.from_hex(utxo.inlineDatumRaw)
					datumCache.set(utxo.inlineDatumRaw, inlineDatum)
				}
			}
			// String hex
			else if (typeof inlineDatumValue === 'string') {
				if (datumCache.has(inlineDatumValue)) {
					inlineDatum = datumCache.get(inlineDatumValue)
				} else {
					inlineDatum = CardanoWASM.PlutusData.from_hex(inlineDatumValue)
					datumCache.set(inlineDatumValue, inlineDatum)
				}
			}
			// Object - slowest path
			/**
			 * Note: Thông thường nếu inlineDatum là object thì sẽ có inlineDatumRaw là hex string
			 * Tuy nhiên vẫn cần handle trường hợp này để đảm bảo tính đúng đắn
			 * Vì vậy performance sẽ không bị ảnh hưởng nhiều trong thực tế
			 */
			else if (typeof inlineDatumValue === 'object') {
				inlineDatum = CardanoWASM.PlutusData.from_json(
					JSON.stringify(inlineDatumValue),
					CardanoWASM.PlutusDatumSchema.DetailedSchema
				)
			}
		}

		// Construct UTxO object
		result[i] = {
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
		}
	}

	return result
}

export const convertTxOutputToWasm = (output: TxOutput): CardanoWASM.TransactionOutput => {
	try {
		if (!isValidAddress(output.address)) throw new Error('Invalid address')
		if (!Array.isArray(output.amount)) throw new Error('Invalid amount')

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
