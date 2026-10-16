# Tập 6 — Thực hành: giao dịch đầu tiên trong Hydra Head với hydra-sdk

## Brief

| Mục | Quyết định |
|---|---|
| Chuỗi | Kiến thức nền Cardano và Hydra, đồng thời giới thiệu hydra-sdk; đây là tập "chốt đơn", đưa người xem từ khái niệm tới dòng code chạy được |
| Thể loại | Hướng dẫn sử dụng (tutorial): mỗi bước một cảnh, nhịp chậm hơn các tập giải thích |
| Phong cách | Như các tập trước, phấn trắng trên nền đen, hình hiện dần như đang được vẽ. Ghép thêm khung code (chữ phấn trên bảng, font JetBrains Mono, tô màu nhẹ). Không dùng ảnh chụp màn hình thật: giao diện hydrasdk.com, playground.hydrasdk.com và kết quả terminal đều vẽ phấn lại theo mẫu trong repo, ghi nguồn mẫu ở mục "Hình phấn dựng lại". Mọi cảnh code có nhãn nhỏ ở góc "Code rút gọn, bản đầy đủ ở hydrasdk.com" (không đọc thành lời) |
| Lời đọc | Tiếng Việt, giọng Hải Đăng (VieNeu), không phụ đề chạy; chữ trên màn hình chỉ là chữ viết lên bảng và đoạn code |
| Khung hình | 16:9, 1920×1080 |
| Âm thanh | Giọng đọc + nền và hiệu ứng tự tổng hợp; với cảnh code dùng tiếng gõ phím nhẹ thay cho tiếng phấn |
| Khán giả | Lập trình viên đã xem các tập trước, hoặc đã biết JavaScript/TypeScript cơ bản. Người chưa biết code vẫn theo được mạch câu chuyện (sáu bước, ví dụ An gửi Bình) |
| Độ dài | Khoảng 6–8 phút (ước lượng ở cuối bảng kịch bản) |
| Cuối video | hydrasdk.com và playground.hydrasdk.com; dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc, không đọc thành lời |

**Mạch câu chuyện:** nối tiếp ví dụ An và Bình ở tập 1. An có một món tiền chưa tiêu mười tám ADA nằm trong một Hydra Head đang mở, An gửi hai ADA cho Bình. Sáu bước trên bảng, lặp lại ở đầu mỗi cảnh để người xem biết mình đang ở đâu. Thứ nhất, kết nối Head. Thứ hai, lấy danh sách món tiền. Thứ ba, dựng giao dịch (chọn món, tạo tiền thối). Thứ tư, ký. Thứ năm, gửi. Thứ sáu, xem snapshot cập nhật. Trước sáu bước có một cảnh chuẩn bị (cài gói, tạo ví).

**Quy ước code trên bảng:** code rút gọn từ ví dụ chạy thật trong repo, giữ đúng tên hàm, tên tham số và thứ tự gọi. Chỉ được bỏ phần log, kiểm tra lỗi, và đổi tên biến cho dễ đọc (`walletAddress` → `myAddress`, thêm `bobAddress`). Lời đọc không đọc tên hàm, chỉ mô tả việc hàm làm; tên hàm chỉ nằm trên bảng.

## Nguồn

Ví dụ gốc (chạy được, cùng một luồng):

- `apps/nodejs-playground/src/hydra/build-tx.ts:7-45` — kết nối, lấy snapshot, lấy UTxO theo địa chỉ, dựng, ký, gửi.
- `apps/docs-v2/content/en/3.concepts/4.transactions-in-hydra.md:40-129` — cùng ví dụ trong tài liệu, kèm kết quả in ra mẫu (dòng 155-200), có món `18000000` lovelace và `snapshot.number: 1`.
- `apps/nodejs-playground/src/hydra/common.ts:11-22` — tạo `AppWallet` từ chuỗi từ khoá ghi nhớ, lấy `baseAddressBech32`.

Nguồn cho từng đoạn code trên bảng:

