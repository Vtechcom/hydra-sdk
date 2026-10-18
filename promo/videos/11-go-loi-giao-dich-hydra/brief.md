# Tập 11 — Gỡ lỗi giao dịch Hydra thường gặp

## Brief

| Mục | Quyết định |
|---|---|
| Chuỗi | Kiến thức nền Cardano và Hydra, đồng thời giới thiệu hydra-sdk; tập này nối tiếp tập 6, mở rộng cảnh "Ba lỗi hay gặp" thành một tập riêng |
| Thể loại | Hướng dẫn cho lập trình viên (tutorial), mỗi nhóm lỗi một hoặc hai cảnh; mỗi lỗi mở đầu bằng một hình ảnh đời thường trước khi vào tên kỹ thuật |
| Phong cách | Như tập 6: phấn trắng trên nền đen, hình hiện dần; khung code chữ phấn (JetBrains Mono, tô màu nhẹ). Tin nhắn của nút Hydra vẽ phấn lại theo lược đồ API của hydra-node, không chụp màn hình terminal thật. Mọi cảnh code có nhãn nhỏ ở góc "Code rút gọn, bản đầy đủ ở hydrasdk.com" (không đọc thành lời) |
| Lời đọc | Tiếng Việt, giọng Hải Đăng (VieNeu), không phụ đề chạy; chữ trên màn hình chỉ là chữ viết lên bảng và đoạn code. Không đọc tên nhãn (`TxInvalid`, `CommandFailed`…) và tên hàm thành lời, chỉ mô tả bằng tiếng Việt; tên kỹ thuật nằm trên bảng (cùng quy ước với tập 3 và tập 6) |
| Khung hình | 16:9, 1920×1080 |
| Âm thanh | Giọng đọc + nền và hiệu ứng tự tổng hợp; tiếng gõ phím nhẹ ở cảnh code; một tiếng trầm ngắn khi một phiếu từ chối hiện ra, tiếng tích tắc ở cảnh hết thời gian chờ |
| Khán giả | Lập trình viên đã xem tập 1–6 (nhất là tập 3, 5, 6), đã chạy được giao dịch đầu tiên trong Head. Người chưa biết code vẫn theo được phần hình ảnh đời thường ở đầu mỗi lỗi |
| Độ dài | Khoảng 5–6 phút |
| Cuối video | hydrasdk.com ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc, không đọc thành lời |

**Hình xuyên suốt:** mỗi lỗi là một **thẻ ba dòng** vẽ phấn: Triệu chứng (tin nhắn nút Hydra gửi về, ghi đúng nhãn) → Nguyên nhân → Cách tránh (một dòng API thật). Thẻ được ghim dần lên một tấm bảng "sổ gỡ lỗi" ở góc phải; cảnh tóm tắt cuối cho thấy cả tấm bảng. Màu nhấn cố định:

- Món tiền chưa tiêu: vàng phấn (như cả chuỗi).
- Tin nhắn nút Hydra là **một tờ phiếu có nhãn ở góc**: phiếu xác nhận (`TxValid`, `SnapshotConfirmed`) xanh lá phấn; phiếu từ chối (`TxInvalid`, `CommandFailed`, `InvalidInput`, `RejectedInputBecauseUnsynced`) hồng phấn; trạng thái "chưa có phiếu nào" (hết thời gian chờ) là khung nét đứt màu xám.
- Chìa khoá và chữ ký: như tập 4. Datum, redeemer, script: như tập 5.
- Vòng tròn Head và nút Hydra trên viền: như tập 3 và tập 6.

**Ví dụ xuyên suốt:** tiếp câu chuyện tập 6. An có món tiền 18 ADA trong Head, đã gửi 2 ADA cho Bình. Lần này An bấm gửi thêm một giao dịch nữa trước khi giao dịch đầu được xác nhận, rồi lần lượt vấp các lỗi khác (Head đã đóng, nút chưa đồng bộ, quên ký…). Đây là **ví dụ minh hoạ**: các tình huống dựng lại để giải thích, mã giao dịch và địa chỉ trên bảng là chuỗi rút gọn (`fa1e…369f#0`, `addr_test1…`), không phải nhật ký của một Head thật.

## Nguồn tham khảo

Tất cả đã mở ra đọc ngày 16/10/2026, trên nhánh `claude/cardano-hydra-video-series-c086de`.

Code `packages/hydra-bridge/src`:

- `bridge.ts:596-603` — `submitTxSync(tx, options = { timeout: 30000 })`: khi chưa kết nối thì **ném `Error('Not connected to Hydra node')`** (không phải `SubmitTxError`), còn lại giao cho `connector.submitter.submitTxSync`.
- `bridge.ts:622-634` — `submitTx(tx, callback, options)`: kiểu callback `(error: SubmitTxError | null, result: SubmitTxResult | null)`; khi chưa kết nối gọi callback với `{ txId, reason: 'Not connected to Hydra node', tag: 'Error' }`.
- `bridge.ts:605-620` — `submitL2Tx(tx, options = { timeout: CHAIN_TIMEOUT_MS })` gửi qua `POST /transaction`, chú thích: "the node decides confirmed/invalid/rejected itself instead of the client racing WebSocket messages against a timeout".
- `bridge.ts:362-380` — `headInfo()` gọi `GET /head`, trả `{ headId, headStatus, vkey }`; `headStatus` ở đây chỉ là `Idle`, `Open` hoặc `Closed`.
- `bridge.ts:174-218` — xử lý `onMessage`: `Greetings` cập nhật `nodeVersion`, `syncedStatus`; `SnapshotConfirmed` cập nhật bộ nhớ đệm món tiền **chỉ khi số snapshot lớn hơn** (`lastSnapshotNumber`); `NodeSynced`/`NodeUnsynced` đặt `syncedStatus` thành `'InSync'`/`'CatchingUp'` và in cảnh báo "Node is out of sync … it will reject client inputs".
- `bridge.ts:557-594` — `initHydraHead`: từ chối sớm với `Error('Init rejected: node is out of sync with the chain …')` khi nhận `RejectedInputBecauseUnsynced`; hết hạn thì `Error('Init timeout')`.
- `bridge.ts:636-658` — `decommit` hết hạn với `Error('Decommit timeout')`.
- `bridge.ts:660-678` — `events`; `queryAddressUTxO(address)` đọc từ chỉ mục địa chỉ dựng lại sau mỗi snapshot, chỉ gọi HTTP khi chưa có dữ liệu.
- `connector/websocket.ts:374-436` — lõi của `submitTxSync`: gửi lệnh `NewTx`, rồi chờ tin nhắn qua `awaitHydraMessage`:
  - `TxValid` có `transactionId` trùng → chỉ bật cờ `isValid`, chờ tiếp;
  - `TxInvalid` có `transaction.txId` trùng → từ chối với `{ txId, reason: payload.validationError.reason, tag: 'TxInvalid' }`;
  - `RejectedInputBecauseUnsynced` của đúng giao dịch → `reason: 'Node is out of sync with the chain (drift …s)'`;
  - `CommandFailed` của đúng giao dịch → `reason: 'Node rejected NewTx'`;
  - `SnapshotConfirmed` có giao dịch trong `snapshot.confirmed` → trả `{ txId, isValid, isConfirmed: true, result }`;
  - hết `options.timeout` → từ chối với `{ txId, reason: 'Timeout', tag: 'Timeout' }`.
  - Không có nhánh nào cho `InvalidInput`.
