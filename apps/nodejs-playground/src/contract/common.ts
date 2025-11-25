import { AppWallet, Converter, NETWORK_ID, UTxO } from '@hydra-sdk/core'
import axios, { Axios } from 'axios'

export class HexcoreApi {
	static instance = axios.create({
		baseURL: 'https://alpha-v1-api.hexcore.io.vn',
		headers: {
			'Content-Type': 'application/json'
		}
	})

	static async queryAddressUTxO(address: string): Promise<UTxO[]> {
		try {
			const response = await this.instance.get(`hydra-main/utxo/${address}`)

			if (response.data.data) {
				return Converter.convertUTxOObjectToUTxO(response.data.data)
			} else {
				throw new Error('No UTxO data found in response')
			}
		} catch (error) {
			console.error('Error querying UTxO:', error)
			throw error
		}
	}
}

type Bound = {
	/**
	 * A time in seconds relative to another one (typically, system start or era start).
	 */
	time: {
		seconds: number
	}
	/**
	 * An absolute slot number.
	 */
	slot: number
	/**
	 * An epoch number or length
	 */
	epoch: number
}

type EraSummary = {
	start: Array<Bound>
	end: Array<Bound>
	parameters: {
		/**
		 * An epoch number or length.
		 */
		epochLength: number
		/**
		 * A slot length in milliseconds
		 */
		slotLength: {
			milliseconds: number
		}
		/**
		 * Number of slots from the tip of the ledger in which it is guaranteed that no hard fork can take place.
		 * This should be (at least) the number of slots in which we are guaranteed to have k blocks.
		 */
		safeZone: number | null
	}
}
export class OgmiosApi {
	static instance = axios.create({
		baseURL: 'https://preprod.cardano-rpc.hydrawallet.app',
		headers: {
			'Content-Type': 'application/json'
		}
	})

	constructor() {
		OgmiosApi.instance.interceptors.request.use(request => {
			return request
		})
		OgmiosApi.instance.interceptors.response.use(response => {
			return response.data
		})
	}

	static async rpcRequest(method: string, params: Record<string, any>, options?: { id?: number }) {
		try {
			const response = await this.instance.post(
				'/',
				JSON.stringify({
					jsonrpc: '2.0',
					method,
					params,
					id: options?.id || 1
				})
			)

			return response
		} catch (error: any) {
			console.error('RPC error:', JSON.stringify(error?.response?.data, null, 2))
			throw error?.response?.data
		}
	}

	static async submitTransaction(cborHex: string): Promise<any> {
		try {
			const response = await this.rpcRequest('submitTransaction', {
				transaction: {
					cbor: cborHex
				}
			})
			return response
		} catch (error: any) {
			throw error
		}
	}

	static async getLedgerEraSummary(): Promise<EraSummary[]> {
		try {
			const response = await this.rpcRequest('queryLedgerState/eraSummaries', {})
			return response.data.result as EraSummary[]
		} catch (error: any) {
			throw error
		}
	}

	static async queryTip() {
		try {
			const response = await this.rpcRequest('queryLedgerState/tip', {})
			return response.data.result as {
				slot: number
				id: string
			}
		} catch (error: any) {
			throw error
		}
	}
}

export const wallet = new AppWallet({
	key: {
		type: 'mnemonic',
		words: 'armed pink solve client dignity alarm earn impose acquire rib eyebrow engage dragon face funny'.split(' ')
		// words: 'enable away depend exist mad february table onion census praise spawn pipe again angle grant'.split(' ')
	},
	networkId: NETWORK_ID.PREPROD
})

export const walletAddress = wallet.getAccount().baseAddressBech32

export const hydraConfig = {
	apiUrl: 'http://localhost:10014'
}
export class HydraApi {
	static instance = axios.create({
		baseURL: hydraConfig.apiUrl,
		headers: {
			'Content-Type': 'application/json'
		}
	})

	static async queryAddressUTxO(address: string): Promise<UTxO[]> {
		try {
			const utxos = await this.instance.get('/snapshot/utxo')
			const utxoObj = utxos.data as Record<string, any>
			return Converter.convertUTxOObjectToUTxO(utxoObj).filter(u => u.output.address === address)
		} catch (error) {
			console.error('Error querying address UTxO:', error)
			return []
		}
	}
}
