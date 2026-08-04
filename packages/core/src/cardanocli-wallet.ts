import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { NETWORK_ID } from './constants'
import { WalletStaticMethods } from './embedded'
import { deserializeTx } from './utils/cardano-wasm/deserializer'
import { cliSkeyToPrivateKey, cliVkeyToPublicKey } from './utils/cardano-wasm/cli-key-envelope'
import { ISubmitter } from './types/wallet/submitter'
import { IFetcher } from './types/wallet/fetcher'
import { UTxO } from './types/cardano'

/**
 * `cborHex` of a `cardano-cli` payment signing key envelope: a plain 32-byte ed25519 key
 * (`5820…`), a raw 64-byte extended key (`5840…`), or a BIP32-Ed25519 xprv (`5860…` / `5880…`).
 */
export type CardanoCliSkeyHex = `5820${string}` | `5840${string}` | `5860${string}` | `5880${string}`

/**
 * `cborHex` of a `cardano-cli` payment verification key envelope: a plain 32-byte ed25519 key
 * (`5820…`) or a BIP32-Ed25519 xpub (`5840…`).
 */
export type CardanoCliVkeyHex = `5820${string}` | `5840${string}`

type CardanoCliWalletConstr = {
	networkId?: number
	/**
	 * The signing key in the `cardano-cli` envelope `cborHex` format.
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
	 * Extended (BIP32-Ed25519) keys — what `KeysUtils.mnemonicToCliKey` returns — are accepted too:
	 * ```json
	 * {
	 *   "type": "PaymentExtendedSigningKeyShelley_ed25519_bip32",
	 *   "description": "Payment Signing Key",
	 *   "cborHex": "5880..."
	 * }
	 * ```
	 */
	skey: CardanoCliSkeyHex
	/**
	 * The verification key in the `cardano-cli` envelope `cborHex` format.
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
	 * Extended (BIP32-Ed25519) keys are accepted too:
	 * ```json
	 * {
	 *   "type": "PaymentExtendedVerificationKeyShelley_ed25519_bip32",
	 *   "description": "Payment Verification Key",
	 *   "cborHex": "5840..."
	 * }
	 * ```
	 */
	vkey: CardanoCliVkeyHex

	fetcher?: IFetcher
	submitter?: ISubmitter
}

export class CardanoCliWallet extends WalletStaticMethods {
	private readonly _networkId: number
	private readonly _skey: CardanoCliSkeyHex
	private readonly _vkey: CardanoCliVkeyHex
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
		const ed25519Vkey = this.paymentVKey
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
		return cliSkeyToPrivateKey(this._skey)
	}

	get paymentVKey(): CardanoWASM.PublicKey {
		return cliVkeyToPublicKey(this._vkey)
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
