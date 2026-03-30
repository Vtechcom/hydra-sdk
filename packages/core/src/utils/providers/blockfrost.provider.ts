import axios, { AxiosInstance } from 'axios'
import { UTxO } from '../../types/cardano'
import { IFetcher } from '../../types/wallet/fetcher'
import { ISubmitter } from '../../types/wallet/submitter'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { toBytes } from './../parser'
import { BaseWalletProvider } from './base'

type BlockfrostSupportedNetworks = 'mainnet' | 'preprod' | 'preview'

export interface BlockfrostProviderConfig {
	/**
	 * Blockfrost Project ID
	 * @description Your Blockfrost Project ID. You can find it in your Blockfrost dashboard.
	 * @see https://blockfrost.io/
	 * @example 'preprod...maJk'
	 */
	apiKey: string
	network: BlockfrostSupportedNetworks
	/**
	 * Blockfrost API version (default is 0)
	 * @default 0
	 * @description Blockfrost API version to use (0 or 1). Check https://docs.blockfrost.io/ for more details.
	 */
	apiVersion?: number
	/**
	 * Override the base URL for the Blockfrost API.
	 * @description When provided, this URL is used instead of the default Blockfrost endpoint.
	 * Useful for providers that expose a Blockfrost-compatible API (e.g. Demeter).
	 */
	baseURL?: string

	/**
	 * Caching options
	 * @description Options for caching responses to reduce the number of API calls.
	 * @default { enabled: false, maxSize: 100, ttl: 300000 } (5 minutes)
	 */
	cachingOptions?: {
		enabled?: boolean
		maxSize?: number // Maximum number of items in the cache
		ttl?: number // Time to live in milliseconds
	}
}

type UtxoResponse = {
	address: string
	tx_hash: string
	tx_index: number
	output_index: number
	amount: { unit: string; quantity: string }[]
	block: string
	data_hash: null | string
	inline_datum: null | string
	reference_script_hash: null | string
}[]

export class BlockfrostProvider extends BaseWalletProvider {
	public fetcher: IFetcher
	public submitter: ISubmitter

	private readonly _axiosInstance: AxiosInstance
	private readonly _network: BlockfrostSupportedNetworks
	private readonly _projectId: string
	private readonly _cachingOptions = { enabled: false, maxSize: 100, ttl: 5 * 60 * 1000 } // Default caching options

	constructor(config: BlockfrostProviderConfig) {
		super()

		this._network = config.network
		this._projectId = config.apiKey
		if (config.apiKey === '') {
			throw new Error('Blockfrost API key is required')
		}

		this._cachingOptions = { ...this._cachingOptions, ...config.cachingOptions }

		this._axiosInstance = axios.create({
			baseURL: config.baseURL ?? `https://cardano-${this._network}.blockfrost.io/api/v${config.apiVersion ?? 0}`,
			headers: {
				project_id: this._projectId
			},
			timeout: 10000
		})

		this.fetcher = this.buildFetcher()
		this.submitter = this.buildSubmitter()
	}

	private buildFetcher(): IFetcher {
		const fetchAddressUTxOs = async (address: string, asset?: string): Promise<UTxO[]> => {
			try {
				const url = `/addresses/${address}/utxos${asset ? `/${asset}` : ''}`

				const queryUTxOs = async (page: number): Promise<UTxO[]> => {
					const { data, status, statusText } = await this._axiosInstance.get<UtxoResponse>(url, {
						params: {
							page,
							count: 100,
							order: 'asc'
						}
					})
					if (!data || status !== 200) {
						if (status === 404) {
							// Address not found, return empty array
							return []
						}
						throw new Error(`Failed to fetch UTxOs for address ${address}: ${statusText}`)
					} else if (!data || data.length === 0) {
						return []
					} else if (data && data.length === 100) {
						// If we received the maximum number of UTxOs, there might be more pages
						const nextPageUTxOs = await queryUTxOs(page + 1)
						return this.toUTxO(data).concat(nextPageUTxOs)
					} else {
						return this.toUTxO(data)
					}
				}

				const data = await queryUTxOs(1)
				return data
			} catch (error) {
				return []
			}
		}

		return {
			fetchAddressUTxOs
		}
	}

	private buildSubmitter(): ISubmitter {
		const submitTx = async (txHex: string): Promise<string> => {
			try {
				const headers = { 'Content-Type': 'application/cbor' }
				const { data, status } = await this._axiosInstance.post('tx/submit', toBytes(txHex), { headers })

				if (status === 200 || status == 202) {
					return data
				}
				throw new Error(`Failed to submit transaction: ${status}`)
			} catch (error) {
				console.error('Error submitting transaction:', error)
				throw new Error('Failed to submit transaction')
			}
		}

		return {
			submitTx
		}
	}

	private toUTxO(response: UtxoResponse): UTxO[] {
		return response.map(utxo => ({
			input: {
				txHash: utxo.tx_hash,
				outputIndex: utxo.output_index
			},
			output: {
				address: utxo.address,
				amount: utxo.amount.map(amt => ({
					unit: amt.unit,
					quantity: String(amt.quantity)
				})),
				datumHash: utxo.data_hash || undefined,
				inlineDatum: utxo.inline_datum
					? CardanoWASM.PlutusData.from_bytes(Buffer.from(utxo.inline_datum, 'hex'))
					: undefined,
				scriptHash: utxo.reference_script_hash || undefined
			}
		}))
	}
}
