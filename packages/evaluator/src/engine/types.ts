import type { EvalAction } from '../types'

/**
 * A UTxO serialized into the JSON shape the execution engine consumes. The
 * field names here mirror what `whisky-evaluator` (and MeshJS) expect, which is
 * NOT the `@hydra-sdk/core` UTxO shape — see `engine/encode.ts` for the mapping.
 */
export interface EngineUtxo {
	input: { txHash: string; outputIndex: number }
	output: {
		address: string
		amount: { unit: string; quantity: string }[]
		/** Datum hash (hash-only outputs). */
		dataHash?: string
		/** Inline datum, CBOR hex. */
		plutusData?: string
		/** Reference script, CBOR hex (double-encoded as the engine expects). */
		scriptRef?: string
		/** Reference script hash. */
		scriptHash?: string
	}
}

/** Everything an engine needs to evaluate a transaction's scripts. */
export interface EngineInput {
	/** Transaction, CBOR hex. */
	txHex: string
	/** Resolved UTxOs referenced by the transaction. */
	utxos: EngineUtxo[]
	/** Chained transactions whose outputs feed this one, CBOR hex. */
	additionalTxs: string[]
	/** Cost model integer lists per language (only provided languages are set). */
	costModels: { plutusV1?: number[]; plutusV2?: number[]; plutusV3?: number[] }
	/** Slot/time mapping. */
	slotConfig: { zeroTime: number; zeroSlot: number; slotLength: number }
}

/** One evaluated redeemer plus any engine-level diagnostics. */
export interface EngineResult extends EvalAction {
	logs?: string[]
}

/**
 * The narrow, engine-agnostic execution boundary. This is the seam that lets
 * the execution backend (whisky today, a rebuilt Rust adapter later) be
 * swapped without touching `IEvaluator` or the context resolver.
 */
export interface EvaluationEngine {
	readonly name: string
	/** Engine package version, for the context fingerprint and diagnostics. */
	readonly version: string
	/** Run every Plutus redeemer in the transaction; throws `EvaluatorError` on failure. */
	evaluate(input: EngineInput): EngineResult[]
	/** Free any native/WASM resources the engine holds. */
	dispose?(): void
}
