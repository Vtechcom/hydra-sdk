import axios, { AxiosInstance } from 'axios'
import { Asset, ScriptRef, UTxO } from '../../types/cardano'
import { IFetcher } from '../../types/wallet/fetcher'
import { ISubmitter } from '../../types/wallet/submitter'
import { BaseWalletProvider } from './base'
import { Serializer } from '../..'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

type OgmiosSupportedNetworks = 'mainnet' | 'preprod' | 'preview'

export interface OgmiosProviderConfig {
	/**
	 * Ogmios network
	 * @description The Cardano network to connect to.
	 * @example 'preprod'
	 */
	network: OgmiosSupportedNetworks
	/**
	 * Ogmios API endpoint
	 * @description The Ogmios API endpoint to connect to.
	 * @example 'https://preprod.ogmios.cardano-rpc.hydrawallet.app'
	 * @default 'http://localhost:1337' (if not provided, will use localhost)
	 */
	apiEndpoint?: string
}

type NativeScriptJSONType = 'signature' | 'any' | 'all' | 'some' | 'before' | 'after'
type NativeScriptJSON =
	| {
			clause: 'signature'
			/**
			 * A Blake2b 28-byte hash digest, encoded in base16.
			 */
			from: string
	  }
	| {
			clause: 'any' | 'all'
			/**
			 * Array of any `Script<Native>`
			 */
			from: any[]
	  }
	| {
			clause: 'some'
			atLeast: number
			/**
			 * Array of any `Script<Native>`
			 */
			from: any[]
	  }
	| {
			clause: 'before' | 'after'
			/**
			 * An absolute slot number.
			 */
			slot: string
	  }

type AddressUtxoResponse = Array<{
	transaction: {
		id: string
	}
	index: number
	address: string
	value: {
		ada: {
			lovelace: number
		}
	} & (
		| {
				[policyId: string]: {
					[assetName: string]: number
				}
		  }
		| {}
	)
	datumHash?: string
	datum?: string
	script?:
		| {
				language: 'plutus:v1' | 'plutus:v2' | 'plutus:v3'
				cbor: string
		  }
		| {
				language: 'native'
				json: NativeScriptJSON
				cbor?: string
		  }
}>

export class OgmiosProvider extends BaseWalletProvider {
	public fetcher: IFetcher
	public submitter: ISubmitter

	private _axiosInstance: AxiosInstance

	constructor(config: OgmiosProviderConfig) {
		super()
		// Implementation for OgmiosProvider
		this.fetcher = this.buildFetcher()
		this.submitter = this.buildSubmitter()

		this._axiosInstance = axios.create({
			baseURL: config.apiEndpoint || 'http://localhost:1337',
			headers: {
				'Content-Type': 'application/json'
			}
		})
		// Set up interceptors if needed
		this._axiosInstance.interceptors.request.use(request => {
			return request
		})
		this._axiosInstance.interceptors.response.use(response => {
			return response
		})
	}

	private buildFetcher(): IFetcher {
		// Implementation for fetcher
		const fetchAddressUTxOs = async (address: string, asset?: string): Promise<UTxO[]> => {
			try {
				const response = await this.rpcRequest<{ result: AddressUtxoResponse }>('queryLedgerState/utxo', {
					addresses: [address]
				})
				return this.toUTxO(response.result).filter(u => (asset ? u.output.amount.some(a => a.unit === asset) : true))
			} catch (error) {
				console.error('Error fetching UTxOs:', error)
				return []
			}
		}
		return {
			fetchAddressUTxOs
		}
	}

	private buildSubmitter(): ISubmitter {
		// Implementation for submitter
		const submitTx = async (tx: string): Promise<string> => {
			try {
				const response = await this.rpcRequest<{ result: { transaction: { id: string } } }>('submitTransaction', {
					transaction: {
						cbor: tx
					}
				})
				if (!response?.result?.transaction?.id) {
					throw new Error('No transaction ID returned from submitTransaction')
				}
				return response.result.transaction.id
			} catch (error: any) {
				throw error
			}
		}
		return {
			submitTx
		}
	}

	private async rpcRequest<T = any>(method: string, params: Record<string, any>, options?: { id?: number }): Promise<T> {
		try {
			const response = await this._axiosInstance.post(
				'/',
				JSON.stringify({
					jsonrpc: '2.0',
					method,
					params,
					id: options?.id || 1
				})
			)
			return response.data as T
		} catch (error: any) {
			console.error('RPC error:', JSON.stringify(error?.response?.data, null, 2))
			throw error?.response?.data
		}
	}

	private toUTxO(response: AddressUtxoResponse): UTxO[] {
		const convertAmount = (value: AddressUtxoResponse[number]['value']): Asset[] => {
			const amounts: Asset[] = []

			Object.entries(value).forEach(([policyId, assets]) => {
				if (policyId === 'ada') {
					amounts.push({ unit: 'lovelace', quantity: String((assets as { lovelace: number }).lovelace) })
				} else {
					Object.entries(assets as Record<string, number>).forEach(([assetName, quantity]) => {
						const unit = Serializer.serializeAssetUnit(policyId, assetName)
						amounts.push({ unit, quantity: String(quantity) })
					})
				}
			})

			return amounts
		}

		const convertScript = (script: AddressUtxoResponse[number]['script']): ScriptRef | null => {
			if (!script) return null
			if (script.language === 'native') {
				// For native scripts, we may not have CBOR, so we return null or handle differently
				// TODO: Update this with CardanoWASM.NativeScript conversion if needed
				return null
			} else if (script.language.startsWith('plutus:')) {
				// For Plutus scripts, we have CBOR
				// TODO: Update this with CardanoWASM.PlutusScript conversion if needed
				return {
					version: script.language.split(':')[1].toUpperCase() as 'V1' | 'V2' | 'V3',
					scriptCbor: script.cbor
				}
			}
			return null
		}

		return response.map(utxo => ({
			input: {
				txHash: utxo.transaction.id,
				outputIndex: utxo.index
			},
			output: {
				address: utxo.address,
				amount: convertAmount(utxo.value),
				datumHash: utxo.datumHash || null,
				inlineDatum: utxo.datum ? CardanoWASM.PlutusData.from_hex(utxo.datum) : null,
				scriptRef: convertScript(utxo.script)
			}
		}))
	}
}
