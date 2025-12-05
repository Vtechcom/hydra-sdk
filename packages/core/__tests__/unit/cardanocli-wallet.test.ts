import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { CardanoCliWallet } from '../../src/cardanocli-wallet'
import { NETWORK_ID } from '../../src/constants'
import { cardanoCliKeygen } from '../../src/utils/keys.util'
import { UTxO } from '../../src/types/cardano'

// Generate a test key pair
const testKeyPair = cardanoCliKeygen()
const testSkey = testKeyPair.sk.cborHex as `5820${string}`
const testVkey = testKeyPair.vk.cborHex as `5820${string}`

// Valid unsigned transaction hex for testing signTx (from resolver tests)
const validUnsignedTxHex =
	'84a400d9010281825820a3d36ebe9989d832841c683544a9304d3de3dee218872ca982f7d2770489e01800018282583900e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebfeee790c7bb9c497f716fcec7d92a4d68c27b48c9e301b7c547c653cd1a05f5e1008258390015bc6c82189db95e8eb57107e06b8819b8ddbdb9ae873c8487249825d7ea711f85c8f93a1e1176bac951b6332b0875661c9ffc4547416fc1821a05f34273a1581c0836587ed7cee3c0790e24c930c67f31fc2511a3c25aa66ed205e05fa14474525053192710021a00029e8d075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6ca0f5a0'

// Mock fetcher and submitter
const mockFetcher = {
	fetchAddressUTxOs: vi.fn()
}

const mockSubmitter = {
	submitTx: vi.fn()
}

