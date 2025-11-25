import { Protocol } from '@hydra-sdk/core'

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
	costModels: {
		PlutusV1: Array<number>
		PlutusV2: Array<number>
		PlutusV3: Array<number>
	}
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

export const toProtocol = (pp: RawProtocolParameters): Protocol => {
	return {
		epoch: 0,
		minFeeA: pp.txFeePerByte,
		minFeeB: pp.txFeeFixed,
		maxBlockSize: pp.maxBlockBodySize,
		maxTxSize: pp.maxTxSize,
		maxBlockHeaderSize: pp.maxBlockHeaderSize,
		keyDeposit: pp.stakeAddressDeposit,
		poolDeposit: pp.stakePoolDeposit,
		decentralisation: 0,
		minPoolCost: pp.minPoolCost.toString(),
		priceMem: pp.executionUnitPrices.priceMemory,
		priceStep: pp.executionUnitPrices.priceSteps,
		maxTxExMem: pp.maxTxExecutionUnits.memory.toString(),
		maxTxExSteps: pp.maxTxExecutionUnits.steps.toString(),
		maxBlockExMem: pp.maxBlockExecutionUnits.memory.toString(),
		maxBlockExSteps: pp.maxBlockExecutionUnits.steps.toString(),
		maxValSize: pp.maxValueSize,
		collateralPercent: pp.collateralPercentage,
		maxCollateralInputs: pp.maxCollateralInputs,
		coinsPerUtxoSize: pp.utxoCostPerByte,
		minFeeRefScriptCostPerByte: pp.minFeeRefScriptCostPerByte
	}
}
