import { HexcoreConnector, HydraBridge } from '@hydra-sdk/bridge'
import { AppWallet, Converter, NETWORK_ID, ProviderUtils } from '@hydra-sdk/core'
import { walletPrimary as testWallet } from '../../__tests__/__mocks__/wallet.json'
import { getEnvVar } from '../../env'

const main = async () => {
	const bridge = new HydraBridge({
		connector: new HexcoreConnector('wss://fastpay-api.hydrawallet.app', {
			socketIoOptions: {
				transports: ['websocket']
			}
		})
	})
	await bridge.connect()

	bridge.events.on('onConnected', () => {
		console.log('Connected to Hydra node via HexcoreConnector')
	})

	bridge.events.on('onMessage', message => {
		console.log(
			'Received message:',
			'TAG: ',
			message.tag,
			'| SIZE: ',
			JSON.stringify(message).length * 2,
			'bytes | at ',
			new Date().toISOString()
		)
	})

	bridge.events.on('onDisconnected', () => {
		console.log('Disconnected from Hydra node')
	})

	const provider = new ProviderUtils.BlockfrostProvider({
		apiKey: getEnvVar('BLOCKFROST_PROVIDER_API_KEY'),
		network: 'preprod'
	})
	const wallet = new AppWallet({
		networkId: NETWORK_ID.PREPROD,
		key: {
			type: 'mnemonic',
			words: testWallet.mnemonic.split(' ')
		},
		fetcher: provider.fetcher,
		submitter: provider.submitter
	})
	const baseAddressBech32 = await wallet.getAccount().baseAddressBech32
	console.log('Base Address:', baseAddressBech32)
}

main()
