import { TxBuilder } from '@hydra-sdk/transaction'
import { HydraBridge } from '@hydra-sdk/bridge'
import { hydraConfig, wallet, walletAddress } from './common'
import { Deserializer, Resolver } from '@hydra-sdk/core'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

async function main() {
	try {
		const decommitAmountLovelace = process.argv[2] ? parseInt(process.argv[2]) : undefined
		if (!decommitAmountLovelace) {
			console.error('Please provide the amount to decommit in lovelace as a command line argument')
			console.error('Usage: npx tsx src/hydra/decommit.ts <amount_in_lovelace>')
			process.exit(1)
		}

		const bridge = new HydraBridge({
			url: hydraConfig.wsUrl
		})
		const connected = await bridge.connect()
		if (!connected) {
			throw new Error('Failed to connect to Hydra node')
		}
		console.log('>>> Connected to Hydra node')

		const addrUtxos = await bridge.queryAddressUTxO(walletAddress)
		console.log('>>> Address      :', walletAddress)
		console.log('>>> Address UTxOs:', addrUtxos.length)
		for (const utxo of addrUtxos) {
			console.log(
				`  - ${utxo.input.txHash}#${utxo.input.outputIndex} : ${utxo.output.amount.map(a => `${a.quantity} ${a.unit}`).join(', ')}`
			)
		}
		let txBuilder = new TxBuilder({
			isHydra: true,
			params: {
				minFeeA: 0,
				minFeeB: 0
			}
		})

		// Split utxos if necessary to get the required amount for decommit
		const totalLovelace = addrUtxos.reduce((sum, utxo) => {
			const lovelaceAmount = utxo.output.amount.find(a => a.unit === 'lovelace')
			return sum + (lovelaceAmount ? Number(lovelaceAmount.quantity) : 0)
		}, 0)

		if (totalLovelace < Number(decommitAmountLovelace)) {
			console.error(
				`Not enough lovelace in the address to decommit. Required: ${decommitAmountLovelace}, Available: ${totalLovelace}`
			)
			process.exit(1)
		}
		// Find utxo to decommit
		let utxoToDecommit = addrUtxos.find(utxo => {
			const lovelaceAmount = utxo.output.amount.find(a => a.unit === 'lovelace')
			return (
				utxo.output.amount.length === 1 && lovelaceAmount && Number(lovelaceAmount.quantity) === decommitAmountLovelace
			)
		})

		if (!utxoToDecommit) {
			const tx = await txBuilder
				.setInputs(addrUtxos)
				.addOutput({
					address: walletAddress,
					amount: [{ unit: 'lovelace', quantity: String(decommitAmountLovelace) }]
				})
				.changeAddress(walletAddress)
				.complete()

			const signedCbor = await wallet.signTx(tx.to_hex())
			const txId = Resolver.resolveTxHash(signedCbor)
			const { isConfirmed } = await bridge.submitTxSync({
				cborHex: signedCbor,
				txId,
				description: 'Preparing for decommit',
				type: 'Witnessed Tx ConwayEra'
			})
			if (!isConfirmed) {
				console.error('Transaction not confirmed after submission')
				process.exit(1)
			}

			utxoToDecommit = await bridge
				.queryAddressUTxO(walletAddress)
				.then(utxos =>
					utxos.find(
						u =>
							u.input.txHash === txId &&
							u.output.amount.some(a => a.unit === 'lovelace' && a.quantity === String(decommitAmountLovelace))
					)
				)
		}
		if (!utxoToDecommit) {
			console.error('Failed to find the UTxO for decommit after transaction confirmation')
			process.exit(1)
		}
		console.log('UTxO for decommit: ')
		console.log(
			`  - ${utxoToDecommit.input.txHash}#${utxoToDecommit.input.outputIndex} : ${utxoToDecommit.output.amount.map(a => `${a.quantity} ${a.unit}`).join(', ')}`
		)

		// Build Tx for decommit
		txBuilder = new TxBuilder({
			isHydra: true,
			params: {
				minFeeA: 0,
				minFeeB: 0
			}
		})
		const decommitTx = await txBuilder.setInputs([utxoToDecommit]).changeAddress(walletAddress).complete()

		const signedCbor = await wallet.signTx(decommitTx.to_hex())
		console.log('>>> / decommit.ts:113 / signedCbor:', signedCbor)

		process.exit(1) // Temporary exit to prevent actual decommit during testing
		const rs = await bridge.decommit({
			cborHex: signedCbor,
			txId: Resolver.resolveTxHash(signedCbor),
			timeout: 30000
		})
		console.log(rs)
		if (rs.tag === 'DecommitApproved' && rs.decommitTxId && rs.utxoToDecommit) {
			console.log('>>> Decommit successful!')
			console.log('Decommit Tx ID:', rs.decommitTxId)
			console.log('Decommitted UTxO:', rs.utxoToDecommit)
		} else {
			console.error('Decommit failed or timed out')
			process.exit(1)
		}
		process.exit(0)
	} catch (error) {
		console.error('Error in decommit process:', error)
		process.exit(1)
	}
}
main()
