# Migrating `@hydra-sdk/bridge` 1.x → 2.0

`2.0.0` targets **hydra-node v2.x** (tested against `2.3.0`). The v2 protocol
removed the commit phase (ADR-33), so a head now opens directly instead of going
through `Initializing` → `Committed` → `Open`.

`1.x` is end of life. It stays on npm but receives no further releases.

---

## Breaking changes

### Commands

| 1.x | 2.0 |
| --- | --- |
| `bridge.commands.abort()` | **Removed.** v2 has no `Abort` — there is no commit phase to abort. |
| — | `bridge.commands.safeClose()` — close only when the head holds no non-ADA assets |
| — | `bridge.commands.sideLoadSnapshot(snapshot)` |
| — | `bridge.commands.partialFanout(utxo)` — ⚠️ needs a hydra-node newer than 2.3.0 |
| `HydraCommand.GetUTxO` | **Removed.** Deprecated upstream long ago; use `querySnapshotUtxo()`. |

`bridge.commands.initSync()` now resolves on **`HeadIsOpen`** instead of
`HeadIsInitializing`, and rejects immediately when the node reports
`RejectedInputBecauseUnsynced` rather than burning every retry.

### Server output tags

Removed — these no longer exist in hydra-node:

`HeadIsInitializing` · `Committed` · `HeadIsAborted` · `CommitIgnored` ·
`GetUTxOResponse` · `PeerHandshakeFailure`

Added:

`NetworkConnected` · `NetworkDisconnected` · `NetworkVersionMismatch` ·
`NetworkClusterIDMismatch` · `DepositActivated` · `DepositExpired` ·
`SnapshotSideLoaded` · `EventLogRotated` · `NodeUnsynced` · `NodeSynced` ·
`RejectedInputBecauseUnsynced` · `SideLoadSnapshotRejected` ·
`SyncedStatusReport` · `HeadPartiallyFannedOut` (experimental)

### Changed payload shapes

```diff
  HeadIsOpen
- { headId, utxo }
+ { headId, parties }        // v2 no longer ships the UTxO set here

  HeadIsFinalized
- { headId, utxo }
+ { headId, finalizedUTxO }  // renamed; still a UTxO map

  SnapshotConfirmed
+ signatures: { multiSignature: string[] }
  snapshot.utxoToCommit:   UTxOObject | null   // was non-nullable
  snapshot.utxoToDecommit: UTxOObject | null   // was non-nullable
+ snapshot.accumulator: string                 // BLS accumulator hash

  Greetings
  hydraHeadId:  string | null      // was non-nullable
  snapshotUtxo: UTxOObject | null  // was non-nullable
  currentSlot, chainSyncedStatus, env, networkInfo  // now required, were optional
- timestamp                        // Greetings is sent untimed — field never existed
```

`Greetings`, `InvalidInput` and all `ClientMessage` variants (`CommandFailed`,
`PostTxOnChainFailed`, `RejectedInputBecauseUnsynced`,
`SideLoadSnapshotRejected`, `SyncedStatusReport`) carry **no `seq` and no
`timestamp`** — the node sends them outside the timed-output envelope. Only
`ServerOutput` messages have those fields.

### `HydraHeadStatus`

`Initializing` and `Final` are gone. `Final` never existed in any hydra-node
release ≥ 1.0.0. The v2.3.0 set is:

```
Idle | Open | Closed | FanoutPossible
```

(`FanningOut` is declared but only reachable on a hydra-node newer than 2.3.0.)

### `GET /head` (`bridge.headInfo()`)

The endpoint returns a `HeadState`, whose `tag` is `Idle | Open | Closed` — a
different set from `HydraHeadStatus`. `HydraHeadInfo` is now a discriminated
union, so narrow on `tag` before reaching into `contents`:

```ts
const info = await bridge.connector.fetcher.queryHeadInfo()
if (info.tag === 'Open') {
  info.contents.coordinatedHeadState.localUTxO // ok
}
```

`bridge.headInfo()` keeps its flat `{ headId, headStatus, vkey }` shape.
Note `vkey` is the head's **first party**, not necessarily this node — read
`Greetings.me.vkey` for that.

