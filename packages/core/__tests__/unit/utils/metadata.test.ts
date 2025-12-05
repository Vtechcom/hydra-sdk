import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { metadataObjToMetadatum } from '../../../src/utils/metadata'

describe('metadata utilities', () => {
	describe('metadataObjToMetadatum', () => {
		describe('number handling', () => {
			it('should convert positive number to Int metadatum', () => {
				const result = metadataObjToMetadatum(42)

				expect(result).toBeDefined()
				const int = result.as_int()
				expect(int).toBeDefined()
				expect(int?.to_str()).toBe('42')
			})

			it('should convert zero to Int metadatum', () => {
				const result = metadataObjToMetadatum(0)

				const int = result.as_int()
				expect(int?.to_str()).toBe('0')
			})

			it('should convert negative number to Int metadatum', () => {
				const result = metadataObjToMetadatum(-100)

				const int = result.as_int()
				expect(int?.to_str()).toBe('-100')
			})

			it('should convert large number to Int metadatum', () => {
				const result = metadataObjToMetadatum(Number.MAX_SAFE_INTEGER)

				const int = result.as_int()
				expect(int?.to_str()).toBe(Number.MAX_SAFE_INTEGER.toString())
			})
		})

		describe('bigint handling', () => {
			it('should convert positive bigint to Int metadatum', () => {
				const result = metadataObjToMetadatum(BigInt('12345678901234567890'))

				const int = result.as_int()
				expect(int?.to_str()).toBe('12345678901234567890')
			})

			it('should convert zero bigint to Int metadatum', () => {
				const result = metadataObjToMetadatum(BigInt(0))

				const int = result.as_int()
				expect(int?.to_str()).toBe('0')
			})

			it('should convert negative bigint to Int metadatum', () => {
				const result = metadataObjToMetadatum(BigInt('-999999999999999'))

				const int = result.as_int()
				expect(int?.to_str()).toBe('-999999999999999')
			})
		})

		describe('string handling', () => {
			it('should convert string to Text metadatum', () => {
				const result = metadataObjToMetadatum('Hello, World!')

				const text = result.as_text()
				expect(text).toBe('Hello, World!')
			})

			it('should convert empty string to Text metadatum', () => {
				const result = metadataObjToMetadatum('')

				const text = result.as_text()
				expect(text).toBe('')
			})

			it('should handle special characters in string', () => {
				const result = metadataObjToMetadatum('Special: @#$%^&*()')

				const text = result.as_text()
				expect(text).toBe('Special: @#$%^&*()')
			})

			it('should handle unicode characters', () => {
				const result = metadataObjToMetadatum('こんにちは')

				const text = result.as_text()
				expect(text).toBe('こんにちは')
			})
		})

		describe('Uint8Array handling', () => {
			it('should convert Uint8Array to Bytes metadatum', () => {
				const bytes = new Uint8Array([0xca, 0xfe, 0xba, 0xbe])
				const result = metadataObjToMetadatum(bytes)

				const resultBytes = result.as_bytes()
				expect(resultBytes).toBeDefined()
				expect(Array.from(resultBytes!)).toEqual([0xca, 0xfe, 0xba, 0xbe])
			})

			it('should convert empty Uint8Array to Bytes metadatum', () => {
				const bytes = new Uint8Array([])
				const result = metadataObjToMetadatum(bytes)

				const resultBytes = result.as_bytes()
				expect(resultBytes).toBeDefined()
				expect(resultBytes!.length).toBe(0)
			})

			it('should convert 32-byte Uint8Array (hash size)', () => {
				const bytes = new Uint8Array(32).fill(0xab)
				const result = metadataObjToMetadatum(bytes)

				const resultBytes = result.as_bytes()
				expect(resultBytes!.length).toBe(32)
			})
		})

		describe('array handling', () => {
			it('should convert simple array to List metadatum', () => {
				const result = metadataObjToMetadatum([1, 2, 3])

				const list = result.as_list()
				expect(list).toBeDefined()
				expect(list!.len()).toBe(3)
				expect(list!.get(0).as_int()?.to_str()).toBe('1')
				expect(list!.get(1).as_int()?.to_str()).toBe('2')
				expect(list!.get(2).as_int()?.to_str()).toBe('3')
			})

			it('should convert empty array to List metadatum', () => {
				const result = metadataObjToMetadatum([])

				const list = result.as_list()
				expect(list).toBeDefined()
				expect(list!.len()).toBe(0)
			})

			it('should convert mixed type array', () => {
				const result = metadataObjToMetadatum([42, 'hello', BigInt(100)])

				const list = result.as_list()
				expect(list!.len()).toBe(3)
				expect(list!.get(0).as_int()?.to_str()).toBe('42')
				expect(list!.get(1).as_text()).toBe('hello')
				expect(list!.get(2).as_int()?.to_str()).toBe('100')
			})

			it('should handle nested arrays', () => {
				const result = metadataObjToMetadatum([
					[1, 2],
					[3, 4]
				])

				const list = result.as_list()
				expect(list!.len()).toBe(2)

				const nestedList1 = list!.get(0).as_list()
				expect(nestedList1!.len()).toBe(2)
				expect(nestedList1!.get(0).as_int()?.to_str()).toBe('1')
			})
		})

		describe('Map handling', () => {
			it('should convert Map to MetadataMap metadatum', () => {
				const map = new Map<any, any>([
					['key1', 'value1'],
					['key2', 42]
				])
				const result = metadataObjToMetadatum(map)

				const metadataMap = result.as_map()
				expect(metadataMap).toBeDefined()
			})

			it('should convert empty Map to MetadataMap', () => {
				const map = new Map()
				const result = metadataObjToMetadatum(map)

				const metadataMap = result.as_map()
				expect(metadataMap).toBeDefined()
			})

			it('should handle Map with number keys', () => {
				const map = new Map<number, string>([
					[1, 'one'],
					[2, 'two']
				])
				const result = metadataObjToMetadatum(map)

				const metadataMap = result.as_map()
				expect(metadataMap).toBeDefined()
			})
		})

		describe('Object handling', () => {
			it('should convert simple object to MetadataMap', () => {
				const obj = { name: 'test', value: 123 }
				const result = metadataObjToMetadatum(obj)

				const metadataMap = result.as_map()
				expect(metadataMap).toBeDefined()
			})

			it('should convert empty object to MetadataMap', () => {
				const result = metadataObjToMetadatum({})

				const metadataMap = result.as_map()
				expect(metadataMap).toBeDefined()
			})

			it('should handle nested objects', () => {
				const obj = {
					outer: {
						inner: 'value'
					}
				}
				const result = metadataObjToMetadatum(obj)

				const metadataMap = result.as_map()
				expect(metadataMap).toBeDefined()
			})

			it('should handle object with array values', () => {
				const obj = {
					items: [1, 2, 3],
					name: 'list'
				}
				const result = metadataObjToMetadatum(obj)

				const metadataMap = result.as_map()
				expect(metadataMap).toBeDefined()
			})
		})

		describe('complex nested structures', () => {
			it('should handle NFT-like metadata structure', () => {
				const nftMetadata = {
					name: 'My NFT',
					image: 'ipfs://QmHash',
					attributes: [
						{ trait_type: 'Background', value: 'Blue' },
						{ trait_type: 'Eyes', value: 'Green' }
					]
				}
				const result = metadataObjToMetadatum(nftMetadata)

				expect(result).toBeDefined()
				const metadataMap = result.as_map()
				expect(metadataMap).toBeDefined()
			})

			it('should handle CIP-25 style metadata', () => {
				const cip25 = {
					'721': {
						policyId: {
							assetName: {
								name: 'Token Name',
								image: 'ipfs://hash'
							}
						}
					}
				}
				const result = metadataObjToMetadatum(cip25)

				expect(result).toBeDefined()
			})
		})

		describe('error handling', () => {
			it('should throw for unsupported types', () => {
				expect(() => metadataObjToMetadatum(undefined)).toThrow('Unsupported metadata type')
			})

			it('should throw for null', () => {
				expect(() => metadataObjToMetadatum(null)).toThrow()
			})

			it('should throw for boolean', () => {
				expect(() => metadataObjToMetadatum(true)).toThrow()
			})

			it('should throw for function', () => {
				expect(() => metadataObjToMetadatum(() => {})).toThrow()
			})

			it('should throw for symbol', () => {
				expect(() => metadataObjToMetadatum(Symbol('test'))).toThrow()
			})
		})

		describe('CBOR serialization', () => {
			it('should produce valid CBOR bytes for number', () => {
				const result = metadataObjToMetadatum(42)
				const bytes = result.to_bytes()

				expect(bytes).toBeDefined()
				expect(bytes.length).toBeGreaterThan(0)
			})

			it('should produce valid CBOR bytes for complex structure', () => {
				const complex = {
					list: [1, 2, 3],
					nested: { key: 'value' }
				}
				const result = metadataObjToMetadatum(complex)
				const bytes = result.to_bytes()

				expect(bytes).toBeDefined()
				expect(bytes.length).toBeGreaterThan(0)
			})

			it('should be deserializable from CBOR', () => {
				const original = 42
				const metadatum = metadataObjToMetadatum(original)
				const bytes = metadatum.to_bytes()

				const restored = CardanoWASM.TransactionMetadatum.from_bytes(bytes)
				expect(restored.as_int()?.to_str()).toBe('42')
			})
		})
	})
})
