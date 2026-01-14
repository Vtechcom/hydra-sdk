// The following code is adapted from the noble-hashes library, available at:
// https://github.com/paulmillr/noble-hashes
//
// These utility functions have been specifically designed to ensure compatibility
// with browser environments. The original source can be found here:
// https://github.com/paulmillr/noble-hashes/blob/main/src/utils.ts

function assert_bytes(b: Uint8Array | undefined, ...lengths: number[]) {
	if (!isBytes(b)) throw new Error('Uint8Array expected')
	if (lengths.length > 0 && !lengths.includes(b.length))
		throw new Error(`Uint8Array expected of length ${lengths}, not of length=${b.length}`)
}

export function isBytes(a: unknown): a is Uint8Array {
	return a instanceof Uint8Array || (a != null && typeof a === 'object' && a.constructor.name === 'Uint8Array')
}

// We use optimized technique to convert hex string to byte array
const asciis = { _0: 48, _9: 57, _A: 65, _F: 70, _a: 97, _f: 102 } as const
function asciiToBase16(char: number): number | undefined {
	if (char >= asciis._0 && char <= asciis._9) return char - asciis._0
	if (char >= asciis._A && char <= asciis._F) return char - (asciis._A - 10)
	if (char >= asciis._a && char <= asciis._f) return char - (asciis._a - 10)
	return
}

// Array where index 0xf0 (240) is mapped to string 'f0'
const hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'))

// -----------------------------------------------------------------------

/**
 * Converting bytes to hex string
 * @param bytes The bytes to be converted
 * @returns The hex string
 * @example bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])) -> 'cafe0123'
 */
export const bytesToHex = (bytes: ArrayBuffer | Uint8Array | Buffer): string => {
	bytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
	assert_bytes(bytes)
	// pre-caching improves the speed 6x
	let hex = ''
	for (let i = 0; i < bytes.length; i++) {
		hex += hexes[bytes[i]]
	}
	return hex
}

/**
 * Converting hex string to bytes
 * @param hex The hex string to be converted
 * @returns The bytes
 * @example hexToBytes('cafe0123') -> Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
 */
export const hexToBytes = (hex: string) => {
	if (typeof hex !== 'string') throw new Error('hex string expected, got ' + typeof hex)
	const hl = hex.length
	const al = hl / 2
	if (hl % 2) throw new Error('padded hex string expected, got unpadded hex of length ' + hl)
	const array = new Uint8Array(al)
	for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
		const n1 = asciiToBase16(hex.charCodeAt(hi))
		const n2 = asciiToBase16(hex.charCodeAt(hi + 1))
		if (n1 === undefined || n2 === undefined) {
			const char = hex[hi] + hex[hi + 1]
			throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi)
		}
		array[ai] = n1 * 16 + n2
	}
	return array
}

/**
 * Converting utf8 string to hex string
 * @param str The utf8 string to be converted
 * @returns The hex string
 * @example stringToHex('hello') -> '68656c6c6f'
 */
export const stringToHex = (str: string): string => {
	const bytes = new TextEncoder().encode(str)
	return bytesToHex(bytes)
}

/**
 * Converting hex string to utf8 string
 * @param hex The hex string to be converted
 * @returns The utf8 string
 * @example hexToString('68656c6c6f') -> 'hello'
 */
export const hexToString = (hex: string): string => {
	const bytes = hexToBytes(hex)
	return new TextDecoder().decode(bytes)
}

/**
 * Converting either hex string or utf8 string to bytes
 * @param hex The hex or utf8 string to be converted
 * @returns The bytes
 * @example toBytes('cafe') -> Uint8Array [0xca, 0xfe]
 * @example toBytes('hello') -> Uint8Array [0x68, 0x65, 0x6c, 0x6c, 0x6f]
 */
export const toBytes = (hex: string): Uint8Array => {
	// Check if valid hex string (even length + only hex chars)
	if (hex.length % 2 === 0 && /^[0-9A-Fa-f]*$/i.test(hex)) {
		return hexToBytes(hex)
	}
	// Otherwise treat as UTF-8 string
	return new TextEncoder().encode(hex)
}

/**
 * Converting utf8 string to hex string
 * @param utf8 The utf8 string to be converted
 * @returns The hex string
 * @deprecated Use stringToHex instead
 */
export const fromUTF8 = (utf8: string): string => {
	return stringToHex(utf8)
}

/**
 * Converting hex string to utf8 string
 * @param hex The hex string to be converted
 * @returns The utf8 string
 * @deprecated Use hexToString instead
 */
export const toUTF8 = (hex: string): string => {
	return hexToString(hex)
}
