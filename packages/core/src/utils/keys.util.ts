import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { KeysUtils, ParserUtils, WalletStaticMethods } from '..'
import { buildKeys } from './cardano-wasm/build-keys'

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
 * @param skey
 * @returns
 */
export const genVkey = (skey: CardanoCLiSkey | { cborHex: `5820${string}` }) => {
	const sk = CardanoWASM.PrivateKey.from_normal_bytes(ParserUtils.hexToBytes(skey.cborHex.slice(4)))
	const vkey: CardanoWASM.PublicKey = sk.to_public()
	const vkCbor = `5820${ParserUtils.bytesToHex(vkey.as_bytes())}` as `5820${string}`
	return {
		type: 'PaymentVerificationKeyShelley_ed25519',
		description: 'Payment Verification Key',
		cborHex: vkCbor
	} as CardanoCLiVkey
}

/**
 * Convert mnemonic to Cardano CLI compatible key pair.
 * @param mnemonic
 * @param accountIndex
 * @param keyIndex
 * @returns
 */
export const mnemonicToCliKey = (
	mnemonic: string[],
	accountIndex: number = 0,
	keyIndex: number = 0
): { sk: CardanoCLiSkey; vk: CardanoCLiVkey } => {
	const walletSecret = WalletStaticMethods.mnemonicToPrivateKeyHex(mnemonic)

	const { paymentKey } = buildKeys(walletSecret, accountIndex, keyIndex)
	const extendedPrvKey = paymentKey.to_raw_key().to_hex().slice(4, 68)

	const skey = {
		type: 'PaymentSigningKeyShelley_ed25519',
		description: 'Payment Signing Key',
		cborHex: `5820${extendedPrvKey}`
	} as const

	const vkey = KeysUtils.genVkey(skey)

	return {
		sk: skey,
		vk: vkey
	}
}
