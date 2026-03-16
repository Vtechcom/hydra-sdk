import { UTxOObject } from '@hydra-sdk/core'
import type { Transaction } from './transaction.type'

// export type HydraHeadStatus  = 'Idle' | 'Initializing' | 'Open' | 'Closed' | 'FanoutPossible' | 'Final'
export enum HydraHeadStatus {
	Idle = 'Idle',
	Initializing = 'Initializing',
	Open = 'Open',
	Closed = 'Closed',
	FanoutPossible = 'FanoutPossible',
	Final = 'Final'
}

export enum HydraCommand {
	Init = 'Init',
	Abort = 'Abort',
	NewTx = 'NewTx',
	/**
	 * @deprecated
	 */
	GetUTxO = 'GetUTxO',
	Recover = 'Recover',
	Decommit = 'Decommit',
	Close = 'Close',
	Contest = 'Contest',
	Fanout = 'Fanout'
}

type VKeyAddress = { vkey: string }

export enum HydraHeadTag {
	/**
	 * Unknown tag - only use in client
	 */
	Unknown = 'Unknown',

	PeerConnected = 'PeerConnected',
	PeerDisconnected = 'PeerDisconnected',
	PeerHandshakeFailure = 'PeerHandshakeFailure',

	HeadIsInitializing = 'HeadIsInitializing',
	HeadIsOpen = 'HeadIsOpen',
	Committed = 'Committed',
	HeadIsClosed = 'HeadIsClosed',
	HeadIsContested = 'HeadIsContested',
	ReadyToFanout = 'ReadyToFanout',
	HeadIsAborted = 'HeadIsAborted',
	HeadIsFinalized = 'HeadIsFinalized',

	TxValid = 'TxValid',
	TxInvalid = 'TxInvalid',
	SnapshotConfirmed = 'SnapshotConfirmed',
	/**
	 * @deprecated
	 */
	GetUTxOResponse = 'GetUTxOResponse',
	CommandFailed = 'CommandFailed',
	Greetings = 'Greetings',
	PostTxOnChainFailed = 'PostTxOnChainFailed',
	InvalidInput = 'InvalidInput',
	IgnoredHeadInitializing = 'IgnoredHeadInitializing',

	DecommitInvalid = 'DecommitInvalid',
	DecommitRequested = 'DecommitRequested',
	DecommitApproved = 'DecommitApproved',
	DecommitFinalized = 'DecommitFinalized',

	CommitRecorded = 'CommitRecorded',
	CommitApproved = 'CommitApproved',
	CommitFinalized = 'CommitFinalized',
	CommitRecovered = 'CommitRecovered',
	CommitIgnored = 'CommitIgnored'
}

// Message payload ====================================================================================================
export type BasePayload = {
	tag: HydraHeadTag
	timestamp: string
}

export type Greetings = BasePayload & {
	tag: HydraHeadTag.Greetings
	me: {
		vkey: string
	}
	headStatus: HydraHeadStatus
	hydraHeadId: string
	snapshotUtxo: UTxOObject
	timestamp: Date
	hydraNodeVersion: string
	/** Current slot at the time of connection. Available since hydra-node v1.3.0. */
	currentSlot?: number
	/** Whether the node is fully synced with the chain. Available since hydra-node v1.3.0. */
	chainSyncedStatus?: string
	/** Node environment configuration. Available since hydra-node v1.3.0. */
	env?: {
		configuredPeers: string
		contestationPeriod: number
		depositPeriod: number
		otherParties: Array<{ vkey: string }>
		participants: string[]
		party: { vkey: string }
		signingKey: string
		unsyncedPeriod: number
	}
	/** Network connectivity info. Available since hydra-node v1.3.0. */
	networkInfo?: {
		networkConnected: boolean
		peersInfo: Record<string, unknown>
	}
}

export type PeerConnected = BasePayload & {
	tag: HydraHeadTag.PeerConnected
	peer: string
}

export type PeerDisconnected = BasePayload & {
	tag: HydraHeadTag.PeerDisconnected
	peer: string
}

// TODO: update later
export type PeerHandshakeFailure = BasePayload & {
	tag: HydraHeadTag.PeerHandshakeFailure
}

export type HeadIsInitializing = BasePayload & {
	tag: HydraHeadTag.HeadIsInitializing
	headId: string
	seq: number
	parties: VKeyAddress[]
}

export type Committed = BasePayload & {
	tag: HydraHeadTag.Committed
	seq: number
	parties: VKeyAddress[]
	party: VKeyAddress
	utxo: UTxOObject
}

export type HeadIsOpen = BasePayload & {
	tag: HydraHeadTag.HeadIsOpen
	seq: number
	headId: string
	utxo: UTxOObject
}

export type HeadIsClosed = BasePayload & {
	tag: HydraHeadTag.HeadIsClosed
	seq: number
	headId: string
	snapshotNumber: number
	contestationDeadline: string
}