- `connector/websocket.ts:22-34` — `CHAIN_TIMEOUT_MS = 300_000`, chú thích ghi khớp mặc định `--api-transaction-timeout` 300 giây của hydra-node.
- `connector/websocket.ts:358-372` — nút Hydra gửi `InvalidInput` **không có `tag`**, connector tự gắn `tag: 'InvalidInput'` (hàm `isInvalidInputPayload` ở `types/payload.type.ts:217-222`).
- `utils/await-hydra-message.ts:18-49` — `awaitHydraMessage(emitter, predicate, timeoutMs = 30_000, timeoutError)`, tự gỡ listener và xoá hẹn giờ ở mọi lối ra.
- `types/submitter.type.ts:7-18` — `SubmitTxResult { txId, isValid, isConfirmed, result: SnapshotConfirmed | null }`, `SubmitTxError { txId, reason, tag }`.
- `types/submit-tx.type.ts:3-10, 43-62` — `SubmitTxBody` (khi có `txId`, nút Hydra kiểm tra cho khớp với giao dịch); `SubmitL2TxResponse`: `SubmitTxConfirmed { snapshotNumber }`, `SubmitTxInvalid { validationError }`, `SubmitTxRejected { reason }` (nút chưa đồng bộ), `SubmitTxSubmitted` (đã nhận, chưa xác nhận trong thời hạn API của nút).
- `types/payload.type.ts` — `HydraHeadStatus` (`:13-23`), `HydraCommand` (`:30-48`), `HydraHeadTag` (`:58-117`), `Greetings` có `headStatus`, `hydraNodeVersion`, `chainSyncedStatus`, `env.unsyncedPeriod` (`:147-187`), `InvalidInput { reason, input }` (`:204-209`), `CommandFailed { clientInput, state }` (`:224-229`), `RejectedInputBecauseUnsynced { clientInput, drift }` "Emitted since hydra-node v1.3.0" (`:237-247`), `TxValid { transactionId }` (`:376-380`), `TxInvalid { utxo, transaction, validationError: { reason } }` (`:382-390`), `HydraSnapshot.confirmed` (`:392-408`), `CommitRecorded` "deposit is not yet usable", `DepositActivated`, `CommitFinalized` (`:469-510`), `NodeUnsynced` "will reject client inputs until synced" (`:528-541`).
- `types/post-tx-error.type.ts` — `PostTxError` (lỗi khi nút đưa giao dịch lên mạng chính, qua `PostTxOnChainFailed`); tập này chỉ nhắc tên, không đi sâu.

Code `packages/hydra-transaction/src/tx-builder/index.ts`:

- `:347-355` — `selectUtxosFrom` (private) có ném `Error('UTxO inputs Insufficient')` khi danh sách rỗng, nhưng `_addInputsToBuilder` (`:1301-1390`) chỉ gọi hàm này khi có ít nhất một món thường (`if (rawUTxOs.length > 0)`), nên qua `complete()` người dùng **không gặp** chuỗi lỗi này.
- `:1095-1112` — ở chế độ Hydra, `_assembleAndBuild` gọi `build_tx_unsafe()` (không kiểm tra cân bằng vào/ra), ở mạng chính gọi `build_tx()`.
- `:373-378`, `:414-425` — khi không phải chế độ Hydra mà thiếu `changeAddress` thì ném `'Change address is required for UTxO selection. Call changeAddress() first.'`; ở chế độ Hydra thì không ném lỗi này, chỉ cảnh báo khi bật `verbose` ("Without change address for Hydra").
- Khi danh sách có món nhưng tổng không đủ, lỗi đến từ thư viện CSL bên dưới: chuỗi `UTxO Balance Insufficient` có trong `@emurgo/cardano-serialization-lib-nodejs@14.1.2` (bản `packages/cardano-wasm/package.json:107-109` đang dùng); kiểm bằng cách tìm chuỗi trong file `.wasm`.
- **Chạy thử thật** (16/10/2026, vitest với alias tới `src/`, file thử nằm ngoài repo, không commit): `new TxBuilder({ isHydra: true, params: { minFeeA: 0, minFeeB: 0 } })` + một đầu ra 2 ADA.
  - `setInputs([])` rồi `complete()` → lỗi `Fee not specified` (mạng chính: `Fee is not set`).
  - Một món 1 ADA → `UTxO Balance Insufficient` (cả hai chế độ).
  - Một món 18 ADA, quên `changeAddress` → `Fee not specified`.
  - Một món 18 ADA, quên `changeAddress` nhưng tự gọi `setFee('0')` → dựng được giao dịch 1 đầu vào, 1 đầu ra (vào 18 ADA, ra 2 ADA), tức giao dịch không cân; chưa gửi thử lên nút.
  - Một món 18 ADA, có `changeAddress` → dựng được, 2 đầu ra, phí 0.
