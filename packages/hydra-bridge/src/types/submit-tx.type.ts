import type { PostTxError } from './post-tx-error.type'

/**
 * A Cardano transaction in the text envelope format — a JSON wrapper with a
 * `type` around a `cborHex` encoded transaction. The hydra-node uses it as follows:
 * - When encoding, an additional `txId` is included.
 * - On decoding, when `txId` is included it is checked to be consistent.
 * - The `type` is not used to determine content; any transaction is decoded as a
 *   `ConwayEra` transaction, which is mostly backward compatible with previous eras.
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

export type TransactionSubmitted = {
	tag: 'TransactionSubmitted'
}

/**
 * Response of `POST /cardano-transaction` (submit an L1 transaction through the
 * node's chain backend).
 *
 * Source: `Hydra.API.HTTPServer.handleSubmitUserTx` — on failure the body is a
 * `PostTxError`.
 */
export type SubmitTxResponse = TransactionSubmitted | PostTxError

/**
 * Response of `POST /transaction` (submit an L2 transaction into the head and
 * wait for the node's verdict).
 *
 * Source: `Hydra.API.HTTPServer.SubmitL2TxResponse` (hydra-node v2.3.0).
 */
export type SubmitL2TxResponse =
	| {
			/** Included in a confirmed snapshot. */
			tag: 'SubmitTxConfirmed'
			snapshotNumber: number
	  }
	| {
			/** Rejected by the L2 ledger. */
			tag: 'SubmitTxInvalid'
			validationError: string
	  }
	| {
			/** Rejected because the node is out of sync with the chain. */
			tag: 'SubmitTxRejected'
			reason: string
	  }
	| {
			/** Accepted but not yet confirmed within the node's API timeout. */
			tag: 'SubmitTxSubmitted'
	  }

export type SubmitL2TxBody = {
	submitL2Tx: SubmitTxBody
}

export type { PostTxError }
