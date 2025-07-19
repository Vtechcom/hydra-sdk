import { EmbeddedWallet } from './embedded'
import type { DataSignature } from './types/cardano'
import { CreateAppWalletOptions } from './types/wallet'
import type { IFetcher } from './types/wallet/fetcher'
import type { ISigner } from './types/wallet/signer'
import type { ISubmitter } from './types/wallet/submitter'
import { deserializeTx } from './utils/cardano-wasm/deserializer'

export { EmbeddedWallet }
export * from './constants'

export class AppWallet implements ISigner, ISubmitter {
	private readonly _submitter?: ISubmitter
	private readonly _fetcher?: IFetcher
	private readonly _wallet: EmbeddedWallet

	constructor(options: CreateAppWalletOptions) {
		this._fetcher = options.fetcher
		this._submitter = options.submitter

		switch (options.key.type) {
			case 'mnemonic':
				this._wallet = new EmbeddedWallet({
					networkId: options.networkId,
					key: {
						type: 'mnemonic',
						words: options.key.words
					}
				})
				break
			case 'root':
				this._wallet = new EmbeddedWallet({
					networkId: options.networkId,
					key: {
						type: 'root',
						bech32: options.key.bech32
					}
				})
				break
			case 'cli':
				this._wallet = new EmbeddedWallet({
					networkId: options.networkId,
					key: {
						type: 'cli',
						payment: options.key.payment,
						stake: options.key.stake
					}
				})
		}
	}

	getAccount(accountIndex = 0, keyIndex = 0) {
		return this._wallet.getAccount(accountIndex, keyIndex)
	}

	getEnterpriseAddress(accountIndex = 0, keyIndex = 0): string {
		const account = this._wallet.getAccount(accountIndex, keyIndex)
		return account.enterpriseAddressBech32
	}

	getPaymentAddress(accountIndex = 0, keyIndex = 0): string {
		const account = this._wallet.getAccount(accountIndex, keyIndex)
		return account.baseAddressBech32
	}

	getRewardAddress(accountIndex = 0, keyIndex = 0): string {
		const account = this._wallet.getAccount(accountIndex, keyIndex)
		return account.rewardAddressBech32
	}

	getNetworkId(): number {
		return this._wallet.getNetworkId()
	}

	async signTx(unsignedTx: string, partialSign = false, accountIndex = 0, keyIndex = 0): Promise<string> {
		try {
			const tx = deserializeTx(unsignedTx)

			if (!partialSign && tx.witness_set().vkeys() !== undefined && tx.witness_set().vkeys()?.len() !== 0)
				throw new Error('Signatures already exist in the transaction in a non partial sign call')

			const prvSigningKey = this._wallet.getAccount(accountIndex, keyIndex).paymentKey.to_raw_key()
			tx.sign_and_add_vkey_signature(prvSigningKey)
			return tx.to_hex()
		} catch (error) {
			throw new Error(`[AppWallet] An error occurred during signTx: ${error}.`)
		}
	}

	static brew(strength = 256): string[] {
		return EmbeddedWallet.generateMnemonic(strength)
	}

	async signData(address: string, payload: string, accountIndex = 0, keyIndex = 0): Promise<DataSignature> {
		try {
			// todo tw
			// this._wallet.signData(address, payload, accountIndex, keyIndex)
			return new Promise(() => {
				throw new Error(`[AppWallet] signData() is not implemented.`)
			})
		} catch (error) {
			throw new Error(`[AppWallet] An error occurred during signData: ${error}.`)
		}
	}

	signTxs(unsignedTxs: string[], partialSign?: boolean): Promise<string[]> {
		throw new Error(`[AppWallet] signTxs() is not implemented.`)
	}

	submitTx(tx: string): Promise<string> {
		throw new Error(`[AppWallet] submitTx() is not implemented.`)
	}
}
