import { wallet, walletAddress } from './common'
import { buildRedeemer, emptyRedeemer, TxBuilder } from '@hydra-sdk/transaction'
// import contract from './plutus-v3.json'
import contract from './always-true.json'
import {
	AppWallet,
	Deserializer,
	ParserUtils,
	NETWORK_ID,
	SLOT_CONFIG_NETWORK,
	TimeUtils,
	ProviderUtils
} from '@hydra-sdk/core'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { writeFile } from 'node:fs'
import { getEnvVar } from '../env'

export const unlock = async (txHash: `${string}#${number}`) => {
	console.log('>>> Create txUnlock: ', txHash)
	try {
		const provider = new ProviderUtils.BlockfrostProvider({
			apiKey: getEnvVar('BLOCKFROST_PROVIDER_API_KEY'),
			network: 'preprod'
		})
		console.log('>>> Query UTxO: ', walletAddress)
		const addressUTxO = await provider.fetcher.fetchAddressUTxOs(walletAddress)
		console.log('>>> Query UTxO: ', walletAddress, addressUTxO.length, 'UTxOs found')
		// get collateral utxo of address
		const collateralUTxOs = addressUTxO.filter(u =>
			u.output.amount.find(a => a.unit === 'lovelace' && Number(a.quantity) >= 5_000_000)
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
		const contractUTxO = await provider.fetcher.fetchAddressUTxOs(contract.address)
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
		/**
		 * Trong case này, yêu cầu:
		 * - UTxO scriptUTxO được lock với datum { owner: <paymentKeyHash> }
		 * - Khi unlock, tx phải có requiredSigner là key của ví vận hành service e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebf
		 * - Đồng thời, tx phải được sign bởi key của ví vận hành service
		 * - Như vậy, chỉ có ví vận hành service mới unlock được UTxO này
		 */

		// Get current era summary from ogmios
		// const tip = await OgmiosApi.queryTip()
		// console.log('>>> / tip:', tip)

		// Build txUnlock
		const txBuilder = new TxBuilder({
			// verbose: true,
			isHydra: true,
			errorLogger: true,
			params: {
				// minFeeA: 0,
				// minFeeB: 0
			}
		})
		const txUnlock = await txBuilder
			.setInputs(
				addressUTxO.filter(
					u =>
						`${u.input.txHash}#${u.input.outputIndex}` !==
						`${collateralUTxO.input.txHash}#${collateralUTxO.input.outputIndex}`
				) // exclude collateralUTxO
			)
			.txIn(scriptUTxO.input.txHash, scriptUTxO.input.outputIndex, scriptUTxO.output.amount, scriptUTxO.output.address)
			.txInScript(contract.cborHex)
			.txInInlineDatum(scriptUTxO.output.inlineDatum!)
			// .txInDatumHash(datum)
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
			.invalidBefore(TimeUtils.unixTimeToEnclosingSlot(Date.now(), SLOT_CONFIG_NETWORK.PREPROD)) // must be after current slot
			.invalidAfter(TimeUtils.unixTimeToEnclosingSlot(Date.now() + 60 * 60 * 1000, SLOT_CONFIG_NETWORK.PREPROD)) // must be within 3 minutes
			.setFee('1900000')

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

		// Sign with the wallet
		const signedCbor1 = await wallet.signTx(unsignedCbor) // partial sign
		console.log('>>> txUnlock:signed by wallet:', signedCbor1)
		provider.submitter.submitTx(signedCbor1).then(rs => {
			console.log('>>> txUnlock:submitted by wallet :', rs)
		})
		return

		// Sign with the distributor wallet
		const signedCbor2 = await distributorWallet.signTx(signedCbor1, true) // final sign
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
		writeFile('.output/txUnlock.signed.cbor', signedCbor1, () => {
			console.log('>>> txUnlock:signed by distributor: written to file: .output/txUnlock.signed.cbor')
		})
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