### `SubmitTxResponse`

Now `TransactionSubmitted | PostTxError`, matching `Hydra.Chain.PostTxError`.
Removed variants that no longer exist upstream: `CannotFindOwnInitial`,
`CommittedTooMuchADAForMainnet`, `FailedToDraftTxNotInitializing`,
`PlutusValidationFailed`, `FailedToConstructAbortTx`,
`FailedToConstructCollectTx`. Most remaining variants gained their payload
fields (`failingTx`, `failureReason`, `headId`, …).

---

## New in 2.0

### Node sync awareness

Since hydra-node 1.3.0 the node **rejects** client inputs while it is behind the
chain. The bridge now tracks this and fails fast instead of hanging:

```ts
bridge.syncedStatus // 'InSync' | 'CatchingUp' | null
bridge.nodeVersion  // e.g. '2.3.0', from Greetings
```

### More accurate slot arithmetic

`slotZeroTimestamp` is now re-anchored from the `chainSlot` + `chainTime` pair
carried by `NodeSynced` / `SyncedStatusReport`. `chainTime` is the node's own UTC
time, so it removes the network round-trip error inherent in pairing
`Greetings.currentSlot` with a local `Date.now()`.

### HTTP endpoints

New fetcher methods: `queryConfirmedSnapshot()` (`GET /snapshot`),
`queryLastSeenSnapshot()`, `queryPendingDeposits()` (`GET /commits`),
`queryNodeConfig()` (`GET /config`, hydra-node ≥ 2.3.0).

New submitter methods: `submitL2Tx()`, `recoverDeposit()`, `decommit()`,
`sideLoadSnapshot()`.

### `submitL2Tx()` — prefer it over `submitTxSync()`

`submitTxSync()` races WebSocket messages against a client-side timeout.
`POST /transaction` lets the node decide:

```ts
const res = await bridge.submitL2Tx(tx)
switch (res.tag) {
  case 'SubmitTxConfirmed': res.snapshotNumber; break
  case 'SubmitTxInvalid':   res.validationError; break
  case 'SubmitTxRejected':  res.reason; break   // node out of sync
  case 'SubmitTxSubmitted': break               // accepted, not yet confirmed
}
```

`submitTxSync()` still works and now also fails fast on `CommandFailed` and
`RejectedInputBecauseUnsynced` for the submitted txId.

### Deposits

```ts
await bridge.pendingDeposits()            // GET /commits
await bridge.recoverDeposit(depositTxId)  // DELETE /commits/{txId}
```

Full deposit lifecycle on the event stream:
`CommitRecorded` → `DepositActivated` → `CommitApproved` → `CommitFinalized`,
with `DepositExpired` → recover as the failure branch.

### Protocol parameters now come from `@hydra-sdk/core`

`@hydra-sdk/bridge/src/constants/protocol-parameters.ts` is **removed**. It
duplicated core with pre-PV11 cost models and was never exported from the
package entry point. Use core instead — it tracks the ledger protocol version:

```ts
import {
  DEFAULT_PROTOCOL_PARAMETERS,
  DEFAULT_V1_COST_MODEL_LIST,
  DEFAULT_V2_COST_MODEL_LIST,
  DEFAULT_V3_COST_MODEL_LIST,
  DREP_DEPOSIT,
  resolveTxFees
} from '@hydra-sdk/core'
```

`toProtocol()` now routes through core's `castProtocol`, so a field the node
omits falls back to the current default rather than becoming `undefined`. A
`utxoCostPerByte` of `0` — what you get inside a head — is preserved, not
mistaken for a missing value.

```ts
await bridge.getRawProtocolParameters() // includes costModels + protocolVersion
```

`getProtocolParameters()` narrows to core's `Protocol`, which has no slot for
`costModels`. Use the raw form when budgeting Plutus ExUnits — the cost model
changed with the van Rossem hard fork (PV11, 2026-07-18).

### `POST /commit` change address

```ts
await bridge.commit({ blueprintTx, utxo, changeAddress })
```

`changeAddress` was always accepted by the node but missing from the types.
