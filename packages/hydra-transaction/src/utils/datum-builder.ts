import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

// Example function to build a simple datum
/**
 * - Primitive: `int`, `bytes`.
 * - Collections: `list`, `map`.
 * - Structured: `constr`.
 */
export function datumBuilder(): CardanoWASM.PlutusData {
	const fields = CardanoWASM.PlutusList.new()
	// Add fields to the datum as needed
	return CardanoWASM.PlutusData.from_hex('00') // Example: empty constructor
}
