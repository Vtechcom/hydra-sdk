import { describe, it, expect } from 'vitest'
import { TxBuilder } from '../../../src/tx-builder'
import {
	ADDRESS,
	ALWAYS_SUCCEEDS_V3,
	OTHER_ADDRESS,
	SCRIPT_ADDRESS,
	fee,
	lovelace,
	recomputeScriptDataHashV3,
	ref,
	sumInputs,
	sumOutputs,
	txHash,
	utxo,
	withTx
} from '../../helpers/fixtures'

const FUND = utxo(txHash('a'), 0, lovelace(10_000_000))
const payment = (options = {}) =>
	new TxBuilder(options).setInputs([FUND]).txOut(OTHER_ADDRESS, lovelace(2_000_000)).changeAddress(ADDRESS)

describe('txInReference', () => {
	it('lists reference inputs in the body without spending them', async () => {
		// Hydra mode: build_tx_unsafe skips the min-fee check that the next test records as broken
		const builder = payment({ isHydra: true })
			.txInReference(txHash('e'), 0)
			.txInReference(txHash('f'), 999)
			.txInReference(txHash('e'), 0)

		await withTx(builder, tx => {
			// duplicates collapse; reference inputs never appear among spent inputs
			expect(tx.body.reference_inputs?.map(ref).sort()).toEqual([`${txHash('e')}#0`, `${txHash('f')}#999`])
			expect(tx.body.inputs.map(ref)).toEqual([`${txHash('a')}#0`])
			// they carry no value: the balance is inputs = outputs + fee as without them
			expect(sumInputs(tx, [FUND])).toBe(sumOutputs(tx) + fee(tx))
		})
	})

	it.fails('counts reference inputs in the fee of a balanced build', async () => {
		// today they are added after coin selection fixed the fee, so build_tx rejects the tx with
		// "Fee is less than the minimum fee"
		await withTx(payment().txInReference(txHash('e'), 0), tx => {
			expect(tx.body.reference_inputs?.map(ref)).toEqual([`${txHash('e')}#0`])
			expect(sumInputs(tx, [FUND])).toBe(sumOutputs(tx) + fee(tx))
		})
	})

	it('leaves reference_inputs unset when none are staged', async () => {
		await withTx(payment(), tx => {
			expect(tx.body.reference_inputs).toBeNull()
		})
	})

	it('combines with a script spend', async () => {
		const builder = new TxBuilder({ isHydra: true })
			.txInReference(txHash('e'), 0)
			.txIn(txHash('b'), 1, lovelace(5_000_000), SCRIPT_ADDRESS)
			.txInScript(ALWAYS_SUCCEEDS_V3)
			.txInEmptyRedeemer()
			.txInCollateral(txHash('c'), 0, lovelace(5_000_000), ADDRESS)
			.txOut(ADDRESS, lovelace(5_000_000))
			.setFee('0')

		await withTx(builder, (tx, raw) => {
			expect(tx.body.reference_inputs?.map(ref)).toEqual([`${txHash('e')}#0`])
			expect(tx.body.inputs.map(ref)).toEqual([`${txHash('b')}#1`])
			expect(tx.body.script_data_hash).toBe(recomputeScriptDataHashV3(raw))
		})
	})
})