- `:1436-1440` — `_addCollateralToBuilder` ném `'Collateral UTxO must contain only lovelace'`.
- `:516` `setInputs(utxos, { strategy })`, `:537` `txInCollateral(txHash, outputIndex, amount, address)`, `:559` `collateralReturn(address, amount)`, `:735` `requiredSignerHash`, `:749` `changeAddress`, `:824` `setChangeAddress` (ghi "Legacy method", gọi lại `changeAddress`), `:890-926` `complete()`, `:91-118` constructor nhận `isHydra`, `params`, `verbose`, `errorLogger`.
- `packages/core/src/wallet.ts:72-85` — `signTx(unsignedTx, partialSign = false, accountIndex = 0, keyIndex = 0)`: ký bằng khoá thanh toán của tài khoản chỉ định; nếu giao dịch đã có chữ ký mà không bật `partialSign` thì ném `'Signatures already exist in the transaction in a non partial sign call'`.
- `packages/hydra-bridge/src/bridge.ts:404-410` — `getProtocolParameters()` trả tham số giao thức của Head ở dạng `Protocol` của `@hydra-sdk/core`, dùng được cho `new TxBuilder({ isHydra: true, params })`.

Tài liệu `apps/docs-v2/content/en`:

- `4.api/3.bridge.md:304-366` (`submitTxSync`, `submitTx`), `:480-494` (`submitL2Tx`, khuyên dùng thay `submitTxSync`), `:760-810` (ví dụ `switch (payload.tag)` có `TxInvalid`, `CommandFailed`), `:833-848` (`SubmitTxResult`, `SubmitTxError`), `:1062-1070` (mục Best Practices số 8 về timeout mặc định 30 000 ms).
- `3.concepts/6.hydra-v2-changes.md:20-37` — bảng phiên bản hydra-node (SDK nhắm 1.3.0 và 2.3.0); "Out-of-sync protection (breaking) … Client code should wait for `NodeSynced` before submitting."
- `5.resources/1.changelog.md:110-138` — bridge 2.0.0: "the bridge now fails fast on `RejectedInputBecauseUnsynced` instead of hanging until timeout"; `InvalidInput` không có `tag`; chọn timeout 300 giây cho các endpoint chờ mạng chính.
- `3.concepts/5.smart-contracts-in-hydra.md:150-165, 190` — ví dụ `txInCollateral`; ghi chú về tiền thế chấp trong Head (diễn đạt chung chung, xem "Không dùng").
- `2.guides/2.build-wallet-app.md:112-120` — mục Troubleshooting hiện có chỉ nói lỗi WASM/Vite, không nói lỗi giao dịch; docs-v2 **chưa có trang gỡ lỗi giao dịch Hydra**.
- `2.guides/5.hydra-integration.md:12-35, 60-80` — cấu hình `isHydra: true, minFeeA: 0, minFeeB: 0`; lắng nghe `TxInvalid` qua `onMessage`.

Playground: `apps/playground/pages/hydra-tx-trace.vue` — trang "Hydra Message Trace", dán JSON `TxInvalid` để tách `validationError.reason` (nhất là lỗi script Plutus, ví dụ chuỗi "Plutus validation failed: …"). Theo `nuxt.config.ts:141` và `UPGRADE-CHECKLIST.md:13` đây là trang cũ (legacy, dùng Element Plus), chưa nâng cấp; xem câu hỏi 3.

Nguồn ngoài (đã tải về đọc ngày 16/10/2026):

- Lược đồ API hydra-node 2.3.0 — https://github.com/cardano-scaling/hydra/blob/2.3.0/hydra-node/json-schemas/api.yaml (mô tả `TxValid` "it may still happen that this transaction is not included in a snapshot"; `TxInvalid` "Either it is not yet valid … or it is no longer valid (because of conflicting transactions observed in-between)"; `InvalidInput` "failed to parse some client input"; `CommandFailed` "a well-formed client input was not processable. For example, if trying to close a non opened head"; `RejectedInputBecauseUnsynced` "the node-state is catching up with the chain-state"; `NodeUnsynced` có `drift` = giờ hệ thống trừ giờ của điểm chuỗi mới nhất; `POST /transaction` với bốn kết quả `SubmitTxConfirmed` 200, `SubmitTxInvalid` 400, `SubmitTxRejected` 503, `SubmitTxSubmitted` 202).
- Lược đồ API hydra-node 1.3.0 — https://github.com/cardano-scaling/hydra/blob/1.3.0/hydra-node/json-schemas/api.yaml (đã có `RejectedInputBecauseUnsynced`, `NodeUnsynced` và `POST /transaction` với cùng bốn kết quả).
- CHANGELOG hydra-node — https://github.com/cardano-scaling/hydra/blob/master/CHANGELOG.md: mục 1.0.0 "Add API endpoint `POST /transaction`"; mục 1.3.0 (2026-03-05) "start rejecting both network and client inputs once its view of the chain has been out of sync for more than 50% of the configured `--contestation-period`", thêm `RejectedInputBecauseUnsynced`, `--unsynced-period` "Defaults to half the contestation period"; bản mới nhất đã phát hành là 2.4.1 (2026-09-02).
- Mã nguồn hydra-node 2.3.0, `hydra-node/src/Hydra/HeadLogic.hs` — https://github.com/cardano-scaling/hydra/blob/2.3.0/hydra-node/src/Hydra/HeadLogic.hs: `onOpenNetworkReqTx` (khoảng dòng 212-240) khi giao dịch chưa áp được thì **chờ** (`WaitOnNotApplicableTx`) trong lúc TTL còn, hết TTL mới phát `TxInvalid`; `handleClientInput` chỉ nhận `NewTx` khi Head ở trạng thái `Open`, các trường hợp khác rơi vào `CommandFailed clientInput st` (khoảng dòng 1880-1905); `updateCatchingUpHead` trả `RejectedInputBecauseUnsynced clientInput drift` cho mọi lệnh khi nút đang bắt kịp chuỗi (khoảng dòng 1663-1668).
- Kiểm thử hydra-node 2.3.0: `hydra-cluster/src/Hydra/Cluster/Scenarios.hs` (gửi giao dịch chưa ký qua `POST /transaction` nhận lỗi 400 chứa `MissingVKeyWitnessesUTXOW`; `DecommitInvalid` cũng chứa chuỗi này), `hydra-node/test/Hydra/BehaviorSpec.hs` (chú thích "this would be TxInvalid with BadInputsUTxO" khi tiêu món không có trong sổ cục bộ).
- cardano-ledger, quy tắc UTXO của kỷ nguyên Conway — https://github.com/IntersectMBO/cardano-ledger/blob/master/eras/conway/impl/src/Cardano/Ledger/Conway/Rules/Utxo.hs: tên lỗi `BadInputsUTxO`, `OutsideValidityIntervalUTxO`, `FeeTooSmallUTxO`, `ValueNotConservedUTxO`, `InsufficientCollateral`, `NoCollateralInputs`, `BabbageOutputTooSmallUTxO`.
- Tài liệu Hydra, use case đấu giá — https://github.com/cardano-scaling/hydra/blob/master/docs/use-cases/auctions/delegated-voucher-invitational/index.md: "so that collateral UTXOs can be committed to the Hydra head for transactions with validator scripts on layer 2" (món thế chấp phải nằm trong Head).

