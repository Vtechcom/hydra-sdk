import { HexcoreApi, HydraApi, wallet, walletAddress } from './common'
import { buildRedeemer, emptyRedeemer, TxBuilder } from '@hydra-sdk/transaction'
import contract from './plutus-v3.json'
// import contract from './always-true.json'
import { AppWallet, Deserializer, NETWORK_ID, SLOT_CONFIG_NETWORK, TimeUtils } from '@hydra-sdk/core'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { writeFile } from 'node:fs'
import axios from 'axios'

export const unlock = async (txHash: `${string}#${number}`) => {
	console.log('>>> Create txUnlock: ', txHash)
	try {
		console.log('>>> Query UTxO: ', walletAddress)
		const addressUTxO = await HydraApi.queryAddressUTxO(walletAddress)
		console.log('>>> Query UTxO: ', walletAddress, addressUTxO.length, 'UTxOs found')
		// get collateral utxo of address
		const collateralUTxOs = addressUTxO.filter(
			u =>
				u.output.amount.find(a => a.unit === 'lovelace' && Number(a.quantity) >= 3_000_000) && //
				u.output.amount.length === 1 // only lovelace
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
		const inputUTxOs = addressUTxO.filter(
			u => u.input.txHash !== collateralUTxO.input.txHash && u.input.outputIndex !== collateralUTxO.input.outputIndex
		)

		console.log('>>> Query UTxO: ', contract.address)
		const contractUTxO = await HydraApi.queryAddressUTxO(contract.address)
		const scriptUTxO = contractUTxO.find(u => `${u.input.txHash}#${u.input.outputIndex}` === txHash)
		if (!scriptUTxO) {
			throw new Error('No script UTxO found for txHash')
		}
		console.log('>>> / scriptUTxO:', JSON.stringify(scriptUTxO, null, 2))

		const txRedeemer = buildRedeemer({
			key: 'secret_key',
			receive_addr: 'addr_keyhash'
		})

		// To unlock this scriptUTxO, we need to provide signer hash in requiredSigners
		// which is the hash of the payment key of the wallet
		// because in the datum, we locked it with owner = <paymentKeyHash>
		// So when we unlock, we need to provide the same paymentKeyHash in requiredSigners
		// This will ensure that only the owner of the payment key can unlock the UTxO
		// In this case: Need to provide the paymentKeyHash of the wallet: addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3
		// With paymentKeyHash = e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebf
		/**
		 * Trong case này, yêu cầu:
		 * - UTxO scriptUTxO được lock với datum { owner: <paymentKeyHash> }
		 * - Khi unlock, tx phải có requiredSigner là key của ví vận hành service e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebf
		 * - Đồng thời, tx phải được sign bởi key của ví vận hành service
		 * - Như vậy, chỉ có ví vận hành service mới unlock được UTxO này
		 * - Output phải gửi tới address của contract: 'addr_test1wps5tz7z72tllu7vthm2c7440nhasamrkzmm6u3pg6ssxhqs8uluy'
		 * - Đây là address của contract, không phải address của ví vận hành service: Hydra Script hash: 61458bc2f297fff3cc5df6ac7ab57cefd87763b0b7bd722146a1035c
		 */

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

		const txUnlock = await txBuilder
			.setInputs(inputUTxOs)
			.txIn(scriptUTxO.input.txHash, scriptUTxO.input.outputIndex, scriptUTxO.output.amount, scriptUTxO.output.address)
			.txInScript(contract.cborHex)
			// .txInDatumHash(datum)
			.txInInlineDatum(scriptUTxO.output.inlineDatum!)
			.txInRedeemerValue(emptyRedeemer({ type: 'int', exUnits: { mem: '100000', steps: '25000000' } }))
			.txInCollateral(
				collateralUTxO.input.txHash,
				collateralUTxO.input.outputIndex,
				collateralUTxO.output.amount,
				collateralUTxO.output.address
			)
			.addOutput({
				address: walletAddress,
				amount: scriptUTxO.output.amount // send all assets back to myself
			})
			.changeAddress(walletAddress)
			.requiredSignerHash('e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebf')
			.invalidBefore(TimeUtils.unixTimeToEnclosingSlot(Date.now(), SLOT_CONFIG_NETWORK.PREPROD)) // must be after current slot
			.invalidAfter(TimeUtils.unixTimeToEnclosingSlot(Date.now() + 60 * 60 * 1000, SLOT_CONFIG_NETWORK.PREPROD)) // must be within 3 minutes
		// .setFee('1790000') // 0.1790000 ada

		const tx = await txUnlock.complete()

		// Need to sign with the payment key of the wallet
		const distributorWallet = new AppWallet({
			key: {
				type: 'mnemonic',
				words: 'daughter silk uncover cheese split ribbon treat forum belt planet divert verify easily fabric shrimp'.split(
					' '
				)
			},
			networkId: NETWORK_ID.PREPROD
		})

		const unsignedCbor = tx.to_hex()
		console.log('>>> txUnlock:unsigned:', unsignedCbor)

		// Because we need to sign with 2 keys:
		// Sign with the wallet
		const signedCbor1 = await wallet.signTx(unsignedCbor)
		console.log('>>> txUnlock:signed by wallet:', signedCbor1)

		// Sign with the distributorWallet
		const signedCbor2 = await distributorWallet.signTx(signedCbor1, true)
		console.log('>>> txUnlock:signed by distributor:', signedCbor2)

		// Export to file
		const deserializedTx = Deserializer.deserializeTx(signedCbor2)

		writeFile('.output/txUnlock.inputs.json', deserializedTx.body().inputs().to_json(), () => {
			console.log('>>> txUnlock:signed by distributor: written to file: .output/txUnlock.inputs.json')
		})
		writeFile('.output/txUnlock.outputs.json', deserializedTx.body().outputs().to_json(), () => {
			console.log('>>> txUnlock:signed by distributor: written to file: .output/txUnlock.outputs.json')
		})
		writeFile('.output/txUnlock.unsigned.cbor', tx.to_hex(), () => {
			console.log('>>> txUnlock:unsigned by distributor: written to file: .output/txUnlock.unsigned.cbor')
		})
		writeFile('.output/txUnlock.signed.cbor', signedCbor2, () => {
			console.log('>>> txUnlock:signed by distributor: written to file: .output/txUnlock.signed.cbor')
		})

		console.log(
			'>>> ChainPoint',
			new Date(TimeUtils.slotToBeginUnixTime(102672789, SLOT_CONFIG_NETWORK.PREPROD)).toLocaleString('vi-VN')
		)
	} catch (error) {
		console.error('Error creating txUnlock:', error)
	}
}

// unlock
// run command: npx tsx src/contract/unlock.ts <txHash#index>
// example: npx tsx src/contract/unlock.ts c0fd0d0f09ab82f1617a859274e05d83bfe88cbc41da1e436ac780f394fc98d8#0

if (process.argv[2] && process.argv[2].includes('#')) {
	unlock(process.argv[2] as `${string}#${number}`)
}
