import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import {
	bigIntReplacer,
	bigIntReviver,
	convertBigIntToString,
	convertStringToBigInt,
	safeStringify,
	safeParse,
	transformForApiResponse,
	createBigIntConverter,
	hasBigIntValues,
	needsBigIntConversion
} from '../../src/utils/bigint.utils'
import { metadataObjToMetadatum } from '../../src/utils/metadata'
import { datumBuilder } from '../../src/utils/datum-builder'
import { buildRedeemer, emptyRedeemer } from '../../src/utils/redeemer-builder'

describe('BigInt Utilities', () => {
	describe('bigIntReplacer', () => {
		it('should convert BigInt to string with n suffix', () => {
			const result = bigIntReplacer('key', BigInt(123))
			expect(result).toBe('123n')
		})

		it('should return non-BigInt values unchanged', () => {
			expect(bigIntReplacer('key', 'string')).toBe('string')
			expect(bigIntReplacer('key', 42)).toBe(42)
			expect(bigIntReplacer('key', null)).toBe(null)
			expect(bigIntReplacer('key', true)).toBe(true)
		})

		it('should handle zero BigInt', () => {
			const result = bigIntReplacer('key', BigInt(0))
			expect(result).toBe('0n')
		})

		it('should handle large BigInt values', () => {
			const large = BigInt('999999999999999999999999999999')
			const result = bigIntReplacer('key', large)
			expect(result).toBe('999999999999999999999999999999n')
		})
	})

	describe('bigIntReviver', () => {
		it('should convert string with n suffix back to BigInt', () => {
			const result = bigIntReviver('key', '123n')
			expect(result).toBe(BigInt(123))
		})

		it('should return non-BigInt strings unchanged', () => {
			expect(bigIntReviver('key', 'hello')).toBe('hello')
			expect(bigIntReviver('key', '123')).toBe('123')
			expect(bigIntReviver('key', '123x')).toBe('123x')
		})

		it('should return non-string values unchanged', () => {
			expect(bigIntReviver('key', 42)).toBe(42)
			expect(bigIntReviver('key', null)).toBe(null)
			expect(bigIntReviver('key', true)).toBe(true)
		})

		it('should handle zero BigInt string', () => {
			const result = bigIntReviver('key', '0n')
			expect(result).toBe(BigInt(0))
		})

		it('should handle large BigInt strings', () => {
			const result = bigIntReviver('key', '999999999999999999999999999999n')
			expect(result).toBe(BigInt('999999999999999999999999999999'))
		})

		it('should not convert invalid number strings with n suffix', () => {
			expect(bigIntReviver('key', 'abcn')).toBe('abcn')
			expect(bigIntReviver('key', '12.34n')).toBe('12.34n')
			expect(bigIntReviver('key', '-123n')).toBe('-123n')
		})
	})

	describe('convertBigIntToString', () => {
		it('should convert BigInt to string', () => {
			const result = convertBigIntToString(BigInt(123))
			expect(result).toBe('123')
		})

		it('should return null and undefined unchanged', () => {
			expect(convertBigIntToString(null)).toBe(null)
			expect(convertBigIntToString(undefined)).toBe(undefined)
		})

		it('should handle arrays with BigInt', () => {
			const arr = [BigInt(1), BigInt(2), BigInt(3)]
			const result = convertBigIntToString(arr)
			expect(result).toEqual(['1', '2', '3'])
		})

		it('should handle mixed arrays', () => {
			const arr = [BigInt(1), 'hello', 42, true]
			const result = convertBigIntToString(arr)
			expect(result).toEqual(['1', 'hello', 42, true])
		})

		it('should handle nested objects', () => {
			const obj = {
				a: BigInt(123),
				b: 'test',
				c: {
					d: BigInt(456),
					e: 'nested'
				}
			}
			const result = convertBigIntToString(obj)
			expect(result).toEqual({
				a: '123',
				b: 'test',
				c: {
					d: '456',
					e: 'nested'
				}
			})
		})

		it('should handle arrays inside objects', () => {
			const obj = {
				values: [BigInt(1), BigInt(2)],
				name: 'test'
			}
			const result = convertBigIntToString(obj)
			expect(result).toEqual({
				values: ['1', '2'],
				name: 'test'
			})
		})

		it('should handle deeply nested structures', () => {
			const obj = {
				level1: {
					level2: {
						level3: {
							value: BigInt(999)
						}
					}
				}
			}
			const result = convertBigIntToString(obj)
			expect(result).toEqual({
				level1: {
					level2: {
						level3: {
							value: '999'
						}
					}
				}
			})
		})

		it('should return primitives unchanged', () => {
			expect(convertBigIntToString('string')).toBe('string')
			expect(convertBigIntToString(42)).toBe(42)
			expect(convertBigIntToString(true)).toBe(true)
		})
	})

	describe('convertStringToBigInt', () => {
		it('should return null and undefined unchanged', () => {
			expect(convertStringToBigInt(null)).toBe(null)
			expect(convertStringToBigInt(undefined)).toBe(undefined)
		})

		it('should convert specified fields to BigInt', () => {
			const obj = { amount: '123', name: 'test' }
			const result = convertStringToBigInt(obj, ['amount'])
			expect(result).toEqual({ amount: BigInt(123), name: 'test' })
		})

		it('should handle arrays', () => {
			const arr = [{ amount: '100' }, { amount: '200' }]
			const result = convertStringToBigInt(arr, ['amount'])
			expect(result).toEqual([{ amount: BigInt(100) }, { amount: BigInt(200) }])
		})

		it('should handle nested objects', () => {
			const obj = {
				data: {
					value: '999',
					label: 'test'
				}
			}
			const result = convertStringToBigInt(obj, ['value'])
			expect(result).toEqual({
				data: {
					value: BigInt(999),
					label: 'test'
				}
			})
		})

		it('should not convert non-numeric strings', () => {
			const obj = { amount: 'abc', name: 'test' }
			const result = convertStringToBigInt(obj, ['amount'])
			expect(result).toEqual({ amount: 'abc', name: 'test' })
		})

		it('should return primitives unchanged', () => {
			expect(convertStringToBigInt('string')).toBe('string')
			expect(convertStringToBigInt(42)).toBe(42)
		})
	})

	describe('safeStringify', () => {
		it('should stringify object with BigInt', () => {
			const obj = { amount: BigInt(123), name: 'test' }
			const result = safeStringify(obj)
			expect(result).toBe('{"amount":"123n","name":"test"}')
		})

		it('should support space parameter', () => {
			const obj = { amount: BigInt(1) }
			const result = safeStringify(obj, 2)
			expect(result).toContain('\n')
			expect(result).toContain('"amount": "1n"')
		})

		it('should handle nested BigInt', () => {
			const obj = {
				data: {
					value: BigInt(456)
				}
			}
			const result = safeStringify(obj)
			expect(result).toContain('"value":"456n"')
		})

		it('should handle arrays with BigInt', () => {
			const arr = [BigInt(1), BigInt(2)]
			const result = safeStringify(arr)
			expect(result).toBe('["1n","2n"]')
		})
	})

	describe('safeParse', () => {
		it('should parse JSON with BigInt strings', () => {
			const json = '{"amount":"123n","name":"test"}'
			const result = safeParse(json)
			expect(result.amount).toBe(BigInt(123))
			expect(result.name).toBe('test')
		})

		it('should handle nested BigInt strings', () => {
			const json = '{"data":{"value":"456n"}}'
			const result = safeParse(json)
			expect(result.data.value).toBe(BigInt(456))
		})

		it('should handle arrays with BigInt strings', () => {
			const json = '["1n","2n","3n"]'
			const result = safeParse(json)
			expect(result).toEqual([BigInt(1), BigInt(2), BigInt(3)])
		})

		it('should round-trip with safeStringify', () => {
			const original = {
				id: BigInt(123),
				values: [BigInt(1), BigInt(2)],
				nested: { amount: BigInt(999) }
			}
			const json = safeStringify(original)
			const parsed = safeParse(json)
			expect(parsed).toEqual(original)
		})
	})

	describe('transformForApiResponse', () => {
		it('should transform object and track BigInt fields', () => {
			const obj = { amount: BigInt(123), name: 'test' }
			const result = transformForApiResponse(obj)
			expect(result.data).toEqual({ amount: '123', name: 'test' })
			expect(result.bigIntFields).toContain('amount')
		})

		it('should handle nested BigInt fields', () => {
			const obj = {
				data: {
					value: BigInt(456)
				}
			}
			const result = transformForApiResponse(obj)
			expect(result.data.data.value).toBe('456')
			expect(result.bigIntFields).toContain('data.value')
		})

		it('should handle arrays', () => {
			const obj = { values: [BigInt(1), BigInt(2)] }
			const result = transformForApiResponse(obj)
			expect(result.data.values).toEqual(['1', '2'])
			expect(result.bigIntFields).toContain('values[0]')
			expect(result.bigIntFields).toContain('values[1]')
		})

		it('should return null and undefined unchanged', () => {
			expect(transformForApiResponse(null).data).toBe(null)
			expect(transformForApiResponse(undefined).data).toBe(undefined)
		})

		it('should not include bigIntFields when none present', () => {
			const obj = { name: 'test', count: 42 }
			const result = transformForApiResponse(obj)
			expect(result.bigIntFields).toBeUndefined()
		})

		it('should handle empty objects', () => {
			const result = transformForApiResponse({})
			expect(result.data).toEqual({})
			expect(result.bigIntFields).toBeUndefined()
		})
	})

	describe('createBigIntConverter', () => {
		it('should create a converter with convert function', () => {
			const converter = createBigIntConverter<{ amount: bigint }>()
			expect(converter.convert).toBeDefined()
			expect(typeof converter.convert).toBe('function')
		})

		it('should convert using the created converter', () => {
			const converter = createBigIntConverter<{ amount: bigint }>()
			const result = converter.convert({ amount: BigInt(123) })
			expect(result).toEqual({ amount: '123' })
		})
	})

	describe('hasBigIntValues', () => {
		it('should return true for BigInt', () => {
			expect(hasBigIntValues(BigInt(123))).toBe(true)
		})

		it('should return false for non-BigInt primitives', () => {
			expect(hasBigIntValues('string')).toBe(false)
			expect(hasBigIntValues(42)).toBe(false)
			expect(hasBigIntValues(true)).toBe(false)
			expect(hasBigIntValues(null)).toBe(false)
			expect(hasBigIntValues(undefined)).toBe(false)
		})

		it('should return true for object containing BigInt', () => {
			expect(hasBigIntValues({ amount: BigInt(123) })).toBe(true)
		})

		it('should return true for nested BigInt', () => {
			const obj = { data: { value: BigInt(123) } }
			expect(hasBigIntValues(obj)).toBe(true)
		})

		it('should return true for array containing BigInt', () => {
			expect(hasBigIntValues([BigInt(1), BigInt(2)])).toBe(true)
		})

		it('should return false for object without BigInt', () => {
			expect(hasBigIntValues({ name: 'test', count: 42 })).toBe(false)
		})

		it('should return false for array without BigInt', () => {
			expect(hasBigIntValues([1, 2, 3])).toBe(false)
		})
	})

	describe('needsBigIntConversion', () => {
		it('should return true for objects with BigInt', () => {
			expect(needsBigIntConversion({ amount: BigInt(123) })).toBe(true)
		})

		it('should return false for objects without BigInt', () => {
			expect(needsBigIntConversion({ name: 'test' })).toBe(false)
		})

		it('should work as type guard', () => {
			const obj: unknown = { amount: BigInt(123) }
			if (needsBigIntConversion(obj)) {
				// TypeScript now knows obj has string keys
				expect(typeof obj).toBe('object')
			}
		})
	})
})

