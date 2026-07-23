import { describe, it, expect } from 'vitest'
import { TxBuilder } from '../../../src/tx-builder'

// Regression: a spend whose ONLY input is the script input (which already funds the outputs — a
// common Hydra pattern, e.g. a session/state UTxO continuing to an equal-value output) must build.
// Before the fix, `_addInputsToBuilder` always called `selectUtxosFrom`, which throws
// "UTxO inputs Insufficient" when there are no normal inputs to select from.
const testAddress =
	'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
const scriptTxHash = 'b'.repeat(64)
const collateralTxHash = 'c'.repeat(64)
// Minimal always-succeeds Plutus V3 validator
const scriptCbor = '46450101002499'

describe('TxBuilder - script-only self-funding spend', () => {
	it('builds a spend with only a script input (no normal inputs) without throwing', async () => {
		const builder = new TxBuilder({ isHydra: true })

		const tx = await builder
			.txIn(scriptTxHash, 1, [{ unit: 'lovelace', quantity: '5000000' }], testAddress) // script input funds the output
			.txInScript(scriptCbor, 'V3')
			.txInEmptyRedeemer()
			.txInCollateral(collateralTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
			.txOut(testAddress, [{ unit: 'lovelace', quantity: '5000000' }]) // equal value → no change needed, fee 0
			.setFee('0')
			.changeAddress(testAddress)
			.complete()

		expect(tx).toBeDefined()
		expect(tx.body().inputs().len()).toBe(1) // the single script input
		expect(tx.body().fee().to_str()).toBe('0')
		expect(tx.body().script_data_hash()).toBeDefined() // computed for the script input
	})
})
