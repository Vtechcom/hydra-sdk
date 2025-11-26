import { TxBuilder } from '@hydra-sdk/transaction'
import { HydraBridge } from '@hydra-sdk/bridge'
import { wallet, walletAddress } from './common'
import { Resolver } from '@hydra-sdk/core'

async function main() {
	const bridge = new HydraBridge({
		url: 'wss://node-10021.hydranode.io.vn'
	})
	const connected = await bridge.connect()
	if (!connected) {
		throw new Error('Failed to connect to Hydra node')
	}
	console.log('>>> Connected to Hydra node')

	const utxoObj = await bridge.querySnapshotUtxo()
	console.log('>>> Snapshot UTxO:', utxoObj)

	const addrUtxos = await bridge.queryAddressUTxO(walletAddress)
	console.log('>>> / decommit.ts:20 / addrUtxos:', addrUtxos)
	const txBuilder = new TxBuilder({
		isHydra: true,
		params: {
			minFeeA: 0,
			minFeeB: 0
		}
	})
	const tx = await txBuilder
		.setInputs([
			addrUtxos[0] // utxo to decommit
		])
		.addOutput({
			address: walletAddress,
			amount: [{ unit: 'lovelace', quantity: String(2_000_000) }]
		})
		.changeAddress(walletAddress)
		.complete()

	const signedCbor = await wallet.signTx(tx.to_hex())
	const txId = Resolver.resolveTxHash(signedCbor)

	const rs = await bridge.decommit({
		cborHex: signedCbor,
		txId,
		timeout: 30000
	})
	console.log('>>> Submit tx result:', rs)
}
main()
