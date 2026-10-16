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

## Kịch bản

Không có phụ đề chạy; cột "Chữ trên bảng" là chữ được viết lên bảng trong cảnh, đoạn code của từng cảnh nằm ở mục "Code trên bảng" bên dưới. Số âm tiết đếm sau khi phiên âm theo từ điển đọc.

| Cảnh | Chữ trên bảng | Lời đọc | Số âm tiết | Trên màn hình | Âm thanh |
|---|---|---|---|---|---|
| **01. Mở đầu**<br>~24 giây | `Từ khái niệm tới code`<br>`An → Bình: 2 ADA`<br>`trong Hydra Head` | 01-0: Năm tập vừa rồi, ta đã nói về món tiền chưa tiêu, về Hydra, về ví và cả hợp đồng thông minh.<br>01-1: Hôm nay ta làm một việc khác hẳn. Ta sẽ viết code để gửi tiền bên trong một Hydra Head.<br>01-2: Chỉ cần khoảng ba mươi dòng TypeScript, đi qua sáu bước, từ lúc kết nối đến lúc tiền về ví người nhận.<br>01-3: Câu chuyện vẫn là An và Bình. Lần này, An gửi hai ADA cho Bình ngay bên trong Head. | 23<br>21<br>24<br>20 | Các hình phấn quen thuộc của tập 1–5 (ô món tiền, vòng tròn Head, ổ khoá, chiếc ví) lướt qua rồi gom lại một góc. Nửa bảng còn lại hiện một khung soạn code trống, con trỏ nhấp nháy. Dòng "An → Bình: 2 ADA" viết phấn bên dưới. | Nền vào dần. Tiếng phấn; vài tiếng gõ phím khi khung code hiện ra. |
| **02. Chuẩn bị**<br>~29 giây | `Cần có`<br>`① Head đang mở, ví đã có tiền trong Head (tập 3)`<br>`② Bốn gói hydra-sdk`<br>*(có code; nhãn góc "Code rút gọn, bản đầy đủ ở hydrasdk.com")* | 02-0: Trước khi bắt đầu, bạn cần chuẩn bị sẵn đúng hai thứ trong tay.<br>02-1: Thứ nhất, một Hydra Head đang mở, và ví của bạn đã có món tiền nằm sẵn bên trong Head đó.<br>02-2: Cách mở Head và đưa tiền vào đã có trong tập ba, tập nói về vòng đời của một Head.<br>02-3: Thứ hai, cài bốn gói của hydra-sdk vào dự án, chỉ bằng một dòng lệnh.<br>02-4: Gói lõi lo phần ví, gói cầu nối lo việc nói chuyện với Head, còn gói giao dịch chứa TxBuilder. | 14<br>22<br>20<br>19<br>23 | Hai ô điều kiện vẽ phấn, ô ① có hình vòng tròn Head nhỏ với một món tiền bên trong và mũi tên chỉ "tập 3". Ô ② hiện dòng lệnh cài đặt. Hình phấn HP-01 trượt vào bên phải trong vài giây: khung trình duyệt vẽ phấn, trang Installation của hydrasdk.com với khối lệnh cài, góc ghi nhỏ "Hình dựng lại theo hydrasdk.com". Ba nhãn nhỏ "core · bridge · transaction" nối vào ba biểu tượng ví, cầu, khối TxBuilder. | Gõ phím theo dòng lệnh; một "tick" cho mỗi ô điều kiện. |
| **03. Sáu bước**<br>~21 giây | `1. Kết nối`<br>`2. Lấy món tiền`<br>`3. Dựng giao dịch`<br>`4. Ký`<br>`5. Gửi`<br>`6. Xem snapshot` | 03-0: Toàn bộ bài hôm nay gói gọn trong sáu bước, bạn có thể ghi lại để làm theo.<br>03-1: Thứ nhất, kết nối vào Head. Thứ hai, lấy danh sách các món tiền chưa tiêu.<br>03-2: Thứ ba, dựng giao dịch, tức là chọn món và tạo tiền thối. Thứ tư, ký giao dịch.<br>03-3: Thứ năm, gửi giao dịch vào Head. Thứ sáu, xem snapshot mới để chắc chắn tiền đã tới nơi. | 18<br>16<br>18<br>21 | Sáu ô xếp thành một đường đi từ trái sang phải, mỗi ô hiện theo lời đọc. Cuối cảnh, cả dãy thu nhỏ lên góc trên, thành thanh tiến trình dùng cho các cảnh sau. | Sáu tiếng "tick" theo sáu ô; nốt chuông nhẹ khi dãy thu lên góc. |
| **04. Ví của An**<br>~26 giây | `Ví = chùm chìa khoá`<br>`Địa chỉ = ổ khoá`<br>`Không đưa từ khoá ghi nhớ vào code thật`<br>*(có code; nhãn góc "Code rút gọn, bản đầy đủ ở hydrasdk.com")* | 04-0: Nhưng trước hết, An cần một chiếc ví. Hãy nhớ rằng ví không chứa tiền, ví chỉ giữ chìa khoá.<br>04-1: Ở đây, ta tạo ví từ chuỗi từ khoá ghi nhớ của An, và chọn mạng thử nghiệm của Cardano.<br>04-2: Từ chiếc ví đó, ta lấy ra địa chỉ của An. Địa chỉ này chính là ổ khoá trên các món tiền của An.<br>04-3: Chuỗi từ khoá ghi nhớ là chìa khoá gốc. Đừng bao giờ để nó trong code thật, hay đăng nó lên mạng. | 20<br>22<br>24<br>22 | Chiếc ví phấn của tập 1 mở ra, bên trong là chùm chìa. Khung code hiện từng dòng theo lời đọc; dòng khai báo `words` (đọc từ biến môi trường, không viết từ thật vào code) được khoanh và gắn biểu tượng ổ khoá đỏ phấn kèm chữ "bí mật". Dòng `myAddress` nối bằng mũi tên tới một ổ khoá nhỏ. | Gõ phím theo từng dòng code; tiếng "cạch" nhỏ khi ổ khoá hiện ra. |
| **05. Bước 1 — Kết nối Head**<br>~23 giây | `1. Kết nối`<br>`Nút Hydra`<br>`Cầu nối`<br>*(có code; nhãn góc "Code rút gọn, bản đầy đủ ở hydrasdk.com")* | 05-0: Bước một, kết nối vào Head. Mỗi Head có các máy chạy phần mềm Hydra, gọi là nút Hydra.<br>05-1: Ta tạo một cầu nối Hydra, đưa vào địa chỉ của nút, rồi gọi lệnh kết nối.<br>05-2: Cầu nối giữ một đường truyền luôn mở, nên mọi tin mới từ Head đều đến ngay với ứng dụng.<br>05-3: Khi lệnh kết nối trả về đúng, ứng dụng của An đã có mặt trong Head. | 21<br>18<br>20<br>16 | Vòng tròn Head có vài nút nhỏ trên viền. Một cây cầu phấn bắc từ chiếc laptop của An tới một nút. Khung code bên phải; dòng `connect()` gạch chân, cây cầu sáng lên khi dòng này viết xong. | Gõ phím; một nốt chuông khi cầu sáng. |
| **06. Bước 2 — Snapshot của Head**<br>~28 giây | `2. Lấy món tiền`<br>`Snapshot = danh sách món tiền cả Head cùng ký`<br>*(có code; nhãn góc "Code rút gọn, bản đầy đủ ở hydrasdk.com")* | 06-0: Bước hai, xem bên trong Head lúc này đang có những món tiền nào.<br>06-1: Cầu nối có một lệnh để lấy toàn bộ món tiền chưa tiêu trong snapshot mới nhất.<br>06-2: Snapshot là danh sách món tiền tại một thời điểm, được mọi thành viên trong Head cùng ký xác nhận.<br>06-3: Kết quả trả về chính là UTxO Object mà ta đã gặp ở tập một.<br>06-4: Trong ví dụ này, An có một món mười tám ADA, khoá bằng địa chỉ của An. | 14<br>19<br>22<br>19<br>18 | Danh sách món tiền vẽ phấn (nhãn "snapshot") trong vòng tròn Head được đóng dấu bởi vài chữ ký nhỏ (các thành viên). Khung code hiện dòng lệnh, rồi phần kết quả JSON hiện ra như ở cảnh 13 tập 1: khoá `fa1e…369f#0` khoanh tròn, `address` có ổ khoá nhỏ, `18000000` gạch chân kèm chú thích phấn "= 18 ADA". Góc dưới: "số liệu từ ví dụ trong tài liệu". | Tiếng đóng dấu nhẹ; gõ phím; nốt chuông khi khoá JSON được khoanh. |
| **07. Bước 2 — Món tiền của riêng An**<br>~24 giây | `2. Lấy món tiền`<br>`Cả Head → chỉ của An`<br>*(có code; nhãn góc "Code rút gọn, bản đầy đủ ở hydrasdk.com")* | 07-0: Nhưng An không cần cả danh sách của Head, An chỉ cần những món mà An mở khoá được.<br>07-1: Lệnh tiếp theo lọc theo địa chỉ, và chỉ trả về các món tiền của An.<br>07-2: Kết quả là một danh sách đúng định dạng mà TxBuilder cần, nên không phải chuyển đổi gì thêm.<br>07-3: Cầu nối tự giữ snapshot trong bộ nhớ, nên những lần hỏi sau gần như trả lời ngay. | 19<br>16<br>22<br>20 | Nhiều ô món tiền trong Head, mỗi ô một ổ khoá. Chùm chìa của An quét qua; chỉ ô có ổ khớp được nhấc ra và xếp thành một hàng. Khung code hiện hai dòng. Mũi tên từ hàng ô tới khối nhỏ "TxBuilder" (để dành cho cảnh sau). | "Tick" mỗi lần nhấc một ô. |
| **08. Bước 3 — Gọi TxBuilder**<br>~23 giây | `3. Dựng giao dịch`<br>`Chế độ Hydra`<br>`Phí = 0`<br>*(có code; nhãn góc "Code rút gọn, bản đầy đủ ở hydrasdk.com")* | 08-0: Bước ba, dựng giao dịch. Đây là lúc TxBuilder bắt tay vào việc.<br>08-1: Khi tạo TxBuilder, ta bật chế độ Hydra, và đặt cả hai tham số tính phí về không.<br>08-2: Head trong ví dụ này không thu phí, nên giao dịch cũng không cần trả đồng phí nào.<br>08-3: Tài liệu hydra-sdk khuyên làm đúng như vậy cho mọi giao dịch chạy bên trong Head. | 16<br>22<br>18<br>20 | Khối TxBuilder phấn mở nắp, có một công tắc ghi "Hydra" bật lên và hai núm vặn phí quay về 0. Khung code hiện từng dòng; `isHydra: true` và hai số 0 được khoanh. | Tiếng "tách" của công tắc; hai tiếng "tick" nhỏ khi núm quay về 0. |
| **09. Bước 3 — Chọn món và tạo tiền thối**<br>~33 giây | `3. Dựng giao dịch`<br>`18 ADA → 2 ADA cho Bình + 16 ADA tiền thối`<br>`Phí: 0`<br>*(có code; nhãn góc "Code rút gọn, bản đầy đủ ở hydrasdk.com")* | 09-0: Tiếp theo, ta đưa danh sách món tiền của An vào, làm nguồn để chọn.<br>09-1: Ta thêm một đầu ra hai ADA, khoá bằng địa chỉ của Bình.<br>09-2: Trong code, số tiền ghi bằng lovelace, nên hai ADA được viết thành hai triệu.<br>09-3: Rồi ta chỉ định địa chỉ nhận tiền thối, ở đây là chính địa chỉ của An.<br>09-4: Khi gọi lệnh hoàn tất, TxBuilder tự chọn món, ưu tiên món lớn trước, rồi tạo luôn món tiền thối.<br>09-5: Món mười tám ADA bị tiêu trọn, sinh ra hai món mới, hai ADA cho Bình và mười sáu ADA quay về An. | 15<br>14<br>17<br>17<br>23<br>26 | Nối tiếp cảnh 15 tập 1: hàng ô món tiền của An đi vào khối TxBuilder. Khung code hiện theo từng dòng lời đọc, mỗi dòng có chú thích phấn bên phải. Khi dòng `.complete()` viết xong, ô 18 ADA bị gạch chéo, tách thành ô 2 ADA (ổ khoá của Bình) và ô 16 ADA (ổ khoá của An, nhãn "tiền thối"). Góc dưới: "số liệu minh hoạ". | Gõ phím theo dòng; tiếng gạch khi ô 18 ADA bị tiêu; hai tiếng "tick" khi hai ô mới sinh ra. |
| **10. Bước 4 — Ký**<br>~23 giây | `4. Ký`<br>`Chìa khoá ở lại trong ví`<br>`Mã giao dịch`<br>*(có code; nhãn góc "Code rút gọn, bản đầy đủ ở hydrasdk.com")* | 10-0: Bước bốn, ký giao dịch. Giao dịch vừa dựng giống một tờ séc chưa có chữ ký.<br>10-1: Ví của An dùng chìa khoá để ký, rồi trả về giao dịch đã có chữ ký.<br>10-2: Chìa khoá không bao giờ rời khỏi ví, chỉ có chữ ký được gửi đi cùng giao dịch.<br>10-3: Từ giao dịch đã ký, ta tính ra mã giao dịch, cũng là phần đầu trong tên riêng của hai món tiền mới. | 17<br>17<br>18<br>23 | Tờ séc phấn ghi "18 → 2 + 16". Chùm chìa trong ví chạm vào tờ séc, để lại một con dấu chữ ký; chìa vẫn nằm trong ví. Khung code hai dòng. Dòng `txId` nối mũi tên tới hai ô món tiền mới, ghép thành nhãn "txId#0", "txId#1" như cảnh 12 tập 1. Chữ nhỏ ở góc: "thứ tự đầu ra theo ví dụ minh hoạ". | Tiếng đóng dấu; "tick" khi nhãn ghép xong. |
| **11. Bước 5 — Gửi vào Head**<br>~29 giây | `5. Gửi`<br>`Hợp lệ?`<br>`Đã chốt trong snapshot?`<br>*(có code; nhãn góc "Code rút gọn, bản đầy đủ ở hydrasdk.com")* | 11-0: Bước năm, đưa giao dịch vào Head để các thành viên cùng xác nhận.<br>11-1: Ta gói giao dịch đã ký cùng mã giao dịch và một dòng mô tả ngắn, rồi gửi đi qua cầu nối.<br>11-2: Lệnh gửi này đợi cho tới khi các thành viên trong Head xác nhận giao dịch trong một snapshot mới.<br>11-3: Nếu giao dịch sai, chẳng hạn món tiền đã bị tiêu từ trước, Head sẽ báo không hợp lệ kèm lý do.<br>11-4: Giao dịch được chốt ngay trong Head, không phải chờ khối mới trên mạng chính Cardano. | 14<br>22<br>22<br>22<br>18 | Phong bì giao dịch đi qua cây cầu vào vòng tròn Head. Bên trong, vài thành viên lần lượt đánh dấu tích. Khung code hiện lệnh gửi. Bên cạnh, một nhánh phụ vẽ mờ: phong bì có ô đã gạch bị đóng dấu "Không hợp lệ" (gợi lại cảnh 09 tập 1). Dưới đáy, đường ray "mạng chính" với các khối nối nhau vẽ mờ, phong bì không đi xuống đó. | Tiếng "vút" nhẹ khi phong bì qua cầu; các tiếng "tick" của thành viên; một tiếng trầm ngắn ở nhánh không hợp lệ. |
| **12. Bước 6 — Snapshot mới**<br>~30 giây | `6. Xem snapshot`<br>`Trước: fa1e…#0 · 18 ADA`<br>`Sau: txId#0 · 2 ADA → Bình`<br>`Sau: txId#1 · 16 ADA → An`<br>*(có code; nhãn góc "Code rút gọn, bản đầy đủ ở hydrasdk.com")* | 12-0: Bước sáu, xem kết quả. Lệnh gửi trả về hai cờ, hợp lệ và đã xác nhận, kèm theo snapshot mới.<br>12-1: Trong ví dụ của tài liệu, đó là snapshot số một, được chốt ngay sau giao dịch của An.<br>12-2: Gọi lại lệnh lấy snapshot, ta thấy món mười tám ADA đã biến mất khỏi danh sách.<br>12-3: Thay vào đó là hai món mới cùng mang mã giao dịch vừa rồi, đánh số không và số một.<br>12-4: Đúng như tập một, món cũ bị tiêu trọn, món mới sinh ra, kể cả món tiền thối. | 23<br>21<br>20<br>20<br>18 | Hai cột "Trước" và "Sau" như cảnh 14 tập 1, lần này bằng dữ liệu của Head. Cột trước một mục 18 ADA bị gạch; cột sau hai mục mới. Bên trái, hình phấn HP-02: khung terminal vẽ phấn in kết quả gửi (`isValid: true`, `isConfirmed: true`, `SnapshotConfirmed`, `number: 1`), vẽ lại theo kết quả mẫu trong tài liệu, góc ghi nhỏ "Hình dựng lại theo tài liệu hydrasdk.com". | Tiếng gạch; hai tiếng "tick"; nốt chuông khi chữ "snapshot số 1" hiện ra. |
| **13. Lắng nghe Head**<br>~23 giây | `Mỗi snapshot mới → số dư mới`<br>*(có code; nhãn góc "Code rút gọn, bản đầy đủ ở hydrasdk.com")* | 13-0: Trong ứng dụng thật, bạn không phải hỏi lại từng lần, mà chỉ cần lắng nghe Head.<br>13-1: Mỗi khi có một snapshot mới được xác nhận, cầu nối báo một sự kiện và tự cập nhật số dư.<br>13-2: Lúc đó, ta chỉ cần hỏi số dư theo địa chỉ, và nhận lại ngay con số đã được cộng sẵn.<br>13-3: Ví của Bình cũng làm đúng như vậy để biết hai ADA vừa đến. | 17<br>23<br>21<br>15 | Vòng tròn Head phát ra một gợn sóng mỗi lần có snapshot; gợn sóng chạm tới ví của An và ví của Bình, hai con số số dư đổi (An 16, Bình +2). Khung code hiện bên phải. Gợi lại cảnh 10 tập 1: số dư là một phép cộng. | Một nốt chuông nhẹ mỗi gợn sóng. |
| **14. Ba lỗi hay gặp**<br>~23 giây | `① Danh sách rỗng`<br>`② Cấu hình mạng chính`<br>`③ Tiêu lại món đã tiêu` | 14-0: Trước khi tự làm, hãy để ý ba lỗi mà người mới hay gặp.<br>14-1: Thứ nhất, Head chưa mở, hoặc ví chưa có món tiền nào bên trong Head, nên danh sách trả về rỗng.<br>14-2: Thứ hai, dùng cấu hình của mạng chính cho TxBuilder, quên bật chế độ Hydra và đặt phí về không.<br>14-3: Thứ ba, dùng lại một món tiền đã tiêu ở snapshot trước. Head sẽ từ chối, vì mỗi món chỉ tiêu được một lần. | 14<br>21<br>24<br>26 | Ba ô cảnh báo vẽ phấn, mỗi ô một hình nhỏ. Ô ①: vòng tròn Head trống, ngoặc vuông rỗng `[]`. Ô ②: công tắc "Hydra" đang tắt, khoanh đỏ phấn. Ô ③: ô món tiền đã gạch bị đóng dấu "Từ chối". | Một tiếng trầm ngắn cho mỗi ô. |
| **15. Thử ngay trên playground**<br>~23 giây | `playground.hydrasdk.com`<br>`Hydra mode`<br>`Code TypeScript sinh sẵn` | 15-0: Muốn thử trước khi viết dòng code nào, bạn có thể mở playground của hydra-sdk.<br>15-1: Ở đó có trang dựng giao dịch, và chế độ Hydra được bật bằng một ô đánh dấu.<br>15-2: Bạn nạp dữ liệu mẫu, chọn món tiền, thêm đầu ra, rồi dựng giao dịch ngay trên trình duyệt.<br>15-3: Playground còn tự viết ra đoạn TypeScript tương ứng, bạn tải về rồi đưa thẳng vào dự án. | 22<br>19<br>19<br>23 | Khung trình duyệt vẽ phấn, bên trong lần lượt là các hình phấn dựng lại theo giao diện playground: HP-03 (ô "Hydra mode" đã tích), HP-04 (nút nạp dữ liệu mẫu và vài dòng UTxO), HP-05 (mã giao dịch, thông báo chế độ Hydra và đoạn TypeScript sinh tự động có nút tải). Mỗi hình có vòng khoanh và con trỏ phấn chỉ đúng chỗ đang nói; góc ghi nhỏ "Hình dựng lại theo playground.hydrasdk.com". Không nói playground gửi được vào Head. | Tiếng click chuột nhẹ cho mỗi ảnh. |
| **16. Tóm tắt và lời kết**<br>~29 giây | `1. Kết nối`<br>`2. Lấy món tiền`<br>`3. Dựng giao dịch`<br>`4. Ký`<br>`5. Gửi`<br>`6. Xem snapshot`<br>`hydrasdk.com`<br>`playground.hydrasdk.com`<br>`Thực hiện cùng VTechcom Labs` | 16-0: Tóm lại, giao dịch đầu tiên trong Head chỉ gồm sáu bước, và bạn vừa đi hết cả sáu.<br>16-1: Kết nối, lấy món tiền, dựng giao dịch, ký, gửi đi, rồi xem snapshot mới.<br>16-2: Mọi khái niệm của chuỗi video, từ món tiền chưa tiêu tới chìa khoá và tiền thối, đều nằm trong mấy chục dòng code đó.<br>16-3: Code đầy đủ và hướng dẫn chi tiết từng bước có tại hydrasdk.com.<br>16-4: Còn muốn bấm thử ngay, hãy ghé playground.hydrasdk.com. Chúc bạn có giao dịch đầu tiên thành công. | 19<br>17<br>25<br>19<br>28 | Thanh sáu bước ở góc trên trượt xuống giữa bảng, sáu ô sáng lần lượt. Hình phấn HP-06 (trang "Transactions in Hydra" trên hydrasdk.com, phần "Build transaction", dựng lại) hiện thoáng qua. Cuối: "hydrasdk.com" lớn ở giữa, "playground.hydrasdk.com" nhỏ hơn bên dưới, dòng nhỏ "Thực hiện cùng VTechcom Labs" kèm logo ở góc dưới phải, không đọc thành lời. | Một nốt chuông cho mỗi bước; nền ra dần trong 2 giây cuối. |

