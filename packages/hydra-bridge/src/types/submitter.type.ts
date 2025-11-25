import type { CommitBody, CommitResponse } from './commit.type'
import { HydraHeadTag, SnapshotConfirmed } from './payload.type'
import { SubmitTxBody, SubmitTxResponse } from './submit-tx.type'
import { Transaction } from './transaction.type'

export type HydraBridgeSubmitter = {
	commit: (data: CommitBody) => Promise<CommitResponse | null>
	submitCardanoTx: (data: SubmitTxBody) => Promise<SubmitTxResponse | null>
	submitTxSync: (
		tx: Transaction,
		options?: { timeout: number }
	) => Promise<{
		txId: string
		isValid: boolean
		isConfirmed: boolean
		result: Readonly<SnapshotConfirmed> | HydraHeadTag.SnapshotConfirmed | null
	}>
}
