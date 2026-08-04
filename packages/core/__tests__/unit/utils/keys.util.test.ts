import { describe, it, expect } from 'vitest'
import { cardanoCliKeygen, hydraCliKeygen, genVkey, mnemonicToCliKey } from '../../../src/utils/keys.util'
import { AppWallet } from '../../../src/wallet'
import { CardanoCliWallet } from '../../../src/cardanocli-wallet'
import { NETWORK_ID } from '../../../src/constants'

// Valid unsigned transaction hex for testing signTx (from resolver tests)
const validUnsignedTxHex =
	'84a400d9010281825820a3d36ebe9989d832841c683544a9304d3de3dee218872ca982f7d2770489e01800018282583900e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebfeee790c7bb9c497f716fcec7d92a4d68c27b48c9e301b7c547c653cd1a05f5e1008258390015bc6c82189db95e8eb57107e06b8819b8ddbdb9ae873c8487249825d7ea711f85c8f93a1e1176bac951b6332b0875661c9ffc4547416fc1821a05f34273a1581c0836587ed7cee3c0790e24c930c67f31fc2511a3c25aa66ed205e05fa14474525053192710021a00029e8d075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6ca0f5a0'

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

	describe('mnemonicToCliKey', () => {
		const mnemonic = [
			'error',
			'wrong',
			'law',
			'finger',
			'into',
			'pear',
			'half',
			'wish',
			'assume',
			'east',
			'still',
			'script',
			'promote',
			'tribe',
			'remind',
			'feel',
			'faith',
			'say',
			'universe',
			'garbage',
			'roast',
			'curtain',
			'dance',
			'rug'
		]

		// 128-byte xprv (prv | pub | chaincode) and 64-byte xpub (pub | chaincode)
		const EXPECTED_SK =
			'5880007561c83a67fd860c5ec3c93544171597ad0fc239b929740aad0636d6f0c151f03645ceae6e15c0c3f7c726b40a55999922c5e10830af09b991da72e02ea48401df411c33ee3c03ff24b0b2851c855b078d9371c5c89ec6e9a43df2b179030a8ec959c1316f8a5386468a47010cb059ce7dd009441bd1808e1a835ae37e84c6'
		const EXPECTED_VK =
			'584001df411c33ee3c03ff24b0b2851c855b078d9371c5c89ec6e9a43df2b179030a8ec959c1316f8a5386468a47010cb059ce7dd009441bd1808e1a835ae37e84c6'

		it('should generate a key pair', () => {
			const keyPair = mnemonicToCliKey(mnemonic)

			expect(keyPair).toBeDefined()
			expect(keyPair.sk).toBeDefined()
			expect(keyPair.vk).toBeDefined()
		})

		it('should generate exact known keypair for this mnemonic', () => {
			const keyPair = mnemonicToCliKey(mnemonic)

			expect(keyPair.sk.cborHex).toBe(EXPECTED_SK)
			expect(keyPair.vk.cborHex).toBe(EXPECTED_VK)
		})

		it('should generate signing key with correct type', () => {
			const keyPair = mnemonicToCliKey(mnemonic)

			expect(keyPair.sk.type).toBe('PaymentExtendedSigningKeyShelley_ed25519_bip32')
			expect(keyPair.sk.description).toBe('Payment Signing Key')
		})

		it('should generate verification key with correct type', () => {
			const keyPair = mnemonicToCliKey(mnemonic)

			expect(keyPair.vk.type).toBe('PaymentExtendedVerificationKeyShelley_ed25519_bip32')
			expect(keyPair.vk.description).toBe('Payment Verification Key')
		})

		it('should generate signing key cborHex as a 128-byte xprv', () => {
			const keyPair = mnemonicToCliKey(mnemonic)

			expect(keyPair.sk.cborHex).toMatch(/^5880[0-9a-f]{256}$/i)
		})

		it('should generate verification key cborHex as a 64-byte xpub', () => {
			const keyPair = mnemonicToCliKey(mnemonic)

			expect(keyPair.vk.cborHex).toMatch(/^5840[0-9a-f]{128}$/i)
		})

		it('should embed the public key inside the 128-byte xprv', () => {
			const keyPair = mnemonicToCliKey(mnemonic)

			// xprv = prv (64B) | pub (32B) | chaincode (32B); xpub = pub (32B) | chaincode (32B)
			expect(keyPair.sk.cborHex.slice(4 + 128)).toBe(keyPair.vk.cborHex.slice(4))
		})

		it('should resolve to the same address as the wallet it was derived from', () => {
			const keyPair = mnemonicToCliKey(mnemonic)

			const wallet = new AppWallet({ key: { type: 'mnemonic', words: mnemonic }, networkId: NETWORK_ID.PREPROD })
			const cliWallet = new CardanoCliWallet({
				skey: keyPair.sk.cborHex,
				vkey: keyPair.vk.cborHex,
				networkId: NETWORK_ID.PREPROD
			})

			expect(cliWallet.getAddressBech32()).toBe(wallet.getAccount(0, 0).enterpriseAddressBech32)
		})

		it('should sign identically to the wallet it was derived from', async () => {
			const keyPair = mnemonicToCliKey(mnemonic, 0, 3)

			const wallet = new AppWallet({ key: { type: 'mnemonic', words: mnemonic }, networkId: NETWORK_ID.PREPROD })
			const cliWallet = new CardanoCliWallet({
				skey: keyPair.sk.cborHex,
				vkey: keyPair.vk.cborHex,
				networkId: NETWORK_ID.PREPROD
			})

			expect(await cliWallet.signTx(validUnsignedTxHex)).toBe(await wallet.signTx(validUnsignedTxHex, false, 0, 3))
		})

		it('should round-trip through genVkey', () => {
			const keyPair = mnemonicToCliKey(mnemonic)

			expect(genVkey(keyPair.sk)).toEqual(keyPair.vk)
		})

		it('should generate deterministic key pairs for same mnemonic', () => {
			const keyPair1 = mnemonicToCliKey(mnemonic)
			const keyPair2 = mnemonicToCliKey(mnemonic)

			expect(keyPair1.sk.cborHex).toBe(keyPair2.sk.cborHex)
			expect(keyPair1.vk.cborHex).toBe(keyPair2.vk.cborHex)
		})

		it('should generate different keys for different account indexes', () => {
			const keyPair1 = mnemonicToCliKey(mnemonic, 0)
			const keyPair2 = mnemonicToCliKey(mnemonic, 1)

			expect(keyPair1.sk.cborHex).not.toBe(keyPair2.sk.cborHex)
			expect(keyPair1.vk.cborHex).not.toBe(keyPair2.vk.cborHex)
		})

		it('should generate different keys for different key indexes', () => {
			const keyPair1 = mnemonicToCliKey(mnemonic, 0, 0)
			const keyPair2 = mnemonicToCliKey(mnemonic, 0, 1)

			expect(keyPair1.sk.cborHex).not.toBe(keyPair2.sk.cborHex)
			expect(keyPair1.vk.cborHex).not.toBe(keyPair2.vk.cborHex)
		})

		it('should use default account index 0 when not provided', () => {
			const keyPair1 = mnemonicToCliKey(mnemonic)
			const keyPair2 = mnemonicToCliKey(mnemonic, 0)

			expect(keyPair1.sk.cborHex).toBe(keyPair2.sk.cborHex)
			expect(keyPair1.vk.cborHex).toBe(keyPair2.vk.cborHex)
		})

		it('should use default key index 0 when not provided', () => {
			const keyPair1 = mnemonicToCliKey(mnemonic, 0)
			const keyPair2 = mnemonicToCliKey(mnemonic, 0, 0)

			expect(keyPair1.sk.cborHex).toBe(keyPair2.sk.cborHex)
			expect(keyPair1.vk.cborHex).toBe(keyPair2.vk.cborHex)
		})
	})
})
