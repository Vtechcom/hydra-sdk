import { AppWallet, DatumUtils, NETWORK_ID, ParserUtils, ProviderUtils } from '@hydra-sdk/core'
import { walletPrimary } from '../__tests__/__mocks__/wallet.json'
import { getEnvVar } from '../env'
import { buildRedeemer, TxBuilder } from '@hydra-sdk/transaction'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
;(async function () {
	const provider = new ProviderUtils.BlockfrostProvider({
		network: 'preprod',
		apiKey: getEnvVar('BLOCKFROST_PROVIDER_API_KEY')
	})

	const wallet = new AppWallet({
		key: {
			type: 'mnemonic',
			words: walletPrimary.mnemonic.split(' ')
		},
		networkId: NETWORK_ID.PREPROD,
		fetcher: provider.fetcher,
		submitter: provider.submitter
	})

	const address = await wallet.getAccount().baseAddressBech32
	console.log('Wallet address:', address)
	const utxos = await wallet.queryUTxOs(address)
	console.log('Wallet UTxOs:', utxos)

	const data = [
		{
			addr_test1qzya97j3gg2lkp360m7238lfe46y0jzhl6wgsz6xysz3d5peqew2j40a7ryqyku9re6znz26uan26shczed77p9n6uwq68d0h9: [
				{ name: 'user1' },
				{ score: 4 }
			]
		},
		{
			addr_test1qqwc9nkekwyjlv4pr302ycpeegq7l3wapg87znpnf7gxpjgf9f60cdrvzuswta8g3g42l7d4m002a8ler4zxgdmvvz4s8etts2: [
				{ name: 'user2' },
				{ score: 7 }
			]
		}
	]
	const mkMapValues = (plutusList: CardanoWASM.PlutusList): CardanoWASM.PlutusMapValues => {
		const mapValues = CardanoWASM.PlutusMapValues.new()
		const data = CardanoWASM.PlutusData.new_list(plutusList)
		mapValues.add(data)
		return mapValues
	}

	// const map = CardanoWASM.PlutusMap.new()
	// map.insert(
	// 	DatumUtils.mkBytes(
	// 		'addr_test1qzya97j3gg2lkp360m7238lfe46y0jzhl6wgsz6xysz3d5peqew2j40a7ryqyku9re6znz26uan26shczed77p9n6uwq68d0h9'
	// 	),
	// 	mkMapValues(['user1'])
	// )
	// map.insert(
	// 	DatumUtils.mkBytes(
	// 		'addr_test1qqwc9nkekwyjlv4pr302ycpeegq7l3wapg87znpnf7gxpjgf9f60cdrvzuswta8g3g42l7d4m002a8ler4zxgdmvvz4s8etts2'
	// 	),
	// 	mkMapValues(['user2'])
	// )

	const list1 = CardanoWASM.PlutusList.new()
	list1.add(DatumUtils.mkBytes(ParserUtils.stringToHex('user1')))
	list1.add(DatumUtils.mkInt(4))

	const map1 = DatumUtils.mkMap([
		[
			DatumUtils.mkBytes(
				ParserUtils.stringToHex(
					'addr_test1qzya97j3gg2lkp360m7238lfe46y0jzhl6wgsz6xysz3d5peqew2j40a7ryqyku9re6znz26uan26shczed77p9n6uwq68d0h9'
				)
			),
			mkMapValues(list1)
		],
		[
			DatumUtils.mkBytes(
				ParserUtils.stringToHex(
					'addr_test1qqwc9nkekwyjlv4pr302ycpeegq7l3wapg87znpnf7gxpjgf9f60cdrvzuswta8g3g42l7d4m002a8ler4zxgdmvvz4s8etts2'
				)
			),
			mkMapValues(list1)
		]
	])

	const inlineDatum = DatumUtils.mkConstr(0, [
		DatumUtils.mkInt(12),
		DatumUtils.mkInt(42) //
	])

	console.log(
		'Inline Datum: BASIC:',
		JSON.stringify(JSON.parse(inlineDatum.to_json(DatumUtils.DatumSchema.Basic)), null, 2)
	)
	console.log(
		'Inline Datum: DETAILED:',
		JSON.stringify(JSON.parse(inlineDatum.to_json(DatumUtils.DatumSchema.Detailed)), null, 2)
	)

	const txBuilder = new TxBuilder({})
	// const txLock = await txBuilder
	// 	.setInputs(utxos)
	// 	.addOutput({
	// 		address: 'addr_test1wr4ax60kmk77amh0rpeulm5kexwgc0tvv4lza35a4e6u5wglrauyr',
	// 		amount: [{ unit: 'lovelace', quantity: '3000000' }]
	// 	})
	// 	.txOutInlineDatumValue(inlineDatum)
	// 	.changeAddress(address)
	// 	.complete()
	// const signedTxLock = await wallet.signTx(txLock.to_hex())
	// const txHashLock = await wallet.submitTx(signedTxLock)
	// console.log('>>> / test-tx-contract.ts:111 / txHashLock:', txHashLock)

	const contractUtxos = await wallet.queryUTxOs('addr_test1wr4ax60kmk77amh0rpeulm5kexwgc0tvv4lza35a4e6u5wglrauyr')
	const unlockUtxo = contractUtxos.find(
		utxo =>
			utxo.input.txHash === 'b6bcbeac4105fa0391a5b08bc2132b9b3c99ae9f5712a1d9a134c286c2d4df40' &&
			utxo.input.outputIndex === 0
	)
	console.log('>>> / test-tx-contract.ts:115 / unlockUtxo:', unlockUtxo)
	if (!unlockUtxo) {
		throw new Error('Unlock UTxO not found')
	}

	const redeemer = CardanoWASM.Redeemer.new(
		CardanoWASM.RedeemerTag.new_spend(),
		CardanoWASM.BigNum.from_str('0'),
		DatumUtils.mkConstr(0, [DatumUtils.mkInt(30)]),
		CardanoWASM.ExUnits.new(
			CardanoWASM.BigNum.from_str('100000'), // Mem
			CardanoWASM.BigNum.from_str('10000000') // Steps
		)
	)

	const collateralUTxO = utxos[11]

	const txUnlock = await txBuilder
		.setInputs([utxos[1], utxos[2], utxos[3]]) // add some regular input to cover fees
		.txIn(
			// specify script UTxO to unlock
			unlockUtxo.input.txHash,
			unlockUtxo.input.outputIndex,
			unlockUtxo.output.amount, //
			unlockUtxo.output.address
		)
		.txInInlineDatum(unlockUtxo.output.inlineDatum!)
		.txInScript(
			`58c158bf01010029800aba2aba1aab9faab9eaab9dab9a48888896600264653001300700198039804000cc01c0092225980099b8748008c01cdd500144c8cc896600266e1d2000300a375400d13232598009808001456600266e1d2000300c37540071323370e66e04dd69808180898071baa001375a6020601c6ea8004dd6980818071baa009300f300d375400716402d1640386eb4c038004c02cdd500345900918058009805980600098041baa0028b200c180380098019baa0078a4d1365640041`
		)
		.txInCollateral(
			// specify collateral UTxO
			collateralUTxO.input.txHash,
			collateralUTxO.input.outputIndex,
			collateralUTxO.output.amount, //
			collateralUTxO.output.address
		)
		.addOutput({
			address: `addr_test1wr4ax60kmk77amh0rpeulm5kexwgc0tvv4lza35a4e6u5wglrauyr`,
			amount: [{ unit: 'lovelace', quantity: '3000000' }]
		})
		.txInRedeemerValue(redeemer)
		.txOutInlineDatumValue(
			DatumUtils.mkConstr(0, [
				DatumUtils.mkInt(13),
				DatumUtils.mkInt(43) //
			])
		)
		.changeAddress(address)
		.complete()
	const signedTxUnlock = await wallet.signTx(txUnlock.to_hex())
	const txHashUnlock = await wallet.submitTx(signedTxUnlock)
	console.log('>>> / test-tx-contract.ts:157 / txHashUnlock:', txHashUnlock)
})()
