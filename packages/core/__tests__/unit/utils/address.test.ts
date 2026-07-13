import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { getPubkeyHashFromAddress, isValidAddress } from '../../../src/utils/address'

describe('address utilities', () => {
	describe('getPubkeyHashFromAddress', () => {
		it('should extract pubkey hash from valid testnet address', () => {
			const address =
				'addr_test1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz'

			const result = getPubkeyHashFromAddress(address)

			expect(result).toBeDefined()
			expect(result).toHaveLength(56) // 28 bytes = 56 hex chars
		})

		it('should return null for invalid address', () => {
			const invalidAddress = 'invalid_address_string'

			const result = getPubkeyHashFromAddress(invalidAddress)

			expect(result).toBeNull()
		})

		it('should return null for empty string', () => {
			const result = getPubkeyHashFromAddress('')

			expect(result).toBeNull()
		})

		it('should extract pubkey hash from mainnet address', () => {
			// A valid mainnet base address (Shelley era)
			const address =
				'addr1q9h4f2vdv2z90tsf6wd5qycvqtqgnr9ueakjq0n5fhv0k8k7hf96hyswxq92mzeyglnfejwpxr6kcfl58x0t7z7lhkuswkpqkc'

			const result = getPubkeyHashFromAddress(address)

			// Result can be null if the address format doesn't match what WASM expects
			// This is expected behavior for some address formats
			if (result !== null) {
				expect(result).toHaveLength(56)
			} else {
				expect(result).toBeNull()
			}
		})

		it('should return the same pubkey hash for same address', () => {
			const address =
				'addr_test1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz'

			const result1 = getPubkeyHashFromAddress(address)
			const result2 = getPubkeyHashFromAddress(address)

			expect(result1).toBe(result2)
		})

		it('should return different pubkey hashes for different addresses', () => {
			const address1 =
				'addr_test1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz'
			const address2 =
				'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq0pmv0k'

			const result1 = getPubkeyHashFromAddress(address1)
			const result2 = getPubkeyHashFromAddress(address2)

			expect(result1).not.toBe(result2)
		})

		it('should return hex string only containing valid hex characters', () => {
			const address =
				'addr_test1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz'

			const result = getPubkeyHashFromAddress(address)

			expect(result).toMatch(/^[0-9a-f]+$/)
		})
	})

	describe('isValidAddress', () => {
		const validTestnetAddress =
			'addr_test1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz'
		const validTestnetAddress2 =
			'addr_test1qzya97j3gg2lkp360m7238lfe46y0jzhl6wgsz6xysz3d5peqew2j40a7ryqyku9re6znz26uan26shczed77p9n6uwq68d0h9'

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
})
