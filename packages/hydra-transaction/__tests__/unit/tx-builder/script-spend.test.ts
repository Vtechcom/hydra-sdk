import { describe, it, expect, vi, afterEach } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { TxBuilder } from '../../../src/tx-builder'
import type { TxBuilderOptions } from '../../../src/types'
import {
	ADDRESS,
	ALWAYS_SUCCEEDS_V3,
	ALWAYS_SUCCEEDS_V3_HASH,
	OTHER_ADDRESS,
	SCRIPT_ADDRESS,
	fee,
	lovelace,
	mockEvaluator,
	recomputeScriptDataHashV3,
	ref,
	sumInputs,
	sumOutputs,
	txHash,
	utxo,
	withTx,
	type TxJson
} from '../../helpers/fixtures'

const FUND = utxo(txHash('a'), 0, lovelace(10_000_000))
const SCRIPT_UTXO = utxo(txHash('b'), 1, lovelace(5_000_000), SCRIPT_ADDRESS)
const PLACEHOLDER = { mem: '100000', steps: '10000000' } // emptyRedeemer() default exUnits

/** Funding input (goes through coin selection) + always-succeeds script input + collateral. */
const stage = (options: TxBuilderOptions = {}, out = 2_000_000) =>
	new TxBuilder(options)
		.txIn(FUND.input.txHash, 0, FUND.output.amount, ADDRESS)
		.txIn(SCRIPT_UTXO.input.txHash, 1, SCRIPT_UTXO.output.amount, SCRIPT_ADDRESS)
		.txInScript(ALWAYS_SUCCEEDS_V3)
		.txInEmptyRedeemer()
		.txInCollateral(txHash('c'), 0, lovelace(5_000_000), ADDRESS)
		.txOut(OTHER_ADDRESS, lovelace(out))
		.changeAddress(ADDRESS)

const exUnits = (tx: TxJson) => tx.witness_set.redeemers!.map(r => r.ex_units)

afterEach(() => {
	vi.restoreAllMocks()
})

describe('script spend — evaluator', () => {
	it('does not call the evaluator for a plain transfer', async () => {
		const { evaluator, calls } = mockEvaluator({ mem: 1, steps: 1 })
		await withTx(
			new TxBuilder({ evaluator }).setInputs([FUND]).txOut(OTHER_ADDRESS, lovelace(1_000_000)).changeAddress(ADDRESS),
			() => {}
		)
		expect(calls).toHaveLength(0)
	})

	it('writes evaluated exUnits into the redeemer and rebuilds once', async () => {
		const { evaluator, calls } = mockEvaluator({ mem: 987654, steps: 123456789 })
		await withTx(stage({ isHydra: true, evaluator }), tx => {
			expect(calls).toHaveLength(1)
			// the evaluator received the draft tx, which still carries the placeholder budget
			const draft = CardanoWASM.Transaction.from_hex(calls[0])
			expect(JSON.parse(draft.to_json()).witness_set.redeemers[0].ex_units).toEqual(PLACEHOLDER)
			draft.free()
			expect(exUnits(tx)).toEqual([{ mem: '987654', steps: '123456789' }])
		})
	})

	it('applies the txEvaluationMultiplier, flooring the result', async () => {
		const { evaluator } = mockEvaluator({ mem: 1001, steps: 2001 })
		await withTx(stage({ isHydra: true, evaluator, txEvaluationMultiplier: 1.5 }), tx => {
			expect(exUnits(tx)).toEqual([{ mem: '1501', steps: '3001' }])
		})
	})

	it.each([
		['no evaluator is supplied', undefined],
		['the evaluator returns no actions', mockEvaluator({ mem: 1, steps: 1 }, []).evaluator],
		['the SPEND index is out of range', mockEvaluator({ mem: 1, steps: 1 }, [{ tag: 'SPEND', index: 7 }]).evaluator]
	])('keeps the placeholder exUnits when %s', async (_name, evaluator) => {
		await withTx(stage({ isHydra: true, evaluator }), tx => {
			expect(exUnits(tx)).toEqual([PLACEHOLDER])
		})
	})

	it('remaps a MINT evaluation onto the mint redeemer', async () => {
		const { evaluator } = mockEvaluator({ mem: 4242, steps: 8484 }, [{ tag: 'MINT', index: 0 }])
		const tok = Buffer.from('tok').toString('hex')
		const builder = new TxBuilder({ evaluator })
			.setInputs([FUND])
			.mint('1', ALWAYS_SUCCEEDS_V3_HASH, 'tok')
			.mintingScript({ type: 'PlutusV3', scriptCborHex: ALWAYS_SUCCEEDS_V3 })
			.mintRedeemerValue(
				CardanoWASM.Redeemer.from_json(
					JSON.stringify({ tag: 'Mint', index: '0', data: '{"constructor":0,"fields":[]}', ex_units: PLACEHOLDER })
				)
			)
			.txInCollateral(txHash('c'), 0, lovelace(5_000_000), ADDRESS)
			.txOut(OTHER_ADDRESS, [...lovelace(2_000_000), { unit: ALWAYS_SUCCEEDS_V3_HASH + tok, quantity: '1' }])
			.changeAddress(ADDRESS)

		await withTx(builder, (tx, raw) => {
			expect(tx.witness_set.redeemers).toMatchObject([{ tag: 'Mint', ex_units: { mem: '4242', steps: '8484' } }])
			expect(tx.body.script_data_hash).toBe(recomputeScriptDataHashV3(raw))
		})
	})

	it('propagates an evaluator failure and logs it when errorLogger is on', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {})
		const builder = stage({
			isHydra: true,
			errorLogger: true,
			evaluator: { evaluateTx: async () => Promise.reject(new Error('script failed: budget exceeded')) }
		})
		await expect(builder.complete()).rejects.toThrow(/script failed: budget exceeded/)
		expect(error).toHaveBeenCalledWith(
			'[error][TxBuilder][evaluateTx]: ',
			expect.objectContaining({ message: 'script failed: budget exceeded' })
		)
		builder.dispose()
	})
})

