import { TxBuilder } from '@hydra-sdk/transaction'
import { AppWallet, Converter, Deserializer, NETWORK_ID, UTxO, UTxOObject } from '@hydra-sdk/core'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

import contract from '../../__mocks__/contract/always-true.json'
import { walletPrimary as mockWallet } from '../../__mocks__/wallet.json'

const wallet = new AppWallet({
	key: {
		type: 'mnemonic',
		words: mockWallet.mnemonic.split(' ')
	},
	networkId: NETWORK_ID.PREPROD
})

const walletUTxO: UTxOObject = {
	'3dfb4f1bb56b8ae025ca3003e5b99cae4cfe396012be60c17876e10972b681f1#1': {
		address:
			'addr_test1qzya97j3gg2lkp360m7238lfe46y0jzhl6wgsz6xysz3d5peqew2j40a7ryqyku9re6znz26uan26shczed77p9n6uwq68d0h9',
		value: {
			lovelace: 148328779
		},
		datum: null,
		datumhash: null,
		inlineDatumhash: null,
		inlineDatumRaw: null,
		inlineDatum: null,
		referenceScript: null
	},
	'4163280d8a0482018a761088fbf32018390f36a89423a09662b463d541612576#0': {
		address:
			'addr_test1qzya97j3gg2lkp360m7238lfe46y0jzhl6wgsz6xysz3d5peqew2j40a7ryqyku9re6znz26uan26shczed77p9n6uwq68d0h9',
		value: {
			lovelace: 1193870,
			'9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4': {
				'446f6e67': 10,
				'546f6b656e31': 10,
				'55444f': 10
			}
		},
		datum: null,
		datumhash: null,
		inlineDatumhash: null,
		inlineDatumRaw: null,
		inlineDatum: null,
		referenceScript: null
	}
}

const walletCollateralUTxO: UTxO = {
	input: {
		txHash: 'b38512039aa59e10961ff05338ddc0ec719fc6d28bcffe43d735fa75a437edb4',
		outputIndex: 0
	},
	output: {
		address:
			'addr_test1qzya97j3gg2lkp360m7238lfe46y0jzhl6wgsz6xysz3d5peqew2j40a7ryqyku9re6znz26uan26shczed77p9n6uwq68d0h9',
		amount: [{ unit: 'lovelace', quantity: '5000000' }],
		datum: null,
		datumHash: null,
		inlineDatum: null,
		scriptHash: null,
		scriptRef: null
	}
}

describe('[Contract][Always True][Lock funds]', () => {
	test('Build Datum for output', async () => {
		const datum = CardanoWASM.PlutusData.from_json(
			JSON.stringify({
				constructor: 0,
				fields: [{ bytes: '4d04bcc73103cb8296abce92daefde484d498af9900729394b25f5e5' }]
			}),
			CardanoWASM.PlutusDatumSchema.DetailedSchema
		)
		expect(datum.to_hex()).toBe('d8799f581c4d04bcc73103cb8296abce92daefde484d498af9900729394b25f5e5ff')
	})
	test('Lock ADA to script address with inlineDatum', async () => {
		const account = wallet.getAccount()
		const txBuilder = new TxBuilder({})
		const datum = CardanoWASM.PlutusData.from_json(
			JSON.stringify({
				constructor: 0,
				fields: [{ bytes: '4d04bcc73103cb8296abce92daefde484d498af9900729394b25f5e5' }]
			}),
			CardanoWASM.PlutusDatumSchema.DetailedSchema
		)
		const tx = await txBuilder
			.setInputs(Converter.convertUTxOObjectToUTxO(walletUTxO))
			.addOutput({
				address: contract.address,
				amount: [{ unit: 'lovelace', quantity: '3000000' }]
			})
			.txOutInlineDatumValue(datum)
			.changeAddress(account.baseAddressBech32)
			.complete()
		const unsignedTx = Deserializer.deserializeTx(tx.to_hex())
		expect(unsignedTx.body().inputs().len()).toBe(1)

		expect(unsignedTx.transaction_hash().to_hex()).toBe(
			'4dd572d0eed92baf7849aced4dbb907d9530f7451c77f8049712cda4b0c0f098'
		)
		expect(unsignedTx.to_hex()).toBe(
			'84a400d90102818258203dfb4f1bb56b8ae025ca3003e5b99cae4cfe396012be60c17876e10972b681f1010182a300581d70d27ccc13fab5b782984a3d1f99353197ca1a81be069941ffc003ee75011a002dc6c0028201d8185822d8799f581c4d04bcc73103cb8296abce92daefde484d498af9900729394b25f5e5ff8258390089d2fa514215fb063a7efca89fe9cd7447c857fe9c880b46240516d039065ca955fdf0c8025b851e7429895ae766ad42f8165bef04b3d71c1a08a6f076021a00029a15075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6ca0f5a0'
		)
	})
	test('Lock ADA to script address with datumhash', async () => {
		const account = wallet.getAccount()
		const txBuilder = new TxBuilder({})
		const datum = CardanoWASM.PlutusData.from_json(
			JSON.stringify({
				constructor: 0,
				fields: [{ bytes: '4d04bcc73103cb8296abce92daefde484d498af9900729394b25f5e5' }]
			}),
			CardanoWASM.PlutusDatumSchema.DetailedSchema
		)
		const datumHash = CardanoWASM.hash_plutus_data(datum).to_hex()
		const tx = await txBuilder
			.setInputs(Converter.convertUTxOObjectToUTxO(walletUTxO))
			.addOutput({
				address: contract.address,
				amount: [{ unit: 'lovelace', quantity: '3000000' }]
			})
			.txOutDatumHashValue(datum)
			.changeAddress(account.baseAddressBech32)
			.complete()
		const unsignedTx = Deserializer.deserializeTx(tx.to_hex())

		const outputsObj = unsignedTx.body().outputs().to_js_value()
		const contractOutputObj = outputsObj.find((o: any) => o.address === contract.address)
		expect(outputsObj).toBeDefined()
		expect(contractOutputObj).toBeDefined()
		expect(contractOutputObj?.plutus_data).toHaveProperty('DataHash')
		expect((contractOutputObj?.plutus_data as { DataHash: string }).DataHash).toBe(datumHash)
	})
})

