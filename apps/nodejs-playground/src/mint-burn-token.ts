import { AppWallet, DatumUtils, NETWORK_ID, PolicyUtils, Deserializer, Serializer, stringToHex } from '@hydra-sdk/core'
import { HexcoreApi } from './contract/common'
import { TxBuilder } from '@hydra-sdk/transaction'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

const buildDatum = (key: string, l1Vkh: string, l2Vkh: string, amount: string): CardanoWASM.PlutusData => {
	// innermost constructors
	const bKey = DatumUtils.mkBytes(key)
	const cL1Vkh = DatumUtils.mkConstr(0, [DatumUtils.mkBytes(l1Vkh)])
	const cL2Vkh = DatumUtils.mkConstr(0, [DatumUtils.mkBytes(l2Vkh)])

	// { constructor: 0, fields: [ bytes A, constr(B), constr(C) ] }
	const constrKey = DatumUtils.mkConstr(0, [bKey, cL1Vkh, cL2Vkh])
	// wrap once: { constructor: 0, fields: [ cABC ] }
	const wrap1 = DatumUtils.mkConstr(0, [constrKey])

	// Second field: nested map: { "" => { "" => 10000000 } }
	const emptyBytes = DatumUtils.mkBytes('') // key = empty ByteString
	const mapVal = CardanoWASM.PlutusMapValues.new()
	mapVal.add(DatumUtils.mkInt(amount))
	const innerMap = DatumUtils.mkMap([[emptyBytes, mapVal]])

	const outerMapVal = CardanoWASM.PlutusMapValues.new()
	outerMapVal.add(innerMap)
	const outerMap = DatumUtils.mkMap([[emptyBytes, outerMapVal]])

	// Top-level: constructor 0 with two fields: [wrap1, outerMap]
	return DatumUtils.mkConstr(0, [wrap1, outerMap])
}

const wallet = new AppWallet({
	key: {
		type: 'mnemonic',
		words: 'enable away depend exist mad february table onion census praise spawn pipe again angle grant'.split(' ')
	},
	networkId: NETWORK_ID.PREPROD
})
console.log('Delta DeFi Build Script - No operations defined yet.')
const walletAddress = wallet.getAccount().baseAddressBech32
console.log('Wallet Address:', walletAddress)

async function mintToken() {
	// Query UTxO
	console.log('>>> Querying UTxO... ', walletAddress)
	const utxos = await HexcoreApi.queryAddressUTxO(walletAddress)
	console.log('>>> Query UTxO: ', walletAddress, utxos.length, 'UTxOs found')
	// get collateral utxo of address
	const collateralUTxOs = utxos.filter(u =>
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

	// Build tx
	const txBuilder = new TxBuilder()

	const scriptCborHex = PolicyUtils.buildMintingPolicyScriptFromAddress(walletAddress)
	const policyId = PolicyUtils.policyIdFromNativeScript(scriptCborHex)
	const assetNameHex = stringToHex('AniaToken')
	const assetMetadata = {
		name: 'Ada Binary Option Token',
		description: 'Utility token for Cardano Binary Option demo project',
		ticker: 'tABO',
		url: 'https://preprod.ada-defi.io.vn',
		logo: 'ipfs://Qmaqj4Lg51s9gL654zwFfcimHNcX4GLno7okEdyCGPor2i',
		image: 'ipfs://Qmaqj4Lg51s9gL654zwFfcimHNcX4GLno7okEdyCGPor2i'
	}

	console.log('>>> / script:', scriptCborHex)
	console.log('>>> / policy ID:', policyId)

	const tx = await txBuilder
		.setInputs(
			utxos.filter(
				u =>
					`${u.input.txHash}#${u.input.outputIndex}` !== `${collateralUTxO.input.txHash}#${collateralUTxO.input.outputIndex}`
			) // exclude collateralUTxO
		)
		.mint('1000000', policyId, assetNameHex)
		.mintingScript({
			type: 'Native',
			scriptCborHex: scriptCborHex
		})
		.metadataValue(721, { [policyId]: { [assetNameHex]: { ...assetMetadata } } })
		.txInCollateral(
			collateralUTxO.input.txHash,
			collateralUTxO.input.outputIndex,
			collateralUTxO.output.amount,
			collateralUTxO.output.address
		)
		.addOutput({
			address: walletAddress,
			amount: [
				{ unit: 'lovelace', quantity: String(2_000_000) },
				{ unit: Serializer.serializeAssetUnit(policyId, assetNameHex), quantity: '1000000' }
			]
		})
		.changeAddress(walletAddress)
		.complete()

	console.log('>>> unsigned tx:', tx.to_hex())
	const signedCbor = await wallet.signTx(tx.to_hex())
	console.log('>>> signed tx:', signedCbor)
	console.log('>>> signed tx id:', Deserializer.deserializeTx(signedCbor).transaction_hash().to_hex())
}

async function burnToken() {
	// test

	// Query UTxO
	console.log('>>> Querying UTxO... ', walletAddress)
	const utxos = await HexcoreApi.queryAddressUTxO(walletAddress)
	console.log('>>> Query UTxO: ', walletAddress, utxos.length, 'UTxOs found')
	// get collateral utxo of address
	const collateralUTxOs = utxos.filter(u =>
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

	// Build tx
	const txBuilder = new TxBuilder()

	const datum = buildDatum(
		'ee91e90e791e4cd983d1b1f331d1e8eb',
		'326cd6bff6114c4d14ebf2385883aac43c4e64476e6a47314f9b2003',
		'f602ad4b16ec2e1a96989dc140eacf546359695cfece8510c8d1c0ac',
		'4000000'
	)
	console.log('>>> Datum:', datum.to_json(CardanoWASM.PlutusDatumSchema.DetailedSchema))

	const scriptCborHex = PolicyUtils.buildMintingPolicyScriptFromAddress(walletAddress)
	const policyId = PolicyUtils.policyIdFromNativeScript(scriptCborHex)
	const assetNameHex = stringToHex('AniaToken')
	console.log('>>> / script:', scriptCborHex)
	console.log('>>> / policy ID:', policyId)

	const tx = await txBuilder
		.setInputs(
			utxos.filter(
				u =>
					`${u.input.txHash}#${u.input.outputIndex}` !== `${collateralUTxO.input.txHash}#${collateralUTxO.input.outputIndex}`
			) // exclude collateralUTxO
		)
		.mint('-1000000', policyId, assetNameHex)
		.mintingScript({
			type: 'Native',
			scriptCborHex: scriptCborHex
		})
		.changeAddress(walletAddress)
		.complete()

	console.log('>>> unsigned tx:', tx.to_hex())
	const signedCbor = await wallet.signTx(tx.to_hex())
	console.log('>>> signed tx:', signedCbor)
	console.log('>>> signed tx id:', Deserializer.deserializeTx(signedCbor).transaction_hash().to_hex())
	// const rs = await OgmiosApi.submitTransaction(signedCbor)
}

mintToken()
// burnToken()
