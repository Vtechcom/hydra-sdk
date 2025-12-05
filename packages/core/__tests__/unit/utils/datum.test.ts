import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { mkInt, mkBytes, mkConstr, mkMap, DatumSchema } from '../../../src/utils/datum'
import { bytesToHex, hexToBytes, stringToHex } from '../../../src/utils/parser'

describe('datum utilities', () => {
	describe('mkInt', () => {
		it('should create PlutusData from number', () => {
			const result = mkInt(42)

			expect(result).toBeDefined()
			const bigInt = result.as_integer()
			expect(bigInt).toBeDefined()
			expect(bigInt?.to_str()).toBe('42')
		})

		it('should create PlutusData from string number', () => {
			const result = mkInt('12345')

			const bigInt = result.as_integer()
			expect(bigInt?.to_str()).toBe('12345')
		})

		it('should create PlutusData from bigint', () => {
			const largeNumber = BigInt('9999999999999999999999')
			const result = mkInt(largeNumber)

			const bigInt = result.as_integer()
			expect(bigInt?.to_str()).toBe('9999999999999999999999')
		})

		it('should handle zero', () => {
			const result = mkInt(0)

			const bigInt = result.as_integer()
			expect(bigInt?.to_str()).toBe('0')
		})

		it('should handle negative numbers', () => {
			const result = mkInt(-100)

			const bigInt = result.as_integer()
			expect(bigInt?.to_str()).toBe('-100')
		})

		it('should produce valid CBOR hex', () => {
			const result = mkInt(42)

			const hex = bytesToHex(result.to_bytes())
			expect(hex).toBeDefined()
			expect(hex.length).toBeGreaterThan(0)
		})
	})

	describe('mkBytes', () => {
		it('should create PlutusData from hex string', () => {
			const hex = 'CAFEBABE'
			const result = mkBytes(hex)

			expect(result).toBeDefined()
			const bytes = result.as_bytes()
			expect(bytes).toBeDefined()
			expect(bytesToHex(bytes!).toUpperCase()).toBe('CAFEBABE')
		})

		it('should create PlutusData from empty hex string', () => {
			const result = mkBytes('')

			const bytes = result.as_bytes()
			expect(bytes).toBeDefined()
			expect(bytes?.length).toBe(0)
		})

		it('should handle lowercase hex', () => {
			const hex = 'deadbeef'
			const result = mkBytes(hex)

			const bytes = result.as_bytes()
			expect(bytesToHex(bytes!).toLowerCase()).toBe('deadbeef')
		})

		it('should create bytes from string converted to hex', () => {
			const text = 'Hello'
			const hex = stringToHex(text)
			const result = mkBytes(hex)

			const bytes = result.as_bytes()
			expect(bytes).toBeDefined()
		})

		it('should produce valid CBOR hex', () => {
			const result = mkBytes('1234567890abcdef')

			const cborHex = bytesToHex(result.to_bytes())
			expect(cborHex).toBeDefined()
			expect(cborHex.length).toBeGreaterThan(0)
		})
	})

	describe('mkConstr', () => {
		it('should create constructor with no fields', () => {
			const result = mkConstr(0, [])

			expect(result).toBeDefined()
			const constr = result.as_constr_plutus_data()
			expect(constr).toBeDefined()
			expect(constr?.alternative().to_str()).toBe('0')
			expect(constr?.data().len()).toBe(0)
		})

		it('should create constructor with single field', () => {
			const field = mkInt(42)
			const result = mkConstr(1, [field])

			const constr = result.as_constr_plutus_data()
			expect(constr?.alternative().to_str()).toBe('1')
			expect(constr?.data().len()).toBe(1)
		})

		it('should create constructor with multiple fields', () => {
			const field1 = mkInt(1)
			const field2 = mkBytes('cafe')
			const field3 = mkInt(3)
			const result = mkConstr(2, [field1, field2, field3])

			const constr = result.as_constr_plutus_data()
			expect(constr?.alternative().to_str()).toBe('2')
			expect(constr?.data().len()).toBe(3)
		})

		it('should create nested constructors', () => {
			const inner = mkConstr(0, [mkInt(10)])
			const outer = mkConstr(1, [inner])

			const constr = outer.as_constr_plutus_data()
			expect(constr?.alternative().to_str()).toBe('1')
			expect(constr?.data().len()).toBe(1)

			const innerConstr = constr?.data().get(0).as_constr_plutus_data()
			expect(innerConstr?.alternative().to_str()).toBe('0')
		})

		it('should produce valid CBOR hex', () => {
			const result = mkConstr(0, [mkInt(42), mkBytes('cafe')])

			const cborHex = bytesToHex(result.to_bytes())
			expect(cborHex).toBeDefined()
			expect(cborHex.length).toBeGreaterThan(0)
		})

		it('should create Unit datum (constructor 0 with empty fields)', () => {
			const unit = mkConstr(0, [])

			const cborHex = bytesToHex(unit.to_bytes())
			// d87980 is CBOR for Constr 0 []
			expect(cborHex).toBe('d87980')
		})
	})

	describe('mkMap', () => {
		it('should create empty map', () => {
			const result = mkMap([])

			expect(result).toBeDefined()
			const map = result.as_map()
			expect(map).toBeDefined()
			expect(map?.len()).toBe(0)
		})

		it('should create map with single entry', () => {
			const key = mkInt(1)
			const values = CardanoWASM.PlutusMapValues.new()
			values.add(mkInt(100))

			const result = mkMap([[key, values]])

			const map = result.as_map()
			expect(map?.len()).toBe(1)
		})

		it('should create map with multiple entries', () => {
			const entries: Array<[CardanoWASM.PlutusData, CardanoWASM.PlutusMapValues]> = []

			for (let i = 0; i < 3; i++) {
				const key = mkInt(i)
				const values = CardanoWASM.PlutusMapValues.new()
				values.add(mkInt(i * 10))
				entries.push([key, values])
			}

			const result = mkMap(entries)

			const map = result.as_map()
			expect(map?.len()).toBe(3)
		})

		it('should create map with bytes keys', () => {
			const key = mkBytes('cafe')
			const values = CardanoWASM.PlutusMapValues.new()
			values.add(mkInt(42))

			const result = mkMap([[key, values]])

			const map = result.as_map()
			expect(map?.len()).toBe(1)
		})

		it('should produce valid CBOR hex', () => {
			const key = mkInt(1)
			const values = CardanoWASM.PlutusMapValues.new()
			values.add(mkInt(100))

			const result = mkMap([[key, values]])

			const cborHex = bytesToHex(result.to_bytes())
			expect(cborHex).toBeDefined()
			expect(cborHex.length).toBeGreaterThan(0)
		})
	})

	describe('DatumSchema', () => {
		it('should have Basic schema', () => {
			expect(DatumSchema.Basic).toBeDefined()
			expect(DatumSchema.Basic).toBe(CardanoWASM.PlutusDatumSchema.BasicConversions)
		})

		it('should have Detailed schema', () => {
			expect(DatumSchema.Detailed).toBeDefined()
			expect(DatumSchema.Detailed).toBe(CardanoWASM.PlutusDatumSchema.DetailedSchema)
		})

		it('should convert PlutusData to JSON using Basic schema', () => {
			const data = mkInt(42)

			const json = data.to_json(DatumSchema.Basic)
			expect(json).toBe('42')
		})

		it('should convert PlutusData to JSON using Detailed schema', () => {
			const data = mkInt(42)

			const json = data.to_json(DatumSchema.Detailed)
			expect(JSON.parse(json)).toEqual({ int: 42 })
		})

		it('should convert bytes to JSON using Detailed schema', () => {
			const data = mkBytes('cafe')

			const json = data.to_json(DatumSchema.Detailed)
			const parsed = JSON.parse(json)
			expect(parsed.bytes).toBeDefined()
		})

		it('should convert constructor to JSON using Detailed schema', () => {
			const data = mkConstr(0, [mkInt(1), mkInt(2)])

			const json = data.to_json(DatumSchema.Detailed)
			const parsed = JSON.parse(json)
			expect(parsed.constructor).toBe(0)
			expect(parsed.fields).toHaveLength(2)
		})
	})
})