## Ranh giới sự thật

Được nói (đã đối chiếu):

- Có hai nơi lỗi xuất hiện. Thứ nhất, trên máy mình, khi `TxBuilder.complete()` dựng giao dịch (chưa gửi gì đi). Thứ hai, ở nút Hydra, khi nút trả về một tin nhắn có nhãn.
- Với `submitTxSync`, có ba kết cục: được xác nhận trong một snapshot (`SubmitTxResult` có `isConfirmed: true`), bị từ chối kèm nhãn và lý do (`SubmitTxError { txId, reason, tag }`), hoặc hết thời gian chờ (`tag: 'Timeout'`). Nếu chưa kết nối thì lệnh ném `Error` thường ngay lập tức; lỗi này **không có thuộc tính `tag`**, nên code bắt lỗi phải xử lý trường hợp `e.tag` rỗng trước khi rẽ nhánh theo nhãn.
- Lỗi thiếu món tiền của `TxBuilder` chỉ xuất hiện khi gọi `complete()`; `setInputs()` chỉ ghi lại danh sách ứng viên, không kiểm tra.
- `headInfo()` (qua `GET /head`) trả trạng thái dạng chữ `'Open'`, `'Closed'`, `'Idle'`; tin nhắn WebSocket lại dùng nhãn sự kiện `HeadIsOpen`, `HeadIsClosed`. Trên bảng ghi rõ hai dạng này là hai nguồn khác nhau.
- **Danh sách món tiền rỗng** làm `complete()` báo `Fee not specified`, một thông điệp nói về phí dù gốc rễ là không có món tiền nào; danh sách có món nhưng không đủ tiền thì báo `UTxO Balance Insufficient` (từ thư viện CSL). Cả hai xảy ra trên máy, trước khi gửi (đã chạy thử).
- **Head chưa mở hoặc đã đóng:** nút Hydra chỉ nhận lệnh gửi giao dịch khi Head ở trạng thái `Open`; ngược lại nút trả `CommandFailed`, kèm lại lệnh đã gửi và trạng thái Head lúc đó. `submitTxSync` chuyển thành lỗi `tag: 'CommandFailed'`, `reason: 'Node rejected NewTx'`. Kiểm tra trước bằng `headInfo()` (`headStatus === 'Open'`) hoặc theo dõi `HeadIsOpen`, `HeadIsClosed`.
- **Tiền nạp chưa vào Head (chỉ hydra-node v2):** sau `CommitRecorded` món nạp "chưa dùng được"; phải chờ tới khi món nằm trong snapshot (`CommitFinalized`). Trước đó `queryAddressUTxO` không trả món này, dẫn tới lỗi danh sách rỗng ở trên.
- **Nút chưa đồng bộ với chuỗi:** từ hydra-node 1.3.0, khi góc nhìn chuỗi của nút chậm hơn một ngưỡng (`--unsynced-period`, mặc định bằng một nửa thời gian khiếu nại), nút từ chối mọi lệnh của client bằng `RejectedInputBecauseUnsynced`, kèm `drift` là số giây bị chậm. Bridge 2.x báo lỗi ngay thay vì chờ tới hết giờ. Kiểm tra trước bằng `bridge.syncedStatus === 'InSync'`, hoặc chờ `NodeSynced`.
- **Món đầu vào đã bị tiêu:** hai giao dịch cùng tiêu một món thì giao dịch đến sau trở thành không hợp lệ; nút báo `TxInvalid`, trong `validationError.reason` có tên lỗi sổ cái `BadInputsUTxO`. Cơ chế chờ theo TTL của nút (`WaitOnNotApplicableTx`) chỉ có ích khi giao dịch cần một món **sắp được sinh ra** bởi giao dịch khác chưa tới; khi hai giao dịch tranh nhau một món đã có, giao dịch đến sau không thể trở lại hợp lệ dù chờ bao lâu, nút chỉ báo `TxInvalid` muộn hơn một chút. Lời đọc không nói "chờ một lúc thì được".
- Bộ nhớ đệm món tiền của `HydraBridge` chỉ cập nhật khi có `SnapshotConfirmed` mới hơn. Vì vậy nếu dựng giao dịch thứ hai ngay sau khi gửi giao dịch thứ nhất mà chưa chờ xác nhận, `queryAddressUTxO` vẫn trả món cũ, và hai giao dịch tranh nhau một món. Cách tránh trong ví dụ: chờ `submitTxSync` trả về rồi mới dựng giao dịch tiếp; nếu cần gửi song song, chia món riêng cho từng giao dịch.
- **Thiếu chữ ký:** lý do chứa `MissingVKeyWitnessesUTXOW` (đã thấy trong kiểm thử của hydra-node). Nguyên nhân thường gặp trong code: gửi bản chưa ký (`tx.to_hex()` thay vì kết quả của `signTx`), ký bằng sai tài khoản (`accountIndex`, `keyIndex`), hoặc giao dịch yêu cầu nhiều người ký (`requiredSignerHash`) mà chỉ một người ký; người ký thứ hai cần `signTx(cbor, true)`.
- **Tiền vào và ra không cân / phí sai:** `ValueNotConservedUTxO`, `FeeTooSmallUTxO` là tên lỗi của sổ cái Conway. Ở chế độ Hydra, quên `changeAddress` thì `complete()` cũng báo `Fee not specified` (đã chạy thử); vậy gặp lỗi này thì kiểm tra danh sách món tiền và địa chỉ tiền thối trước, chưa phải phí. Nếu người dùng tự đặt phí bằng `setFee` mà vẫn thiếu tiền thối, `TxBuilder` dựng được một giao dịch không cân, và sổ cái sẽ từ chối với lỗi kiểu `ValueNotConservedUTxO` (theo quy tắc sổ cái; chưa gửi thử lên nút). Head thu phí mà giao dịch dựng với phí bằng không thì cũng bị từ chối. Cách tránh: luôn gọi `changeAddress`; lấy tham số từ `bridge.getProtocolParameters()` thay cho số gõ tay.
- **Giao dịch có script:** script Plutus cần món thế chấp (`NoCollateralInputs`, `InsufficientCollateral`); trong Head, món thế chấp phải là món nằm sẵn trong Head; `TxBuilder` chỉ nhận món thế chấp chứa toàn lovelace. Script trả "không" thì nút báo `TxInvalid` kèm lý do của script.
- **Lệnh không đọc được:** nút trả `InvalidInput { reason, input }` khi không phân tích được tin nhắn client gửi lên (ví dụ CBOR hỏng, hoặc `txId` không khớp với giao dịch). Tin này không mang mã giao dịch, và `submitTxSync` hiện không bắt nó, nên với `submitTxSync` người dùng chỉ thấy hết thời gian chờ. Muốn thấy lý do thì nghe `bridge.events.on('onMessage', …)` với nhãn `InvalidInput`.
- **Hết thời gian chờ không có nghĩa là giao dịch hỏng:** mặc định 30 giây là hẹn giờ phía client; giao dịch vẫn có thể được xác nhận sau đó (`TxValid` cũng không bảo đảm giao dịch vào snapshot, theo lược đồ API). Cách tránh: đặt `timeout` phù hợp; khi hết giờ, kiểm tra lại snapshot (`snapshot.confirmed` có `txId`, hoặc món tiền của địa chỉ đã đổi) trước khi gửi lại; hoặc dùng `submitL2Tx` để nút tự trả kết luận (`SubmitTxConfirmed`, `SubmitTxInvalid`, `SubmitTxRejected`, `SubmitTxSubmitted`).

