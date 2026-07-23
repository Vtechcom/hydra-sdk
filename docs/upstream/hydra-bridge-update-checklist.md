# Checklist cập nhật `@hydra-sdk/bridge` theo Hydra v1.3.0 / v2.3.0

**Ngày rà soát:** 2026-07-23
**Package:** `packages/hydra-bridge` v1.3.2
**Đối chiếu với source:** `/Users/ania/codespace/blockchain/hydra` @ `2.3.0-16-g7af17e688` (+ `git show 1.3.0:` cho dòng v1)

Mọi mục ✅ dưới đây đã được xác nhận trực tiếp trong source Haskell (`ClientInput.hs`, `ServerOutput.hs`,
`HTTPServer.hs`, `WSServer.hs`, `HeadLogic/State.hs`, `Tx/Snapshot.hs`, `Chain.hs`), không suy đoán từ release notes.

> ## ⚠️ Đính chính so với CHANGELOG upstream
>
> **1. Không có chuyện "UTxO map → array of TxOut".** CHANGELOG v2.2.0 ghi `HeadIsFinalized.finalizedUTxO`,
> `remainingFanoutOutputs`, `distributedFanoutOutputs` đổi từ map sang array. Code shipped **không như vậy**:
> cả ba đều là `UTxOType tx` (= UTxO map) ở tag `2.2.0`, `2.3.0` và master.
> Golden file `hydra-node/golden/ServerOutput/HeadIsFinalized.json` xác nhận là map.
> → **Chỉ phần đổi tên là thật** (`utxo` → `finalizedUTxO`).
>
> **2. Selective partial fanout CHƯA phát hành.** `PartialFanout` (client input), `HeadPartiallyFannedOut`
> (server output), `FanningOut` (head status), `FanoutProgress` / `PartialFanoutState` vào ở commit
> `a271cced2` (#2750) — **sau** tag `2.3.0`. CHANGELOG xếp nhầm chúng dưới heading `## [2.3.0]`.
>
> Bề mặt API của **v2.3.0 đã phát hành**:
> - `HeadStatus` = `Idle | Open | Closed | FanoutPossible`
> - `HeadState` (`GET /head`) = `Idle | Open | Closed`
> - `ClientInput` = `Init`, `NewTx`, `Recover`, `Decommit`, `Close`, `SafeClose`, `Contest`, `Fanout`, `SideLoadSnapshot`
> - `ClosedState` giữ `remainingFanoutOutputs :: Maybe UTxO` + `distributedFanoutOutputs :: UTxO`
>
> Lưu ý phân biệt hai thứ trùng tên: **multi-step fanout tự động** (`PartialFanoutTx`/`FinalPartialFanoutTx`,
> PR #2324) **có** trong v2.2.0 — đó là cơ chế nội bộ, không lộ ra client API.
> Còn **selective fanout do client chọn** (`PartialFanout` input) mới là phần chưa release.

---

## 0. Quyết định kiến trúc cần chốt trước

- [ ] **Chốt chiến lược đa phiên bản.** v1.3.0 và v2.3.0 khác nhau ở mức protocol (v2 bỏ commit phase),
      nên `HydraCommand` / `HydraHeadTag` / payload types không thể là một union phẳng nữa.
      Ba lựa chọn: (a) union có discriminator theo version, (b) tách `payload.v1.type.ts` / `payload.v2.type.ts`,
      (c) bridge chỉ hỗ trợ v2 và freeze nhánh v1.
      → Đề xuất: (b) + `HydraBridge` tự detect qua `Greetings.hydraNodeVersion` rồi chọn nhánh hành vi.
- [ ] **Bổ sung `protocolVersion` / `nodeVersion` vào state của `HydraBridge`** (parse từ `Greetings.hydraNodeVersion`),
      expose ra ngoài để app biết đang nói chuyện với node nào.

---

## 1. Client commands (`HydraCommand`) — `src/types/payload.type.ts`

Source: `hydra-node/src/Hydra/API/ClientInput.hs`

| Command | v1.3.0 | v2.3.0 | SDK hiện tại | Việc cần làm |
|---|---|---|---|---|
| `Init` | ✅ | ✅ | ✅ | — |
| `Abort` | ✅ | ❌ **đã xóa** | ✅ | Đánh dấu v1-only; gọi trên v2 sẽ nhận `InvalidInput` |
| `NewTx` | ✅ | ✅ | ✅ | — |
| `Recover` | ✅ | ✅ | ✅ | — |
| `Decommit` | ✅ | ✅ | ✅ | — |
| `Close` | ✅ | ✅ | ✅ | — |
| **`SafeClose`** | ✅ | ✅ | ❌ **thiếu** | Thêm command + `commands.safeClose()` |
| `Contest` | ✅ | ✅ | ✅ | — |
| `Fanout` | ✅ | ✅ | ✅ | — |
| **`PartialFanout`** `{utxoToFanout}` | ❌ | ⏳ **chưa release** (post-2.3.0) | ❌ | Thêm sẵn, đánh dấu `@experimental` |
| **`SideLoadSnapshot`** `{snapshot}` | ✅ | ✅ | ❌ **thiếu** | Thêm command (hoặc dùng `POST /snapshot`) |
| `GetUTxO` | ❌ | ❌ | ✅ (deprecated) | **Xóa hẳn** — không còn tồn tại từ lâu |

- [ ] Thêm `SafeClose`, `SideLoadSnapshot`, `PartialFanout` vào enum + `bridge.commands`
- [ ] Xóa `GetUTxO`
- [ ] Gắn JSDoc `@since` / `@v1only` / `@v2only` cho từng command

---

## 2. Server outputs (`HydraHeadTag`) — `src/types/payload.type.ts`

Source: `ServerOutput.hs` (`ServerOutput tx` + `ClientMessage tx` + `InvalidInput`)

### 2.1 Tag THIẾU trong SDK (có ở **cả** v1.3.0 và v2.3.0) — ưu tiên cao

- [ ] `NetworkConnected` — không field
- [ ] `NetworkDisconnected` — không field
- [ ] `NetworkVersionMismatch` `{ ourVersion, theirVersion: number | null }`
- [ ] `NetworkClusterIDMismatch` `{ clusterPeers: string, misconfiguredPeers: string }`
- [ ] `DepositActivated` `{ headId, depositTxId, deadline, chainTime }`
- [ ] `DepositExpired` `{ headId, depositTxId, deadline, chainTime }`
- [ ] `SnapshotSideLoaded` `{ headId, snapshotNumber }`
- [ ] `EventLogRotated` `{ checkpoint: NodeState }`
- [ ] `NodeUnsynced` `{ chainSlot, chainTime, drift }`
- [ ] `NodeSynced` `{ chainSlot, chainTime, drift }`
- [ ] `RejectedInputBecauseUnsynced` `{ clientInput, drift }` *(ClientMessage)*
- [ ] `SideLoadSnapshotRejected` `{ clientInput, requirementFailure }` *(ClientMessage)*
- [ ] `SyncedStatusReport` `{ chainSlot, chainTime, drift, synced: 'InSync' | 'CatchingUp' }` *(ClientMessage)*

### 2.2 Tag THIẾU — chưa release (master, post-2.3.0)

- [ ] `HeadPartiallyFannedOut` `{ headId, distributedUTxO, remainingUTxO, fanoutMode: 'AutoFanningOut' | 'AwaitingFanoutSelection' }`
      → thêm sẵn nhưng đánh dấu `@experimental`; **không** đưa vào union mặc định của v2.3.0

### 2.3 Tag TỒN TẠI TRONG SDK nhưng KHÔNG có ở bất kỳ version nào ≥ 1.0.0 → **xóa**

- [ ] `PeerHandshakeFailure` — không có trong `ServerOutput` v1.3.0 lẫn v2.3.0
- [ ] `CommitIgnored` — đã bị xóa
- [ ] `GetUTxOResponse` — đã bị xóa

### 2.4 Tag chỉ còn hợp lệ trên v1.3.0 (v2 xóa vì bỏ commit phase)

- [ ] `HeadIsInitializing` — v2 ❌
- [ ] `Committed` — v2 ❌
- [ ] `HeadIsAborted` — v2 ❌
→ Cần tách nhánh type theo version, không để chung union mặc định.

---

## 3. Sai lệch field trong payload types — **bug thật, không chỉ là thiếu**

| Type | Vấn đề | Đúng phải là |
|---|---|---|
| `HydraHeadStatus` | có `Final` — **không tồn tại** ở v1.0.0/v1.3.0/v2.3.0 | v1: `Idle \| Initializing \| Open \| Closed \| FanoutPossible`<br>v2.3.0: `Idle \| Open \| Closed \| FanoutPossible` (`FanningOut` là bản chưa release) |
| `Committed` | có `parties: VKeyAddress[]`, **thiếu `headId`** | v1.3.0: `{ headId, party, utxo }` |
| `HeadIsOpen` | `{ headId, utxo }` | v1: `{ headId, utxo }` ✅ · **v2: `{ headId, parties }` — KHÔNG còn `utxo`** |
| `HeadIsFinalized` | `{ headId, utxo: UTxOObject }` | **v2: `{ headId, finalizedUTxO: UTxOObject }`** — đổi tên, **vẫn là map** |
| `SnapshotConfirmed` | thiếu `signatures` | thêm `signatures: { multiSignature: string[] }` |
| `SnapshotConfirmed.snapshot` | `utxoToCommit` / `utxoToDecommit` bắt buộc | là `Maybe` ở Haskell → **nullable** |
| `SnapshotConfirmed.snapshot` | thiếu `accumulator` | **v2 thêm** `accumulator: string` (hex blake2b-256 của BLS commitment) |
| `Greetings` | `hydraHeadId: string`, `snapshotUtxo: UTxOObject` bắt buộc | cả hai là `Maybe` → **nullable** |
| `Greetings` | `currentSlot` / `chainSyncedStatus` / `env` / `networkInfo` đang `optional` | ở v1.3.0 và v2.3.0 là **required** (không phải Maybe) |
| `Greetings.chainSyncedStatus` | `string` | `'InSync' \| 'CatchingUp'` |
| `PostTxOnChainFailed` | `postTxError.tag` hard-code `'ScriptFailedInWallet'`, `postChainTx.tag` hard-code `'InitTx'` | phải là union đầy đủ `PostTxError` (mục 4) |
| `InvalidInput` | ✅ đúng `{ reason, input }` | — |

- [ ] Sửa toàn bộ bảng trên
- [ ] Viết test JSON-fixture cho mỗi tag, lấy mẫu từ `hydra-node/json-schemas/api.yaml`

---

## 4. `SubmitTxResponse` — `src/types/submit-tx.type.ts` (lệch nặng)

Source: `data PostTxError tx` — `hydra-node/src/Hydra/Chain.hs:167`

### 4.1 Constructor SDK có nhưng Hydra **không còn** → xóa

- [ ] `CannotFindOwnInitial`
- [ ] `CommittedTooMuchADAForMainnet`
- [ ] `FailedToDraftTxNotInitializing`
- [ ] `PlutusValidationFailed`
- [ ] `FailedToConstructAbortTx`
- [ ] `FailedToConstructCollectTx`

### 4.2 Constructor Hydra có nhưng SDK **thiếu** → thêm

- [ ] `DepositTooLow` `{ providedValue, minimumValue }`
- [ ] `InternalWalletError` `{ headUTxO, reason, failingTx }`
- [ ] `ContestationDeadlineOutsideTimeHorizon` `{ failureReason }`
- [ ] `InvalidTokenRequest` `[[policyId, policyAssets]]`
- [ ] `FailedToConstructPartialFanoutTx` *(v2)*
- [ ] `StalePartialFanoutTx` *(v2)*

### 4.3 Constructor có nhưng **thiếu field** (đang là `{ tag }` rỗng)

- [ ] `InvalidSeed` → `{ headSeed }`
- [ ] `InvalidHeadId` → `{ headId }`
- [ ] `InvalidStateToPost` → `{ txTried, chainState }`
- [ ] `NotEnoughFuel` / `NoFuelUTXOFound` → `{ failingTx }`
- [ ] `ScriptFailedInWallet` → thêm `failingTx`
- [ ] `FailedToPostTx` → `{ failureReason, failingTx }`
- [ ] `FailedToConstructDepositTx` / `RecoverTx` / `IncrementTx` / `DecrementTx` → `{ failureReason }`

---

## 5. HTTP endpoints — `connector/websocket.ts` + `connector/hexcore.ts`

Source: `httpApp` — `HTTPServer.hs:204-251`

### 5.1 Đang dùng (OK)

`GET /protocol-parameters` · `GET /snapshot/utxo` · `GET /head` · `POST /commit` · `POST /cardano-transaction`

### 5.2 Endpoint chưa được wrap → thêm vào `HydraBridgeFetcher` / `Submitter`

- [ ] `GET /snapshot` → confirmed snapshot đầy đủ (404 khi Idle)
- [ ] `GET /snapshot/last-seen` → `SeenSnapshot` (union `NoSeenSnapshot` / `LastSeenSnapshot` / `RequestedSnapshot` / `SeenSnapshot`)
- [ ] `POST /snapshot` → side-load snapshot
- [ ] `GET /commits` → `string[]` (txId các deposit đang pending)
- [ ] `DELETE /commits/{txId}` → recover deposit qua HTTP (hiện chỉ có WS `Recover`)
- [ ] `POST /decommit` → decommit qua HTTP
- [ ] **`POST /transaction`** → submit L2 tx **đồng bộ**, trả `SubmitL2TxResponse`:
      `SubmitTxConfirmed{snapshotNumber}` / `SubmitTxInvalid{validationError}` / `SubmitTxRejected{reason}` / `SubmitTxSubmitted`
      → **thay thế tốt hơn** cho `submitTxSync` hiện tại (đang tự đua WS message + timeout thủ công)
- [ ] `GET /config` — **mới v2.3.0**, trả effective config (YAML-based node config)
- [ ] ⛔ **Không thêm** `GET /head-initialization` — chỉ có ở v1.2.0, đã xóa ở v2

### 5.3 `POST /commit` body

- [ ] `BlueprintCommitBody` **thiếu `changeAddress?: string`** — có ở **cả** v1.3.0 và v2.3.0
      (`FullCommitRequest { blueprintTx, utxo, changeAddress :: Maybe AddressInEra }`)
- [ ] Server chấp nhận 3 biến thể (`fullVariant` / `simpleVariant {utxoToCommit}` / `simpleDirectVariant` = UTxO map trần).
      SDK đang gửi map trần → vẫn hợp lệ, nhưng nên chuyển sang `{ utxoToCommit }` cho tường minh.
- [ ] `HexcoreConnector.commit()` có `// TODO: Update blueprint case` — đang ép `type: 'simple'`, chưa hỗ trợ blueprint.

---

## 6. `HydraHeadInfo` (`GET /head`) — `src/types/hydra-head-info.type.ts`

Endpoint trả `HeadState tx` (không phải `HeadStatus`) → tag khác hoàn toàn enum hiện dùng.

- [ ] `tag` đang gõ là `HydraHeadStatus` → **sai**. Tag thực tế:
      v1: `Idle` | `Initializing` | `Open` | `Closed` · **v2.3.0: `Idle` | `Open` | `Closed`**
      (`FanoutPossible` / `Final` **không bao giờ** xuất hiện ở đây; `FanoutProgress` là bản chưa release)
- [ ] `contents.coordinatedHeadState.seenSnapshot` đang gõ cứng `{ lastSeen, tag: 'LastSeenSnapshot' }`
      → là union 4 nhánh (`NoSeenSnapshot` / `LastSeenSnapshot` / `RequestedSnapshot` / `SeenSnapshot`)
- [ ] v2 `ClosedState` thêm `remainingFanoutOutputs: UTxOObject | null` + `distributedFanoutOutputs: UTxOObject`
      (đều là **map**, không phải array — xem phần đính chính đầu file)
- [ ] `contents.coordinatedHeadState` thiếu `confirmedSnapshot.snapshot.accumulator` (v2)

---

## 7. Logic trong `HydraBridge` (`src/bridge.ts`) — cần sửa hành vi

- [ ] **`initHydraHead()` chờ `HeadIsInitializing`** → trên v2 tag này không tồn tại, head mở thẳng
      → luôn timeout. Phải chờ `HeadIsOpen` trên v2, `HeadIsInitializing` trên v1.
- [ ] **`commands.abort()`** không hợp lệ trên v2 → cần guard theo version, throw sớm thay vì để node trả `InvalidInput`.
- [ ] **Chưa xử lý `NodeUnsynced` / `RejectedInputBecauseUnsynced`.** Từ v1.3.0 node **từ chối** client input
      khi out-of-sync (PR #2290). `initHydraHead`, `decommit`, `submitTxSync` hiện chỉ biết đợi timeout
      → nên fail-fast khi nhận `RejectedInputBecauseUnsynced`, và expose cờ `synced` trên bridge.
- [ ] **`submitTxSync` / `submitTx` không bắt `CommandFailed`** → tx bị node từ chối vẫn phải chờ hết timeout.
- [ ] **Cache snapshot chỉ cập nhật từ `Greetings` + `SnapshotConfirmed`.** Trên v2, `HeadIsOpen` không còn `utxo`
      → xác nhận lại đường seed lúc head vừa mở; cân nhắc seed thêm từ `GET /snapshot/utxo`.
- [ ] **`headInfo().vkey` lấy `contents.parameters.parties[0].vkey`** — đó là party **đầu tiên** của head,
      không phải "mình". Nên lấy từ `Greetings.me.vkey`.
- [ ] **`slotZeroTimestamp` suy ra từ `Date.now()` + `Greetings.currentSlot`** → sai số bằng network latency.
      `NodeSynced` / `SyncedStatusReport` mang cả `chainSlot` **và** `chainTime` (UTCTime thật)
      → dùng cặp này để tính chính xác, và cập nhật lại khi node re-sync.
- [ ] Thêm API cho luồng **selective partial fanout** (v2): gửi `PartialFanout`, nghe `HeadPartiallyFannedOut`,
      lặp khi `fanoutMode === 'AwaitingFanoutSelection'`, dừng khi `HeadIsFinalized`.
- [ ] Thêm helper cho **deposit lifecycle** đầy đủ: `CommitRecorded` → `DepositActivated` → `CommitApproved` →
      `CommitFinalized`, và nhánh `DepositExpired` → `Recover`. Hiện SDK chỉ có `recover(txId)` trần.
- [ ] `WebsocketConnector.connect()` gọi `queryRawProtocolParameters()` rồi bỏ kết quả (fire-and-forget,
      không cache, không bắt lỗi) → nên bỏ hoặc feed vào cache của bridge.

---

## 8. Protocol parameters — `types/protocol-parameters.type.ts`

> ✅ **Đã xong.** `@hydra-sdk/core` đã cập nhật lên PV11 ở commit `3eae146`
> (`DEFAULT_PROTOCOL_PARAMETERS` với `minPoolCost: 170000000`, cùng
> `DEFAULT_V1/V2/V3_COST_MODEL_LIST` — V3 có 350 entry = PV11).
> Bridge giờ dùng thẳng của core.

- [x] **Xoá `packages/hydra-bridge/src/constants/protocol-parameters.ts`.** File này duplicate core
      với cost model PV10 cũ, lại **chưa từng được export** khỏi `src/index.ts` → dead code.
      `DREP_DEPOSIT` + `resolveTxFees` đã có sẵn trong core, bản PV11.
- [x] **`toProtocol()` route qua `castProtocol` của core** → field nào node không trả sẽ rơi về
      default PV11 thay vì `undefined`.
- [x] `utxoCostPerByte = 0` trong head được giữ nguyên (`castProtocol` phân biệt `0` với "thiếu") —
      đã khoá bằng test.
- [x] `costModels` / `protocolVersion` vẫn không có chỗ trong `Protocol` của core → lấy qua
      `HydraBridge.getRawProtocolParameters()`, hoặc dùng
      `DEFAULT_V1/V2/V3_COST_MODEL_LIST` của core cho trường hợp offline.

---

## 9. Compat / hạ tầng

- [ ] Envelope tx vẫn là `"Tx ConwayEra" | "Unwitnessed Tx ConwayEra" | "Witnessed Tx ConwayEra"`
      ở v2.3.0 (`api.yaml:3126`) → **không cần đổi**. Ghi chú lại để khỏi rà lại.
- [ ] Query param WS `history` / `snapshot-utxo` / `address` **không đổi** → giữ nguyên.
- [ ] `HexcoreConnector` phải mirror mọi endpoint mới ở mục 5 (hiện thiếu toàn bộ).
- [ ] `HexcoreConnector` không hỗ trợ header `X-Api-Key` (chỉ `WebsocketConnector` có).
- [ ] README + `apps/docs-v2` cần bảng "SDK ↔ hydra-node version support matrix".
- [ ] Cập nhật `__tests__/unit/` fixtures theo payload mới (hiện snapshot test đang chốt schema cũ).

---

## 10. Thứ tự đề xuất

1. **P0 — sai dữ liệu im lặng:** mục 3 (field sai), mục 4 (PostTxError), `HydraHeadStatus.Final`, `HydraHeadInfo.tag`
2. **P0 — chức năng gãy trên v2:** mục 7 (`initHydraHead`, `abort`, `HeadIsOpen` không còn utxo)
3. **P1 — thiếu tính năng:** `SafeClose`, `SideLoadSnapshot`, `PartialFanout`, các tag mục 2.1/2.2
4. **P1 — endpoint:** `POST /transaction` (thay `submitTxSync`), `GET /commits`, `DELETE /commits/{txId}`, `GET /config`
5. **P2 — chính xác số học:** cost model PV11, `slotZeroTimestamp` từ `chainTime`
6. **P2 — dọn dẹp:** xóa `GetUTxO` / `PeerHandshakeFailure` / `CommitIgnored` / `GetUTxOResponse`, Hexcore parity, docs

---

**Nguồn tham chiếu:** `docs/upstream/v1-update.md`, `docs/upstream/v2-update.md`,
source `cardano-scaling/hydra` @ `2.3.0-16-g7af17e688` và tag `1.3.0`.
