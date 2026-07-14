import { describe, it, expect, vi } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { TxBuilder } from '../../../src/tx-builder'
import type { IEvaluator, EvalAction } from '../../../src/types'

const testAddress =
	'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
const fundTxHash = 'a'.repeat(64)
const scriptTxHash = 'b'.repeat(64)
const collateralTxHash = 'c'.repeat(64)
// Minimal always-succeeds Plutus V3 validator
const scriptCbor = '46450101002499'

// A mock evaluator returning a fixed budget for every SPEND redeemer slot.
const mockEvaluator = (budget: { mem: number; steps: number }, spy?: (hex: string) => void): IEvaluator => ({
	async evaluateTx(txHex: string): Promise<EvalAction[]> {
		spy?.(txHex)
		return [
			{ tag: 'SPEND', index: 0, budget },
			{ tag: 'SPEND', index: 1, budget }
		]
	}
})

const buildScriptTx = (builder: TxBuilder) =>
	builder
		.txIn(fundTxHash, 0, [{ unit: 'lovelace', quantity: '10000000' }], testAddress) // funding input (coin selection)
		.txIn(scriptTxHash, 1, [{ unit: 'lovelace', quantity: '5000000' }], testAddress) // script input
		.txInScript(scriptCbor, 'V3')
		.txInEmptyRedeemer()
		.txInCollateral(collateralTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
		.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
		.changeAddress(testAddress)

const firstRedeemerExUnits = (tx: CardanoWASM.Transaction) => {
	const redeemers = tx.witness_set().redeemers()
	expect(redeemers).toBeDefined()
	const r = redeemers!.get(0)
	return { mem: r.ex_units().mem().to_str(), steps: r.ex_units().steps().to_str() }
}

describe('TxBuilder - evaluator (exUnits)', () => {
	it('should not call the evaluator for a plain transfer (no redeemers)', async () => {
		const spy = vi.fn()
		const builder = new TxBuilder({ isHydra: true, evaluator: { evaluateTx: spy } })
		await builder
			.setInputs([{ input: { txHash: fundTxHash, outputIndex: 0 }, output: { address: testAddress, amount: [{ unit: 'lovelace', quantity: '10000000' }] } }])
			.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
			.changeAddress(testAddress)
			.complete()

		expect(spy).not.toHaveBeenCalled()
	})

	it('should write evaluated exUnits into the redeemer and rebuild', async () => {
		const spy = vi.fn()
		const budget = { mem: 987654, steps: 123456789 }
		const builder = new TxBuilder({ isHydra: true, evaluator: mockEvaluator(budget, spy) })

		const tx = await buildScriptTx(builder).complete()

		expect(spy).toHaveBeenCalledTimes(1)
		expect(typeof spy.mock.calls[0][0]).toBe('string') // called with tx hex
		expect(firstRedeemerExUnits(tx)).toEqual({ mem: '987654', steps: '123456789' })
	})

	it('should apply the txEvaluationMultiplier safety margin', async () => {
		const budget = { mem: 1000, steps: 2000 }
		const builder = new TxBuilder({
			isHydra: true,
			evaluator: mockEvaluator(budget),
			txEvaluationMultiplier: 1.5
		})

		const tx = await buildScriptTx(builder).complete()

		// 1000 * 1.5 = 1500, 2000 * 1.5 = 3000 (floored)
		expect(firstRedeemerExUnits(tx)).toEqual({ mem: '1500', steps: '3000' })
	})

	it('should keep placeholder exUnits when no evaluator is supplied', async () => {
		const builder = new TxBuilder({ isHydra: true })
		const tx = await buildScriptTx(builder).complete()

		// emptyRedeemer default placeholders: mem 100000, steps 10000000
		expect(firstRedeemerExUnits(tx)).toEqual({ mem: '100000', steps: '10000000' })
	})
})
