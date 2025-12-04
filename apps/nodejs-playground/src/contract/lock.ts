import { TxBuilder } from '@hydra-sdk/transaction'
// import contract from './plutus-v3.json'
import contract from './always-true.json'
import { HexcoreApi, OgmiosApi, wallet, walletAddress } from './common'
import { Deserializer, ParserUtils, SLOT_CONFIG_NETWORK, TimeUtils } from '@hydra-sdk/core'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

const lock = async () => {
	// txlock
	try {
		const account = wallet.getAccount()
		console.log('>>> account.signer_hash:', CardanoWASM.Ed25519Signature.from_hex(account.paymentKeyHex).to_hex())

		console.log('>>> Query UTxO: ', walletAddress)
		const addressUTxO = await HexcoreApi.queryAddressUTxO(walletAddress)
		console.log('>>> Query UTxO: ', walletAddress, addressUTxO.length, 'UTxOs found')

		console.log('>>> Create txLock')

		// Build datum
		const { paymentCredentialHash: pubKeyHash } = Deserializer.deserializeAddress(walletAddress)
		const system_unlocked_at = String(Date.now() + 10 * 60 * 1000) // now + 10 minutes

		const plutusList = CardanoWASM.PlutusList.new()
		plutusList.add(CardanoWASM.PlutusData.new_bytes(ParserUtils.hexToBytes(pubKeyHash!)))
		plutusList.add(CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str(system_unlocked_at))) // now + 1 minutes

		const datum = CardanoWASM.PlutusData.new_constr_plutus_data(
			CardanoWASM.ConstrPlutusData.new(CardanoWASM.BigNum.from_str('0'), plutusList)
		)
		console.log('>>> / datum hex:', datum.to_hex())
		console.log('>>> / datum obj:', datum.to_json(CardanoWASM.PlutusDatumSchema.DetailedSchema))
		// return
		const txBuilder = new TxBuilder()
		const txLock = await txBuilder
			.setInputs(addressUTxO)
			.addOutput({
				address: contract.address,
				amount: [{ unit: 'lovelace', quantity: String(5_000_000) }]
			})
			.txOutInlineDatumValue(datum)
			// .txOutDatumHashValue(datum)
			.changeAddress(walletAddress)
			.complete()

		console.log('>>> txLock:', txLock.to_hex())

		const signedCbor = await wallet.signTx(txLock.to_hex())
		console.log('>>> txLock:signed:', signedCbor)

		const rs = await OgmiosApi.submitTransaction(signedCbor)
		console.log('>>> txLock:rs:', rs.data)
		const tx = Deserializer.deserializeTx(signedCbor)
		console.log('>>> txLock:txId:', tx.transaction_hash().to_hex())

		// const txId = rs.result.transaction.id
		//
	} catch (error) {
		console.error('Error creating txLock:', error)
	}
}

lock()
