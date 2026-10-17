# Báo cáo lát 4: unit test `hydra-bridge`

- Ngày: 2026-10-17
- Branch: `aniadev/refactor-test-bridge`
- Spec: `_bmad-output/planning-artifacts/test-refactor-spec.md`, mục "Lát 4"
- Phạm vi đã sửa: chỉ `packages/hydra-bridge/__tests__/**`. Không sửa `src`, không động vào `e2e/` (`git diff master -- packages/hydra-bridge/src` rỗng).

## 1. Số liệu trước/sau

| | Trước | Sau |
|---|---|---|
| File test (`hydra-bridge`) | 7 | 6 + 1 fixture |
| Số dòng `__tests__/**` | 3.213 | 1.926 |
| Test `hydra-bridge` | 240 pass | 211 pass + 18 `it.fails` (229) |
| Toàn repo (`pnpm vitest run`) | 1.134 pass, 58 file | 1.105 pass + 18 `it.fails`, 57 file |

Output của `pnpm vitest run packages/hydra-bridge` không còn dòng `stdout |`/`stderr |`: mọi nhánh `console.*` đều được spy và assert. Cảnh báo `TSConfckParseError` vẫn có thể xuất hiện ở lần chạy toàn repo; lát 0 xử lý phần này.

## 2. Thay đổi theo file

| File | Thao tác | Nội dung |
|---|---|---|
| `__tests__/helpers/fixtures.ts` | tạo mới | `utxo()`, `utxoSet()`, `pp()`, `greetings()`, `tx()`, `snapshotConfirmed()`, `echoedNewTx()`, `headState.idle/open()`, `mockConnector()` (đủ method fetcher/submitter, gồm `submitL2Tx`, `recoverDeposit`, `decommit`, `sideLoadSnapshot`, `apiFetch.get/post/delete`), `deferred()`, `httpError()`. Chỉ phụ thuộc type public của bridge, `vitest` và `mitt`, nên có thể chuyển sang `@hydra-sdk/testkit/fixtures` bằng cách đổi đường dẫn import. |
| `unit/bridge.test.ts` | viết lại (963 → 587 dòng) | Xoá test chỉ kiểm tra `sendCommand` được gọi, test đọc field private (`wsConnector.conn.*`), test `toBeDefined`. Chuyển toàn bộ sang fake timers (`vi.useFakeTimers({ now })`). Thêm: `NodeSynced`/`NodeUnsynced`/`SyncedStatusReport`, `slotZeroTimestamp` (xấp xỉ từ Greetings, chính xác từ `chainTime`, chính xác không bị ghi đè), `headInfo()` ở `Open`, số dư multi-asset theo địa chỉ, reconnect re-seed, race HTTP–WS, `submitL2Tx`, `pendingDeposits`, `recoverDeposit` (HTTP và fallback sang command), ranh giới timeout của `initSync`. Các command gộp thành một bảng `it.each` assert đúng message gửi đi. |
| `unit/connector/websocket.test.ts` | viết lại (542 → 466 dòng) | Bỏ `vi.mock('axios')`, thay `apiFetch` bằng stub sau khi khởi tạo. Thêm `submitTxSync` với `RejectedInputBecauseUnsynced`, `CommandFailed` lọc theo txId được echo (`echoesOurTx`), message của tx khác bị bỏ qua, timeout gỡ listener; gắn tag `InvalidInput`; frame không phải JSON; đủ 7 fetcher REST (bảng path + bảng lỗi 500), `querySnapshotUtxo` 404 → `{}`, `queryConfirmedSnapshot` 404 → `null`, `queryNodeConfig` 400/404 → lỗi yêu cầu ≥ 2.3.0, `queryPendingDeposits`; submitter `commit` (lỗi Haskell), `submitCardanoTx`, `submitL2Tx` (verdict trong body non-2xx), `recoverDeposit` (url-encode), `decommit`, `sideLoadSnapshot`. |
| `unit/connector/hexcore.test.ts` | viết lại (459 → 371 dòng) | Bỏ mẫu `if (connectCall) …`: handler socket.io được gọi qua `fire()`, hàm này throw khi connector chưa đăng ký event. Thêm `submitL2Tx`, `recoverDeposit`, `decommit`, `sideLoadSnapshot`, các fetcher REST v2, `submitTx` callback, URL namespace của socket.io. |
| `unit/utils/url-builder.test.ts`, `url-parser.test.ts` | xoá, gộp vào `url.test.ts` (769 → 96 dòng) | Bảng `it.each` cho parse (hợp lệ/không hợp lệ) và build, cộng một test round-trip parse → build trên 5 URL. |
| `unit/utils/haskell-deserialize.test.ts` | viết lại (289 → 107 dòng) | Giữ parser, mỗi input assert toàn bộ kết quả bằng `toEqual`. Xoá block chỉ assert hằng số enum và block `toBeDefined`. Tag v2.3 còn thiếu được ghi bằng `it.fails` (mục 4). |
| `unit/utils/await-hydra-message.test.ts` | viết lại (191 → 94 dòng) | Thay spy `clearTimeout` bằng `vi.getTimerCount()`; kiểm tra ranh giới timeout (499 ms chưa reject, 500 ms reject) và mặc định 30 s. |

