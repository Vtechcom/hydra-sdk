import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { EmbeddedWallet, WalletStaticMethods } from '../../src/embedded'
import { NETWORK_ID } from '../../src/constants'

// Test mnemonic (24 words) - DO NOT USE IN PRODUCTION
const testWallet = {
	mnemonic:
		'member genius submit circle suggest square ivory stem evidence snow rack festival faculty recipe amazing cliff warrior mistake screen humor chat night glad weather',
	baseAddressBech32:
		'addr_test1qzya97j3gg2lkp360m7238lfe46y0jzhl6wgsz6xysz3d5peqew2j40a7ryqyku9re6znz26uan26shczed77p9n6uwq68d0h9',
	paymentKeyHex:
		'885edd05a70aabe1799e01f5a2fac7f6a529a7b8d0b87a43b34ae7797cf3a957ffda50ec3ee078f498fe4919589dca8bc198eb2dd691e3cba9c50b93792487ff',
	paymentCredentialHash: '89d2fa514215fb063a7efca89fe9cd7447c857fe9c880b46240516d0',

	// = rootkey
	privateKeyHex:
		'30a7e40c1cf43c40b602cc10ae6fcfc59314ed6631b5e241f278eeed65f3a9576d91244c42c93b41e5edc213c0f892da25d0d286d5133d1db290a57c44ecd7cd7842decc7f140e80a6c1437756a96049b3c0583e16aeb417b74a861d24a11698'
}

// Valid unsigned transaction hex for testing signTx
const validUnsignedTxHex =
	'84a400d9010281825820a3d36ebe9989d832841c683544a9304d3de3dee218872ca982f7d2770489e01800018282583900e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebfeee790c7bb9c497f716fcec7d92a4d68c27b48c9e301b7c547c653cd1a05f5e1008258390015bc6c82189db95e8eb57107e06b8819b8ddbdb9ae873c8487249825d7ea711f85c8f93a1e1176bac951b6332b0875661c9ffc4547416fc1821a05f34273a1581c0836587ed7cee3c0790e24c930c67f31fc2511a3c25aa66ed205e05fa14474525053192710021a00029e8d075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6ca0f5a0'

// Helper to get mnemonic as array
const testMnemonic = testWallet.mnemonic.split(' ')

