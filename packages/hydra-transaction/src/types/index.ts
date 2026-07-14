import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { Asset, Datum, IFetcher, ISubmitter, Protocol, Redeemer, ScriptRef, UTxO } from '@hydra-sdk/core'

/**
 * Export for compatibility with 1.1.6 version
 * Will be removed in future versions
 */
export type { Redeemer, ScriptRef, Datum } from '@hydra-sdk/core'
export type { LanguageVersion as PlutusVersion } from '@hydra-sdk/core'

/** Script execution budget returned by an evaluator. */
export interface Budget {
	mem: number
	steps: number
}

/** Redeemer pointer categories a transaction evaluator can report. */
export type EvalRedeemerTag = 'SPEND' | 'MINT' | 'CERT' | 'REWARD' | 'VOTE' | 'PROPOSE'

/** One evaluated redeemer: which script slot it is and its real execution budget. */
export interface EvalAction {
	tag: EvalRedeemerTag
	index: number
	budget: Budget
}

/**
 * Evaluates the Plutus scripts in a transaction and returns the real execution
 * units per redeemer. Implemented by providers (Blockfrost, Ogmios, Demeter, …)
 * or an offline UPLC evaluator. Shape matches MeshJS's IEvaluator for
 * interoperability. CSL itself cannot evaluate scripts, so this is optional and
 * only used when a provider is supplied.
 */
export interface IEvaluator {
	evaluateTx(txHex: string, additionalUtxos?: UTxO[], additionalTxs?: string[]): Promise<EvalAction[]>
}

export interface TxBuilderOptions {
	fetcher?: IFetcher
	submitter?: ISubmitter
	/**
	 * Optional transaction evaluator used to compute real script execution units
	 * (exUnits) for Plutus redeemers. When provided, complete() runs a second
	 * build pass with the evaluated budgets so the fee is correct. When omitted,
	 * the placeholder exUnits are kept unchanged (e.g. for Hydra, which has no
	 * on-chain script evaluation).
	 */
	evaluator?: IEvaluator
	/**
	 * Safety multiplier applied to evaluated exUnits before writing them back
	 * (e.g. 1.1 to over-provision by 10%). Default: 1.
	 */
	txEvaluationMultiplier?: number
	isHydra?: boolean
	params?: Partial<Protocol>
	verbose?: boolean
	/**
	 * Using for testing purpose only
	 * When enabled, the tx building process will be more strict and throw error in case of any issue
	 * This is useful for testing and debugging
	 *
	 * For example, if the coin selection fails, it will throw an error instead of trying to continue
	 * and potentially creating an invalid transaction
	 *
	 * NOTE: This mode is not recommended for production use
	 *
	 * Default: false
	 *
	 */
	errorLogger?: boolean
}

export const COIN_SELECTION_STRATEGY = {
	LargestFirst: CardanoWASM.CoinSelectionStrategyCIP2.LargestFirst,
	RandomImprove: CardanoWASM.CoinSelectionStrategyCIP2.RandomImprove,
	LargestFirstMultiAsset: CardanoWASM.CoinSelectionStrategyCIP2.LargestFirstMultiAsset,
	RandomImproveMultiAsset: CardanoWASM.CoinSelectionStrategyCIP2.RandomImproveMultiAsset
} as const

export type CoinSelectionStrategy = keyof typeof COIN_SELECTION_STRATEGY

// Policy script types
export type PolicyScript = {
	type: 'PlutusV1' | 'PlutusV2' | 'PlutusV3' | 'Native'
	scriptCborHex: string
}

// Mint asset interface
export interface MintAsset {
	assetName: string
	quantity: string
	policyId: string
	policyScript?: PolicyScript
	redeemer?: Redeemer
}

// Certificate types
export type CertificateType =
	| 'StakeRegistration'
	| 'StakeDeregistration'
	| 'StakeDelegation'
	| 'PoolRegistration'
	| 'PoolRetirement'

export interface Certificate {
	type: CertificateType
	stakeKeyHash?: string
	poolKeyHash?: string
	rewardAddress?: string
	poolParams?: any
	epoch?: number
}

// Withdrawal interface
export interface Withdrawal {
	rewardAddress: string
	amount: string
}

// Metadata interface
// Transaction Metadata

export type MetadatumMap = Map<Metadatum, Metadatum>
export type Metadatum = bigint | number | string | Uint8Array | MetadatumMap | Metadatum[]
export type TxMetadata = Map<bigint, Metadatum>

// to be used for serialization
export type Metadata = {
	tag: string
	metadata: string
}

// Validity range interface
export interface ValidityRange {
	invalidBefore?: number
	invalidAfter?: number
}

// Transaction input with script support
export interface TxIn {
	txHash: string
	outputIndex: number
	amount?: Asset[]
	address?: string
	/**
	 * Datum for the input (if any)
	 *
	 * Only one of datum or inlineDatum can be set
	 *
	 * NOTE: If the input contains inlineDatum, then datum is not required
	 *
	 * NOTE: Providing datum will help save costs compared to using inlineDatum
	 *
	 * See: https://docs.cardano.org/plutus/cost-model#inline-datums
	 *
	 * NOTE:
	 */
	datum?: Datum

	inlineDatum?: Datum
	redeemer?: Redeemer
	scriptRef?: ScriptRef
}

export interface TxScriptIn {
	txHash: string
	outputIndex: number
	amount?: Asset[]
	address?: string

	// Datum
	datum?: Datum

	// Inline datum
	inlineDatum?: Datum
	inlineDatumHash?: string
	inineDatumRaw?: string
	redeemer?: Redeemer
	scriptRef?: ScriptRef
}

// Collateral input
export interface CollateralInput {
	txHash: string
	outputIndex: number
	amount: Asset[]
	address: string
}