describe('Metadata Utilities', () => {
	describe('metadataObjToMetadatum', () => {
		it('should convert bigint to TransactionMetadatum', () => {
			const result = metadataObjToMetadatum(BigInt(123))
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(CardanoWASM.TransactionMetadatum)
		})

		it('should convert string to TransactionMetadatum', () => {
			const result = metadataObjToMetadatum('hello world')
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(CardanoWASM.TransactionMetadatum)
		})

		it('should convert number to TransactionMetadatum', () => {
			const result = metadataObjToMetadatum(42)
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(CardanoWASM.TransactionMetadatum)
		})

		it('should convert Uint8Array to TransactionMetadatum', () => {
			const bytes = new Uint8Array([1, 2, 3, 4])
			const result = metadataObjToMetadatum(bytes)
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(CardanoWASM.TransactionMetadatum)
		})

		it('should convert array to TransactionMetadatum list', () => {
			const arr = [1, 2, 3]
			const result = metadataObjToMetadatum(arr)
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(CardanoWASM.TransactionMetadatum)
		})

		it('should convert nested arrays', () => {
			const arr = [
				[1, 2],
				[3, 4]
			]
			const result = metadataObjToMetadatum(arr)
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(CardanoWASM.TransactionMetadatum)
		})

		it('should convert object to TransactionMetadatum map', () => {
			const obj = { key1: 'value1', key2: 42 }
			const result = metadataObjToMetadatum(obj)
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(CardanoWASM.TransactionMetadatum)
		})

		it('should convert Map to TransactionMetadatum map', () => {
			const map = new Map<string, any>()
			map.set('key1', 'value1')
			map.set('key2', 42)
			const result = metadataObjToMetadatum(map)
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(CardanoWASM.TransactionMetadatum)
		})

		it('should handle nested objects', () => {
			const obj = {
				level1: {
					level2: {
						value: 'deep'
					}
				}
			}
			const result = metadataObjToMetadatum(obj)
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(CardanoWASM.TransactionMetadatum)
		})

		it('should handle mixed arrays with objects', () => {
			const arr = [1, 'hello', { key: 'value' }]
			const result = metadataObjToMetadatum(arr)
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(CardanoWASM.TransactionMetadatum)
		})

		it('should handle empty array', () => {
			const result = metadataObjToMetadatum([])
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(CardanoWASM.TransactionMetadatum)
		})

		it('should handle empty object', () => {
			const result = metadataObjToMetadatum({})
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(CardanoWASM.TransactionMetadatum)
		})

		it('should handle negative numbers', () => {
			const result = metadataObjToMetadatum(-42)
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(CardanoWASM.TransactionMetadatum)
		})

		it('should handle max safe bigint', () => {
			// BigInt must fit within 64-bit signed integer for metadata
			const maxSafe = BigInt('9223372036854775807')
			const result = metadataObjToMetadatum(maxSafe)
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(CardanoWASM.TransactionMetadatum)
		})

		it('should handle zero bigint', () => {
			const result = metadataObjToMetadatum(BigInt(0))
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(CardanoWASM.TransactionMetadatum)
		})

		it('should handle deeply nested structure', () => {
			const deep = {
				l1: {
					l2: {
						l3: {
							value: 'deep',
							numbers: [1, 2, 3]
						}
					}
				}
			}
			const result = metadataObjToMetadatum(deep)
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(CardanoWASM.TransactionMetadatum)
		})
	})
})