Phân biệt theo phiên bản hydra-node (ghi rõ trên bảng bằng nhãn nhỏ "v1.3+", "v2"):

| Lỗi / tin nhắn | v1 | v2 | Ghi chú |
|---|---|---|---|
| `TxInvalid`, `TxValid`, `CommandFailed`, `InvalidInput` | có | có | `InvalidInput` không có `tag` trên đường truyền: SDK đã kiểm với 2.3.0, chưa kiểm với v1 |
| `RejectedInputBecauseUnsynced`, `NodeUnsynced`, `NodeSynced` | từ 1.3.0 | có | Bản v1 cũ hơn 1.3.0 không có |
| Trạng thái "đang góp tiền" trước khi mở Head | có (`HeadIsInitializing`) | không còn | v1: gửi giao dịch lúc Head đang góp tiền cũng bị `CommandFailed` |
| Tiền nạp chưa vào snapshot (`CommitRecorded` → `CommitFinalized`) | không | có | Nạp dần khi Head đã mở là đặc điểm của v2 |
| `POST /transaction` (`submitL2Tx`) | từ 1.0.0 (theo CHANGELOG hydra-node) | có | Hàm `submitL2Tx` chỉ có trong bridge 2.x, tức bridge nhắm hydra-node v2. Brief tập 6 ghi "cần hydra-node v2.3.0 trở lên", lệch với CHANGELOG; xem câu hỏi 4 |

Đơn giản hoá có chủ ý:

- Chuỗi `validationError.reason` thật dài và lồng nhiều lớp tên lỗi của sổ cái; trên bảng chỉ viết tên lỗi chính (`BadInputsUTxO`, `MissingVKeyWitnessesUTXOW`…) kèm dấu "…", có chữ nhỏ "lý do rút gọn". Không dựng lại nguyên văn một chuỗi lỗi vì chưa có bản ghi thật để chép.
- Tên lỗi `ValueNotConservedUTxO`, `FeeTooSmallUTxO`, `NoCollateralInputs`, `InsufficientCollateral` lấy từ cardano-ledger (nhánh master, đọc ngày 16/10/2026); `BadInputsUTxO` và `MissingVKeyWitnessesUTXOW` có thêm bằng chứng trong mã kiểm thử của hydra-node 2.3.0. Video nói "lý do có chứa tên lỗi như…", không khẳng định định dạng đầy đủ.
- "Nút chờ một lúc trước khi báo không hợp lệ": không nói con số TTL.
- Chỉ nói về `WebsocketConnector` (kết nối mặc định khi truyền `url`); `HexcoreConnector` có cách gửi riêng, không nhắc.
- `submitTxSync` nhận ra `CommandFailed` và `RejectedInputBecauseUnsynced` của đúng giao dịch nhờ so `clientInput.transaction.txId` (`echoesOurTx`). Lệnh `NewTx` SDK gửi lên không kèm `txId`, nhưng nút gửi lại lệnh sau khi đã đọc và mã hoá lại, và lược đồ API 2.3.0 ghi định dạng giao dịch của nút "When encoding, an additional 'txId' is included". Vì vậy video nói `submitTxSync` báo được hai lỗi này. **Chưa thử trên nút thật**; nếu thử thấy chỉ hết giờ thì phải sửa cảnh 04, 09 và 12 (xem mục "Xử lý review agy").
- Ở chế độ Hydra, `TxBuilder` không kiểm tra cân bằng vào/ra vì mục đích dựng bản nháp giao dịch (chú thích code "Cho phép build blueprint tx không có change address", `build_tx_unsafe`). Video không đi vào chi tiết này; chỉ nói "lỗi về phí có khi là do quên địa chỉ tiền thối". Không nói phần tiền dư "bị tính thành phí" vì chưa có nguồn.
- Nhãn `PostTxOnChainFailed` (nút không đưa được giao dịch vòng đời lên mạng chính) chỉ nhắc một dòng trên tấm bảng tóm tắt, không có cảnh riêng: lỗi này thuộc vòng đời Head (tập 3), không phải giao dịch trong Head.
- Ngưỡng đồng bộ: nói "mặc định bằng một nửa thời gian khiếu nại", không đọc con số giờ cụ thể vì mỗi Head đặt thời gian khiếu nại riêng (cùng cách tập 3).

Không dùng:

