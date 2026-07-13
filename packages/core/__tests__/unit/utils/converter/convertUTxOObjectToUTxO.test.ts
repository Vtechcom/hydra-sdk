import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { mockData } from '../../../mocks/converter'
import { UTxOObject } from '../../../../src'
import { Converter } from '../../../../src'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('../../../../src/utils/address', () => ({
	isValidAddress: vi.fn(addr => addr && addr.startsWith('addr_test'))
}))

// Valid testnet address for testing
const VALID_ADDRESS = mockData.address

describe('convertUTxOObjectToUTxO', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should convert real UTxOObject back to UTxO array - single lovelace', () => {
		const result = Converter.convertUTxOObjectToUTxO(mockData.utxoObject)

		expect(result).toHaveLength(1)
		expect(result[0].input.txHash).toBe('1d2e5b97f1cad7bea2b06144abc4974012fa786c9e7e5faddd03243b967a03f6')
		expect(result[0].input.outputIndex).toBe(0)
		expect(result[0].output.address).toBe(mockData.address)
		expect(result[0].output.amount).toHaveLength(1)
		expect(result[0].output.amount[0].unit).toBe('lovelace')
		expect(result[0].output.amount[0].quantity).toBe('200000000')
	})

	it('should convert script UTxOObject with datumHash', () => {
		const scriptUtxoWithDatumHash: UTxOObject = {
			'14a33354d554dc566f5751c1f43eca9e4a303ed4603730cd65b482b2a6772d94#0':
				mockData.scriptUtxoObject['14a33354d554dc566f5751c1f43eca9e4a303ed4603730cd65b482b2a6772d94#0']
		}

		const result = Converter.convertUTxOObjectToUTxO(scriptUtxoWithDatumHash)

		expect(result).toHaveLength(1)
		expect(result[0].output.datumHash).toBe('b2a341841d44a0d757a9f4a7c60da80e09e0764c00aec65b30cc1cfcbc130d59')
	})

	it('should convert script UTxOObject with inlineDatum', () => {
		const mockPlutusData = {
			/* mock object */
		}
		vi.spyOn(CardanoWASM.PlutusData, 'from_hex').mockReturnValue(mockPlutusData as any)

		const scriptUtxoWithInlineDatum: UTxOObject = {
			'331bec9d3cbe4eb6760f13cae8d7cf15129cfe5166429213cea7201dcf08ebec#0':
				mockData.scriptUtxoObject['331bec9d3cbe4eb6760f13cae8d7cf15129cfe5166429213cea7201dcf08ebec#0']
		}

		const result = Converter.convertUTxOObjectToUTxO(scriptUtxoWithInlineDatum)

		expect(result).toHaveLength(1)
		expect(result[0].output.inlineDatum).toBe(mockPlutusData)
		expect(result[0].output.amount[0].quantity).toBe('12000000')
	})

	it('should convert multiple script UTxOs from scriptUtxoObject', () => {
		const result = Converter.convertUTxOObjectToUTxO(mockData.scriptUtxoObject)

		expect(result).toHaveLength(2)
		expect(result[0].input.txHash).toBe('14a33354d554dc566f5751c1f43eca9e4a303ed4603730cd65b482b2a6772d94')
		expect(result[0].output.datumHash).toBe('b2a341841d44a0d757a9f4a7c60da80e09e0764c00aec65b30cc1cfcbc130d59')
		expect(result[1].input.txHash).toBe('331bec9d3cbe4eb6760f13cae8d7cf15129cfe5166429213cea7201dcf08ebec')
	})

	it('should cache PlutusData to avoid duplicate conversions on same hex', () => {
		const mockPlutusData = {
			/* mock object */
		}
		vi.spyOn(CardanoWASM.PlutusData, 'from_hex').mockReturnValue(mockPlutusData as any)

		const duplicateHexUtxoObject: UTxOObject = {
			'tx1#0': {
				address: mockData.scriptAddress,
				datum: null,
				datumhash: null,
				inlineDatum: null,
				inlineDatumhash: null,
				inlineDatumRaw: 'abcd1234',
				referenceScript: null,
				value: { lovelace: 12000000 }
			},
			'tx2#0': {
				address: mockData.scriptAddress,
				datum: null,
				datumhash: null,
				inlineDatum: null,
				inlineDatumhash: null,
				inlineDatumRaw: 'abcd1234', // Same hex
				referenceScript: null,
				value: { lovelace: 12000000 }
			}
		}

		const result = Converter.convertUTxOObjectToUTxO(duplicateHexUtxoObject)

		// Should handle both UTxOs with same hex
		expect(result).toHaveLength(2)
	})

	it('should handle mixed datum types in UTxOObject', () => {
		const mockPlutusData = {
			/* mock object */
		}
		vi.spyOn(CardanoWASM.PlutusData, 'from_hex').mockReturnValue(mockPlutusData as any)

		const mixedUtxoObject: UTxOObject = {
			...mockData.scriptUtxoObject
		}

		const result = Converter.convertUTxOObjectToUTxO(mixedUtxoObject)

		expect(result).toHaveLength(2)
		// First one has datumHash
		expect(result[0].output.datumHash).toBeDefined()
		// Second one has inlineDatum
		expect(result[1].output.inlineDatum).toBeDefined()
	})
})
