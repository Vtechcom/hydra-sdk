import { AppWallet, NETWORK_ID, ProviderUtils } from '@hydra-sdk/core'

import { walletPrimary as mockWallet } from '../__tests__/__mocks__/wallet.json'
import { TxBuilder } from '@hydra-sdk/transaction'
import { getEnvVar } from '../env'

const blockfrostProvider = new ProviderUtils.BlockfrostProvider({
	apiKey: getEnvVar('BLOCKFROST_PROVIDER_API_KEY', ''),
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

	const utxos = await blockfrostProvider.fetcher.fetchAddressUTxOs(baseAddressBech32)
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

	// const txHash = await blockfrostProvider.submitter.submitTx(signedTx)
	// console.log('>>> / Submitted Tx Hash:', txHash)
}

main()
