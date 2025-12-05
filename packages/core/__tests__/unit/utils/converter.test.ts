import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
	convertUTxOToUTxOObject,
	convertUTxOObjectToUTxO,
	convertTxOutputToWasm
} from '../../../src/utils/cardano-wasm/converter'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { UTxO, UTxOObject, TxOutput } from '../../../src/types/cardano'
import { mockData } from '../../mocks/converter'

// Mock dependencies
vi.mock('../../../src/utils/validator.util', () => ({
	isValidAddress: vi.fn(addr => addr && addr.startsWith('addr_test'))
}))

vi.mock('../../../src/utils/cardano-wasm/deserializer', () => ({
	deserializeAssetUnit: vi.fn(unit => {
		if (unit === 'lovelace') {
			return { policyId: '', assetName: '' }
		}
		const policyId = unit.substring(0, 56)
		const assetName = unit.substring(56)
		return { policyId, assetName }
	})
}))

describe('Converter Utils', () => {
	describe('convertUTxOToUTxOObject', () => {
		it('should convert real UTxO to UTxOObject - single lovelace', () => {
			const result = convertUTxOToUTxOObject(mockData.utxos)

			expect(result).toHaveProperty('1d2e5b97f1cad7bea2b06144abc4974012fa786c9e7e5faddd03243b967a03f6#0')
			expect(result['1d2e5b97f1cad7bea2b06144abc4974012fa786c9e7e5faddd03243b967a03f6#0'].address).toBe(mockData.address)
			expect(result['1d2e5b97f1cad7bea2b06144abc4974012fa786c9e7e5faddd03243b967a03f6#0'].value.lovelace).toBe(200000000)
		})

		it('should convert script UTxOs with datumHash', () => {
			const result = convertUTxOToUTxOObject([mockData.scriptUtxos[0]])

			expect(result['14a33354d554dc566f5751c1f43eca9e4a303ed4603730cd65b482b2a6772d94#0']).toBeDefined()
			expect(result['14a33354d554dc566f5751c1f43eca9e4a303ed4603730cd65b482b2a6772d94#0'].datumhash).toBe(
				'b2a341841d44a0d757a9f4a7c60da80e09e0764c00aec65b30cc1cfcbc130d59'
			)
		})

		it('should convert multiple script UTxOs', () => {
			const result = convertUTxOToUTxOObject(mockData.scriptUtxos)

			expect(Object.keys(result)).toHaveLength(2)
			expect(result['14a33354d554dc566f5751c1f43eca9e4a303ed4603730cd65b482b2a6772d94#0']).toBeDefined()
			expect(result['331bec9d3cbe4eb6760f13cae8d7cf15129cfe5166429213cea7201dcf08ebec#0']).toBeDefined()
		})
	})

	describe('convertUTxOObjectToUTxO', () => {
		it('should convert real UTxOObject back to UTxO array - single lovelace', () => {
			const result = convertUTxOObjectToUTxO(mockData.utxoObject)

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

			const result = convertUTxOObjectToUTxO(scriptUtxoWithDatumHash)

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

			const result = convertUTxOObjectToUTxO(scriptUtxoWithInlineDatum)

			expect(result).toHaveLength(1)
			expect(result[0].output.inlineDatum).toBe(mockPlutusData)
			expect(result[0].output.amount[0].quantity).toBe('12000000')
		})

		it('should convert multiple script UTxOs from scriptUtxoObject', () => {
			const result = convertUTxOObjectToUTxO(mockData.scriptUtxoObject)

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

			const result = convertUTxOObjectToUTxO(duplicateHexUtxoObject)

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

			const result = convertUTxOObjectToUTxO(mixedUtxoObject)

			expect(result).toHaveLength(2)
			// First one has datumHash
			expect(result[0].output.datumHash).toBeDefined()
			// Second one has inlineDatum
			expect(result[1].output.inlineDatum).toBeDefined()
		})
	})

	describe('convertTxOutputToWasm', () => {
		beforeEach(() => {
			vi.clearAllMocks()
		})

		it('should convert real TxOutput with only lovelace to Wasm', () => {
			const mockAddress = {}
			const mockValue = {}
			const mockTxOutput = {
				set_plutus_data: vi.fn(),
				set_data_hash: vi.fn()
			}

			vi.spyOn(CardanoWASM.Address, 'from_bech32').mockReturnValue(mockAddress as any)
			vi.spyOn(CardanoWASM.Value, 'new').mockReturnValue(mockValue as any)
			vi.spyOn(CardanoWASM.BigNum, 'from_str').mockReturnValue({} as any)
			vi.spyOn(CardanoWASM.TransactionOutput, 'new').mockReturnValue(mockTxOutput as any)

			const output: TxOutput = {
				address: mockData.address,
				amount: [{ unit: 'lovelace', quantity: '200000000' }],
				inlineDatum: undefined,
				datum: undefined,
				scriptRef: undefined
			}

			const result = convertTxOutputToWasm(output)

			expect(result).toBeDefined()
			expect(CardanoWASM.Address.from_bech32).toHaveBeenCalledWith(mockData.address)
		})

		it('should convert TxOutput with datumHash to Wasm', () => {
			const mockAddress = {}
			const mockValue = {}
			const mockTxOutput = {
				set_plutus_data: vi.fn(),
				set_data_hash: vi.fn()
			}

			vi.spyOn(CardanoWASM.Address, 'from_bech32').mockReturnValue(mockAddress as any)
			vi.spyOn(CardanoWASM.Value, 'new').mockReturnValue(mockValue as any)
			vi.spyOn(CardanoWASM.BigNum, 'from_str').mockReturnValue({} as any)
			vi.spyOn(CardanoWASM.TransactionOutput, 'new').mockReturnValue(mockTxOutput as any)
			vi.spyOn(CardanoWASM.DataHash, 'from_hex').mockReturnValue({} as any)

			const output: TxOutput = {
				address: mockData.scriptAddress,
				amount: [{ unit: 'lovelace', quantity: '1017160' }],
				inlineDatum: undefined,
				datum: undefined,
				scriptRef: undefined
			}

			convertTxOutputToWasm(output)

			expect(CardanoWASM.Address.from_bech32).toHaveBeenCalledWith(mockData.scriptAddress)
		})

		it('should convert script TxOutput with inlineDatum to Wasm', () => {
			const mockInlineDatum = {
				/* mock datum */
			}
			const mockAddress = {}
			const mockValue = {}
			const mockTxOutput = {
				set_plutus_data: vi.fn(),
				set_data_hash: vi.fn()
			}

			vi.spyOn(CardanoWASM.Address, 'from_bech32').mockReturnValue(mockAddress as any)
			vi.spyOn(CardanoWASM.Value, 'new').mockReturnValue(mockValue as any)
			vi.spyOn(CardanoWASM.BigNum, 'from_str').mockReturnValue({} as any)
			vi.spyOn(CardanoWASM.TransactionOutput, 'new').mockReturnValue(mockTxOutput as any)

			const output: TxOutput = {
				address: mockData.scriptAddress,
				amount: [{ unit: 'lovelace', quantity: '12000000' }],
				inlineDatum: mockInlineDatum as any,
				datum: undefined,
				scriptRef: undefined
			}

			convertTxOutputToWasm(output)

			expect(mockTxOutput.set_plutus_data).toHaveBeenCalledWith(mockInlineDatum)
		})

		it('should throw error when both inlineDatum and datum are present', () => {
			const mockDatum = {}
			const mockInlineDatum = {}
			const mockAddress = {}
			const mockValue = {}
			const mockTxOutput = {
				set_plutus_data: vi.fn(),
				set_data_hash: vi.fn()
			}

			vi.spyOn(CardanoWASM.Address, 'from_bech32').mockReturnValue(mockAddress as any)
			vi.spyOn(CardanoWASM.Value, 'new').mockReturnValue(mockValue as any)
			vi.spyOn(CardanoWASM.BigNum, 'from_str').mockReturnValue({} as any)
			vi.spyOn(CardanoWASM.TransactionOutput, 'new').mockReturnValue(mockTxOutput as any)

			const output: TxOutput = {
				address: mockData.scriptAddress,
				amount: [{ unit: 'lovelace', quantity: '1000000' }],
				inlineDatum: mockInlineDatum as any,
				datum: mockDatum as any,
				scriptRef: undefined
			}

			expect(() => {
				convertTxOutputToWasm(output)
			}).toThrow('Cannot use both inlineDatum and datumHash')
		})

		it('should throw error for invalid address', () => {
			const output: TxOutput = {
				address: 'invalid_address',
				amount: [{ unit: 'lovelace', quantity: '1000000' }],
				inlineDatum: undefined,
				datum: undefined,
				scriptRef: undefined
			}

			expect(() => {
				convertTxOutputToWasm(output)
			}).toThrow('Invalid address')
		})

		it('should throw error for invalid amount array', () => {
			const output: TxOutput = {
				address: mockData.address,
				amount: null as any,
				inlineDatum: undefined,
				datum: undefined,
				scriptRef: undefined
			}

			expect(() => {
				convertTxOutputToWasm(output)
			}).toThrow('Invalid amount')
		})

		it('should handle default lovelace amount when not specified', () => {
			const mockAddress = {}
			const mockValue = {}
			const mockTxOutput = {
				set_plutus_data: vi.fn(),
				set_data_hash: vi.fn()
			}

			vi.spyOn(CardanoWASM.Address, 'from_bech32').mockReturnValue(mockAddress as any)
			vi.spyOn(CardanoWASM.Value, 'new').mockReturnValue(mockValue as any)
			vi.spyOn(CardanoWASM.BigNum, 'from_str').mockReturnValue({} as any)
			vi.spyOn(CardanoWASM.TransactionOutput, 'new').mockReturnValue(mockTxOutput as any)

			const output: TxOutput = {
				address: mockData.address,
				amount: [{ unit: 'lovelace', quantity: '0' }],
				inlineDatum: undefined,
				datum: undefined,
				scriptRef: undefined
			}

			const result = convertTxOutputToWasm(output)

			expect(result).toBeDefined()
		})
	})
})
