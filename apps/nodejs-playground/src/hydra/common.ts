import { AppWallet, Converter, NETWORK_ID, ProviderUtils, UTxO, UTxOObject } from '@hydra-sdk/core'
import { walletTestHydra as mockWallet } from '../__tests__/__mocks__/wallet.json'
import axios from 'axios'
import { getEnvVar } from '../env'

const blockfrostProvider = new ProviderUtils.BlockfrostProvider({
	apiKey: getEnvVar('BLOCKFROST_PROVIDER_API_KEY') || '',
	network: 'preprod'
})

export const wallet = new AppWallet({
	key: {
		type: 'mnemonic',
		// words: mockWallet.mnemonic.split(' ')
		words: 'armed pink solve client dignity alarm earn impose acquire rib eyebrow engage dragon face funny'.split(' ')
	},
	networkId: NETWORK_ID.PREPROD,
	fetcher: blockfrostProvider.fetcher,
	submitter: blockfrostProvider.submitter
})

export const walletAddress = wallet.getAccount().baseAddressBech32

export const hydraConfig = {
	httpUrl: 'http://localhost:10005',
	wsUrl: 'ws://localhost:10005'
}

export type DepositToken = [string, Record<string, number>]
/**
 * PartialDepositBody type
 * Example:
 * ```json
 * {
 * 	"utxoToCommit": { ... },
 * 	"amount": 1000000,
 * 	"tokens": [
 * 		["policyId", { "assetName1": 5, "assetName2": 10 }],
 * 		["policyId2", { "assetName3": 15 }]
 * 	]
 * }
 * ```
 */
type PartialDepositBody = {
	utxoToCommit: UTxOObject
	amount: number
	tokens: DepositToken[]
}

export class HydraApi {
	static instance = axios.create({
		baseURL: hydraConfig.httpUrl,
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

	static async partialDeposit(blueprintTxCbor: string, utxo: UTxOObject, changeAddress: string) {
		try {
			const response = await this.instance.post('/commit', {
				blueprintTx: {
					cborHex: blueprintTxCbor,
					type: 'Tx ConwayEra',
					description: 'Partial commit from NodeJS Playground'
				},
				utxo,
				changeAddress
			})
			return response.data as {
				cborHex: string
				description: string
				txId: string
				type: 'Tx ConwayEra'
			}
		} catch (error) {
			console.error('Error during partial deposit:', error)
			throw error
		}
	}

	static async commit(utxo: UTxOObject) {
		try {
			const response = await this.instance.post('/commit', {
				...utxo
			})
			return response.data as {
				cborHex: string
				description: string
				txId: string
				type: 'Tx ConwayEra'
			}
		} catch (error) {
			console.error('Error during commit:', error)
			throw error
		}
	}
}
