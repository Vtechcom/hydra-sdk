import { describe, it, expect, afterAll } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { isValidTxOutput } from '../../../src/utils/validation'
import * as ValidatorUtils from '../../../src/utils/validator.util'
import { OTHER_ADDRESS } from '../../helpers/fixtures'

const POLICY_A = 'a'.repeat(56)
const POLICY_B = 'b'.repeat(56)
const TOKEN1 = '746f6b656e31' // "token1"
const lovelace = (quantity: string) => [{ unit: 'lovelace', quantity }]

describe('ValidationUtils.isValidTxOutput', () => {
	const inlineDatum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))
	afterAll(() => inlineDatum.free())

	it.each([
		['lovelace only', { address: OTHER_ADDRESS, amount: lovelace('2000000') }],
		['an empty amount (0 lovelace)', { address: OTHER_ADDRESS, amount: [] }],
		['45 billion ADA', { address: OTHER_ADDRESS, amount: lovelace('45000000000000000') }],
		[
			'several policies and assets',
			{
				address: OTHER_ADDRESS,
				amount: [
					...lovelace('5000000'),
					{ unit: POLICY_A + TOKEN1, quantity: '100' },
					{ unit: POLICY_A + '746f6b656e32', quantity: '200' },
					{ unit: POLICY_B + TOKEN1, quantity: '50' }
				]
			}
		],
		['a datum hash field (ignored)', { address: OTHER_ADDRESS, amount: lovelace('2000000'), datumHash: 'a'.repeat(64) }],
		['an inline datum', { address: OTHER_ADDRESS, amount: lovelace('2000000'), inlineDatum }]
	])('accepts an output with %s', (_name, output) => {
		expect(isValidTxOutput(output)).toBe(true)
	})

	it.each([
		['an invalid address', { address: 'invalid-address', amount: lovelace('2000000') }],
		['an empty address', { address: '', amount: lovelace('2000000') }],
		['a null amount', { address: OTHER_ADDRESS, amount: null }],
		['no amount', { address: OTHER_ADDRESS }],
		['a unit that is not policy + name', { address: OTHER_ADDRESS, amount: [{ unit: 'invalid', quantity: '100' }] }],
		[
			'an asset name longer than 32 bytes',
			{ address: OTHER_ADDRESS, amount: [{ unit: POLICY_A + '00'.repeat(33), quantity: '1' }] }
		],
		['a negative quantity', { address: OTHER_ADDRESS, amount: lovelace('-1000') }],
		['a fractional quantity', { address: OTHER_ADDRESS, amount: lovelace('1.5') }],
		['both inline datum and datum', { address: OTHER_ADDRESS, amount: lovelace('1'), inlineDatum, datum: inlineDatum }],
		['null', null],
		['undefined', undefined],
		['an empty object', {}]
	])('rejects %s', (_name, output) => {
		expect(isValidTxOutput(output as never)).toBe(false)
	})

	it('stays re-exported from the deprecated ValidatorUtils', () => {
		expect(ValidatorUtils.isValidTxOutput).toBe(isValidTxOutput)
	})
})
