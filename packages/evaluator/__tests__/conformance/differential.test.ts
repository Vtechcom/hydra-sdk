import { describe, it, expect, beforeAll } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import {
	DEFAULT_V1_COST_MODEL_LIST,
	DEFAULT_V2_COST_MODEL_LIST,
	DEFAULT_V3_COST_MODEL_LIST,
	SLOT_CONFIG_NETWORK,
	type UTxO
} from '@hydra-sdk/core'
import { Scalus, SlotConfig } from 'scalus'
import { loadWhiskyEngine } from '../../src/engine/whisky'
import { toEngineUtxos } from '../../src/engine/encode'
import type { EvaluationEngine } from '../../src/engine/types'
import type { EvalAction } from '../../src/types'
import { mintFixture, spendFixture, type TxFixture } from '../helpers/spend-tx'
import { utxosToCborMap } from '../helpers/utxo-cbor'

const preprod = SLOT_CONFIG_NETWORK.PREPROD
const slotConfig = { zeroTime: preprod.zeroTime, zeroSlot: preprod.zeroSlot, slotLength: preprod.slotLength }
const costModels = {
	plutusV1: DEFAULT_V1_COST_MODEL_LIST,
	plutusV2: DEFAULT_V2_COST_MODEL_LIST,
	plutusV3: DEFAULT_V3_COST_MODEL_LIST
}

const normalizeScalusTag = (tag: string): string =>
	({ Spend: 'SPEND', Mint: 'MINT', Cert: 'CERT', Reward: 'REWARD', Voting: 'VOTE', Proposing: 'PROPOSE' })[tag] ??
	String(tag).toUpperCase()

let whisky: EvaluationEngine
beforeAll(async () => {
	whisky = await loadWhiskyEngine()
})

const runWhisky = ({ txHex, utxos }: TxFixture): EvalAction[] =>
	whisky.evaluate({ txHex, utxos: toEngineUtxos(utxos), additionalTxs: [], costModels, slotConfig })

const runScalus = ({ txHex, utxos }: TxFixture): EvalAction[] => {
	const tx = CardanoWASM.Transaction.from_hex(txHex)
	const txBytes = tx.to_bytes()
	tx.free()
	const config = new SlotConfig(slotConfig.zeroTime, slotConfig.zeroSlot, slotConfig.slotLength)
	return Scalus.evalPlutusScripts(txBytes, utxosToCborMap(utxos as UTxO[]), config, [
		DEFAULT_V1_COST_MODEL_LIST,
		DEFAULT_V2_COST_MODEL_LIST,
		DEFAULT_V3_COST_MODEL_LIST
	]).map(redeemer => ({
		tag: normalizeScalusTag(redeemer.tag) as EvalAction['tag'],
		index: redeemer.index,
		budget: { mem: Number(redeemer.budget.memory), steps: Number(redeemer.budget.steps) }
	}))
}

// Expected budgets are committed values, confirmed by BOTH engines below (Scalus
// is the independent oracle). An engine change that shifts cost accounting for
// this pinned context must fail loudly here, not slip through.
describe('differential conformance — whisky vs scalus', () => {
	it.each([
		{
			name: 'V1 SPEND (datum hash)',
			fixture: () => spendFixture('V1'),
			tag: 'SPEND',
			budget: { mem: 1700, steps: 256100 }
		},
		{
			name: 'V2 SPEND (datum hash)',
			fixture: () => spendFixture('V2'),
			tag: 'SPEND',
			budget: { mem: 1700, steps: 256100 }
		},
		{ name: 'V3 SPEND', fixture: () => spendFixture('V3'), tag: 'SPEND', budget: { mem: 500, steps: 64100 } },
		{ name: 'V3 MINT', fixture: mintFixture, tag: 'MINT', budget: { mem: 500, steps: 64100 } }
	])('$name: both engines return the same single budget', async ({ fixture, tag, budget }) => {
		const fx = await fixture()
		const expected = [{ tag, index: 0, budget }]
		expect(runWhisky(fx)).toEqual(expected)
		expect(runScalus(fx)).toEqual(expected)
	})

	// whisky reports an unresolved input as a per-redeemer failure, i.e. SCRIPT_FAILURE —
	// which is why resolveContext fails closed with MISSING_UTXO before the engine runs.
	it('whisky rejects a SPEND whose UTxOs are not supplied', async () => {
		const { txHex } = await spendFixture('V3')
		expect(() => runWhisky({ txHex, utxos: [] })).toThrow(
			expect.objectContaining({ code: 'SCRIPT_FAILURE', message: expect.stringMatching(/resolved Input not found/) })
		)
	})
})