describe('[Contract][Always True][Unlock funds]', () => {
	test('Build Datum for output', async () => {
		const datum = CardanoWASM.PlutusData.from_json(
			JSON.stringify({
				constructor: 0,
				fields: [{ bytes: '4d04bcc73103cb8296abce92daefde484d498af9900729394b25f5e5' }]
			}),
			CardanoWASM.PlutusDatumSchema.DetailedSchema
		)
		const datumHash = CardanoWASM.hash_plutus_data(datum).to_hex()
		expect(datumHash).toBe('1ea38720611d762056f24d183e298d50273d4286ea3afc5e07b53ef1d5d919ed')
		expect(datum.to_hex()).toBe('d8799f581c4d04bcc73103cb8296abce92daefde484d498af9900729394b25f5e5ff')
	})

	test('With inlineDatum, empty redeemer', async () => {
		const datum = CardanoWASM.PlutusData.from_json(
			JSON.stringify({
				constructor: 0,
				fields: [{ bytes: '4d04bcc73103cb8296abce92daefde484d498af9900729394b25f5e5' }]
			}),
			CardanoWASM.PlutusDatumSchema.DetailedSchema
		)
		const lockedUTxO: UTxO = {
			input: {
				txHash: '25cef2b003bb9c86cdb61610fb56deac3aa89d6cceb2d71bcfbf8d2b9bc53fec',
				outputIndex: 0
			},
			output: {
				address: 'addr_test1wrf8enqnl26m0q5cfg73lxf4xxtu5x5phcrfjs0lcqp7uagh2hm3k',
				amount: [{ unit: 'lovelace', quantity: '2000000' }],
				datum: null,
				datumHash: null,
				inlineDatum: datum,
				scriptHash: null,
				scriptRef: null
			}
		}
		const txBuilder = new TxBuilder({})
		const tx = await txBuilder
			.setInputs(Converter.convertUTxOObjectToUTxO(walletUTxO))
			.txInCollateral(
				walletCollateralUTxO.input.txHash,
				walletCollateralUTxO.input.outputIndex,
				walletCollateralUTxO.output.amount,
				walletCollateralUTxO.output.address
			)
			.txIn(
				lockedUTxO.input.txHash,
				lockedUTxO.input.outputIndex,
				lockedUTxO.output.amount, //
				lockedUTxO.output.address
			)
			.txInScript(contract.cborHex)
			.txInInlineDatum(datum)
			.txInEmptyRedeemer()
			.addOutput({
				address: wallet.getAccount().baseAddressBech32,
				amount: [{ unit: 'lovelace', quantity: '2000000' }]
			})
			.changeAddress(wallet.getAccount().baseAddressBech32)
			.complete()

		const unsignedTx = Deserializer.deserializeTx(tx.to_hex())

		// Check collateral: not set collateral, so that it will be undefined
		expect(unsignedTx.body().collateral()?.to_hex()).toBe(
			/**
			 * Hex of:
			 * [
					{
						"transaction_id": "b38512039aa59e10961ff05338ddc0ec719fc6d28bcffe43d735fa75a437edb4",
						"index": 0
					}
				]
			 */
			'd9010281825820b38512039aa59e10961ff05338ddc0ec719fc6d28bcffe43d735fa75a437edb400'
		)
		expect(unsignedTx.body().collateral_return()).toBeUndefined()
		expect(unsignedTx.body().total_collateral()).toBeUndefined()

		// Check inputs
		expect(unsignedTx.body().inputs().len()).toBe(2) // 1 from wallet + 1 from script

		// Check fee > 0
		expect(unsignedTx.body().fee().compare(CardanoWASM.BigNum.zero())).toBe(1)

		// check tx has witnesses for script
		// console.log('>>> / tx.body().inputs().to_json(): ', tx.to_json())
		const txObj = tx.to_js_value()
		expect(txObj.witness_set.plutus_scripts?.length).toBe(1)

		// check tx is valid
		expect(txObj.is_valid).toBe(true)

		// Check tx hash
		expect(unsignedTx.transaction_hash().to_hex()).toBe(
			'4ee6aa73ab9d5e7d216690414d82267cfcbd7d0a21afe19f5ef93e01beea0393'
		)
	})

	test('With Datumhash, empty redeemer', async () => {
		const datum = CardanoWASM.PlutusData.from_json(
			JSON.stringify({
				constructor: 0,
				fields: [{ bytes: '4d04bcc73103cb8296abce92daefde484d498af9900729394b25f5e5' }]
			}),
			CardanoWASM.PlutusDatumSchema.DetailedSchema
		)
		const lockedUTxO: UTxO = {
			input: {
				txHash: '25cef2b003bb9c86cdb61610fb56deac3aa89d6cceb2d71bcfbf8d2b9bc53fec',
				outputIndex: 0
			},
			output: {
				address: 'addr_test1wrf8enqnl26m0q5cfg73lxf4xxtu5x5phcrfjs0lcqp7uagh2hm3k',
				amount: [{ unit: 'lovelace', quantity: '2000000' }],
				datum: null,
				datumHash: null,
				inlineDatum: datum,
				scriptHash: null,
				scriptRef: null
			}
		}
		const txBuilder = new TxBuilder({})
		const tx = await txBuilder
			.setInputs(Converter.convertUTxOObjectToUTxO(walletUTxO))
			.txInCollateral(
				walletCollateralUTxO.input.txHash,
				walletCollateralUTxO.input.outputIndex,
				walletCollateralUTxO.output.amount,
				walletCollateralUTxO.output.address
			)
			.txIn(
				lockedUTxO.input.txHash,
				lockedUTxO.input.outputIndex,
				lockedUTxO.output.amount, //
				lockedUTxO.output.address
			)
			.txInScript(contract.cborHex)
			.txInDatumHash(datum)
			.txInEmptyRedeemer()
			.addOutput({
				address: wallet.getAccount().baseAddressBech32,
				amount: [{ unit: 'lovelace', quantity: '2000000' }]
			})
			.changeAddress(wallet.getAccount().baseAddressBech32)
			.complete()

		const unsignedTx = Deserializer.deserializeTx(tx.to_hex())

		expect(unsignedTx.body().inputs().len()).toBe(2) // 1 from wallet + 1 from script
		expect(unsignedTx.body().fee().compare(CardanoWASM.BigNum.zero())).toBe(1)
		expect(unsignedTx.body().to_hex()).toBe(
			'a600d901028282582025cef2b003bb9c86cdb61610fb56deac3aa89d6cceb2d71bcfbf8d2b9bc53fec008258203dfb4f1bb56b8ae025ca3003e5b99cae4cfe396012be60c17876e10972b681f10101828258390089d2fa514215fb063a7efca89fe9cd7447c857fe9c880b46240516d039065ca955fdf0c8025b851e7429895ae766ad42f8165bef04b3d71c1a001e84808258390089d2fa514215fb063a7efca89fe9cd7447c857fe9c880b46240516d039065ca955fdf0c8025b851e7429895ae766ad42f8165bef04b3d71c1a08d48ade021a0002c66d075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6c0b5820aa56924a15de617e415ce9cec670887949411ddde9bf9fb3526f174c694ca4400dd9010281825820b38512039aa59e10961ff05338ddc0ec719fc6d28bcffe43d735fa75a437edb400'
		)
	})
})
