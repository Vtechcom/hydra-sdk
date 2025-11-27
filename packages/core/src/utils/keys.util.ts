import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { ParserUtils } from '..'

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

export const cardanoCliKeygen = () => {
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
		} as CardanoCLiSkey,
		vk: {
			type: 'PaymentVerificationKeyShelley_ed25519',
			description: 'Payment Verification Key',
			cborHex: vkCbor
		} as CardanoCLiVkey
	}
}

export const hydraCliKeygen = () => {
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
