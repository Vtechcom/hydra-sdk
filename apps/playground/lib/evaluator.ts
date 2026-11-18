import type { EvalAction, EvalRedeemerTag, IEvaluator } from '@hydra-sdk/transaction'
import { providerAuthHeaders, type ProviderConfig } from '~/lib/provider'

/**
 * Minimal `IEvaluator` backed by Blockfrost's `POST /utils/txs/evaluate`.
 *
 * `@hydra-sdk/transaction` 1.2.0 accepts an evaluator so `complete()` can replace
 * the placeholder exUnits with real script budgets and price the fee correctly;
 * the SDK ships no implementation because CSL cannot evaluate Plutus itself.
 *
 * Blockfrost has returned two response shapes over time (Ogmios v5 keyed strings
 * and Ogmios v6 objects), so both are accepted here.
 *
 * Demeter's Blockfrost port serves the same endpoint; its auth goes either in the host (subdomain mode, no
 * header) or in `dmtr-api-key` (header mode) instead of `project_id`.
 */
export const createProviderEvaluator = (config: ProviderConfig): IEvaluator => ({
	async evaluateTx(txHex: string): Promise<EvalAction[]> {
		const endpoint = `${config.apiEndpoint.replace(/\/$/, '')}/utils/txs/evaluate`
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/cbor',
				...providerAuthHeaders(config)
			},
			body: txHex
		})

		const payload = await response.json().catch(() => null)
		if (!response.ok) {
			throw new Error(
				`${config.kind === 'demeter' ? 'Demeter' : 'Blockfrost'} evaluate failed (${response.status}): ${payload?.message ?? response.statusText}`
			)
		}

		const result = payload?.result ?? payload
		if (result?.EvaluationFailure) {
			throw new Error(`Script evaluation failed: ${JSON.stringify(result.EvaluationFailure)}`)
		}

		// Ogmios v6 — an array of { validator: { index, purpose }, budget: { memory, cpu } }
		if (Array.isArray(result)) {
			return result.map(entry => ({
				tag: normalizeTag(entry?.validator?.purpose),
				index: Number(entry?.validator?.index ?? 0),
				budget: {
					mem: Number(entry?.budget?.memory ?? 0),
					steps: Number(entry?.budget?.cpu ?? entry?.budget?.steps ?? 0)
				}
			}))
		}

		// Ogmios v5 — { EvaluationResult: { "spend:0": { memory, steps } } }
		const evaluationResult = result?.EvaluationResult ?? result
		if (evaluationResult && typeof evaluationResult === 'object') {
			return Object.entries(evaluationResult as Record<string, { memory?: number; steps?: number; cpu?: number }>).map(
				([pointer, budget]) => {
					const [purpose, index] = pointer.split(':')
					return {
						tag: normalizeTag(purpose),
						index: Number(index ?? 0),
						budget: { mem: Number(budget?.memory ?? 0), steps: Number(budget?.steps ?? budget?.cpu ?? 0) }
					}
				}
			)
		}

		return []
	}
})

/** @deprecated use `createProviderEvaluator`. */
export const createBlockfrostEvaluator = (config: { apiEndpoint: string; apiKey: string }) =>
	createProviderEvaluator({ kind: 'blockfrost', ...config })

const normalizeTag = (purpose?: string): EvalRedeemerTag => {
	const tag = (purpose ?? 'spend').toUpperCase()
	const known: EvalRedeemerTag[] = ['SPEND', 'MINT', 'CERT', 'REWARD', 'VOTE', 'PROPOSE']
	return (known.find(entry => entry === tag) ?? 'SPEND') as EvalRedeemerTag
}
