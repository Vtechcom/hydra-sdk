/* eslint-disable @typescript-eslint/no-extraneous-class */
import * as BaseEncoding from '@scure/base'
import { generateMnemonic, mnemonicToEntropy } from 'bip39'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import {
	buildBaseAddress,
	buildEnterpriseAddress,
	buildKeys,
	buildRewardAddress,
	stripExtendedKey
} from './utils/cardano-wasm/build-keys'
import { resolveTxHash } from './utils/cardano-wasm/resolver'
import { toBytes } from './utils/parser'
import { DataSignature } from './types/cardano'

export class WalletStaticMethods {
	static privateKeyBech32ToPrivateKeyHex(_bech32: string): string {
		const bech32DecodedBytes = BaseEncoding.bech32.decodeToBytes(_bech32).bytes
		const bip32PrivateKey = CardanoWASM.Bip32PrivateKey.from_bytes(bech32DecodedBytes)
		return bip32PrivateKey.to_hex()
	}

	static mnemonicToPrivateKeyHex(words: string[], password = ''): string {
		const entropy = mnemonicToEntropy(words.join(' '))
		const bip32PrivateKey = CardanoWASM.Bip32PrivateKey.from_bip39_entropy(toBytes(entropy), toBytes(password))
		return bip32PrivateKey.to_hex()
	}

	static privateKeyHexToBech32(privateKeyHex: string) {
		const bip32PrivateKey = CardanoWASM.Bip32PrivateKey.from_hex(privateKeyHex)
		return bip32PrivateKey.to_bech32()
	}

	static signingKeyToHexes(paymentKey: string, stakeKey: string): [string, string] {
		return [
			paymentKey.startsWith('5820') ? paymentKey.slice(4) : paymentKey,
			stakeKey.startsWith('5820') ? stakeKey.slice(4) : stakeKey
		]
	}

	static bip32BytesToPrivateKeyHex(bip32Bytes: Uint8Array): string {
		const bip32PrivateKey = CardanoWASM.Bip32PrivateKey.from_bytes(bip32Bytes)
		return bip32PrivateKey.to_hex()
	}

	static getAddresses(
		paymentKey: CardanoWASM.Bip32PrivateKey,
		stakingKey: CardanoWASM.Bip32PrivateKey,
		networkId = 0
	): {
		baseAddress: CardanoWASM.Address
		enterpriseAddress: CardanoWASM.Address
		rewardAddress: CardanoWASM.Address
	} {
		const baseAddress = buildBaseAddress(
			networkId,
			paymentKey.to_public().to_raw_key().hash(),
			stakingKey.to_public().to_raw_key().hash()
		).to_address()

		const enterpriseAddress = buildEnterpriseAddress(networkId, paymentKey.to_public().to_raw_key().hash()).to_address()

		const rewardAddress = buildRewardAddress(networkId, stakingKey.to_public().to_raw_key().hash()).to_address()

		return {
			baseAddress: baseAddress,
			enterpriseAddress: enterpriseAddress,
			rewardAddress: rewardAddress
		}
	}

	static generateMnemonic(strength = 256): string[] {
		const mnemonic = generateMnemonic(strength)
		return mnemonic.split(' ')
	}

	// static getDRepKey(
	//   dRepKey: Ed25519PrivateKey,
	//   networkId = 0
	// ): {
	//   pubDRepKey: string
	//   dRepIDBech32: DRepID
	//   dRepIDHash: Ed25519KeyHashHex
	// } {
	//   const pubDRepKey = dRepKey.toPublic().hex().toString()

	//   const dRepIDBech32 = buildDRepID(Ed25519PublicKeyHex(pubDRepKey), networkId)
	//   const dRep = DRep.newKeyHash(dRepKey.toPublic().hash().hex())
	//   const dRepIDHash = dRep.toKeyHash()!

	//   return {
	//     pubDRepKey,
	//     dRepIDBech32,
	//     dRepIDHash
	//   }
	// }
}

export type Account = {
	baseAddress: CardanoWASM.Address
	enterpriseAddress: CardanoWASM.Address
	rewardAddress: CardanoWASM.Address
	baseAddressBech32: string
	enterpriseAddressBech32: string
	rewardAddressBech32: string
	paymentKey: CardanoWASM.Bip32PrivateKey
	stakeKey: CardanoWASM.Bip32PrivateKey
	/**
	 * @description 96 bytes with extended public key
	 */
	extendedPaymentKeyHex: string
	/**
	 * @description 96 bytes with extended public key
	 */
	extendedStakeKeyHex: string
	/**
	 * @description 64 bytes without extended public key
	 */
	paymentKeyHex: string
	/**
	 * @description 64 bytes without extended public key
	 */
	stakeKeyHex: string

	pubDRepKey?: string
	dRepIDBech32?: ReturnType<CardanoWASM.DRep['to_bech32']>
	dRepIDHash?: ReturnType<CardanoWASM.DRep['to_key_hash']>
}

export type CreateEmbeddedWalletOptions = {
	networkId: number
	key: EmbeddedWalletKeyType
}

export type EmbeddedWalletKeyType =
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
	| {
			type: 'bip32Bytes'
			bip32Bytes: Uint8Array
	  }

