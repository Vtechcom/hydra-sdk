import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { ParserUtils, WalletStaticMethods } from '..'
import { buildKeys } from './cardano-wasm/build-keys'
import {
	CLI_KEY_LENGTH,
	cliSkeyToPrivateKey,
	decodeCliKeyEnvelope,
	encodeCliKeyEnvelope
} from './cardano-wasm/cli-key-envelope'

export {
	CLI_KEY_LENGTH,
	cliSkeyToPrivateKey,
	cliVkeyToPublicKey,
	decodeCliKeyEnvelope,
	encodeCliKeyEnvelope
} from './cardano-wasm/cli-key-envelope'

export type CardanoCLiSkey = {
	type: 'PaymentSigningKeyShelley_ed25519'
	description: 'Payment Signing Key'
	cborHex: `5820${string}`
}

export type CardanoCLiVkey = {
	type: 'PaymentVerificationKeyShelley_ed25519'
	description: 'Payment Verification Key'
	cborHex: `5820${string}`
}

/**
 * A BIP32-Ed25519 payment signing key in the `cardano-cli` envelope format.
 *
 * `cborHex` wraps the 128-byte xprv (`prv | pub | chaincode`), which is what
 * `cardano-cli key convert-cardano-address-key` writes for HD-derived keys.
 */
export type CardanoCliExtendedSkey = {
	type: 'PaymentExtendedSigningKeyShelley_ed25519_bip32'
	description: 'Payment Signing Key'
	cborHex: `5880${string}`
}

/**
 * A BIP32-Ed25519 payment verification key in the `cardano-cli` envelope format.
 *
 * `cborHex` wraps the 64-byte xpub (`pub | chaincode`).
 */
export type CardanoCliExtendedVkey = {
	type: 'PaymentExtendedVerificationKeyShelley_ed25519_bip32'
	description: 'Payment Verification Key'
	cborHex: `5840${string}`
}

export type HydraCliSkey = {
	type: 'HydraSigningKey_ed25519'
	description: ''
	cborHex: `5820${string}`
}

export type HydraCliVkey = {
	type: 'HydraVerificationKey_ed25519'
	description: ''
	cborHex: `5820${string}`
}
/**
 * Generate a Cardano CLI compatible ed25519 key pair.
 * @returns
 */
export const cardanoCliKeygen = (): { sk: CardanoCLiSkey; vk: CardanoCLiVkey } => {
	const sk = CardanoWASM.PrivateKey.generate_ed25519()
	const raw = sk.as_bytes()
	const skCbor = `5820${ParserUtils.bytesToHex(raw)}` as `5820${string}`

	const vk: CardanoWASM.PublicKey = sk.to_public()
	const vkCbor = `5820${ParserUtils.bytesToHex(vk.as_bytes())}` as `5820${string}`

	return {
		sk: {
			type: 'PaymentSigningKeyShelley_ed25519',
			description: 'Payment Signing Key',
			cborHex: skCbor
		},
		vk: {
			type: 'PaymentVerificationKeyShelley_ed25519',
			description: 'Payment Verification Key',
			cborHex: vkCbor
		}
	}
}
/**
 * Generate a Hydra compatible ed25519 key pair.
 * @returns
 */
export const hydraCliKeygen = (): { sk: HydraCliSkey; vk: HydraCliVkey } => {
	const sk = CardanoWASM.PrivateKey.generate_ed25519()
	const raw = sk.as_bytes()
	const skCbor = `5820${ParserUtils.bytesToHex(raw)}` as `5820${string}`

	const vk: CardanoWASM.PublicKey = sk.to_public()
	const vkCbor = `5820${ParserUtils.bytesToHex(vk.as_bytes())}` as `5820${string}`

	return {
		sk: {
			type: 'HydraSigningKey_ed25519',
			description: '',
			cborHex: skCbor
		},
		vk: {
			type: 'HydraVerificationKey_ed25519',
			description: '',
			cborHex: vkCbor
		}
	}
}

