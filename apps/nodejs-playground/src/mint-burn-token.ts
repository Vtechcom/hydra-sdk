import {
	AppWallet,
	DatumUtils,
	NETWORK_ID,
	PolicyUtils,
	Deserializer,
	Serializer,
	ProviderUtils,
	ParserUtils
} from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { getEnvVar } from './env'
import { createInterface, Readline } from 'node:readline/promises'

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
const blockfrostProvider = new ProviderUtils.BlockfrostProvider({
	apiKey: getEnvVar('BLOCKFROST_PROVIDER_API_KEY'),
	network: 'preprod'
})
const wallet = new AppWallet({
	key: {
		type: 'mnemonic',
		words: 'enable away depend exist mad february table onion census praise spawn pipe again angle grant'.split(' ')
	},
	networkId: NETWORK_ID.PREPROD,
	fetcher: blockfrostProvider.fetcher,
	submitter: blockfrostProvider.submitter
})
const walletAddress = wallet.getAccount().baseAddressBech32
console.log('Wallet Address:', walletAddress)

async function mintToken() {
	// Query UTxO
	console.log('>>> Querying UTxO... ', walletAddress)
	const utxos = await wallet.queryUTxOs(walletAddress)
	console.log('>>> Query UTxO: ', walletAddress, utxos.length, 'UTxOs found')
	// get collateral utxo of address
	const collateralUTxOs = utxos.filter(u =>
		u.output.amount.find(a => a.unit === 'lovelace' && Number(a.quantity) >= 5_000_000)
	)

	if (!collateralUTxOs.length) {
		throw new Error('No collateral UTxOs found')
	}
	const collateralUTxO = collateralUTxOs[0]
	// Build tx
	const txBuilder = new TxBuilder()

	const scriptCborHex = PolicyUtils.buildMintingPolicyScriptFromAddress(walletAddress)
	const policyId = PolicyUtils.policyIdFromNativeScript(scriptCborHex)
	const assetNameHex = ParserUtils.stringToHex('AniaToken')
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
	const signedCbor = await wallet.signTx(tx.to_hex())
	console.log('>>> signed tx:', signedCbor)
	const rs = await wallet.submitTx(signedCbor)
	console.log('>>> tx submit result:', rs)
}

async function burnToken() {
	// test

	// Query UTxO
	console.log('>>> Querying UTxO... ', walletAddress)
	const utxos = await wallet.queryUTxOs(walletAddress)
	console.log('>>> Query UTxO: ', walletAddress, utxos.length, 'UTxOs found')
	// get collateral utxo of address
	const collateralUTxOs = utxos.filter(u =>
		u.output.amount.find(a => a.unit === 'lovelace' && Number(a.quantity) >= 5_000_000)
	)

	if (!collateralUTxOs.length) {
		throw new Error('No collateral UTxOs found')
	}
	const collateralUTxO = collateralUTxOs[0]

	// Build tx
	const txBuilder = new TxBuilder()

	const scriptCborHex = PolicyUtils.buildMintingPolicyScriptFromAddress(walletAddress)
	const policyId = PolicyUtils.policyIdFromNativeScript(scriptCborHex)
	const assetNameHex = ParserUtils.stringToHex('AniaToken')
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

	const signedCbor = await wallet.signTx(tx.to_hex())
	console.log('>>> signed tx:', signedCbor)
	const rs = await wallet.submitTx(signedCbor)
	console.log('>>> tx submit result:', rs)
}

;(async () => {
	console.log('Mint / Burn Token Demo')
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout
	})
	rl.question('1. Mint Token\n2. Burn Token\nChoose an action (1 or 2): ').then(async answer => {
		if (answer === '1') {
			await mintToken()
			rl.close()
		} else if (answer === '2') {
			await burnToken()
			rl.close()
		} else {
			console.log('Invalid input! Please enter 1 or 2.\n')
			process.exit(0)
		}
	})
})()
