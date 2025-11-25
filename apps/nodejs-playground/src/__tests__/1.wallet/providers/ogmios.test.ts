import { AppWallet, NETWORK_ID, ProviderUtils } from '@hydra-sdk/core'
import { walletPrimary as mockWallet } from '../../__mocks__/wallet.json'
import { getEnvVar } from '../../../env'

const ogmiosProvider = new ProviderUtils.OgmiosProvider({
	apiEndpoint: getEnvVar('OGMIOS_PROVIDER_HTTP_URL'),
	network: 'preprod'
})

const wallet = new AppWallet({
	key: {
		type: 'mnemonic',
		words: mockWallet.mnemonic.split(' ')
	},
	networkId: NETWORK_ID.PREPROD
})

/**
 * Note: These tests require a valid Ogmios HTTP URL set in the environment variable `OGMIOS_PROVIDER_HTTP_URL`.
 * Make sure to set this variable before running the tests.
 * You can get a free API key by signing up at https://ogmios.dev/
 *
 * Note 2: The address used in these tests must have some UTxOs on the specified network (preprod).
 * You can fund a preprod address using the Cardano testnet faucet: https://testnets.cardano.org/en/testnets/cardano/tools/faucet/
 *
 * Note 3: These tests may fail if the Ogmios API rate limit is exceeded. The free tier allows for a limited number of requests.
 * If you encounter rate limit errors, consider upgrading your Ogmios plan or reducing the number of test runs.
 */
describe('[Providers][Ogmios][Wallet]', () => {
	it('should create a new wallet instance', async () => {
		const baseAddressBech32 = wallet.getAccount().baseAddressBech32

		expect(wallet).toBeInstanceOf(AppWallet)
		expect(baseAddressBech32).toBe(mockWallet.baseAddressBech32)
	})

	it('should fetch UTxOs for the wallet address', async () => {
		const baseAddressBech32 = wallet.getAccount().baseAddressBech32
		const utxos = await ogmiosProvider.fetcher.fetchAddressUTxOs(baseAddressBech32)

		expect(utxos).toBeDefined()
		expect(utxos.length).toBeGreaterThan(0)
	}, 60000)

	it('should fetch UTxOs for the wallet address with a specific asset', async () => {
		const baseAddressBech32 = wallet.getAccount().baseAddressBech32
		const asset = 'fef67460342d081cb7881318b1f33b87626d1a1042b4c2acbbc0725d7441424f'
		const utxos = await ogmiosProvider.fetcher.fetchAddressUTxOs(baseAddressBech32, asset)

		expect(utxos).toBeDefined()
		expect(utxos.length).toBeGreaterThan(0)
	}, 60000)
})