**Tổng:** 16 cảnh, 71 câu, 1406 âm tiết, ước lượng khoảng 6 phút 51 giây (tính 4.2 âm tiết/giây, cộng nghỉ giữa câu và giữa cảnh, cộng 2 giây giữ hình ở mỗi cảnh có code).

## Code trên bảng

Code rút gọn từ ví dụ chạy được trong repo; chỉ bỏ log, kiểm tra lỗi và đổi tên biến. Nguồn ghi ngay dưới mỗi đoạn. Mỗi cảnh code hiện nhãn nhỏ ở góc "Code rút gọn, bản đầy đủ ở hydrasdk.com", không đọc thành lời.

### 02. Chuẩn bị

```bash
npm install @hydra-sdk/core @hydra-sdk/bridge \
  @hydra-sdk/transaction @hydra-sdk/cardano-wasm
```

Nguồn: `apps/docs-v2/content/en/1.getting-started/2.installation.md:81`

### 04. Ví của An

```ts
import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'

// 24 từ ghi nhớ của An (string[]). Ví mới thì tạo một lần bằng AppWallet.brew()
const words = process.env.AN_MNEMONIC!.split(' ')

const wallet = new AppWallet({
  key: { type: 'mnemonic', words },
  networkId: NETWORK_ID.PREPROD
})
const myAddress = wallet.getAccount().baseAddressBech32
```