describe('Datum Builder', () => {
	describe('datumBuilder', () => {
		it('should return PlutusData', () => {
			const result = datumBuilder()
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(CardanoWASM.PlutusData)
		})

		it('should return valid hex representation', () => {
			const result = datumBuilder()
			const hex = result.to_hex()
			expect(hex).toBeDefined()
			expect(typeof hex).toBe('string')
		})
	})
})

describe('Redeemer Builder', () => {
	describe('buildRedeemer', () => {
		it('should build a redeemer with default options', () => {
			const redeemer = buildRedeemer({ key: 'value' })
			expect(redeemer).toBeDefined()
			expect(redeemer).toBeInstanceOf(CardanoWASM.Redeemer)
		})

		it('should build a redeemer with SPEND tag', () => {
			const redeemer = buildRedeemer({ key: 'value' }, { tag: 'SPEND' })
			expect(redeemer).toBeDefined()
			expect(redeemer.tag().kind()).toBe(CardanoWASM.RedeemerTagKind.Spend)
		})

		it('should build a redeemer with MINT tag', () => {
			const redeemer = buildRedeemer({ key: 'value' }, { tag: 'MINT' })
			expect(redeemer).toBeDefined()
			expect(redeemer.tag().kind()).toBe(CardanoWASM.RedeemerTagKind.Mint)
		})

		it('should build a redeemer with CERT tag', () => {
			const redeemer = buildRedeemer({ key: 'value' }, { tag: 'CERT' })
			expect(redeemer).toBeDefined()
			expect(redeemer.tag().kind()).toBe(CardanoWASM.RedeemerTagKind.Cert)
		})

		it('should build a redeemer with REWARD tag', () => {
			const redeemer = buildRedeemer({ key: 'value' }, { tag: 'REWARD' })
			expect(redeemer).toBeDefined()
			expect(redeemer.tag().kind()).toBe(CardanoWASM.RedeemerTagKind.Reward)
		})

		it('should build a redeemer with VOTE tag', () => {
			const redeemer = buildRedeemer({ key: 'value' }, { tag: 'VOTE' })
			expect(redeemer).toBeDefined()
			expect(redeemer.tag().kind()).toBe(CardanoWASM.RedeemerTagKind.Vote)
		})

		it('should build a redeemer with VOTING_PROPOSAL tag', () => {
			const redeemer = buildRedeemer({ key: 'value' }, { tag: 'VOTING_PROPOSAL' })
			expect(redeemer).toBeDefined()
			expect(redeemer.tag().kind()).toBe(CardanoWASM.RedeemerTagKind.VotingProposal)
		})

		it('should build a redeemer with custom index', () => {
			const redeemer = buildRedeemer({ key: 'value' }, { index: 5 })
			expect(redeemer).toBeDefined()
			expect(redeemer.index().to_str()).toBe('5')
		})

		it('should build a redeemer with string index', () => {
			const redeemer = buildRedeemer({ key: 'value' }, { index: '10' })
			expect(redeemer).toBeDefined()
			expect(redeemer.index().to_str()).toBe('10')
		})

		it('should build a redeemer with custom exUnits', () => {
			const redeemer = buildRedeemer(
				{ key: 'value' },
				{
					exUnits: { mem: '200000', steps: '20000000' }
				}
			)
			expect(redeemer).toBeDefined()
			const exUnits = redeemer.ex_units()
			expect(exUnits.mem().to_str()).toBe('200000')
			expect(exUnits.steps().to_str()).toBe('20000000')
		})

		it('should use default exUnits when not provided', () => {
			const redeemer = buildRedeemer({ key: 'value' })
			const exUnits = redeemer.ex_units()
			expect(exUnits.mem().to_str()).toBe('100000')
			expect(exUnits.steps().to_str()).toBe('10000000')
		})

		it('should build redeemer with multiple fields', () => {
			const redeemer = buildRedeemer({
				field1: 'value1',
				field2: 'value2',
				field3: 'value3'
			})
			expect(redeemer).toBeDefined()
			expect(redeemer.data()).toBeDefined()
		})

		it('should have valid PlutusData', () => {
			const redeemer = buildRedeemer({ key: 'test' })
			const data = redeemer.data()
			expect(data).toBeDefined()
			expect(data.to_hex()).toBeDefined()
		})
	})

	describe('emptyRedeemer', () => {
		it('should create empty redeemer with default options', () => {
			const redeemer = emptyRedeemer()
			expect(redeemer).toBeDefined()
			expect(redeemer).toBeInstanceOf(CardanoWASM.Redeemer)
		})

		it('should create empty redeemer with int type', () => {
			const redeemer = emptyRedeemer({ type: 'int' })
			expect(redeemer).toBeDefined()
			const data = redeemer.data()
			expect(data.as_integer()).toBeDefined()
		})

		it('should create empty redeemer with bytes type', () => {
			const redeemer = emptyRedeemer({ type: 'bytes' })
			expect(redeemer).toBeDefined()
			const data = redeemer.data()
			expect(data.as_bytes()).toBeDefined()
		})

		it('should create empty redeemer with list type', () => {
			const redeemer = emptyRedeemer({ type: 'list' })
			expect(redeemer).toBeDefined()
			const data = redeemer.data()
			expect(data.as_list()).toBeDefined()
		})

		it('should create empty redeemer with map type', () => {
			const redeemer = emptyRedeemer({ type: 'map' })
			expect(redeemer).toBeDefined()
			const data = redeemer.data()
			expect(data.as_map()).toBeDefined()
		})

		it('should create empty redeemer with constr type', () => {
			const redeemer = emptyRedeemer({ type: 'constr' })
			expect(redeemer).toBeDefined()
			const data = redeemer.data()
			expect(data.as_constr_plutus_data()).toBeDefined()
		})

		it('should create empty redeemer with SPEND tag', () => {
			const redeemer = emptyRedeemer({ tag: 'SPEND' })
			expect(redeemer.tag().kind()).toBe(CardanoWASM.RedeemerTagKind.Spend)
		})

		it('should create empty redeemer with MINT tag', () => {
			const redeemer = emptyRedeemer({ tag: 'MINT' })
			expect(redeemer.tag().kind()).toBe(CardanoWASM.RedeemerTagKind.Mint)
		})

		it('should create empty redeemer with custom index', () => {
			const redeemer = emptyRedeemer({ index: 3 })
			expect(redeemer.index().to_str()).toBe('3')
		})

		it('should create empty redeemer with custom exUnits', () => {
			const redeemer = emptyRedeemer({
				exUnits: { mem: '500000', steps: '50000000' }
			})
			const exUnits = redeemer.ex_units()
			expect(exUnits.mem().to_str()).toBe('500000')
			expect(exUnits.steps().to_str()).toBe('50000000')
		})

		it('should throw for unknown type', () => {
			expect(() => emptyRedeemer({ type: 'unknown' as any })).toThrow('Unknown plutus data type')
		})

		it('should create redeemer with all options combined', () => {
			const redeemer = emptyRedeemer({
				tag: 'MINT',
				index: 2,
				type: 'bytes',
				exUnits: { mem: '300000', steps: '30000000' }
			})
			expect(redeemer.tag().kind()).toBe(CardanoWASM.RedeemerTagKind.Mint)
			expect(redeemer.index().to_str()).toBe('2')
			expect(redeemer.data().as_bytes()).toBeDefined()
			expect(redeemer.ex_units().mem().to_str()).toBe('300000')
			expect(redeemer.ex_units().steps().to_str()).toBe('30000000')
		})

		it('should handle string index', () => {
			const redeemer = emptyRedeemer({ index: '7' })
			expect(redeemer.index().to_str()).toBe('7')
		})
	})

	describe('redeemer tag edge cases', () => {
		it('should throw for unknown redeemer tag', () => {
			expect(() => buildRedeemer({ key: 'value' }, { tag: 'UNKNOWN' as any })).toThrow('Unknown redeemer tag type')
		})
	})
})

