import { describe, it, expect, beforeAll } from 'vitest'
import { Resolver } from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'
import { resolveContext } from '../../src/context/resolver'
import { fromUtxos } from '../../src/context/sources'
import {
	collateralTxHash,
	fundTxHash,
	refScriptSpendFixture,
	refScriptTxHash,
	scriptTxHash,
	spendFixture,
	type TxFixture
} from '../helpers/spend-tx'

const keys = (utxos: { input: { txHash: string; outputIndex: number } }[]) =>
	utxos.map(u => `${u.input.txHash}#${u.input.outputIndex}`).sort()

let spend: TxFixture
let refSpend: TxFixture
beforeAll(async () => {
	spend = await spendFixture('V3')
	refSpend = await refScriptSpendFixture()
})

describe('resolveContext — fail-closed offline resolution', () => {
	// The fund input (fundTxHash#0) is offered to coin selection but not picked — the
	// script input alone covers the output — so it is not a ref the tx needs.
	it.each([
		{ kind: 'input', txHash: scriptTxHash, index: 1, fixture: () => spend },
		{ kind: 'collateral', txHash: collateralTxHash, index: 0, fixture: () => spend },
		{ kind: 'reference', txHash: refScriptTxHash, index: 0, fixture: () => refSpend }
	])('throws MISSING_UTXO naming the unresolved $kind', ({ kind, txHash, index, fixture }) => {
		const { txHex, utxos } = fixture()
		const without = utxos.filter(u => !(u.input.txHash === txHash && u.input.outputIndex === index))
		expect(() => resolveContext(txHex, without)).toThrow(
			expect.objectContaining({
				code: 'MISSING_UTXO',
				message: expect.stringMatching(new RegExp(`Cannot resolve ${kind} UTxO ${txHash}#${index} offline`)),
				details: { phase: 'resolve', utxo: { txHash, index } }
			})
		)
	})

	it('does not require a supplied UTxO the tx does not reference', () => {
		const withoutFund = spend.utxos.filter(u => u.input.txHash !== fundTxHash)
		expect(keys(resolveContext(spend.txHex, withoutFund).utxos)).toEqual(keys(withoutFund))
	})

	it('resolves from additionalUtxos and returns exactly the supplied UTxOs', () => {
		expect(keys(resolveContext(spend.txHex, spend.utxos).utxos)).toEqual(keys(spend.utxos))
	})

	it('resolves from a context source', () => {
		expect(keys(resolveContext(spend.txHex, [], [], fromUtxos(spend.utxos)).utxos)).toEqual(keys(spend.utxos))
	})

	it('lets additionalUtxos override a source entry with the same reference', () => {
		const stale = spend.utxos.map(u => ({ ...u, output: { ...u.output, amount: [{ unit: 'lovelace', quantity: '1' }] } }))
		const resolved = resolveContext(spend.txHex, spend.utxos, [], fromUtxos(stale)).utxos
		expect(resolved.map(u => u.output.amount[0].quantity).sort()).toEqual(['10000000', '5000000', '5000000'])
	})

	it('accepts an input covered by the outputs of a chained transaction', async () => {
		// spend's change output is <txId>#1; a tx spending it must resolve through additionalTxs.
		const chainedHash = Resolver.resolveTxHash(spend.txHex)
		const builder = new TxBuilder({ isHydra: true })
		const child = await builder
			.txIn(chainedHash, 1, [{ unit: 'lovelace', quantity: '3000000' }], spend.utxos[0].output.address)
			.txOut(spend.utxos[0].output.address, [{ unit: 'lovelace', quantity: '1000000' }])
			.changeAddress(spend.utxos[0].output.address)
			.complete()
		const childHex = child.to_hex()
		child.free()
		builder.dispose()

		expect(() => resolveContext(childHex)).toThrow(/Cannot resolve input UTxO/)
		expect(resolveContext(childHex, [], [spend.txHex])).toEqual({ utxos: [], additionalTxs: [spend.txHex] })
	})

	it('throws DECODE_FAILURE on non-transaction hex', () => {
		expect(() => resolveContext('00')).toThrow(
			expect.objectContaining({
				code: 'DECODE_FAILURE',
				message: expect.stringMatching(/Failed to decode transaction CBOR/),
				details: expect.objectContaining({ phase: 'decode' })
			})
		)
	})

	it('throws DECODE_FAILURE on a malformed additionalTxs entry', () => {
		expect(() => resolveContext(spend.txHex, spend.utxos, ['00'])).toThrow(
			expect.objectContaining({ code: 'DECODE_FAILURE', message: expect.stringMatching(/additionalTxs entry/) })
		)
	})
})
