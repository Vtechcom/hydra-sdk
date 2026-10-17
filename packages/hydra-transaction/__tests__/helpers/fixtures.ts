import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { CostModels, DEFAULT_PROTOCOL_PARAMETERS, type Asset, type UTxO } from '@hydra-sdk/core'
import { TxBuilder } from '../../src/tx-builder'
import type { EvalAction, IEvaluator } from '../../src/types'

// Preprod base address (key payment + key stake). Any valid bech32 works; this one is reused everywhere.
export const ADDRESS =
	'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
export const OTHER_ADDRESS =
	'addr_test1qpfhhfy2qgls50r9u4yh0l7z67xpg0a5rrhkmvzcuqrd0znuzcjqw982pcftgx53fu5527z2cj2tkx2h8ux2vxsg475q9gw0lz'
export const REWARD_ADDRESS = 'stake_test1uqfu74w3wh4gfzu8m6e7j987h4lq9r3t7ef5gaw497uu85qsqfy27'

export const txHash = (c: string) => c.repeat(64)
export const POLICY_ID = 'a'.repeat(56)
export const TOKEN = `${POLICY_ID}746f6b656e` // "token"

/** Minimal always-succeeds Plutus V3 validator (flat-encoded `\_ -> ()`, CBOR-wrapped). */
export const ALWAYS_SUCCEEDS_V3 = '46450101002499'

const withFree = <T extends { free(): void }, R>(obj: T, fn: (o: T) => R): R => {
	try {
		return fn(obj)
	} finally {
		obj.free()
	}
}

/** Script hash of ALWAYS_SUCCEEDS_V3 (hex). */
export const ALWAYS_SUCCEEDS_V3_HASH = withFree(
	CardanoWASM.PlutusScript.from_hex_with_version(ALWAYS_SUCCEEDS_V3, CardanoWASM.Language.new_plutus_v3()),
	s => withFree(s.hash(), h => h.to_hex())
)

/** Preprod enterprise address locked by ALWAYS_SUCCEEDS_V3. */
export const SCRIPT_ADDRESS = withFree(CardanoWASM.ScriptHash.from_hex(ALWAYS_SUCCEEDS_V3_HASH), hash =>
	withFree(CardanoWASM.Credential.from_scripthash(hash), cred =>
		withFree(CardanoWASM.EnterpriseAddress.new(0, cred), ent => withFree(ent.to_address(), a => a.to_bech32()))
	)
)

export const lovelace = (quantity: string | number | bigint): Asset[] => [
	{ unit: 'lovelace', quantity: String(quantity) }
]

export const utxo = (hash: string, outputIndex: number, amount: Asset[], address = ADDRESS): UTxO => ({
	input: { txHash: hash, outputIndex },
	output: { address, amount }
})

/** Evaluator returning a fixed budget per listed redeemer slot; `calls` collects every evaluated tx hex. */
export const mockEvaluator = (
	budget: { mem: number; steps: number },
	slots: Array<Pick<EvalAction, 'tag' | 'index'>> = [{ tag: 'SPEND', index: 0 }]
) => {
	const calls: string[] = []
	const evaluator: IEvaluator = {
		async evaluateTx(hex: string) {
			calls.push(hex)
			return slots.map(s => ({ ...s, budget }))
		}
	}
	return { evaluator, calls }
}

// ----------------------------------------------------------------------------
// Built-tx inspection. Everything reads the CSL JSON form, so no intermediate
// WASM getters are left to free.
// ----------------------------------------------------------------------------

export type TxJson = {
	body: {
		inputs: Array<{ transaction_id: string; index: number }>
		outputs: Array<{
			address: string
			amount: { coin: string; multiasset?: Record<string, Record<string, string>> | null }
			plutus_data?: unknown
			script_ref?: unknown
		}>
		fee: string
		ttl?: string | null
		validity_start_interval?: string | null
		certs?: unknown[] | null
		withdrawals?: Record<string, string> | null
		auxiliary_data_hash?: string | null
		mint?: unknown[] | null
		script_data_hash?: string | null
		collateral?: Array<{ transaction_id: string; index: number }> | null
		required_signers?: string[] | null
		collateral_return?: { address: string; amount: { coin: string } } | null
		total_collateral?: string | null
		reference_inputs?: Array<{ transaction_id: string; index: number }> | null
	}
	witness_set: {
		redeemers?: Array<{ tag: string; index: string; ex_units: { mem: string; steps: string } }> | null
		plutus_scripts?: unknown[] | null
		plutus_data?: unknown
	}
	auxiliary_data?: { metadata?: Record<string, unknown> | null } | null
}

export const txJson = (tx: CardanoWASM.Transaction): TxJson => JSON.parse(tx.to_json())

export const ref = (i: { transaction_id: string; index: number }) => `${i.transaction_id}#${i.index}`

export const fee = (tx: TxJson) => BigInt(tx.body.fee)

