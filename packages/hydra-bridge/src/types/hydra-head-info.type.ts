import type { ConfirmedSnapshot, HydraHeadState, HydraHeadStateTag, SeenSnapshot } from './payload.type'

/**
 * Response of `GET /head` — the node's full `HeadState`.
 *
 * NOTE: `tag` here is a `HeadState` constructor (`Idle` | `Open` | `Closed`),
 * NOT a `HeadStatus`. `FanoutPossible` never appears at this endpoint — it is a
 * client-facing projection only present in `Greetings.headStatus`.
 *
 * Source: `Hydra.HeadLogic.State.HeadState` (hydra-node v2.3.0).
 */
export type HydraHeadInfo = HydraHeadState

export type { HydraHeadState, HydraHeadStateTag, ConfirmedSnapshot, SeenSnapshot }

/**
 * Response of `GET /snapshot/last-seen`.
 */
export type LastSeenSnapshotResponse = SeenSnapshot

/**
 * Response of `GET /snapshot` — the latest confirmed snapshot.
 * Returns 404 while the head is Idle.
 */
export type ConfirmedSnapshotResponse = ConfirmedSnapshot

/**
 * Body of `POST /snapshot` — side-load a confirmed snapshot.
 */
export type SideLoadSnapshotBody = {
	snapshot: ConfirmedSnapshot
}
