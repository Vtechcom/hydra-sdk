/**
 * Golden: plain payment transactions (no scripts) on preprod.
 *
 * Moved from apps/nodejs-playground/src/__tests__/tx-builder/simple-tx.test.ts.
 * The CBOR, txId and fee literals below were committed with that playground test
 * (built by TxBuilder with the default protocol parameters) and still match the
 * builder unchanged: a script-free tx is not affected by cost models or ex-unit
 * prices, the two inputs that moved for the always-true golden. The signed CBOR is
 * deterministic (ed25519) for the mnemonic below.
 */
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { AppWallet, Converter, Deserializer, NETWORK_ID, Serializer, UTxOObject } from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'

const MNEMONIC = 'daughter silk uncover cheese split ribbon treat forum belt planet divert verify easily fabric shrimp'
const WALLET_ADDRESS =
	'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
const RECEIVER = 'addr_test1vz7st3e4f5tqzyldkwdr9gkwvpzlfr6364egl7ha4ck7emctt2gnq'
const POLICY_ID = '9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4'

const ADA_UTXO: UTxOObject = {
	'3dfb4f1bb56b8ae025ca3003e5b99cae4cfe396012be60c17876e10972b681f1#1': {
		address: WALLET_ADDRESS,
		value: { lovelace: 148328779 },
		datum: null,
		datumhash: null,
		inlineDatumhash: null,
		inlineDatumRaw: null,
		inlineDatum: null,
		referenceScript: null
	}
}

const TOKEN_UTXO: UTxOObject = {
	'4163280d8a0482018a761088fbf32018390f36a89423a09662b463d541612576#0': {
		address: WALLET_ADDRESS,
		value: {
			lovelace: 1193870,
			[POLICY_ID]: { '446f6e67': 10, '546f6b656e31': 10, '55444f': 10 }
		},
		datum: null,
		datumhash: null,
		inlineDatumhash: null,
		inlineDatumRaw: null,
		inlineDatum: null,
		referenceScript: null
	}
}

const wallet = new AppWallet({
	key: { type: 'mnemonic', words: MNEMONIC.split(' ') },
	networkId: NETWORK_ID.PREPROD
})

type Amount = { unit: string; quantity: string }

const build = (utxos: UTxOObject, amount: Amount[]) =>
	new TxBuilder()
		.setInputs(Converter.convertUTxOObjectToUTxO(utxos))
		.addOutput({ address: RECEIVER, amount })
		.changeAddress(wallet.getAccount().baseAddressBech32)
		.complete()

/** txId of a serialized tx, hashed over its original body bytes. */
const txIdOf = (cborHex: string) => {
	const fixed = Deserializer.deserializeTx(cborHex)
	const id = fixed.transaction_hash().to_hex()
	fixed.free()
	return id
}

/** Quantity of `policyId.assetNameHex` in a CSL value, or undefined when absent. */
const assetQty = (value: CardanoWASM.Value, assetNameHex: string) => {
	const policy = CardanoWASM.ScriptHash.from_hex(POLICY_ID)
	const name = CardanoWASM.AssetName.new(Buffer.from(assetNameHex, 'hex'))
	const qty = value.multiasset()?.get_asset(policy, name).to_str()
	policy.free()
	name.free()
	return qty
}

describe('[golden] lovelace-only payment', () => {
	const UNSIGNED_CBOR =
		'84a400d90102818258203dfb4f1bb56b8ae025ca3003e5b99cae4cfe396012be60c17876e10972b681f101018282581d60bd05c7354d160113edb39a32a2ce6045f48f51d5728ffafdae2decef1a001e848082583900e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebfeee790c7bb9c497f716fcec7d92a4d68c27b48c9e301b7c547c653cd1a08b63a1a021a000292b1075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6ca0f5a0'
	const TX_ID = 'a1f223ce36331f68baa1b60811c91f3d769373da3254e48a88703dd03aa4e776'
	let tx: CardanoWASM.Transaction

	beforeAll(async () => {
		tx = await build(ADA_UTXO, [{ unit: 'lovelace', quantity: '2000000' }])
	})
	afterAll(() => tx.free())

	it('builds the golden unsigned CBOR and txId', () => {
		expect(tx.to_hex()).toBe(UNSIGNED_CBOR)
		expect(txIdOf(tx.to_hex())).toBe(TX_ID)
	})

	it('pays the receiver, sends the rest back as change and burns fee 168625', () => {
		const outputs = tx.body().outputs()
		expect(outputs.get(0).address().to_bech32()).toBe(RECEIVER)
		expect(outputs.get(0).amount().coin().to_str()).toBe('2000000')
		expect(outputs.get(1).address().to_bech32()).toBe(WALLET_ADDRESS)
		expect(tx.body().fee().to_str()).toBe('168625')
		// value conservation: 148328779 = 2000000 + change + fee
		expect(BigInt(outputs.get(1).amount().coin().to_str())).toBe(148328779n - 2000000n - 168625n)
	})

	it('signs to the golden witness CBOR without changing the txId', async () => {
		const signed = await wallet.signTx(UNSIGNED_CBOR, true)
		expect(signed).toBe(
			'84a400d90102818258203dfb4f1bb56b8ae025ca3003e5b99cae4cfe396012be60c17876e10972b681f101018282581d60bd05c7354d160113edb39a32a2ce6045f48f51d5728ffafdae2decef1a001e848082583900e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebfeee790c7bb9c497f716fcec7d92a4d68c27b48c9e301b7c547c653cd1a08b63a1a021a000292b1075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6ca100d9010281825820bdbacdaf6f2f250ca111c6093845c5c2074cdf4007afd33c2f1fddf54fd0ea7e584010f833a9a1b7c19bbdf8218b5e94bb020356e4e28c4a91dcba4e85e4a98cf1bd456960244e1516a117771a8a8b5f1c5149bebc4f86342c9edc812469cdde010bf5a0'
		)
		expect(txIdOf(signed)).toBe(TX_ID)
	})
})