Nguồn: `apps/nodejs-playground/src/hydra/common.ts:11-22; packages/core/src/types/wallet/index.ts:14-23 (words: string[]); packages/core/src/wallet.ts:87-89 (AppWallet.brew, mặc định 256 bit = 24 từ, qua EmbeddedWallet.generateMnemonic ở embedded.ts:72); packages/core/src/constants/chain.ts:15-19; biến môi trường AN_MNEMONIC là tên minh hoạ`

### 05. Bước 1 — Kết nối Head

```ts
import { HydraBridge } from '@hydra-sdk/bridge'

const bridge = new HydraBridge({ url: 'ws://localhost:4001' })
await bridge.connect()   // true khi đã kết nối
```

Nguồn: `packages/hydra-bridge/src/bridge.ts:24-58, 152-164, 322-339; apps/docs-v2/content/en/3.concepts/4.transactions-in-hydra.md:88-91`

### 06. Bước 2 — Snapshot của Head

```ts
const snapshot = await bridge.querySnapshotUtxo()

// {
//   'fa1e…369f#0': {
//     address: 'addr_test1…',
//     value: { lovelace: 18000000 },
//     datum: null, inlineDatum: null, referenceScript: null
//   }
// }
```

Nguồn: `packages/hydra-bridge/src/bridge.ts:460-473; kết quả mẫu ở apps/docs-v2/content/en/3.concepts/4.transactions-in-hydra.md:63-75 (mã giao dịch và địa chỉ rút gọn)`

