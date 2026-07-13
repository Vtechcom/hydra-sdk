import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { isValidTxOutput } from '../../../src/utils/validation'
import { TxOutput } from '../../../src/types/cardano'

describe('validation utilities', () => {
	const validTestnetAddress =
		'addr_test1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz'

	describe('isValidTxOutput', () => {
		describe('valid outputs', () => {
			it('should return true for valid output with lovelace only', () => {
				const output: TxOutput = {
					address: validTestnetAddress,
					amount: [{ unit: 'lovelace', quantity: '2000000' }]
				}

				const result = isValidTxOutput(output)

				expect(result).toBe(true)
			})

			it('should return true for valid output with multi-asset', () => {
				const policyId = 'a'.repeat(56)
				const assetName = '746f6b656e31' // "token1" in hex

				const output: TxOutput = {
					address: validTestnetAddress,
					amount: [
						{ unit: 'lovelace', quantity: '5000000' },
						{ unit: `${policyId}${assetName}`, quantity: '10' }
					]
				}

				const result = isValidTxOutput(output)

				expect(result).toBe(true)
			})

			it('should return true for output with datumHash', () => {
				const output: TxOutput = {
					address: validTestnetAddress,
					amount: [{ unit: 'lovelace', quantity: '2000000' }],
					datumHash: 'a'.repeat(64)
				}

				const result = isValidTxOutput(output)

				expect(result).toBe(true)
			})

			it('should return true for output with inlineDatum', () => {
				const inlineDatum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))

				const output: TxOutput = {
					address: validTestnetAddress,
					amount: [{ unit: 'lovelace', quantity: '2000000' }],
					inlineDatum
				}

				const result = isValidTxOutput(output)

				expect(result).toBe(true)
			})
		})

		describe('invalid outputs', () => {
			it('should return false for invalid address', () => {
				const output: TxOutput = {
					address: 'invalid-address',
					amount: [{ unit: 'lovelace', quantity: '2000000' }]
				}

				const result = isValidTxOutput(output)

				expect(result).toBe(false)
			})

			it('should return false for empty address', () => {
				const output: TxOutput = {
					address: '',
					amount: [{ unit: 'lovelace', quantity: '2000000' }]
				}

				const result = isValidTxOutput(output)

				expect(result).toBe(false)
			})

			it('should return false for null amount', () => {
				const output = {
					address: validTestnetAddress,
					amount: null
				} as any

				const result = isValidTxOutput(output)

				expect(result).toBe(false)
			})

			it('should return false for undefined amount', () => {
				const output = {
					address: validTestnetAddress
				} as any

				const result = isValidTxOutput(output)

				expect(result).toBe(false)
			})

			it('should return true for empty amount array (valid edge case)', () => {
				// Empty amount array is technically valid as it creates a WASM output with 0 lovelace
				const output: TxOutput = {
					address: validTestnetAddress,
					amount: []
				}

				const result = isValidTxOutput(output)

				expect(result).toBe(true)
			})

			it('should return false for invalid asset unit', () => {
				const output: TxOutput = {
					address: validTestnetAddress,
					amount: [{ unit: 'invalid', quantity: '100' }]
				}

				const result = isValidTxOutput(output)

				expect(result).toBe(false)
			})

			it('should return false for negative quantity', () => {
				const output: TxOutput = {
					address: validTestnetAddress,
					amount: [{ unit: 'lovelace', quantity: '-1000' }]
				}

				const result = isValidTxOutput(output)

				expect(result).toBe(false)
			})
		})

		describe('edge cases', () => {
			it('should return false for null output', () => {
				const result = isValidTxOutput(null as any)

				expect(result).toBe(false)
			})

			it('should return false for undefined output', () => {
				const result = isValidTxOutput(undefined as any)

				expect(result).toBe(false)
			})

			it('should return false for empty object', () => {
				const result = isValidTxOutput({} as any)

				expect(result).toBe(false)
			})

			it('should handle large lovelace amounts', () => {
				const output: TxOutput = {
					address: validTestnetAddress,
					amount: [{ unit: 'lovelace', quantity: '45000000000000000' }] // 45 million ADA
				}

				const result = isValidTxOutput(output)

				expect(result).toBe(true)
			})

			it('should handle multiple assets', () => {
				const policyId1 = 'a'.repeat(56)
				const policyId2 = 'b'.repeat(56)
				const assetName1 = '746f6b656e31' // "token1"
				const assetName2 = '746f6b656e32' // "token2"

				const output: TxOutput = {
					address: validTestnetAddress,
					amount: [
						{ unit: 'lovelace', quantity: '5000000' },
						{ unit: `${policyId1}${assetName1}`, quantity: '100' },
						{ unit: `${policyId1}${assetName2}`, quantity: '200' },
						{ unit: `${policyId2}${assetName1}`, quantity: '50' }
					]
				}

				const result = isValidTxOutput(output)

				expect(result).toBe(true)
			})
		})
	})
})
