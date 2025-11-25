import { TxBuilder } from '@hydra-sdk/transaction'
import { HydraApi, wallet, walletAddress } from './common'

async function buildTx(lovelace: number) {
	const addressUTxO = await HydraApi.queryAddressUTxO(walletAddress)
	console.log('>>> Query UTxO: ', walletAddress, addressUTxO.length, 'UTxOs found')
	const totalLovelace = addressUTxO.reduce(
		(a, b) => a + Number(b.output.amount.find(x => x.unit === 'lovelace')?.quantity || 0),
		0
	)
	if (totalLovelace < lovelace) {
		throw new Error(`Not enough lovelace. Have ${totalLovelace}, need ${lovelace}`)
	}
	console.log(
		'>>> total lovelace:',
		totalLovelace,
		'lovelace',
		' => ',
		(Number(totalLovelace) / 1_000_000).toFixed(6),
		'ADA'
	)

	const txBuilder = new TxBuilder({
		params: {
			minFeeA: 0,
			minFeeB: 0
		}
	})
	const tx = await txBuilder
		.setInputs(addressUTxO)
		.addOutput({
			address: walletAddress, // some random address
			amount: [{ unit: 'lovelace', quantity: String(lovelace) }]
		})
		.changeAddress(walletAddress)
		.complete()

	const signedCbor = await wallet.signTx(tx.to_hex())
	console.log('>>> signed tx:', signedCbor)
}

if (process.argv[2]) {
	const lovelace = parseInt(process.argv[2], 10)
	console.log('Lovelace to send:', lovelace)
	buildTx(lovelace)
}
