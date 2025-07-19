import { IFetcher } from './fetcher'
import { ISubmitter } from './submitter'

export type AppWalletKeyType =
	| {
			type: 'root'
			bech32: string
	  }
	| {
			type: 'cli'
			payment: string
			stake?: string
	  }
	| {
			type: 'mnemonic'
			words: string[]
	  }
export type CreateAppWalletOptions = {
	networkId: number
	fetcher?: IFetcher
	submitter?: ISubmitter
	key: AppWalletKeyType
}