describe('script spend — fastRebalance', () => {
	const budget = { mem: 500, steps: 64100 }

	it('produces a balanced tx with the evaluated exUnits and a fresh script_data_hash', async () => {
		await withTx(
			stage({ evaluator: mockEvaluator(budget).evaluator }),
			(tx, raw) => {
				expect(exUnits(tx)).toEqual([{ mem: '500', steps: '64100' }])
				expect(sumInputs(tx, [FUND, SCRIPT_UTXO])).toBe(sumOutputs(tx) + fee(tx))
				expect(fee(tx)).toBeGreaterThan(0n)
				expect(tx.body.script_data_hash).toBe(recomputeScriptDataHashV3(raw))
			},
			{ fastRebalance: true }
		)
	})

	it('matches the full rebuild: same inputs, same fee', async () => {
		const full = await withTx(stage({ evaluator: mockEvaluator(budget).evaluator }), tx => tx)
		const fast = await withTx(stage({ evaluator: mockEvaluator(budget).evaluator }), tx => tx, { fastRebalance: true })
		expect(fast.body.inputs.map(ref).sort()).toEqual(full.body.inputs.map(ref).sort())
		expect(exUnits(fast)).toEqual(exUnits(full))
		expect(fee(fast)).toBe(fee(full))
	})

	it('falls back to the normal path in Hydra mode', async () => {
		await withTx(
			stage({ isHydra: true, evaluator: mockEvaluator(budget).evaluator }),
			tx => {
				expect(exUnits(tx)).toEqual([{ mem: '500', steps: '64100' }])
			},
			{ fastRebalance: true }
		)
	})

	it.fails('B3: keeps the collateral return after a fast rebalance', async () => {
		const builder = stage({ evaluator: mockEvaluator(budget).evaluator }).collateralReturn(ADDRESS, lovelace(5_000_000))
		await withTx(
			builder,
			tx => {
				expect(tx.body.collateral_return?.address).toBe(ADDRESS)
			},
			{ fastRebalance: true }
		)
	})
})

