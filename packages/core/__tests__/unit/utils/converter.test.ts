import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import {
	convertTxOutputToWasm,
	convertUTxOObjectToUTxO,
	convertUTxOObjectToUTxOWithOptions,
	convertUTxOToUTxOObject
} from '../../../src/utils/cardano-wasm/converter'
import type { TxOutput, UTxO, UTxOObject } from '../../../src/types/cardano'
import { OTHER_ADDRESS, SCRIPT_ADDRESS } from '../../helpers/fixtures'
import { wasmScope } from '../../helpers/wasm'

const TX_A = '1d2e5b97f1cad7bea2b06144abc4974012fa786c9e7e5faddd03243b967a03f6'
const TX_B = '14a33354d554dc566f5751c1f43eca9e4a303ed4603730cd65b482b2a6772d94'
const POLICY_A = 'a'.repeat(56)
const POLICY_B = 'b'.repeat(56)
const TOKEN1 = '746f6b656e31' // "token1"
const TOKEN2 = '746f6b656e32' // "token2"
const DATUM_HASH = 'b2a341841d44a0d757a9f4a7c60da80e09e0764c00aec65b30cc1cfcbc130d59'
// blake2b-256 of the CBOR bytes, cross-checked with @noble/hashes
const HASH_OF_EMPTY_BYTES_DATUM = '39df024ac52722fe8ae4c1a8740e4c5624a38c3820e504a059aae8728421f8bd' // CBOR 40
const HASH_OF_INT_123_DATUM = '7cfec515f56d4413375aa9775f5de15ee60180861e9eaa954bcf9d015054857c' // CBOR 187b

const emptyUTxOObjectValue = {
	datum: null,
	datumhash: null,
	inlineDatum: null,
	inlineDatumhash: null,
	inlineDatumRaw: null,
	referenceScript: null
}