export type HeadIsContested = BasePayload & {
	tag: HydraHeadTag.HeadIsContested
	seq: number
	headId: string
	snapshotNumber: number
	contestationDeadline: string
}

export type ReadyToFanout = BasePayload & {
	tag: HydraHeadTag.ReadyToFanout
	seq: number
	headId: string
}

export type HeadIsAborted = BasePayload & {
	tag: HydraHeadTag.HeadIsAborted
	seq: number
	headId: string
	utxo: UTxOObject
}

export type HeadIsFinalized = BasePayload & {
	tag: HydraHeadTag.HeadIsFinalized
	seq: number
	headId: string
	utxo: UTxOObject
}

export type TxValid = BasePayload & {
	tag: HydraHeadTag.TxValid
	seq: number
	headId: string
	transactionId: string
}

export type TxInvalid = BasePayload & {
	tag: HydraHeadTag.TxInvalid
	seq: number
	headId: string

	utxo: UTxOObject
	transaction: Transaction

	validationError: {
		reason: string
	}
}

// ========================================================================================================================

export type SnapshotConfirmed = {
	tag: HydraHeadTag.SnapshotConfirmed
	seq: number
	headId: string

	snapshot: {
		headId: string
		version: number
		number: number
		confirmed: Transaction[]
		utxo?: UTxOObject
		utxoToCommit: UTxOObject
		utxoToDecommit: UTxOObject
	}
}

/**
 * @deprecated
 */
type GetUTxOResponse = {
	tag: HydraHeadTag.GetUTxOResponse
	seq: number
	headId: string

	utxo: UTxOObject
}

type InvalidInput = {
	tag: HydraHeadTag.InvalidInput
	seq: number
	reason: string
	input: string
}

type PostTxOnChainFailed = {
	tag: HydraHeadTag.PostTxOnChainFailed
	seq: number

	postTxError: {
		tag: 'ScriptFailedInWallet'
		redeemerPtr: string
		failureReason: string
	}

	postChainTx: {
		tag: 'InitTx'
		participants: string[]
		headParameters: {
			contestationPeriod: number
			parties: VKeyAddress[]
		}
	}
}

type CommandFailed = {
	tag: HydraHeadTag.CommandFailed
	seq: number

	clientInput: {
		tag: HydraCommand
	}
	state?: any
}

type IgnoredHeadInitializing = {
	tag: HydraHeadTag.IgnoredHeadInitializing
	seq: number

	headId: string
	contestationPeriod: number
	parties: VKeyAddress[]
	participants: string[]
}

type DecommitInvalid = {
	tag: HydraHeadTag.DecommitInvalid
	seq: number

	headId: string
	decommitTx: Transaction
	decommitInvalidReason: {
		tag: 'DecommitTxInvalid'
		localUTxO: UTxOObject
		validationError: {
			reason: string
		}
	}
}

export type DecommitRequested = {
	tag: HydraHeadTag.DecommitRequested
	seq: number

	headId: string
	decommitTx: Transaction
	utxoToDecommit: UTxOObject
}

export type DecommitApproved = {
	tag: HydraHeadTag.DecommitApproved
	seq: number

	headId: string
	decommitTxId: string
	utxoToDecommit: UTxOObject
}

export type DecommitFinalized = {
	tag: HydraHeadTag.DecommitFinalized
	seq: number

	headId: string
	distributedUTxO: UTxOObject
}

type CommitRecorded = {
	tag: HydraHeadTag.CommitRecorded
	seq: number

	headId: string
	utxoToCommit: UTxOObject
	pendingDeposit: string
	deadline: string
}

type CommitApproved = {
	tag: HydraHeadTag.CommitApproved
	seq: number

	headId: string
	utxoToCommit: UTxOObject
}

type CommitFinalized = {
	tag: HydraHeadTag.CommitFinalized
	seq: number

	headId: string
	theDeposit: string
}

type CommitRecovered = {
	tag: HydraHeadTag.CommitRecovered
	seq: number

	headId: string
	recoveredUTxO: UTxOObject
	recoveredTxId: string
}

type CommitIgnored = {
	tag: HydraHeadTag.CommitIgnored
	seq: number

	headId: string
	depositUTxO: UTxOObject
	snapshotUTxO: UTxOObject
}

export type HydraPayload = Readonly<
	| Greetings
	| PeerConnected
	| PeerDisconnected
	| PeerHandshakeFailure
	| HeadIsInitializing
	| Committed
	| HeadIsOpen
	| HeadIsClosed
	| HeadIsContested
	| HeadIsAborted
	| ReadyToFanout
	| HeadIsFinalized
	| TxValid
	| TxInvalid
	| SnapshotConfirmed
	| GetUTxOResponse
	| InvalidInput
	| PostTxOnChainFailed
	| CommandFailed
	| IgnoredHeadInitializing
	| DecommitInvalid
	| DecommitRequested
	| DecommitApproved
	| DecommitFinalized
	| CommitRecorded
	| CommitApproved
	| CommitFinalized
	| CommitRecovered
	| CommitIgnored
>
