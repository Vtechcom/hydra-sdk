import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'
import { buildRedeemer, TxBuilder } from '@hydra-sdk/transaction'
;(async function signTx() {
	const wallet = new AppWallet({
		key: {
			type: 'mnemonic',
			words: 'daughter silk uncover cheese split ribbon treat forum belt planet divert verify easily fabric shrimp'.split(
				' '
			)
		},
		networkId: NETWORK_ID.PREPROD
	})

	const cborHex = process.argv[2]
	if (!cborHex) {
		console.error('Please provide a transaction CBOR hex string as a command line argument.')
		process.exit(1)
	}
	const partialSign = process.argv[3] === 'true'

	const signedTx = await wallet.signTx(cborHex, partialSign)
	console.log('Signed Transaction CBOR Hex:')
	console.log(signedTx)
})()
