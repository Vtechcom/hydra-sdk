import { UTxOObject } from '@hydra-sdk/core'
import type { Transaction } from './transaction.type'
import type { PostTxError } from './post-tx-error.type'

/**
 * Client-facing head status, as reported by the `headStatus` field of {@link Greetings}.
 *
 * Source: `Hydra.API.ServerOutput.HeadStatus` (hydra-node v2.3.0).
 *
 * NOTE: This is NOT the same set as the `tag` of `GET /head` — that endpoint
 * returns a `HeadState`, see {@link HydraHeadStateTag}.
 */
export enum HydraHeadStatus {
	Idle = 'Idle',
	Open = 'Open',
	Closed = 'Closed',
	FanoutPossible = 'FanoutPossible',
	/**
	 * @experimental Not present in released hydra-node v2.3.0. Landed on master
	 * after the 2.3.0 tag as part of selective partial fanout (#2750).
	 */
	FanningOut = 'FanningOut'
}

/**
 * Commands a client may send to the hydra-node over the WebSocket.
 *
 * Source: `Hydra.API.ClientInput.ClientInput` (hydra-node v2.3.0).
 */
export enum HydraCommand {
	Init = 'Init',
	NewTx = 'NewTx',
	Recover = 'Recover',
	Decommit = 'Decommit',
	Close = 'Close',
	/**
	 * Close the head only when it holds no non-ADA assets. The node replies with
	 * {@link HydraHeadTag.InvalidInput} when non-ADA assets are present.
	 */
	SafeClose = 'SafeClose',
	Contest = 'Contest',
	Fanout = 'Fanout',
	SideLoadSnapshot = 'SideLoadSnapshot',
	/**
	 * @experimental Not present in released hydra-node v2.3.0 (landed post-tag, #2750).
	 */
	PartialFanout = 'PartialFanout'
}

type VKeyAddress = { vkey: string }

/**
 * Message tags emitted by the hydra-node.
 *
 * Source: `Hydra.API.ServerOutput.ServerOutput` + `ClientMessage` + `InvalidInput`
 * (hydra-node v2.3.0).
 */
export enum HydraHeadTag {
	/**
	 * Unknown tag — only used client-side as a fallback, never sent by the node.
	 */
	Unknown = 'Unknown',

	// -- Network -------------------------------------------------------------
	NetworkConnected = 'NetworkConnected',
	NetworkDisconnected = 'NetworkDisconnected',
	NetworkVersionMismatch = 'NetworkVersionMismatch',
	NetworkClusterIDMismatch = 'NetworkClusterIDMismatch',
	PeerConnected = 'PeerConnected',
	PeerDisconnected = 'PeerDisconnected',

	// -- Head lifecycle ------------------------------------------------------
	HeadIsOpen = 'HeadIsOpen',
	HeadIsClosed = 'HeadIsClosed',
	HeadIsContested = 'HeadIsContested',
	ReadyToFanout = 'ReadyToFanout',
	HeadIsFinalized = 'HeadIsFinalized',
	IgnoredHeadInitializing = 'IgnoredHeadInitializing',
	/**
	 * @experimental Not present in released hydra-node v2.3.0 (landed post-tag, #2750).
	 */
	HeadPartiallyFannedOut = 'HeadPartiallyFannedOut',

	// -- L2 transactions -----------------------------------------------------
	TxValid = 'TxValid',
	TxInvalid = 'TxInvalid',
	SnapshotConfirmed = 'SnapshotConfirmed',
	SnapshotSideLoaded = 'SnapshotSideLoaded',

	// -- Decommit ------------------------------------------------------------
	DecommitInvalid = 'DecommitInvalid',
	DecommitRequested = 'DecommitRequested',
	DecommitApproved = 'DecommitApproved',
	DecommitFinalized = 'DecommitFinalized',

	// -- Incremental commit (deposit) ---------------------------------------
	CommitRecorded = 'CommitRecorded',
	DepositActivated = 'DepositActivated',
	DepositExpired = 'DepositExpired',
	CommitApproved = 'CommitApproved',
	CommitFinalized = 'CommitFinalized',
	CommitRecovered = 'CommitRecovered',

	// -- Node / chain sync ---------------------------------------------------
	EventLogRotated = 'EventLogRotated',
	NodeUnsynced = 'NodeUnsynced',
	NodeSynced = 'NodeSynced',

