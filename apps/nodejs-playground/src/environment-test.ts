// Comprehensive test showing environment-specific behavior

// Test ES Module import
import { CardanoWASM, CardanoWASM as CardanoWASMESM } from '@hydra-sdk/cardano-wasm'
import { AppWallet, Deserializer, NETWORK_ID } from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'

export async function run() {
	console.log('🔍 Environment Detection Test')
	console.log('Current environment: Node.js')
	console.log('Process version:', process.version)
	console.log('Process platform:', process.platform)
	console.log('Process ppid:', process.ppid)
	console.log('Process cwd:', process.cwd())
	console.log('Process env:', process.env.NODE_ENV || 'development')

	const wallet = new AppWallet({
		key: {
			type: 'mnemonic',
			words: 'armed pink solve client dignity alarm earn impose acquire rib eyebrow engage dragon face funny'.split(' ')
		},
		networkId: NETWORK_ID.PREPROD
	})
	const account = wallet.getAccount()
	console.log('Account created:', account.baseAddressBech32)

	const txBuilder = new TxBuilder({
		verbose: false
	})
	const tx = await txBuilder
		.setInputs([
			{
				input: {
					outputIndex: 0,
					txHash: 'b7652cf0a58d40cf6ce92168eff37266052f8ce4e9e3efa358fd1a3590b68ccb'
				},
				output: {
					address: account.baseAddressBech32,
					amount: [
						{
							unit: 'lovelace',
							quantity: '5000000'
						}
					],
					datumHash: null,
					inlineDatum: null,
					scriptRef: null,
					scriptHash: null
				}
			}
		])
		.addLovelaceOutput(account.baseAddressBech32, '2000000')
		.changeAddress(account.baseAddressBech32)
		// .txOutInlineDatumValue(
		// 	CardanoWASM.PlutusData.from_json(
		// 		JSON.stringify({ message: 'Hello, world!' }),
		// 		CardanoWASM.PlutusDatumSchema.BasicConversions
		// 	)
		// )
		// .metadataValue('674', {
		// 	message: 'Hello I am Ania!',
		// 	timestamp: 17000,
		// 	sender: 'Ania'
		// })
		.complete()
	const txId = Deserializer.deserializeTx(tx.to_hex()).transaction_hash().to_hex()
	console.log('Transaction created successfully:', txId)
	// Sign the transaction
	const signedTx = await wallet.signTx(tx.to_hex())
	console.log('Transaction signed successfully:', signedTx)
	// Log the transaction details
	console.log('Transaction hex:', tx.to_hex())
	console.log('Transaction details:', Deserializer.deserializeTx(tx.to_hex()).auxiliary_data()?.to_json())
}
