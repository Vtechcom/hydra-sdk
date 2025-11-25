import { UTxOObject } from '@hydra-sdk/core'
import { Transaction } from './transaction.type'

/**
 * Draft a commit transaction, which can be completed and later submitted to the L1 network.
 */
export type CommitBody = EmptyCommitBody | UtxoCommitBody | BlueprintCommitBody

export type EmptyCommitBody = {}
export type UtxoCommitBody = UTxOObject
export type BlueprintCommitBody = {
	blueprintTx: Transaction
	utxo: UTxOObject
}

/**
 * `draftCommitTxResponse`
 */
export type CommitResponse = Omit<Transaction, 'txId'> & { txId?: string }
