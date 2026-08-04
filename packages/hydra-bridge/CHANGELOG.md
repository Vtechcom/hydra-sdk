# @hydra-sdk/bridge

## 2.0.2

### Patch Changes

- Updated dependencies
  - @hydra-sdk/core@1.5.0

## 2.0.1

### Patch Changes

- Updated dependencies
  - @hydra-sdk/core@1.4.2

## 2.0.0

### Major Changes

- 6be2b85: Target hydra-node v2.x (tested against 2.3.0); drop v1 support.

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

## 1.3.2

### Patch Changes

- Sync updated Cardano protocol parameters (v11) and cost models.
- Updated dependencies
  - @hydra-sdk/cardano-wasm@1.0.0
  - @hydra-sdk/core@1.4.1

## 1.3.1

### Patch Changes

- **Fix: `Greetings` handler crash when `headStatus` is `Idle`** — `snapshotUtxo` is absent from the `Greetings` payload when the head is in `Idle` state. The handler now guards against `undefined` before calling `updateSnapshot`, preventing a runtime error on fresh connects before a head is opened.

- **Feat: Chalk-coloured log helpers** — all internal `console.log / console.warn / console.error` calls replaced with structured chalk helpers (cyan tag, green / yellow / red context). Debug output is now consistently formatted and easier to read in terminal environments. `chalk ^5.6.2` added as a dependency.

- **Chore: Remove leftover debug dump logs** — stale raw `console.log` statements from earlier development cycles removed from `bridge.ts` and `websocket.ts`.

- Updated dependencies
  - @hydra-sdk/core@1.3.1

## 1.3.0

### Minor Changes

- ## @hydra-sdk/bridge v1.3.0
  - **In-memory snapshot cache**: O(1) `getAddressBalance()` and `queryAddressUTxO()` via two-level Map cache rebuilt once per `SnapshotConfirmed`/`Greetings`
  - **`submitTx` callback API**: fire-and-forget submission with Node.js error-first callback pattern
  - **Auto-reconnect**: `autoReconnect`, `reconnectInterval`, `maxReconnectAttempts` options
  - **WebSocket best practices**: `per-message deflate` disabled, ping interval tuned
  - **`awaitHydraMessage` utility**: single-cleanup Promise wrapper eliminating manual listener/timer teardown
  - **Hydra node v0.20+ compatibility**: `slotZeroTimestamp`, `lastSnapshotNumber`, `Greetings.currentSlot`
  - Bug fixes: duplicate `TxValid` events, stale listener leak on timeout, `decommit` cleanup

  ## @hydra-sdk/core v1.3.0
  - **`convertUTxOObjectToUTxOWithOptions`**: bounded datum deserialization cache (`maxDatumCacheSize`, LRU eviction)
  - **Converter performance**: `for` loops replace `reduce`/`filter` chains; no intermediate array allocations
  - **Benchmark script**: `scripts/bench-converter.ts`

### Patch Changes

- Updated dependencies
  - @hydra-sdk/core@1.2.0

## 1.3.0

### Minor Changes

#### hydra-node v1.3.0 Compatibility

- **`Greetings` message extended** — added four optional fields that hydra-node v1.3.0 now sends on WebSocket connect:
  - `currentSlot?: number` — current chain slot at the time of connection
  - `chainSyncedStatus?: string` — whether the node is fully synced with the chain
  - `env?: { configuredPeers, contestationPeriod, depositPeriod, otherParties, participants, party, signingKey, unsyncedPeriod }` — node environment configuration
  - `networkInfo?: { networkConnected, peersInfo }` — network connectivity status

- **Slot-zero timestamp computation** (`slotZeroTimestamp`) — when `Greetings.currentSlot` is present, `HydraBridge` now automatically derives the Unix timestamp (ms) of slot 0 using `TimeUtils.buildHydraSlotConfig` + `TimeUtils.slotToBeginUnixTime`. Exposed as `IHydraBridge.slotZeroTimestamp: number | null` for downstream slot ↔ time arithmetic.

