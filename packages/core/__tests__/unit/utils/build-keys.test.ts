import { describe, it, expect } from 'vitest'
import {
	buildBaseAddress,
	buildEnterpriseAddress,
	buildRewardAddress,
	buildKeys,
	clampScalar,
	stripExtendedKey,
	Purpose,
	CoinTypes,
	ChainDerivation
} from '../../../src/utils/cardano-wasm/build-keys'
import { NETWORK_ID } from '../../../src/constants/chain'

const mockWallet = {
	mnemonic:
		'member genius submit circle suggest square ivory stem evidence snow rack festival faculty recipe amazing cliff warrior mistake screen humor chat night glad weather',
	baseAddressBech32:
		'addr_test1qzya97j3gg2lkp360m7238lfe46y0jzhl6wgsz6xysz3d5peqew2j40a7ryqyku9re6znz26uan26shczed77p9n6uwq68d0h9',
	paymentKeyHex:
		'885edd05a70aabe1799e01f5a2fac7f6a529a7b8d0b87a43b34ae7797cf3a957ffda50ec3ee078f498fe4919589dca8bc198eb2dd691e3cba9c50b93792487ff',
	paymentCredentialHash: '89d2fa514215fb063a7efca89fe9cd7447c857fe9c880b46240516d0'
}

const mockData = {
	rootKey:
		'c8c43af6f30ea454465017f832cdf8769cd1f1391e476cba06ae4e417066e044aae2a86c09f07719c207ae4fae5eb34f30606fdb06160d85d2aad69e1691b5bf0eab7a1f7de8b17df42d33fc3a27c3b43828405310164ad4fc8c5741dea298c8',
	address: 'addr_test1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz'
}

