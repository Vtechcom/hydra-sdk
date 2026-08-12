import type { Protocol, SlotConfig, UTxO, UTxOObject } from '@hydra-sdk/core'
import type { EvaluationPhase } from './errors'

/**
 * Script execution budget for one redeemer. Structurally identical to
 * `Budget` in `@hydra-sdk/transaction` — kept local so this package does not
 * depend on the transaction package (which would create a dependency cycle,
 * since a TxBuilder consumes an `IEvaluator`).
 */
export interface Budget {
	mem: number
	steps: number
}

/** Redeemer pointer categories a transaction evaluator can report. */
export type EvalRedeemerTag = 'SPEND' | 'MINT' | 'CERT' | 'REWARD' | 'VOTE' | 'PROPOSE'

/** One evaluated redeemer: which script slot it is and its real execution budget. */
export interface EvalAction {
	tag: EvalRedeemerTag
	index: number
	budget: Budget
}

/**
 * The `IEvaluator` contract `@hydra-sdk/transaction`'s `TxBuilder` consumes.
 * Re-declared here (structural match) so `OfflineEvaluator` is a drop-in for
 * `new TxBuilder({ evaluator })` without importing the transaction package.
 */
export interface IEvaluator {
	evaluateTx(txHex: string, additionalUtxos?: UTxO[], additionalTxs?: string[]): Promise<EvalAction[]>
}

/** Plutus language versions the evaluator can run. */
export type PlutusLanguage = 'V1' | 'V2' | 'V3'

/**
 * The fully-resolved ledger context an evaluation runs against. Everything here
 * is explicit and local — nothing is fetched. `OfflineEvaluator` builds this by
 * merging `additionalUtxos`/`additionalTxs` with an optional
 * {@link EvaluatorContextSource}.
 */
export interface EvaluatorContext {
	/** Cost model integer lists per Plutus language. */
	costModels: {
		plutusV1?: number[]
		plutusV2?: number[]
		plutusV3?: number[]
	}
	/** Slot/time mapping used to resolve validity ranges into POSIX time. */
	slotConfig: SlotConfig
}

/**
 * A local, offline source of resolved UTxOs. Used as the last resort by the
 * context resolver, after `additionalUtxos` and `additionalTxs` outputs. It
 * must be synchronous and side-effect free — no network, no filesystem.
 */
export interface EvaluatorContextSource {
	/** Resolve a set of transaction inputs into UTxOs, or return the ones it knows. */
	getUtxos(): UTxO[]
}

/** Options for {@link createEvaluator}. */
export interface EvaluatorOptions {
	/**
	 * Partial context. Missing cost models fall back to the SDK defaults
	 * (`DEFAULT_V*_COST_MODEL_LIST`); a missing slot config falls back to the
	 * network preset or `buildHydraSlotConfig`.
	 */
	context?: Partial<EvaluatorContext>
	/** Extra offline UTxO source consulted after `additionalUtxos`/`additionalTxs`. */
	source?: EvaluatorContextSource
	/**
	 * Engine override. Defaults to the bundled `whisky-evaluator` adapter,
	 * loaded lazily. Supplying a custom engine keeps `IEvaluator` stable while
	 * swapping the execution backend.
	 */
	engine?: import('./engine/types').EvaluationEngine
	/** Free WASM scratch objects eagerly after each evaluation. Default: true. */
	autoDispose?: boolean
	/**
	 * Protocol parameters used by `calculateFee` to price the transaction.
	 * Missing fields fall back to `DEFAULT_PROTOCOL_PARAMETERS`.
	 */
	params?: Partial<Protocol>
}

/** A redeemer result enriched with diagnostics, returned by `evaluateTxDetailed`. */
export interface DetailedEvalAction extends EvalAction {
	/** Hash of the script that ran for this redeemer, when known. */
	scriptHash?: string
	/** Plutus language version of that script, when known. */
	languageVersion?: PlutusLanguage
	/** Engine trace logs for this redeemer, when any. */
	logs?: string[]
	/**
	 * True when the evaluator returned a budget the TxBuilder does not yet remap
	 * (CERT/REWARD/VOTE/PROPOSE). Never silently dropped — surfaced here instead.
	 */
	unmapped?: boolean
}

/** Full result of `evaluateTxDetailed`. */
export interface DetailedEvalResult {
	actions: DetailedEvalAction[]
	/**
	 * Deterministic fingerprint of (cost models + slot config + era + engine
	 * name/version). Two evaluations with the same fingerprint and same tx are
	 * guaranteed to produce the same budgets.
	 */
	contextFingerprint: string
	/** The engine that produced this result. */
	engine: { name: string; version: string }
	/** Phase reached (always 'map' on success; set on the error path). */
	phase: EvaluationPhase
}

export type { Protocol, SlotConfig, UTxO, UTxOObject }