## 3. Kiểm chứng bằng đột biến

Mỗi đột biến được áp vào `src`, chạy file test tương ứng, rồi hoàn tác (script trong scratchpad, ghi lại file gốc trong `finally`).

| File test | Đột biến trong `src` | Test đỏ |
|---|---|---|
| `bridge.test.ts` | `NodeSynced ? 'InSync' : 'CatchingUp'` → đảo hai nhánh | `NodeSynced sets InSync…`, `NodeUnsynced sets CatchingUp…` |
| | `querySnapshotUtxo`: bỏ guard `lastSnapshotNumber === -1` | `a slow HTTP re-seed does not overwrite or regress a WS snapshot…` |
| | `(retry + 1) * interval` → `retry * interval` | `re-sends Init retry times, then times out` |
| | `this.slotZeroIsExact = exact` → `= false` | `an exact slot zero is not overwritten…` |
| | `parties?.[0]` → `parties?.[1]` | `reports Open with the head id and the first party vkey` |
| | `recoverDeposit`: `if (recover)` → `if (false)` | `recoverDeposit uses HTTP and reports its outcome` |
| `websocket.test.ts` | `echoesOurTx` luôn trả `true` | `ignores messages about other transactions` |
| | bỏ gắn tag `InvalidInput` | `tags an untagged InvalidInput` |
| | `queryNodeConfig`: bỏ nhánh 400 | `queryNodeConfig explains a 400 as a pre-2.3.0 node` |
| | bỏ query param `snapshot-utxo=no` | ca url có `noSnapshotUtxo` |
| | `submitL2Tx`: bỏ nhánh body có `tag` | `returns a tagged non-2xx body as the verdict` |
| `hexcore.test.ts` | `submitL2Tx`: bỏ `data.data` khi đọc body lỗi | `returns a tagged error body found in data.data…` |
| | `emit(this.namespace, …)` → `emit('hydra', …)` | `sendCommand emits send_command on the namespace…` |
| | `queryPendingDeposits`: bỏ fallback `?? []` | `queryPendingDeposits falls back to [] …` |
| | bỏ gắn tag `InvalidInput` | `tags an untagged InvalidInput` |
| `url.test.ts` | `port: url.port \|\| defaultPort` → `url.port` | 4 ca parse dùng cổng mặc định |
| | bỏ nhánh tự thêm `http://` | `localhost:4001/api`, `192.168.1.1:4001` |
| | `searchParams.append(key, encodeURIComponent(value))` | ca build có query, round-trip `k=v%26w` |
| `haskell-deserialize.test.ts` | regex tên lỗi `^([^{]+)` → `^([^{ ]+)` | `"  NoFuelUTXOFound  "` |
| | `break` sớm ở nhóm `FailedToConstruct{Increment,Recover,Decrement}Tx` | 3 ca `failureReason` tương ứng |
| | `extractInt` cộng thêm 1 | `TimeConversionException {slotNo = …}` |
| `await-hydra-message.test.ts` | bỏ `clearTimeout(timer)` | 3 test kiểm tra `vi.getTimerCount()` |
| | bỏ `emitter.off(...)` | 5 test |
| | mặc định `30_000` → `3_000` | `defaults to a 30s timeout…` |

Đột biến không làm đỏ test nào (đột biến tương đương):

- `bridge.ts`: bỏ `if (this.slotZeroIsExact && !exact) return` trong `setSlotZeroFrom`. Nhánh Greetings đã tự kiểm tra `!this.slotZeroIsExact` trước khi gọi, nên guard này thừa với code hiện tại.
- `websocket.ts`: bỏ dòng `clientInput?.tag !== HydraCommand.NewTx` trong `echoesOurTx`. Chỉ `NewTx` có field `transaction`, nên dòng kiểm tra txId đã đủ để loại input khác.
- `url-builder.ts`: đổi `DEFAULT_PORTS`, hoặc bỏ hẳn điều kiện `String(port) !== DEFAULT_PORTS[protocol]`. `URL` của WHATWG tự bỏ cổng mặc định của `http/https/ws/wss`, nên bảng `DEFAULT_PORTS` trong builder là code chết.

## 4. Bug ghi nhận bằng `it.fails`

