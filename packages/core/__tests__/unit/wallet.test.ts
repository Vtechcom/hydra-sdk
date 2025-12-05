import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { AppWallet } from '../../src/wallet'
import { EmbeddedWallet } from '../../src/embedded'
import { NETWORK_ID } from '../../src/constants'
import type { UTxO } from '../../src/types/cardano'

// Test wallet data
const testWallet = {
	mnemonic:
		'member genius submit circle suggest square ivory stem evidence snow rack festival faculty recipe amazing cliff warrior mistake screen humor chat night glad weather',
	baseAddressBech32:
		'addr_test1qzya97j3gg2lkp360m7238lfe46y0jzhl6wgsz6xysz3d5peqew2j40a7ryqyku9re6znz26uan26shczed77p9n6uwq68d0h9',
	paymentKeyHex:
		'885edd05a70aabe1799e01f5a2fac7f6a529a7b8d0b87a43b34ae7797cf3a957ffda50ec3ee078f498fe4919589dca8bc198eb2dd691e3cba9c50b93792487ff',
	paymentCredentialHash: '89d2fa514215fb063a7efca89fe9cd7447c857fe9c880b46240516d0',
	privateKeyHex:
		'30a7e40c1cf43c40b602cc10ae6fcfc59314ed6631b5e241f278eeed65f3a9576d91244c42c93b41e5edc213c0f892da25d0d286d5133d1db290a57c44ecd7cd7842decc7f140e80a6c1437756a96049b3c0583e16aeb417b74a861d24a11698'
}

const testMnemonic = testWallet.mnemonic.split(' ')

// Valid unsigned transaction hex for testing signTx
const validUnsignedTxHex =
	'84a400d9010281825820a3d36ebe9989d832841c683544a9304d3de3dee218872ca982f7d2770489e01800018282583900e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebfeee790c7bb9c497f716fcec7d92a4d68c27b48c9e301b7c547c653cd1a05f5e1008258390015bc6c82189db95e8eb57107e06b8819b8ddbdb9ae873c8487249825d7ea711f85c8f93a1e1176bac951b6332b0875661c9ffc4547416fc1821a05f34273a1581c0836587ed7cee3c0790e24c930c67f31fc2511a3c25aa66ed205e05fa14474525053192710021a00029e8d075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6ca0f5a0'

// Mock fetcher and submitter
const mockFetcher = {
	fetchAddressUTxOs: vi.fn()
}

const mockSubmitter = {
	submitTx: vi.fn()
}

