import type { UTxO } from '@hydra-sdk/core'
import type { EngineUtxo } from './types'

/**
 * Map a `@hydra-sdk/core` UTxO into the JSON shape the execution engine reads.
 *
 * This is the GATE the plan flags: the spike used `JSON.stringify(meshUtxo)`,
 * but the Hydra SDK UTxO is NOT that shape. Here `output.inlineDatum` /
 * `output.datum` are live `CardanoWASM.PlutusData` objects (not hex), `scriptRef`
 * is `{ scriptCbor, version }` (not a hex string), and `amount` is `Asset[]`.
 * Feeding the raw object to the engine yields garbage: the engine silently treats
 * a mis-named datum field as "no datum" and returns a WRONG budget instead of an
 * error. So the field names below must match the engine exactly — verified by
 * `scripts/probe-encode.cjs` against a known-good fixture.
 *
 * This function does NOT free the caller's `PlutusData` objects — the UTxO owns
 * them. It allocates no WASM objects of its own (only reads `.to_hex()`).
 */
export const toEngineUtxo = (utxo: UTxO): EngineUtxo => {
	const { input, output } = utxo

	const engineOutput: EngineUtxo['output'] = {
		address: output.address,
		amount: output.amount.map(asset => ({ unit: asset.unit, quantity: String(asset.quantity) }))
	}

	// Inline datum (Plutus V2/V3 common case) → plutusData hex.
	if (output.inlineDatum) {
		engineOutput.plutusData = output.inlineDatum.to_hex()
	} else if (output.datum) {
		// Datum provided by value for a hash-locked output.
		engineOutput.plutusData = output.datum.to_hex()
	}

	// Datum hash (hash-only outputs) → dataHash.
	if (output.datumHash) {
		engineOutput.dataHash = output.datumHash
	}

	// Reference script → CBOR hex.
	if (output.scriptRef?.scriptCbor) {
		engineOutput.scriptRef = output.scriptRef.scriptCbor
	}
	if (output.scriptHash) {
		engineOutput.scriptHash = output.scriptHash
	}

	return {
		input: { txHash: input.txHash, outputIndex: input.outputIndex },
		output: engineOutput
	}
}

/** Map many UTxOs. */
export const toEngineUtxos = (utxos: UTxO[]): EngineUtxo[] => utxos.map(toEngineUtxo)
