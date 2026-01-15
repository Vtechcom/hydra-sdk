export type LanguageVersion = 'V1' | 'V2' | 'V3'

export type ScriptType = `Plutus${LanguageVersion}` | 'Native'

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