| Cảnh | Đoạn code | Nguồn |
|---|---|---|
| 02 | `npm install @hydra-sdk/core @hydra-sdk/bridge @hydra-sdk/transaction @hydra-sdk/cardano-wasm` | `apps/docs-v2/content/en/1.getting-started/2.installation.md:81` |
| 04 | `const words = process.env.AN_MNEMONIC!.split(' ')` (chú thích nhắc `AppWallet.brew()`), `new AppWallet({ key: { type: 'mnemonic', words }, networkId: NETWORK_ID.PREPROD })`, `wallet.getAccount().baseAddressBech32` | `apps/nodejs-playground/src/hydra/common.ts:11-22`; kiểu `CreateAppWalletOptions` (fetcher, submitter là tuỳ chọn) ở `packages/core/src/types/wallet/index.ts:14-23`; `NETWORK_ID` ở `packages/core/src/constants/chain.ts:15-19`; `getAccount` ở `packages/core/src/wallet.ts:49`; `AppWallet.brew(strength = 256)` trả `string[]` 24 từ (`packages/core/src/wallet.ts:87-89`, `embedded.ts:72`) |
| 05 | `new HydraBridge({ url: 'ws://localhost:4001' })`, `await bridge.connect()` | `packages/hydra-bridge/src/bridge.ts:24-58` (`InitHydraBridgeOptions`), `:152-164` (constructor), `:322-339` (`connect` trả `Promise<boolean>`); URL theo `4.transactions-in-hydra.md:88-91` |
| 06 | `await bridge.querySnapshotUtxo()` trả `UTxOObject` của cả Head | `packages/hydra-bridge/src/bridge.ts:460-473`; định dạng in ra ở `4.transactions-in-hydra.md:63-75` |
| 07 | `await bridge.queryAddressUTxO(myAddress)` trả `UTxO[]` của riêng địa chỉ | `packages/hydra-bridge/src/bridge.ts:669-678` (lọc theo chỉ mục địa chỉ, đổi bằng `Converter.convertUTxOObjectToUTxO`) |
| 08 | `new TxBuilder({ isHydra: true, params: { minFeeA: 0, minFeeB: 0 } })` | `packages/hydra-transaction/src/tx-builder/index.ts:91-118`; `build-tx.ts:20-26`; giải thích phí ở `apps/docs-v2/content/en/2.guides/5.hydra-integration.md:12-23` và `2.build-wallet-app.md:674` |
| 09 | `const bobAddress = 'addr_test1…'` (chuỗi Bech32), `.setInputs(myUtxos).addOutput({ address, amount: [{ unit: 'lovelace', quantity: '2000000' }] }).changeAddress(myAddress).complete()` | `tx-builder/index.ts:516-528` (`setInputs`, chiến lược mặc định `LargestFirstMultiAsset`), `:800-802` (`addOutput`), `:749-759` (`changeAddress`), `:890-926` (`complete`); chọn món và tạo tiền thối thực sự xảy ra trong `complete()` qua `_addInputsToBuilder` → `selectUtxosFrom` (`:1388-1390`, `:347-448`, gọi `add_inputs_from_and_change`); địa chỉ là chuỗi Bech32, `txOut(address: string)` (`:284`) được đọc bằng `Address.from_bech32` khi dựng (`:1218-1219`) |
| 10 | `await wallet.signTx(tx.to_hex())`, `Resolver.resolveTxHash(signedCbor)` | `packages/core/src/wallet.ts:72-84`; `packages/core/src/utils/cardano-wasm/resolver.ts:8-13`; `Resolver` được export ở `packages/core/src/index.ts:20,59` |
| 11 | `await bridge.submitTxSync({ cborHex, type: 'Witnessed Tx ConwayEra', description, txId })` → `{ txId, isValid, isConfirmed, result }` | `packages/hydra-bridge/src/bridge.ts:596-603`; kiểu `Transaction` ở `types/transaction.type.ts`; kiểu `SubmitTxResult` ở `types/submitter.type.ts:7-12`; kết quả mẫu ở `4.transactions-in-hydra.md:177-200`; `TxValid` chỉ bật cờ rồi chờ tiếp `SnapshotConfirmed`, `TxInvalid` làm lệnh báo lỗi kèm lý do (`packages/hydra-bridge/src/connector/websocket.ts:386-415`) |
| 12 | `rs.result?.snapshot.number`, gọi lại `querySnapshotUtxo()` | `SubmitTxResult.result: SnapshotConfirmed` (`submitter.type.ts:7-12`); callback mẫu đọc `result!.result?.snapshot?.number` ở `4.transactions-in-hydra.md:139-150` |
| 13 | `bridge.events.on('onMessage', payload => { if (payload.tag === 'SnapshotConfirmed') { bridge.getAddressBalance(myAddress) … } })` | `apps/docs-v2/content/en/2.guides/5.hydra-integration.md:318-332`; `bridge.ts:190-200` (cập nhật bộ nhớ đệm khi có `SnapshotConfirmed`), `:313-316` (`getAddressBalance` trả `Map<string, bigint> \| null`), `:660-662` (`events`) |

