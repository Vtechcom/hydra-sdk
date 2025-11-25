import { AppWallet, Asset, Deserializer, NETWORK_ID, ParserUtils, ProviderUtils } from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'
import { BigNumber } from 'bignumber.js'

async function main() {
	const blockfrostProvider = new ProviderUtils.BlockfrostProvider({
		apiKey: 'previewfAD2g4RCsAWvKnvyn7pTm8Z7hhjwvfsC',
		network: 'preview'
	})
	const address = 'addr_test1vztc80na8320zymhjekl40yjsnxkcvhu58x59mc2fuwvgkc332vxv'
	console.log('>>> NETWORK_ID:', NETWORK_ID.PREVIEW)

	const summitResult = await blockfrostProvider.submitter.submitTx(
		'84a400d901028182582018d09e233f2b3b95a5d77fa12a1ed9e73468a985a177140792d141c3b8a7eee101018282581d706a09cb22defaf4a96a6be1ef6c07467ac9923d1750a79214a06c503a821a004c4b40ac581c13d1f7feab83ff4db444bf96b8677949c5bf9c709671f30ff8f33ab3a1581d487964726120446f6f6d202d2033726420506c6163652054726f70687901581c19c98d04cdb6e1e782a73e693697d4a46ca9820d5d490a3bf6470a07a1581d487964726120446f6f6d202d20326e6420506c6163652054726f70687901581c1a22028742629f3cf38b3d1036a088fea59eb30237a675420fb25c11a142233101581c6d92350897706b14832c62c5b5644e918f0b6b3b63ffc00a1a463828a1581d487964726120446f6f6d202d2031737420506c6163652054726f70687901581cad39d849181dc206488fd726240c00b55547153ffdca8c079e1e34d9a1581d487964726120446f6f6d202d2031737420506c6163652054726f70687901581cbfe4ab531fd625ef33ea355fd85953eb944bffa401af767666ff411ca1581d487964726120446f6f6d202d2031737420506c6163652054726f70687901581cc953682b6eb5891c0bda35718c5261587d57e5e408079cbeb8cf881aa142233101581ccd6076d9d0098da4c7670c08f230e4efe31d666263c9db5196805d6ea1581d487964726120446f6f6d202d2031737420506c6163652054726f70687901581cd0c91707d75011026193c0fce742443dde66fa790936981ece5d9f8ba142233101581cd8906ca5c7ba124a0407a32dab37b2c82b13b3dcd9111e42940dcea4a1480014df105553444d1b0000001047700380581cdd7e36888a487f8b27687f65abd93e6825b4eb3ce592ee5f504862dfa1581d487964726120446f6f6d202d2031737420506c6163652054726f70687901581cfa10c5203512eeeb92bf79547b09f5cdb2e008689864b0175cca6feea1581d487964726120446f6f6d202d2034746820506c6163652054726f7068790182581d609783be7d3c54f11377966dfabc9284cd6c32fca1cd42ef0a4f1cc45b1b00000013c7a7d3fd021a00030001075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6ca100d9010281825820ce13cd433cdcb3dfb00c04e216956aeb622dcd7f282b03304d9fc9de804723b258408fdcbe33230a47d15896bb670e3171bac9bcb852d842dbccd05caa55fd9bd85d7912aff34505184946d5d7f59488d5fa46cbbe8644a08f6929240f604816fd06f5a0'
	)
	console.log('>>> / preview-tx.ts:66 / summitResult:', summitResult)
	return

	const utxos = await blockfrostProvider.fetcher.fetchAddressUTxOs(address)
	console.log('>>> UTxOs:', utxos)
	const totalLovelace = utxos.reduce(
		(a, b) => a + Number(b.output.amount.find(x => x.unit === 'lovelace')?.quantity || 0),
		0
	)
	const totalAssets = utxos.reduce(
		(acc, utxo) => {
			utxo.output.amount.forEach(a => {
				if (a.unit !== 'lovelace') {
					if (!acc[a.unit]) {
						acc[a.unit] = 0
					}
					acc[a.unit] += Number(a.quantity)
				}
			})
			return acc
		},
		{} as Record<string, number>
	)
	console.log('>>> Total assets:', Object.keys(totalAssets).length)
	const outputAssets: Asset[] = []
	for (const [unit, quantity] of Object.entries(totalAssets)) {
		const { policyId, assetName } = Deserializer.deserializeAssetUnit(unit)
		outputAssets.push({ unit, quantity: String(quantity) })
		console.log(
			`  - ${policyId}${assetName ? '.' + assetName : ''}: ${BigNumber(quantity).toFormat()} ${ParserUtils.hexToString(assetName)}`
		)
	}
	//
	console.log(
		'>>> Total lovelace:',
		totalLovelace,
		'lovelace',
		' => ',
		(Number(totalLovelace) / 1_000_000).toFixed(6),
		'ADA'
	)

	const txBuilder = new TxBuilder({})
	const tx = await txBuilder
		.setInputs(utxos)
		.addOutput({
			address: 'addr_test1wp4qnjezmma0f2t2d0s77mq8geavny3azag20ys55pk9qwsxs8emy',
			amount: [...outputAssets, { unit: 'lovelace', quantity: String(5000000) }]
		})
		.changeAddress(address)
		.complete()
	console.log('>>> tx:', tx.to_hex())
}

main()
