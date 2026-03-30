import { BlockfrostProvider, BlockfrostProviderConfig } from './blockfrost.provider'

type DemeterSupportedNetworks = 'mainnet' | 'preprod' | 'preview'

export interface DemeterProviderConfig {
	/**
	 * Demeter Auth Token
	 * @description Your Demeter auth token. Found in the instance info panel of your Demeter project.
	 * This token is also used as the authenticated subdomain in the endpoint URL.
	 * @example 'blockfrost102lx3ckhzvkjjh7677g'
	 */
	authToken: string
	network: DemeterSupportedNetworks
	/**
	 * Blockfrost API version (default is 0)
	 * @default 0
	 */
	apiVersion?: number
	/**
	 * Caching options
	 * @description Options for caching responses to reduce the number of API calls.
	 * @default { enabled: false, maxSize: 100, ttl: 300000 } (5 minutes)
	 */
	cachingOptions?: BlockfrostProviderConfig['cachingOptions']
}

/**
 * Provider for Demeter's Blockfrost-compatible hosted endpoints.
 *
 * Demeter exposes a Blockfrost-compatible API where authentication is embedded
 * in the subdomain of the endpoint URL.
 *
 * Authenticated Endpoint URL format:
 * `https://{authToken}.cardano-{network}.blockfrost-m1.demeter.run`
 *
 * @example
 * ```ts
 * const provider = new DemeterProvider({
 *   authToken: 'blockfrost102lx3ckhzvkjjh7677g',
 *   network: 'mainnet',
 * })
 * ```
 *
 * @see https://demeter.run
 */
export class DemeterProvider extends BlockfrostProvider {
	constructor(config: DemeterProviderConfig) {
		const baseURL = `https://${config.authToken}.cardano-${config.network}.blockfrost-m1.demeter.run/api/v${config.apiVersion ?? 0}`
		super({
			apiKey: config.authToken,
			network: config.network,
			baseURL,
			cachingOptions: config.cachingOptions
		})
	}
}
