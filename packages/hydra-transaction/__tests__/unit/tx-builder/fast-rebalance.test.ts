import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { TxBuilder } from '../../../src/tx-builder'
import type { IEvaluator, EvalAction } from '../../../src/types'

const testAddress =
	'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
const fundTxHash = 'a'.repeat(64)
const scriptTxHash = 'b'.repeat(64)
const collateralTxHash = 'c'.repeat(64)
const scriptCbor = '46450101002499' // always-succeed Plutus V3

const scriptAddress = (() => {
	const script = CardanoWASM.PlutusScript.from_hex_with_version(scriptCbor, CardanoWASM.Language.new_plutus_v3())
	return CardanoWASM.EnterpriseAddress.new(0, CardanoWASM.Credential.from_scripthash(script.hash()))
		.to_address()
		.to_bech32()
})()

// Mock evaluator: a fixed SPEND budget, different from the emptyRedeemer
// placeholder so complete() takes the rebalance path.
const mockEvaluator = (budget: { mem: number; steps: number }): IEvaluator => ({
	async evaluateTx(): Promise<EvalAction[]> {
		return [{ tag: 'SPEND', index: 0, budget }]
	}
})

// Non-Hydra script spend: a normal funding input (goes through coin selection),
// a script input, collateral, an output, and a change address.
const stage = (builder: TxBuilder) =>
	builder
		.txIn(fundTxHash, 0, [{ unit: 'lovelace', quantity: '10000000' }], testAddress)
		.txIn(scriptTxHash, 1, [{ unit: 'lovelace', quantity: '5000000' }], scriptAddress)
		.txInScript(scriptCbor, 'V3')
		.txInEmptyRedeemer()
		.txInCollateral(collateralTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
		.txOut(testAddress, [{ unit: 'lovelace', quantity: '2000000' }])
		.changeAddress(testAddress)

const firstRedeemerExUnits = (tx: CardanoWASM.Transaction) => {
	const r = tx.witness_set().redeemers()!.get(0)
	return { mem: r.ex_units().mem().to_str(), steps: r.ex_units().steps().to_str() }
}

const feeOf = (tx: CardanoWASM.Transaction) => BigInt(tx.body().fee().to_str())

const outputsTotal = (tx: CardanoWASM.Transaction) => {
	const outs = tx.body().outputs()
	let total = 0n
	for (let i = 0; i < outs.len(); i++) total += BigInt(outs.get(i).amount().coin().to_str())
	return total
}

// Sum the value of the inputs the transaction actually spends, by ref.
const AMOUNTS: Record<string, bigint> = {
	[`${fundTxHash}#0`]: 10_000_000n,
	[`${scriptTxHash}#1`]: 5_000_000n
}
const inputsTotal = (tx: CardanoWASM.Transaction) => {
	const inputs = tx.body().inputs()
	let total = 0n
	for (let i = 0; i < inputs.len(); i++) {
		const inp = inputs.get(i)
		total += AMOUNTS[`${inp.transaction_id().to_hex()}#${inp.index()}`] ?? 0n
	}
	return total
}

describe('TxBuilder.complete({ fastRebalance }) — rebalance without a second coin selection', () => {
	const budget = { mem: 500, steps: 64100 }

	it('produces a valid, balanced transaction with the evaluated exUnits', async () => {
		const tx = await stage(new TxBuilder({ evaluator: mockEvaluator(budget) })).complete({ fastRebalance: true })

		// exUnits were written back.
		expect(firstRedeemerExUnits(tx)).toEqual({ mem: '500', steps: '64100' })

		// Value conservation: the inputs the tx actually spends = outputs + fee.
		expect(outputsTotal(tx) + feeOf(tx)).toBe(inputsTotal(tx))
		expect(feeOf(tx)).toBeGreaterThan(0n)
	})

	it('matches the default full-rebuild fee (same inputs, only cheaper to compute)', async () => {
		const full = await stage(new TxBuilder({ evaluator: mockEvaluator(budget) })).complete()
		const fast = await stage(new TxBuilder({ evaluator: mockEvaluator(budget) })).complete({ fastRebalance: true })

		expect(firstRedeemerExUnits(fast)).toEqual(firstRedeemerExUnits(full))
		expect(feeOf(fast)).toBe(feeOf(full))
	})

	it('is ignored for a Hydra build (falls back to the normal path)', async () => {
		// isHydra disables fast rebalance; the build still succeeds with exUnits applied.
		const tx = await new TxBuilder({ isHydra: true, evaluator: mockEvaluator(budget) })
			.txIn(fundTxHash, 0, [{ unit: 'lovelace', quantity: '10000000' }], testAddress)
			.txIn(scriptTxHash, 1, [{ unit: 'lovelace', quantity: '5000000' }], scriptAddress)
			.txInScript(scriptCbor, 'V3')
			.txInEmptyRedeemer()
			.txInCollateral(collateralTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
			.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
			.changeAddress(testAddress)
			.complete({ fastRebalance: true })

		expect(firstRedeemerExUnits(tx)).toEqual({ mem: '500', steps: '64100' })
	})
})
