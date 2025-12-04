import { AppWallet, NETWORK_ID, ProviderUtils } from '@hydra-sdk/core'

import { walletPrimary as mockWallet } from '../__tests__/__mocks__/wallet.json'
import { TxBuilder } from '@hydra-sdk/transaction'
import { getEnvVar } from '../env'

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

async function main() {
	const baseAddressBech32 = wallet.getAccount().baseAddressBech32
	console.log('>>> / baseAddressBech32:', baseAddressBech32)

	console.time('fetch-utxos-by-ogmios')
	const utxos = await ogmiosProvider.fetcher.fetchAddressUTxOs(baseAddressBech32)
	console.timeEnd('fetch-utxos-by-ogmios')
	console.log('>>> / UTxOs:', JSON.stringify(utxos, null, 1))

	const txBuilder = await new TxBuilder({})

	const tx = await txBuilder
		.setInputs(utxos)
		.addOutput({
			address: baseAddressBech32,
			amount: [{ unit: 'lovelace', quantity: '1000000' }]
		})
		.setChangeAddress(baseAddressBech32)
		.complete()

	console.log('>>> / Tx:', tx.to_hex())
	const signedTx = await wallet.signTx(tx.to_hex())
	console.log('>>> / Signed Tx:', signedTx)

	const txHash = await ogmiosProvider.submitter.submitTx(signedTx)
	console.log('>>> / Submitted Tx Hash:', txHash)
}

main()
