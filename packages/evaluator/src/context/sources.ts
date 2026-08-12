import { Converter, type SlotConfig, type UTxO, type UTxOObject } from '@hydra-sdk/core'
import type { EvaluatorContextSource } from '../types'

/**
 * Context source from an explicit list of resolved UTxOs. The simplest source —
 * use it when you already hold the spent UTxOs in `@hydra-sdk/core` shape.
 */
export const fromUtxos = (utxos: UTxO[]): EvaluatorContextSource => ({
	getUtxos: () => utxos
})

/**
 * Context source from a raw `UTxOObject` (the shape cardano-cli and Hydra
 * snapshots return). Reuses `Converter.convertUTxOObjectToUTxO` — no bespoke
 * parser — so inline datums are rebuilt into `PlutusData` correctly.
 */
export const fromUtxoObject = (utxoObject: UTxOObject): EvaluatorContextSource => {
	const utxos = Converter.convertUTxOObjectToUTxO(utxoObject)
	return { getUtxos: () => utxos }
}

/**
 * Context source for evaluating a transaction against a Hydra head snapshot.
 *
 * Takes a plain `UTxOObject` (e.g. `bridge.snapshotUTxOObject`), NOT a
 * `HydraBridge` instance — this keeps `@hydra-sdk/evaluator` off the
 * `@hydra-sdk/bridge` dependency chain while still serving the killer use case:
 * inside a head there is no provider to evaluate scripts against.
 *
 * This is the source; the caller passes any in-head `slotConfig` (derived from
 * `bridge.slotZeroTimestamp` via `buildHydraSlotConfig`) through
 * `EvaluatorOptions.context.slotConfig` so validity ranges map to the right time.
 */
export const fromHydraSnapshot = (
	snapshotUtxo: UTxOObject,
	_opts?: { slotConfig?: SlotConfig }
): EvaluatorContextSource => fromUtxoObject(snapshotUtxo)
