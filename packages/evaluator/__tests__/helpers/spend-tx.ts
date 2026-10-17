import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import type { UTxO } from '@hydra-sdk/core'
import { TxBuilder, emptyRedeemer } from '@hydra-sdk/transaction'

export type ScriptVersion = 'V1' | 'V2' | 'V3'

/**
 * Always-succeeds validators. V1/V2 is the 3-argument `\_ _ _ -> ()` used by the
 * cardano-node plutus examples; V3 is the 1-argument `\_ -> ()`.
 */
export const ALWAYS_SUCCEEDS: Record<ScriptVersion, string> = {
	V1: '4e4d01000033222220051200120011',
	V2: '4e4d01000033222220051200120011',
	V3: '46450101002499'
}
/** `(program 1.1.0 (error))`, flat-encoded and CBOR-wrapped twice — fails for any context. */
export const ALWAYS_FAILS_V3 = '454401010061'

/** Kept as a named export for existing callers: the V3 always-succeeds validator. */
export const scriptCbor = ALWAYS_SUCCEEDS.V3
export const testAddress =
	'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
export const fundTxHash = 'a'.repeat(64)
export const scriptTxHash = 'b'.repeat(64)
export const collateralTxHash = 'c'.repeat(64)
export const refScriptTxHash = 'f'.repeat(64)

/** emptyRedeemer placeholder exUnits, before real evaluation. */
export const PLACEHOLDER_EXUNITS = { mem: '100000', steps: '10000000' }

/** V1/V2 spends need a datum; `Constr 0 []`. */
export const UNIT_DATUM_HEX = 'd87980'

const language = (version: ScriptVersion): CardanoWASM.Language =>
	version === 'V1'
		? CardanoWASM.Language.new_plutus_v1()
		: version === 'V2'
			? CardanoWASM.Language.new_plutus_v2()
			: CardanoWASM.Language.new_plutus_v3()

/** Script hash, computed the SAME way TxBuilder.txInScript hashes the script (from_hex_with_version). */
export const scriptHashOf = (cbor: string, version: ScriptVersion): string => {
	const lang = language(version)
	const script = CardanoWASM.PlutusScript.from_hex_with_version(cbor, lang)
	const hash = script.hash()
	const hex = hash.to_hex()
	hash.free()
	script.free()
	lang.free()
	return hex
}

/** Testnet enterprise address locked by the given script. */
export const scriptAddressOf = (cbor: string, version: ScriptVersion): string => {
	const hash = CardanoWASM.ScriptHash.from_hex(scriptHashOf(cbor, version))
	const cred = CardanoWASM.Credential.from_scripthash(hash)
	const enterprise = CardanoWASM.EnterpriseAddress.new(0, cred)
	const address = enterprise.to_address()
	const bech32 = address.to_bech32()
	for (const o of [address, enterprise, cred, hash]) o.free()
	return bech32
}

/** Address of the V3 always-succeeds script. */
export const scriptAddress = scriptAddressOf(ALWAYS_SUCCEEDS.V3, 'V3')

const unitDatumHash = (): string => {
	const datum = CardanoWASM.PlutusData.from_hex(UNIT_DATUM_HEX)
	const hash = CardanoWASM.hash_plutus_data(datum)
	const hex = hash.to_hex()
	hash.free()
	datum.free()
	return hex
}

const fundUtxo = (): UTxO => ({
	input: { txHash: fundTxHash, outputIndex: 0 },
	output: { address: testAddress, amount: [{ unit: 'lovelace', quantity: '10000000' }] }
})
const collateralUtxo = (): UTxO => ({
	input: { txHash: collateralTxHash, outputIndex: 0 },
	output: { address: testAddress, amount: [{ unit: 'lovelace', quantity: '5000000' }] }
})

/**
 * The UTxOs a SPEND of `cbor` references: funding input, script input, collateral.
 * V1/V2 script outputs carry the unit datum's hash (the datum itself goes in the witness set).
 */
export const resolvedUtxos = (version: ScriptVersion = 'V3', cbor = ALWAYS_SUCCEEDS[version]): UTxO[] => [
	fundUtxo(),
	{
		input: { txHash: scriptTxHash, outputIndex: 1 },
		output: {
			address: scriptAddressOf(cbor, version),
			amount: [{ unit: 'lovelace', quantity: '5000000' }],
			...(version === 'V3' ? {} : { datumHash: unitDatumHash() })
		}
	},
	collateralUtxo()
]

/**
 * Stage a SPEND of `cbor` on the given builder (does not call complete).
 * For V1/V2 a fresh unit datum is attached; the builder references it until complete().
 */