/**
 * Generate verification key from signing key.
 *
 * A BIP32-Ed25519 signing key carries a chain code, so it yields an extended verification key
 * (`PaymentExtendedVerificationKeyShelley_ed25519_bip32`); every other shape yields a plain one.
 *
 * @param skey
 * @returns
 */
export function genVkey(skey: CardanoCliExtendedSkey | { cborHex: `5880${string}` }): CardanoCliExtendedVkey
export function genVkey(skey: CardanoCLiSkey | HydraCliSkey | { cborHex: `5820${string}` }): CardanoCLiVkey
export function genVkey(skey: { cborHex: string }): CardanoCLiVkey | CardanoCliExtendedVkey
export function genVkey(skey: { cborHex: string }): CardanoCLiVkey | CardanoCliExtendedVkey {
	const bytes = decodeCliKeyEnvelope(skey.cborHex)

	if (bytes.length === CLI_KEY_LENGTH.XPRV_96 || bytes.length === CLI_KEY_LENGTH.XPRV_128) {
		const bip32Key =
			bytes.length === CLI_KEY_LENGTH.XPRV_128
				? CardanoWASM.Bip32PrivateKey.from_128_xprv(bytes)
				: CardanoWASM.Bip32PrivateKey.from_bytes(bytes)

		return {
			type: 'PaymentExtendedVerificationKeyShelley_ed25519_bip32',
			description: 'Payment Verification Key',
			cborHex: encodeCliKeyEnvelope(bip32Key.to_public().as_bytes()) as `5840${string}`
		}
	}

	const vkey: CardanoWASM.PublicKey = cliSkeyToPrivateKey(skey.cborHex).to_public()

	return {
		type: 'PaymentVerificationKeyShelley_ed25519',
		description: 'Payment Verification Key',
		cborHex: encodeCliKeyEnvelope(vkey.as_bytes()) as `5820${string}`
	}
}

/**
 * Convert mnemonic to Cardano CLI compatible key pair.
 *
 * Keys derived from a mnemonic follow BIP32-Ed25519 (path `m/1852'/1815'/accountIndex'/0/keyIndex`),
 * so the pair is an **extended** one: the signing key is the 128-byte xprv (`prv | pub | chaincode`)
 * and the verification key is the 64-byte xpub (`pub | chaincode`). Both hash to the same payment
 * credential as `AppWallet.getAccount(accountIndex, keyIndex).enterpriseAddressBech32`.
 *
 * An extended key cannot be narrowed to a plain 32-byte `PaymentSigningKeyShelley_ed25519`: the
 * first half of a BIP32-Ed25519 key is already the scalar, whereas a plain key is a seed that
 * ed25519 hashes into a scalar, so the two derive different public keys.
 *
 * @param mnemonic
 * @param accountIndex
 * @param keyIndex
 * @returns
 */
export const mnemonicToCliKey = (
	mnemonic: string[],
	accountIndex: number = 0,
	keyIndex: number = 0
): { sk: CardanoCliExtendedSkey; vk: CardanoCliExtendedVkey } => {
	const walletSecret = WalletStaticMethods.mnemonicToPrivateKeyHex(mnemonic)

	const { paymentKey } = buildKeys(walletSecret, accountIndex, keyIndex)

	const skey: CardanoCliExtendedSkey = {
		type: 'PaymentExtendedSigningKeyShelley_ed25519_bip32',
		description: 'Payment Signing Key',
		cborHex: encodeCliKeyEnvelope(paymentKey.to_128_xprv()) as `5880${string}`
	}

	const vkey: CardanoCliExtendedVkey = {
		type: 'PaymentExtendedVerificationKeyShelley_ed25519_bip32',
		description: 'Payment Verification Key',
		cborHex: encodeCliKeyEnvelope(paymentKey.to_public().as_bytes()) as `5840${string}`
	}

	return {
		sk: skey,
		vk: vkey
	}
}