describe('Converter', () => {
	const keep = wasmScope()

	describe('convertUTxOToUTxOObject', () => {
		it('keys each UTxO by txHash#index and nests native assets by policy', () => {
			const utxos: UTxO[] = [
				{
					input: { txHash: TX_A, outputIndex: 3 },
					output: {
						address: OTHER_ADDRESS,
						amount: [
							{ unit: 'lovelace', quantity: '200000000' },
							{ unit: POLICY_A + TOKEN1, quantity: '10' },
							{ unit: POLICY_A + TOKEN2, quantity: '20' },
							{ unit: POLICY_B + TOKEN1, quantity: '30' }
						]
					}
				}
			]

			expect(convertUTxOToUTxOObject(utxos)).toEqual({
				[`${TX_A}#3`]: {
					...emptyUTxOObjectValue,
					address: OTHER_ADDRESS,
					value: { lovelace: 200000000, [POLICY_A]: { [TOKEN1]: 10, [TOKEN2]: 20 }, [POLICY_B]: { [TOKEN1]: 30 } }
				}
			})
		})

		it('copies a datum hash, and hashes + decodes an inline datum', () => {
			const inlineDatum = keep(CardanoWASM.PlutusData.from_hex('40'))
			const result = convertUTxOToUTxOObject([
				{
					input: { txHash: TX_A, outputIndex: 0 },
					output: { address: SCRIPT_ADDRESS, amount: [{ unit: 'lovelace', quantity: '1' }], datumHash: DATUM_HASH }
				},
				{
					input: { txHash: TX_B, outputIndex: 0 },
					output: { address: SCRIPT_ADDRESS, amount: [{ unit: 'lovelace', quantity: '2' }], inlineDatum }
				}
			])

			expect(result[`${TX_A}#0`]).toMatchObject({ datumhash: DATUM_HASH, inlineDatumhash: null, inlineDatum: null })
			expect(result[`${TX_B}#0`]).toMatchObject({
				datumhash: null,
				inlineDatumhash: HASH_OF_EMPTY_BYTES_DATUM,
				inlineDatum: { bytes: '' },
				inlineDatumRaw: '40'
			})
		})
	})

	describe('convertUTxOObjectToUTxO', () => {
		it('splits keys into input refs and flattens assets into units', () => {
			const result = convertUTxOObjectToUTxO({
				[`${TX_A}#7`]: {
					...emptyUTxOObjectValue,
					address: OTHER_ADDRESS,
					datumhash: DATUM_HASH,
					value: { lovelace: 5, [POLICY_A]: { [TOKEN1]: 10 } }
				}
			} as UTxOObject)

			expect(result).toEqual([
				{
					input: { txHash: TX_A, outputIndex: 7 },
					output: {
						address: OTHER_ADDRESS,
						amount: [
							{ unit: 'lovelace', quantity: '5' },
							{ unit: POLICY_A + TOKEN1, quantity: '10' }
						],
						datum: undefined,
						datumHash: DATUM_HASH,
						inlineDatum: undefined,
						scriptRef: undefined,
						scriptHash: undefined
					}
				}
			])
		})

		it('defaults missing lovelace to 0 and skips keys without a valid #index', () => {
			const entry = { ...emptyUTxOObjectValue, address: OTHER_ADDRESS, value: {} }
			const result = convertUTxOObjectToUTxO({
				[`${TX_A}#0`]: entry,
				[TX_B]: entry,
				[`#1`]: entry,
				[`${TX_B}#`]: entry
			} as unknown as UTxOObject)

			expect(result.map(u => u.input)).toEqual([{ txHash: TX_A, outputIndex: 0 }])
			expect(result[0].output.amount).toEqual([{ unit: 'lovelace', quantity: '0' }])
		})

		it.each([
			['inlineDatumRaw (CBOR hex)', { inlineDatumRaw: 'd87980' }],
			['inlineDatum as a CBOR hex string', { inlineDatum: 'd87980' }],
			['inlineDatum as detailed-schema JSON', { inlineDatum: { constructor: 0, fields: [] } }]
		])('decodes the inline datum from %s', (_name, datumFields) => {
			const [utxo] = convertUTxOObjectToUTxO({
				[`${TX_A}#0`]: { ...emptyUTxOObjectValue, address: SCRIPT_ADDRESS, value: { lovelace: 1 }, ...datumFields }
			} as UTxOObject)

			expect(keep(utxo.output.inlineDatum)!.to_hex()).toBe('d87980')
		})

		it('reuses a decoded datum for repeated CBOR, evicting the oldest beyond maxDatumCacheSize', () => {
			const withRaw = (raw: string) => ({
				...emptyUTxOObjectValue,
				address: SCRIPT_ADDRESS,
				value: { lovelace: 1 },
				inlineDatumRaw: raw
			})
			const object = {
				[`${TX_A}#0`]: withRaw('40'),
				[`${TX_A}#1`]: withRaw('40'),
				[`${TX_A}#2`]: withRaw('d87980'),
				[`${TX_A}#3`]: withRaw('40')
			} as UTxOObject

			const shared = convertUTxOObjectToUTxO(object).map(u => u.output.inlineDatum)
			expect(shared[1]).toBe(shared[0])
			expect(shared[3]).toBe(shared[0])

			const evicted = convertUTxOObjectToUTxOWithOptions(object, { maxDatumCacheSize: 1 }).map(u => u.output.inlineDatum)
			expect(evicted[1]).toBe(evicted[0])
			expect(evicted[3]).not.toBe(evicted[0])
			expect(evicted[3]!.to_hex()).toBe('40')
		})
	})

	it('round-trips UTxO[] → UTxOObject → UTxO[] with multi-asset values and datums', () => {
		const original: UTxO[] = [
			{
				input: { txHash: TX_A, outputIndex: 0 },
				output: {
					address: OTHER_ADDRESS,
					amount: [
						{ unit: 'lovelace', quantity: '2000000' },
						{ unit: POLICY_A + TOKEN1, quantity: '1' },
						{ unit: POLICY_B + TOKEN2, quantity: '42' }
					]
				}
			},
			{
				input: { txHash: TX_B, outputIndex: 1 },
				output: { address: SCRIPT_ADDRESS, amount: [{ unit: 'lovelace', quantity: '1017160' }], datumHash: DATUM_HASH }
			},
			{
				input: { txHash: TX_B, outputIndex: 2 },
				output: {
					address: SCRIPT_ADDRESS,
					amount: [{ unit: 'lovelace', quantity: '12000000' }],
					inlineDatum: keep(CardanoWASM.PlutusData.from_hex('d8799f4040ff'))
				}
			}
		]

		const restored = convertUTxOObjectToUTxO(convertUTxOToUTxOObject(original))

		expect(restored.map(u => ({ input: u.input, address: u.output.address, amount: u.output.amount }))).toEqual(
			original.map(u => ({ input: u.input, address: u.output.address, amount: u.output.amount }))
		)
		expect(restored[1].output.datumHash).toBe(DATUM_HASH)
		expect(keep(restored[2].output.inlineDatum)!.to_hex()).toBe('d8799f4040ff')
	})

	describe('convertTxOutputToWasm', () => {
		it.each([
			['an invalid address', { address: 'invalid', amount: [] }, /Invalid address/],
			['a non-array amount', { address: OTHER_ADDRESS, amount: null }, /Invalid amount/]
		])('rejects %s', (_name, output, error) => {
			expect(() => convertTxOutputToWasm(output as unknown as TxOutput)).toThrow(error)
		})

		it('rejects an output carrying both an inline datum and a datum', () => {
			const output: TxOutput = {
				address: OTHER_ADDRESS,
				amount: [{ unit: 'lovelace', quantity: '1000000' }],
				inlineDatum: keep(CardanoWASM.PlutusData.from_hex('01')),
				datum: keep(CardanoWASM.PlutusData.from_hex('02'))
			}

			expect(() => convertTxOutputToWasm(output)).toThrow(/Cannot use both inlineDatum and datumHash/)
		})

		it('builds a lovelace-only output', () => {
			const out = keep(
				convertTxOutputToWasm({ address: OTHER_ADDRESS, amount: [{ unit: 'lovelace', quantity: '2000000' }] })
			)

			expect(keep(out.address()).to_bech32()).toBe(OTHER_ADDRESS)
			expect(JSON.parse(keep(out.amount()).to_json())).toEqual({ coin: '2000000', multiasset: null })
		})

		it('groups assets by policy and sums repeated units', () => {
			const out = keep(
				convertTxOutputToWasm({
					address: OTHER_ADDRESS,
					amount: [
						{ unit: 'lovelace', quantity: '5000000' },
						{ unit: POLICY_A + TOKEN1, quantity: '10' },
						{ unit: POLICY_A + TOKEN1, quantity: '5' },
						{ unit: POLICY_B + TOKEN2, quantity: '7' }
					]
				})
			)

			expect(JSON.parse(keep(out.amount()).to_json())).toEqual({
				coin: '5000000',
				multiasset: { [POLICY_A]: { [TOKEN1]: '15' }, [POLICY_B]: { [TOKEN2]: '7' } }
			})
		})

		it('attaches an inline datum as-is, and a datum as its hash', () => {
			const inline = keep(
				convertTxOutputToWasm({
					address: SCRIPT_ADDRESS,
					amount: [{ unit: 'lovelace', quantity: '1000000' }],
					inlineDatum: keep(CardanoWASM.PlutusData.from_hex('40'))
				})
			)
			const hashed = keep(
				convertTxOutputToWasm({
					address: SCRIPT_ADDRESS,
					amount: [{ unit: 'lovelace', quantity: '1000000' }],
					datum: keep(CardanoWASM.PlutusData.from_hex('187b'))
				})
			)

			expect(keep(inline.plutus_data())!.to_hex()).toBe('40')
			expect(inline.data_hash()).toBeUndefined()
			expect(keep(hashed.data_hash())!.to_hex()).toBe(HASH_OF_INT_123_DATUM)
			expect(hashed.plutus_data()).toBeUndefined()
		})
	})
})
