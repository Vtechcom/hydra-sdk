import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { NETWORK_ID } from './constants'
import { WalletStaticMethods } from './embedded'
import { deserializeTx } from './utils/cardano-wasm/deserializer'
import { ISubmitter } from './types/wallet/submitter'
import { IFetcher } from './types/wallet/fetcher'
import { UTxO } from './types/cardano'

type CardanoCliWalletConstr = {
	networkId?: number
	/**
	 * The signing key in bech32 format.
	 * @example "5820..."
	 * @description Example of the signing key:
	 * `wallet-funds.skey`
	 * ```json
	 * {
	 *   "type": "PaymentSigningKeyShelley_ed25519",
	 *   "description": "Payment Signing Key",
	 *   "cborHex": "5820245120cdf333f8ea6910922b3f05bcbc0d5c8e8486ca94c020623d5cca822e04"
	 * }
	 * ```
	 */
	skey: `5820${string}`
	/**
	 * The verification key in bech32 format.
	 * @example "5820..."
	 * @description Example of the verification key:
	 * `wallet-funds.vkey`
	 * ```json
	 * {
	 *   "type": "PaymentVerificationKeyShelley_ed25519",
	 *   "description": "Payment Verification Key",
	 *   "cborHex": "5820216f72947d1b97d56825c5f9f8a2e6f14234c02171853264f2f552a2685b25e0"
	 * }
	 * ```
	 */
	vkey: `5820${string}`

	fetcher?: IFetcher
	submitter?: ISubmitter
}

export class CardanoCliWallet extends WalletStaticMethods {
	private readonly _networkId: number
	private readonly _skey: `5820${string}`
	private readonly _vkey: `5820${string}`
	private readonly _submitter?: ISubmitter
	private readonly _fetcher?: IFetcher

	constructor(options: CardanoCliWalletConstr) {
		super()
		this._networkId = options.networkId ?? NETWORK_ID.MAINNET
		this._skey = options.skey
		this._vkey = options.vkey
		this._submitter = options.submitter
		this._fetcher = options.fetcher
	}

	getAddressBech32(): string {
		const ed25519Vkey = CardanoWASM.PublicKey.from_hex(this._vkey.slice(4))
		const enterpriseAddress = CardanoWASM.EnterpriseAddress.new(
			this._networkId, // network id
			CardanoWASM.Credential.from_keyhash(ed25519Vkey.hash()) // payment credential
		).to_address()
		return enterpriseAddress.to_bech32()
	}

	getNetworkId(): number {
		return this._networkId
	}

	get paymentSKey(): CardanoWASM.PrivateKey {
		return CardanoWASM.PrivateKey.from_hex(this._skey.slice(4))
	}

	get paymentVKey(): CardanoWASM.PublicKey {
		return CardanoWASM.PublicKey.from_hex(this._vkey.slice(4))
	}

	async signTx(unsignedTx: string, partialSign = false): Promise<string> {
		try {
			const tx = deserializeTx(unsignedTx)

			if (!partialSign && tx.witness_set().vkeys() !== undefined && tx.witness_set().vkeys()?.len() !== 0)
				throw new Error('Signatures already exist in the transaction in a non partial sign call')

			tx.sign_and_add_vkey_signature(this.paymentSKey)
			return tx.to_hex()
		} catch (error) {
			throw new Error(`[AppWallet] An error occurred during signTx: ${error}.`)
		}
	}

	submitTx(tx: string): Promise<string> {
		if (!this._submitter) throw new Error('No submitter provided in the wallet options')
		return this._submitter.submitTx(tx)
	}

	queryUTxOs(address: string): Promise<UTxO[]> {
		if (!this._fetcher) throw new Error('No fetcher provided in the wallet options')
		return this._fetcher.fetchAddressUTxOs(address)
	}
}