describe('Build Keys Utils', () => {
	describe('buildBaseAddress', () => {
		it('should build a base address from payment and stake key hashes', () => {
			const keys = buildKeys(mockData.rootKey, 0, 0)
			const paymentKeyHash = keys.paymentKey.to_public().to_raw_key().hash()
			const stakeKeyHash = keys.stakeKey.to_public().to_raw_key().hash()

			const result = buildBaseAddress(NETWORK_ID.PREPROD, paymentKeyHash, stakeKeyHash)

			expect(result).toBeDefined()
			expect(result.to_address().to_bech32()).toMatch(/^addr_test/)
		})

		it('should create different addresses for different network IDs', () => {
			const keys = buildKeys(mockData.rootKey, 0, 0)
			const paymentKeyHash = keys.paymentKey.to_public().to_raw_key().hash()
			const stakeKeyHash = keys.stakeKey.to_public().to_raw_key().hash()

			const testnetAddr = buildBaseAddress(NETWORK_ID.PREPROD, paymentKeyHash, stakeKeyHash)
			const mainnetAddr = buildBaseAddress(NETWORK_ID.MAINNET, paymentKeyHash, stakeKeyHash)

			expect(testnetAddr.to_address().to_bech32()).toMatch(/^addr_test/)
			expect(mainnetAddr.to_address().to_bech32()).toMatch(/^addr1/)
		})
	})

	describe('buildEnterpriseAddress', () => {
		it('should build an enterprise address from payment key hash', () => {
			const keys = buildKeys(mockData.rootKey, 0, 0)
			const paymentKeyHash = keys.paymentKey.to_public().to_raw_key().hash()

			const result = buildEnterpriseAddress(NETWORK_ID.PREPROD, paymentKeyHash)

			expect(result).toBeDefined()
			expect(result.to_address().to_bech32()).toMatch(/^addr_test/)
		})

		it('should create mainnet enterprise address', () => {
			const keys = buildKeys(mockData.rootKey, 0, 0)
			const paymentKeyHash = keys.paymentKey.to_public().to_raw_key().hash()

			const result = buildEnterpriseAddress(NETWORK_ID.MAINNET, paymentKeyHash)

			expect(result.to_address().to_bech32()).toMatch(/^addr1/)
		})
	})

	describe('buildRewardAddress', () => {
		it('should build a reward address from stake key hash', () => {
			const keys = buildKeys(mockData.rootKey, 0, 0)
			const stakeKeyHash = keys.stakeKey.to_public().to_raw_key().hash()

			const result = buildRewardAddress(NETWORK_ID.PREPROD, stakeKeyHash)

			expect(result).toBeDefined()
			expect(result.to_address().to_bech32()).toMatch(/^stake_test/)
		})

		it('should create mainnet reward address', () => {
			const keys = buildKeys(mockData.rootKey, 0, 0)
			const stakeKeyHash = keys.stakeKey.to_public().to_raw_key().hash()

			const result = buildRewardAddress(NETWORK_ID.MAINNET, stakeKeyHash)

			expect(result.to_address().to_bech32()).toMatch(/^stake1/)
		})
	})

	describe('buildKeys', () => {
		it('should derive keys from root private key hex', () => {
			const result = buildKeys(mockData.rootKey, 0, 0)

			expect(result.accountKey).toBeDefined()
			expect(result.paymentKey).toBeDefined()
			expect(result.stakeKey).toBeDefined()
			expect(result.dRepKey).toBeDefined()
		})

		it('should derive different keys for different account indices', () => {
			const keys0 = buildKeys(mockData.rootKey, 0, 0)
			const keys1 = buildKeys(mockData.rootKey, 1, 0)

			expect(keys0.accountKey.to_hex()).not.toBe(keys1.accountKey.to_hex())
			expect(keys0.paymentKey.to_hex()).not.toBe(keys1.paymentKey.to_hex())
			expect(keys0.stakeKey.to_hex()).not.toBe(keys1.stakeKey.to_hex())
		})

		it('should derive different keys for different key indices', () => {
			const keys0 = buildKeys(mockData.rootKey, 0, 0)
			const keys1 = buildKeys(mockData.rootKey, 0, 1)

			expect(keys0.paymentKey.to_hex()).not.toBe(keys1.paymentKey.to_hex())
			expect(keys0.stakeKey.to_hex()).not.toBe(keys1.stakeKey.to_hex())
		})

		it('should handle array of private keys (split keys)', () => {
			// Use Bip32PrivateKey format (96 bytes = 192 hex chars)
			const keys = buildKeys(mockData.rootKey, 0, 0)
			const paymentKeyHex = keys.paymentKey.to_hex()
			const stakeKeyHex = keys.stakeKey.to_hex()

			const result = buildKeys([paymentKeyHex, stakeKeyHex], 0, 0)

			expect(result.accountKey).toBeDefined()
			expect(result.paymentKey).toBeDefined()
			expect(result.stakeKey).toBeDefined()
			expect(result.dRepKey).toBeUndefined()
		})

		it('should produce consistent results for same input', () => {
			const keys1 = buildKeys(mockData.rootKey, 0, 0)
			const keys2 = buildKeys(mockData.rootKey, 0, 0)

			expect(keys1.paymentKey.to_hex()).toBe(keys2.paymentKey.to_hex())
			expect(keys1.stakeKey.to_hex()).toBe(keys2.stakeKey.to_hex())
		})
	})

	describe('clampScalar', () => {
		it('should clamp scalar according to Ed25519 rules', () => {
			const scalar = Buffer.alloc(32, 0xff) // All bits set
			const result = clampScalar(scalar)

			// First byte: lowest 3 bits should be 0
			expect(result[0]! & 0b0000_0111).toBe(0)

			// Last byte: highest 2 bits should be 01
			expect(result[31]! & 0b1110_0000).toBe(0b0100_0000)
		})

		it('should not modify middle bytes', () => {
			const scalar = Buffer.alloc(32)
			scalar.fill(0xab, 1, 31) // Fill middle bytes
			const originalMiddle = Buffer.from(scalar.subarray(1, 31))

			const result = clampScalar(scalar)

			expect(result.subarray(1, 31)).toEqual(originalMiddle)
		})

		it('should handle zero buffer', () => {
			const scalar = Buffer.alloc(32, 0)
			const result = clampScalar(scalar)

			expect(result[0]).toBe(0)
			expect(result[31]).toBe(0b0100_0000) // Second highest bit set
		})
	})

	describe('stripExtendedKey', () => {
		it('should strip extended key to 128 hex characters', () => {
			const extendedKey = 'a'.repeat(192) // 96 bytes = 192 hex chars
			const result = stripExtendedKey(extendedKey)

			expect(result).toHaveLength(128)
			expect(result).toBe('a'.repeat(128))
		})

		it('should throw error for invalid length', () => {
			const shortKey = 'a'.repeat(100)
			expect(() => stripExtendedKey(shortKey)).toThrow('Extended key must be 192 hex characters (96 bytes)')

			const longKey = 'a'.repeat(200)
			expect(() => stripExtendedKey(longKey)).toThrow('Extended key must be 192 hex characters (96 bytes)')
		})

		it('should preserve first 128 hex characters of extended key', () => {
			const first64Bytes = 'ab'.repeat(64) // 128 hex chars
			const last32Bytes = 'cd'.repeat(32) // 64 hex chars
			const extendedKey = first64Bytes + last32Bytes

			const result = stripExtendedKey(extendedKey)

			expect(result).toBe(first64Bytes)
		})
	})

	describe('Enums', () => {
		it('should have correct Purpose values', () => {
			expect(Purpose.CIP1852).toBe(1852)
		})

		it('should have correct CoinTypes values', () => {
			expect(CoinTypes.CARDANO).toBe(1815)
		})

		it('should have correct ChainDerivation values', () => {
			expect(ChainDerivation.EXTERNAL).toBe(0)
			expect(ChainDerivation.INTERNAL).toBe(1)
			expect(ChainDerivation.CHIMERIC).toBe(2)
			expect(ChainDerivation.DREP).toBe(3)
		})
	})
})