export const sumOutputs = (tx: TxJson) => tx.body.outputs.reduce((acc, o) => acc + BigInt(o.amount.coin), 0n)

/** Lovelace of the inputs the tx actually spends, looked up in the staged UTxO set. */
export const sumInputs = (tx: TxJson, utxos: UTxO[]) => {
	const byRef = new Map(utxos.map(u => [`${u.input.txHash}#${u.input.outputIndex}`, u]))
	return tx.body.inputs.reduce((acc, i) => {
		const u = byRef.get(ref(i))
		if (!u) throw new Error(`input ${ref(i)} not in the staged UTxO set`)
		return acc + BigInt(u.output.amount.find(a => a.unit === 'lovelace')?.quantity ?? '0')
	}, 0n)
}

/** Total quantity of one native asset across all outputs. */
export const outputAsset = (tx: TxJson, policyId: string, assetName: string) =>
	tx.body.outputs.reduce((acc, o) => acc + BigInt(o.amount.multiasset?.[policyId]?.[assetName] ?? '0'), 0n)

/**
 * Minimum fee CSL requires for `tx` once it carries `vkeys` key witnesses (size fee + script
 * execution fee). Fake witnesses only add bytes — the signature is never checked here.
 */
export const minFee = (tx: CardanoWASM.Transaction, vkeys = 1, pp = DEFAULT_PROTOCOL_PARAMETERS): bigint => {
	const scratch: Array<{ free(): void }> = []
	const keep = <T extends { free(): void }>(o: T): T => (scratch.push(o), o)
	try {
		const witnesses = keep(tx.witness_set())
		const vkeyWitnesses = keep(CardanoWASM.Vkeywitnesses.new())
		for (let i = 0; i < vkeys; i++) {
			const vkey = keep(CardanoWASM.Vkey.new(keep(CardanoWASM.PublicKey.from_bytes(new Uint8Array(32).fill(i + 1)))))
			const sig = keep(CardanoWASM.Ed25519Signature.from_bytes(new Uint8Array(64)))
			vkeyWitnesses.add(keep(CardanoWASM.Vkeywitness.new(vkey, sig)))
		}
		witnesses.set_vkeys(vkeyWitnesses)
		// Transaction.new takes ownership of the auxiliary data, so it is not kept for freeing.
		const signed = keep(CardanoWASM.Transaction.new(keep(tx.body()), witnesses, tx.auxiliary_data()))
		const linear = keep(
			CardanoWASM.LinearFee.new(
				keep(CardanoWASM.BigNum.from_str(String(pp.minFeeA))),
				keep(CardanoWASM.BigNum.from_str(String(pp.minFeeB)))
			)
		)
		const sizeFee = BigInt(keep(CardanoWASM.min_fee(signed, linear)).to_str())
		const prices = keep(
			CardanoWASM.ExUnitPrices.new(
				keep(
					CardanoWASM.UnitInterval.new(
						keep(CardanoWASM.BigNum.from_str('57700')),
						keep(CardanoWASM.BigNum.from_str('1000000'))
					)
				),
				keep(
					CardanoWASM.UnitInterval.new(
						keep(CardanoWASM.BigNum.from_str('721')),
						keep(CardanoWASM.BigNum.from_str('10000000'))
					)
				)
			)
		)
		const scriptFee = BigInt(keep(CardanoWASM.min_script_fee(signed, prices)).to_str())
		return sizeFee + scriptFee
	} finally {
		scratch.reverse().forEach(o => o.free())
	}
}

/** script_data_hash recomputed from the tx's own redeemers/datums and the default V3 cost model. */
export const recomputeScriptDataHashV3 = (tx: CardanoWASM.Transaction): string => {
	const scratch: Array<{ free(): void }> = []
	const keep = <T extends { free(): void }>(o: T): T => (scratch.push(o), o)
	try {
		const witnesses = keep(tx.witness_set())
		const redeemers = keep(witnesses.redeemers()!)
		const datums = witnesses.plutus_data() // consumed by hash_script_data, not kept for freeing
		const v3 = keep(CardanoWASM.Language.new_plutus_v3())
		const costmdls = keep(CardanoWASM.Costmdls.new())
		costmdls.insert(v3, keep(CostModels.defaultCostModels.get(v3)!))
		return keep(CardanoWASM.hash_script_data(redeemers, costmdls, datums)).to_hex()
	} finally {
		scratch.reverse().forEach(o => o.free())
	}
}

/**
 * Build with `builder`, hand the decoded tx (and the raw one) to `fn`, then free the tx and
 * dispose the builder.
 */
export const withTx = async <R>(
	builder: TxBuilder,
	fn: (tx: TxJson, raw: CardanoWASM.Transaction) => R | Promise<R>,
	options?: { fastRebalance?: boolean }
): Promise<R> => {
	const raw = await builder.complete(options)
	try {
		return await fn(txJson(raw), raw)
	} finally {
		raw.free()
		builder.dispose()
	}
}
