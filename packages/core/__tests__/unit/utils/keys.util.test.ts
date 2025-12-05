import { describe, it, expect } from 'vitest'
import { cardanoCliKeygen, hydraCliKeygen, genVkey, CardanoCLiSkey, CardanoCLiVkey } from '../../../src/utils/keys.util'

describe('keys.util', () => {
	describe('cardanoCliKeygen', () => {
		it('should generate a key pair', () => {
			const keyPair = cardanoCliKeygen()

			expect(keyPair).toBeDefined()
			expect(keyPair.sk).toBeDefined()
			expect(keyPair.vk).toBeDefined()
		})

		it('should generate signing key with correct type', () => {
			const keyPair = cardanoCliKeygen()

			expect(keyPair.sk.type).toBe('PaymentSigningKeyShelley_ed25519')
			expect(keyPair.sk.description).toBe('Payment Signing Key')
		})

		it('should generate verification key with correct type', () => {
			const keyPair = cardanoCliKeygen()

			expect(keyPair.vk.type).toBe('PaymentVerificationKeyShelley_ed25519')
			expect(keyPair.vk.description).toBe('Payment Verification Key')
		})

		it('should generate signing key cborHex starting with 5820', () => {
			const keyPair = cardanoCliKeygen()

			expect(keyPair.sk.cborHex).toMatch(/^5820[0-9a-f]{64}$/i)
		})

		it('should generate verification key cborHex starting with 5820', () => {
			const keyPair = cardanoCliKeygen()

			expect(keyPair.vk.cborHex).toMatch(/^5820[0-9a-f]{64}$/i)
		})

		it('should generate unique key pairs', () => {
			const keyPair1 = cardanoCliKeygen()
			const keyPair2 = cardanoCliKeygen()

			expect(keyPair1.sk.cborHex).not.toBe(keyPair2.sk.cborHex)
			expect(keyPair1.vk.cborHex).not.toBe(keyPair2.vk.cborHex)
		})

		it('should generate signing key with 32 bytes (64 hex chars) after prefix', () => {
			const keyPair = cardanoCliKeygen()

			// 5820 prefix + 64 hex chars = 68 total chars
			expect(keyPair.sk.cborHex.length).toBe(68)
		})

		it('should generate verification key with 32 bytes (64 hex chars) after prefix', () => {
			const keyPair = cardanoCliKeygen()

			// 5820 prefix + 64 hex chars = 68 total chars
			expect(keyPair.vk.cborHex.length).toBe(68)
		})
	})

	describe('hydraCliKeygen', () => {
		it('should generate a key pair', () => {
			const keyPair = hydraCliKeygen()

			expect(keyPair).toBeDefined()
			expect(keyPair.sk).toBeDefined()
			expect(keyPair.vk).toBeDefined()
		})

		it('should generate signing key with Hydra type', () => {
			const keyPair = hydraCliKeygen()

			expect(keyPair.sk.type).toBe('HydraSigningKey_ed25519')
			expect(keyPair.sk.description).toBe('')
		})

		it('should generate verification key with Hydra type', () => {
			const keyPair = hydraCliKeygen()

			expect(keyPair.vk.type).toBe('HydraVerificationKey_ed25519')
			expect(keyPair.vk.description).toBe('')
		})

		it('should generate signing key cborHex starting with 5820', () => {
			const keyPair = hydraCliKeygen()

			expect(keyPair.sk.cborHex).toMatch(/^5820[0-9a-f]{64}$/i)
		})

		it('should generate verification key cborHex starting with 5820', () => {
			const keyPair = hydraCliKeygen()

			expect(keyPair.vk.cborHex).toMatch(/^5820[0-9a-f]{64}$/i)
		})

		it('should generate unique key pairs', () => {
			const keyPair1 = hydraCliKeygen()
			const keyPair2 = hydraCliKeygen()

			expect(keyPair1.sk.cborHex).not.toBe(keyPair2.sk.cborHex)
			expect(keyPair1.vk.cborHex).not.toBe(keyPair2.vk.cborHex)
		})
	})

	describe('genVkey', () => {
		it('should generate verification key from signing key', () => {
			const keyPair = cardanoCliKeygen()
			const generatedVkey = genVkey(keyPair.sk)

			expect(generatedVkey).toBeDefined()
			expect(generatedVkey.type).toBe('PaymentVerificationKeyShelley_ed25519')
			expect(generatedVkey.description).toBe('Payment Verification Key')
		})

		it('should generate same verification key as original key pair', () => {
			const keyPair = cardanoCliKeygen()
			const generatedVkey = genVkey(keyPair.sk)

			expect(generatedVkey.cborHex).toBe(keyPair.vk.cborHex)
		})

		it('should generate verification key cborHex starting with 5820', () => {
			const keyPair = cardanoCliKeygen()
			const generatedVkey = genVkey(keyPair.sk)

			expect(generatedVkey.cborHex).toMatch(/^5820[0-9a-f]{64}$/i)
		})

		it('should accept minimal skey object with only cborHex', () => {
			const keyPair = cardanoCliKeygen()
			const minimalSkey = { cborHex: keyPair.sk.cborHex }

			const generatedVkey = genVkey(minimalSkey)

			expect(generatedVkey.cborHex).toBe(keyPair.vk.cborHex)
		})

		it('should work with Hydra signing key', () => {
			const keyPair = hydraCliKeygen()
			const generatedVkey = genVkey({ cborHex: keyPair.sk.cborHex })

			// Should match the vkey generated during keygen
			expect(generatedVkey.cborHex).toBe(keyPair.vk.cborHex)
		})

		it('should generate 32 byte verification key', () => {
			const keyPair = cardanoCliKeygen()
			const generatedVkey = genVkey(keyPair.sk)

			// 5820 prefix (4 chars) + 64 hex chars = 68 total
			expect(generatedVkey.cborHex.length).toBe(68)
		})

		it('should produce deterministic results for same input', () => {
			const keyPair = cardanoCliKeygen()
			const vkey1 = genVkey(keyPair.sk)
			const vkey2 = genVkey(keyPair.sk)

			expect(vkey1.cborHex).toBe(vkey2.cborHex)
		})
	})

	describe('key format compatibility', () => {
		it('cardano-cli keys should be interchangeable with genVkey', () => {
			// Generate a Cardano CLI key pair
			const keyPair = cardanoCliKeygen()

			// Extract just the raw private key bytes (after 5820 prefix)
			const skRaw = keyPair.sk.cborHex.slice(4)
			expect(skRaw.length).toBe(64) // 32 bytes = 64 hex chars

			// Generate vkey from skey
			const regeneratedVkey = genVkey(keyPair.sk)

			// Should match original
			expect(regeneratedVkey.cborHex).toBe(keyPair.vk.cborHex)
		})

		it('hydra keys should follow same format as cardano-cli', () => {
			const cardanoKeys = cardanoCliKeygen()
			const hydraKeys = hydraCliKeygen()

			// Same CBOR prefix
			expect(cardanoKeys.sk.cborHex.slice(0, 4)).toBe(hydraKeys.sk.cborHex.slice(0, 4))
			expect(cardanoKeys.vk.cborHex.slice(0, 4)).toBe(hydraKeys.vk.cborHex.slice(0, 4))

			// Same key lengths
			expect(cardanoKeys.sk.cborHex.length).toBe(hydraKeys.sk.cborHex.length)
			expect(cardanoKeys.vk.cborHex.length).toBe(hydraKeys.vk.cborHex.length)
		})

		it('signing keys should only contain valid hex characters', () => {
			const keyPair = cardanoCliKeygen()

			expect(keyPair.sk.cborHex).toMatch(/^[0-9a-f]+$/i)
			expect(keyPair.vk.cborHex).toMatch(/^[0-9a-f]+$/i)
		})
	})
})
