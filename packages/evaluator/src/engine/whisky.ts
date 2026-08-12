import { EvaluatorError } from '../errors'
import type { EvalRedeemerTag } from '../types'
import type { EngineInput, EngineResult, EvaluationEngine } from './types'

/**
 * Shape of the `whisky-evaluator` WASM binding used here. Declared locally so
 * this package type-checks even when the optional peer dependency is absent.
 */
interface WhiskyModule {
	js_evaluate_tx_scripts(
		txHex: string,
		utxos: string[],
		additionalTxs: string[],
		costModelsJson: string,
		slotConfigJson: string
	): WhiskyEvalResult
}

interface WhiskyEvalResult {
	get_status(): string
	get_error(): string | null | undefined
	get_data(): string
}

interface WhiskyActionSuccess {
	tag: string
	index: number
	budget: { mem: number; steps: number }
}

interface WhiskyAction {
	success?: WhiskyActionSuccess
	error?: unknown
}

const WHISKY_PACKAGE = 'whisky-evaluator'
// Pinned exactly — see README for the integrity hash. Bump only with a fresh
// differential conformance pass against the Scalus oracle.
const PINNED_VERSION = '0.1.1'

const KNOWN_TAGS: EvalRedeemerTag[] = ['SPEND', 'MINT', 'CERT', 'REWARD', 'VOTE', 'PROPOSE']

const normalizeTag = (tag: string): EvalRedeemerTag => {
	const upper = String(tag).toUpperCase()
	return (KNOWN_TAGS.find(t => t === upper) ?? 'SPEND') as EvalRedeemerTag
}

/**
 * Load the `whisky-evaluator` module.
 *
 * In Node we MUST use the CommonJS build: its wasm-bindgen node glue
 * instantiates the `.wasm` synchronously with a valid `memory` export. The ESM
 * build imports the `.wasm` as a module, which under Node leaves `wasm.memory`
 * undefined and crashes on first use (the same WASM-at-import-time race the SDK
 * documents for cardano-wasm). In the browser there is no `require`, so we fall
 * back to a dynamic import and let the bundler instantiate the wasm.
 */
const loadWhiskyModule = async (): Promise<WhiskyModule> => {
	const nodeRequire = await getNodeRequire()
	if (nodeRequire) {
		return nodeRequire(WHISKY_PACKAGE) as WhiskyModule
	}
	return (await import(/* @vite-ignore */ WHISKY_PACKAGE)) as unknown as WhiskyModule
}

const getNodeRequire = async (): Promise<NodeRequire | null> => {
	// Built CJS output (and classic Node CJS) expose `require` directly.
	if (typeof require === 'function') return require
	// ESM (vitest source, built .mjs) — derive a require from this module's URL.
	try {
		const { createRequire } = await import('node:module')
		return createRequire(import.meta.url)
	} catch {
		return null
	}
}

/**
 * Lazily load the `whisky-evaluator` peer dependency and wrap it as an
 * {@link EvaluationEngine}. Rejects with a typed `ENGINE_NOT_INSTALLED` error
 * (with install instructions) when the optional peer dependency is absent — a
 * direct consequence of shipping the ~13MB WASM engine as opt-in.
 */
export const loadWhiskyEngine = async (): Promise<EvaluationEngine> => {
	let mod: WhiskyModule
	try {
		mod = await loadWhiskyModule()
	} catch (cause) {
		throw new EvaluatorError(
			'ENGINE_NOT_INSTALLED',
			`The offline evaluator needs the '${WHISKY_PACKAGE}' engine, which is an optional peer dependency. ` +
				`Install it with: npm install ${WHISKY_PACKAGE}@${PINNED_VERSION}`,
			{ cause }
		)
	}

	if (!mod || typeof mod.js_evaluate_tx_scripts !== 'function') {
		throw new EvaluatorError(
			'ENGINE_NOT_INSTALLED',
			`'${WHISKY_PACKAGE}' is installed but does not expose js_evaluate_tx_scripts; expected version ${PINNED_VERSION}.`
		)
	}

	return {
		name: WHISKY_PACKAGE,
		version: PINNED_VERSION,
		evaluate(input: EngineInput): EngineResult[] {
			return runWhisky(mod, input)
		}
	}
}

const runWhisky = (mod: WhiskyModule, input: EngineInput): EngineResult[] => {
	const costModelsJson = JSON.stringify({
		plutus_v1: input.costModels.plutusV1,
		plutus_v2: input.costModels.plutusV2,
		plutus_v3: input.costModels.plutusV3
	})
	const slotConfigJson = JSON.stringify(input.slotConfig)

	let result: WhiskyEvalResult
	try {
		result = mod.js_evaluate_tx_scripts(
			input.txHex,
			input.utxos.map(utxo => JSON.stringify(utxo)),
			input.additionalTxs,
			costModelsJson,
			slotConfigJson
		)
	} catch (cause) {
		throw new EvaluatorError('ENGINE_FAILURE', `whisky-evaluator threw while evaluating: ${String(cause)}`, {
			phase: 'execute',
			cause
		})
	}

	if (result.get_status() !== 'success') {
		throw new EvaluatorError('ENGINE_FAILURE', `whisky-evaluator failed: ${result.get_error() ?? 'unknown error'}`, {
			phase: 'execute'
		})
	}

	let actions: WhiskyAction[]
	try {
		actions = JSON.parse(result.get_data()) as WhiskyAction[]
	} catch (cause) {
		throw new EvaluatorError('ENGINE_FAILURE', 'whisky-evaluator returned data that is not valid JSON', {
			phase: 'map',
			cause
		})
	}

	return actions.map(action => {
		if (action.error || !action.success) {
			// A script executed and failed validation — never coerce to a zero budget.
			throw new EvaluatorError('SCRIPT_FAILURE', `Script evaluation failed: ${JSON.stringify(action.error)}`, {
				phase: 'execute',
				logs: extractLogs(action.error)
			})
		}
		const success = action.success
		return {
			tag: normalizeTag(success.tag),
			index: success.index,
			budget: { mem: success.budget.mem, steps: success.budget.steps }
		}
	})
}

const extractLogs = (error: unknown): string[] | undefined => {
	if (error && typeof error === 'object' && 'logs' in error && Array.isArray((error as { logs?: unknown }).logs)) {
		return (error as { logs: string[] }).logs.slice(0, 20)
	}
	return undefined
}