describe('AppWallet', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('constructor with mnemonic', () => {
		it('should create wallet from mnemonic', () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: {
					type: 'mnemonic',
					words: testMnemonic
				}
			})

			expect(wallet).toBeDefined()
			expect(wallet).toBeInstanceOf(AppWallet)
		})

		it('should create wallet with fetcher and submitter', () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: {
					type: 'mnemonic',
					words: testMnemonic
				},
				fetcher: mockFetcher,
				submitter: mockSubmitter
			})

			expect(wallet.getFetcher()).toBe(mockFetcher)
			expect(wallet.getSubmitter()).toBe(mockSubmitter)
		})
	})

	describe('constructor with root key', () => {
		it('should create wallet from bech32 root key', () => {
			const bech32 = EmbeddedWallet.privateKeyHexToBech32(testWallet.privateKeyHex)

			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: {
					type: 'root',
					bech32: bech32
				}
			})

			expect(wallet).toBeDefined()
			expect(wallet.getNetworkId()).toBe(NETWORK_ID.PREPROD)
		})
	})

	describe('constructor with CLI keys', () => {
		it('should create wallet from CLI payment key', () => {
			const paymentKey = '5820' + 'a'.repeat(64)

			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: {
					type: 'cli',
					payment: paymentKey
				}
			})

			expect(wallet).toBeDefined()
		})

		it('should create wallet from CLI payment and stake keys', () => {
			const paymentKey = '5820' + 'a'.repeat(64)
			const stakeKey = '5820' + 'b'.repeat(64)

			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: {
					type: 'cli',
					payment: paymentKey,
					stake: stakeKey
				}
			})

			expect(wallet).toBeDefined()
		})
	})

	describe('getAccount', () => {
		it('should return account with default indices', () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const account = wallet.getAccount()

			expect(account).toBeDefined()
			expect(account.baseAddressBech32).toBe(testWallet.baseAddressBech32)
			expect(account.paymentKeyHex).toBe(testWallet.paymentKeyHex)
		})

		it('should return different accounts for different indices', () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const account0 = wallet.getAccount(0, 0)
			const account1 = wallet.getAccount(0, 1)

			expect(account0.baseAddressBech32).not.toBe(account1.baseAddressBech32)
		})
	})

	describe('getEnterpriseAddress', () => {
		it('should return enterprise address', () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const address = wallet.getEnterpriseAddress()

			expect(address).toBeDefined()
			expect(address).toMatch(/^addr_test1/)
		})

		it('should return different addresses for different indices', () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const addr0 = wallet.getEnterpriseAddress(0, 0)
			const addr1 = wallet.getEnterpriseAddress(0, 1)

			expect(addr0).not.toBe(addr1)
		})

		it('should return mainnet address when network is mainnet', () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.MAINNET,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const address = wallet.getEnterpriseAddress()

			expect(address).toMatch(/^addr1/)
		})
	})

	describe('getPaymentAddress', () => {
		it('should return base address', () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const address = wallet.getPaymentAddress()

			expect(address).toBe(testWallet.baseAddressBech32)
		})

		it('should return different addresses for different indices', () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const addr0 = wallet.getPaymentAddress(0, 0)
			const addr1 = wallet.getPaymentAddress(0, 1)

			expect(addr0).not.toBe(addr1)
		})

		it('should return mainnet address when network is mainnet', () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.MAINNET,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const address = wallet.getPaymentAddress()

			expect(address).toMatch(/^addr1/)
		})
	})

	describe('getRewardAddress', () => {
		it('should return reward/stake address', () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const address = wallet.getRewardAddress()

			expect(address).toBeDefined()
			expect(address).toMatch(/^stake_test1/)
		})

		it('should return mainnet stake address when network is mainnet', () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.MAINNET,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const address = wallet.getRewardAddress()

			expect(address).toMatch(/^stake1/)
		})
	})

	describe('getNetworkId', () => {
		it('should return PREPROD network ID', () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			expect(wallet.getNetworkId()).toBe(NETWORK_ID.PREPROD)
		})

		it('should return MAINNET network ID', () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.MAINNET,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			expect(wallet.getNetworkId()).toBe(NETWORK_ID.MAINNET)
		})
	})

	describe('signTx', () => {
		it('should sign an unsigned transaction', async () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const signedTxHex = await wallet.signTx(validUnsignedTxHex)

			expect(signedTxHex).toBeDefined()
			expect(signedTxHex).not.toBe(validUnsignedTxHex)
		})

		it('should add vkey witness to transaction', async () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const signedTxHex = await wallet.signTx(validUnsignedTxHex)
			const signedTx = CardanoWASM.Transaction.from_hex(signedTxHex)
			const vkeys = signedTx.witness_set().vkeys()

			expect(vkeys).toBeDefined()
			expect(vkeys?.len()).toBe(1)
		})

		it('should allow partial signing', async () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const signedTxHex = await wallet.signTx(validUnsignedTxHex, true)

			expect(signedTxHex).toBeDefined()
		})

		it('should throw error when signing already signed tx without partialSign', async () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const signedOnce = await wallet.signTx(validUnsignedTxHex)

			await expect(wallet.signTx(signedOnce, false)).rejects.toThrow()
		})

		it('should allow signing already signed tx with partialSign', async () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const signedOnce = await wallet.signTx(validUnsignedTxHex)
			const signedTwice = await wallet.signTx(signedOnce, true)

			expect(signedTwice).toBeDefined()
		})

		it('should sign with different account indices', async () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const signed0 = await wallet.signTx(validUnsignedTxHex, false, 0, 0)
			const signed1 = await wallet.signTx(validUnsignedTxHex, false, 0, 1)

			// Different keys produce different signed transactions
			expect(signed0).not.toBe(signed1)
		})

		it('should throw error for invalid transaction hex', async () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			await expect(wallet.signTx('invalid-hex')).rejects.toThrow()
		})

		it('should produce consistent signatures', async () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const signed1 = await wallet.signTx(validUnsignedTxHex)
			const signed2 = await wallet.signTx(validUnsignedTxHex)

			expect(signed1).toBe(signed2)
		})
	})

	describe('signTxs', () => {
		it('should sign multiple transactions', async () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const signedTxs = await wallet.signTxs([validUnsignedTxHex, validUnsignedTxHex])

			expect(signedTxs).toHaveLength(2)
			expect(signedTxs[0]).toBeDefined()
			expect(signedTxs[1]).toBeDefined()
		})

		it('should sign with partial sign option', async () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const signedTxs = await wallet.signTxs([validUnsignedTxHex], true)

			expect(signedTxs).toHaveLength(1)
		})
	})

	describe('signData', () => {
		it('should throw not implemented error', async () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const address = wallet.getPaymentAddress()

			await expect(wallet.signData(address, 'test payload')).rejects.toThrow('not implemented')
		})
	})

	describe('submitTx', () => {
		it('should call submitter.submitTx', async () => {
			mockSubmitter.submitTx.mockResolvedValue('txhash123')

			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic },
				submitter: mockSubmitter
			})

			const result = await wallet.submitTx('84a400...')

			expect(mockSubmitter.submitTx).toHaveBeenCalledWith('84a400...')
			expect(result).toBe('txhash123')
		})

		it('should throw error when no submitter provided', () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			expect(() => wallet.submitTx('84a400...')).toThrow('No submitter provided')
		})

		it('should propagate submitter errors', async () => {
			mockSubmitter.submitTx.mockRejectedValue(new Error('Network error'))

			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic },
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
					address: testWallet.baseAddressBech32,
					amount: [{ unit: 'lovelace', quantity: '5000000' }]
				}
			}
		]

		it('should call fetcher.fetchAddressUTxOs', async () => {
			mockFetcher.fetchAddressUTxOs.mockResolvedValue(mockUtxos)

			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic },
				fetcher: mockFetcher
			})

			const address = wallet.getPaymentAddress()
			const result = await wallet.queryUTxOs(address)

			expect(mockFetcher.fetchAddressUTxOs).toHaveBeenCalledWith(address)
			expect(result).toEqual(mockUtxos)
		})

		it('should throw error when no fetcher provided', () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			expect(() => wallet.queryUTxOs('addr_test1...')).toThrow('No fetcher provided')
		})

		it('should propagate fetcher errors', async () => {
			mockFetcher.fetchAddressUTxOs.mockRejectedValue(new Error('API error'))

			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic },
				fetcher: mockFetcher
			})

			await expect(wallet.queryUTxOs('addr_test1...')).rejects.toThrow('API error')
		})

		it('should return empty array when no UTxOs found', async () => {
			mockFetcher.fetchAddressUTxOs.mockResolvedValue([])

			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic },
				fetcher: mockFetcher
			})

			const result = await wallet.queryUTxOs('addr_test1...')

			expect(result).toEqual([])
		})
	})

	describe('getFetcher', () => {
		it('should return fetcher when provided', () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic },
				fetcher: mockFetcher
			})

			expect(wallet.getFetcher()).toBe(mockFetcher)
		})

		it('should return undefined when no fetcher provided', () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			expect(wallet.getFetcher()).toBeUndefined()
		})
	})

	describe('getSubmitter', () => {
		it('should return submitter when provided', () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic },
				submitter: mockSubmitter
			})

			expect(wallet.getSubmitter()).toBe(mockSubmitter)
		})

		it('should return undefined when no submitter provided', () => {
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			expect(wallet.getSubmitter()).toBeUndefined()
		})
	})

	describe('brew (static)', () => {
		it('should generate 24-word mnemonic by default', () => {
			const mnemonic = AppWallet.brew()

			expect(mnemonic).toHaveLength(24)
			expect(mnemonic.every(word => typeof word === 'string')).toBe(true)
		})

		it('should generate 12-word mnemonic with 128 bits', () => {
			const mnemonic = AppWallet.brew(128)

			expect(mnemonic).toHaveLength(12)
		})

		it('should generate unique mnemonics each time', () => {
			const mnemonic1 = AppWallet.brew()
			const mnemonic2 = AppWallet.brew()

			expect(mnemonic1.join(' ')).not.toBe(mnemonic2.join(' '))
		})

		it('should generate valid mnemonic that can create wallet', () => {
			const mnemonic = AppWallet.brew()

			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: mnemonic }
			})

			expect(wallet.getPaymentAddress()).toMatch(/^addr_test1/)
		})
	})

	describe('integration', () => {
		it('should create wallet, sign tx, and submit', async () => {
			mockSubmitter.submitTx.mockResolvedValue('txhash123')

			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic },
				submitter: mockSubmitter
			})

			const signedTx = await wallet.signTx(validUnsignedTxHex)
			const txHash = await wallet.submitTx(signedTx)

			expect(txHash).toBe('txhash123')
			expect(mockSubmitter.submitTx).toHaveBeenCalledWith(signedTx)
		})

		it('should recover wallet from root key and produce same addresses', () => {
			// Create wallet from mnemonic
			const wallet1 = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			// Get root key bech32
			const bech32 = EmbeddedWallet.privateKeyHexToBech32(testWallet.privateKeyHex)

			// Create wallet from root key
			const wallet2 = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'root', bech32: bech32 }
			})

			expect(wallet1.getPaymentAddress()).toBe(wallet2.getPaymentAddress())
			expect(wallet1.getEnterpriseAddress()).toBe(wallet2.getEnterpriseAddress())
			expect(wallet1.getRewardAddress()).toBe(wallet2.getRewardAddress())
		})

		it('should query UTxOs and use for transaction context', async () => {
			const mockUtxos: UTxO[] = [
				{
					input: { txHash: 'a'.repeat(64), outputIndex: 0 },
					output: {
						address: testWallet.baseAddressBech32,
						amount: [{ unit: 'lovelace', quantity: '10000000' }]
					}
				}
			]
			mockFetcher.fetchAddressUTxOs.mockResolvedValue(mockUtxos)

			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic },
				fetcher: mockFetcher
			})

			const address = wallet.getPaymentAddress()
			const utxos = await wallet.queryUTxOs(address)

			expect(utxos).toHaveLength(1)
			expect(utxos[0].output.address).toBe(address)
		})
	})
})
