import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { AppWallet, Converter, Deserializer, NETWORK_ID, Serializer, UTxOObject } from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'

describe('Build simple transaction with lovelace only', () => {
	const wallet = new AppWallet({
		key: {
			type: 'mnemonic',
			words: 'daughter silk uncover cheese split ribbon treat forum belt planet divert verify easily fabric shrimp'.split(
				' '
			)
		},
		networkId: NETWORK_ID.PREPROD
	})
	const inputUtxo: UTxOObject = {
		'3dfb4f1bb56b8ae025ca3003e5b99cae4cfe396012be60c17876e10972b681f1#1': {
			address:
				'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3',
			value: {
				lovelace: 148328779
			},
			datum: null,
			datumhash: null,
			inlineDatumhash: null,
			inlineDatumRaw: null,
			inlineDatum: null,
			referenceScript: null
		}
	}
	const output = {
		address: 'addr_test1vz7st3e4f5tqzyldkwdr9gkwvpzlfr6364egl7ha4ck7emctt2gnq',
		amount: [{ unit: 'lovelace', quantity: String(2_000_000) }]
	}

	it('should build a simple transaction', async () => {
		const txBuilder = new TxBuilder()
		const tx = await txBuilder
			.setInputs(Converter.convertUTxOObjectToUTxO(inputUtxo))
			.addOutput(output)
			.changeAddress(wallet.getAccount().baseAddressBech32)
			.complete()
		expect(tx).toBeDefined()
		expect(tx.body().inputs().len()).toBe(1)
		expect(tx.body().outputs().len()).toBe(2) // 1 output + 1 change output
	})

	it('should return correct fee: 168625 lovelace', async () => {
		const txBuilder = new TxBuilder()
		const tx = await txBuilder
			.setInputs(Converter.convertUTxOObjectToUTxO(inputUtxo))
			.addOutput(output)
			.changeAddress(wallet.getAccount().baseAddressBech32)
			.complete()
		const unsignedCborHex = tx.to_hex()
		const deserializedTx = Deserializer.deserializeTx(unsignedCborHex)
		expect(deserializedTx.body().fee().to_str()).toBe('168625')
	})

	it('should correct unsigned transaction cbor and txId', async () => {
		const txBuilder = new TxBuilder()
		const tx = await txBuilder
			.setInputs(Converter.convertUTxOObjectToUTxO(inputUtxo))
			.addOutput({
				address: 'addr_test1vz7st3e4f5tqzyldkwdr9gkwvpzlfr6364egl7ha4ck7emctt2gnq',
				amount: [{ unit: 'lovelace', quantity: String(2_000_000) }]
			})
			.changeAddress(wallet.getAccount().baseAddressBech32)
			.complete()

		const unsignedCborHex = tx.to_hex()
		const txId = Deserializer.deserializeTx(unsignedCborHex).transaction_hash().to_hex()
		expect(txId).toBe('a1f223ce36331f68baa1b60811c91f3d769373da3254e48a88703dd03aa4e776')
		// It can be returned '...f5a0' with build_tx or '...f5f6' with build normally
		expect(unsignedCborHex).toContain(
			'84a400d90102818258203dfb4f1bb56b8ae025ca3003e5b99cae4cfe396012be60c17876e10972b681f101018282581d60bd05c7354d160113edb39a32a2ce6045f48f51d5728ffafdae2decef1a001e848082583900e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebfeee790c7bb9c497f716fcec7d92a4d68c27b48c9e301b7c547c653cd1a08b63a1a021a000292b1075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6ca0f5'
		)
	})

	it('should correct signed transaction cbor and txId', async () => {
		const unsignedCborHex =
			'84a400d90102818258203dfb4f1bb56b8ae025ca3003e5b99cae4cfe396012be60c17876e10972b681f101018282581d60bd05c7354d160113edb39a32a2ce6045f48f51d5728ffafdae2decef1a001e848082583900e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebfeee790c7bb9c497f716fcec7d92a4d68c27b48c9e301b7c547c653cd1a08b63a1a021a000292b1075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6ca0f5a0'
		const unsignedTxId = 'a1f223ce36331f68baa1b60811c91f3d769373da3254e48a88703dd03aa4e776'

		const signedCborHex = await wallet.signTx(unsignedCborHex, true)
		const txId = Deserializer.deserializeTx(signedCborHex).transaction_hash().to_hex()
		expect(txId).toBe(unsignedTxId)
		expect(signedCborHex).toBe(
			'84a400d90102818258203dfb4f1bb56b8ae025ca3003e5b99cae4cfe396012be60c17876e10972b681f101018282581d60bd05c7354d160113edb39a32a2ce6045f48f51d5728ffafdae2decef1a001e848082583900e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebfeee790c7bb9c497f716fcec7d92a4d68c27b48c9e301b7c547c653cd1a08b63a1a021a000292b1075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6ca100d9010281825820bdbacdaf6f2f250ca111c6093845c5c2074cdf4007afd33c2f1fddf54fd0ea7e584010f833a9a1b7c19bbdf8218b5e94bb020356e4e28c4a91dcba4e85e4a98cf1bd456960244e1516a117771a8a8b5f1c5149bebc4f86342c9edc812469cdde010bf5a0'
		)
	})
})