### 07. Bước 2 — Món tiền của riêng An

```ts
const myUtxos = await bridge.queryAddressUTxO(myAddress)
// UTxO[] — sẵn sàng cho TxBuilder
```

Nguồn: `packages/hydra-bridge/src/bridge.ts:669-678; apps/nodejs-playground/src/hydra/build-tx.ts:19`

### 08. Bước 3 — Gọi TxBuilder

```ts
import { TxBuilder } from '@hydra-sdk/transaction'

const txBuilder = new TxBuilder({
  isHydra: true,
  params: { minFeeA: 0, minFeeB: 0 }
})
```

Nguồn: `packages/hydra-transaction/src/tx-builder/index.ts:91-118; apps/nodejs-playground/src/hydra/build-tx.ts:20-26; apps/docs-v2/content/en/2.guides/5.hydra-integration.md:12-23; apps/docs-v2/content/en/2.guides/2.build-wallet-app.md:674`

### 09. Bước 3 — Chọn món và tạo tiền thối

```ts
const bobAddress = 'addr_test1…'    // địa chỉ nhận của Bình (Bech32)

const tx = await txBuilder
  .setInputs(myUtxos)              // món tiền để chọn
  .addOutput({
    address: bobAddress,           // địa chỉ nhận của Bình
    amount: [{ unit: 'lovelace', quantity: '2000000' }]
  })
  .changeAddress(myAddress)        // tiền thối về An
  .complete()
```

