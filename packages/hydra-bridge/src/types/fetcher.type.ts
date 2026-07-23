import { UTxOObject } from '@hydra-sdk/core'
import type { RawProtocolParameters } from './protocol-parameters.type'
import type { ConfirmedSnapshotResponse, HydraHeadInfo, LastSeenSnapshotResponse } from './hydra-head-info.type'
import type { PendingDeposit } from './commit.type'

export type HydraBridgeFetcher = {
	/** `GET /protocol-parameters` */
	queryRawProtocolParameters: () => Promise<RawProtocolParameters>
	/** `GET /snapshot/utxo` — resolves to `{}` when the head has no snapshot yet. */
	querySnapshotUtxo: () => Promise<UTxOObject>
	/** `GET /head` */
	queryHeadInfo: () => Promise<HydraHeadInfo>

	/**
	 * `GET /snapshot` — latest confirmed snapshot.
	 * Resolves to `null` when the node answers 404 (head is Idle).
	 */
	queryConfirmedSnapshot?: () => Promise<ConfirmedSnapshotResponse | null>
	/** `GET /snapshot/last-seen` */
	queryLastSeenSnapshot?: () => Promise<LastSeenSnapshotResponse>
	/** `GET /commits` — txIds of deposits awaiting inclusion. */
	queryPendingDeposits?: () => Promise<PendingDeposit[]>
	/**
	 * `GET /config` — effective node configuration.
	 * Available since hydra-node v2.3.0.
	 */
	queryNodeConfig?: () => Promise<Record<string, unknown>>
}
