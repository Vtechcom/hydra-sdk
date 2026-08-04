import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { bytesToHex, hexToBytes } from '../parser'

/**
 * Payload sizes, in bytes, of every key encoding a `cardano-cli` key envelope can hold.
 */
export const CLI_KEY_LENGTH = {
	/** Plain ed25519 key — `PaymentSigningKeyShelley_ed25519` / `PaymentVerificationKeyShelley_ed25519`. */
	NORMAL: 32,
	/** Raw extended ed25519 signing key (`kL | kR`), no chain code. */
	EXTENDED: 64,
	/** BIP32-Ed25519 xpub — `pub | chaincode`. */
	XPUB: 64,
	/** BIP32-Ed25519 96-byte xprv — `prv | chaincode`. */
	XPRV_96: 96,
	/** BIP32-Ed25519 128-byte xprv — `prv | pub | chaincode`, the form `cardano-cli` writes. */
	XPRV_128: 128
} as const

/**
 * Wrap raw key bytes in the CBOR byte-string header used by `cardano-cli` key envelopes.
 *
 * Only the 1-byte-length form (`0x58 <len>`) is emitted, which covers every key size
 * Cardano uses (32 to 128 bytes).
 *
 * @param bytes raw key bytes
 * @returns hex of the CBOR byte string, e.g. `5820...` for a 32-byte key
 */
export const encodeCliKeyEnvelope = (bytes: Uint8Array): string => {
	if (bytes.length < 24 || bytes.length > 255)
		throw new Error(`[cli-key-envelope] Cannot encode a ${bytes.length}-byte key: expected between 24 and 255 bytes.`)
	return `58${bytes.length.toString(16).padStart(2, '0')}${bytesToHex(bytes)}`
}

/**
 * Unwrap the CBOR byte string of a `cardano-cli` key envelope (`skey` / `vkey` `cborHex`).
 *
 * @param cborHex the `cborHex` field of a key envelope, e.g. `5820...`
 * @returns the raw key bytes
 */
export const decodeCliKeyEnvelope = (cborHex: string): Uint8Array => {
	const hex = cborHex.trim().toLowerCase()
	const match = hex.match(/^58([0-9a-f]{2})([0-9a-f]+)$/)
	if (!match)
		throw new Error(
			`[cli-key-envelope] Unsupported cborHex "${cborHex.slice(0, 8)}…": expected a CBOR byte string (58xx…).`
		)

	const declaredLength = parseInt(match[1], 16)
	const payload = match[2]
	if (payload.length !== declaredLength * 2)
		throw new Error(
			`[cli-key-envelope] Malformed cborHex: header declares ${declaredLength} bytes but payload holds ${payload.length / 2}.`
		)

	return hexToBytes(payload)
}

/**
 * Build a `PrivateKey` from the `cborHex` of a `cardano-cli` signing key envelope.
 *
 * Accepts every payment signing key shape `cardano-cli` and the SDK produce:
 * - 32 bytes — plain ed25519 (`PaymentSigningKeyShelley_ed25519`)
 * - 64 bytes — raw extended ed25519 (`kL | kR`)
 * - 96 bytes — BIP32-Ed25519 xprv (`prv | chaincode`)
 * - 128 bytes — BIP32-Ed25519 xprv (`prv | pub | chaincode`, `PaymentExtendedSigningKeyShelley_ed25519_bip32`)
 *
 * @param cborHex the `cborHex` field of a signing key envelope
 * @returns the signing key
 */
export const cliSkeyToPrivateKey = (cborHex: string): CardanoWASM.PrivateKey => {
	const bytes = decodeCliKeyEnvelope(cborHex)

	switch (bytes.length) {
		case CLI_KEY_LENGTH.NORMAL:
			return CardanoWASM.PrivateKey.from_normal_bytes(bytes)
		case CLI_KEY_LENGTH.EXTENDED:
			return CardanoWASM.PrivateKey.from_extended_bytes(bytes)
		case CLI_KEY_LENGTH.XPRV_96:
			return CardanoWASM.Bip32PrivateKey.from_bytes(bytes).to_raw_key()
		case CLI_KEY_LENGTH.XPRV_128:
			return CardanoWASM.Bip32PrivateKey.from_128_xprv(bytes).to_raw_key()
		default:
			throw new Error(
				`[cli-key-envelope] Unsupported signing key length ${bytes.length}: expected 32, 64, 96 or 128 bytes.`
			)
	}
}

/**
 * Build a `PublicKey` from the `cborHex` of a `cardano-cli` verification key envelope.
 *
 * Accepts both payment verification key shapes:
 * - 32 bytes — plain ed25519 (`PaymentVerificationKeyShelley_ed25519`)
 * - 64 bytes — BIP32-Ed25519 xpub (`pub | chaincode`, `PaymentExtendedVerificationKeyShelley_ed25519_bip32`)
 *
 * The chain code carries no address information, so both shapes hash to the same payment credential.
 *
 * @param cborHex the `cborHex` field of a verification key envelope
 * @returns the verification key
 */
export const cliVkeyToPublicKey = (cborHex: string): CardanoWASM.PublicKey => {
	const bytes = decodeCliKeyEnvelope(cborHex)

	switch (bytes.length) {
		case CLI_KEY_LENGTH.NORMAL:
			return CardanoWASM.PublicKey.from_bytes(bytes)
		case CLI_KEY_LENGTH.XPUB:
			return CardanoWASM.Bip32PublicKey.from_bytes(bytes).to_raw_key()
		default:
			throw new Error(`[cli-key-envelope] Unsupported verification key length ${bytes.length}: expected 32 or 64 bytes.`)
	}
}
