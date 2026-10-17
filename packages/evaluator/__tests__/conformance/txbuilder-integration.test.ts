import { describe, it, expect } from 'vitest'
import { TxBuilder } from '@hydra-sdk/transaction'
import { createEvaluator } from '../../src/evaluator'
import { fromUtxos } from '../../src/context/sources'
import {
	ALWAYS_FAILS_V3,
	PLACEHOLDER_EXUNITS,
	mintFixture,
	mintUtxos,
	redeemerBudgets,
	refScriptSpendFixture,
	refScriptTxHash,
	resolvedUtxos,
	spendFixture,
	stageMintTx,
	stageSpendTx,
	type ScriptVersion
} from '../helpers/spend-tx'

// Budgets confirmed against the Scalus oracle in differential.test.ts.
const SPEND_BUDGET: Record<ScriptVersion, { mem: number; steps: number }> = {
	V1: { mem: 1700, steps: 256100 },
	V2: { mem: 1700, steps: 256100 },
	V3: { mem: 500, steps: 64100 }
}

describe('OfflineEvaluator ↔ TxBuilder.complete()', () => {
	it.each(['V1', 'V2', 'V3'] as const)('%s SPEND: complete() writes the evaluated budget back', async version => {
		const evaluator = await createEvaluator({ source: fromUtxos(resolvedUtxos(version)) })
		const builder = new TxBuilder({ isHydra: true, evaluator })
		const tx = await stageSpendTx(builder, version).complete()
		const txHex = tx.to_hex()
		tx.free()
		builder.dispose()

		const [redeemer] = redeemerBudgets(txHex)
		expect(redeemer).toEqual({ tag: 'SPEND', index: 0, ...SPEND_BUDGET[version] })
		expect(String(redeemer.mem)).not.toBe(PLACEHOLDER_EXUNITS.mem)
	})

	it('MINT: complete() writes the evaluated budget back to the mint redeemer', async () => {
		const evaluator = await createEvaluator({ source: fromUtxos(mintUtxos()) })
		const builder = new TxBuilder({ isHydra: true, evaluator })
		const tx = await stageMintTx(builder).complete()
		const txHex = tx.to_hex()
		tx.free()
		builder.dispose()

		expect(redeemerBudgets(txHex)).toEqual([{ tag: 'MINT', index: 0, ...SPEND_BUDGET.V3 }])
	})
})

describe('OfflineEvaluator.evaluateTx', () => {
	it('returns exactly one SPEND action for the staged script input', async () => {
		const evaluator = await createEvaluator()
		const { txHex, utxos } = await spendFixture('V3')
		expect(await evaluator.evaluateTx(txHex, utxos)).toEqual([{ tag: 'SPEND', index: 0, budget: SPEND_BUDGET.V3 }])
	})

	it('returns a MINT action, mapped (no unmapped flag) in the detailed result', async () => {
		const evaluator = await createEvaluator()
		const { txHex, utxos } = await mintFixture()
		const { actions } = await evaluator.evaluateTxDetailed(txHex, utxos)
		expect(actions).toEqual([{ tag: 'MINT', index: 0, budget: SPEND_BUDGET.V3, logs: undefined, unmapped: undefined }])
	})

	it('throws SCRIPT_FAILURE with the engine message when the validator fails', async () => {
		const evaluator = await createEvaluator()
		const { txHex, utxos } = await spendFixture('V3', ALWAYS_FAILS_V3)
		await expect(evaluator.evaluateTx(txHex, utxos)).rejects.toThrow(
			expect.objectContaining({
				code: 'SCRIPT_FAILURE',
				message: expect.stringMatching(/validator crashed/),
				details: expect.objectContaining({ phase: 'execute', logs: [] })
			})
		)
	})

	it('throws MISSING_UTXO for an unresolved reference input before the engine runs', async () => {
		const evaluator = await createEvaluator()
		const { txHex, utxos } = await refScriptSpendFixture()
		const withoutRef = utxos.filter(u => u.input.txHash !== refScriptTxHash)
		await expect(evaluator.evaluateTx(txHex, withoutRef)).rejects.toThrow(
			expect.objectContaining({
				code: 'MISSING_UTXO',
				message: expect.stringMatching(/Cannot resolve reference UTxO f{64}#0/),
				details: expect.objectContaining({ utxo: { txHash: refScriptTxHash, index: 0 } })
			})
		)
	})

	// BUG: toEngineUtxo passes `scriptRef.scriptCbor` as-is, but whisky expects the
	// ScriptRef CBOR array `[3, script]` (`8203…`), so every reference-script spend
	// fails with ENGINE_FAILURE "Invalid script ref bytes". See encode.test.ts.
	it.fails('evaluates a SPEND whose validator comes from a reference script', async () => {
		const evaluator = await createEvaluator()
		const { txHex, utxos } = await refScriptSpendFixture()
		expect(await evaluator.evaluateTx(txHex, utxos)).toEqual([{ tag: 'SPEND', index: 0, budget: SPEND_BUDGET.V3 }])
	})

	// BUG: MISSING_COST_MODEL is declared in the error taxonomy but never raised. An
	// empty cost model list reaches whisky and panics: ENGINE_FAILURE "RuntimeError: unreachable".
	it.fails('throws MISSING_COST_MODEL when the cost model for the script language is empty', async () => {
		const evaluator = await createEvaluator({ context: { costModels: { plutusV3: [] } } })
		const { txHex, utxos } = await spendFixture('V3')
		await expect(evaluator.evaluateTx(txHex, utxos)).rejects.toThrow(
			expect.objectContaining({ code: 'MISSING_COST_MODEL', details: expect.objectContaining({ languageVersion: 'V3' }) })
		)
	})
})

describe('OfflineEvaluator.evaluateTxDetailed', () => {
	it('reports the engine identity and a fingerprint that tracks the cost models', async () => {
		const { txHex, utxos } = await spendFixture('V3')
		const a = await (await createEvaluator()).evaluateTxDetailed(txHex, utxos)
		const b = await (await createEvaluator()).evaluateTxDetailed(txHex, utxos)
		const tweaked = await (
			await createEvaluator({ context: { costModels: { plutusV1: [1, 2, 3] } } })
		).evaluateTxDetailed(txHex, utxos)

		expect(a.engine).toEqual({ name: 'whisky-evaluator', version: '0.1.1' })
		expect(a.phase).toBe('map')
		expect(a.contextFingerprint).toMatch(/^fp1-[0-9a-f]{8}$/)
		expect(b.contextFingerprint).toBe(a.contextFingerprint)
		// Same tx, same budget — but a different pinned context must not share the fingerprint.
		expect(tweaked.actions).toEqual(a.actions)
		expect(tweaked.contextFingerprint).not.toBe(a.contextFingerprint)
	})
})
