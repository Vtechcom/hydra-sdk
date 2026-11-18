/**
 * Pure helpers for the chain-data provider (Blockfrost or Demeter's Blockfrost-compatible API).
 * Kept free of Vue/Pinia so they can be unit-tested later.
 */

export type ProviderKind = 'blockfrost' | 'demeter'
export type DemeterAuthMode = 'subdomain' | 'header'
export type ProviderNetwork = 'mainnet' | 'preprod' | 'preview'

export type ProviderConfig = {
	kind: ProviderKind
	apiKey: string
	/** Resolved base URL — always set. */
	apiEndpoint: string
	demeterAuthMode?: DemeterAuthMode
}

export const PROVIDER_NETWORKS: readonly ProviderNetwork[] = ['mainnet', 'preprod', 'preview']

export const DEMETER_CONSOLE_URL = 'https://console.demeter.run'

export const defaultBlockfrostEndpoint = (network: ProviderNetwork) => `https://cardano-${network}.blockfrost.io/api/v0`

/**
 * Demeter's Blockfrost port (https://demeter.run/docs/blockfrost). Paths start at the root — there is no
 * `/api/v0` prefix. In subdomain mode the key is the first host label; in header mode it goes in `dmtr-api-key`.
 */
export const resolveDemeterEndpoint = (network: ProviderNetwork, mode: DemeterAuthMode, apiKey: string) => {
	const host = `cardano-${network}.blockfrost-m1.dmtr.host`
	if (mode === 'header') return `https://${host}`
	return `https://${apiKey.trim() || '{key}'}.${host}`
}

/** Auth headers a request to this provider needs (beyond the ones `BlockfrostProvider` already sends). */
export const providerAuthHeaders = (config: ProviderConfig): Record<string, string> => {
	if (config.kind === 'blockfrost') return { project_id: config.apiKey }
	if (config.demeterAuthMode === 'header') return { 'dmtr-api-key': config.apiKey }
	return {}
}

/** localStorage key used by "Remember on this device". */
export const rememberedConfigKey = (kind: ProviderKind, network: ProviderNetwork) => `providerConfig:${kind}:${network}`

/** Best-effort guess of which network a Blockfrost key belongs to (keys are prefixed with it). */
export const networkFromBlockfrostKey = (apiKey: string): ProviderNetwork | undefined =>
	PROVIDER_NETWORKS.find(network => apiKey.startsWith(network))

export const isProviderConfig = (value: unknown): value is ProviderConfig => {
	if (!value || typeof value !== 'object') return false
	const v = value as Record<string, unknown>
	return (
		(v.kind === 'blockfrost' || v.kind === 'demeter') &&
		typeof v.apiKey === 'string' &&
		!!v.apiKey &&
		typeof v.apiEndpoint === 'string' &&
		!!v.apiEndpoint
	)
}
