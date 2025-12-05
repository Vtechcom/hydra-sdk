import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { isValidAddress, isValidTxOutput } from '../../../src/utils/validator.util'
import { TxOutput } from '../../../src/types/cardano'

describe('validator utilities', () => {
	// Valid test addresses from other tests
	const validTestnetAddress =
		'addr_test1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz'
	const validTestnetAddress2 =
		'addr_test1qzya97j3gg2lkp360m7238lfe46y0jzhl6wgsz6xysz3d5peqew2j40a7ryqyku9re6znz26uan26shczed77p9n6uwq68d0h9'

	describe('isValidAddress', () => {
		describe('bech32 format (default)', () => {
			it('should return true for valid testnet address', () => {
				const result = isValidAddress(validTestnetAddress)

				expect(result).toBe(true)
			})

			it('should return true for another valid testnet address', () => {
				const result = isValidAddress(validTestnetAddress2)

				expect(result).toBe(true)
			})

			it('should return false for invalid bech32 address', () => {
				const result = isValidAddress('invalid-address')

				expect(result).toBe(false)
			})

			it('should return false for empty string', () => {
				const result = isValidAddress('')

				expect(result).toBe(false)
			})

			it('should return false for malformed bech32', () => {
				const result = isValidAddress('addr_test1invalidchecksum')

				expect(result).toBe(false)
			})

			it('should return false for random string', () => {
				const result = isValidAddress('hello world')

				expect(result).toBe(false)
			})

			it('should return false for hex when expecting bech32', () => {
				// This is valid hex but should fail when parsed as bech32
				const hexAddress = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234'
				const result = isValidAddress(hexAddress, 'bech32')

				expect(result).toBe(false)
			})
		})

		describe('hex format', () => {
			it('should return true for valid hex address', () => {
				// Get hex representation from a valid bech32 address
				const addr = CardanoWASM.Address.from_bech32(validTestnetAddress)
				const hexAddress = addr.to_hex()

				const result = isValidAddress(hexAddress, 'hex')

				expect(result).toBe(true)
			})

			it('should return false for invalid hex', () => {
				const result = isValidAddress('not-valid-hex', 'hex')

				expect(result).toBe(false)
			})

			it('should return false for empty hex string', () => {
				const result = isValidAddress('', 'hex')

				expect(result).toBe(false)
			})

			it('should return false for too short hex', () => {
				const result = isValidAddress('abcd', 'hex')

				expect(result).toBe(false)
			})

			it('should return false for bech32 when expecting hex', () => {
				const result = isValidAddress(validTestnetAddress, 'hex')

				expect(result).toBe(false)
			})
		})

		describe('bytes format', () => {
			it('should return true for valid address bytes', () => {
				const addr = CardanoWASM.Address.from_bech32(validTestnetAddress)
				const bytes = addr.to_bytes()

				const result = isValidAddress(bytes, 'bytes')

				expect(result).toBe(true)
			})

			it('should return false for empty bytes', () => {
				const emptyBytes = new Uint8Array([])

				const result = isValidAddress(emptyBytes, 'bytes')

				expect(result).toBe(false)
			})

			it('should return false for random bytes', () => {
				const randomBytes = new Uint8Array([1, 2, 3, 4, 5])

				const result = isValidAddress(randomBytes, 'bytes')

				expect(result).toBe(false)
			})

			it('should return false for malformed bytes', () => {
				// Create bytes that don't form a valid address
				const malformedBytes = new Uint8Array(57).fill(0xff)

				const result = isValidAddress(malformedBytes, 'bytes')

				expect(result).toBe(false)
			})
		})

		describe('invalid type parameter', () => {
			it('should return false for unknown type', () => {
				// @ts-expect-error Testing invalid type
				const result = isValidAddress(validTestnetAddress, 'unknown')

				expect(result).toBe(false)
			})
		})

		describe('edge cases', () => {
			it('should return false for null-like values', () => {
				expect(isValidAddress(null)).toBe(false)
				expect(isValidAddress(undefined)).toBe(false)
			})

			it('should return false for number input', () => {
				// @ts-expect-error Testing number input
				const result = isValidAddress(12345)

				expect(result).toBe(false)
			})

			it('should return false for object input', () => {
				// @ts-expect-error Testing object input
				const result = isValidAddress({ address: validTestnetAddress })

				expect(result).toBe(false)
			})

			it('should handle very long strings gracefully', () => {
				const longString = 'a'.repeat(10000)
				const result = isValidAddress(longString)

				expect(result).toBe(false)
			})
		})
	})

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
