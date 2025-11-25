import { AppWallet, Converter, Deserializer, Resolver, TxHash, UTxO, UTxOObject } from '@hydra-sdk/core'
import { DepositToken, HydraApi, wallet, walletAddress } from './common'
import { TxBuilder } from '@hydra-sdk/transaction'

/**
 * Partial commit example
 * 1. Make sure you have some assets in your wallet
 * 2. Run this script to create a partial commit transaction
 * 3. Sign the transaction and submit it to Hydra node
 *
 * Note: Build the blueprint transaction
 * - https://hydra.iohk.io/docs/hydra-node/tutorials/blueprint-tx/
 * - The outputs of the blueprint transaction will be used as inputs for the partial commit transaction
 *
 * Command:
 * > npx ts-node src/hydra/partial-commit.ts
 */
async function main() {
	console.log('>>> walletAddress:', walletAddress)
	const l1UTxOs = await wallet.queryUTxOs(walletAddress)

	const depositLovelace = 180_000_000 // 180 ADA
	// assets to deposit
	const depositAssetUnits = [
		// asset unit
		{
			unit: 'e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed724d494e',
			quantity: '1000000' // 1.000.000
		}
	]

	// check if exist asset in the wallet
	const hasAsset = l1UTxOs.some(utxo =>
		utxo.output.amount.some(a => depositAssetUnits.findIndex(b => b.unit === a.unit) >= 0)
	)
	if (!hasAsset) {
		throw new Error(`No asset ${depositAssetUnits.join(', ')} found in the wallet`)
	}

	const txBuilder = new TxBuilder({
		errorLogger: true,
		isHydra: true,
		params: {
			minFeeA: 0,
			minFeeB: 0
		}
	})

	// build the blueprint transaction
	const blueprintTx = await txBuilder
		.setInputs(l1UTxOs)
		.addOutput({
			address: walletAddress,
			amount: [{ unit: 'lovelace', quantity: depositLovelace.toString() }, ...depositAssetUnits]
		})
		.setFee('0')
		.complete()

	console.log('>>> / partial-commit.ts:60 / blueprintTx.to_hex():', blueprintTx.to_hex())
	const txHash = Resolver.resolveTxHash(blueprintTx.to_hex())
	console.log('>>> / partial-commit.ts:62 / txHash:', txHash)

	const txInputs = Deserializer.deserializeTx(blueprintTx.to_hex()).body().inputs()
	const utxoToCommit: UTxO[] = []
	for (let i = 0; i < txInputs.len(); i++) {
		const input = txInputs.get(i)
		if (input) {
			const utxo = l1UTxOs.find(
				u => u.input.txHash === input.transaction_id().to_hex() && u.input.outputIndex === input.index()
			)
			if (utxo) {
				utxoToCommit.push(utxo)
			}
		}
	}

	const partialCommitResult = await HydraApi.partialDeposit(
		blueprintTx.to_hex(),
		Converter.convertUTxOToUTxOObject(utxoToCommit),
		walletAddress
	)
	if (partialCommitResult) {
		const signedTx = await wallet.signTx(partialCommitResult.cborHex, true)
		console.log('>>> Signed partial commit tx:', { ...partialCommitResult, cborHex: signedTx })
	}
}

main()