- **`submitTx` — callback-style API** — new Node.js error-first callback method alongside the existing `submitTxSync`:

  ```typescript
  bridge.submitTx(tx, (error, result) => { ... }, { timeout: 30000 })
  ```

  Available on `HydraBridge`, `HydraBridgeSubmitter`, `WebsocketConnector`, and `HexcoreConnector`.

- **`/head` API endpoint** — `HydraHeadInfo` type completely rewritten to match the actual hydra-node v1.3.0 `/head` response:
  - `tag` now typed as `HydraHeadStatus` (not the old ambiguous `HydraHeadTag`)
  - `contents` fields correctly structured: `headId`, `headSeed`, `parameters`, `chainState`, `coordinatedHeadState`
  - `coordinatedHeadState` includes: `allTxs`, `confirmedSnapshot` (with `signatures.multiSignature: string[]`), `currentDepositTxId`, `decommitTx`, `localTxs`, `localUTxO`, `seenSnapshot`, `version`

#### Performance — In-memory Snapshot Cache

Snapshot reads are now O(1) instead of O(n) per request. The cache is rebuilt once per snapshot event, eliminating repeated `Array.filter` passes over all UTxOs on every balance/UTxO query.

- **`addressUtxoIndex: Map<address, UTxOObject>`** — pre-built per-address UTxO sub-object. Rebuilt in a single O(n) pass on every snapshot event.
- **`balanceCache: Map<address, Map<assetUnit, bigint>>`** — pre-computed aggregate balance per address and asset. Rebuilt alongside `addressUtxoIndex` in the same pass.
- **`getAddressBalance(address): Map<string, bigint> | null`** — O(1) balance lookup. Returns `null` on cold start (cache not yet seeded) so callers can fall back to a database; returns an empty `Map` when the address is known but holds no UTxOs.
- **`queryAddressUTxO(address)`** — now uses the pre-built `addressUtxoIndex` (O(1) map lookup) instead of converting + filtering all 5000 UTxOs on every call.
- **`addressesInHead()`** — returns `Array.from(addressUtxoIndex.keys())` when the index is warm; HTTP call only on cold start.

#### Performance — WebSocket Snapshot Best Practices

Implements the snapshot lifecycle patterns documented in `improve-hydra-snapshot-log.md`:

- **Greetings seeds the cache** — `HydraBridge` now handles the `Greetings` message and calls `updateSnapshot(payload.snapshotUtxo)` directly. No extra HTTP round-trip needed on fresh connect.
- **`lastSnapshotNumber` tracking** — exposes `IHydraBridge.lastSnapshotNumber: number` (−1 until first snapshot). Only advances, never regresses.
- **Out-of-order snapshot guard** — `SnapshotConfirmed` handler skips any snapshot whose `number ≤ lastSnapshotNumber`, preventing cache regression after reconnect or network jitter.
- **HTTP fallback race condition fixed** — `querySnapshotUtxo()` now checks `lastSnapshotNumber === -1` before applying the HTTP result. A slow HTTP response can no longer overwrite fresher WebSocket data.
- **`lastSnapshotNumber` reset on reconnect** — `onConnected` resets `lastSnapshotNumber = -1` so the HTTP fallback and Greetings handler can re-seed the cache correctly after every reconnect.

#### Auto-reconnect

New `InitHydraBridgeOptions` fields:

| Option                 | Type          | Default         | Description                                      |
| ---------------------- | ------------- | --------------- | ------------------------------------------------ |
| `autoReconnect`        | `boolean`     | `false`         | Automatically reconnect when the WebSocket drops |
| `reconnectInterval`    | `number` (ms) | `3000`          | Wait time between reconnect attempts             |
| `maxReconnectAttempts` | `number`      | `0` (unlimited) | Stop after N failures; 0 = keep trying forever   |

- Reconnect loop is cancelled immediately and cleanly when `bridge.disconnect()` is called (no spurious reconnects after intentional disconnect).

