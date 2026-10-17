import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { buildRedeemer, emptyRedeemer } from '../../../src/utils/redeemer-builder'

/** Decode a redeemer through its CBOR, then free it. */
const decode = (redeemer: CardanoWASM.Redeemer) => {
	try {
		const parsed = CardanoWASM.Redeemer.from_hex(redeemer.to_hex())
		const json = JSON.parse(parsed.to_json())
		parsed.free()
		return { ...json, data: JSON.parse(json.data) }
	} finally {
		redeemer.free()
	}
}

describe('buildRedeemer', () => {
	it('wraps every value as bytes in constructor 0, with SPEND/0 and the default budget', () => {
		expect(decode(buildRedeemer({ a: 'hi', b: 'yo' }))).toEqual({
			tag: 'Spend',
			index: '0',
			data: { constructor: 0, fields: [{ bytes: '6869' }, { bytes: '796f' }] },
			ex_units: { mem: '100000', steps: '10000000' }
		})
	})

	it.each([
		['SPEND', 'Spend'],
		['MINT', 'Mint'],
		['CERT', 'Cert'],
		['REWARD', 'Reward'],
		['VOTE', 'Vote'],
		['VOTING_PROPOSAL', 'VotingProposal']
	] as const)('maps tag %s to %s', (tag, expected) => {
		expect(decode(buildRedeemer({}, { tag })).tag).toBe(expected)
	})

	it('takes index and exUnits from options (index as number or string)', () => {
		expect(decode(buildRedeemer({}, { index: '10', exUnits: { mem: '1', steps: '2' } }))).toMatchObject({
			index: '10',
			ex_units: { mem: '1', steps: '2' }
		})
		expect(decode(buildRedeemer({}, { index: 5 })).index).toBe('5')
	})

	it('rejects an unknown tag', () => {
		expect(() => buildRedeemer({}, { tag: 'UNKNOWN' as never })).toThrow(/Unknown redeemer tag type: UNKNOWN/)
	})
})

describe('emptyRedeemer', () => {
	it.each([
		['int', { int: 0 }],
		['bytes', { bytes: '' }],
		['list', { list: [] }],
		['map', { map: [] }],
		['constr', { constructor: 0, fields: [] }]
	] as const)('builds an empty %s datum', (type, data) => {
		expect(decode(emptyRedeemer({ type })).data).toEqual(data)
	})

	it('defaults to an int datum with SPEND/0 and the default budget', () => {
		expect(decode(emptyRedeemer())).toEqual({
			tag: 'Spend',
			index: '0',
			data: { int: 0 },
			ex_units: { mem: '100000', steps: '10000000' }
		})
	})

	it('applies tag, index and exUnits from options', () => {
		expect(decode(emptyRedeemer({ tag: 'MINT', index: '7', exUnits: { mem: '3', steps: '4' } }))).toMatchObject({
			tag: 'Mint',
			index: '7',
			ex_units: { mem: '3', steps: '4' }
		})
	})

	it('rejects an unknown datum type', () => {
		expect(() => emptyRedeemer({ type: 'unknown' as never })).toThrow(/Unknown plutus data type: unknown/)
	})
})