	// -- Not a ServerOutput: sent untimed (no seq/timestamp) ------------------
	Greetings = 'Greetings',
	InvalidInput = 'InvalidInput',
	CommandFailed = 'CommandFailed',
	PostTxOnChainFailed = 'PostTxOnChainFailed',
	RejectedInputBecauseUnsynced = 'RejectedInputBecauseUnsynced',
	SideLoadSnapshotRejected = 'SideLoadSnapshotRejected',
	SyncedStatusReport = 'SyncedStatusReport'
}

// ============================================================================
// Envelope
// ============================================================================

/**
 * Every `ServerOutput` is wrapped in a `TimedServerOutput`, which adds `seq`
 * and `timestamp`.
 *
 * `ClientMessage`, `Greetings` and `InvalidInput` are NOT wrapped — they carry
 * neither `seq` nor `timestamp` (see `Hydra.API.WSServer.sendOutputs`).
 */
export type BasePayload = {
	tag: HydraHeadTag
	/** Monotonically increasing sequence number assigned by the node. */
	seq: number
	/** ISO-8601 UTC timestamp assigned by the node. */
	timestamp: string
}

/** Payload sent untimed by the node — no `seq`, no `timestamp`. */
type UntimedPayload = {
	tag: HydraHeadTag
}

// ============================================================================
// Untimed messages
// ============================================================================

export type Greetings = UntimedPayload & {
	tag: HydraHeadTag.Greetings
	me: VKeyAddress
	headStatus: HydraHeadStatus
	/**
	 * Absent while the node is Idle and has never observed a head.
	 *
	 * NOTE: omitted from the JSON entirely rather than sent as `null` —
	 * `Greetings` serializes with `omitNothingFields = True`.
	 */
	hydraHeadId?: string
	/** Absent when Idle, or when connected with `snapshot-utxo=no`. */
	snapshotUtxo?: UTxOObject
	hydraNodeVersion: string
	/** Current chain slot at the time the greeting was produced. */
	currentSlot: number
	chainSyncedStatus: SyncedStatus
	env: HydraNodeEnvironment
	networkInfo: HydraNetworkInfo
}

export type SyncedStatus = 'InSync' | 'CatchingUp'

/**
 * Effective node configuration, as reported in {@link Greetings}.
 *
 * NOTE: the node's `Environment` also holds a `signingKey`, but its `ToJSON`
 * instance deliberately omits it — it is never on the wire.
 */
export type HydraNodeEnvironment = {
	party: VKeyAddress
	otherParties: VKeyAddress[]
	participants: string[]
	/** Contestation period in seconds. */
	contestationPeriod: number
	/** Deposit period in seconds. */
	depositPeriod: number
	/** Seconds after which the node considers itself out of sync with the chain. */
	unsyncedPeriod: number
	configuredPeers: string
}

export type HydraNetworkInfo = {
	networkConnected: boolean
	/** Host → reachable. */
	peersInfo: Record<string, boolean>
}

/**
 * Sent when the node fails to decode a client input.
 *
 * NOTE: the node sends this **without a `tag`** — `InvalidInput` is a
 * single-constructor record whose `ToJSON` does not set `tagSingleConstructors`
 * (unlike {@link Greetings}), so the wire form is just `{ reason, input }`.
 * The connectors add `tag` on receipt so the payload union stays discriminated;
 * see `isInvalidInputPayload`.
 */
export type InvalidInput = UntimedPayload & {
	tag: HydraHeadTag.InvalidInput
	reason: string
	/** The raw text the client sent. */
	input: string
}

/**
 * Detect the node's untagged `InvalidInput` message.
 *
 * It is the only payload the node sends with no `tag`, so structural detection
 * is unambiguous.
 */
export const isInvalidInputPayload = (payload: unknown): payload is Omit<InvalidInput, 'tag'> =>
	typeof payload === 'object' &&
	payload !== null &&
	!('tag' in payload) &&
	typeof (payload as Record<string, unknown>).reason === 'string' &&
	typeof (payload as Record<string, unknown>).input === 'string'

