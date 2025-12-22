// crypto-utils.js (hoặc .ts với types nếu dùng TypeScript)

import { chacha20poly1305 } from '@noble/ciphers/chacha.js'
import { pbkdf2 } from '@noble/hashes/pbkdf2.js'
import { sha512 } from '@noble/hashes/sha2.js'
import { bytesToHex, hexToBytes, randomBytes } from '@noble/hashes/utils.js'

const ITERS = 12983
const PROTOCOL_SIZE = 1
const SALT_SIZE = 16
const NONCE_SIZE = 12
const TAG_SIZE = 16
const PROTOCOL_VERSION = 0x01 // 1
const BLOCK_SIZE = 64 // Dữ liệu phải multiple of 64 bytes

class CryptoError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'CryptoError'
	}
}

function deriveSymmetricKey(password: Uint8Array, salt: Uint8Array): Uint8Array {
	// PBKDF2-HMAC-SHA512, dkLen 32
	return pbkdf2(sha512, password, salt, { c: ITERS, dkLen: 32 })
}

// Hàm encrypt (tương đương Rust encrypt)
export function encrypt(password: Uint8Array, data: Uint8Array): Uint8Array {
	if (!(password instanceof Uint8Array)) password = new Uint8Array(password)
	if (!(data instanceof Uint8Array)) data = new Uint8Array(data)

	if (data.length === 0) {
		throw new CryptoError('encrypted data should not be null')
	}
	if (data.length % BLOCK_SIZE !== 0) {
		throw new CryptoError('expected data to be a multiple of 64 bytes')
	}

	const salt = randomBytes(SALT_SIZE)
	const nonce = randomBytes(NONCE_SIZE)
	const key = deriveSymmetricKey(password, salt)

	const cipher = chacha20poly1305(key, nonce)
	const encrypted = cipher.encrypt(data) // Trả về ciphertext + tag (tag cuối 16 bytes)

	const ciphertext = encrypted.subarray(0, -TAG_SIZE)
	const tag = encrypted.subarray(-TAG_SIZE)

	// Ghép output: protocol + salt + nonce + ciphertext + tag
	const output = new Uint8Array(PROTOCOL_SIZE + SALT_SIZE + NONCE_SIZE + ciphertext.length + TAG_SIZE)
	let pos = 0
	output[pos] = PROTOCOL_VERSION
	pos += PROTOCOL_SIZE
	output.set(salt, pos)
	pos += SALT_SIZE
	output.set(nonce, pos)
	pos += NONCE_SIZE
	output.set(ciphertext, pos)
	pos += ciphertext.length
	output.set(tag, pos)

	return output
}

// Hàm decrypt (tương đương Rust decrypt)
export function decrypt(password: Uint8Array, encryptedData: Uint8Array): Uint8Array {
	if (!(password instanceof Uint8Array)) password = new Uint8Array(password)
	if (!(encryptedData instanceof Uint8Array)) encryptedData = new Uint8Array(encryptedData)

	if (encryptedData.length <= PROTOCOL_SIZE + SALT_SIZE + NONCE_SIZE + TAG_SIZE) {
		throw new CryptoError('missing data')
	}

	let pos = 0
	const protocol = encryptedData[pos]
	pos += PROTOCOL_SIZE
	if (protocol !== PROTOCOL_VERSION) {
		throw new CryptoError('invalid payload protocol')
	}

	const salt = encryptedData.subarray(pos, pos + SALT_SIZE)
	pos += SALT_SIZE
	const nonce = encryptedData.subarray(pos, pos + NONCE_SIZE)
	pos += NONCE_SIZE
	const ciphertext = encryptedData.subarray(pos, -TAG_SIZE)
	const tag = encryptedData.subarray(-TAG_SIZE)

	if (ciphertext.length === 0) {
		throw new CryptoError('encrypted data should not be null')
	}
	if (ciphertext.length % BLOCK_SIZE !== 0) {
		throw new CryptoError('expected data to be a multiple of 64 bytes')
	}

	const key = deriveSymmetricKey(password, salt)
	const cipher = chacha20poly1305(key, nonce)

	try {
		// Ghép ciphertext + tag để decrypt
		const fullEncrypted = new Uint8Array([...ciphertext, ...tag])
		return cipher.decrypt(fullEncrypted)
	} catch (e) {
		throw new CryptoError('wrong password')
	}
}

// Hàm generate (tương đương Rust generate) - Cho Ed25519Extended secret (64 bytes)
export function generate(privateKey: Uint8Array, password: Uint8Array): string {
	if (!(privateKey instanceof Uint8Array) || privateKey.length !== 64) {
		throw new CryptoError('invalid secret key') // Giả sử check 64 bytes cho Ed25519Extended
	}
	if (!(password instanceof Uint8Array)) password = new Uint8Array(password)

	const encrypted = encrypt(password, privateKey)
	return bytesToHex(encrypted)
}

// Hàm decode (tương đương Rust decode) - Trả về secret 64 bytes
export function decode(hexPayload: string, password: Uint8Array): Uint8Array {
	if (typeof hexPayload !== 'string') {
		throw new CryptoError('invalid payload')
	}
	if (!(password instanceof Uint8Array)) password = new Uint8Array(password)

	let encryptedBytes
	try {
		encryptedBytes = hexToBytes(hexPayload)
	} catch (e) {
		throw new CryptoError('failed to decode hex')
	}

	const decrypted = decrypt(password, encryptedBytes)
	if (decrypted.length !== 64) {
		throw new CryptoError('invalid secret key')
	}
	return decrypted
}

// Ví dụ test (tương tự Rust test)
function test() {
	const password = new Uint8Array([1, 2, 3, 4]) // Mock password
	const mockPrivateKey = new Uint8Array(64).fill(42) // Mock 64 bytes secret

	const encoded = generate(mockPrivateKey, password)
	console.log('Encoded (hex):', encoded)
	console.log('Encoded length:', encoded.length) // Nên là 218 (109 bytes * 2)

	const decoded = decode(encoded, password)
	console.log('>>> / crypto-utils.ts:152 / decoded:', bytesToHex(decoded))

	console.log(
		'Match:',
		decoded.every((v, i) => v === mockPrivateKey[i])
	) // True
}

test()
