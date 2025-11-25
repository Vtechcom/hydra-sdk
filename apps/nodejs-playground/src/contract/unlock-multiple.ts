import { HexcoreApi, HydraApi, wallet, walletAddress } from './common'
import { buildRedeemer, emptyRedeemer, TxBuilder } from '@hydra-sdk/transaction'
import contract from './plutus-v3.json'
// import contract from './always-true.json'
import {
	AppWallet,
	deserializeAddress,
	deserializeTx,
	hexToBytes,
	NETWORK_ID,
	SLOT_CONFIG_NETWORK,
	TimeUtils
} from '@hydra-sdk/core'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { writeFile } from 'node:fs'

export const unlockMultiple = async (txHashes: Array<`${string}#${number}`>) => {
	console.log('>>> Create txUnlock: ', txHashes)
	try {
		const distributorWallet = new AppWallet({
			key: {
				type: 'mnemonic',
				words: 'daughter silk uncover cheese split ribbon treat forum belt planet divert verify easily fabric shrimp'.split(
					' '
				)
			},
			networkId: NETWORK_ID.PREPROD
		})
		console.log('>>> Query UTxO: ', distributorWallet.getAccount().baseAddressBech32)
		const addressUTxO = await HydraApi.queryAddressUTxO(distributorWallet.getAccount().baseAddressBech32)
		console.log('>>> Query UTxO: ', distributorWallet.getAccount().baseAddressBech32, addressUTxO.length, 'UTxOs found')
		// get collateral utxo of address
		const collateralUTxOs = addressUTxO.filter(
			u =>
				u.output.amount.find(a => a.unit === 'lovelace' && Number(a.quantity) >= 5_000_000) && u.output.amount.length === 1 // only lovelace
		)

		if (!collateralUTxOs.length) {
			throw new Error('No collateral UTxOs found')
		}
		const collateralUTxO = collateralUTxOs[0]
		console.log(
			'>>> / collateralUTxOs:',
			collateralUTxOs.length,
			'collateralUTxOs found, using:',
			JSON.stringify(collateralUTxO, null, 2)
		)

		console.log('>>> Query UTxO: ', contract.address)
		const contractUTxO = await HydraApi.queryAddressUTxO(contract.address)
		const scriptUTxOs = contractUTxO.filter(u => txHashes.includes(`${u.input.txHash}#${u.input.outputIndex}`))
		if (!scriptUTxOs.length) {
			throw new Error('No script UTxO found for txHashes')
		}
		scriptUTxOs.forEach(u => {
			if (!txHashes.includes(`${u.input.txHash}#${u.input.outputIndex}`)) {
				throw new Error('No script UTxO found for txHash: ' + `${u.input.txHash}#${u.input.outputIndex}`)
			}
		})
		console.log('>>> / scriptUTxOs:', JSON.stringify(scriptUTxOs, null, 2))
		const totalScriptLovelace = scriptUTxOs.reduce((sum, u) => {
			const lovelace = u.output.amount.find(a => a.unit === 'lovelace')
			return sum + (lovelace ? Number(lovelace.quantity) : 0)
		}, 0)
		console.log('>>> / totalScriptLovelace:', totalScriptLovelace)

		// Build txUnlock
		const txBuilder = new TxBuilder({
			// verbose: true,
			isHydra: true,
			errorLogger: true,
			params: {
				minFeeA: 0,
				minFeeB: 0
			}
		})
		// Build datum

		txBuilder.setInputs(
			addressUTxO.filter(
				u =>
					`${u.input.txHash}#${u.input.outputIndex}` !== `${collateralUTxO.input.txHash}#${collateralUTxO.input.outputIndex}`
			) // exclude collateralUTxO
		)
		for (const scriptUTxO of scriptUTxOs) {
			txBuilder
				.txIn(scriptUTxO.input.txHash, scriptUTxO.input.outputIndex, scriptUTxO.output.amount, scriptUTxO.output.address)
				.txInScript(contract.cborHex)
				.txInInlineDatum(scriptUTxO.output.inlineDatum!)
				// .txInDatumHash(datum)
				.txInRedeemerValue(emptyRedeemer({ type: 'int', exUnits: { mem: '100000', steps: '25000000' } }))
		}
		txBuilder
			.txInCollateral(
				collateralUTxO.input.txHash,
				collateralUTxO.input.outputIndex,
				collateralUTxO.output.amount,
				collateralUTxO.output.address
			)
			.addOutput({
				address: walletAddress,
				amount: [{ unit: 'lovelace', quantity: totalScriptLovelace.toString() }] // send all assets back to myself
			})
			.changeAddress(distributorWallet.getAccount().baseAddressBech32)
			.requiredSignerHash('e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebf')
		// .invalidBefore(TimeUtils.unixTimeToEnclosingSlot(Date.now(), SLOT_CONFIG_NETWORK.PREPROD)) // must be after current slot
		// .invalidAfter(TimeUtils.unixTimeToEnclosingSlot(Date.now() + 60 * 60 * 1000, SLOT_CONFIG_NETWORK.PREPROD)) // must be within 3 minutes
		// .setFee('1790000') // 0.1790000 ada

		const tx = await txBuilder.complete()
		// Need to sign with the payment key of the wallet

		const unsignedCbor = tx.to_hex()
		console.log('>>> txUnlock:unsigned:', unsignedCbor)

		// Sign with the distributor wallet
		const signedCbor2 = await distributorWallet.signTx(unsignedCbor)
		console.log('>>> txUnlock:signed by distributor:', signedCbor2)

		// Sign with the wallet
		const signedCbor1 = await wallet.signTx(signedCbor2, true) // partial sign
		console.log('>>> txUnlock:signed by wallet:', signedCbor1)

		// Export to file
		const deserializedTx = deserializeTx(signedCbor2)

		writeFile('.output/txUnlock.inputs.json', deserializedTx.body().inputs().to_json(), () => {
			console.log('>>> txUnlock:signed by distributor: written to file: .output/txUnlock.inputs.json')
		})
		writeFile('.output/txUnlock.outputs.json', deserializedTx.body().outputs().to_json(), () => {
			console.log('>>> txUnlock:signed by distributor: written to file: .output/txUnlock.outputs.json')
		})
		writeFile('.output/txUnlock.unsigned.cbor', tx.to_hex(), () => {
			console.log('>>> txUnlock:unsigned by distributor: written to file: .output/txUnlock.unsigned.cbor')
		})
		writeFile('.output/txUnlock.signed.cbor', signedCbor1, () => {
			console.log('>>> txUnlock:signed by distributor: written to file: .output/txUnlock.signed.cbor')
		})
	} catch (error) {
		console.error('Error creating txUnlock:', error)
	}
}

unlockMultiple([`52486cb3692a4bdf8961bc4c80b93afb2a4a29eb14e90b2a157fae27ab58ce86#0`])
