import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import {
	DEFAULT_V1_COST_MODEL_LIST,
	DEFAULT_V2_COST_MODEL_LIST,
	DEFAULT_V3_COST_MODEL_LIST,
	SLOT_CONFIG_NETWORK
} from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'
import { Scalus, SlotConfig } from 'scalus'
import { loadWhiskyEngine } from '../../src/engine/whisky'
import { toEngineUtxos } from '../../src/engine/encode'
import type { EvalAction } from '../../src/types'
import { resolvedUtxos, stageSpendTx } from '../helpers/spend-tx'
import { utxosToCborMap } from '../helpers/utxo-cbor'

const preprod = SLOT_CONFIG_NETWORK.PREPROD
const slotConfig = { zeroTime: preprod.zeroTime, zeroSlot: preprod.zeroSlot, slotLength: preprod.slotLength }
const costModelList = [DEFAULT_V1_COST_MODEL_LIST, DEFAULT_V2_COST_MODEL_LIST, DEFAULT_V3_COST_MODEL_LIST]

const buildSpendTxHex = async (): Promise<string> => {
	const builder = new TxBuilder({ isHydra: true })
	return (await stageSpendTx(builder).complete()).to_hex()
}

const normalizeScalusTag = (tag: string): string =>
	({ Spend: 'SPEND', Mint: 'MINT', Cert: 'CERT', Reward: 'REWARD', Voting: 'VOTE', Proposing: 'PROPOSE' })[tag] ??
	String(tag).toUpperCase()

const runWhisky = async (txHex: string): Promise<EvalAction[]> => {
	const engine = await loadWhiskyEngine()
	return engine.evaluate({
		txHex,
		utxos: toEngineUtxos(resolvedUtxos()),
		additionalTxs: [],
		costModels: {
			plutusV1: DEFAULT_V1_COST_MODEL_LIST,
			plutusV2: DEFAULT_V2_COST_MODEL_LIST,
			plutusV3: DEFAULT_V3_COST_MODEL_LIST
		},
		slotConfig
	})
}

const runScalus = (txHex: string): EvalAction[] => {
	const utxoMap = utxosToCborMap(resolvedUtxos())
	const config = new SlotConfig(slotConfig.zeroTime, slotConfig.zeroSlot, slotConfig.slotLength)
	return Scalus.evalPlutusScripts(
		CardanoWASM.Transaction.from_hex(txHex).to_bytes(),
		utxoMap,
		config,
		costModelList
	).map(redeemer => ({
		tag: normalizeScalusTag(redeemer.tag) as EvalAction['tag'],
		index: redeemer.index,
		budget: { mem: Number(redeemer.budget.memory), steps: Number(redeemer.budget.steps) }
	}))
}

describe('differential conformance — whisky vs scalus on the same SPEND', () => {
	it('both engines agree on the SPEND budget', async () => {
		const txHex = await buildSpendTxHex()
		const whisky = await runWhisky(txHex)
		const scalus = runScalus(txHex)

		const whiskySpend = whisky.find(a => a.tag === 'SPEND')
		const scalusSpend = scalus.find(a => a.tag === 'SPEND')

		expect(whiskySpend).toBeDefined()
		expect(scalusSpend).toBeDefined()
		// The core conformance assertion: two independent engines, identical budget.
		expect(whiskySpend!.budget).toEqual(scalusSpend!.budget)
		expect(whiskySpend!.budget.mem).toBeGreaterThan(0)
		expect(whiskySpend!.budget.steps).toBeGreaterThan(0)
	})

	it('locks the exact budget for the always-succeed V3 SPEND (determinism fixture)', async () => {
		// Committed expected value: an engine change that shifts cost accounting
		// for this pinned context must fail loudly here, not slip through.
		const txHex = await buildSpendTxHex()
		const whisky = await runWhisky(txHex)
		const scalus = runScalus(txHex)
		const expected = { mem: 500, steps: 64100 }
		expect(whisky.find(a => a.tag === 'SPEND')!.budget).toEqual(expected)
		expect(scalus.find(a => a.tag === 'SPEND')!.budget).toEqual(expected)
	})
})
