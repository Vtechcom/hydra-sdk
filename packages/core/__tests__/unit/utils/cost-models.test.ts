import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { CostModels } from '../../../src'
import {
	DEFAULT_V1_COST_MODEL_LIST,
	DEFAULT_V2_COST_MODEL_LIST,
	DEFAULT_V3_COST_MODEL_LIST
} from '../../../src/constants/cost-models'
import { wasmScope } from '../../helpers/wasm'

describe('CostModels', () => {
	const keep = wasmScope()

	const modelValues = (costmdls: CardanoWASM.Costmdls, language: CardanoWASM.Language): string[] | undefined => {
		const model = keep(costmdls.get(language))
		if (!model) return undefined
		return Array.from({ length: model.len() }, (_, i) => keep(model.get(i)).to_str())
	}

	it('buildCostModels inserts only the languages it is given, keeping order and sign', () => {
		const costmdls = keep(CostModels.buildCostModels({ plutusV2: [100788, -900, 0] }))

		expect(keep(costmdls.keys()).len()).toBe(1)
		expect(modelValues(costmdls, keep(CardanoWASM.Language.new_plutus_v2()))).toEqual(['100788', '-900', '0'])
		expect(modelValues(costmdls, keep(CardanoWASM.Language.new_plutus_v1()))).toBeUndefined()
	})

	it('buildCostModels requires at least one language', () => {
		expect(() => CostModels.buildCostModels({})).toThrow(/At least one cost model must be provided/)
	})

	it('defaultCostModels carries the default V1/V2/V3 parameter lists', () => {
		const defaults = CostModels.defaultCostModels

		expect(keep(defaults.keys()).len()).toBe(3)
		expect(modelValues(defaults, keep(CardanoWASM.Language.new_plutus_v1()))).toEqual(
			DEFAULT_V1_COST_MODEL_LIST.map(String)
		)
		expect(modelValues(defaults, keep(CardanoWASM.Language.new_plutus_v2()))).toEqual(
			DEFAULT_V2_COST_MODEL_LIST.map(String)
		)
		expect(modelValues(defaults, keep(CardanoWASM.Language.new_plutus_v3()))).toEqual(
			DEFAULT_V3_COST_MODEL_LIST.map(String)
		)
	})

	it('defaultCostModels is built once and shared (callers must not free it)', () => {
		expect(CostModels.defaultCostModels).toBe(CostModels.defaultCostModels)
	})
})
