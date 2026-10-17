import { describe, it, expect } from 'vitest'
import * as ParserUtils from '../../../src/utils/parser'

describe('ParserUtils', () => {
	it.each([
		['', []],
		['cafe0123', [0xca, 0xfe, 0x01, 0x23]],
		['00ff10', [0x00, 0xff, 0x10]]
	])('hexToBytes(%j) / bytesToHex round-trip', (hex, bytes) => {
		expect(Array.from(ParserUtils.hexToBytes(hex))).toEqual(bytes)
		expect(ParserUtils.bytesToHex(Uint8Array.from(bytes))).toBe(hex)
	})

	it('hexToBytes accepts upper-case hex; bytesToHex emits lower-case and accepts ArrayBuffer/Buffer', () => {
		expect(Array.from(ParserUtils.hexToBytes('CAFE'))).toEqual([0xca, 0xfe])
		expect(ParserUtils.bytesToHex(Uint8Array.from([0xca, 0xfe]).buffer)).toBe('cafe')
		expect(ParserUtils.bytesToHex(Buffer.from('CAFE', 'hex'))).toBe('cafe')
	})

	it.each([
		['abc', /padded hex string expected, got unpadded hex of length 3/],
		['zz00', /hex string expected, got non-hex character "zz" at index 0/],
		['00g1', /non-hex character "g1" at index 2/],
		[42, /hex string expected, got number/]
	])('hexToBytes rejects %j', (input, error) => {
		expect(() => ParserUtils.hexToBytes(input as string)).toThrow(error)
	})

	it.each([
		['hello', '68656c6c6f'],
		['', ''],
		['こんにちは', 'e38193e38293e381abe381a1e381af']
	])('stringToHex(%j) / hexToString round-trip as UTF-8', (text, hex) => {
		expect(ParserUtils.stringToHex(text)).toBe(hex)
		expect(ParserUtils.hexToString(hex)).toBe(text)
		expect(ParserUtils.fromUTF8(text)).toBe(hex)
		expect(ParserUtils.toUTF8(hex)).toBe(text)
	})

	it.each([
		['even-length hex is decoded as hex', 'cafe', [0xca, 0xfe]],
		['odd-length hex-looking text is UTF-8', 'abc', [0x61, 0x62, 0x63]],
		['non-hex text is UTF-8', 'hello', [0x68, 0x65, 0x6c, 0x6c, 0x6f]],
		['empty string is empty bytes', '', []]
	])('toBytes: %s', (_name, input, bytes) => {
		expect(Array.from(ParserUtils.toBytes(input))).toEqual(bytes)
	})

	it('isBytes recognises Uint8Array (and subclasses) only', () => {
		expect(ParserUtils.isBytes(new Uint8Array(1))).toBe(true)
		expect(ParserUtils.isBytes(Buffer.alloc(1))).toBe(true)
		expect(ParserUtils.isBytes([1, 2])).toBe(false)
		expect(ParserUtils.isBytes(null)).toBe(false)
	})
})
