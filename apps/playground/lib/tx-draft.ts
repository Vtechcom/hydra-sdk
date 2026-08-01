import { DEFAULT_PROTOCOL_PARAMETERS, type Asset, type LanguageVersion, type Protocol, type UTxO } from '@hydra-sdk/core'
import type { CoinSelectionStrategy } from '@hydra-sdk/transaction'

/**
 * The shape of a transaction draft, kept out of the Pinia store so that presets
 * (`lib/tx-fixtures.ts`) and the snippet generator can build/read drafts without
 * importing the store — which would be a cycle, since the store imports presets.
 */

export type DatumMode = 'none' | 'datumhash' | 'inlinedatum'
export type RedeemerMode = 'none' | 'unit' | 'custom'
export type MintScriptType = 'Native' | 'PlutusV1' | 'PlutusV2' | 'PlutusV3'
export type CertificateKind = 'StakeRegistration' | 'StakeDeregistration' | 'StakeDelegation'

export interface TxOutputDraft {
	address: string
	amount: Asset[]
	/** CBOR hex of a datum whose *hash* goes on chain. */
	datum?: string
	/** CBOR hex of a datum stored inline in the output. */
	inlineDatum?: string
}

export interface ScriptInputDraft {
	id: string
	txHash: string
	outputIndex: number
	address: string
	amount: Asset[]
	scriptCborHex: string
	version: LanguageVersion
	datumMode: DatumMode
	datumCborHex: string
	redeemerMode: RedeemerMode
	redeemerCborHex: string
	exUnits: { mem: string; steps: string }
}

export interface ReferenceInputDraft {
	id: string
	txHash: string
	outputIndex: number
}

export interface CollateralDraft {
	id: string
	txHash: string
	outputIndex: number
	address: string
	lovelace: string
}

export interface MintDraft {
	id: string
	policyId: string
	assetName: string
	quantity: string
	scriptType: MintScriptType
	scriptCborHex: string
	redeemerMode: RedeemerMode
	redeemerCborHex: string
}

export interface CertificateDraft {
	id: string
	kind: CertificateKind
	rewardAddress: string
	poolKeyHash: string
}

export interface WithdrawalDraft {
	id: string
	rewardAddress: string
	amount: string
}

export interface MetadataDraft {
	id: string
	label: string
	json: string
}

export interface TxDraft {
	strategy: CoinSelectionStrategy
	inputs: UTxO[]
	outputs: TxOutputDraft[]

	isHydra: boolean

	withChangeAddress: boolean
	changeAddress: string

	withCustomFee: boolean
	customFee: string
	withMinFee: boolean
	minFee: string

	useCustomPParams: boolean
	customPParams: Protocol

	// Tier 2 — advanced
	withValidity: boolean
	invalidBefore: string
	invalidAfter: string
	requiredSigners: string[]
	collateral: CollateralDraft[]
	totalCollateral: string
	collateralReturnAddress: string
	collateralReturnLovelace: string
	metadata: MetadataDraft[]
	mints: MintDraft[]

	// Tier 3 — expert
	scriptInputs: ScriptInputDraft[]
	referenceInputs: ReferenceInputDraft[]
	certificates: CertificateDraft[]
	withdrawals: WithdrawalDraft[]
	useEvaluator: boolean
	evaluatorMultiplier: string
	verbose: boolean
}

export const uid = () => Math.random().toString(36).slice(2, 10)

export const emptyOutput = (): TxOutputDraft => ({
	address: '',
	amount: [{ unit: 'lovelace', quantity: '' }]
})

export const createDefaultDraft = (): TxDraft => ({
	strategy: 'LargestFirstMultiAsset',
	inputs: [],
	outputs: [emptyOutput()],

	isHydra: false,

	withChangeAddress: true,
	changeAddress: '',

	withCustomFee: false,
	customFee: '',
	withMinFee: false,
	minFee: '',

	useCustomPParams: false,
	customPParams: { ...DEFAULT_PROTOCOL_PARAMETERS },

	withValidity: false,
	invalidBefore: '',
	invalidAfter: '',
	requiredSigners: [],
	collateral: [],
	totalCollateral: '',
	collateralReturnAddress: '',
	collateralReturnLovelace: '',
	metadata: [],
	mints: [],

	scriptInputs: [],
	referenceInputs: [],
	certificates: [],
	withdrawals: [],
	useEvaluator: false,
	evaluatorMultiplier: '1.1',
	verbose: false
})
