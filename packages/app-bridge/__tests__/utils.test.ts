import { describe, it, expect } from 'vitest'
import {
	toHexPayload,
	fromHexPayload,
	lovelaceToAda,
	adaToLovelace,
	decodeJwtPayload,
	isJwtExpired,
	cardanoHexToBech32,
	formatShortAddress
} from '../src/utils'

describe('Utility Functions', () => {
	describe('toHexPayload', () => {
		it('should encode plain text to hex', () => {
			expect(toHexPayload('hello')).toBe('68656c6c6f')
		})

		it('should preserve valid hex strings', () => {
			expect(toHexPayload('68656c6c6f00')).toBe('68656c6c6f00')
		})

		it('should strip 0x prefix from valid hex strings', () => {
			expect(toHexPayload('0x68656c6c6f00')).toBe('68656c6c6f00')
			expect(toHexPayload('0X1234abcd')).toBe('1234abcd')
		})

		it('should handle empty input', () => {
			expect(toHexPayload('')).toBe('')
		})
	})

	describe('fromHexPayload', () => {
		it('should decode valid hex to string', () => {
			expect(fromHexPayload('68656c6c6f')).toBe('hello')
		})

		it('should fallback to input when hex length is odd', () => {
			expect(fromHexPayload('68656c6c6')).toBe('68656c6c6')
		})

		it('should fallback to input when string contains non-hex characters', () => {
			expect(fromHexPayload('zzzz')).toBe('zzzz')
			expect(fromHexPayload('12zz')).toBe('12zz')
		})
	})

	describe('lovelaceToAda and adaToLovelace', () => {
		it('should convert Lovelace to ADA', () => {
			expect(lovelaceToAda(1_000_000n)).toBe(1)
			expect(lovelaceToAda('5500000')).toBe(5.5)
			expect(lovelaceToAda(0)).toBe(0)
		})

		it('should convert ADA to Lovelace BigInt', () => {
			expect(adaToLovelace(1)).toBe(1_000_000n)
			expect(adaToLovelace(5.5)).toBe(5_500_000n)
			expect(adaToLovelace('10.25')).toBe(10_250_000n)
			expect(adaToLovelace('invalid')).toBe(0n)
		})
	})

	describe('decodeJwtPayload and isJwtExpired', () => {
		// Base64URL string without padding: {"sub":"user_123","exp":1700000000} -> eyJzdWIiOiJ1c2VyXzEyMyIsImV4cCI6MTcwMDAwMDAwMH0 (length 39 -> 39 % 4 = 3, needs 1 pad)
		const payload = { sub: 'user_123', exp: 1700000000 }
		const base64UrlPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
		const mockJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${base64UrlPayload}.mock_sig`

		it('should decode JWT payload correctly even without Base64 padding', () => {
			const decoded = decodeJwtPayload<{ sub: string; exp: number }>(mockJwt)
			expect(decoded).not.toBeNull()
			expect(decoded?.sub).toBe('user_123')
			expect(decoded?.exp).toBe(1700000000)
		})

		it('should detect expired token', () => {
			// 1700000000 is in the past (Nov 2023)
			expect(isJwtExpired(mockJwt)).toBe(true)
		})

		it('should detect valid non-expired token', () => {
			const futureExp = Math.floor(Date.now() / 1000) + 3600
			const futurePayload = Buffer.from(JSON.stringify({ sub: 'user_456', exp: futureExp })).toString('base64url')
			const futureJwt = `eyJhbGciOiJIUzI1NiJ9.${futurePayload}.sig`

			expect(isJwtExpired(futureJwt)).toBe(false)
		})

		it('should return false for non-JWT strings or tokens without exp', () => {
			expect(isJwtExpired('opaque_token_string')).toBe(false)
			expect(isJwtExpired('')).toBe(false)
		})
	})

	describe('cardanoHexToBech32', () => {
		it('should preserve already valid Bech32 addresses', () => {
			const bech32 = 'addr_test1qz2fxv2um5tjaq62synchronizedaddress123'
			expect(cardanoHexToBech32(bech32)).toBe(bech32)
		})

		it('should convert testnet address CBOR hex to addr_test1... Bech32', () => {
			// Testnet Enterprise address header byte 0x60 (enterprise testnet: type 6, net 0) + 28 bytes keyhash
			const testnetHex = '60' + '00'.repeat(28)
			const res = cardanoHexToBech32(testnetHex)
			expect(res.startsWith('addr_test1')).toBe(true)
		})

		it('should convert mainnet address CBOR hex to addr1... Bech32', () => {
			// Mainnet Enterprise address header byte 0x61 (enterprise mainnet: type 6, net 1) + 28 bytes keyhash
			const mainnetHex = '61' + '00'.repeat(28)
			const res = cardanoHexToBech32(mainnetHex)
			expect(res.startsWith('addr1')).toBe(true)
		})

		it('should convert reward address CBOR hex to stake1... or stake_test1... Bech32', () => {
			const testnetStakeHex = 'e0' + '00'.repeat(28)
			expect(cardanoHexToBech32(testnetStakeHex).startsWith('stake_test1')).toBe(true)

			const mainnetStakeHex = 'e1' + '00'.repeat(28)
			expect(cardanoHexToBech32(mainnetStakeHex).startsWith('stake1')).toBe(true)
		})
	})

	describe('formatShortAddress', () => {
		it('should format long addresses with ellipsis', () => {
			const addr = 'addr_test1qz2fxv2um5tjaq62synchronizedaddress123'
			expect(formatShortAddress(addr, 8, 6)).toBe('addr_tes...ess123')
		})

		it('should return short string as-is', () => {
			expect(formatShortAddress('addr_short')).toBe('addr_short')
			expect(formatShortAddress('')).toBe('')
		})
	})
})
