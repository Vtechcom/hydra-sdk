/**
 * Golden: lock to / unlock from the Aiken always-true V3 validator on preprod.
 *
 * Moved from apps/nodejs-playground/src/__tests__/tx-builder/contract-interaction.
 * Lock goldens are unchanged from that test. Unlock goldens were regenerated with
 * regenerate-always-true.ts (see its header for the command) because two commits
 * moved them after the playground values were recorded:
 *   - 3eae146 (protocol parameters v11, new PlutusV3 cost model) changed the
 *     language view in script_data_hash: aa56924a… → 5f29ce13… (datum-hash spend).
 *   - aca752e (transaction 1.2.0) started charging ex-unit prices instead of 0:
 *     +ceil(0.0577·100000 + 0.0000721·10000000) = +6491 lovelace, so the datum-hash
 *     spend fee went 181869 → 188360.
 */
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { CostModels, Deserializer } from '@hydra-sdk/core'
import {
	buildDatum,
	buildLockTx,
	buildUnlockTx,
	COLLATERAL,
	LOCKED,
	LOCKED_LOVELACE,
	SCRIPT_ADDRESS,
	WALLET_ADDRESS,
	WALLET_LOVELACE,
	WALLET_UTXO_REF
} from './always-true.fixture'

const DATUM_HEX = 'd8799f581c4d04bcc73103cb8296abce92daefde484d498af9900729394b25f5e5ff'
const DATUM_HASH = '1ea38720611d762056f24d183e298d50273d4286ea3afc5e07b53ef1d5d919ed'
/** Fee charged for the default empty-redeemer budget (mem 100000, steps 10000000). */
const SCRIPT_FEE = 6491n

const txIdOf = (cborHex: string) => {
	const fixed = Deserializer.deserializeTx(cborHex)
	const id = fixed.transaction_hash().to_hex()
	fixed.free()
	return id
}

const inputRefs = (tx: CardanoWASM.Transaction) =>
	(tx.body().inputs().to_js_value() as { transaction_id: string; index: number }[]).map(
		i => `${i.transaction_id}#${i.index}`
	)

const outputsLovelace = (tx: CardanoWASM.Transaction) => {
	const outputs = tx.body().outputs()
	let sum = 0n
	for (let i = 0; i < outputs.len(); i++) sum += BigInt(outputs.get(i).amount().coin().to_str())
	return sum
}

/** script_data_hash recomputed from the tx's own witnesses and the default V3 cost model. */
const recomputeScriptDataHash = (tx: CardanoWASM.Transaction) => {
	const witnesses = tx.witness_set()
	const languages = CardanoWASM.Languages.new()
	languages.add(CardanoWASM.Language.new_plutus_v3())
	const costModels = CostModels.defaultCostModels.retain_language_versions(languages)
	const hash = CardanoWASM.hash_script_data(witnesses.redeemers()!, costModels, witnesses.plutus_data())
	const hex = hash.to_hex()
	;[hash, costModels, languages, witnesses].forEach(o => o.free())
	return hex
}

describe('[golden][always-true] datum', () => {
	it('serializes Constr 0 [pkh] and hashes it to the golden datum hash', () => {
		const datum = buildDatum()
		const hash = CardanoWASM.hash_plutus_data(datum)
		expect(datum.to_hex()).toBe(DATUM_HEX)
		expect(hash.to_hex()).toBe(DATUM_HASH)
		hash.free()
		datum.free()
	})
})

