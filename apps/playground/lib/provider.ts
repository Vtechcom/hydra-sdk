/**
 * Pure helpers for the chain-data provider (Blockfrost or Demeter's Blockfrost-compatible API).
 * Kept free of Vue/Pinia so they can be unit-tested later.
 */

export type ProviderKind = 'blockfrost' | 'demeter'
export type ProviderNetwork = 'mainnet' | 'preprod' | 'preview'

export type ProviderConfig = {
	kind: ProviderKind
	apiKey: string
	/** Resolved base URL — always set. */
	apiEndpoint: string
}

export const PROVIDER_NETWORKS: readonly ProviderNetwork[] = ['mainnet', 'preprod', 'preview']

export const DEMETER_CONSOLE_URL = 'https://console.demeter.run'

export const defaultBlockfrostEndpoint = (network: ProviderNetwork) => `https://cardano-${network}.blockfrost.io/api/v0`

/**
 * Demeter's Blockfrost port (https://demeter.run/docs/blockfrost). Paths start at the root — there is no
 * `/api/v0` prefix. The key is the first host label.
 *
 * Demeter also accepts the key in a `dmtr-api-key` header, but a browser cannot use that: the CORS preflight
 * never carries custom headers, so the gateway answers it with 401 and the request is blocked.
 */
export const resolveDemeterEndpoint = (network: ProviderNetwork, apiKey: string) =>
	`https://${apiKey.trim() || '{key}'}.cardano-${network}.blockfrost-m1.dmtr.host`

/**
 * Auth headers a request to this provider needs. Demeter needs none (the key is in the host) and must get none:
 * its CORS preflight allows only `Content-Type` and `Accept`, so any extra header — `project_id` included —
 * gets the request blocked by the browser.
 */
export const providerAuthHeaders = (config: ProviderConfig): Record<string, string> =>
	config.kind === 'blockfrost' ? { project_id: config.apiKey } : {}

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
		!!v.apiEndpoint &&
		// A Demeter config saved by the dropped header mode has no key in its host and would only get 401s.
		(v.kind !== 'demeter' || v.apiEndpoint.includes(`//${v.apiKey}.`))
	)
}
