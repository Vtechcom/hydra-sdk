import type { Asset } from '@hydra-sdk/core'

/**
 * Rough min-ADA estimate for an output, following the Babbage rule
 * `(160 + |serialized output|) × coinsPerUtxoSize`.
 *
 * The serialized size is approximated from the address and value shape rather
 * than by actually encoding the output — this runs on every keystroke, and
 * building real CSL objects here would mean allocating (and having to free) WASM
 * memory per edit. Treat it as a hint: the authoritative check is the build
 * itself, which fails loudly if an output is under-funded.
 */
export const estimateMinAdaLovelace = (
	output: { address: string; amount: Asset[]; datum?: string; inlineDatum?: string },
	coinsPerUtxoSize: number
): bigint => {
	// A bech32 base address decodes to 57 bytes; enterprise ones are shorter, but
	// over-estimating slightly is the safer direction for a warning.
	let bytes = 2 + 57 + 9

	const assets = output.amount.filter(a => a.unit !== 'lovelace')
	if (assets.length) {
		bytes += 4
		const policies = new Set(assets.map(a => a.unit.slice(0, 56)))
		bytes += policies.size * (28 + 4)
		for (const asset of assets) bytes += Math.ceil(Math.max(0, asset.unit.length - 56) / 2) + 9 + 2
	}

	if (output.datum) bytes += 34
	if (output.inlineDatum) bytes += Math.ceil(output.inlineDatum.length / 2) + 4

	return BigInt(160 + bytes) * BigInt(coinsPerUtxoSize)
}