export type CommandFailed = UntimedPayload & {
	tag: HydraHeadTag.CommandFailed
	clientInput: { tag: HydraCommand } & Record<string, unknown>
	/** Full `HeadState` at the time of failure. */
	state: HydraHeadState
}

export type PostTxOnChainFailed = UntimedPayload & {
	tag: HydraHeadTag.PostTxOnChainFailed
	postChainTx: { tag: string } & Record<string, unknown>
	postTxError: PostTxError
}

/**
 * The node refused a client input because it is not synced with the chain.
 * Emitted since hydra-node v1.3.0 (PR #2290) — treat as a terminal failure for
 * the command that was rejected.
 */
export type RejectedInputBecauseUnsynced = UntimedPayload & {
	tag: HydraHeadTag.RejectedInputBecauseUnsynced
	clientInput: { tag: HydraCommand } & Record<string, unknown>
	/** Seconds the node is behind the chain. */
	drift: number
}

export type SideLoadSnapshotRejected = UntimedPayload & {
	tag: HydraHeadTag.SideLoadSnapshotRejected
	clientInput: { tag: HydraCommand } & Record<string, unknown>
	requirementFailure: Record<string, unknown>
}

export type SyncedStatusReport = UntimedPayload & {
	tag: HydraHeadTag.SyncedStatusReport
	chainSlot: number
	/** ISO-8601 UTC time of `chainSlot` — authoritative for slot arithmetic. */
	chainTime: string
	drift: number
	synced: SyncedStatus
}

// ============================================================================
// Network outputs
// ============================================================================

export type NetworkConnected = BasePayload & { tag: HydraHeadTag.NetworkConnected }
export type NetworkDisconnected = BasePayload & { tag: HydraHeadTag.NetworkDisconnected }

export type NetworkVersionMismatch = BasePayload & {
	tag: HydraHeadTag.NetworkVersionMismatch
	ourVersion: number
	theirVersion: number | null
}

export type NetworkClusterIDMismatch = BasePayload & {
	tag: HydraHeadTag.NetworkClusterIDMismatch
	clusterPeers: string
	misconfiguredPeers: string
}

export type PeerConnected = BasePayload & {
	tag: HydraHeadTag.PeerConnected
	peer: string
}

export type PeerDisconnected = BasePayload & {
	tag: HydraHeadTag.PeerDisconnected
	peer: string
}

// ============================================================================
// Head lifecycle outputs
// ============================================================================

/**
 * The head is open and ready for L2 transactions.
 *
 * BREAKING vs hydra-node v1.x: this no longer carries `utxo`. Seed the UTxO
 * cache from {@link Greetings.snapshotUtxo}, `GET /snapshot/utxo` or the next
 * {@link SnapshotConfirmed}.
 */
export type HeadIsOpen = BasePayload & {
	tag: HydraHeadTag.HeadIsOpen
	headId: string
	parties: VKeyAddress[]
}

export type HeadIsClosed = BasePayload & {
	tag: HydraHeadTag.HeadIsClosed
	headId: string
	snapshotNumber: number
	/**
	 * Informational only — wait for {@link ReadyToFanout} before sending
	 * {@link HydraCommand.Fanout}.
	 */
	contestationDeadline: string
}

export type HeadIsContested = BasePayload & {
	tag: HydraHeadTag.HeadIsContested
	headId: string
	snapshotNumber: number
	contestationDeadline: string
}

export type ReadyToFanout = BasePayload & {
	tag: HydraHeadTag.ReadyToFanout
	headId: string
}

/**
 * The head is finalized and its UTxO distributed back to L1.
 *
 * BREAKING vs hydra-node v1.x: field renamed `utxo` → `finalizedUTxO`.
 * It is still a UTxO map (the upstream CHANGELOG's "map → array" note does not
 * match the shipped code).
 */
export type HeadIsFinalized = BasePayload & {
	tag: HydraHeadTag.HeadIsFinalized
	headId: string
	finalizedUTxO: UTxOObject
}

export type IgnoredHeadInitializing = BasePayload & {
	tag: HydraHeadTag.IgnoredHeadInitializing
	headId: string
	contestationPeriod: number
	parties: VKeyAddress[]
	participants: string[]
}

/**
 * One selective partial fanout step was observed on chain.
 *
 * @experimental Not emitted by released hydra-node v2.3.0 (landed post-tag, #2750).
 */
