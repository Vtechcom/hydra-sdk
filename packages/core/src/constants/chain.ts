const ALL_NETWORKS = ['MAINNET', 'PREPROD', 'PREVIEW'] as const

export type Network = (typeof ALL_NETWORKS)[number]

/**
 * These mirror `CardanoWASM.NetworkInfo.*` but are written out as literals on
 * purpose: reading them off the WASM module would run WASM code while this
 * module is still evaluating. Bundlers instantiate the WASM asynchronously, so
 * anything that merely *imports* `@hydra-sdk/core` would race that instantiation
 * and crash with `Cannot read properties of undefined (reading
 * 'networkinfo_mainnet')`. The values are fixed by the protocol, so there is
 * nothing to look up — `__tests__/unit/constants/chain.test.ts` asserts they
 * stay in sync with the library.
 */
export const NETWORK_ID: Record<Network, number> = {
	MAINNET: 1,
	PREPROD: 0,
	PREVIEW: 0
}
export const NETWORK_MAGIC: Record<Network, number> = {
	MAINNET: 764824073,
	PREPROD: 1,
	PREVIEW: 2
}
