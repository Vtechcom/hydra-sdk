import { UTxOObject } from '@hydra-sdk/core'
import type { Transaction } from './transaction.type'

/**
 * Errors reported when the node fails to post a transaction on L1.
 *
 * Source: `Hydra.Chain.PostTxError` (hydra-node v2.3.0). Surfaced through
 * `PostTxOnChainFailed` on the WebSocket and as the body of a failed
 * `POST /cardano-transaction`.
 */
export type PostTxError =
	| NoSeedInput
	| InvalidSeed
	| InvalidHeadId
	| UnsupportedLegacyOutput
	| DepositTooLow
	| InvalidStateToPost
	| NotEnoughFuel
	| NoFuelUTXOFound
	| ScriptFailedInWallet
	| InternalWalletError
	| FailedToPostTx
	| FailedToConstructCloseTx
	| FailedToConstructContestTx
	| FailedToConstructDepositTx
	| FailedToConstructRecoverTx
	| FailedToConstructIncrementTx
	| FailedToConstructDecrementTx
	| FailedToConstructFanoutTx
	| FailedToConstructPartialFanoutTx
	| StalePartialFanoutTx
	| ContestationDeadlineOutsideTimeHorizon
	| InvalidTokenRequest

/**
 * Initialising a new head failed because the chain component could not find a
 * "seed" UTxO to consume. Usually transient — retry.
 */
export type NoSeedInput = {
	tag: 'NoSeedInput'
}

export type InvalidSeed = {
	tag: 'InvalidSeed'
	headSeed: string
}

export type InvalidHeadId = {
	tag: 'InvalidHeadId'
	headId: string
}

/** Committing Byron addresses is not supported. */
export type UnsupportedLegacyOutput = {
	tag: 'UnsupportedLegacyOutput'
	byronAddress: string
}

export type DepositTooLow = {
	tag: 'DepositTooLow'
	providedValue: number
	minimumValue: number
}

export type InvalidStateToPost = {
	tag: 'InvalidStateToPost'
	txTried: Record<string, unknown>
	chainState: Record<string, unknown>
}

export type NotEnoughFuel = {
	tag: 'NotEnoughFuel'
	failingTx: Transaction
}

export type NoFuelUTXOFound = {
	tag: 'NoFuelUTXOFound'
	failingTx: Transaction
}

/** Script execution failed while the internal wallet was finalizing a tx. */
export type ScriptFailedInWallet = {
	tag: 'ScriptFailedInWallet'
	redeemerPtr: string
	failureReason: string
	failingTx: Transaction
}

export type InternalWalletError = {
	tag: 'InternalWalletError'
	headUTxO: UTxOObject
	reason: string
	failingTx: Transaction
}

export type FailedToPostTx = {
	tag: 'FailedToPostTx'
	failureReason: string
	failingTx: Transaction
}

export type FailedToConstructCloseTx = {
	tag: 'FailedToConstructCloseTx'
}

export type FailedToConstructContestTx = {
	tag: 'FailedToConstructContestTx'
}

export type FailedToConstructDepositTx = {
	tag: 'FailedToConstructDepositTx'
	failureReason: string
}

export type FailedToConstructRecoverTx = {
	tag: 'FailedToConstructRecoverTx'
	failureReason: string
}

export type FailedToConstructIncrementTx = {
	tag: 'FailedToConstructIncrementTx'
	failureReason: string
}

export type FailedToConstructDecrementTx = {
	tag: 'FailedToConstructDecrementTx'
	failureReason: string
}

export type FailedToConstructFanoutTx = {
	tag: 'FailedToConstructFanoutTx'
}

export type FailedToConstructPartialFanoutTx = {
	tag: 'FailedToConstructPartialFanoutTx'
}

/**
 * Another node already posted this partial fanout step; the chain observation
 * loop will emit the correct next step automatically.
 */
export type StalePartialFanoutTx = {
	tag: 'StalePartialFanoutTx'
}

export type ContestationDeadlineOutsideTimeHorizon = {
	tag: 'ContestationDeadlineOutsideTimeHorizon'
	failureReason: string
}

export type InvalidTokenRequest = {
	tag: 'InvalidTokenRequest'
	contents: Array<[string, Record<string, number>]>
}
