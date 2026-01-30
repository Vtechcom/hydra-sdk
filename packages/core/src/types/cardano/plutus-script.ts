import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

export type LanguageVersion = 'V1' | 'V2' | 'V3'

export type ScriptType = `Plutus${LanguageVersion}` | 'Native'

// Datum and redeemer types
export type Datum = CardanoWASM.PlutusData
export type Redeemer = CardanoWASM.Redeemer

// Script reference types
export interface ScriptRef {
	scriptCbor: string
	version: LanguageVersion
}

// Policy script types
export type PolicyScript = {
	type: 'PlutusV1' | 'PlutusV2' | 'PlutusV3' | 'Native'
	scriptCborHex: string
}

/** Hex */
export type PolicyId = string

export type Script = { type: ScriptType; scriptCborHex: string }

export type Validator =
	| MintingPolicy
	| SpendingValidator
	| CertificateValidator
	| WithdrawalValidator
	| VoteValidator
	| ProposeValidator

export type MintingPolicy = Script
export type SpendingValidator = Script
export type CertificateValidator = Script
export type WithdrawalValidator = Script
export type VoteValidator = Script
export type ProposeValidator = Script