- Không nói tiền thế chấp bị thu khi script thất bại **trong Head**. Tập 5 nói điều đó cho mạng chính; với Head, chưa tìm được nguồn nói rõ, và docs-v2 (`5.smart-contracts-in-hydra.md:190`) chỉ viết chung chung "depend on how you build the transaction bundle and the Head’s security policy".
- Không nói `BabbageOutputTooSmallUTxO` (lượng ADA tối thiểu mỗi đầu ra): bridge ghi chú nút báo `utxoCostPerByte` bằng không trong Head, nên lỗi này phụ thuộc cấu hình từng Head; dễ gây hiểu nhầm.
- Không dùng `setInputUtxo` / `addInputUtxo` (còn TODO, như tập 6), không gọi `selectUtxosFrom` (private).
- Không đưa `setChangeAddress` lên bảng dù docs-v2 `5.hydra-integration.md:31` đang dùng: code ghi "Legacy method"; dùng `changeAddress` như tập 6.
- Không đưa `errorLogger: true` vào lời khuyên: chú thích kiểu ghi "Using for testing purpose only … not recommended for production use".
- Không hứa `submitTxSync` "luôn báo lý do": với `InvalidInput` nó chỉ hết giờ (theo code hiện tại).
- Không nhắc `partialFanout`, `FanningOut`, `HeadPartiallyFannedOut` (thử nghiệm, chưa có trong 2.3.0).
- Không có số liệu tốc độ, độ trễ hay tỉ lệ lỗi.
- Không nói về hydra-node 2.4.x: SDK đang nhắm 2.3.0, tập này chưa đối chiếu với 2.4.x.

## Dàn ý cảnh

Bản sau review agy: gộp cảnh 07–08 cũ, chuyển lỗi `InvalidInput` vào cảnh hết thời gian chờ, đưa các lỗi nghiệp vụ (món tiền, chữ ký, tiền thối, script) lên trước lỗi hệ thống (đồng bộ, hết giờ). Còn 13 cảnh.

| Cảnh | Tiêu đề | Ý chính (1–3 câu, nói điều gì) | Hình gợi ý | Nối với tập khác |
|---|---|---|---|---|
| 01 | Khi giao dịch không tới nơi | Ở tập sáu, An đã gửi hai ADA cho Bình trong Head. Hôm nay ta xem chuyện gì xảy ra khi giao dịch không đi suôn sẻ, và đọc lời nút Hydra trả về để biết sửa ở đâu. | Cảnh cuối tập 6 (An 16, Bình +2) hiện lại, rồi một phong bì giao dịch mới bị đóng dấu hồng phấn. Tấm bảng "sổ gỡ lỗi" trống ở góc phải. | Tập 6, cảnh 12–14 |
| 02 | Ba kết cục của một lần gửi | Mỗi lần gửi có ba kết cục: được xác nhận trong snapshot, bị từ chối kèm một tờ phiếu có nhãn và lý do, hoặc không nhận được phiếu nào trước khi hết giờ. Lỗi có thể nằm trên máy mình, trước khi gửi, hoặc ở nút Hydra. | Phong bì tách ba nhánh: phiếu xanh lá `SnapshotConfirmed`, phiếu hồng có nhãn ở góc, khung nét đứt xám. Hai vùng "trên máy bạn" và "trong Head" ngăn bằng một vạch phấn. Thẻ ba dòng mẫu. | Tập 3 (`onMessage`), tập 6 cảnh 11 |
| 03 | Lỗi ngay trên máy: không đủ món tiền | Ví trống khác ví thiếu tiền. Ví trống thì lỗi lại nói về phí, nên dễ đi nhầm hướng; ví thiếu tiền thì lỗi nói thẳng là không đủ. Cả hai lộ ra ở bước hoàn tất giao dịch (`complete()`), trước khi gửi gì lên mạng. | Ví rỗng `[]` bên trái với dòng lỗi `Fee not specified`, ví có một món nhỏ hơn số cần gửi bên phải với `UTxO Balance Insufficient`; khung code `complete()`. | Tập 1, tập 6 cảnh 14 lỗi ① |
| 04 | Phòng họp chưa mở cửa, hoặc đã khoá | Head chỉ nhận giao dịch khi đang mở; ngược lại nút trả phiếu "lệnh không thực hiện được" kèm trạng thái Head. Ở Hydra v2, tiền vừa nạp mà chưa vào snapshot thì chưa tiêu được. | Cánh cửa phấn trên vòng tròn Head; phiếu hồng `CommandFailed` với `state: Closed`; nhánh "v2" `CommitRecorded → CommitFinalized`. Bảng ghi hai dạng: `headInfo()` → `'Open'`, sự kiện → `HeadIsOpen`. | Tập 3 |
| 05 | Tờ tiền đã đưa đi rồi | An gửi giao dịch thứ hai khi giao dịch đầu chưa được xác nhận, cả hai cùng dùng món mười tám ADA; giao dịch sau bị từ chối. Danh sách món tiền trong cầu nối chỉ đổi khi có snapshot mới, nên hỏi lại ngay sau khi gửi vẫn nhận món cũ. Cách tránh: chờ lệnh gửi trả về rồi mới dựng giao dịch tiếp. | Hai phong bì cùng cầm ô vàng 18 ADA; phiếu hồng `TxInvalid … BadInputsUTxO …`. Dòng thời gian: gửi 1 → hỏi danh sách (vẫn 18) → snapshot mới (16). Code `await submitTxSync` rồi `queryAddressUTxO`. | Tập 1, tập 6 cảnh 06–07, 14 lỗi ③ |
| 06 | Thiếu bằng chứng có chìa | Giao dịch phải mang chữ ký của người giữ chìa cho mọi món nó tiêu. Ba nguyên nhân hay gặp: gửi nhầm bản chưa ký, ký bằng sai tài khoản, cần hai người ký mà mới có một. | Ổ khoá trên ô món tiền, chìa của An bỏ quên trên bàn; phiếu hồng `MissingVKeyWitnessesUTXOW`; code `tx.to_hex()` (gạch) và `signedCbor`, `signTx(cbor, true)`. | Tập 4, tập 5 |
| 07 | Sổ cộng không khớp | Tổng vào phải bằng tổng ra cộng phí. Quên địa chỉ tiền thối thì công cụ dựng giao dịch báo một lỗi về phí, dù phí không phải gốc rễ. Ép dựng bằng cách tự đặt phí thì được một giao dịch không cân, và nút sẽ từ chối. Head có thu phí mà đặt phí bằng không cũng bị từ chối. | Cán cân phấn: vào 18, ra 2, thiếu 16; dòng lỗi máy `Fee not specified`; phiếu hồng `ValueNotConservedUTxO`, `FeeTooSmallUTxO`; code `.changeAddress(myAddress)`, `params: await bridge.getProtocolParameters()`. | Tập 1, tập 6 cảnh 08 |
| 08 | Ổ khoá biết suy nghĩ nói "không" | Món khoá bằng script cần thêm một món thế chấp, trong Head món đó phải nằm sẵn trong Head và chỉ chứa ADA. Script trả lời "không" thì nút báo không hợp lệ kèm lý do của script. | Ổ khoá bánh răng tập 5 lắc đầu; ô thế chấp nhỏ trong vòng tròn Head; phiếu hồng `NoCollateralInputs`; code `.txInCollateral(…)`. | Tập 5 |
| 09 | Người giữ sổ đọc báo cũ | Nút Hydra chậm hơn mạng chính quá một ngưỡng thì tạm từ chối mọi lệnh và báo số giây bị chậm; có từ hydra-node 1.3.0. hydra-sdk báo lỗi ngay thay vì để ta chờ. | Nút Hydra cầm tờ báo cũ, đồng hồ chậm; phiếu hồng `RejectedInputBecauseUnsynced { drift }`; dòng `bridge.syncedStatus === 'InSync'`, nhãn "v1.3+". | Tập 2, tập 3 |
| 10 | Hết giờ chưa chắc là hỏng | Hết giờ chỉ là ứng dụng thôi chờ, mặc định ba mươi giây; giao dịch vẫn có thể được xác nhận sau. Một nguyên nhân khó thấy: nút không đọc nổi tin nhắn gửi lên, phiếu trả về không ghi mã giao dịch nên lệnh gửi chỉ thấy hết giờ. Cách khác là để nút tự trả kết luận qua `submitL2Tx`. | Đồng hồ cát, khung nét đứt xám `Timeout`, phiếu xanh lá đến muộn; phong bì chữ nguệch ngoạc với phiếu `InvalidInput { reason, input }` không có `txId`; dòng `submitL2Tx` với bốn nhãn kết quả. | Tập 6 cảnh 11–13 |
| 11 | Cho dev: kiểm tra trước khi gửi | Ba câu hỏi trước khi gửi: Head có đang mở không, nút đã đồng bộ chưa, ví có món tiền mới nhất chưa. | Code `headInfo()`, `bridge.syncedStatus`, `queryAddressUTxO(myAddress)`, mỗi dòng một dấu tích vẽ bằng nét. | Tập 6 cảnh 05–07 |
| 12 | Cho dev: đọc phiếu trả về | Bọc lệnh gửi trong khối bắt lỗi. Lỗi không có nhãn là chưa kết nối; còn lại rẽ nhánh theo nhãn. Thêm bộ nghe tin nhắn để bắt phiếu "đầu vào không hợp lệ". | Code `try/catch`, `if (!e.tag)` trước `switch (e.tag)`, và `bridge.events.on('onMessage', …)`; mũi tên từ mỗi nhánh tới thẻ trên bảng. | Tập 3 cảnh 13–14, tập 6 cảnh 13 |
| 13 | Tóm tắt và lời kết | Ba ý: đọc nhãn và lý do trước khi sửa; kiểm tra Head, đồng bộ và món tiền mới nhất trước khi gửi; hết giờ thì kiểm tra lại, đừng vội gửi lại. Hướng dẫn có tại hydrasdk.com. | Tấm bảng đầy thẻ trượt vào giữa, dòng nhỏ `PostTxOnChainFailed — xem tập 3`. Cuối: "hydrasdk.com" ở giữa, "Thực hiện cùng VTechcom Labs" ở góc, không đọc. | Cả chuỗi |