Nguồn: `packages/hydra-transaction/src/tx-builder/index.ts:516-528 (setInputs), 800-802 (addOutput), 749-759 (changeAddress), 890-926 (complete), 1388-1390 và 347-448 (chọn món, tạo tiền thối); apps/nodejs-playground/src/hydra/build-tx.ts:27-34 (gốc gửi về chính walletAddress, ở đây đổi thành bobAddress); địa chỉ là chuỗi Bech32, txOut(address: string) đọc bằng Address.from_bech32 (tx-builder/index.ts:284, 1218-1219)`

### 10. Bước 4 — Ký

```ts
import { Resolver } from '@hydra-sdk/core'

const signedCbor = await wallet.signTx(tx.to_hex())
const txId = Resolver.resolveTxHash(signedCbor)
```

Nguồn: `packages/core/src/wallet.ts:72-84; packages/core/src/utils/cardano-wasm/resolver.ts:8-13; packages/core/src/index.ts:20,59; apps/nodejs-playground/src/hydra/build-tx.ts:36-37`

### 11. Bước 5 — Gửi vào Head

```ts
const rs = await bridge.submitTxSync({
  cborHex: signedCbor,
  type: 'Witnessed Tx ConwayEra',
  description: 'An gửi Bình 2 ADA',
  txId
})
```