### Bug Fixes

- **`submitTxSync` variable shadowing** — `payload.snapshot.confirmed.findIndex(tx => tx.txId === tx.txId)` always returned index 0 because the inner `tx` shadowed the outer `tx` parameter. Renamed inner variable to `confirmedTx`; the correct transaction is now located.
- **`newTx` hardcoded description** — `commands.newTx` was overwriting the caller-supplied `description` with the literal string `'Ledger Cddl Format'`. Description is now passed through as-is (defaults to empty string).
- **URL builder default port leak** — `buildUrl` was emitting URLs like `https://host:443/path` when the caller passed no explicit port, because `parseUrl` substitutes the protocol default. Fixed by stripping default ports (`http:80`, `https:443`, `ws:80`, `wss:443`) before constructing the URL string.

### Type Improvements

- **`SubmitTxResult`** and **`SubmitTxError`** exported as named types from `submitter.type.ts`.
- **`HydraBridgeSubmitter`** interface extended with `submitTx` callback signature.
- **`HydraHeadInfo`** rewritten to match the real `/head` API response structure (see above).
- **`InitHydraBridgeOptions`** extended with `autoReconnect`, `reconnectInterval`, `maxReconnectAttempts`.
- **`IHydraBridge`** extended with `lastSnapshotNumber`, `slotZeroTimestamp`, `getAddressBalance`, and `submitTx`.

### Internal / Refactoring

- `HexcoreConnector`: removed duplicate private `HydraConnectorEndpoint` type declaration; now imports the shared type from `hydra-connector.type.ts`.
- Dead code removed from previous iterations (unused `ws`, `eventBuffer`, `maxBufferSize` fields).
- `WebsocketConnector.defaultWsSubmitter` now implements `submitTx` via `submitTxSync(...).then/catch`.
- `HexcoreConnector.defaultHexcoreSubmitter` now implements `submitTx` via direct axios call with error-first callback.

#### `awaitHydraMessage` — internal async utility

New utility `src/utils/await-hydra-message.ts` replaces the repeated manual event-listener + timeout cleanup pattern across the codebase.

**Problem it solves:** every async flow that waited for a WebSocket message had 2–3 exit paths (resolve / reject / timeout), each needing to call both `clearTimeout` and `emitter.off` manually. Forgetting either call causes a memory leak or a ghost listener.

**Solution:** a single `cleanup()` closure that calls both. Every exit path goes through it — impossible to forget.

```typescript
export function awaitHydraMessage<T>(
	emitter: Emitter<HydraBridgeEvents>,
	predicate: (
		payload: HydraPayload
	) => { resolve: T } | { reject: unknown } | null,
	timeoutMs = 30_000,
	timeoutError?: unknown
): Promise<T>
```

- `predicate` returns `{ resolve: T }` to settle, `{ reject: unknown }` to fail, `null` to keep waiting.
- Listener and timer are always cleaned up on the first settlement — no double-settle possible.

**Impact on existing functions:**

| Function                          | Before                                                  | After                                             |
| --------------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| `WebsocketConnector.submitTxSync` | 60 lines, 3 manual cleanup points                       | 30 lines, 0 manual cleanup                        |
| `HydraBridge.decommit`            | 25 lines, 2 manual cleanup points                       | 12 lines, 0 manual cleanup                        |
| `HydraBridge.initHydraHead`       | 25 lines, `setInterval`+`off`+`clearInterval` entangled | 20 lines, retry sender isolated from message wait |

`HydraPayload` import removed from `bridge.ts` (no longer needed in inline handlers).

## 1.1.7

### Patch Changes

- Release v1.1.7:
  - Implement CIP-8 message signing in EmbeddedWallet
  - Add support for Cardano Reference Inputs in TxBuilder
  - Add support for Reference Scripts in TxBuilder
  - Standardize Plutus types across packages
  - Update Ogmios provider for structured script references