describe('CardanoCliWallet', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('constructor', () => {
		it('should create wallet with required options', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey
			})

			expect(wallet).toBeDefined()
			expect(wallet).toBeInstanceOf(CardanoCliWallet)
		})

		it('should default to MAINNET network ID', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey
			})

			expect(wallet.getNetworkId()).toBe(NETWORK_ID.MAINNET)
		})

		it('should use provided network ID (PREPROD)', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				networkId: NETWORK_ID.PREPROD
			})

			expect(wallet.getNetworkId()).toBe(NETWORK_ID.PREPROD)
		})

		it('should use provided network ID (PREVIEW)', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				networkId: NETWORK_ID.PREVIEW
			})

			expect(wallet.getNetworkId()).toBe(NETWORK_ID.PREVIEW)
		})

		it('should accept fetcher option', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				fetcher: mockFetcher
			})

			expect(wallet).toBeDefined()
		})

		it('should accept submitter option', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				submitter: mockSubmitter
			})

			expect(wallet).toBeDefined()
		})
	})

	describe('getAddressBech32', () => {
		it('should return a valid bech32 address for preprod (testnet)', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				networkId: NETWORK_ID.PREPROD
			})

			const address = wallet.getAddressBech32()

			expect(address).toBeDefined()
			// PREPROD network ID (0) produces addr_test prefix
			expect(address).toMatch(/^addr_test1/)
		})

		it('should return a valid bech32 address for mainnet', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				networkId: NETWORK_ID.MAINNET
			})

			const address = wallet.getAddressBech32()

			expect(address).toBeDefined()
			expect(address).toMatch(/^addr1/)
		})

		it('should return consistent address for same keys', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				networkId: NETWORK_ID.PREPROD
			})

			const address1 = wallet.getAddressBech32()
			const address2 = wallet.getAddressBech32()

			expect(address1).toBe(address2)
		})

		it('should return different addresses for different keys', () => {
			const keyPair1 = cardanoCliKeygen()
			const keyPair2 = cardanoCliKeygen()

			const wallet1 = new CardanoCliWallet({
				skey: keyPair1.sk.cborHex as `5820${string}`,
				vkey: keyPair1.vk.cborHex as `5820${string}`,
				networkId: NETWORK_ID.PREPROD
			})

			const wallet2 = new CardanoCliWallet({
				skey: keyPair2.sk.cborHex as `5820${string}`,
				vkey: keyPair2.vk.cborHex as `5820${string}`,
				networkId: NETWORK_ID.PREPROD
			})

			expect(wallet1.getAddressBech32()).not.toBe(wallet2.getAddressBech32())
		})

		it('should return parseable address', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				networkId: NETWORK_ID.PREPROD
			})

			const address = wallet.getAddressBech32()
			const parsedAddress = CardanoWASM.Address.from_bech32(address)

			expect(parsedAddress).toBeDefined()
			expect(parsedAddress.to_bech32()).toBe(address)
		})
	})

	describe('getNetworkId', () => {
		it('should return MAINNET by default', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey
			})

			expect(wallet.getNetworkId()).toBe(NETWORK_ID.MAINNET)
		})

		it('should return PREPROD when configured', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				networkId: NETWORK_ID.PREPROD
			})

			expect(wallet.getNetworkId()).toBe(NETWORK_ID.PREPROD)
		})

		it('should return custom network ID', () => {
			const customNetworkId = 2

			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				networkId: customNetworkId
			})

			expect(wallet.getNetworkId()).toBe(customNetworkId)
		})
	})

	describe('paymentSKey', () => {
		it('should return a PrivateKey instance', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey
			})

			const privateKey = wallet.paymentSKey

			expect(privateKey).toBeDefined()
			expect(privateKey).toBeInstanceOf(CardanoWASM.PrivateKey)
		})

		it('should return key with correct hex (without 5820 prefix)', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey
			})

			const privateKey = wallet.paymentSKey
			const expectedHex = testSkey.slice(4) // Remove 5820 prefix

			expect(privateKey.to_hex()).toBe(expectedHex)
		})

		it('should be able to sign data', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey
			})

			const privateKey = wallet.paymentSKey
			const message = new Uint8Array([1, 2, 3, 4, 5])
			const signature = privateKey.sign(message)

			expect(signature).toBeDefined()
			expect(signature.to_hex()).toHaveLength(128) // ed25519 signature is 64 bytes = 128 hex chars
		})
	})

	describe('paymentVKey', () => {
		it('should return a PublicKey instance', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey
			})

			const publicKey = wallet.paymentVKey

			expect(publicKey).toBeDefined()
			expect(publicKey).toBeInstanceOf(CardanoWASM.PublicKey)
		})

		it('should return key with correct hex (without 5820 prefix)', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey
			})

			const publicKey = wallet.paymentVKey
			const expectedHex = testVkey.slice(4) // Remove 5820 prefix

			expect(publicKey.to_hex()).toBe(expectedHex)
		})

		it('should be able to verify signatures from paymentSKey', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey
			})

			const privateKey = wallet.paymentSKey
			const publicKey = wallet.paymentVKey
			const message = new Uint8Array([1, 2, 3, 4, 5])
			const signature = privateKey.sign(message)

			const isValid = publicKey.verify(message, signature)

			expect(isValid).toBe(true)
		})

		it('should fail verification with wrong message', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey
			})

			const privateKey = wallet.paymentSKey
			const publicKey = wallet.paymentVKey
			const message = new Uint8Array([1, 2, 3, 4, 5])
			const wrongMessage = new Uint8Array([5, 4, 3, 2, 1])
			const signature = privateKey.sign(message)

			const isValid = publicKey.verify(wrongMessage, signature)

			expect(isValid).toBe(false)
		})
	})

	describe('signTx', () => {
		it('should sign an unsigned transaction', async () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				networkId: NETWORK_ID.PREPROD
			})

			const signedTx = await wallet.signTx(validUnsignedTxHex)

			expect(signedTx).toBeDefined()
			expect(signedTx).not.toBe(validUnsignedTxHex)
		})

		it('should add vkey signature to transaction', async () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				networkId: NETWORK_ID.PREPROD
			})

			const signedTxHex = await wallet.signTx(validUnsignedTxHex)

			const signedTx = CardanoWASM.Transaction.from_hex(signedTxHex)
			const vkeys = signedTx.witness_set().vkeys()

			expect(vkeys).toBeDefined()
			expect(vkeys?.len()).toBe(1)
		})

		it('should allow partial signing', async () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				networkId: NETWORK_ID.PREPROD
			})

			const signedTx = await wallet.signTx(validUnsignedTxHex, true)

			expect(signedTx).toBeDefined()
		})

		it('should throw error when signing already signed tx without partialSign', async () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				networkId: NETWORK_ID.PREPROD
			})

			const signedOnce = await wallet.signTx(validUnsignedTxHex)

			await expect(wallet.signTx(signedOnce, false)).rejects.toThrow()
		})

		it('should allow signing already signed tx with partialSign', async () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				networkId: NETWORK_ID.PREPROD
			})

			const signedOnce = await wallet.signTx(validUnsignedTxHex)
			const signedTwice = await wallet.signTx(signedOnce, true)

			expect(signedTwice).toBeDefined()
		})

		it('should throw error for invalid transaction hex', async () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey
			})

			await expect(wallet.signTx('invalid-hex')).rejects.toThrow()
		})

		it('should produce valid signed transaction hex', async () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey
			})

			const signedTxHex = await wallet.signTx(validUnsignedTxHex)

			// Should be valid hex
			expect(signedTxHex).toMatch(/^[0-9a-f]+$/i)

			// Should be parseable
			const tx = CardanoWASM.Transaction.from_hex(signedTxHex)
			expect(tx).toBeDefined()
		})
	})

	describe('submitTx', () => {
		it('should call submitter.submitTx', async () => {
			mockSubmitter.submitTx.mockResolvedValue('txhash123')

			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				submitter: mockSubmitter
			})

			const result = await wallet.submitTx('84a400...')

			expect(mockSubmitter.submitTx).toHaveBeenCalledWith('84a400...')
			expect(result).toBe('txhash123')
		})

		it('should throw error when no submitter provided', async () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey
			})

			expect(() => wallet.submitTx('84a400...')).toThrow('No submitter provided')
		})

		it('should propagate submitter errors', async () => {
			mockSubmitter.submitTx.mockRejectedValue(new Error('Network error'))

			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				submitter: mockSubmitter
			})

			await expect(wallet.submitTx('84a400...')).rejects.toThrow('Network error')
		})
	})

	describe('queryUTxOs', () => {
		const mockUtxos: UTxO[] = [
			{
				input: {
					txHash: 'a'.repeat(64),
					outputIndex: 0
				},
				output: {
					address:
						'addr_test1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz',
					amount: [{ unit: 'lovelace', quantity: '5000000' }]
				}
			}
		]

		it('should call fetcher.fetchAddressUTxOs', async () => {
			mockFetcher.fetchAddressUTxOs.mockResolvedValue(mockUtxos)

			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				fetcher: mockFetcher
			})

			const address = wallet.getAddressBech32()
			const result = await wallet.queryUTxOs(address)

			expect(mockFetcher.fetchAddressUTxOs).toHaveBeenCalledWith(address)
			expect(result).toEqual(mockUtxos)
		})

		it('should throw error when no fetcher provided', async () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey
			})

			expect(() => wallet.queryUTxOs('addr_test1...')).toThrow('No fetcher provided')
		})

		it('should propagate fetcher errors', async () => {
			mockFetcher.fetchAddressUTxOs.mockRejectedValue(new Error('API error'))

			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				fetcher: mockFetcher
			})

			await expect(wallet.queryUTxOs('addr_test1...')).rejects.toThrow('API error')
		})

		it('should return empty array when no UTxOs found', async () => {
			mockFetcher.fetchAddressUTxOs.mockResolvedValue([])

			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				fetcher: mockFetcher
			})

			const result = await wallet.queryUTxOs('addr_test1...')

			expect(result).toEqual([])
		})
	})

	describe('integration', () => {
		it('should create wallet, get address, and verify key correspondence', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey,
				networkId: NETWORK_ID.PREPROD
			})

			const address = wallet.getAddressBech32()
			const publicKey = wallet.paymentVKey
			const privateKey = wallet.paymentSKey

			// Verify the public key matches what we'd derive from private key
			const derivedPublicKey = privateKey.to_public()

			expect(publicKey.to_hex()).toBe(derivedPublicKey.to_hex())

			// Verify the address can be parsed
			const parsedAddress = CardanoWASM.Address.from_bech32(address)
			expect(parsedAddress.is_malformed()).toBe(false)
		})

		it('should sign and verify message end-to-end', () => {
			const wallet = new CardanoCliWallet({
				skey: testSkey,
				vkey: testVkey
			})

			const message = new TextEncoder().encode('Hello, Cardano!')
			const signature = wallet.paymentSKey.sign(message)
			const isValid = wallet.paymentVKey.verify(message, signature)

			expect(isValid).toBe(true)
		})
	})
})
