import type { CommitBody, CommitResponse } from './commit.type'
import type { SnapshotConfirmed } from './payload.type'
import type { SideLoadSnapshotBody } from './hydra-head-info.type'
import type { SubmitL2TxResponse, SubmitTxBody, SubmitTxResponse } from './submit-tx.type'
import { Transaction } from './transaction.type'

export type SubmitTxResult = {
	txId: string
	isValid: boolean
	isConfirmed: boolean
	result: Readonly<SnapshotConfirmed> | null
}

export type SubmitTxError = {
	txId: string
	reason: string
	tag: string
}

export type HydraBridgeSubmitter = {
	/** `POST /commit` — draft a deposit transaction. */
	commit: (data: CommitBody) => Promise<CommitResponse | null>
	/** `POST /cardano-transaction` — submit an L1 transaction. */
	submitCardanoTx: (data: SubmitTxBody) => Promise<SubmitTxResponse | null>

	submitTxSync: (tx: Transaction, options?: { timeout: number }) => Promise<SubmitTxResult>
	submitTx: (
		tx: Transaction,
		callback: (error: SubmitTxError | null, result: SubmitTxResult | null) => void,
		options?: { timeout: number }
	) => void

	/**
	 * `POST /transaction` — submit an L2 transaction and let the node report the
	 * verdict, instead of racing WebSocket messages client-side.
	 */
	submitL2Tx?: (tx: Transaction, options?: { timeout: number }) => Promise<SubmitL2TxResponse>
	/** `DELETE /commits/{txId}` — recover a pending deposit. */
	recoverDeposit?: (depositTxId: string, options?: { timeout: number }) => Promise<string>
	/** `POST /decommit` — request a decommit over HTTP. */
	decommit?: (tx: Transaction, options?: { timeout: number }) => Promise<unknown>
	/** `POST /snapshot` — side-load a confirmed snapshot. */
	sideLoadSnapshot?: (body: SideLoadSnapshotBody, options?: { timeout: number }) => Promise<unknown>
}
