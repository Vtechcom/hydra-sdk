import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { metadataObjToMetadatum } from '../../../src/utils/metadata'

/** Detailed-schema JSON text of the converted metadatum (the form cardano-cli prints). */
const convertRaw = (value: Parameters<typeof metadataObjToMetadatum>[0]) => {
	const metadatum = metadataObjToMetadatum(value)
	try {
		return CardanoWASM.decode_metadatum_to_json_str(metadatum, CardanoWASM.MetadataJsonSchema.DetailedSchema)
	} finally {
		metadatum.free()
	}
}
const convert = (value: Parameters<typeof metadataObjToMetadatum>[0]) => JSON.parse(convertRaw(value))

describe('metadataObjToMetadatum', () => {
	it.each([
		['string', 'hello', { string: 'hello' }],
		['number', 42, { int: 42 }],
		['negative number', -42, { int: -42 }],
		['bytes', new Uint8Array([1, 2, 255]), { bytes: '0102ff' }],
		['empty array', [], { list: [] }],
		['empty object', {}, { map: [] }]
	])('converts a %s', (_name, value, expected) => {
		expect(convert(value)).toEqual(expected)
	})

	it('keeps a bigint at i64 max exact', () => {
		expect(convertRaw(9223372036854775807n).replace(/\s/g, '')).toBe('{"int":9223372036854775807}')
	})

	it('converts nested objects and arrays recursively, keeping key order', () => {
		expect(convert({ msg: ['a', 1], nft: { name: 'X' } })).toEqual({
			map: [
				{ k: { string: 'msg' }, v: { list: [{ string: 'a' }, { int: 1 }] } },
				{ k: { string: 'nft' }, v: { map: [{ k: { string: 'name' }, v: { string: 'X' } }] } }
			]
		})
	})

	it('converts a Map with non-string keys', () => {
		expect(convert(new Map<unknown, unknown>([[1, 'one']]))).toEqual({ map: [{ k: { int: 1 }, v: { string: 'one' } }] })
	})

	it.each([
		['boolean', true],
		['null', null]
	])('rejects a %s', (_name, value) => {
		expect(() => metadataObjToMetadatum(value as never)).toThrow(/Unsupported metadata type/)
	})
})