export type HeadPartiallyFannedOut = BasePayload & {
	tag: HydraHeadTag.HeadPartiallyFannedOut
	headId: string
	distributedUTxO: UTxOObject
	remainingUTxO: UTxOObject
	/**
	 * `AwaitingFanoutSelection` means the node is waiting for the next
	 * {@link HydraCommand.PartialFanout}; `AutoFanningOut` means it keeps
	 * draining on its own.
	 */
	fanoutMode: 'AutoFanningOut' | 'AwaitingFanoutSelection'
}

// ============================================================================
// L2 transaction outputs
// ============================================================================

export type TxValid = BasePayload & {
	tag: HydraHeadTag.TxValid
	headId: string
	transactionId: string
}

export type TxInvalid = BasePayload & {
	tag: HydraHeadTag.TxInvalid
	headId: string
	utxo: UTxOObject
	transaction: Transaction
	validationError: {
		reason: string
	}
}

export type HydraSnapshot = {
	headId: string
	version: number
	number: number
	confirmed: Transaction[]
	/** Omitted when connected with `snapshot-utxo=no`. */
	utxo?: UTxOObject
	/** `null` when there is no pending incremental commit. */
	utxoToCommit: UTxOObject | null
	/** `null` when there is no pending decommit. */
	utxoToDecommit: UTxOObject | null
	/**
	 * Hex-encoded blake2b-256 hash of the BLS accumulator commitment.
	 * Added in hydra-node v2.x.
	 */
	accumulator: string
}

export type SnapshotConfirmed = BasePayload & {
	tag: HydraHeadTag.SnapshotConfirmed
	headId: string
	snapshot: HydraSnapshot
	signatures: {
		multiSignature: string[]
	}
}

export type SnapshotSideLoaded = BasePayload & {
	tag: HydraHeadTag.SnapshotSideLoaded
	headId: string
	snapshotNumber: number
}

// ============================================================================
// Decommit outputs
// ============================================================================

export type DecommitRequested = BasePayload & {
	tag: HydraHeadTag.DecommitRequested
	headId: string
	decommitTx: Transaction
	utxoToDecommit: UTxOObject
}

export type DecommitInvalid = BasePayload & {
	tag: HydraHeadTag.DecommitInvalid
	headId: string
	decommitTx: Transaction
	decommitInvalidReason:
		| {
				tag: 'DecommitTxInvalid'
				localUTxO: UTxOObject
				validationError: { reason: string }
		  }
		| {
				tag: 'DecommitAlreadyInFlight'
				otherDecommitTxId: string
		  }
}

export type DecommitApproved = BasePayload & {
	tag: HydraHeadTag.DecommitApproved
	headId: string
	decommitTxId: string
	utxoToDecommit: UTxOObject
}

export type DecommitFinalized = BasePayload & {
	tag: HydraHeadTag.DecommitFinalized
	headId: string
	distributedUTxO: UTxOObject
}

// ============================================================================
// Incremental commit (deposit) outputs
// ============================================================================

/**
 * A deposit transaction was observed on chain. The deposit is not yet usable —
 * wait for {@link DepositActivated}.
 */
export type CommitRecorded = BasePayload & {
	tag: HydraHeadTag.CommitRecorded
	headId: string
	utxoToCommit: UTxOObject
	/** TxId of the deposit transaction. */
	pendingDeposit: string
	deadline: string
}

/** The deposit is now old enough to be included in a snapshot. */
export type DepositActivated = BasePayload & {
	tag: HydraHeadTag.DepositActivated
	headId: string
	depositTxId: string
	deadline: string
	chainTime: string
}

/** The deposit passed its deadline and can only be recovered. */
export type DepositExpired = BasePayload & {
	tag: HydraHeadTag.DepositExpired
	headId: string
	depositTxId: string
	deadline: string
	chainTime: string
}

export type CommitApproved = BasePayload & {
	tag: HydraHeadTag.CommitApproved
	headId: string
	utxoToCommit: UTxOObject
}

export type CommitFinalized = BasePayload & {
	tag: HydraHeadTag.CommitFinalized
	headId: string
	depositTxId: string
}

export type CommitRecovered = BasePayload & {
	tag: HydraHeadTag.CommitRecovered
	headId: string
	recoveredUTxO: UTxOObject
	recoveredTxId: string
}