Playground (mẫu để vẽ phấn lại, cảnh 15): trang `/transaction-builder` (`apps/playground/pages/transaction-builder.vue`) có ô "Hydra mode" (`components/workspace/OptionsPanel.vue:33-43`, chú thích "Allows unbalanced, fee-less transactions"), khung truy vấn UTxO qua Blockfrost hoặc nạp dữ liệu mẫu (`UtxoQuerySection.vue`), khung kết quả có mã giao dịch, CBOR, JSON và đoạn TypeScript sinh tự động kèm nút tải `build-tx.ts` (`ResultPanel.vue:22-23, 96, 128-179`), khung "Sign & submit" (`BottomDock.vue:30`).

## Ranh giới sự thật

Được nói (đã đối chiếu code):

- hydra-sdk có ba gói dùng trong tập này, `@hydra-sdk/core` (ví, kiểu UTxO, tiện ích), `@hydra-sdk/bridge` (kết nối Hydra Head), `@hydra-sdk/transaction` (`TxBuilder`); cài kèm `@hydra-sdk/cardano-wasm`.
- `HydraBridge` kết nối tới hydra-node qua WebSocket khi truyền `url`; `connect()` trả `true` khi đã kết nối.
- `querySnapshotUtxo()` trả toàn bộ món tiền chưa tiêu trong Head ở dạng `UTxOObject`, đúng định dạng đã giới thiệu ở tập 1.
- `queryAddressUTxO(address)` trả danh sách món tiền của một địa chỉ, ở dạng mảng `UTxO[]` (SDK tự đổi từ `UTxOObject`), dùng trực tiếp cho `setInputs`.
- `TxBuilder` với `isHydra: true` và `minFeeA: 0, minFeeB: 0` là cấu hình tài liệu khuyên dùng cho giao dịch trong Head.
- `setInputs` chỉ đưa danh sách món tiền ứng viên; khi gọi `complete()`, `TxBuilder` tự chọn món (chiến lược mặc định "lớn trước", `LargestFirstMultiAsset`) và tự thêm đầu ra tiền thối về địa chỉ đặt bằng `changeAddress`.
- `complete()` trả về giao dịch chưa ký; `wallet.signTx` nhận CBOR hex và trả CBOR đã ký; `Resolver.resolveTxHash` tính mã giao dịch.
- `submitTxSync` gửi giao dịch vào Head và chờ tới khi giao dịch nằm trong một snapshot được xác nhận, trả về `isValid`, `isConfirmed` và chính thông điệp `SnapshotConfirmed` (có số thứ tự snapshot và tập UTxO mới).
- Khi có `SnapshotConfirmed`, `HydraBridge` tự cập nhật bộ nhớ đệm; `getAddressBalance(address)` trả số dư tính sẵn theo từng loại tài sản, `null` khi chưa có snapshot nào.
- Playground tại playground.hydrasdk.com dựng thử giao dịch ngay trên trình duyệt, có chế độ Hydra, và sinh ra đoạn TypeScript tương ứng.

Điều kiện tiên quyết, phải nói rõ trong video (cảnh 02):

- Cần một Hydra Head **đang mở**, và địa chỉ của ví đã có món tiền **nằm trong Head**. Mở Head và đưa tiền vào là nội dung tập 3 (vòng đời Head); tập này không hướng dẫn lại.

Đơn giản hoá có chủ ý:

- Code trên bảng bỏ phần kiểm tra lỗi và log; ví dụ gốc có `if (!connected) throw …`.
- Phí bằng không là cấu hình tham số giao thức của Head; lời đọc nói "Head trong ví dụ này không thu phí", không khẳng định mọi Head đều miễn phí.
- Không nhắc `submitTx` (kiểu callback) và `submitL2Tx` (gửi qua HTTP, cần hydra-node v2.3.0 trở lên); chỉ dùng `submitTxSync` như ví dụ gốc.
- Không nhắc lượng ADA tối thiểu cho mỗi đầu ra (hai ADA trong ví dụ đủ an toàn).
- Chuỗi từ khoá ghi nhớ trên bảng đọc từ biến môi trường `AN_MNEMONIC` (tên minh hoạ), không hiện từ thật. Không dùng `const words = AppWallet.brew()` như review gợi ý: `brew()` sinh bộ từ mới, tức một ví mới chưa có tiền trong Head, trái với điều kiện của ví dụ; nên `brew()` chỉ được nhắc trong chú thích, là cách tạo bộ từ một lần cho ví mới.
- `bobAddress` khai báo bằng chuỗi Bech32 rút gọn `addr_test1…`, không phải địa chỉ thật.
- Thứ tự đầu ra `#0` cho Bình, `#1` cho tiền thối là theo ví dụ này (đầu ra tự thêm trước, tiền thối thêm sau); trên hình có chữ nhỏ "thứ tự đầu ra theo ví dụ minh hoạ".

Số liệu minh hoạ, cần ghi rõ với người duyệt:

- Món 18 ADA lấy từ kết quả mẫu trong tài liệu (`18000000` lovelace). An gửi Bình 2 ADA, tiền thối 16 ADA là số tính tay, phí bằng không theo cấu hình ví dụ. Mã giao dịch và địa chỉ trên bảng là chuỗi rút gọn dựng lại (`fa1e…369f#0`, `addr_test1…`), không phải dữ liệu của người thật.
- "Snapshot số một" theo kết quả mẫu trong tài liệu; Head thật sẽ có số khác.

Không nói ở tập này:

- Không có số liệu tốc độ hay thông lượng của Hydra (để tập 2, cần nguồn đo được).
- Không nói playground gửi được giao dịch vào Head: code playground cho thấy truy vấn UTxO qua Blockfrost (mạng chính) hoặc dữ liệu mẫu, chưa thấy kết nối `HydraBridge` trên trang dựng giao dịch (`HydraBridgeContainer.vue` không được trang nào dùng). Playground chỉ được giới thiệu là nơi dựng thử, xem giao dịch và lấy code mẫu.
- Không dùng `setInputUtxo`/`addInputUtxo` dù tên hàm hợp chủ đề: hai hàm này đang ghi chú "TODO: Implement in the next version (v2.x)" (`tx-builder/index.ts:166-180`), giá trị đưa vào không được dùng khi dựng giao dịch.
- Không gọi thẳng `selectUtxosFrom`: hàm này là `private` (`tx-builder/index.ts:347`).
- Không nhắc địa chỉ node công khai `wss://node-10021.hydranode.io.vn` có trong `build-tx.ts:8`; dùng `ws://localhost:4001` như tài liệu.

## Đối chiếu với tập 1

Brief tập 1 từng ghi `TxBuilder` nhận `UTxOObject` và chọn món qua `selectUtxosFrom`. Theo code hiện tại, `setInputUtxo` (nhận `UTxOObject`) chưa hoạt động và `selectUtxosFrom` là hàm nội bộ. Chủ sản phẩm đã cho sửa cảnh 15 tập 1 thành "danh sách món tiền". Tập 6 nói khớp code, lấy danh sách bằng `queryAddressUTxO` rồi đưa vào `setInputs`.

## Hình phấn dựng lại

Không dùng ảnh chụp màn hình thật (đã chốt). Mọi giao diện và kết quả terminal được vẽ phấn lại trong khung trình duyệt hoặc khung terminal vẽ phấn, theo đúng nội dung của mẫu dưới đây, kèm dòng nhỏ "Hình dựng lại theo [nguồn]" ở góc. Không đưa khoá API, chuỗi từ khoá ghi nhớ hay địa chỉ ví thật vào hình.

