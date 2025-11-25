import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { DEFAULT_V1_COST_MODEL_LIST, DEFAULT_V2_COST_MODEL_LIST, DEFAULT_V3_COST_MODEL_LIST } from '../constants'

export function buildCostModels({
	plutusV1,
	plutusV2,
	plutusV3
}: {
	plutusV1?: number[]
	plutusV2?: number[]
	plutusV3?: number[]
}): CardanoWASM.Costmdls {
	if (!plutusV1 && !plutusV2 && !plutusV3) {
		throw new Error('At least one cost model must be provided')
	}
	const costModelV1 = CardanoWASM.CostModel.new()
	plutusV1 &&
		plutusV1.forEach((val, i) => {
			costModelV1.set(i, CardanoWASM.Int.from_str(val.toString()))
		})

	const costModelV2 = CardanoWASM.CostModel.new()
	plutusV2 &&
		plutusV2.forEach((val, i) => {
			costModelV2.set(i, CardanoWASM.Int.from_str(val.toString()))
		})

	const costModelV3 = CardanoWASM.CostModel.new()
	plutusV3 &&
		plutusV3.forEach((val, i) => {
			costModelV3.set(i, CardanoWASM.Int.from_str(val.toString()))
		})

	const costmdls = CardanoWASM.Costmdls.new()
	plutusV1 && costmdls.insert(CardanoWASM.Language.new_plutus_v1(), costModelV1)
	plutusV2 && costmdls.insert(CardanoWASM.Language.new_plutus_v2(), costModelV2)
	plutusV3 && costmdls.insert(CardanoWASM.Language.new_plutus_v3(), costModelV3)
	return costmdls
}

export const defaultCostModels = buildCostModels({
	plutusV1: DEFAULT_V1_COST_MODEL_LIST,
	plutusV2: DEFAULT_V2_COST_MODEL_LIST,
	plutusV3: DEFAULT_V3_COST_MODEL_LIST
})