describe('script spend — datums and pairing', () => {
	const datum = () => CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('7'))

	it('puts a datum-hash input datum into the witness set', async () => {
		const d = datum()
		const builder = new TxBuilder({ isHydra: true })
			.txIn(SCRIPT_UTXO.input.txHash, 1, SCRIPT_UTXO.output.amount, SCRIPT_ADDRESS)
			.txInScript(ALWAYS_SUCCEEDS_V3)
			.txInDatumHash(d)
			.txInEmptyRedeemer()
			.txInCollateral(txHash('c'), 0, lovelace(5_000_000), ADDRESS)
			.txOut(ADDRESS, lovelace(5_000_000))
			.setFee('0')
		await withTx(builder, (tx, raw) => {
			expect(tx.witness_set.plutus_data).toMatchObject({ elems: ['{"int":7}'] })
			expect(tx.body.script_data_hash).toBe(recomputeScriptDataHashV3(raw))
		})
		d.free()
	})

	it('keeps an inline-datum input datum out of the witness set', async () => {
		const d = datum()
		const builder = new TxBuilder({ isHydra: true })
			.txIn(SCRIPT_UTXO.input.txHash, 1, SCRIPT_UTXO.output.amount, SCRIPT_ADDRESS)
			.txInScript(ALWAYS_SUCCEEDS_V3)
			.txInInlineDatum(d)
			.txInEmptyRedeemer()
			.txInCollateral(txHash('c'), 0, lovelace(5_000_000), ADDRESS)
			.txOut(ADDRESS, lovelace(5_000_000))
			.setFee('0')
		await withTx(builder, tx => {
			expect(tx.witness_set.plutus_data).toBeNull()
			expect(tx.witness_set.redeemers).toHaveLength(1)
		})
		d.free()
	})

	it.fails('B5: an input with a redeemer but no txInScript does not take the next input’s script', async () => {
		const builder = new TxBuilder({ isHydra: true })
			.txIn(txHash('d'), 0, lovelace(5_000_000), SCRIPT_ADDRESS)
			.txInEmptyRedeemer() // script expected from elsewhere, none attached
			.txIn(SCRIPT_UTXO.input.txHash, 1, SCRIPT_UTXO.output.amount, SCRIPT_ADDRESS)
			.txInScript(ALWAYS_SUCCEEDS_V3)
			.txInEmptyRedeemer()
			.txInCollateral(txHash('c'), 0, lovelace(5_000_000), ADDRESS)
			.txOut(ADDRESS, lovelace(10_000_000))
			.setFee('0')
		// today the script is paired by position: input d#0 gets b#1's script and b#1 hits a WASM panic
		await expect(builder.complete()).rejects.toThrow(new RegExp(`${txHash('d')}#0`))
	})
})

describe('script spend — script input only', () => {
	const scriptOnly = (isHydra: boolean) =>
		new TxBuilder({ isHydra })
			.txIn(SCRIPT_UTXO.input.txHash, 1, SCRIPT_UTXO.output.amount, SCRIPT_ADDRESS)
			.txInScript(ALWAYS_SUCCEEDS_V3)
			.txInEmptyRedeemer()
			.txInCollateral(txHash('c'), 0, lovelace(5_000_000), ADDRESS)
			.collateralReturn(ADDRESS, lovelace(5_000_000))
			.txOut(ADDRESS, lovelace(5_000_000)) // equal value → no change, fee 0
			.setFee('0')
			.changeAddress(ADDRESS)

	it('builds without a funding input (no coin selection)', async () => {
		await withTx(scriptOnly(true), (tx, raw) => {
			expect(tx.body.inputs.map(ref)).toEqual([`${txHash('b')}#1`])
			expect(tx.body.fee).toBe('0')
			expect(tx.body.script_data_hash).toBe(recomputeScriptDataHashV3(raw))
		})
	})

	it.fails('keeps a fee set with setFee() through the evaluator rebuild', async () => {
		// the rebuild pass starts from a fresh CSL TransactionBuilder, dropping set_fee: "Fee not specified"
		await withTx(
			new TxBuilder({ isHydra: true, evaluator: mockEvaluator({ mem: 500, steps: 64100 }).evaluator })
				.txIn(SCRIPT_UTXO.input.txHash, 1, SCRIPT_UTXO.output.amount, SCRIPT_ADDRESS)
				.txInScript(ALWAYS_SUCCEEDS_V3)
				.txInEmptyRedeemer()
				.txInCollateral(txHash('c'), 0, lovelace(5_000_000), ADDRESS)
				.txOut(ADDRESS, lovelace(5_000_000))
				.setFee('0'),
			tx => {
				expect(tx.body.fee).toBe('0')
				expect(exUnits(tx)).toEqual([{ mem: '500', steps: '64100' }])
			}
		)
	})

	it.fails('B3: keeps the collateral return when there is no funding input', async () => {
		await withTx(scriptOnly(true), tx => {
			expect(tx.body.collateral_return?.address).toBe(ADDRESS)
		})
	})
})
