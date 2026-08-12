import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import type { UTxO } from '@hydra-sdk/core'
import {
	DEFAULT_V1_COST_MODEL_LIST,
	DEFAULT_V2_COST_MODEL_LIST,
	DEFAULT_V3_COST_MODEL_LIST,
	SLOT_CONFIG_NETWORK
} from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'
import { toEngineUtxos } from '../../src/engine/encode'
import { loadWhiskyEngine } from '../../src/engine/whisky'
import { isEvaluatorError } from '../../src/errors'
import type { EngineInput } from '../../src/engine/types'

// Always-succeeds Plutus V3 validator (same as the TxBuilder evaluator unit test).
const scriptCbor = '46450101002499'
const testAddress =
	'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
const fundTxHash = 'a'.repeat(64)
const scriptTxHash = 'b'.repeat(64)
const collateralTxHash = 'c'.repeat(64)

// Derive the script's enterprise address the SAME way TxBuilder.txInScript hashes
// the script (from_hex_with_version), so the script input resolves to the validator.
const scriptAddress = (() => {
	const script = CardanoWASM.PlutusScript.from_hex_with_version(scriptCbor, CardanoWASM.Language.new_plutus_v3())
	const addr = CardanoWASM.EnterpriseAddress.new(0, CardanoWASM.Credential.from_scripthash(script.hash()))
	return addr.to_address().to_bech32()
})()

const preprod = SLOT_CONFIG_NETWORK.PREPROD
const slotConfig = { zeroTime: preprod.zeroTime, zeroSlot: preprod.zeroSlot, slotLength: preprod.slotLength }
const costModels = {
	plutusV1: DEFAULT_V1_COST_MODEL_LIST,
	plutusV2: DEFAULT_V2_COST_MODEL_LIST,
	plutusV3: DEFAULT_V3_COST_MODEL_LIST
}

const PLACEHOLDER = { mem: 100000, steps: 10000000 }

const buildSpendTx = async (): Promise<{ txHex: string; resolved: UTxO[] }> => {
	const builder = new TxBuilder({ isHydra: true })
	const txHex = (
		await builder
			.txIn(fundTxHash, 0, [{ unit: 'lovelace', quantity: '10000000' }], testAddress)
			.txIn(scriptTxHash, 1, [{ unit: 'lovelace', quantity: '5000000' }], scriptAddress)
			.txInScript(scriptCbor, 'V3')
			.txInEmptyRedeemer()
			.txInCollateral(collateralTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
			.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
			.changeAddress(testAddress)
			.complete()
	).to_hex()

	const resolved: UTxO[] = [
		{
			input: { txHash: fundTxHash, outputIndex: 0 },
			output: { address: testAddress, amount: [{ unit: 'lovelace', quantity: '10000000' }] }
		},
		{
			input: { txHash: scriptTxHash, outputIndex: 1 },
			output: { address: scriptAddress, amount: [{ unit: 'lovelace', quantity: '5000000' }] }
		},
		{
			input: { txHash: collateralTxHash, outputIndex: 0 },
			output: { address: testAddress, amount: [{ unit: 'lovelace', quantity: '5000000' }] }
		}
	]
	return { txHex, resolved }
}

describe('encode gate — toEngineUtxo field naming accepted by whisky', () => {
	it('whisky returns a real (non-placeholder) SPEND budget for correctly-encoded UTxOs', async () => {
		const engine = await loadWhiskyEngine()
		const { txHex, resolved } = await buildSpendTx()

		const input: EngineInput = {
			txHex,
			utxos: toEngineUtxos(resolved),
			additionalTxs: [],
			costModels,
			slotConfig
		}
		const actions = engine.evaluate(input)

		expect(actions.length).toBeGreaterThanOrEqual(1)
		const spend = actions.find(a => a.tag === 'SPEND')
		expect(spend).toBeDefined()
		expect(spend!.budget.mem).toBeGreaterThan(0)
		expect(spend!.budget.steps).toBeGreaterThan(0)
		// The whole point: a real budget, not the emptyRedeemer placeholder.
		expect(spend!.budget).not.toEqual(PLACEHOLDER)
	})

	it('whisky fails when the script input UTxO is not provided (fail-closed at the engine boundary)', async () => {
		const engine = await loadWhiskyEngine()
		const { txHex } = await buildSpendTx()

		const input: EngineInput = { txHex, utxos: [], additionalTxs: [], costModels, slotConfig }
		let threw = false
		try {
			engine.evaluate(input)
		} catch (error) {
			threw = true
			expect(isEvaluatorError(error)).toBe(true)
		}
		expect(threw).toBe(true)
	})
})