// ============================================================================
// Node / chain sync outputs
// ============================================================================

export type EventLogRotated = BasePayload & {
	tag: HydraHeadTag.EventLogRotated
	checkpoint: Record<string, unknown>
}

/** The node fell behind the chain and will reject client inputs until synced. */
export type NodeUnsynced = BasePayload & {
	tag: HydraHeadTag.NodeUnsynced
	chainSlot: number
	chainTime: string
	drift: number
}

export type NodeSynced = BasePayload & {
	tag: HydraHeadTag.NodeSynced
	chainSlot: number
	chainTime: string
	drift: number
}

// ============================================================================
// HeadState (GET /head, CommandFailed.state)
// ============================================================================

/**
 * `tag` of a `HeadState` — distinct from {@link HydraHeadStatus}.
 * Source: `Hydra.HeadLogic.State.HeadState` (v2.3.0).
 */
export type HydraHeadStateTag = 'Idle' | 'Open' | 'Closed'

export type SeenSnapshot =
	| { tag: 'NoSeenSnapshot' }
	| { tag: 'LastSeenSnapshot'; lastSeen: number }
	| { tag: 'RequestedSnapshot'; lastSeen: number; requested: number }
	| { tag: 'SeenSnapshot'; snapshot: HydraSnapshot; signatories: Record<string, string> }

export type ConfirmedSnapshot =
	| { tag: 'InitialSnapshot'; headId: string; initialUTxO: UTxOObject }
	| {
			tag: 'ConfirmedSnapshot'
			snapshot: HydraSnapshot
			signatures: { multiSignature: string[] }
	  }

export type HeadParameters = {
	contestationPeriod: number
	parties: VKeyAddress[]
}

export type CoordinatedHeadState = {
	localUTxO: UTxOObject
	localTxs: Transaction[]
	allTxs: Record<string, Transaction>
	confirmedSnapshot: ConfirmedSnapshot
	seenSnapshot: SeenSnapshot
	currentDepositTxId: string | null
	decommitTx: Transaction | null
	version: number
}

export type HydraHeadState =
	| {
			tag: 'Idle'
			contents: { chainState: Record<string, unknown> }
	  }
	| {
			tag: 'Open'
			contents: {
				parameters: HeadParameters
				coordinatedHeadState: CoordinatedHeadState
				chainState: Record<string, unknown>
				headId: string
				headSeed: string
			}
	  }
	| {
			tag: 'Closed'
			contents: {
				parameters: HeadParameters
				confirmedSnapshot: ConfirmedSnapshot
				contestationDeadline: string
				readyToFanoutSent: boolean
				chainState: Record<string, unknown>
				headId: string
				headSeed: string
				version: number
				/** `null` until the first partial fanout has occurred. */
				remainingFanoutOutputs: UTxOObject | null
				distributedFanoutOutputs: UTxOObject
			}
	  }

// ============================================================================
// Unions
// ============================================================================

/** Messages carrying `seq` + `timestamp`. */
export type TimedHydraPayload =
	| NetworkConnected
	| NetworkDisconnected
	| NetworkVersionMismatch
	| NetworkClusterIDMismatch
	| PeerConnected
	| PeerDisconnected
	| HeadIsOpen
	| HeadIsClosed
	| HeadIsContested
	| ReadyToFanout
	| HeadIsFinalized
	| IgnoredHeadInitializing
	| HeadPartiallyFannedOut
	| TxValid
	| TxInvalid
	| SnapshotConfirmed
	| SnapshotSideLoaded
	| DecommitRequested
	| DecommitInvalid
	| DecommitApproved
	| DecommitFinalized
	| CommitRecorded
	| DepositActivated
	| DepositExpired
	| CommitApproved
	| CommitFinalized
	| CommitRecovered
	| EventLogRotated
	| NodeUnsynced
	| NodeSynced

/** Messages sent without `seq`/`timestamp`. */
export type UntimedHydraPayload =
	| Greetings
	| InvalidInput
	| CommandFailed
	| PostTxOnChainFailed
	| RejectedInputBecauseUnsynced
	| SideLoadSnapshotRejected
	| SyncedStatusReport

export type HydraPayload = Readonly<TimedHydraPayload | UntimedHydraPayload>