describe('WalletStaticMethods', () => {
	describe('mnemonicToPrivateKeyHex', () => {
		it('should convert mnemonic to private key hex', () => {
			const privateKeyHex = WalletStaticMethods.mnemonicToPrivateKeyHex(testMnemonic)

			expect(privateKeyHex).toBe(testWallet.privateKeyHex)
			expect(privateKeyHex.length).toBe(192) // 96 bytes = 192 hex chars
		})

		it('should convert mnemonic with password', () => {
			const privateKeyHex = WalletStaticMethods.mnemonicToPrivateKeyHex(testMnemonic, 'password123')

			expect(privateKeyHex).toBeDefined()
			expect(privateKeyHex.length).toBe(192)
		})

		it('should produce different keys with different passwords', () => {
			const key1 = WalletStaticMethods.mnemonicToPrivateKeyHex(testMnemonic, '')
			const key2 = WalletStaticMethods.mnemonicToPrivateKeyHex(testMnemonic, 'password')

			expect(key1).not.toBe(key2)
		})

		it('should produce consistent keys for same mnemonic', () => {
			const key1 = WalletStaticMethods.mnemonicToPrivateKeyHex(testMnemonic)
			const key2 = WalletStaticMethods.mnemonicToPrivateKeyHex(testMnemonic)

			expect(key1).toBe(key2)
		})
	})

	describe('privateKeyHexToBech32', () => {
		it('should convert private key hex to bech32', () => {
			const privateKeyHex = WalletStaticMethods.mnemonicToPrivateKeyHex(testMnemonic)
			const bech32 = WalletStaticMethods.privateKeyHexToBech32(privateKeyHex)

			expect(bech32).toBeDefined()
			expect(bech32.startsWith('xprv')).toBe(true)
		})
	})

	describe('privateKeyBech32ToPrivateKeyHex', () => {
		it('should convert bech32 back to hex', () => {
			const originalHex = WalletStaticMethods.mnemonicToPrivateKeyHex(testMnemonic)
			const bech32 = WalletStaticMethods.privateKeyHexToBech32(originalHex)
			const convertedHex = WalletStaticMethods.privateKeyBech32ToPrivateKeyHex(bech32)

			expect(convertedHex).toBe(originalHex)
		})

		it('should handle round-trip conversion', () => {
			const hex1 = WalletStaticMethods.mnemonicToPrivateKeyHex(testMnemonic)
			const bech32 = WalletStaticMethods.privateKeyHexToBech32(hex1)
			const hex2 = WalletStaticMethods.privateKeyBech32ToPrivateKeyHex(bech32)
			const bech32Again = WalletStaticMethods.privateKeyHexToBech32(hex2)

			expect(bech32).toBe(bech32Again)
		})
	})

	describe('signingKeyToHexes', () => {
		it('should strip 5820 prefix from payment key', () => {
			const paymentKey = '5820' + 'a'.repeat(64)
			const stakeKey = '5820' + 'b'.repeat(64)

			const [payment, stake] = WalletStaticMethods.signingKeyToHexes(paymentKey, stakeKey)

			expect(payment).toBe('a'.repeat(64))
			expect(stake).toBe('b'.repeat(64))
		})

		it('should return key as-is if no 5820 prefix', () => {
			const paymentKey = 'a'.repeat(64)
			const stakeKey = 'b'.repeat(64)

			const [payment, stake] = WalletStaticMethods.signingKeyToHexes(paymentKey, stakeKey)

			expect(payment).toBe(paymentKey)
			expect(stake).toBe(stakeKey)
		})

		it('should handle mixed prefix cases', () => {
			const paymentKey = '5820' + 'a'.repeat(64)
			const stakeKey = 'b'.repeat(64)

			const [payment, stake] = WalletStaticMethods.signingKeyToHexes(paymentKey, stakeKey)

			expect(payment).toBe('a'.repeat(64))
			expect(stake).toBe(stakeKey)
		})
	})

	describe('bip32BytesToPrivateKeyHex', () => {
		it('should convert bip32 bytes to hex', () => {
			const privateKeyHex = WalletStaticMethods.mnemonicToPrivateKeyHex(testMnemonic)
			const bip32Key = CardanoWASM.Bip32PrivateKey.from_hex(privateKeyHex)
			const bytes = bip32Key.as_bytes()

			const resultHex = WalletStaticMethods.bip32BytesToPrivateKeyHex(bytes)

			expect(resultHex).toBe(privateKeyHex)
		})
	})

	describe('getAddresses', () => {
		it('should return all address types for testnet', () => {
			const privateKeyHex = WalletStaticMethods.mnemonicToPrivateKeyHex(testMnemonic)
			const bip32Key = CardanoWASM.Bip32PrivateKey.from_hex(privateKeyHex)

			// Derive payment and staking keys
			const accountKey = bip32Key
				.derive(1852 + 0x80000000)
				.derive(1815 + 0x80000000)
				.derive(0x80000000)
			const paymentKey = accountKey.derive(0).derive(0)
			const stakeKey = accountKey.derive(2).derive(0)

			const addresses = WalletStaticMethods.getAddresses(paymentKey, stakeKey, NETWORK_ID.PREPROD)

			expect(addresses.baseAddress).toBeDefined()
			expect(addresses.enterpriseAddress).toBeDefined()
			expect(addresses.rewardAddress).toBeDefined()

			// Testnet addresses start with addr_test
			expect(addresses.baseAddress.to_bech32()).toMatch(/^addr_test1/)
			expect(addresses.enterpriseAddress.to_bech32()).toMatch(/^addr_test1/)
			expect(addresses.rewardAddress.to_bech32()).toMatch(/^stake_test1/)
		})

		it('should return all address types for mainnet', () => {
			const privateKeyHex = WalletStaticMethods.mnemonicToPrivateKeyHex(testMnemonic)
			const bip32Key = CardanoWASM.Bip32PrivateKey.from_hex(privateKeyHex)

			const accountKey = bip32Key
				.derive(1852 + 0x80000000)
				.derive(1815 + 0x80000000)
				.derive(0x80000000)
			const paymentKey = accountKey.derive(0).derive(0)
			const stakeKey = accountKey.derive(2).derive(0)

			const addresses = WalletStaticMethods.getAddresses(paymentKey, stakeKey, NETWORK_ID.MAINNET)

			// Mainnet addresses start with addr1
			expect(addresses.baseAddress.to_bech32()).toMatch(/^addr1/)
			expect(addresses.enterpriseAddress.to_bech32()).toMatch(/^addr1/)
			expect(addresses.rewardAddress.to_bech32()).toMatch(/^stake1/)
		})
	})

	describe('generateMnemonic', () => {
		it('should generate 24-word mnemonic by default (256 bits)', () => {
			const mnemonic = WalletStaticMethods.generateMnemonic()

			expect(mnemonic).toHaveLength(24)
			expect(mnemonic.every(word => typeof word === 'string')).toBe(true)
		})

		it('should generate 12-word mnemonic with 128 bits', () => {
			const mnemonic = WalletStaticMethods.generateMnemonic(128)

			expect(mnemonic).toHaveLength(12)
		})

		it('should generate 15-word mnemonic with 160 bits', () => {
			const mnemonic = WalletStaticMethods.generateMnemonic(160)

			expect(mnemonic).toHaveLength(15)
		})

		it('should generate 18-word mnemonic with 192 bits', () => {
			const mnemonic = WalletStaticMethods.generateMnemonic(192)

			expect(mnemonic).toHaveLength(18)
		})

		it('should generate 21-word mnemonic with 224 bits', () => {
			const mnemonic = WalletStaticMethods.generateMnemonic(224)

			expect(mnemonic).toHaveLength(21)
		})

		it('should generate unique mnemonics each time', () => {
			const mnemonic1 = WalletStaticMethods.generateMnemonic()
			const mnemonic2 = WalletStaticMethods.generateMnemonic()

			expect(mnemonic1.join(' ')).not.toBe(mnemonic2.join(' '))
		})

		it('should generate valid mnemonic that can create wallet', () => {
			const mnemonic = WalletStaticMethods.generateMnemonic()
			const privateKeyHex = WalletStaticMethods.mnemonicToPrivateKeyHex(mnemonic)

			expect(privateKeyHex).toBeDefined()
			expect(privateKeyHex.length).toBe(192)
		})
	})
})

