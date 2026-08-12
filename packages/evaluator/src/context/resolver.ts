import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { Resolver, type UTxO } from '@hydra-sdk/core'
import { EvaluatorError } from '../errors'
import type { EvaluatorContextSource } from '../types'

export interface ResolvedContext {
	/** Every resolved UTxO available to the engine (referenced or not). */
	utxos: UTxO[]
	/** Chained transactions passed straight to the engine, which resolves their outputs. */
	additionalTxs: string[]
}

type RefKind = 'input' | 'collateral' | 'reference'
interface TxRef {
	txHash: string
	index: number
	kind: RefKind
}

const key = (txHash: string, index: number) => `${txHash}#${index}`

/**
 * Resolve the ledger context a transaction needs to evaluate, fail-closed.
 *
 * Resolution order matches MeshJS: `additionalUtxos` → outputs of `additionalTxs`
 * → the optional {@link EvaluatorContextSource}. Any transaction input,
 * collateral, or reference input that none of these cover throws
 * `EvaluatorError('MISSING_UTXO', { utxo })` — BEFORE the engine runs. This is
 * the offline contract: never fetch, never hand the engine a half-resolved
 * context (the spike showed a MINT fixture succeeds against an empty UTxO map,
 * so the engine cannot be trusted to report missing spend context).
 */
export const resolveContext = (
	txHex: string,
	additionalUtxos: UTxO[] = [],
	additionalTxs: string[] = [],
	source?: EvaluatorContextSource
): ResolvedContext => {
	// Build the resolved map: source first, then additionalUtxos override it.
	const map = new Map<string, UTxO>()
	if (source) {
		for (const utxo of source.getUtxos()) map.set(key(utxo.input.txHash, utxo.input.outputIndex), utxo)
	}
	for (const utxo of additionalUtxos) map.set(key(utxo.input.txHash, utxo.input.outputIndex), utxo)

	// Coverage provided by chained transactions (the engine resolves their outputs).
	const chainedCoverage = new Set<string>()
	for (const chained of additionalTxs) {
		const { hash, outputCount } = describeChainedTx(chained)
		for (let i = 0; i < outputCount; i++) chainedCoverage.add(key(hash, i))
	}

	// Fail-closed: every referenced input must be resolvable from the local context.
	const refs = extractRefs(txHex)
	for (const ref of refs) {
		const k = key(ref.txHash, ref.index)
		if (!map.has(k) && !chainedCoverage.has(k)) {
			throw new EvaluatorError(
				'MISSING_UTXO',
				`Cannot resolve ${ref.kind} UTxO ${k} offline. Provide it via additionalUtxos, additionalTxs, or a context source.`,
				{ phase: 'resolve', utxo: { txHash: ref.txHash, index: ref.index } }
			)
		}
	}

	return { utxos: Array.from(map.values()), additionalTxs }
}

/** Decode a transaction's inputs, collateral, and reference inputs. Frees all WASM scratch. */
const extractRefs = (txHex: string): TxRef[] => {
	const scratch: { free(): void }[] = []
	const track = <T extends { free(): void }>(obj: T): T => {
		scratch.push(obj)
		return obj
	}

	let tx: CardanoWASM.Transaction
	try {
		tx = track(CardanoWASM.Transaction.from_hex(txHex))
	} catch (cause) {
		throw new EvaluatorError('DECODE_FAILURE', `Failed to decode transaction CBOR: ${String(cause)}`, {
			phase: 'decode',
			cause
		})
	}

	try {
		const body = track(tx.body())
		const refs: TxRef[] = []
		collectInputs(track(body.inputs()), 'input', refs, track)
		const collateral = body.collateral()
		if (collateral) collectInputs(track(collateral), 'collateral', refs, track)
		const referenceInputs = body.reference_inputs()
		if (referenceInputs) collectInputs(track(referenceInputs), 'reference', refs, track)
		return refs
	} finally {
		for (const obj of scratch.reverse()) {
			try {
				obj.free()
			} catch {
				/* ignore */
			}
		}
	}
}

const collectInputs = (
	inputs: CardanoWASM.TransactionInputs,
	kind: RefKind,
	out: TxRef[],
	track: <T extends { free(): void }>(obj: T) => T
): void => {
	for (let i = 0; i < inputs.len(); i++) {
		const input = track(inputs.get(i))
		const txHash = track(input.transaction_id()).to_hex()
		out.push({ txHash, index: input.index(), kind })
	}
}

/** Hash a chained transaction and count its outputs, for coverage checks. */
const describeChainedTx = (txHex: string): { hash: string; outputCount: number } => {
	let tx: CardanoWASM.Transaction | undefined
	try {
		const hash = Resolver.resolveTxHash(txHex)
		tx = CardanoWASM.Transaction.from_hex(txHex)
		const body = tx.body()
		const outputs = body.outputs()
		const outputCount = outputs.len()
		outputs.free()
		body.free()
		return { hash, outputCount }
	} catch (cause) {
		throw new EvaluatorError('DECODE_FAILURE', `Failed to decode additionalTxs entry: ${String(cause)}`, {
			phase: 'decode',
			cause
		})
	} finally {
		try {
			tx?.free()
		} catch {
			/* ignore */
		}
	}
}