describe('[golden] lovelace + native token payment', () => {
	const UNSIGNED_CBOR =
		'84a400d90102828258203dfb4f1bb56b8ae025ca3003e5b99cae4cfe396012be60c17876e10972b681f1018258204163280d8a0482018a761088fbf32018390f36a89423a09662b463d54161257600018282581d60bd05c7354d160113edb39a32a2ce6045f48f51d5728ffafdae2decef821a001e8480a1581c9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4a144446f6e670582583900e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebfeee790c7bb9c497f716fcec7d92a4d68c27b48c9e301b7c547c653cd821a08c85bd4a1581c9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4a34355444f0a44446f6e670546546f6b656e310a021a0002a885075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6ca0f5a0'
	const TX_ID = '6fcb0cd78838c42efcd1c3983d6acebf36428728d6db039cfbca8aa02ddee11e'
	const DONG = Serializer.serializeAssetUnit(POLICY_ID, '446f6e67') // 'Dong'
	let tx: CardanoWASM.Transaction

	beforeAll(async () => {
		tx = await build({ ...ADA_UTXO, ...TOKEN_UTXO }, [
			{ unit: 'lovelace', quantity: '2000000' },
			{ unit: DONG, quantity: '5' }
		])
	})
	afterAll(() => tx.free())

	it('builds the golden unsigned CBOR and txId', () => {
		expect(tx.to_hex()).toBe(UNSIGNED_CBOR)
		expect(txIdOf(tx.to_hex())).toBe(TX_ID)
	})

	it('spends both UTxOs and burns fee 174213', () => {
		expect(tx.body().inputs().len()).toBe(2)
		expect(tx.body().fee().to_str()).toBe('174213')
	})

	it('sends 5 Dong to the receiver and returns every other token as change', () => {
		const outputs = tx.body().outputs()
		const paid = outputs.get(0).amount()
		const change = outputs.get(1).amount()

		expect(paid.coin().to_str()).toBe('2000000')
		expect(paid.multiasset()?.len()).toBe(1)
		expect(assetQty(paid, '446f6e67')).toBe('5')

		// 148328779 + 1193870 - 2000000 - 174213
		expect(change.coin().to_str()).toBe('147348436')
		expect(assetQty(change, '446f6e67')).toBe('5')
		expect(assetQty(change, '546f6b656e31')).toBe('10')
		expect(assetQty(change, '55444f')).toBe('10')
	})

	it('signs to the golden witness CBOR without changing the txId', async () => {
		const signed = await wallet.signTx(UNSIGNED_CBOR, true)
		expect(signed).toBe(
			'84a400d90102828258203dfb4f1bb56b8ae025ca3003e5b99cae4cfe396012be60c17876e10972b681f1018258204163280d8a0482018a761088fbf32018390f36a89423a09662b463d54161257600018282581d60bd05c7354d160113edb39a32a2ce6045f48f51d5728ffafdae2decef821a001e8480a1581c9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4a144446f6e670582583900e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebfeee790c7bb9c497f716fcec7d92a4d68c27b48c9e301b7c547c653cd821a08c85bd4a1581c9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4a34355444f0a44446f6e670546546f6b656e310a021a0002a885075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6ca100d9010281825820bdbacdaf6f2f250ca111c6093845c5c2074cdf4007afd33c2f1fddf54fd0ea7e5840de2e5b928ad366ddacd990bcd5e2ea54460a9b04b022a94e7eef9358484e662e90c9416b331742b1aa3778f39a9941101101973ca071592dcc48f00318ee8602f5a0'
		)
		expect(txIdOf(signed)).toBe(TX_ID)
	})

	it('rejects when the leftover ADA cannot carry the token change', async () => {
		await expect(
			build({ ...ADA_UTXO, ...TOKEN_UTXO }, [
				{ unit: 'lovelace', quantity: String(148_328_779 + 1_000_000) },
				{ unit: DONG, quantity: '5' }
			])
		).rejects.toThrow(/Not enough ADA leftover to include non-ADA assets in a change address/)
	})
})