describe('EmbeddedWallet', () => {
	describe('constructor with mnemonic', () => {
		it('should create wallet from mnemonic', () => {
			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: {
					type: 'mnemonic',
					words: testMnemonic
				}
			})

			expect(wallet).toBeDefined()
			expect(wallet).toBeInstanceOf(EmbeddedWallet)
		})

		it('should store network ID correctly', () => {
			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: {
					type: 'mnemonic',
					words: testMnemonic
				}
			})

			expect(wallet.getNetworkId()).toBe(NETWORK_ID.PREPROD)
		})
	})

	describe('constructor with root key', () => {
		it('should create wallet from bech32 root key', () => {
			const privateKeyHex = WalletStaticMethods.mnemonicToPrivateKeyHex(testMnemonic)
			const bech32 = WalletStaticMethods.privateKeyHexToBech32(privateKeyHex)

			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: {
					type: 'root',
					bech32: bech32
				}
			})

			expect(wallet).toBeDefined()
			expect(wallet.getPrivateKeyHex()).toBe(privateKeyHex)
		})
	})

	describe('constructor with CLI keys', () => {
		it('should create wallet from CLI payment key', () => {
			const paymentKey = '5820' + 'a'.repeat(64)

			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: {
					type: 'cli',
					payment: paymentKey
				}
			})

			expect(wallet).toBeDefined()
			const [payment, stake] = wallet.getPrivateKeyHex() as [string, string]
			expect(payment).toBe('a'.repeat(64))
			expect(stake).toBe('f0'.repeat(32)) // default stake key
		})

		it('should create wallet from CLI payment and stake keys', () => {
			const paymentKey = '5820' + 'a'.repeat(64)
			const stakeKey = '5820' + 'b'.repeat(64)

			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: {
					type: 'cli',
					payment: paymentKey,
					stake: stakeKey
				}
			})

			const [payment, stake] = wallet.getPrivateKeyHex() as [string, string]
			expect(payment).toBe('a'.repeat(64))
			expect(stake).toBe('b'.repeat(64))
		})
	})

	describe('constructor with bip32Bytes', () => {
		it('should create wallet from bip32 bytes', () => {
			const privateKeyHex = WalletStaticMethods.mnemonicToPrivateKeyHex(testMnemonic)
			const bip32Key = CardanoWASM.Bip32PrivateKey.from_hex(privateKeyHex)
			const bytes = bip32Key.as_bytes()

			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: {
					type: 'bip32Bytes',
					bip32Bytes: bytes
				}
			})

			expect(wallet).toBeDefined()
			expect(wallet.getPrivateKeyHex()).toBe(privateKeyHex)
		})
	})

	describe('getNetworkId', () => {
		it('should return PREPROD network ID', () => {
			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			expect(wallet.getNetworkId()).toBe(NETWORK_ID.PREPROD)
		})

		it('should return MAINNET network ID', () => {
			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.MAINNET,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			expect(wallet.getNetworkId()).toBe(NETWORK_ID.MAINNET)
		})

		it('should return custom network ID', () => {
			const wallet = new EmbeddedWallet({
				networkId: 2,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			expect(wallet.getNetworkId()).toBe(2)
		})
	})

	describe('getPrivateKeyHex', () => {
		it('should return private key hex for mnemonic wallet', () => {
			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const privateKeyHex = wallet.getPrivateKeyHex()

			expect(privateKeyHex).toBe(testWallet.privateKeyHex)
		})

		it('should return tuple for CLI wallet', () => {
			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: {
					type: 'cli',
					payment: '5820' + 'a'.repeat(64),
					stake: '5820' + 'b'.repeat(64)
				}
			})

			const keys = wallet.getPrivateKeyHex()

			expect(Array.isArray(keys)).toBe(true)
			expect(keys).toHaveLength(2)
		})
	})

	describe('getAccount', () => {
		it('should return account with all addresses', () => {
			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const account = wallet.getAccount()

			expect(account.baseAddress).toBeDefined()
			expect(account.enterpriseAddress).toBeDefined()
			expect(account.rewardAddress).toBeDefined()
			expect(account.baseAddressBech32).toMatch(/^addr_test1/)
			expect(account.enterpriseAddressBech32).toMatch(/^addr_test1/)
			expect(account.rewardAddressBech32).toMatch(/^stake_test1/)
		})

		it('should return account with payment and stake keys', () => {
			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const account = wallet.getAccount()

			expect(account.paymentKey).toBeDefined()
			expect(account.stakeKey).toBeDefined()
			expect(account.paymentKey).toBeInstanceOf(CardanoWASM.Bip32PrivateKey)
			expect(account.stakeKey).toBeInstanceOf(CardanoWASM.Bip32PrivateKey)
		})

		it('should return account with key hexes', () => {
			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const account = wallet.getAccount()

			expect(account.paymentKeyHex).toBeDefined()
			expect(account.stakeKeyHex).toBeDefined()
			expect(account.extendedPaymentKeyHex).toBeDefined()
			expect(account.extendedStakeKeyHex).toBeDefined()

			// Extended keys are 96 bytes = 192 hex chars
			expect(account.extendedPaymentKeyHex.length).toBe(192)
			expect(account.extendedStakeKeyHex.length).toBe(192)

			// Stripped keys are 64 bytes = 128 hex chars
			expect(account.paymentKeyHex.length).toBe(128)
			expect(account.stakeKeyHex.length).toBe(128)
		})

		it('should return different accounts for different indices', () => {
			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const account0 = wallet.getAccount(0, 0)
			const account1 = wallet.getAccount(0, 1)
			const account2 = wallet.getAccount(1, 0)

			expect(account0.baseAddressBech32).not.toBe(account1.baseAddressBech32)
			expect(account0.baseAddressBech32).not.toBe(account2.baseAddressBech32)
			expect(account1.baseAddressBech32).not.toBe(account2.baseAddressBech32)
		})

		it('should return consistent account for same indices', () => {
			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const account1 = wallet.getAccount(0, 0)
			const account2 = wallet.getAccount(0, 0)

			expect(account1.baseAddressBech32).toBe(account2.baseAddressBech32)
			expect(account1.paymentKeyHex).toBe(account2.paymentKeyHex)
		})

		it('should return mainnet addresses when networkId is mainnet', () => {
			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.MAINNET,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const account = wallet.getAccount()

			expect(account.baseAddressBech32).toMatch(/^addr1/)
			expect(account.enterpriseAddressBech32).toMatch(/^addr1/)
			expect(account.rewardAddressBech32).toMatch(/^stake1/)
		})
	})

	describe('signTx', () => {
		it('should sign a valid unsigned transaction', () => {
			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const vkeyWitness = wallet.signTx(validUnsignedTxHex)

			expect(vkeyWitness).toBeDefined()
			expect(vkeyWitness).toBeInstanceOf(CardanoWASM.Vkeywitness)
		})

		it('should produce valid vkey witness with signature', () => {
			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const vkeyWitness = wallet.signTx(validUnsignedTxHex)
			const vkey = vkeyWitness.vkey()
			const signature = vkeyWitness.signature()

			expect(vkey).toBeDefined()
			expect(signature).toBeDefined()
			expect(signature.to_hex().length).toBe(128) // 64 bytes = 128 hex chars
		})

		it('should sign with different account indices', () => {
			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const witness0 = wallet.signTx(validUnsignedTxHex, 0, 0)
			const witness1 = wallet.signTx(validUnsignedTxHex, 0, 1)

			// Different keys should produce different signatures
			expect(witness0.vkey().to_hex()).not.toBe(witness1.vkey().to_hex())
		})

		it('should throw error for invalid transaction', () => {
			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			expect(() => wallet.signTx('invalid-tx-hex')).toThrow()
		})

		it('should produce consistent signatures for same transaction', () => {
			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const witness1 = wallet.signTx(validUnsignedTxHex)
			const witness2 = wallet.signTx(validUnsignedTxHex)

			expect(witness1.to_hex()).toBe(witness2.to_hex())
		})
	})

	describe('integration', () => {
		it('should create wallet from generated mnemonic and get account', () => {
			const mnemonic = WalletStaticMethods.generateMnemonic()

			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: mnemonic }
			})

			const account = wallet.getAccount()

			expect(account.baseAddressBech32).toMatch(/^addr_test1/)
			expect(account.paymentKey).toBeDefined()
		})

		it('should recover wallet from root key and produce same addresses', () => {
			// Create wallet from mnemonic
			const wallet1 = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			// Get root key and create new wallet
			const privateKeyHex = wallet1.getPrivateKeyHex() as string
			const bech32 = WalletStaticMethods.privateKeyHexToBech32(privateKeyHex)

			const wallet2 = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'root', bech32: bech32 }
			})

			// Both wallets should produce same addresses
			const account1 = wallet1.getAccount()
			const account2 = wallet2.getAccount()

			expect(account1.baseAddressBech32).toBe(account2.baseAddressBech32)
			expect(account1.enterpriseAddressBech32).toBe(account2.enterpriseAddressBech32)
			expect(account1.rewardAddressBech32).toBe(account2.rewardAddressBech32)
		})

		it('should sign and verify witness matches public key', () => {
			const wallet = new EmbeddedWallet({
				networkId: NETWORK_ID.PREPROD,
				key: { type: 'mnemonic', words: testMnemonic }
			})

			const account = wallet.getAccount()
			const vkeyWitness = wallet.signTx(validUnsignedTxHex)

			// The vkey in witness should match the payment public key
			const witnessVkey = vkeyWitness.vkey().public_key()
			const accountPubKey = account.paymentKey.to_public().to_raw_key()

			expect(witnessVkey.to_hex()).toBe(accountPubKey.to_hex())
		})
	})
})