Các bug B1–B7 ở mục 6 của spec thuộc `core`/`hydra-transaction`, không nằm trong lát này. Các bug dưới đây được phát hiện khi viết lại test. Mỗi bug đã được tái hiện: đổi `it.fails` thành `it` thì test đỏ bởi `AssertionError`, không phải lỗi runtime.

| # | Vị trí | Mô tả | Test |
|---|---|---|---|
| BR1 | `bridge.ts:325-338` | `connect()` chỉ gỡ handler đã kích hoạt; handler còn lại (`onDisconnected` khi kết nối thành công) ở lại emitter vĩnh viễn, nên mỗi lần gọi `connect()` rò rỉ một listener. `disconnect()` (dòng 353-358) có cùng lỗi nhưng chưa có test riêng. | `connect leaves no handler of its own behind once settled` |
| BR2 | `bridge.ts:166-189, 465` | Comment ở `onConnected` ghi HTTP fallback "will be skipped if Greetings … arrives first". Thực tế seed từ Greetings không cập nhật `lastSnapshotNumber` (vẫn là `-1`), nên response HTTP tới muộn vẫn ghi đè cache. | `a slow HTTP re-seed does not overwrite a cache seeded from Greetings` |
| BR3 | `connector/websocket.ts:316` | `onopen` gọi `fetcher.queryRawProtocolParameters()` và bỏ promise. Nếu `GET /protocol-parameters` lỗi, đó là unhandled rejection (Node mặc định thoát process). Kết quả cũng không được dùng: bridge tự query và cache riêng. | `handles a failing protocol-parameters query on open` |
| BR4 | `connector/hexcore.ts:283` | Cùng lỗi BR3 ở `connect()`. | `handles a failing protocol-parameters query on connect` |
| BR5 | `connector/hexcore.ts:253` | URL socket.io được ghép `httpUrl + this.namespace` không có dấu `/`: `https://gw.example.com/api` → `…/apihydra`. Ví dụ trong docstring (`https://api.hexcore.dev/hydra`) cho ra `…/hydrahydra`. Cần Ania xác nhận hành vi mong muốn khi URL có path. | `joins the namespace onto a url that has a path` |
| BR6 | `connector/hexcore.ts:50, 109` | Nhãn lỗi copy-paste: lỗi của `querySnapshotUtxo` và `commit` đều mang tiền tố `[QueryProtocolParameters]`. | `querySnapshotUtxo labels its own failure`, `commit labels its own failure` |
| BR7 | `utils/haskell-deserialize.ts:56-66` | `failureReason` được bắt bằng `/"([^"]+)"/`, regex này dừng ở dấu nháy escape đầu tiên (`SafeHash \"`), trong khi các regex bên trong chỉ khớp nháy escape. Vì vậy `txIn.txId`, `txIn.txIx`, `scriptHash` của `ScriptFailedInWallet` luôn là `null`. Test cũ chỉ có `toBeDefined()` nên không phát hiện. | `extracts the tx input and script hash from ScriptFailedInWallet` |
| BR8 | `utils/haskell-deserialize.ts:1-18` | `ErrorType` thiếu 10 tag của `PostTxError` v2.3.0 (`types/post-tx-error.type.ts`); các tag này rơi vào nhánh `Unknown error format`. | 7 ca `recognises …` + 3 ca `extracts failureReason from …` |

### Diff đề xuất cho `ErrorType` (cần Ania duyệt, commit riêng)

```diff
 export enum ErrorType {
 	ScriptFailedInWallet = 'ScriptFailedInWallet',
 	InternalWalletError = 'InternalWalletError',
 	NoFuelUTXOFound = 'NoFuelUTXOFound',
 	NotEnoughFuel = 'NotEnoughFuel',
 	NoSeedInput = 'NoSeedInput',
 	InvalidSeed = 'InvalidSeed',
+	InvalidHeadId = 'InvalidHeadId',
+	UnsupportedLegacyOutput = 'UnsupportedLegacyOutput',
+	DepositTooLow = 'DepositTooLow',
+	InvalidStateToPost = 'InvalidStateToPost',
+	FailedToPostTx = 'FailedToPostTx',
+	/** hydra-node v1 only */
 	FailedToConstructAbortTx = 'FailedToConstructAbortTx',
+	/** hydra-node v1 only */
 	FailedToConstructCollectTx = 'FailedToConstructCollectTx',
 	FailedToConstructCloseTx = 'FailedToConstructCloseTx',
 	FailedToConstructContestTx = 'FailedToConstructContestTx',
 	FailedToConstructFanoutTx = 'FailedToConstructFanoutTx',
+	FailedToConstructPartialFanoutTx = 'FailedToConstructPartialFanoutTx',
+	StalePartialFanoutTx = 'StalePartialFanoutTx',
+	FailedToConstructDepositTx = 'FailedToConstructDepositTx',
 	FailedToConstructIncrementTx = 'FailedToConstructIncrementTx',
 	FailedToConstructRecoverTx = 'FailedToConstructRecoverTx',
 	FailedToConstructDecrementTx = 'FailedToConstructDecrementTx',
+	ContestationDeadlineOutsideTimeHorizon = 'ContestationDeadlineOutsideTimeHorizon',
+	InvalidTokenRequest = 'InvalidTokenRequest',
 	TimeConversionException = 'TimeConversionException',
 	UnknownError = 'UnknownError'
 }
```

