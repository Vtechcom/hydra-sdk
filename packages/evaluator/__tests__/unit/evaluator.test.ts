import { describe, it, expect, vi } from 'vitest'
import { DEFAULT_V3_COST_MODEL_LIST, SLOT_CONFIG_NETWORK } from '@hydra-sdk/core'
import { OfflineEvaluator } from '../../src/evaluator'
import { EvaluatorError, type EvaluatorErrorCode } from '../../src/errors'
import type { EngineInput, EngineResult, EvaluationEngine } from '../../src/engine/types'
import { spendFixture } from '../helpers/spend-tx'

/** Engine double: records what the evaluator hands it and returns canned results. */
const fakeEngine = (results: EngineResult[] | (() => never)) => {
	const inputs: EngineInput[] = []
	const engine: EvaluationEngine & { dispose: ReturnType<typeof vi.fn> } = {
		name: 'fake-engine',
		version: '9.9.9',
		evaluate: input => {
			inputs.push(input)
			return typeof results === 'function' ? results() : results
		},
		dispose: vi.fn()
	}
	return { engine, inputs }
}

const SPEND: EngineResult = { tag: 'SPEND', index: 0, budget: { mem: 1, steps: 2 } }

describe('OfflineEvaluator — engine boundary', () => {
	it('hands the engine the resolved UTxOs, default cost models and the preprod slot config', async () => {
		const { txHex, utxos } = await spendFixture('V3')
		const { engine, inputs } = fakeEngine([SPEND])
		await new OfflineEvaluator(engine).evaluateTx(txHex, utxos)

		expect(inputs).toHaveLength(1)
		expect(inputs[0].txHex).toBe(txHex)
		expect(inputs[0].utxos.map(u => `${u.input.txHash}#${u.input.outputIndex}`).sort()).toEqual(
			utxos.map(u => `${u.input.txHash}#${u.input.outputIndex}`).sort()
		)
		expect(inputs[0].costModels.plutusV3).toEqual(DEFAULT_V3_COST_MODEL_LIST)
		const { zeroTime, zeroSlot, slotLength } = SLOT_CONFIG_NETWORK.PREPROD
		expect(inputs[0].slotConfig).toEqual({ zeroTime, zeroSlot, slotLength })
	})

	it('passes an overridden cost model and slot config through unchanged', async () => {
		const { txHex, utxos } = await spendFixture('V3')
		const { engine, inputs } = fakeEngine([SPEND])
		const slotConfig = { zeroTime: 1, zeroSlot: 2, slotLength: 3, startEpoch: 0, epochLength: 10 }
		await new OfflineEvaluator(engine, { context: { costModels: { plutusV3: [7, 8] }, slotConfig } }).evaluateTx(
			txHex,
			utxos
		)
		expect(inputs[0].costModels.plutusV3).toEqual([7, 8])
		expect(inputs[0].slotConfig).toEqual({ zeroTime: 1, zeroSlot: 2, slotLength: 3 })
	})

	it('flags tags the TxBuilder does not remap as unmapped, and strips logs from evaluateTx', async () => {
		const { txHex, utxos } = await spendFixture('V3')
		const cert: EngineResult = { tag: 'CERT', index: 0, budget: { mem: 3, steps: 4 }, logs: ['trace'] }
		const { engine } = fakeEngine([SPEND, cert])
		const evaluator = new OfflineEvaluator(engine)

		expect(await evaluator.evaluateTx(txHex, utxos)).toEqual([
			{ tag: 'SPEND', index: 0, budget: { mem: 1, steps: 2 } },
			{ tag: 'CERT', index: 0, budget: { mem: 3, steps: 4 } }
		])
		const { actions, engine: identity } = await evaluator.evaluateTxDetailed(txHex, utxos)
		expect(actions.map(a => [a.tag, a.unmapped, a.logs])).toEqual([
			['SPEND', undefined, undefined],
			['CERT', true, ['trace']]
		])
		expect(identity).toEqual({ name: 'fake-engine', version: '9.9.9' })
	})

	// The evaluator itself never raises these two codes (see the it.fails in
	// txbuilder-integration.test.ts); an engine that does must reach the caller as-is.
	it.each<EvaluatorErrorCode>(['UNSUPPORTED_LANGUAGE', 'MISSING_COST_MODEL', 'SCRIPT_FAILURE'])(
		'propagates an engine %s error unchanged',
		async code => {
			const { txHex, utxos } = await spendFixture('V3')
			const { engine } = fakeEngine(() => {
				throw new EvaluatorError(code, `engine says ${code}`, { languageVersion: 'V3' })
			})
			await expect(new OfflineEvaluator(engine).evaluateTx(txHex, utxos)).rejects.toThrow(
				expect.objectContaining({ code, message: `engine says ${code}`, details: { languageVersion: 'V3' } })
			)
		}
	)

	it('does not call the engine when context resolution fails', async () => {
		const { txHex } = await spendFixture('V3')
		const { engine, inputs } = fakeEngine([SPEND])
		await expect(new OfflineEvaluator(engine).evaluateTx(txHex)).rejects.toThrow(/Cannot resolve input UTxO/)
		expect(inputs).toHaveLength(0)
	})
})

describe('OfflineEvaluator — dispose', () => {
	it('frees engine resources after every evaluation by default (autoDispose)', async () => {
		const { txHex, utxos } = await spendFixture('V3')
		const { engine } = fakeEngine([SPEND])
		const evaluator = new OfflineEvaluator(engine)
		await evaluator.evaluateTx(txHex, utxos)
		await evaluator.evaluateTx(txHex, utxos)
		expect(engine.dispose).toHaveBeenCalledTimes(2)
	})

	it('with autoDispose: false, frees engine resources only on dispose()', async () => {
		const { txHex, utxos } = await spendFixture('V3')
		const { engine } = fakeEngine([SPEND])
		const evaluator = new OfflineEvaluator(engine, { autoDispose: false })
		await evaluator.evaluateTx(txHex, utxos)
		expect(engine.dispose).not.toHaveBeenCalled()
		evaluator.dispose()
		expect(engine.dispose).toHaveBeenCalledTimes(1)
	})

	it('dispose() is a no-op for an engine without native resources', () => {
		const engine: EvaluationEngine = { name: 'plain', version: '1', evaluate: () => [] }
		expect(() => new OfflineEvaluator(engine).dispose()).not.toThrow()
	})
})