Thời lượng ước lượng lấy từ `kich-ban.md` (sinh bằng `script.py`).

## Thuật ngữ mới cần chốt cách đọc

Chưa ghi vào `promo/shared/tu-dien-doc.md` (phiên này không sửa file chung). Theo quy ước tập 3 và tập 6, tên nhãn và tên hàm chỉ viết trên bảng, không đọc; bảng dưới chỉ gồm từ lời đọc có thể chạm tới.

| Từ | (1) Đọc nguyên văn | (2) Phiên âm đề xuất | (3) Thay bằng từ Việt | Ghi chú |
|---|---|---|---|---|
| timeout | timeout | tai ao | hết thời gian chờ | Đề xuất (3) trong lời đọc; bảng ghi `Timeout` |
| tag | tag | tác | nhãn | Đề xuất (3): "nhãn của tin nhắn" |
| node (hydra-node) | node | nốt | nút Hydra | Đề xuất (3), đã dùng ở tập 6 |
| drift | drift | đờ ríp | số giây bị chậm | Đề xuất (3) |
| CBOR | CBOR | xi bo | chuỗi giao dịch đã mã hoá | Đề xuất (3); chỉ cần nếu lời đọc cảnh 10 nhắc tới |
| HTTP | HTTP | hát tê tê pê | — | Lời đọc cảnh 10 hiện không đọc từ này, chỉ nói "để chính nút Hydra trả kết luận"; bảng ghi `POST /transaction` |
| TTL | TTL | ti ti eo | — | Không đọc; lời đọc nói "chờ một lúc" |
| collateral | collateral | — | tiền thế chấp | Đã dùng ở tập 5, giữ (3) |
| debug | debug | đi bấc | gỡ lỗi | Tên tập dùng (3) |
| BadInputsUTxO, MissingVKeyWitnesses | — | — | — | Tên lỗi sổ cái; theo phương án mặc định của câu hỏi 2, lời đọc không đọc tên này, chỉ nói "món đầu vào không còn" và "thiếu chữ ký"; tên lỗi chỉ viết trên bảng |

## Câu hỏi cho chủ sản phẩm

