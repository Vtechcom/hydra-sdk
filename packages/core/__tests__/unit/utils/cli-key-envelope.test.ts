import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import {
	CLI_KEY_LENGTH,
	cliSkeyToPrivateKey,
	cliVkeyToPublicKey,
	decodeCliKeyEnvelope,
	encodeCliKeyEnvelope
} from '../../../src/utils/cardano-wasm/cli-key-envelope'
import { bytesToHex } from '../../../src/utils/parser'

const rootKey = CardanoWASM.Bip32PrivateKey.from_bip39_entropy(new Uint8Array(32).fill(7), new Uint8Array(0))
const bip32Key = rootKey
	.derive(0x80000000 + 1852)
	.derive(0x80000000 + 1815)
	.derive(0x80000000)
const normalKey = CardanoWASM.PrivateKey.generate_ed25519()

describe('cli-key-envelope', () => {
	describe('encodeCliKeyEnvelope', () => {
		it('should wrap a 32-byte key in a 5820 header', () => {
			expect(encodeCliKeyEnvelope(new Uint8Array(32))).toBe(`5820${'00'.repeat(32)}`)
		})

		it('should wrap a 64-byte key in a 5840 header', () => {
			expect(encodeCliKeyEnvelope(new Uint8Array(64))).toBe(`5840${'00'.repeat(64)}`)
		})

		it('should wrap a 128-byte key in a 5880 header', () => {
			expect(encodeCliKeyEnvelope(new Uint8Array(128))).toBe(`5880${'00'.repeat(128)}`)
		})

		it('should reject key sizes outside the 1-byte-length CBOR form', () => {
			expect(() => encodeCliKeyEnvelope(new Uint8Array(8))).toThrow(/Cannot encode a 8-byte key/)
			expect(() => encodeCliKeyEnvelope(new Uint8Array(256))).toThrow(/Cannot encode a 256-byte key/)
		})
	})

	describe('decodeCliKeyEnvelope', () => {
		it('should unwrap the payload', () => {
			const bytes = new Uint8Array(32).fill(0xab)

			expect(decodeCliKeyEnvelope(encodeCliKeyEnvelope(bytes))).toEqual(bytes)
		})

		it('should be case insensitive', () => {
			expect(bytesToHex(decodeCliKeyEnvelope(`5820${'AB'.repeat(32)}`))).toBe('ab'.repeat(32))
		})

		it('should reject a non byte-string cborHex', () => {
			expect(() => decodeCliKeyEnvelope(`a0${'00'.repeat(32)}`)).toThrow(/expected a CBOR byte string/)
		})

		it('should reject a payload that does not match the declared length', () => {
			expect(() => decodeCliKeyEnvelope(`5820${'00'.repeat(16)}`)).toThrow(/header declares 32 bytes/)
		})
	})

	describe('cliSkeyToPrivateKey', () => {
		it('should read a 32-byte plain ed25519 key', () => {
			const cborHex = encodeCliKeyEnvelope(normalKey.as_bytes())

			expect(cliSkeyToPrivateKey(cborHex).to_hex()).toBe(normalKey.to_hex())
		})

		it('should read a 64-byte raw extended key', () => {
			const rawKey = bip32Key.to_raw_key()
			const cborHex = encodeCliKeyEnvelope(rawKey.as_bytes())

			expect(cliSkeyToPrivateKey(cborHex).to_public().to_hex()).toBe(rawKey.to_public().to_hex())
		})

		it('should read a 96-byte xprv', () => {
			const cborHex = encodeCliKeyEnvelope(bip32Key.as_bytes())

			expect(cliSkeyToPrivateKey(cborHex).to_public().to_hex()).toBe(bip32Key.to_public().to_raw_key().to_hex())
		})

		it('should read a 128-byte xprv', () => {
			const cborHex = encodeCliKeyEnvelope(bip32Key.to_128_xprv())

			expect(cliSkeyToPrivateKey(cborHex).to_public().to_hex()).toBe(bip32Key.to_public().to_raw_key().to_hex())
		})

		it('should derive the same public key from every extended encoding', () => {
			const from64 = cliSkeyToPrivateKey(encodeCliKeyEnvelope(bip32Key.to_raw_key().as_bytes()))
			const from96 = cliSkeyToPrivateKey(encodeCliKeyEnvelope(bip32Key.as_bytes()))
			const from128 = cliSkeyToPrivateKey(encodeCliKeyEnvelope(bip32Key.to_128_xprv()))

			expect(from96.to_public().to_hex()).toBe(from64.to_public().to_hex())
			expect(from128.to_public().to_hex()).toBe(from64.to_public().to_hex())
		})

		it('should reject an unsupported signing key length', () => {
			expect(() => cliSkeyToPrivateKey(encodeCliKeyEnvelope(new Uint8Array(48)))).toThrow(
				/Unsupported signing key length 48/
			)
		})
	})

	describe('cliVkeyToPublicKey', () => {
		it('should read a 32-byte plain ed25519 key', () => {
			const publicKey = normalKey.to_public()
			const cborHex = encodeCliKeyEnvelope(publicKey.as_bytes())

			expect(cliVkeyToPublicKey(cborHex).to_hex()).toBe(publicKey.to_hex())
		})

		it('should read a 64-byte xpub', () => {
			const cborHex = encodeCliKeyEnvelope(bip32Key.to_public().as_bytes())

			expect(cliVkeyToPublicKey(cborHex).to_hex()).toBe(bip32Key.to_public().to_raw_key().to_hex())
		})

		it('should hash an xpub to the same credential as its raw public key', () => {
			const fromXpub = cliVkeyToPublicKey(encodeCliKeyEnvelope(bip32Key.to_public().as_bytes()))
			const fromRaw = cliVkeyToPublicKey(encodeCliKeyEnvelope(bip32Key.to_public().to_raw_key().as_bytes()))

			expect(fromXpub.hash().to_hex()).toBe(fromRaw.hash().to_hex())
		})

		it('should reject an unsupported verification key length', () => {
			expect(() => cliVkeyToPublicKey(encodeCliKeyEnvelope(new Uint8Array(CLI_KEY_LENGTH.XPRV_128)))).toThrow(
				/Unsupported verification key length 128/
			)
		})
	})
})
