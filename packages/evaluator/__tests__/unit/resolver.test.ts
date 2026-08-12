import { describe, it, expect } from 'vitest'
import { TxBuilder } from '@hydra-sdk/transaction'
import { resolveContext } from '../../src/context/resolver'
import { fromUtxos } from '../../src/context/sources'
import { EvaluatorError, isEvaluatorError } from '../../src/errors'
import { resolvedUtxos, stageSpendTx } from '../helpers/spend-tx'

const buildTxHex = async (): Promise<string> => {
	const builder = new TxBuilder({ isHydra: true })
	return (await stageSpendTx(builder).complete()).to_hex()
}

describe('resolveContext — fail-closed offline resolution', () => {
	it('throws MISSING_UTXO before the engine runs when an input is unresolved', async () => {
		const txHex = await buildTxHex()
		try {
			resolveContext(txHex, [], [], undefined)
			throw new Error('expected resolveContext to throw')
		} catch (error) {
			expect(isEvaluatorError(error)).toBe(true)
			expect((error as EvaluatorError).code).toBe('MISSING_UTXO')
			expect((error as EvaluatorError).details.utxo).toBeDefined()
		}
	})

	it('resolves every input from additionalUtxos', async () => {
		const txHex = await buildTxHex()
		const resolved = resolveContext(txHex, resolvedUtxos(), [], undefined)
		expect(resolved.utxos.length).toBeGreaterThanOrEqual(3)
	})

	it('resolves every input from a context source', async () => {
		const txHex = await buildTxHex()
		const resolved = resolveContext(txHex, [], [], fromUtxos(resolvedUtxos()))
		expect(resolved.utxos.length).toBeGreaterThanOrEqual(3)
	})

	it('throws DECODE_FAILURE on non-transaction hex', () => {
		try {
			resolveContext('00', [], [], undefined)
			throw new Error('expected resolveContext to throw')
		} catch (error) {
			expect(isEvaluatorError(error)).toBe(true)
			expect((error as EvaluatorError).code).toBe('DECODE_FAILURE')
		}
	})
})