describe('Build simple transaction with lovelace and multi assets', () => {
	const wallet = new AppWallet({
		key: {
			type: 'mnemonic',
			words: 'daughter silk uncover cheese split ribbon treat forum belt planet divert verify easily fabric shrimp'.split(
				' '
			)
		},
		networkId: NETWORK_ID.PREPROD
	})
	const inputUtxo: UTxOObject = {
		'3dfb4f1bb56b8ae025ca3003e5b99cae4cfe396012be60c17876e10972b681f1#1': {
			address:
				'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3',
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
				'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3',
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

	const output = {
		address: 'addr_test1vz7st3e4f5tqzyldkwdr9gkwvpzlfr6364egl7ha4ck7emctt2gnq',
		amount: [
			{ unit: 'lovelace', quantity: String(2_000_000) },
			{
				unit: Serializer.serializeAssetUnit(
					'9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4', // policyId
					'446f6e67' // assetName 'Dong' in hex
				),
				quantity: '5'
			}
		]
	}

	it('should build a simple transaction', async () => {
		const txBuilder = new TxBuilder()
		const tx = await txBuilder
			.setInputs(Converter.convertUTxOObjectToUTxO(inputUtxo))
			.addOutput(output)
			.changeAddress(wallet.getAccount().baseAddressBech32)
			.complete()
		expect(tx).toBeDefined()
		expect(tx.body().inputs().len()).toBe(2)
		expect(tx.body().outputs().len()).toBe(2) // 1 output + 1 change output
	})

	it('should return correct fee: 174213 lovelace', async () => {
		const txBuilder = new TxBuilder()
		const tx = await txBuilder
			.setInputs(Converter.convertUTxOObjectToUTxO(inputUtxo))
			.addOutput(output)
			.changeAddress(wallet.getAccount().baseAddressBech32)
			.complete()

		const unsignedCborHex = tx.to_hex()
		const deserializedTx = Deserializer.deserializeTx(unsignedCborHex)
		expect(deserializedTx.body().fee().to_str()).toBe('174213')
	})

	it('should return correct amount', async () => {
		const txBuilder = new TxBuilder()
		const tx = await txBuilder
			.setInputs(Converter.convertUTxOObjectToUTxO(inputUtxo))
			.addOutput(output)
			.changeAddress(wallet.getAccount().baseAddressBech32)
			.complete()

		const unsignedCborHex = tx.to_hex()
		const deserializedTx = Deserializer.deserializeTx(unsignedCborHex)
		const outputs = deserializedTx.body().outputs()
		expect(outputs.to_js_value().length).toBe(2)
		expect(outputs.get(0).amount().coin().to_str()).toEqual('2000000')
		expect(outputs.get(0).amount().multiasset()?.len()).toBe(1)
		expect(
			outputs
				.get(0)
				.amount()
				.multiasset()
				?.get(CardanoWASM.ScriptHash.from_hex('9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4'))
		).toBeDefined()
		expect(
			outputs
				.get(0)
				.amount()
				.multiasset()
				?.get(CardanoWASM.ScriptHash.from_hex('9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4'))
				?.get(CardanoWASM.AssetName.new(Buffer.from('446f6e67', 'hex')))
				?.to_str()
		).toEqual('5')

		expect(outputs.get(1).amount().coin().to_str()).toEqual('147348436')
		expect(outputs.get(1).amount().multiasset()?.len()).toBe(1)
		expect(
			outputs
				.get(1)
				.amount()
				.multiasset()
				?.get(CardanoWASM.ScriptHash.from_hex('9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4'))
		).toBeDefined()
		expect(
			outputs
				.get(1)
				.amount()
				.multiasset()
				?.get(CardanoWASM.ScriptHash.from_hex('9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4'))
				?.get(CardanoWASM.AssetName.new(Buffer.from('446f6e67', 'hex')))
				?.to_str()
		).toEqual('5')
		expect(
			outputs
				.get(1)
				.amount()
				.multiasset()
				?.get(CardanoWASM.ScriptHash.from_hex('9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4'))
				?.get(CardanoWASM.AssetName.new(Buffer.from('546f6b656e31', 'hex')))
				?.to_str()
		).toEqual('10')
		expect(
			outputs
				.get(1)
				.amount()
				.multiasset()
				?.get(CardanoWASM.ScriptHash.from_hex('9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4'))
				?.get(CardanoWASM.AssetName.new(Buffer.from('55444f', 'hex')))
				?.to_str()
		).toEqual('10')
	})

	it('shoud cover minimum ada for output with multi assets (Return not enough ADA error)', async () => {
		const txBuilder = new TxBuilder()
		try {
			const tx = await txBuilder
				.setInputs(Converter.convertUTxOObjectToUTxO(inputUtxo))
				.addOutput({
					address: 'addr_test1vz7st3e4f5tqzyldkwdr9gkwvpzlfr6364egl7ha4ck7emctt2gnq',
					amount: [
						{ unit: 'lovelace', quantity: String(148_328_779 + 1_000_000) },
						{
							unit: Serializer.serializeAssetUnit(
								'9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4', // policyId
								'446f6e67' // assetName 'Dong' in hex
							),
							quantity: '5'
						}
					]
				})
				.changeAddress(wallet.getAccount().baseAddressBech32)
				.complete()
			const unsignedCborHex = tx.to_hex()
			const deserializedTx = Deserializer.deserializeTx(unsignedCborHex)
		} catch (error) {
			expect(error as string).toBe('Not enough ADA leftover to include non-ADA assets in a change address')
		}
	})

	it('should correct unsigned transaction cbor and txId', async () => {
		const txBuilder = new TxBuilder()
		const tx = await txBuilder
			.setInputs(Converter.convertUTxOObjectToUTxO(inputUtxo))
			.addOutput(output)
			.changeAddress(wallet.getAccount().baseAddressBech32)
			.complete()

		const unsignedCborHex = tx.to_hex()
		// It can be returned '...f5a0' with build_tx or '...f5f6' with build normally
		expect(unsignedCborHex).toContain(
			'84a400d90102828258203dfb4f1bb56b8ae025ca3003e5b99cae4cfe396012be60c17876e10972b681f1018258204163280d8a0482018a761088fbf32018390f36a89423a09662b463d54161257600018282581d60bd05c7354d160113edb39a32a2ce6045f48f51d5728ffafdae2decef821a001e8480a1581c9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4a144446f6e670582583900e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebfeee790c7bb9c497f716fcec7d92a4d68c27b48c9e301b7c547c653cd821a08c85bd4a1581c9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4a34355444f0a44446f6e670546546f6b656e310a021a0002a885075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6ca0f5'
		)

		const txId = Deserializer.deserializeTx(unsignedCborHex).transaction_hash().to_hex()
		expect(txId).toBe('6fcb0cd78838c42efcd1c3983d6acebf36428728d6db039cfbca8aa02ddee11e')
	})

	it('should correct signed transaction cbor and txId', async () => {
		const unsignedCborHex =
			'84a400d90102828258203dfb4f1bb56b8ae025ca3003e5b99cae4cfe396012be60c17876e10972b681f1018258204163280d8a0482018a761088fbf32018390f36a89423a09662b463d54161257600018282581d60bd05c7354d160113edb39a32a2ce6045f48f51d5728ffafdae2decef821a001e8480a1581c9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4a144446f6e670582583900e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebfeee790c7bb9c497f716fcec7d92a4d68c27b48c9e301b7c547c653cd821a08c85bd4a1581c9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4a34355444f0a44446f6e670546546f6b656e310a021a0002a885075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6ca0f5a0'
		const unsignedTxId = '6fcb0cd78838c42efcd1c3983d6acebf36428728d6db039cfbca8aa02ddee11e'

		const signedCborHex = await wallet.signTx(unsignedCborHex, true)
		expect(signedCborHex).toBe(
			'84a400d90102828258203dfb4f1bb56b8ae025ca3003e5b99cae4cfe396012be60c17876e10972b681f1018258204163280d8a0482018a761088fbf32018390f36a89423a09662b463d54161257600018282581d60bd05c7354d160113edb39a32a2ce6045f48f51d5728ffafdae2decef821a001e8480a1581c9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4a144446f6e670582583900e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebfeee790c7bb9c497f716fcec7d92a4d68c27b48c9e301b7c547c653cd821a08c85bd4a1581c9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4a34355444f0a44446f6e670546546f6b656e310a021a0002a885075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6ca100d9010281825820bdbacdaf6f2f250ca111c6093845c5c2074cdf4007afd33c2f1fddf54fd0ea7e5840de2e5b928ad366ddacd990bcd5e2ea54460a9b04b022a94e7eef9358484e662e90c9416b331742b1aa3778f39a9941101101973ca071592dcc48f00318ee8602f5a0'
		)
		const txId = Deserializer.deserializeTx(signedCborHex).transaction_hash().to_hex()
		expect(txId).toBe(unsignedTxId)
	})
})