Nguồn: `packages/hydra-bridge/src/bridge.ts:596-603; packages/hydra-bridge/src/types/transaction.type.ts; packages/hydra-bridge/src/connector/websocket.ts:386-415; apps/nodejs-playground/src/hydra/build-tx.ts:39-44`

### 12. Bước 6 — Snapshot mới

```ts
// rs = {
//   txId: 'dee1…5435', isValid: true, isConfirmed: true,
//   result: { tag: 'SnapshotConfirmed', snapshot: { number: 1, … } }
// }

const after = await bridge.querySnapshotUtxo()
```

Nguồn: `packages/hydra-bridge/src/types/submitter.type.ts:7-12; kết quả mẫu ở apps/docs-v2/content/en/3.concepts/4.transactions-in-hydra.md:177-200 (rút gọn); packages/hydra-bridge/src/bridge.ts:460-473`

### 13. Lắng nghe Head

```ts
bridge.events.on('onMessage', payload => {
  if (payload.tag === 'SnapshotConfirmed') {
    const balance = bridge.getAddressBalance(myAddress)
    console.log(balance?.get('lovelace'))   // 16000000n
  }
})
```

Nguồn: `apps/docs-v2/content/en/2.guides/5.hydra-integration.md:318-332; packages/hydra-bridge/src/bridge.ts:190-200, 313-316, 660-662`
