import { describe, it, expect } from 'vitest'
import { metadataObjToMetadatum } from '../../../src/utils/metadata'
import { wasmScope } from '../../helpers/wasm'

describe('MetadataUtils.metadataObjToMetadatum', () => {
	const keep = wasmScope()
	const toHex = (value: Parameters<typeof metadataObjToMetadatum>[0]) => keep(metadataObjToMetadatum(value)).to_hex()

	// Expected values are hand-encoded CBOR (RFC 8949).
	it.each([
		['positive int', 42, '182a'],
		['zero', 0, '00'],
		['negative int', -100, '3863'],
		['max safe integer', Number.MAX_SAFE_INTEGER, '1b001fffffffffffff'],
		['bigint beyond 2^53', 12345678901234567890n, '1bab54a98ceb1f0ad2'],
		['negative bigint', -999999999999999n, '3b00038d7ea4c67ffe'],
		['text', 'Hello', '6548656c6c6f'],
		['empty text', '', '60'],
		['bytes', Uint8Array.from([0xca, 0xfe]), '42cafe'],
		['list', [1, 'a', [2]], '8301616181' + '02'],
		['object as map', { k: 'v' }, 'a1616b6176'],
		['Map with non-string keys', new Map<unknown, unknown>([[1, Uint8Array.from([0xca, 0xfe])]]), 'a10142cafe']
	])('encodes %s', (_name, value, cbor) => {
		expect(toHex(value)).toBe(cbor)
	})

	it('nests CIP-25 style metadata', () => {
		const metadatum = keep(metadataObjToMetadatum({ policy: { nft: { name: 'A', files: ['ipfs://x'] } } }))
		const nft = keep(keep(keep(metadatum.as_map()).get_str('policy')).as_map()).get_str('nft')

		expect(keep(keep(keep(nft).as_map()).get_str('name')).as_text()).toBe('A')
	})

	describe('64-byte limits', () => {
		it.each([
			['64 ASCII characters', 'a'.repeat(64)],
			['21 three-byte characters (63 bytes)', 'こ'.repeat(21)]
		])('accepts text of %s', (_name, text) => {
			expect(keep(keep(metadataObjToMetadatum(text)).as_text())).toBe(text)
		})

		it.each([
			['65 ASCII characters', 'a'.repeat(65), 65],
			['22 three-byte characters (66 bytes, 22 chars)', 'こ'.repeat(22), 66]
		])('rejects text of %s, counting UTF-8 bytes', (_name, text, bytes) => {
			expect(() => metadataObjToMetadatum(text)).toThrow(
				new RegExp(`string exceeds maximum length of 64 bytes \\(got ${bytes} bytes\\)`)
			)
		})

		it('accepts 64 bytes and rejects 65 bytes of binary data', () => {
			expect(toHex(new Uint8Array(64))).toBe('5840' + '00'.repeat(64))
			expect(() => metadataObjToMetadatum(new Uint8Array(65))).toThrow(
				/bytes exceeds maximum length of 64 bytes \(got 65 bytes\)/
			)
		})

		it('applies the limit to nested values', () => {
			expect(() => metadataObjToMetadatum({ name: 'a'.repeat(65) })).toThrow(/string exceeds maximum length/)
			expect(() => metadataObjToMetadatum(['ok', new Uint8Array(65)])).toThrow(/bytes exceeds maximum length/)
		})
	})

	it.each([1.5, -0.1, NaN, Infinity])('rejects the non-integer number %s', value => {
		expect(() => metadataObjToMetadatum(value)).toThrow(new RegExp(`number must be an integer, got ${value}`))
	})

	it.each([
		['undefined', undefined],
		['object', null],
		['boolean', true],
		['function', () => 1],
		['symbol', Symbol('x')]
	])('rejects values of type %s', (type, value) => {
		expect(() => metadataObjToMetadatum(value as never)).toThrow(`Unsupported metadata type "${type}"`)
	})
})
