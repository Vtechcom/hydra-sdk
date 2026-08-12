/**
 * Error taxonomy for the offline evaluator.
 *
 * The evaluator is a strict, fail-closed contract: any missing context, engine
 * failure, or script failure surfaces as a typed {@link EvaluatorError} — the
 * evaluator never fetches over the network, never returns placeholder/zero
 * budgets, and never silently drops a redeemer.
 */
export type EvaluatorErrorCode =
	/** The optional `whisky-evaluator` peer dependency is not installed. */
	| 'ENGINE_NOT_INSTALLED'
	/** A transaction input could not be resolved from the supplied context. */
	| 'MISSING_UTXO'
	/** A required Plutus cost model (V1/V2/V3) was not provided. */
	| 'MISSING_COST_MODEL'
	/** The transaction references a Plutus language version the engine cannot run. */
	| 'UNSUPPORTED_LANGUAGE'
	/** The transaction CBOR (or a resolved UTxO) failed to decode. */
	| 'DECODE_FAILURE'
	/** A script executed but failed validation (returned false / errored). */
	| 'SCRIPT_FAILURE'
	/** The engine itself failed for a reason other than a script failure. */
	| 'ENGINE_FAILURE'

export interface EvaluatorErrorDetails {
	/** Redeemer pointer or UTxO reference this error is about, when applicable. */
	pointer?: { tag?: string; index?: number }
	/** Missing/unresolved UTxO reference, when applicable. */
	utxo?: { txHash: string; index: number }
	/** Plutus language version involved, when applicable. */
	languageVersion?: string
	/** Which phase of evaluation the failure occurred in. */
	phase?: EvaluationPhase
	/** Engine trace logs, when the engine provided any. */
	logs?: string[]
	/** The underlying error, when this wraps another throw. */
	cause?: unknown
}

export type EvaluationPhase = 'decode' | 'resolve' | 'execute' | 'map'

/** A typed failure from the offline evaluator. */
export class EvaluatorError extends Error {
	readonly code: EvaluatorErrorCode
	readonly details: EvaluatorErrorDetails

	constructor(code: EvaluatorErrorCode, message: string, details: EvaluatorErrorDetails = {}) {
		super(message)
		this.name = 'EvaluatorError'
		this.code = code
		this.details = details
		// Preserve the original stack when wrapping another error.
		if (details.cause instanceof Error && details.cause.stack) {
			this.stack = `${this.stack}\nCaused by: ${details.cause.stack}`
		}
	}
}

export const isEvaluatorError = (value: unknown): value is EvaluatorError => value instanceof EvaluatorError
