import { describe, it, expect } from 'vitest'
import { TxBuilder } from '@hydra-sdk/transaction'
import { createEvaluator } from '../../src/evaluator'
import { fromUtxos } from '../../src/context/sources'
import { PLACEHOLDER_EXUNITS, firstRedeemerExUnits, resolvedUtxos, stageSpendTx } from '../helpers/spend-tx'

describe('OfflineEvaluator ↔ TxBuilder.complete()', () => {
	it('replaces placeholder exUnits with a real evaluated budget and reprices', async () => {
		const evaluator = await createEvaluator({ source: fromUtxos(resolvedUtxos()) })
		const builder = new TxBuilder({ isHydra: true, evaluator })

		const tx = await stageSpendTx(builder).complete()
		const exUnits = firstRedeemerExUnits(tx)

		// The whole point: real budget written back, not the emptyRedeemer placeholder.
		expect(exUnits).not.toEqual(PLACEHOLDER_EXUNITS)
		expect(Number(exUnits.mem)).toBeGreaterThan(0)
		expect(Number(exUnits.steps)).toBeGreaterThan(0)
	})

	it('evaluateTx returns a SPEND action for the staged script input', async () => {
		const evaluator = await createEvaluator()
		const builder = new TxBuilder({ isHydra: true })
		const txHex = (await stageSpendTx(builder).complete()).to_hex()

		const actions = await evaluator.evaluateTx(txHex, resolvedUtxos())
		const spend = actions.find(a => a.tag === 'SPEND')
		expect(spend).toBeDefined()
		expect(spend!.budget.mem).toBeGreaterThan(0)
	})

	it('evaluateTxDetailed reports an engine identity and a stable context fingerprint', async () => {
		const evaluator = await createEvaluator({ source: fromUtxos(resolvedUtxos()) })
		const builder = new TxBuilder({ isHydra: true })
		const txHex = (await stageSpendTx(builder).complete()).to_hex()

		const a = await evaluator.evaluateTxDetailed(txHex)
		const b = await evaluator.evaluateTxDetailed(txHex)
		expect(a.engine.name).toBe('whisky-evaluator')
		expect(a.contextFingerprint).toBe(b.contextFingerprint)
		expect(a.contextFingerprint.startsWith('fp1-')).toBe(true)
	})
})