describe('[golden][always-true] lock 3 ADA', () => {
	it('with inline datum builds the golden CBOR and txId', async () => {
		const tx = await buildLockTx('inline')
		expect(tx.to_hex()).toBe(
			'84a400d90102818258203dfb4f1bb56b8ae025ca3003e5b99cae4cfe396012be60c17876e10972b681f1010182a300581d70d27ccc13fab5b782984a3d1f99353197ca1a81be069941ffc003ee75011a002dc6c0028201d8185822d8799f581c4d04bcc73103cb8296abce92daefde484d498af9900729394b25f5e5ff8258390089d2fa514215fb063a7efca89fe9cd7447c857fe9c880b46240516d039065ca955fdf0c8025b851e7429895ae766ad42f8165bef04b3d71c1a08a6f076021a00029a15075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6ca0f5a0'
		)
		expect(txIdOf(tx.to_hex())).toBe('4dd572d0eed92baf7849aced4dbb907d9530f7451c77f8049712cda4b0c0f098')
		expect(inputRefs(tx)).toEqual([WALLET_UTXO_REF])
		tx.free()
	})

	it('with datum hash puts the datum hash (not the datum) on the script output', async () => {
		const tx = await buildLockTx('hash')
		const outputs = tx.body().outputs().to_js_value() as { address: string; plutus_data?: { DataHash?: string } }[]
		expect(outputs.find(o => o.address === SCRIPT_ADDRESS)?.plutus_data).toEqual({ DataHash: DATUM_HASH })
		expect(tx.body().fee().to_str()).toBe('170121')
		tx.free()
	})
})

describe.each([
	{
		mode: 'inline' as const,
		fee: 186600n,
		scriptDataHash: '718e3cf830b15a9425e304a814645a795d8a6c91775c14944ab898888fdd4597',
		txId: '0cfd3332c185013da6e437997c3a448a4d131853708127d5230d9e5fd90edb63',
		witnessDatums: 0
	},
	{
		mode: 'hash' as const,
		fee: 188360n,
		scriptDataHash: '5f29ce13547d10baa9837414a377cb87e40602e29d65d7fd9a71a4ee8cff115b',
		txId: 'cd4474f24697e035baca757f9a3d82630322f209865642f5fe10168a0eba2649',
		witnessDatums: 1
	}
])(
	'[golden][always-true] unlock with $mode datum, empty redeemer',
	({ mode, fee, scriptDataHash, txId, witnessDatums }) => {
		let tx: CardanoWASM.Transaction

		beforeAll(async () => {
			tx = await buildUnlockTx(mode)
		})
		afterAll(() => tx.free())

		it('builds the golden txId, fee and script_data_hash', () => {
			expect(txIdOf(tx.to_hex())).toBe(txId)
			expect(BigInt(tx.body().fee().to_str())).toBe(fee)
			expect(tx.body().script_data_hash()?.to_hex()).toBe(scriptDataHash)
		})

		it('script_data_hash matches the redeemers, datums and V3 cost model in the tx', () => {
			expect(recomputeScriptDataHash(tx)).toBe(tx.body().script_data_hash()?.to_hex())
		})

		it('fee covers the size fee plus the ex-unit cost of the redeemer', () => {
			const sizeFee = 44n * BigInt(tx.to_bytes().length) + 155381n
			expect(fee).toBeGreaterThanOrEqual(sizeFee + SCRIPT_FEE)
		})

		it('spends the locked UTxO and one wallet UTxO, conserving value', () => {
			expect(inputRefs(tx).sort()).toEqual([`${LOCKED.txHash}#${LOCKED.index}`, WALLET_UTXO_REF].sort())
			expect(outputsLovelace(tx) + fee).toBe(WALLET_LOVELACE + LOCKED_LOVELACE)
			const change = tx.body().outputs().get(1)
			expect(change.address().to_bech32()).toBe(WALLET_ADDRESS)
		})

		it('pledges the given collateral without a collateral return', () => {
			expect(tx.body().collateral()?.to_js_value()).toEqual([
				{ transaction_id: COLLATERAL.txHash, index: COLLATERAL.index }
			])
			expect(tx.body().collateral_return()).toBeUndefined()
			expect(tx.body().total_collateral()).toBeUndefined()
		})

		it('attaches the script, one spend redeemer and the datum only when it is not inline', () => {
			const witnesses = tx.witness_set().to_js_value()
			expect(witnesses.plutus_scripts).toHaveLength(1)
			expect(witnesses.redeemers).toEqual([
				{ tag: 'Spend', index: '0', data: '{"constructor":0,"fields":[]}', ex_units: { mem: '100000', steps: '10000000' } }
			])
			expect(witnesses.plutus_data?.elems ?? []).toHaveLength(witnessDatums)
			expect(tx.is_valid()).toBe(true)
		})
	}
)