describe('Integration Tests', () => {
	describe('BigInt and Metadata integration', () => {
		it('should handle BigInt in metadata workflow', () => {
			const original = { amount: BigInt(1000000), label: 'test' }

			// Convert for API
			const apiResponse = transformForApiResponse(original)
			expect(apiResponse.data.amount).toBe('1000000')

			// The original BigInt can be used with metadata
			const metadata = metadataObjToMetadatum(original.amount)
			expect(metadata).toBeDefined()
		})
	})

	describe('Redeemer serialization', () => {
		it('should serialize and deserialize redeemer', () => {
			const redeemer = buildRedeemer({ key: 'value' }, { tag: 'SPEND', index: 0 })
			const hex = redeemer.to_hex()
			expect(hex).toBeDefined()

			const parsed = CardanoWASM.Redeemer.from_hex(hex)
			expect(parsed.index().to_str()).toBe('0')
			expect(parsed.tag().kind()).toBe(CardanoWASM.RedeemerTagKind.Spend)
		})

		it('should serialize empty redeemer', () => {
			const redeemer = emptyRedeemer({ type: 'int' })
			const hex = redeemer.to_hex()
			expect(hex).toBeDefined()

			const parsed = CardanoWASM.Redeemer.from_hex(hex)
			expect(parsed).toBeDefined()
		})
	})

	describe('Complex nested structures', () => {
		it('should handle complex nested BigInt conversion', () => {
			const complex = {
				users: [
					{ id: BigInt(1), balance: BigInt(1000) },
					{ id: BigInt(2), balance: BigInt(2000) }
				],
				total: BigInt(3000),
				metadata: {
					timestamp: BigInt(Date.now()),
					version: 1
				}
			}

			const converted = convertBigIntToString(complex)
			expect(converted.users[0].id).toBe('1')
			expect(converted.users[0].balance).toBe('1000')
			expect(converted.users[1].id).toBe('2')
			expect(converted.users[1].balance).toBe('2000')
			expect(converted.total).toBe('3000')
			expect(typeof converted.metadata.timestamp).toBe('string')
			expect(converted.metadata.version).toBe(1)
		})

		it('should round-trip complex structures through JSON', () => {
			const original = {
				transactions: [
					{ amount: BigInt(500), fee: BigInt(10) },
					{ amount: BigInt(1000), fee: BigInt(20) }
				]
			}

			const json = safeStringify(original)
			const parsed = safeParse(json)

			expect(parsed.transactions[0].amount).toBe(BigInt(500))
			expect(parsed.transactions[0].fee).toBe(BigInt(10))
			expect(parsed.transactions[1].amount).toBe(BigInt(1000))
			expect(parsed.transactions[1].fee).toBe(BigInt(20))
		})
	})
})