Trong `switch`:

```diff
 		case ErrorType.NoFuelUTXOFound:
 		case ErrorType.NotEnoughFuel:
 		case ErrorType.NoSeedInput:
+		case ErrorType.InvalidHeadId:
+		case ErrorType.UnsupportedLegacyOutput:
+		case ErrorType.DepositTooLow:
+		case ErrorType.InvalidStateToPost:
+		case ErrorType.FailedToConstructPartialFanoutTx:
+		case ErrorType.StalePartialFanoutTx:
+		case ErrorType.InvalidTokenRequest:
 			// No additional fields for these error types
 			break
 ...
+		case ErrorType.FailedToPostTx:
+		case ErrorType.FailedToConstructDepositTx:
+		case ErrorType.ContestationDeadlineOutsideTimeHorizon:
 		case ErrorType.FailedToConstructIncrementTx:
 		case ErrorType.FailedToConstructRecoverTx:
 		case ErrorType.FailedToConstructDecrementTx: {
```

Khi áp diff này, 10 ca `it.fails` của BR8 sẽ đỏ; đổi chúng thành `it`. Các field riêng (`headId`, `byronAddress`, `providedValue`/`minimumValue`) chưa được trích xuất vì `JsonResult` chưa có chỗ chứa; nếu cần thì bổ sung sau.

## 5. Câu hỏi mở

1. **Reset `lastSnapshotNumber` khi reconnect.** `onConnected` đặt `lastSnapshotNumber = -1` (có chủ đích: comment "reset snapshot counter", head mới có thể đánh số lại từ 0). Hệ quả: sau reconnect, một `SnapshotConfirmed` cũ tới muộn (ví dụ #5 sau khi đã có #10) vẫn được áp dụng. Test hiện mô tả hành vi này (`resets the counter on reconnect…`) và kiểm tra rằng HTTP re-seed không ghi đè, không làm lùi snapshot WS đã tới trước (`a slow HTTP re-seed does not overwrite or regress…`). Đã hỏi coordinator có coi việc reset là bug hay không; xem mục 6.
2. **BR5** cần xác nhận hành vi mong muốn khi URL Hexcore có path.
3. **`HexcoreConnector.submitL2Tx`** gửi body `{ submitL2Tx: {...} }`, còn `WebsocketConnector` gửi envelope trần (comment trong `websocket.ts` ghi hydra-node không nhận dạng bọc). Chưa rõ API của Hexcore yêu cầu dạng nào, nên chưa ghi `it.fails`.
4. **`HydraBridge.submitL2Tx` / `recoverDeposit` / `pendingDeposits`** tách method ra khỏi object rồi mới gọi (`const submit = this.connector.submitter.submitL2Tx; submit(...)`). Submitter mặc định dùng closure nên không ảnh hưởng; submitter tự viết dạng class dùng `this` sẽ lỗi.
5. **`getAddressBalance`** trả `null` khi snapshot đã seed nhưng rỗng (`{}`), không phân biệt được với lúc chưa seed; `queryAddressUTxO` khi đó gọi lại HTTP ở mọi lần.
6. **`commit` của `WebsocketConnector`** chỉ deserialize body lỗi dạng chuỗi Haskell `show`. Với hydra-node v2, body lỗi của `POST /commit` có thể là JSON `PostTxError`; nếu đúng vậy thì nhánh deserialize là code cũ. Cần kiểm tra trên node thật (e2e).

## 6. Trả lời của coordinator

Câu hỏi ở mục 5.1 đã gửi qua `orca orchestration ask` (messageId `msg_67d8bbb1a6fd`) và hết thời gian chờ 10 phút mà chưa có trả lời. Lát này áp dụng phương án mặc định đã nêu trong câu hỏi: giữ hành vi reset là hành vi hiện có, không ghi `it.fails`. Nếu Ania coi việc reset là bug, thêm một `it.fails` vào `describe('reconnect and HTTP/WS ordering')`: sau reconnect, `SnapshotConfirmed` #5 tới sau #10 thì cache không đổi.
