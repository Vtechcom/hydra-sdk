import { UTxOObject } from '@hydra-sdk/core'
import { Transaction } from './transaction.type'

/**
 * Body of `POST /commit` — drafts a deposit transaction which the client
 * completes (signs) and submits to L1.
 *
 * Source: `Hydra.API.HTTPServer.DraftCommitTxRequest` (hydra-node v2.3.0).
 * The node accepts three shapes, tried in order: {@link BlueprintCommitBody},
 * {@link SimpleCommitBody}, then a bare UTxO map ({@link UtxoCommitBody}).
 */
export type CommitBody = EmptyCommitBody | UtxoCommitBody | SimpleCommitBody | BlueprintCommitBody

export type EmptyCommitBody = {}

/**
 * A bare UTxO map. Accepted by the node's `simpleDirectVariant` parser.
 * Prefer {@link SimpleCommitBody} — it is unambiguous.
 */
export type UtxoCommitBody = UTxOObject

/** `SimpleCommitRequest` — commit a plain UTxO set. */
export type SimpleCommitBody = {
	utxoToCommit: UTxOObject
}

/** `FullCommitRequest` — commit via a blueprint transaction. */
export type BlueprintCommitBody = {
	blueprintTx: Transaction
	utxo: UTxOObject
	/**
	 * Where the node sends change from the deposit transaction.
	 * Omit to let the node pick.
	 */
	changeAddress?: string
}

/**
 * `draftCommitTxResponse` — the drafted deposit transaction, unsigned.
 */
export type CommitResponse = Omit<Transaction, 'txId'> & { txId?: string }

/**
 * A pending deposit, as returned by `GET /commits`.
 * The node returns the deposit transaction ids only.
 */
export type PendingDeposit = string
