import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { AppWallet, Converter, Deserializer, NETWORK_ID, UTxO } from '@hydra-sdk/core'
import { buildRedeemer, TxBuilder } from '@hydra-sdk/transaction'
import axios, { Axios } from 'axios'

class HexcoreApi {
	private instance = axios.create({
		baseURL: 'https://alpha-v1-api.hexcore.io.vn',
		headers: {
			'Content-Type': 'application/json'
		}
	})

	async queryAddressUTxO(address: string): Promise<UTxO[]> {
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

class OgmiosApi {
	private instance = axios.create({
		baseURL: 'https://preprod.cardano-rpc.hydrawallet.app',
		headers: {
			'Content-Type': 'application/json'
		}
	})

	constructor() {
		this.instance.interceptors.request.use(request => {
			return request
		})
		this.instance.interceptors.response.use(response => {
			return response.data
		})
	}

	async rpcRequest(method: string, params: Record<string, any>, options?: { id?: number }) {
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

	async submitTransaction(cborHex: string): Promise<any> {
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
}

//
;(async function run() {
	console.log('>>> Start!')

	//=========== Prepare wallet
	const wallet = new AppWallet({
		key: {
			type: 'mnemonic',
			words: 'armed pink solve client dignity alarm earn impose acquire rib eyebrow engage dragon face funny'.split(' ')
		},
		networkId: NETWORK_ID.PREPROD
	})
	const account = wallet.getAccount()
	console.log('Account created:', account.baseAddressBech32)
})()
