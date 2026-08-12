import { describe, it, expect } from 'vitest'
import { FeeUtils } from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'
import { createEvaluator } from '../../src/evaluator'
import { fromUtxos } from '../../src/context/sources'

const calculateTxFee = FeeUtils.calculateTxFee
import { resolvedUtxos, stageSpendTx } from '../helpers/spend-tx'

/** Build the always-succeed V3 SPEND and return the tx CSL priced itself. */
const buildPricedTx = async () => {
	const evaluator = await createEvaluator({ source: fromUtxos(resolvedUtxos()) })
	const builder = new TxBuilder({ isHydra: true, evaluator })
	const tx = await stageSpendTx(builder).complete()
	return { tx, txHex: tx.to_hex(), cslFee: BigInt(tx.body().fee().to_str()) }
}

describe('calculateTxFee — full fee without a rebuild', () => {
	it('estimate is >= the fee CSL converged on, and within a tight band', async () => {
		const { txHex, cslFee } = await buildPricedTx()
		const breakdown = calculateTxFee(txHex, { resolvedUtxos: resolvedUtxos() })
		const estimate = BigInt(breakdown.fee)

		// Never under-provision.
		expect(estimate).toBeGreaterThanOrEqual(cslFee)
		// But stay close — within 2% of CSL's number.
		expect(Number(estimate - cslFee) / Number(cslFee)).toBeLessThan(0.02)
	})

	it('breaks the fee into size + script + reference components', async () => {
		const { txHex } = await buildPricedTx()
		const b = calculateTxFee(txHex, { resolvedUtxos: resolvedUtxos() })
		expect(BigInt(b.sizeFee)).toBeGreaterThan(0n)
		expect(BigInt(b.scriptFee)).toBeGreaterThan(0n)
		expect(b.refScriptFee).toBe('0') // script is in the witness set, not a reference input
		expect(b.signerCount).toBeGreaterThanOrEqual(1)
		expect(BigInt(b.baseFee)).toBe(BigInt(b.sizeFee) + BigInt(b.scriptFee) + BigInt(b.refScriptFee))
	})

	it('OfflineEvaluator.calculateFee prices from the evaluated exUnits', async () => {
		const { cslFee } = await buildPricedTx()
		const evaluator = await createEvaluator({ source: fromUtxos(resolvedUtxos()) })
		const builder = new TxBuilder({ isHydra: true })
		const txHex = (await stageSpendTx(builder).complete()).to_hex()

		const breakdown = await evaluator.calculateFee(txHex)
		expect(BigInt(breakdown.fee)).toBeGreaterThanOrEqual(cslFee)
	})

	it('feeMultiplier and safetyMarginLovelace add headroom', async () => {
		const { txHex } = await buildPricedTx()
		const base = calculateTxFee(txHex, { resolvedUtxos: resolvedUtxos() })
		const padded = calculateTxFee(txHex, {
			resolvedUtxos: resolvedUtxos(),
			feeMultiplier: 1.1,
			safetyMarginLovelace: 1000
		})
		expect(BigInt(padded.fee)).toBeGreaterThan(BigInt(base.fee))
	})
})
