/**
 * `@hydra-sdk/evaluator` — offline, transaction-level Plutus evaluator.
 *
 * Implements `IEvaluator` for `@hydra-sdk/transaction`, so `TxBuilder.complete()`
 * can obtain real exUnits without a provider, API key, or network I/O — including
 * inside a Hydra head, where no provider exists to evaluate scripts.
 *
 * @remarks Experimental (0.x). Product claim: deterministic offline evaluation
 * with pinned context (cost-model hash, era/slot mapping, engine version) — NOT
 * default cardano-node equivalence.
 */
export { OfflineEvaluator, createEvaluator } from './evaluator'
export { fromUtxos, fromUtxoObject, fromHydraSnapshot } from './context/sources'
export { EvaluatorError, isEvaluatorError } from './errors'
export { loadWhiskyEngine } from './engine/whisky'

// Fee pricing lives in @hydra-sdk/core (FeeUtils.calculateTxFee); re-exported
// here for convenience so offline flows have a single import.
export { FeeUtils } from '@hydra-sdk/core'
export type { FeeBreakdown, CalculateTxFeeOptions, ExUnitsLike } from '@hydra-sdk/core'

export type { EvaluatorErrorCode, EvaluatorErrorDetails, EvaluationPhase } from './errors'
export type {
	Budget,
	EvalAction,
	EvalRedeemerTag,
	IEvaluator,
	PlutusLanguage,
	EvaluatorContext,
	EvaluatorContextSource,
	EvaluatorOptions,
	DetailedEvalAction,
	DetailedEvalResult
} from './types'
export type { EvaluationEngine, EngineInput, EngineResult, EngineUtxo } from './engine/types'
