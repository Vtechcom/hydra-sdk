import { AppWallet, Deserializer, NETWORK_ID } from '@hydra-sdk/core'

import { walletPrimary as mockWallet } from '../__mocks__/wallet.json'

describe('Setup wallet', () => {
	const wallet = new AppWallet({
		key: {
			type: 'mnemonic',
			words: mockWallet.mnemonic.split(' ')
		},
		networkId: NETWORK_ID.PREPROD
	})
	it('should create a new wallet instance', () => {
		expect(wallet).toBeInstanceOf(AppWallet)
	})

	it('should get the wallet address with valid network', () => {
		const account = wallet.getAccount()
		expect(account.baseAddressBech32).toMatch(/^addr_test1/)
	})

	it('should get the wallet address bech32', async () => {
		const account = wallet.getAccount()
		expect(account.baseAddressBech32).toEqual(mockWallet.baseAddressBech32)
	})

	it('should get the wallet paymentKeyHex', async () => {
		const account = wallet.getAccount()
		expect(account.paymentKeyHex).toEqual(mockWallet.paymentKeyHex)
	})

	it('should get the account pubKeyHash', async () => {
		const wallet = new AppWallet({
			key: {
				type: 'mnemonic',
				words: mockWallet.mnemonic.split(' ')
			},
			networkId: NETWORK_ID.PREPROD
		})
		const account = wallet.getAccount()
		const { paymentCredentialHash } = Deserializer.deserializeAddress(account.baseAddressBech32)

		expect(account.baseAddressBech32).toEqual(mockWallet.baseAddressBech32)
		expect(paymentCredentialHash).toBeDefined()
		expect(paymentCredentialHash).toEqual(mockWallet.paymentCredentialHash)
	})
})
