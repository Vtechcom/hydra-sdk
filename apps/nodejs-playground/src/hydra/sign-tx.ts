import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'
import { wallet } from './common'
;(async function signTx() {
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
