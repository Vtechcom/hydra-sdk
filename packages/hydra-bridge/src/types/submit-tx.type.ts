import { UTxOObject } from '@hydra-sdk/core'

/**
 * A Cardano transaction in the text envelope format . That is, a JSON object wrapper with some `type` around a `cborHex` encoded transaction. The hydra-node uses this format as follows:
 - When encoding, an additonal 'txId' is included.
 - On decoding, when 'txId' is included it is checked to be consistent.
 - The 'type' is not used to determine content and any transaction is tried to decode as a 'ConwayEra' transaction, which mostly is backward compatible to previous eras.
 */
export type SubmitTxBody = {
	type: 'Tx ConwayEra' | 'Unwitnessed Tx ConwayEra' | 'Witnessed Tx ConwayEra'
	description: string
	/**
	 * The base16-encoding of the CBOR encoding of some binary data
	 */
	cborHex: string
	/**
	 * A Cardano transaction identifier. This is the hex-encoded hash of the transaction's body.
	 */
	txId?: string
}

export type SubmitTxResponse =
	| TransactionSubmitted
	| ScriptFailedInWallet
	| NotEnoughFuel
	| NoFuelUTXOFound
	| CannotFindOwnInitial
	| UnsupportedLegacyOutput
	| NoSeedInput
	| InvalidStateToPost
	| PlutusValidationFailed
	| FailedToPostTx
	| CommittedTooMuchADAForMainnet
	| FailedToDraftTxNotInitializing
	| InvalidSeed
	| InvalidHeadId
	| FailedToConstructAbortTx
	| FailedToConstructCloseTx
	| FailedToConstructContestTx
	| FailedToConstructCollectTx
	| FailedToConstructDepositTx
	| FailedToConstructRecoverTx
	| FailedToConstructIncrementTx
	| FailedToConstructDecrementTx
	| FailedToConstructFanoutTx

type TransactionSubmitted = {
	tag: 'TransactionSubmitted'
}

type NotEnoughFuel = {
	tag: 'NotEnoughFuel'
}

type NoFuelUTXOFound = {
	tag: 'NoFuelUTXOFound'
}

type ScriptFailedInWallet = {
	tag: 'ScriptFailedInWallet'
	redeemerPtr: string
	failureReason: string
}

type CannotFindOwnInitial = {
	tag: 'CannotFindOwnInitial'
	knownUTxO: UTxOObject
}

type UnsupportedLegacyOutput = {
	tag: 'UnsupportedLegacyOutput'
	byronAddress: string
}

/**
 * Initialising a new Head failed because the DirectChain component was unable to find a "seed" UTxO to consume.
 * This can happen if no UTxO has been assigned to the internal wallet's address for this purpose, or if the component is still catching up with the chain.
 * This error is usually transient and clients should retry to post the transaction.
 */
type NoSeedInput = {
	tag: 'NoSeedInput'
}

// TODO: need update info
type InvalidStateToPost = {
	tag: 'InvalidStateToPost'
}

// TODO: need update info
type PlutusValidationFailed = {
	tag: 'PlutusValidationFailed'
}

// TODO: need update info
type FailedToPostTx = {
	tag: 'FailedToPostTx'
}

// TODO: need update info
type CommittedTooMuchADAForMainnet = {
	tag: 'CommittedTooMuchADAForMainnet'
}

// TODO: need update info
type FailedToDraftTxNotInitializing = {
	tag: 'FailedToDraftTxNotInitializing'
}

// TODO: need update info
type InvalidSeed = {
	tag: 'InvalidSeed'
}

// TODO: need update info
type InvalidHeadId = {
	tag: 'InvalidHeadId'
}

// TODO: need update info
type FailedToConstructAbortTx = {
	tag: 'FailedToConstructAbortTx'
}

// TODO: need update info
type FailedToConstructCloseTx = {
	tag: 'FailedToConstructCloseTx'
}

// TODO: need update info
type FailedToConstructContestTx = {
	tag: 'FailedToConstructContestTx'
}

// TODO: need update info
type FailedToConstructCollectTx = {
	tag: 'FailedToConstructCollectTx'
}

// TODO: need update info
type FailedToConstructDepositTx = {
	tag: 'FailedToConstructDepositTx'
}

// TODO: need update info
type FailedToConstructRecoverTx = {
	tag: 'FailedToConstructRecoverTx'
}

// TODO: need update info
type FailedToConstructIncrementTx = {
	tag: 'FailedToConstructIncrementTx'
}

// TODO: need update info
type FailedToConstructDecrementTx = {
	tag: 'FailedToConstructDecrementTx'
}

// TODO: need update info
type FailedToConstructFanoutTx = {
	tag: 'FailedToConstructFanoutTx'
}
