import { castProtocol, Protocol } from '@hydra-sdk/core'

export type RawProtocolParameters = {
	txFeePerByte: number
	txFeeFixed: number
	maxBlockBodySize: number
	maxTxSize: number
	maxBlockHeaderSize: number
	stakeAddressDeposit: number
	stakePoolDeposit: number
	poolRetireMaxEpoch: number
	stakePoolTargetNum: number
	poolPledgeInfluence: number
	monetaryExpansion: number
	treasuryCut: number
	minPoolCost: number
	/**
	 * Plutus cost models, keyed by language version.
	 *
	 * NOTE: the values change with the ledger protocol version — the van Rossem
	 * hard fork (PV11, 2026-07-18) reprices existing builtins and adds new ones.
	 * Always take these from the node rather than a hard-coded default when
	 * estimating ExUnits. Indexed so a future `PlutusV4` does not break typing.
	 */
	costModels: {
		PlutusV1: Array<number>
		PlutusV2: Array<number>
		PlutusV3: Array<number>
	} & Record<string, Array<number>>

	executionUnitPrices: {
		priceMemory: number
		priceSteps: number
	}
	maxTxExecutionUnits: {
		memory: number
		steps: number
	}
	maxBlockExecutionUnits: {
		memory: number
		steps: number
	}
	maxValueSize: number
	collateralPercentage: number
	maxCollateralInputs: number
	utxoCostPerByte: number
	poolVotingThresholds: {
		committeeNoConfidence: number
		committeeNormal: number
		hardForkInitiation: number
		motionNoConfidence: number
		ppSecurityGroup: number
	}
	dRepVotingThresholds: {
		committeeNoConfidence: number
		committeeNormal: number
		hardForkInitiation: number
		motionNoConfidence: number
		ppEconomicGroup: number
		ppGovGroup: number
		ppNetworkGroup: number
		ppTechnicalGroup: number
		treasuryWithdrawal: number
		updateToConstitution: number
	}
	committeeMinSize: number
	committeeMaxTermLength: number
	govActionLifetime: number
	govActionDeposit: number
	dRepDeposit: number
	dRepActivity: number
	minFeeRefScriptCostPerByte: number
	protocolVersion: {
		major: number
		minor: number
	}
}

/**
 * Narrow the node's protocol parameters to the subset `@hydra-sdk/core` uses.
 *
 * Routed through core's `castProtocol`, so any field the node omits falls back
 * to `DEFAULT_PROTOCOL_PARAMETERS` (kept current with the ledger protocol
 * version) instead of landing as `undefined`.
 *
 * NOTE: `costModels` and `protocolVersion` have no slot in `Protocol` and are
 * dropped here. Reach for `HydraBridge.getRawProtocolParameters()` when you
 * need them — e.g. budgeting Plutus ExUnits, where the cost model changed with
 * the van Rossem hard fork (PV11). `@hydra-sdk/core` also exports
 * `DEFAULT_V1_COST_MODEL_LIST` / `DEFAULT_V2_COST_MODEL_LIST` /
 * `DEFAULT_V3_COST_MODEL_LIST` for the offline case.
 */
export const toProtocol = (pp: RawProtocolParameters): Protocol => {
	return castProtocol({
		epoch: 0,
		minFeeA: pp.txFeePerByte,
		minFeeB: pp.txFeeFixed,
		maxBlockSize: pp.maxBlockBodySize,
		maxTxSize: pp.maxTxSize,
		maxBlockHeaderSize: pp.maxBlockHeaderSize,
		keyDeposit: pp.stakeAddressDeposit,
		poolDeposit: pp.stakePoolDeposit,
		decentralisation: 0,
		minPoolCost: pp.minPoolCost?.toString(),
		priceMem: pp.executionUnitPrices?.priceMemory,
		priceStep: pp.executionUnitPrices?.priceSteps,
		maxTxExMem: pp.maxTxExecutionUnits?.memory?.toString(),
		maxTxExSteps: pp.maxTxExecutionUnits?.steps?.toString(),
		maxBlockExMem: pp.maxBlockExecutionUnits?.memory?.toString(),
		maxBlockExSteps: pp.maxBlockExecutionUnits?.steps?.toString(),
		maxValSize: pp.maxValueSize,
		collateralPercent: pp.collateralPercentage,
		maxCollateralInputs: pp.maxCollateralInputs,
		// In-head this is 0, which castProtocol must preserve rather than
		// substituting the L1 default.
		coinsPerUtxoSize: pp.utxoCostPerByte,
		minFeeRefScriptCostPerByte: pp.minFeeRefScriptCostPerByte
	})
}
