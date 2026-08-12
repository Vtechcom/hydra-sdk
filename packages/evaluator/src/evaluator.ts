import {
	DEFAULT_PROTOCOL_PARAMETERS,
	DEFAULT_V1_COST_MODEL_LIST,
	DEFAULT_V2_COST_MODEL_LIST,
	DEFAULT_V3_COST_MODEL_LIST,
	FeeUtils,
	SLOT_CONFIG_NETWORK,
	type FeeBreakdown,
	type Protocol,
	type SlotConfig,
	type UTxO
} from '@hydra-sdk/core'
import { resolveContext } from './context/resolver'
import { fingerprintContext } from './context/fingerprint'
import { toEngineUtxos } from './engine/encode'
import { loadWhiskyEngine } from './engine/whisky'
import type { EvaluationEngine } from './engine/types'
import type {
	DetailedEvalAction,
	DetailedEvalResult,
	EvalAction,
	EvaluatorContext,
	EvaluatorContextSource,
	EvaluatorOptions,
	IEvaluator
} from './types'

/** Tags the TxBuilder currently remaps back onto redeemers. */
const MAPPED_TAGS = new Set(['SPEND', 'MINT'])

/**
 * Offline, transaction-level Plutus evaluator implementing `IEvaluator`.
 *
 * Drop-in for `new TxBuilder({ evaluator })`: `complete()` calls `evaluateTx` to
 * get real exUnits and reprice the fee — no provider, API key, or network I/O.
 * Everything the evaluation needs (UTxOs, cost models, slot config) is local and
 * explicit; missing context is a typed {@link EvaluatorError}, never a fetch or a
 * zero budget.
 */
export class OfflineEvaluator implements IEvaluator {
	private readonly engine: EvaluationEngine
	private readonly context: EvaluatorContext
	private readonly source?: EvaluatorContextSource
	private readonly autoDispose: boolean
	private readonly params: Partial<Protocol>

	constructor(engine: EvaluationEngine, options: EvaluatorOptions = {}) {
		this.engine = engine
		this.source = options.source
		this.autoDispose = options.autoDispose ?? true
		this.params = options.params ?? DEFAULT_PROTOCOL_PARAMETERS
		this.context = {
			costModels: {
				plutusV1: options.context?.costModels?.plutusV1 ?? DEFAULT_V1_COST_MODEL_LIST,
				plutusV2: options.context?.costModels?.plutusV2 ?? DEFAULT_V2_COST_MODEL_LIST,
				plutusV3: options.context?.costModels?.plutusV3 ?? DEFAULT_V3_COST_MODEL_LIST
			},
			slotConfig: options.context?.slotConfig ?? (SLOT_CONFIG_NETWORK.PREPROD as SlotConfig)
		}
	}

	/** Mesh-compatible `IEvaluator` method: real exUnits per redeemer. */
	async evaluateTx(txHex: string, additionalUtxos?: UTxO[], additionalTxs?: string[]): Promise<EvalAction[]> {
		const { actions } = this.run(txHex, additionalUtxos, additionalTxs)
		return actions.map(({ tag, index, budget }) => ({ tag, index, budget }))
	}

	/** Same evaluation with diagnostics, a context fingerprint, and unmapped-tag flags. */
	async evaluateTxDetailed(
		txHex: string,
		additionalUtxos?: UTxO[],
		additionalTxs?: string[]
	): Promise<DetailedEvalResult> {
		const { actions } = this.run(txHex, additionalUtxos, additionalTxs)
		return {
			actions,
			contextFingerprint: fingerprintContext(this.context, { name: this.engine.name, version: this.engine.version }),
			engine: { name: this.engine.name, version: this.engine.version },
			phase: 'map'
		}
	}

	/**
	 * Evaluate the transaction and price its full fee (size + script +
	 * reference-script) WITHOUT a TxBuilder rebuild or coin selection.
	 *
	 * Returns a safe estimate (`>=` the fee CSL's build converges on, typically
	 * within ~0.1%) — the number, not a rebalanced transaction. Uses the
	 * evaluator's resolved context to count signers and size reference scripts.
	 */
	async calculateFee(
		txHex: string,
		additionalUtxos?: UTxO[],
		additionalTxs?: string[],
		options?: { feeMultiplier?: number; safetyMarginLovelace?: number; extraSigners?: number }
	): Promise<FeeBreakdown> {
		const { actions, resolvedUtxos } = this.run(txHex, additionalUtxos, additionalTxs)
		return FeeUtils.calculateTxFee(txHex, {
			exUnits: actions.map(a => a.budget),
			resolvedUtxos,
			params: this.params,
			feeMultiplier: options?.feeMultiplier,
			safetyMarginLovelace: options?.safetyMarginLovelace,
			extraSigners: options?.extraSigners
		})
	}

	/** Free any WASM resources held by the engine. */
	dispose(): void {
		this.engine.dispose?.()
	}

	private run(
		txHex: string,
		additionalUtxos?: UTxO[],
		additionalTxs?: string[]
	): { actions: DetailedEvalAction[]; resolvedUtxos: UTxO[] } {
		const resolved = resolveContext(txHex, additionalUtxos ?? [], additionalTxs ?? [], this.source)

		const engineResults = this.engine.evaluate({
			txHex,
			utxos: toEngineUtxos(resolved.utxos),
			additionalTxs: resolved.additionalTxs,
			costModels: this.context.costModels,
			slotConfig: {
				zeroTime: this.context.slotConfig.zeroTime,
				zeroSlot: this.context.slotConfig.zeroSlot,
				slotLength: this.context.slotConfig.slotLength
			}
		})

		if (this.autoDispose) this.engine.dispose?.()

		const actions: DetailedEvalAction[] = engineResults.map(result => ({
			tag: result.tag,
			index: result.index,
			budget: result.budget,
			logs: result.logs,
			// CERT/REWARD/VOTE/PROPOSE are evaluated but the TxBuilder does not remap
			// them yet — surfaced, never silently dropped.
			unmapped: MAPPED_TAGS.has(result.tag) ? undefined : true
		}))
		return { actions, resolvedUtxos: resolved.utxos }
	}
}

/**
 * Create an offline evaluator. Loads the default `whisky-evaluator` engine
 * lazily (async — hence the Promise) unless a custom `engine` is supplied.
 *
 * @throws EvaluatorError('ENGINE_NOT_INSTALLED') if the optional
 *   `whisky-evaluator` peer dependency is missing and no engine is supplied.
 */
export const createEvaluator = async (options: EvaluatorOptions = {}): Promise<OfflineEvaluator> => {
	const engine = options.engine ?? (await loadWhiskyEngine())
	return new OfflineEvaluator(engine, options)
}