export class EmbeddedWallet extends WalletStaticMethods {
	private readonly _walletSecret?: string | [string, string]
	private readonly _networkId: number

	constructor(options: CreateEmbeddedWalletOptions) {
		super()
		this._networkId = options.networkId

		switch (options.key.type) {
			case 'mnemonic':
				this._walletSecret = WalletStaticMethods.mnemonicToPrivateKeyHex(options.key.words)
				break
			case 'root':
				this._walletSecret = WalletStaticMethods.privateKeyBech32ToPrivateKeyHex(options.key.bech32)
				break
			case 'cli':
				this._walletSecret = WalletStaticMethods.signingKeyToHexes(
					options.key.payment,
					options.key.stake ?? 'f0'.repeat(32)
				)
				break
			case 'bip32Bytes':
				this._walletSecret = WalletStaticMethods.bip32BytesToPrivateKeyHex(options.key.bip32Bytes)
				break
		}
	}

	getPrivateKeyHex(): string | [string, string] {
		if (this._walletSecret == undefined) throw new Error('[EmbeddedWallet] No keys initialized')
		return this._walletSecret
	}

	getAccount(accountIndex = 0, keyIndex = 0): Account {
		if (this._walletSecret == undefined) throw new Error('[EmbeddedWallet] No keys initialized')

		const { paymentKey, stakeKey } = buildKeys(this._walletSecret, accountIndex, keyIndex)

		const { baseAddress, enterpriseAddress, rewardAddress } = WalletStaticMethods.getAddresses(
			paymentKey,
			stakeKey,
			this._networkId
		)

		const _account: Account = {
			baseAddress: baseAddress,
			enterpriseAddress: enterpriseAddress,
			rewardAddress: rewardAddress,

			baseAddressBech32: baseAddress.to_bech32(),
			enterpriseAddressBech32: enterpriseAddress.to_bech32(),
			rewardAddressBech32: rewardAddress.to_bech32(),

			paymentKey: paymentKey,
			stakeKey: stakeKey,

			paymentKeyHex: stripExtendedKey(paymentKey.to_hex()),
			stakeKeyHex: stripExtendedKey(stakeKey.to_hex()),
			extendedPaymentKeyHex: paymentKey.to_hex(),
			extendedStakeKeyHex: stakeKey.to_hex()
		}

		// TODO: fix it
		// if (dRepKey) {
		//   const { pubDRepKey, dRepIDBech32, dRepIDHash } = WalletStaticMethods.getDRepKey(dRepKey, this._networkId)
		//   _account.pubDRepKey = pubDRepKey
		//   _account.dRepIDBech32 = dRepIDBech32
		//   _account.dRepIDHash = dRepIDHash
		// }

		return _account
	}

	/**
	 * Get wallet network ID.
	 *
	 * @returns network ID
	 */
	getNetworkId(): number {
		return this._networkId
	}

	/**
	 * This endpoints sign the provided transaction (unsignedTx) with the private key of the owner.
	 *
	 * @param unsignedTx - a transaction in CBOR
	 * @param accountIndex account index (default: 0)
	 * @param keyIndex key index (default: 0)
	 * @returns VkeyWitness
	 */
	signTx(unsignedTx: string, accountIndex = 0, keyIndex = 0): CardanoWASM.Vkeywitness {
		try {
			const txHashHex = resolveTxHash(unsignedTx)
			const { paymentKey } = this.getAccount(accountIndex, keyIndex)
			const privateSigningKey = paymentKey.to_raw_key()
			const vkeyWitness = CardanoWASM.make_vkey_witness(CardanoWASM.TransactionHash.from_hex(txHashHex), privateSigningKey)
			return vkeyWitness
		} catch (error) {
			throw new Error(`[EmbeddedWallet] An error occurred during signTx: ${error}.`)
		}
	}

	/**
	 * This endpoint utilizes the [CIP-8 - Message Signing](https://cips.cardano.org/cips/cip8/) to sign arbitrary data, to verify the data was signed by the owner of the private key.
	 *
	 * @param address - bech32 address to sign the data with
	 * @param payload - the data to be signed
	 * @param accountIndex account index (default: 0)
	 * @returns a signature
	 */
	signData(address: string, payload: string, accountIndex = 0, keyIndex = 0): DataSignature {
		try {
			const { baseAddress, enterpriseAddress, rewardAddress, paymentKey } = this.getAccount(accountIndex, keyIndex)

			const foundAddress = [baseAddress, enterpriseAddress, rewardAddress].find(a => a.to_bech32() === address)

			if (foundAddress === undefined)
				throw new Error(`[EmbeddedWallet] Address: ${address} doesn't belong to this account.`)

			const messageBytes = toBytes(payload)
			const privateSigningKey = paymentKey.to_raw_key()
			const dataSignature = privateSigningKey.sign(messageBytes)
			return {
				signature: dataSignature.to_hex(),
				key: paymentKey.to_public().to_raw_key().to_hex()
			}
		} catch (error) {
			throw new Error(`[EmbeddedWallet] An error occurred during signData: ${error}.`)
		}
	}
}