export const stageSpendTx = (
	builder: TxBuilder,
	version: ScriptVersion = 'V3',
	cbor = ALWAYS_SUCCEEDS[version]
): TxBuilder => {
	builder
		.txIn(fundTxHash, 0, [{ unit: 'lovelace', quantity: '10000000' }], testAddress)
		.txIn(scriptTxHash, 1, [{ unit: 'lovelace', quantity: '5000000' }], scriptAddressOf(cbor, version))
		.txInScript(cbor, version)
	if (version !== 'V3') builder.txInDatumHash(CardanoWASM.PlutusData.from_hex(UNIT_DATUM_HEX))
	return builder
		.txInEmptyRedeemer()
		.txInCollateral(collateralTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
		.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
		.changeAddress(testAddress)
}

/** Build a tx with a fresh builder, return its hex and free every WASM object involved. */
const buildHex = async (stage: (builder: TxBuilder) => TxBuilder): Promise<string> => {
	const builder = new TxBuilder({ isHydra: true })
	try {
		const tx = await stage(builder).complete()
		const hex = tx.to_hex()
		tx.free()
		return hex
	} finally {
		builder.dispose()
	}
}

export interface TxFixture {
	txHex: string
	utxos: UTxO[]
}

/** SPEND of `cbor` (placeholder exUnits) plus the UTxOs it references. */
export const spendFixture = async (
	version: ScriptVersion = 'V3',
	cbor = ALWAYS_SUCCEEDS[version]
): Promise<TxFixture> => ({
	txHex: await buildHex(b => stageSpendTx(b, version, cbor)),
	utxos: resolvedUtxos(version, cbor)
})

export const MINT_ASSET_NAME = '74657374' // "test"

export const mintPolicyId = scriptHashOf(ALWAYS_SUCCEEDS.V3, 'V3')

/**
 * Stage a MINT of one token under the V3 always-succeeds policy, funded by a key-locked input.
 * The redeemer is set explicitly: TxBuilder only evaluates mints that carry one
 * (`_hasRedeemers`), a bare `mintingScript()` keeps the placeholder budget.
 */
export const stageMintTx = (builder: TxBuilder): TxBuilder =>
	builder
		.txIn(fundTxHash, 0, [{ unit: 'lovelace', quantity: '10000000' }], testAddress)
		.mint('1', mintPolicyId, MINT_ASSET_NAME)
		.mintingScript({ type: 'PlutusV3', scriptCborHex: ALWAYS_SUCCEEDS.V3 })
		.mintRedeemerValue(emptyRedeemer({ tag: 'MINT', type: 'constr' }))
		.txInCollateral(collateralTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
		.txOut(testAddress, [
			{ unit: 'lovelace', quantity: '2000000' },
			{ unit: mintPolicyId + MINT_ASSET_NAME, quantity: '1' }
		])
		.changeAddress(testAddress)

/** The UTxOs a MINT references: funding input and collateral. */
export const mintUtxos = (): UTxO[] => [fundUtxo(), collateralUtxo()]

/** MINT (placeholder exUnits) plus the UTxOs it references. */
export const mintFixture = async (): Promise<TxFixture> => ({ txHex: await buildHex(stageMintTx), utxos: mintUtxos() })

/** The UTxO holding the V3 always-succeeds script as a reference script. */
export const refScriptUtxo = (): UTxO => ({
	input: { txHash: refScriptTxHash, outputIndex: 0 },
	output: {
		address: testAddress,
		amount: [{ unit: 'lovelace', quantity: '5000000' }],
		scriptRef: { scriptCbor: ALWAYS_SUCCEEDS.V3, version: 'V3' }
	}
})

/**
 * V3 SPEND that resolves its validator through a reference input instead of the
 * witness set. TxBuilder cannot stage a reference-script spend, so this rewrites
 * the inline-witness SPEND: the script moves out of the witness set and
 * `refScriptTxHash#0` is added as a reference input. The script data hash covers
 * redeemers + V3 cost model only, so it stays valid.
 */
export const refScriptSpendFixture = async (): Promise<TxFixture> => {
	const inline = await spendFixture('V3')
	const scratch: { free(): void }[] = []
	const t = <T extends { free(): void }>(o: T): T => {
		scratch.push(o)
		return o
	}
	try {
		const tx = t(CardanoWASM.Transaction.from_hex(inline.txHex))
		const body = t(tx.body())
		const refs = t(CardanoWASM.TransactionInputs.new())
		refs.add(t(CardanoWASM.TransactionInput.new(t(CardanoWASM.TransactionHash.from_hex(refScriptTxHash)), 0)))
		body.set_reference_inputs(refs)
		const witnesses = t(CardanoWASM.TransactionWitnessSet.new())
		witnesses.set_redeemers(t(t(tx.witness_set()).redeemers()!))
		const rewritten = t(CardanoWASM.Transaction.new(body, witnesses))
		return { txHex: rewritten.to_hex(), utxos: [...inline.utxos, refScriptUtxo()] }
	} finally {
		for (const o of scratch.reverse()) o.free()
	}
}

/** Read the first redeemer's exUnits from a built transaction. */
export const firstRedeemerExUnits = (tx: CardanoWASM.Transaction): { mem: string; steps: string } => {
	const witnesses = tx.witness_set()
	const redeemers = witnesses.redeemers()
	witnesses.free()
	if (!redeemers) throw new Error('no redeemers in witness set')
	const r = redeemers.get(0)
	const exUnits = r.ex_units()
	const mem = exUnits.mem()
	const steps = exUnits.steps()
	const result = { mem: mem.to_str(), steps: steps.to_str() }
	for (const o of [steps, mem, exUnits, r, redeemers]) o.free()
	return result
}

/** All redeemers of a built transaction as `{ tag, index, mem, steps }`, in witness-set order. */
export const redeemerBudgets = (txHex: string): { tag: string; index: number; mem: number; steps: number }[] => {
	const tx = CardanoWASM.Transaction.from_hex(txHex)
	const witnesses = tx.witness_set()
	const redeemers = witnesses.redeemers()
	const out: { tag: string; index: number; mem: number; steps: number }[] = []
	for (let i = 0; redeemers && i < redeemers.len(); i++) {
		const r = redeemers.get(i)
		const tag = r.tag()
		const index = r.index()
		const exUnits = r.ex_units()
		const mem = exUnits.mem()
		const steps = exUnits.steps()
		out.push({
			tag: ['SPEND', 'MINT', 'CERT', 'REWARD', 'VOTE', 'PROPOSE'][tag.kind()],
			index: Number(index.to_str()),
			mem: Number(mem.to_str()),
			steps: Number(steps.to_str())
		})
		for (const o of [steps, mem, exUnits, index, tag, r]) o.free()
	}
	redeemers?.free()
	witnesses.free()
	tx.free()
	return out
}