| Mã | Cảnh | Hình phấn | Mẫu để vẽ lại |
|---|---|---|---|
| HP-01 | 02 | Trang Installation của hydrasdk.com, khối lệnh cài bốn gói | `apps/docs-v2/content/en/1.getting-started/2.installation.md:76-82` |
| HP-02 | 12 | Khung terminal in `>>> Submit tx result:` với `txId`, `isValid: true`, `isConfirmed: true`, `tag: 'SnapshotConfirmed'`, `snapshot.number: 1` | `apps/docs-v2/content/en/3.concepts/4.transactions-in-hydra.md:177-200` (mã giao dịch rút gọn `dee1…5435`) |
| HP-03 | 15 | Trang `/transaction-builder` của playground, khung Options với ô "Hydra mode" đã tích và dòng chú thích "Allows unbalanced, fee-less transactions…" | `apps/playground/components/workspace/OptionsPanel.vue:33-43` |
| HP-04 | 15 | Khung chọn UTxO, nút nạp dữ liệu mẫu và vài dòng UTxO | `apps/playground/components/workspace/UtxoQuerySection.vue` (dòng 41 và 96), `UtxoRow.vue` |
| HP-05 | 15 | Khung Result với mã giao dịch, thông báo "Hydra mode: the transaction may be unbalanced and fee-less…", và đoạn TypeScript sinh tự động có nút tải `build-tx.ts` | `apps/playground/components/workspace/ResultPanel.vue:96, 110-112, 159-179` |
| HP-06 | 16 | Trang "Transactions in Hydra" của hydrasdk.com, phần "Build transaction" | `apps/docs-v2/content/en/3.concepts/4.transactions-in-hydra.md:78-129` |

## Cách đọc thuật ngữ

Đã chốt, dùng luôn: Hydra, Hydra Head, hydra-sdk, hydrasdk.com, UTxO, UTxO Object, TxBuilder, Cardano, token, snapshot ("xờ náp sót"), HydraBridge (đọc "cầu nối Hydra"; lời đọc tập này viết thẳng "cầu nối Hydra").

Đang `đề xuất` theo phương án (2), cần nghe thử ở Vòng 2: Head ("hét"), playground ("pờ lây gờ rao"), TypeScript ("tai scờ ríp"), code ("cốt"), ADA, JSON. JavaScript có trong từ điển nhưng tập này không đọc.

`playground.hydrasdk.com` đã có dòng riêng trong từ điển ("pờ lây gờ rao chấm hai dra ét đi cây chấm com", `đề xuất`). Ở Vòng 2 cần nghe kỹ câu 16-4 để chắc giọng đọc liền mạch, không ngắt vụn ở hai chữ "chấm".

Không đọc tên hàm (`submitTxSync`, `queryAddressUTxO`, `changeAddress`…) thành lời; tên hàm chỉ nằm trên bảng.

## Quyết định đã chốt

1. Tập 1 cảnh 15 đã sửa thành "danh sách món tiền"; tập 6 giữ cách nói khớp code.
2. Không có ảnh chụp thật; mọi giao diện vẽ phấn lại theo mẫu trong repo (mục "Hình phấn dựng lại").
3. Môi trường thử chỉ nhắc lại Head đã mở ở tập 3, không giới thiệu node công khai.
4. Mọi cảnh code có nhãn "Code rút gọn, bản đầy đủ ở hydrasdk.com", không đọc thành lời.

## Áp dụng review của agy

Chủ sản phẩm duyệt áp dụng toàn bộ đề xuất trong `review-agy.md`. Đã làm như sau:

- 04-code: thêm dòng khai báo `words` kèm chú thích nhắc `AppWallet.brew()` (xem "Đơn giản hoá có chủ ý" về lý do không gọi thẳng `brew()`).
- 09-code: thêm dòng khai báo `bobAddress` và chú thích "địa chỉ nhận của Bình" ở dòng `address`.
- 10-3: thêm chữ nhỏ "thứ tự đầu ra theo ví dụ minh hoạ" ở góc hình cảnh 10.
- 15-0 (thực ra là câu 16-4, câu duy nhất đọc `playground.hydrasdk.com`): đưa vào danh sách nghe kỹ ở Vòng 2.
- Thống nhất cả chuỗi: dùng chữ "snapshot", bỏ cách so sánh "chốt sổ" ở cảnh 06; xưng "ta", câu 07-0 bỏ chữ "mình".

