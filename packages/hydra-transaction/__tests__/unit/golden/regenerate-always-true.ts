/**
 * Prints the golden values asserted by always-true.test.ts, computed with CSL
 * through the current TxBuilder sources (not dist).
 *
 *   pnpm exec tsx --tsconfig packages/hydra-transaction/__tests__/unit/golden/tsconfig.json \
 *     packages/hydra-transaction/__tests__/unit/golden/regenerate-always-true.ts
 *
 * Only paste the output into the test after explaining in the commit why the
 * values moved (cost models, protocol parameters, builder change, ...).
 */
import { Deserializer } from '@hydra-sdk/core'
import { buildLockTx, buildUnlockTx, DatumMode } from './always-true.fixture'

const txIdOf = (cborHex: string) => {
	const fixed = Deserializer.deserializeTx(cborHex)
	const id = fixed.transaction_hash().to_hex()
	fixed.free()
	return id
}

const main = async () => {
	const modes: DatumMode[] = ['inline', 'hash']
	for (const mode of modes) {
		const lock = await buildLockTx(mode)
		console.log(`lock/${mode}`, { cbor: lock.to_hex(), txId: txIdOf(lock.to_hex()), fee: lock.body().fee().to_str() })
		lock.free()

		const unlock = await buildUnlockTx(mode)
		console.log(`unlock/${mode}`, {
			txId: txIdOf(unlock.to_hex()),
			fee: unlock.body().fee().to_str(),
			scriptDataHash: unlock.body().script_data_hash()?.to_hex()
		})
		unlock.free()
	}
}

main()