1. **Định vị `submitL2Tx`.** Tài liệu bridge khuyên dùng `submitL2Tx` thay cho `submitTxSync`, nhưng tập 6 dạy `submitTxSync`. Tập này nên giới thiệu `submitL2Tx` như cách nên dùng (dễ gây cảm giác tập 6 dạy cách cũ), hay chỉ như một phương án ở cảnh 10? Mặc định đề xuất: chỉ nhắc ở cảnh 10, dán nhãn "bridge 2.x", giữ `submitTxSync` làm mạch chính cho khớp tập 6.
2. **Có đọc tên lỗi sổ cái thành lời không** (`BadInputsUTxO`, `MissingVKeyWitnesses`)? Các tên này là thứ lập trình viên sẽ tìm trong log, nhưng khó nghe. Mặc định đề xuất: không đọc, chỉ viết trên bảng, lời đọc nói "lý do ghi rõ món đầu vào không còn" / "lý do ghi thiếu chữ ký".
3. **Trang `/hydra-tx-trace` của playground** (dán JSON `TxInvalid` để tách lý do lỗi script) hợp chủ đề cảnh 08, nhưng là trang cũ chưa nâng cấp. Có giới thiệu không? Mặc định đề xuất: không giới thiệu ở tập này cho tới khi trang được nâng cấp.
4. **Sửa ghi chú phiên bản ở brief tập 6.** Brief tập 6 ghi `submitL2Tx` "cần hydra-node v2.3.0 trở lên", trong khi CHANGELOG hydra-node ghi `POST /transaction` có từ 1.0.0 và lược đồ 1.3.0 đã có đủ bốn kết quả; còn hàm `submitL2Tx` thì chỉ có trong bridge 2.x. Có cho sửa brief tập 6 (do phiên quản lý chuỗi làm) không? Mặc định đề xuất: sửa thành "chỉ có trong bridge 2.x".
5. **Có nên báo lỗi cho hydra-sdk** về việc `submitTxSync` không bắt `InvalidInput` (người dùng chỉ thấy hết giờ)? Đây là hành vi code hiện tại, tập này nói đúng như vậy; nếu SDK sửa trước khi phát hành video thì cảnh 10 và 12 phải đổi. Mặc định đề xuất: giữ nguyên lời đọc theo code hiện tại, ghi chú để rà lại khi bridge đổi phiên bản.

## Xử lý review agy

Review: `review-agy-brief.md`. Mỗi dòng đã được kiểm lại với code và lược đồ API hydra-node trước khi quyết.

| Mục | Quyết định (sửa / không sửa) | Lý do |
|---|---|---|
| `echoesOurTx` luôn sai vì `NewTx` không kèm `txId`, nên `submitTxSync` chỉ hết giờ với `CommandFailed` và `RejectedInputBecauseUnsynced` (cao) | Không sửa nội dung video; thêm ghi chú "chưa thử trên nút thật" vào "Đơn giản hoá có chủ ý" | Đúng là SDK gửi `NewTx` không có `txId` (`websocket.ts:375-384`). Nhưng nút không gửi lại nguyên văn: `CommandFailed` và `RejectedInputBecauseUnsynced` mang `clientInput` là giá trị đã được nút đọc rồi mã hoá lại (`HeadLogic.hs` 2.3.0, `CommandFailed clientInput st`), và lược đồ API 2.3.0 ghi định dạng giao dịch "When encoding, an additional 'txId' is included". Vì vậy so `txId` vẫn khớp. Hai bên chưa ai thử trên nút thật; nếu thử thấy chỉ hết giờ thì sửa cảnh 04, 09, 12. Đề xuất báo SDK thêm `txId` vào `NewTx` cho chắc vẫn hợp lý, nhưng đó là việc của chủ sản phẩm, không thuộc brief |
| Cảnh 14 cũ: lỗi chưa kết nối là `Error` thường, không có `tag` (vừa) | Sửa | Đúng theo `bridge.ts:598-601`. Đã thêm vào "Được nói"; code cảnh 12 mới có `if (!e.tag)` trước `switch (e.tag)` |
| Cảnh 07 cũ: câu "giao dịch chỉ đến sớm" dễ làm tưởng chờ thì được (vừa) | Sửa | Đúng: chờ theo TTL chỉ giúp khi giao dịch cần một món sắp sinh ra; tranh nhau một món đã có thì không thể trở lại hợp lệ. Đã viết lại trong "Được nói", lời đọc không nhắc cơ chế chờ |
| Gộp cảnh 07 và 08 cũ (vừa) | Sửa | Hai cảnh là hiện tượng và nguyên nhân của cùng một lỗi; gộp thành cảnh 05 mới |
| Đưa `InvalidInput` ra sau các lỗi nghiệp vụ (vừa) | Sửa | Đồng ý lỗi này ít gặp khi dùng SDK; đã gộp vào cảnh 10 (hết giờ) vì triệu chứng của nó qua `submitTxSync` chính là hết giờ. Cũng chuyển lỗi đồng bộ (cảnh 09) ra sau lỗi nghiệp vụ |
| Cảnh 03: lỗi chỉ xuất hiện khi gọi `complete()` (thấp) | Sửa | Đúng: `setInputs` chỉ lưu danh sách, lỗi ném trong `complete()`. Khi kiểm lại mục này, chạy thử thật cho thấy brief vòng 1a sai: danh sách rỗng không báo `UTxO inputs Insufficient` mà báo `Fee not specified`. Đã sửa "Nguồn tham khảo", "Được nói" và cảnh 03 |
| Cảnh 04 và 13 cũ: phân biệt `'Open'` và `HeadIsOpen` (thấp) | Sửa | Đúng: `headInfo()` đọc `GET /head`, sự kiện WebSocket dùng nhãn khác. Cảnh 04 ghi cả hai dạng trên bảng |
| Cảnh 10 cũ: giải thích vì sao chế độ Hydra cho thiếu địa chỉ tiền thối (thấp) | Sửa, theo hướng khác | Chạy thử cho thấy quên `changeAddress` ở chế độ Hydra không dựng ra giao dịch không cân như brief vòng 1a viết, mà báo `Fee not specified` ngay trên máy; chỉ khi tự `setFee` mới ra giao dịch không cân. Cảnh 07 mới nói đúng như vậy. Lý do "dựng bản nháp" chỉ ghi trong brief, không đọc. Không dùng ý "tiền dư bị tính nhầm thành phí" vì chưa có nguồn |
| Phiên bản hỗ trợ `POST /transaction` (thấp) | Không sửa | Brief đã ghi đúng như vậy (bảng phiên bản và câu hỏi 4). Theo yêu cầu, không sửa brief tập 6; câu hỏi 4 giữ để chủ sản phẩm quyết |