- Updated dependencies
  - @hydra-sdk/core@1.1.7
  - @hydra-sdk/cardano-wasm@0.0.7

## 1.1.6

### Patch Changes

- View in github
- Updated dependencies
  - @hydra-sdk/cardano-wasm@0.0.6
  - @hydra-sdk/core@1.1.6

## 1.1.5

### Patch Changes

- Re-build v1.1.5
- Updated dependencies
  - @hydra-sdk/core@1.1.5

## 1.1.4

### Patch Changes

- Update keys utilities
- Updated dependencies
  - @hydra-sdk/core@1.1.4

## 1.1.3

### Patch Changes

- v1.1.3
- Updated dependencies
  - @hydra-sdk/core@1.1.3

## 1.1.2

### Patch Changes

- Add CardanoCliWallet function
- Updated dependencies
  - @hydra-sdk/core@1.1.2

## 1.1.1

### Patch Changes

- Support build blueprint tx with Hydra
- Updated dependencies
  - @hydra-sdk/core@1.1.1

## 1.1.0

### Minor Changes

- - Update dependencies to the latest versions and add new methods for transaction handling and UTxO querying.
  - Add providers: Blockfrost, and Ogmios.
  - Update documentation to reflect new features and changes.
  - Update examples nodejs-playground
  - Fix minor bugs and improve performance.
  - Update and group Utilities functions, remove old utilities.

### Patch Changes

- Updated dependencies
  - @hydra-sdk/core@1.1.0

## 1.0.14

### Patch Changes

- - Add mint/burn token in tx builder
  - Add DatumUtils for building Datum
  - Add PolicyUtils for minting policy script
  - Add example for mint/burn token in NodeJS playground
  - Fix some types
  - Update nodePolyfills configuration to include only buffer and disable global/process polyfills
- Updated dependencies
  - @hydra-sdk/core@1.0.14

## 1.0.13

### Patch Changes

- - Add TimeUtils to core for common time conversions and helpers.
  - Fix validity range setup in transaction to correctly handle lower/upper bounds and serialization.
- Updated dependencies
  - @hydra-sdk/core@1.0.13

## 1.0.12

### Patch Changes

- - Fix tx-builder:
    - Update descriptions
    - Fix redeemer builder: add more options, change default exUnits
    - Fix logs
    - Fix calculate script hash
- Updated dependencies
  - @hydra-sdk/core@1.0.12

## 1.0.11

### Patch Changes

- Sync version to 1.0.11
- Updated dependencies
  - @hydra-sdk/core@1.0.11

## 1.0.10

### Patch Changes

- Fix transaction builder
- Updated dependencies
  - @hydra-sdk/core@1.0.7

## 1.0.9

### Patch Changes

- Fix hexcore connector

## 1.0.8

### Patch Changes

- Bump version
- Updated dependencies
  - @hydra-sdk/core@1.0.6

## 1.0.7

### Patch Changes

- Fix hexcore connector

## 1.0.6

### Patch Changes

- Updated dependencies
  - @hydra-sdk/cardano-wasm@0.0.5
  - @hydra-sdk/core@1.0.5

## 1.0.5

### Patch Changes

- Update configs
- Updated dependencies
  - @hydra-sdk/cardano-wasm@0.0.4
  - @hydra-sdk/core@1.0.4

## 1.0.4

### Patch Changes

- Update docs and Readme.md
- Updated dependencies
  - @hydra-sdk/core@1.0.3

## 1.0.3

### Patch Changes

- Update
- Updated dependencies
  - @hydra-sdk/core@1.0.2

## 1.0.2

### Patch Changes

- Fixed performance
- Updated dependencies
  - @hydra-sdk/core@1.0.1

## 1.0.1

### Patch Changes

- enhance HydraBridge with address retrieval and UTxO querying on connection

## 1.0.0

### Major Changes

- Realease first major

### Patch Changes

- Updated dependencies
  - @hydra-sdk/core@1.0.0
