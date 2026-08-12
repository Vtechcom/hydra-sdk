import type { EvaluatorContext } from '../types'

/**
 * Deterministic fingerprint of the evaluation context: cost models + slot config
 * + engine identity. Two evaluations of the same transaction with the same
 * fingerprint are guaranteed to produce the same budgets — this is what backs
 * the "deterministic offline evaluation with pinned context" claim. It is an
 * identity/cache key, not a security hash, so a fast non-cryptographic digest
 * (FNV-1a, browser-safe, no dependency) is sufficient.
 */
export const fingerprintContext = (context: EvaluatorContext, engine: { name: string; version: string }): string => {
	const canonical = JSON.stringify({
		costModels: {
			plutusV1: context.costModels.plutusV1 ?? null,
			plutusV2: context.costModels.plutusV2 ?? null,
			plutusV3: context.costModels.plutusV3 ?? null
		},
		slotConfig: {
			zeroTime: context.slotConfig.zeroTime,
			zeroSlot: context.slotConfig.zeroSlot,
			slotLength: context.slotConfig.slotLength
		},
		engine: { name: engine.name, version: engine.version }
	})
	return `fp1-${fnv1a(canonical)}`
}

/** 32-bit FNV-1a hash, rendered as 8 hex chars. */
const fnv1a = (input: string): string => {
	let hash = 0x811c9dc5
	for (let i = 0; i < input.length; i++) {
		hash ^= input.charCodeAt(i)
		// hash *= 16777619, kept in 32-bit range without BigInt.
		hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0
	}
	return hash.toString(16).padStart(8, '0')
}
