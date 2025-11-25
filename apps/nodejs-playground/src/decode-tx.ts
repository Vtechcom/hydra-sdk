import { Deserializer } from '@hydra-sdk/core'

async function run() {
	const cborHex = process.argv[2]
	if (!cborHex) {
		console.error('Please provide a transaction CBOR hex string as a command line argument.')
		process.exit(1)
	}
	const deserializedTx = Deserializer.deserializeTx(cborHex)

	console.log('script_data_hash:', deserializedTx.body().script_data_hash()?.to_hex())
	console.log('collateral:', deserializedTx.body().collateral()?.to_json())
	console.log('collateral return:', deserializedTx.body().collateral_return()?.to_json())
}
run()
