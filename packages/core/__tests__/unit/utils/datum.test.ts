import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import {
	mkInt,
	mkBytes,
	mkConstr,
	mkList,
	mkMap,
	DatumSchema,
	mkBool,
	mkOption,
	mkBytesList,
	mkIntList,
	mkOutputRef,
	mkAddress,
	parseAddress
} from '../../../src/utils/datum'
import { bytesToHex } from '../../../src/utils/parser'
import { NETWORK_ID } from '../../../src/constants/chain'

describe('datum utilities', () => {
	// Expected values are hand-checked CBOR (RFC 8949; Plutus constructors use tags 121–127 / 1280+ / 102).
	it.each([
		['mkInt(42)', () => mkInt(42), '182a'],
		["mkInt('12345')", () => mkInt('12345'), '193039'],
		['mkInt(0)', () => mkInt(0), '00'],
		['mkInt(-100)', () => mkInt(-100), '3863'],
		['mkInt(bigint > 2^64)', () => mkInt(9999999999999999999999n), 'c24a021e19e0c9bab23fffff'],
		["mkBytes('CAFEBABE')", () => mkBytes('CAFEBABE'), '44cafebabe'],
		["mkBytes('')", () => mkBytes(''), '40'],
		['mkConstr(0, [])', () => mkConstr(0, []), 'd87980'],
		['mkConstr(1, [42])', () => mkConstr(1, [mkInt(42)]), 'd87a9f182aff'],
		['mkConstr(7, [])', () => mkConstr(7, []), 'd9050080'],
		['mkConstr(128, [])', () => mkConstr(128, []), 'd86682188080'],
		['nested constr/list', () => mkConstr(0, [mkBytes('cafe'), mkList([mkInt(-1)])]), 'd8799f42cafe9f20ffff'],
		['mkList([])', () => mkList([]), '80'],
		['mkList([1, 2])', () => mkList([mkInt(1), mkInt(2)]), '9f0102ff'],
		[
			'mkMap({1: 100})',
			() => {
				const values = CardanoWASM.PlutusMapValues.new()
				values.add(mkInt(100))
				return mkMap([[mkInt(1), values]])
			},
			'a1011864'
		]
	])('%s encodes to CBOR %s', (_name, build, cbor) => {
		const data = build()
		expect(bytesToHex(data.to_bytes())).toBe(cbor)
		data.free()
	})

	it('DatumSchema maps to the CSL JSON schemas', () => {
		const data = mkConstr(0, [mkInt(42), mkBytes('cafe')])

		expect(DatumSchema.Basic).toBe(CardanoWASM.PlutusDatumSchema.BasicConversions)
		expect(mkInt(42).to_json(DatumSchema.Basic)).toBe('42')
		expect(JSON.parse(data.to_json(DatumSchema.Detailed))).toEqual({
			constructor: 0,
			fields: [{ int: 42 }, { bytes: 'cafe' }]
		})
	})
})

const toJson = (d: CardanoWASM.PlutusData) => JSON.parse(d.to_json(DatumSchema.Detailed))

// A real base testnet address (payment key + stake key)
const BASE_TESTNET =
	'addr_test1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz'

describe('datum utils — generic encoders', () => {
	it('mkBool encodes Aiken Bool (False=0, True=1)', () => {
		expect(toJson(mkBool(false))).toEqual({ constructor: 0, fields: [] })
		expect(toJson(mkBool(true))).toEqual({ constructor: 1, fields: [] })
	})

	it('mkOption encodes Some/None', () => {
		expect(toJson(mkOption(mkInt(42)))).toEqual({ constructor: 0, fields: [{ int: 42 }] })
		expect(toJson(mkOption(null))).toEqual({ constructor: 1, fields: [] })
		expect(toJson(mkOption())).toEqual({ constructor: 1, fields: [] })
	})

	it('mkBytesList accepts hex strings and raw bytes', () => {
		const data = mkBytesList(['deadbeef', new Uint8Array([1, 2])])
		expect(toJson(data)).toEqual({ list: [{ bytes: 'deadbeef' }, { bytes: '0102' }] })
	})

	it('mkIntList encodes a list of ints', () => {
		expect(toJson(mkIntList([1, 2, 3]))).toEqual({ list: [{ int: 1 }, { int: 2 }, { int: 3 }] })
	})

	it('mkOutputRef encodes Constr(0, [Bytes(txHash), Int(index)])', () => {
		const data = mkOutputRef({ txHash: 'ab12', index: 0 })
		expect(toJson(data)).toEqual({ constructor: 0, fields: [{ bytes: 'ab12' }, { int: 0 }] })
	})
})

