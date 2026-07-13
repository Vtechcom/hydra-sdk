import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import {
	mkRedeemer,
	mkSpendRedeemer,
	mkMintRedeemer,
	mkUnitRedeemer,
	mkRedeemerTag,
	mkExUnits,
	DEFAULT_EX_UNITS
} from '../../../src/utils/redeemer'
import { mkConstr, mkInt } from '../../../src/utils/datum'

const Kind = CardanoWASM.RedeemerTagKind

describe('redeemer utils', () => {
	describe('mkRedeemerTag', () => {
		it('maps every purpose to the right kind (case-insensitive)', () => {
			expect(mkRedeemerTag('spend').kind()).toBe(Kind.Spend)
			expect(mkRedeemerTag('mint').kind()).toBe(Kind.Mint)
			expect(mkRedeemerTag('cert').kind()).toBe(Kind.Cert)
			expect(mkRedeemerTag('reward').kind()).toBe(Kind.Reward)
			expect(mkRedeemerTag('vote').kind()).toBe(Kind.Vote)
			expect(mkRedeemerTag('voting_proposal').kind()).toBe(Kind.VotingProposal)
			// upper-case forms accepted too
			expect(mkRedeemerTag('MINT').kind()).toBe(Kind.Mint)
			expect(mkRedeemerTag('VOTING_PROPOSAL').kind()).toBe(Kind.VotingProposal)
		})

		it('defaults to spend', () => {
			expect(mkRedeemerTag().kind()).toBe(Kind.Spend)
		})
	})

	describe('mkExUnits', () => {
		it('builds ExUnits from mem/steps (string|number|bigint)', () => {
			const ex = mkExUnits({ mem: 111, steps: 222n })
			expect(ex.mem().to_str()).toBe('111')
			expect(ex.steps().to_str()).toBe('222')
		})

		it('defaults to DEFAULT_EX_UNITS', () => {
			const ex = mkExUnits()
			expect(ex.mem().to_str()).toBe(String(DEFAULT_EX_UNITS.mem))
			expect(ex.steps().to_str()).toBe(String(DEFAULT_EX_UNITS.steps))
		})
	})

	describe('mkRedeemer', () => {
		it('wraps PlutusData with spend/index 0/default exUnits by default', () => {
			const data = mkConstr(1, [])
			const redeemer = mkRedeemer(data)

			expect(redeemer.tag().kind()).toBe(Kind.Spend)
			expect(redeemer.index().to_str()).toBe('0')
			expect(redeemer.ex_units().mem().to_str()).toBe(String(DEFAULT_EX_UNITS.mem))
			expect(redeemer.ex_units().steps().to_str()).toBe(String(DEFAULT_EX_UNITS.steps))
			// data is preserved
			expect(redeemer.data().as_constr_plutus_data()?.alternative().to_str()).toBe('1')
		})

		it('honours tag/index/exUnits overrides', () => {
			const redeemer = mkRedeemer(mkInt(7), {
				tag: 'mint',
				index: 3,
				exUnits: { mem: '10', steps: '20' }
			})

			expect(redeemer.tag().kind()).toBe(Kind.Mint)
			expect(redeemer.index().to_str()).toBe('3')
			expect(redeemer.ex_units().mem().to_str()).toBe('10')
			expect(redeemer.ex_units().steps().to_str()).toBe('20')
			expect(redeemer.data().as_integer()?.to_str()).toBe('7')
		})
	})

	describe('mkSpendRedeemer / mkMintRedeemer', () => {
		it('set the correct tag and keep other options', () => {
			const spend = mkSpendRedeemer(mkConstr(0, []), { index: 2 })
			expect(spend.tag().kind()).toBe(Kind.Spend)
			expect(spend.index().to_str()).toBe('2')

			const mint = mkMintRedeemer(mkConstr(0, []))
			expect(mint.tag().kind()).toBe(Kind.Mint)
			expect(mint.index().to_str()).toBe('0')
		})
	})

	describe('mkUnitRedeemer', () => {
		it('carries the Unit value Constr(0, [])', () => {
			const redeemer = mkUnitRedeemer({ tag: 'mint' })
			const constr = redeemer.data().as_constr_plutus_data()

			expect(redeemer.tag().kind()).toBe(Kind.Mint)
			expect(constr?.alternative().to_str()).toBe('0')
			expect(constr?.data().len()).toBe(0)
		})
	})

	it('produces a Redeemer usable via to_bytes (round-trippable)', () => {
		const redeemer = mkSpendRedeemer(mkConstr(0, [mkInt(1)]))
		const restored = CardanoWASM.Redeemer.from_bytes(redeemer.to_bytes())
		expect(restored.tag().kind()).toBe(Kind.Spend)
		expect(restored.data().as_constr_plutus_data()?.data().get(0).as_integer()?.to_str()).toBe('1')
	})
})
