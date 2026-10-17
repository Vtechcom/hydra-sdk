import { describe, it, expect } from 'vitest'
import {
	toHexPayload,
	fromHexPayload,
	lovelaceToAda,
	adaToLovelace,
	decodeJwtPayload,
	isJwtExpired,
	cardanoHexToBech32,
	formatShortAddress,
	parseUtxoAssets
} from '../../src/utils'

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
			expect(isJwtExpired(`h.${Buffer.from('{"sub":"x"}').toString('base64url')}.s`)).toBe(false)
		})

		it('treats a token expiring within the skew window as expired', () => {
			const exp = Math.floor(Date.now() / 1000) + 5
			const token = `h.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.s`
			expect(isJwtExpired(token)).toBe(true) // default skew 10s
			expect(isJwtExpired(token, 0)).toBe(false)
		})

		it('decodes a UTF-8 payload and returns null for a malformed one', () => {
			const token = `h.${Buffer.from(JSON.stringify({ name: 'Hà Nội' })).toString('base64url')}.s`
			expect(decodeJwtPayload(token)).toEqual({ name: 'Hà Nội' })
			expect(decodeJwtPayload('h.not-json.s')).toBeNull()
			expect(decodeJwtPayload('single-part')).toBeNull()
		})
	})

	describe('cardanoHexToBech32', () => {
		// Expected values are CSL's canonical encoding, generated with
		// cardano-serialization-lib-nodejs 15: Address.from_hex(hex).to_bech32().
		// The first row is a real preprod base address; the others use 0x1c… key
		// hashes and 0x2d… script hashes to cover each header type and network.
		it.each([
			[
				'base key/key, testnet',
				'00e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebfeee790c7bb9c497f716fcec7d92a4d68c27b48c9e301b7c547c653cd',
				'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
			],
			[
				'base key/key, mainnet',
				'01' + '1c'.repeat(28) + '2d'.repeat(28),
				'addr1qywpc8qurswpc8qurswpc8qurswpc8qurswpc8qurswpc8pd95kj6tfd95kj6tfd95kj6tfd95kj6tfd95kj6tfd95ksp90chn'
			],
			[
				'base script/key, testnet',
				'10' + '2d'.repeat(28) + '1c'.repeat(28),
				'addr_test1zqkj6tfd95kj6tfd95kj6tfd95kj6tfd95kj6tfd95kj6tgurswpc8qurswpc8qurswpc8qurswpc8qurswpc8qurswqafxc96'
			],
			[
				'pointer, mainnet',
				'41' + '1c'.repeat(28) + '010203',
				'addr1gywpc8qurswpc8qurswpc8qurswpc8qurswpc8qurswpc8qpqgpswftg3y'
			],
			['enterprise, testnet', '60' + '1c'.repeat(28), 'addr_test1vqwpc8qurswpc8qurswpc8qurswpc8qurswpc8qurswpc8q7jqrjh'],
			['enterprise script, mainnet', '71' + '2d'.repeat(28), 'addr1wykj6tfd95kj6tfd95kj6tfd95kj6tfd95kj6tfd95kj6tg8hedks'],
			['reward, testnet', 'e0' + '1c'.repeat(28), 'stake_test1uqwpc8qurswpc8qurswpc8qurswpc8qurswpc8qurswpc8q767m9a'],
			['reward script, mainnet', 'f1' + '2d'.repeat(28), 'stake17ykj6tfd95kj6tfd95kj6tfd95kj6tfd95kj6tfd95kj6tgmaet2z']
		])('%s matches the canonical bech32', (_name, hex, bech32) => {
			expect(cardanoHexToBech32(hex)).toBe(bech32)
			expect(cardanoHexToBech32(hex.toUpperCase())).toBe(bech32)
		})

		it.each([
			['an addr_test1 bech32', 'addr_test1vqwpc8qurswpc8qurswpc8qurswpc8qurswpc8qurswpc8q7jqrjh'],
			['a stake1 bech32', 'stake17ykj6tfd95kj6tfd95kj6tfd95kj6tfd95kj6tfd95kj6tgmaet2z'],
			['odd-length hex', '601'],
			['non-hex text', 'not-an-address'],
			['an empty string', '']
		])('returns %s unchanged', (_name, input) => {
			expect(cardanoHexToBech32(input)).toBe(input)
		})
	})

	describe('parseUtxoAssets', () => {
		it('sums lovelace and native assets across the list and map UTxO shapes', () => {
			const res = parseUtxoAssets([
				{
					output: {
						amount: [
							{ unit: 'lovelace', quantity: '1500000' },
							{ unit: 'pol.tok', quantity: '2' }
						]
					}
				},
				{ amount: [{ unit: 'pol.tok', quantity: '3' }, { quantity: '500000' }] }, // missing unit = lovelace
				{ amount: { lovelace: 1000000, 'pol.other': '7', bad: 'x' } }, // 'bad' is skipped
				null,
				'garbage'
			])
			expect(res).toEqual({
				assets: [
					{ unit: 'lovelace', quantity: '3000000' },
					{ unit: 'pol.tok', quantity: '5' },
					{ unit: 'pol.other', quantity: '7' }
				],
				totalLovelace: 3000000n,
				balanceADA: 3
			})
		})

		it.each([null, undefined, []])('returns an empty balance for %s', input => {
			expect(parseUtxoAssets(input as any)).toEqual({ assets: [], totalLovelace: 0n, balanceADA: 0 })
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