describe('datum utils — mkAddress / parseAddress round-trip', () => {
	it('round-trips a base testnet address (payment key + stake key)', () => {
		const data = mkAddress(BASE_TESTNET)
		const json = toJson(data)
		// Address = Constr(0, [Credential, Option<Inline<Credential>>])
		expect(json.constructor).toBe(0)
		expect(json.fields).toHaveLength(2)
		// payment credential = VerificationKey => Constr(0, [Bytes])
		expect(json.fields[0].constructor).toBe(0)
		// stake credential = Some(Inline(VerificationKey))
		expect(json.fields[1].constructor).toBe(0)

		expect(parseAddress(data, NETWORK_ID.PREPROD)).toBe(BASE_TESTNET)
	})

	it('round-trips an enterprise address (no stake, None)', () => {
		const paymentCred = CardanoWASM.BaseAddress.from_address(
			CardanoWASM.Address.from_bech32(BASE_TESTNET)
		)!.payment_cred()
		const enterprise = CardanoWASM.EnterpriseAddress.new(NETWORK_ID.PREPROD, paymentCred).to_address().to_bech32()

		const data = mkAddress(enterprise)
		// stake credential must be None => Constr(1, [])
		expect(toJson(data).fields[1]).toEqual({ constructor: 1, fields: [] })

		expect(parseAddress(data, NETWORK_ID.PREPROD)).toBe(enterprise)
	})

	it('round-trips a script (validator) enterprise address', () => {
		const scriptCred = CardanoWASM.Credential.from_scripthash(CardanoWASM.ScriptHash.from_hex('00'.repeat(28)))
		const scriptAddr = CardanoWASM.EnterpriseAddress.new(NETWORK_ID.PREPROD, scriptCred).to_address().to_bech32()

		const data = mkAddress(scriptAddr)
		// payment credential = Script => Constr(1, [Bytes])
		expect(toJson(data).fields[0].constructor).toBe(1)

		expect(parseAddress(data, NETWORK_ID.PREPROD)).toBe(scriptAddr)
	})

	it('round-trips a base mainnet address', () => {
		const base = CardanoWASM.BaseAddress.from_address(CardanoWASM.Address.from_bech32(BASE_TESTNET))!
		const mainnet = CardanoWASM.BaseAddress.new(NETWORK_ID.MAINNET, base.payment_cred(), base.stake_cred())
			.to_address()
			.to_bech32()

		const data = mkAddress(mainnet)
		expect(parseAddress(data, NETWORK_ID.MAINNET)).toBe(mainnet)
	})

	it.each([
		['a non-constr', () => mkInt(1), /expected a Constr for Address/],
		['a constr with one field', () => mkConstr(0, [mkInt(1)]), /Address must have 2 fields/],
		[
			'a pointer stake credential',
			() =>
				mkConstr(0, [mkConstr(0, [mkBytes('00'.repeat(28))]), mkConstr(0, [mkConstr(1, [mkInt(1), mkInt(2), mkInt(3)])])]),
			/pointer stake credentials are not supported/
		]
	])('parseAddress rejects %s', (_name, build, error) => {
		expect(() => parseAddress(build())).toThrow(error)
	})
})
