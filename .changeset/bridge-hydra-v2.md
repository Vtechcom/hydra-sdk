---
'@hydra-sdk/bridge': major
---

Target hydra-node v2.x (tested against 2.3.0); drop v1 support.

The bridge major version now tracks the hydra-node major version. hydra-node v2
removed the commit phase (ADR-33), so a head opens directly — `Abort`,
`HeadIsInitializing`, `Committed` and `HeadIsAborted` no longer exist.

Breaking:

- Removed `commands.abort()` and `HydraCommand.GetUTxO`
- Removed tags `HeadIsInitializing`, `Committed`, `HeadIsAborted`,
  `CommitIgnored`, `GetUTxOResponse`, `PeerHandshakeFailure`
- `commands.initSync()` resolves on `HeadIsOpen` instead of `HeadIsInitializing`
- `HeadIsOpen` is `{ headId, parties }` — no longer carries `utxo`
- `HeadIsFinalized.utxo` renamed to `finalizedUTxO`
- `HydraHeadStatus` drops `Initializing` and `Final` (`Final` never existed in
  any hydra-node release ≥ 1.0.0)
- `HydraHeadInfo` is a discriminated union over `Idle | Open | Closed`, matching
  what `GET /head` actually returns
- `SubmitTxResponse` rebuilt from `Hydra.Chain.PostTxError`
- `Greetings` / `InvalidInput` / all `ClientMessage` variants no longer declare
  `seq` or `timestamp` — the node sends them untimed
- `Greetings.hydraHeadId` and `snapshotUtxo` are nullable; `currentSlot`, `env`,
  `networkInfo` and `chainSyncedStatus` are required
- Removed `src/constants/protocol-parameters.ts`, which duplicated
  `@hydra-sdk/core` with pre-PV11 cost models and was never exported from the
  package entry point. Use core's `DEFAULT_PROTOCOL_PARAMETERS`,
  `DEFAULT_V1/V2/V3_COST_MODEL_LIST`, `DREP_DEPOSIT` and `resolveTxFees`.

Added:

- Commands `safeClose`, `sideLoadSnapshot`, `partialFanout` (last one requires a
  hydra-node newer than 2.3.0)
- Tags for network status, deposit lifecycle (`DepositActivated`,
  `DepositExpired`), `NodeSynced` / `NodeUnsynced`, `SnapshotSideLoaded`,
  `EventLogRotated` and the `ClientMessage` variants
- Fail-fast on `RejectedInputBecauseUnsynced` in `submitTxSync()` and
  `initSync()` instead of hanging until timeout
- `bridge.syncedStatus` and `bridge.nodeVersion`
- `submitL2Tx()` (`POST /transaction`), `pendingDeposits()` (`GET /commits`),
  `recoverDeposit()` (`DELETE /commits/{txId}`), plus fetchers for
  `GET /snapshot`, `GET /snapshot/last-seen` and `GET /config`
- `getRawProtocolParameters()` exposing `costModels` / `protocolVersion` for
  ExUnits budgeting under PV11
- `toProtocol()` routes through core's `castProtocol`, so fields the node omits
  fall back to current defaults; a zero `utxoCostPerByte` (as reported inside a
  head) is preserved rather than treated as missing
- `changeAddress` on the blueprint commit body
- `slotZeroTimestamp` re-anchored from the node's own `chainTime`

Verified end-to-end against a live hydra-node 2.3.0 offline head, which caught
three wire-format bugs the unit tests could not:

- `Greetings.env` has no `signingKey` — the node's ToJSON omits it
- `InvalidInput` is sent **without a `tag`**; connectors now stamp one so the
  payload union stays discriminated
- `POST /transaction` takes the bare tx envelope, not `{ submitL2Tx: … }`

See `MIGRATION-v2.md` for details and `e2e/README.md` for the test setup.
