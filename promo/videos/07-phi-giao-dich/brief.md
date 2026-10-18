# Tập 7 — Phí giao dịch trên Cardano được tính thế nào?

## Brief

| Mục | Quyết định |
|---|---|
| Chuỗi | Kiến thức nền Cardano và Hydra, đồng thời giới thiệu hydra-sdk |
| Thể loại | Giải thích khoa học |
| Phong cách | Như các tập trước: phấn trắng trên nền đen, hình hiện dần như đang được vẽ |
| Lời đọc | Tiếng Việt, giọng Hải Đăng (VieNeu), không có phụ đề chạy; chữ trên màn hình chỉ là chữ được "viết" lên bảng. Xưng "ta"/"chúng ta" hoặc diễn đạt khách quan |
| Khung hình | 16:9, 1920×1080, 25 fps |
| Âm thanh | Giọng đọc + nền và hiệu ứng tự tổng hợp; tiếng "tách" của bàn tính khi cộng từng phần phí |
| Khán giả | Người chưa biết gì về blockchain, đã xem tập 1–6; thêm đoạn ngắn cho lập trình viên (cảnh 13–14) |
| Độ dài | Khoảng 5–6 phút (15 cảnh) |
| Cuối video | hydrasdk.com ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc, không đọc thành lời |

**Ẩn dụ dẫn nhập:** **bảng giá niêm yết công khai** viết trên bảng đen: mỗi giao dịch trả một khoản cố định, cộng thêm theo "cân nặng" (số byte), cộng thêm công "vặn" chiếc ổ khoá bánh răng của tập 5 nếu có. Ai gửi cũng nhìn cùng một bảng giá, bảng do các tham số giao thức của cả mạng quy định, không có người đứng quầy thu cước và không có chuyện trả giá để chen hàng. Không vẽ quầy bưu điện hay nhân viên thu cước (tránh gợi ý một bên trung tâm, theo review agy). Ẩn dụ chỉ dùng ở phần dẫn nhập từng cảnh; phần định nghĩa dùng thuật ngữ trung tính (phí cố định, phí theo kích thước, phí thực thi script, phí script tham chiếu, tham số giao thức). Ẩn dụ không mâu thuẫn với chuỗi: món tiền vẫn mang ổ khoá, script vẫn là ổ khoá bánh răng.

**Hình xuyên suốt:** tấm bảng giá phấn bốn dòng, mỗi dòng sáng lên ở cảnh của nó. Hai dòng đầu có nhãn "mọi giao dịch", hai dòng sau có nhãn "chỉ khi có". Cột bên phải là "bàn tính" cộng dồn thành tổng phí; với giao dịch cà phê, dòng 3 và dòng 4 ghi 0. Màu nhấn cố định:

- Món tiền và tiền thối: vàng phấn (như tập 1).
- Đồng phí: cam phấn (màu mới, chỉ dùng cho phí).
- Kích thước giao dịch (byte): xanh lá phấn, vẽ như quả cân.
- Script (bánh răng): trắng (như tập 5).
- Script tham chiếu: tím phấn (tránh xanh lam, đã dùng cho datum ở tập 5).
- Hydra Head: vòng tròn như tập 2–3.

**Ví dụ xuyên suốt:** nối tiếp ví dụ cà phê của tập 1 (An trả 30 ADA từ món 50 ADA, tiền thối 19,83 ADA, phí 0,17 ADA). Tập này "giải mã" con số 0,17 ADA: với tham số giao thức mainnet tại epoch 661, một giao dịch dài 300 byte có phí theo kích thước bằng 168.581 lovelace, làm tròn là 0,17 ADA. Kích thước 300 byte là **số minh hoạ** chọn để khớp tập 1, không phải giao dịch thật. Sau đó ví dụ mở rộng sang chiếc két chung của An, Bình, Chi ở tập 5 (có script) và giao dịch An gửi Bình trong Head ở tập 6 (phí bằng không theo cấu hình của Head).

## Nguồn tham khảo

Code hydra-sdk (đã mở đọc trong worktree này, nhánh `claude/cardano-hydra-video-series-c086de`):

- `packages/core/src/utils/fee.ts` — `calculateTxFee(txHex, options): FeeBreakdown` (dòng 75–174). `FeeBreakdown` gồm `fee`, `baseFee`, `sizeFee` (`minFeeA × txBytes + minFeeB`), `scriptFee` (`ceil(priceMem × mem + priceStep × steps)`), `refScriptFee`, `txBytes`, `signerCount`, `refScriptBytes` (dòng 13–30). `CalculateTxFeeOptions`: `exUnits`, `resolvedUtxos`, `params`, `extraSigners`, `feeMultiplier`, `safetyMarginLovelace` (dòng 32–45). Hàm thêm chữ ký giả (32 byte khoá + 64 byte chữ ký, dòng 54–56) cho mỗi người ký dự kiến và 8 byte dự phòng cho trường phí (dòng 47–53), nên kết quả là ước lượng không thấp hơn phí CSL tính khi dựng (chú thích dòng 63–74).
- `packages/core/src/index.ts:15,24,65` — `FeeUtils` và các kiểu `FeeBreakdown`, `CalculateTxFeeOptions`, `ExUnitsLike` được xuất từ `@hydra-sdk/core`.
- `packages/core/src/constants/protocol-parameters.ts` — `DEFAULT_PROTOCOL_PARAMETERS` (`minFeeA: 44`, `minFeeB: 155381`, `priceMem: 0.0577`, `priceStep: 0.0000721`, `minFeeRefScriptCostPerByte: 15`, `coinsPerUtxoSize: 4310`, `maxTxSize: 16384`, `collateralPercent: 150`); `resolveTxFees(txSize, minFeeA, minFeeB)` chỉ tính phần theo kích thước.
- `packages/core/src/types/protocol.ts` — kiểu `Protocol`, `castProtocol` (giữ nguyên giá trị 0, không thay bằng mặc định).
- `packages/hydra-transaction/src/tx-builder/index.ts`:
  - `constructor(options: TxBuilderOptions)` nhận `params`, `evaluator`, `txEvaluationMultiplier`, `isHydra` (dòng 91–118); `updateProtocolParams(params)` (dòng 120–131).
  - `static getTxBuilder(pp)` đưa `minFeeA`/`minFeeB` vào `LinearFee`, `priceMem`/`priceStep` vào `ex_unit_prices`, `minFeeRefScriptCostPerByte` vào `ref_script_coins_per_byte`, `coinsPerUtxoSize` vào `coins_per_utxo_byte` (dòng 1707–1770).
  - `calculateFee()` chỉ là hàm giữ chỗ, luôn trả 0 (dòng 761–769); `setFee(fee)` (dòng 774–780); `setMinFee(minFee)` (dòng 785–791).
  - `complete(options?: { fastRebalance?: boolean })` (dòng 890–937): dựng nháp; nếu có `evaluator` và giao dịch có redeemer thì gọi `evaluator.evaluateTx`, ghi `exUnits` thật vào redeemer, rồi dựng lại để phí đúng. Không có `evaluator` thì dựng một lượt.
  - Với `isHydra` dùng `build_tx_unsafe()` (không bắt cân bằng đầu vào/đầu ra, dòng 1107–1116); ngược lại `build_tx()`.
  - `static minAda(output, protocolParams)` và `static minAdaForAssets(assets)` (dòng 831–874) — lượng ADA tối thiểu của một đầu ra.
- `packages/evaluator/src/index.ts`, `src/evaluator.ts`, `README.md` — `@hydra-sdk/evaluator` (phiên bản 0.1.0, ghi rõ "Experimental (0.x)"): `createEvaluator`, `OfflineEvaluator.evaluateTx`, `OfflineEvaluator.calculateFee` (chạy thử script rồi gọi `FeeUtils.calculateTxFee`), nguồn ngữ cảnh `fromUtxos`, `fromUtxoObject`, `fromHydraSnapshot`; cần `whisky-evaluator@0.1.1` (peer dependency tuỳ chọn, khoảng 13 MB).
- `packages/hydra-bridge/src/bridge.ts:404-425` — `getProtocolParameters(): Promise<Protocol>` và `getRawProtocolParameters()`; `packages/hydra-bridge/src/types/protocol-parameters.type.ts:93-119` — `toProtocol` đổi `txFeePerByte → minFeeA`, `txFeeFixed → minFeeB`, `executionUnitPrices → priceMem/priceStep`, `utxoCostPerByte → coinsPerUtxoSize` (giữ 0 trong Head).
- `apps/playground/lib/fee-lab.ts`, `apps/playground/pages/fee-lab.vue` — trang Fee Lab: dựng một giao dịch script Plutus V3 mẫu ngay trên trình duyệt rồi tách phí thành ba phần Size / Script / Reference; có ba mức ExUnits mẫu (always-succeed `mem 500, steps 64100`; Placeholder; "Heavy script" `mem 2.000.000, steps 700.000.000`).
- `.changeset/offline-plutus-evaluator.md`, `.changeset/fast-rebalance-exunits.md` — hai changeset **chưa phát hành** cho `@hydra-sdk/evaluator`, `FeeUtils.calculateTxFee` và `complete({ fastRebalance })`.
- Cấu hình Head mẫu trong repo: `infra/hydra-offline/protocol-parameters.json`, `demo/*/protocol-parameters.json` (`txFeeFixed: 0`, `txFeePerByte: 0`, `executionUnitPrices` bằng 0); `infra/hydra-preprod/protocol-parameters.json` + `README.md:158-170` + `gen-l2-params.sh` (lấy tham số preprod nguyên văn, chỉ đặt `txFeeFixed`, `txFeePerByte`, `utxoCostPerByte` về 0, **giữ** giá thực thi script `priceMemory 0.0577`, `priceSteps 0.0000721`); `infra/hydra-preprod/run-online.sh:210` truyền file này qua `--ledger-protocol-parameters`.

Tài liệu docs-v2 (đã mở đọc):

- `apps/docs-v2/content/en/4.api/4.transaction.md:24` (tuỳ chọn `evaluator`), `:600-650` (`calculateFee` là stub, `setFee`, `setMinFee`), `:658-675` (`minAda`), `:833-863` (mục "Script evaluation (exUnits)").
- `apps/docs-v2/content/en/2.guides/5.hydra-integration.md:12-23, 140-170` — `TxBuilder({ isHydra: true, params: { minFeeA: 0, minFeeB: 0 } })` trong Head, `minFeeA: 44, minFeeB: 155381` cho L1.
- `apps/docs-v2/content/en/4.api/3.bridge.md:177-195, 522-530, 945-960` — `getProtocolParameters()` và ví dụ đưa thẳng tham số của Head vào `TxBuilder`.
- `apps/docs-v2/content/en/5.resources/1.changelog.md:162-166` — evaluator tuỳ chọn trong `TxBuilder` từ transaction v1.2.0, sửa lỗi phí script (trước đó giá thực thi bị đặt cứng bằng 0); `:142` — `utxoCostPerByte` bằng 0 trong Head được giữ nguyên.

Phiên bản đã phát hành (tra `npm view` ngày 16/10/2026): `@hydra-sdk/core` mới nhất 1.5.0 (4/8/2026), `@hydra-sdk/transaction` 1.2.3, `@hydra-sdk/bridge` 2.0.2; `@hydra-sdk/evaluator` **chưa có trên npm** (404). Commit thêm `FeeUtils.calculateTxFee` (`02cab55`, 12/8/2026) không nằm trong commit phát hành core 1.5.0 (`d10c459`), kiểm bằng `git merge-base --is-ancestor`.

Nguồn ngoài:

- Tham số giao thức mainnet, Koios API, lấy ngày 16/10/2026 lúc khoảng 05:07 UTC, epoch 661 (kỷ nguyên Conway, protocol version 11.0): `txFeeFixed 155381`, `txFeePerByte 44`, `executionUnitPrices { priceMemory 0.0577, priceSteps 0.0000721 }`, `minFeeRefScriptCostPerByte 15`, `utxoCostPerByte 4310`, `maxTxSize 16384`, `collateralPercentage 150` — https://api.koios.rest/api/v1/cli_protocol_params và https://api.koios.rest/api/v1/tip
- Cardano Docs, "Fee structure" (công thức `a × size(tx) + b`; b là khoản trả cho mọi giao dịch để chống spam; phí gom lại chia cho các pool tạo khối trong epoch) — https://docs.cardano.org/about-cardano/explore-more/fee-structure
- Cardano Docs, "Transaction costs and determinism" (dự đoán được kết quả và chi phí ngay trên máy; giao dịch tự khai ngân sách thực thi cho từng script; mô hình gas không tất định; tiền thế chấp từ Alonzo) — https://docs.cardano.org/about-cardano/learn/transaction-costs-determinism
- IOG, "No surprises: transaction validation on Cardano" (ngân sách tài nguyên và phí cho ngân sách đó nằm ngay trong giao dịch) — https://www.iog.io/news/no-surprises-transaction-validation-on-cardano
- Cardano Docs, "Minimum ada value requirement" (`minUTxoVal = (160 + sizeInBytes(TxOut)) × coinsPerUTxOByte`) — https://docs.cardano.org/native-tokens/minimum-ada-value-requirement/
- Cardano Ledger (Conway) Haddock, phí script tham chiếu tăng theo cấp số nhân với bước 25 KiB — https://cardano-ledger.cardano.intersectmbo.org/cardano-ledger-conway/Cardano-Ledger-Conway-Tx.html
- Hydra docs, "Configuration" (`--ledger-protocol-parameters`; file mẫu là tham số mainnet với mọi khoản phí và giá thực thi đặt bằng 0, "transactions inside a head cost nothing") — https://hydra.family/head-protocol/docs/configuration
- ethereum.org, "Gas and fees" (base fee đổi theo độ đầy khối, tối đa 12,5% mỗi khối; priority fee giúp được đưa vào khối sớm; giao dịch thất bại vẫn trả phí) — https://ethereum.org/en/developers/docs/gas/
- Thứ tự xử lý giao dịch trên Cardano: cexplorer, "Understanding Cardano fees" (nguồn cộng đồng: không ưu tiên theo phí, phí không đổi theo tải mạng) — https://cexplorer.io/article/understanding-cardano-fees ; CIP-0183 (đề xuất ưu tiên theo phí khi tranh chấp, trạng thái Proposed, chưa áp dụng) — https://cips.cardano.org/cip/CIP-0183

## Ranh giới sự thật

Được nói (đã đối chiếu):

- Phí trên Cardano là tổng của các phần: phí cố định (`minFeeB`, tức `txFeeFixed`), phí theo kích thước (`minFeeA × số byte`, tức `txFeePerByte`), phí thực thi script (giá bộ nhớ × bộ nhớ + giá bước × số bước, làm tròn lên), và từ Conway thêm phí script tham chiếu theo số byte của script được tham chiếu. Công thức khớp `FeeUtils.calculateTxFee` và cấu hình `TxBuilder.getTxBuilder`.
- Phí cố định và phí theo kích thước áp dụng cho mọi giao dịch; phí thực thi script chỉ phát sinh khi giao dịch chạy script (tiêu món tiền khoá bằng script, đúc token bằng script…); phí script tham chiếu chỉ phát sinh khi giao dịch trỏ tới script đặt sẵn trên chuỗi (`FeeUtils.calculateTxFee` trả `scriptFee` và `refScriptFee` bằng 0 trong các trường hợp đó, `fee.ts:121-148`).
- Giao dịch cà phê của tập 1 là giao dịch chuyển tiền thường, chỉ có hai dòng đầu: 155.381 + 44 × 300 + 0 + 0 = 168.581 lovelace, khoảng 0,17 ADA, khớp phương trình 50 = 30 + 19,83 + 0,17 của tập 1 (19,83 là số làm tròn). Ví dụ phí script ở cảnh 06 là nhánh riêng cho chiếc két chung của tập 5, không cộng vào giao dịch cà phê; giao dịch két chung cũng dài hơn 300 byte nên kịch bản không đưa ra tổng phí của nó.
- Giá trị tại epoch 661 (16/10/2026, Koios): phí cố định 155.381 lovelace; 44 lovelace mỗi byte; 0,0577 lovelace mỗi đơn vị bộ nhớ; 0,0000721 lovelace mỗi bước; 15 lovelace mỗi byte script tham chiếu (bậc đầu); giao dịch tối đa 16.384 byte. Trên màn hình ghi "Mainnet, epoch 661, 16/10/2026" cạnh bảng giá.
- Giá do tham số giao thức đặt, mọi giao dịch trong cùng thời điểm dùng chung một bảng giá; tham số chỉ đổi qua quy trình cập nhật tham số của mạng, không đổi theo từng giao dịch hay theo lúc mạng đông.
- Phí ghi rõ trong giao dịch; hai vế cân bằng: tổng đầu vào bằng tổng đầu ra cộng phí (nối tập 1).
- 1 ADA = 1.000.000 lovelace; phí và mọi số tiền trong giao dịch là số nguyên lovelace.
- Tính tay: giao dịch 300 byte có phí theo kích thước 44 × 300 + 155.381 = 168.581 lovelace, khoảng 0,17 ADA (khớp số minh hoạ tập 1).
- Mỗi chữ ký cũng làm giao dịch nặng thêm, khoảng một trăm byte (32 byte khoá công khai + 64 byte chữ ký, chưa kể mã hoá CBOR; `fee.ts:54-56`), nên phí phụ thuộc số người ký.
- Giao dịch có script tự khai ngân sách thực thi (bộ nhớ và số bước) cho từng script; vì giao dịch, các món tiền nó chỉ đích danh và tham số giao thức đều biết trước, ví chạy thử được để biết ngân sách rồi tính phí trước khi ký và gửi (nối tập 5).
- Giao dịch bị từ chối ở vòng kiểm tra đầu (phase 1), ví dụ món tiền đã bị tiêu, thì không mất phí; script thất bại sau khi giao dịch đã được gửi (phase 2) thì mạng thu tiền thế chấp thay cho phí (nối tập 5 cảnh 12).
- Ethereum (mô hình tài khoản, EIP-1559): base fee lên xuống theo độ đầy khối, người gửi trả thêm priority fee để được đưa vào khối sớm, giao dịch thất bại vẫn trả phí. Cardano không có cơ chế base fee biến động như vậy; phí tối thiểu chỉ phụ thuộc giao dịch và bảng tham số.
- Lượng ADA tối thiểu (min-ADA) của mỗi món tiền: `(160 + kích thước đầu ra theo byte) × 4.310` lovelace tại epoch 661. Đây **không phải phí**: lượng ADA đó vẫn nằm trong món tiền và thuộc về người nhận.
- Phần dư sau khi trừ số tiền gửi và phí quay về ví dưới dạng món tiền thối (nối tập 1, tập 6).
- Trong Hydra Head, bảng giá là tham số giao thức do người vận hành hydra-node cấu hình (`--ledger-protocol-parameters`). File mẫu trong tài liệu Hydra đặt mọi khoản phí và giá thực thi bằng 0. Head trong ví dụ tập 6 không thu phí. Câu đọc nói "tuỳ cấu hình của Head", không nói "Hydra miễn phí".
- Mở, nạp tiền, đóng Head là giao dịch trên Cardano, vẫn trả phí theo bảng giá mainnet (nối tập 2 câu "mở và đóng Head là giao dịch trên Cardano").
- Phần lập trình viên: `TxBuilder` tự tính phí trong `complete()` từ tham số giao thức (`params`, mặc định `DEFAULT_PROTOCOL_PARAMETERS`); `HydraBridge.getProtocolParameters()` đọc bảng giá của chính Head; `setFee` đặt phí cố định, `setMinFee` đặt mức sàn; có `evaluator` thì `complete()` chạy thử script, ghi ngân sách thật và dựng lại để phí đúng. Các API này có trong bản đã phát hành (`transaction` 1.2.3, `bridge` 2.0.2).

Đơn giản hoá có chủ ý (không nói sai, nhưng lược bớt):

- "Bốn phần phí": bỏ qua tiền cọc (deposit) đăng ký staking, DRep, đề xuất quản trị; tiền cọc không phải phí và được trả lại khi huỷ đăng ký.
- Phí script tham chiếu: chỉ nói "theo số byte, script càng lớn thì giá mỗi byte càng tăng theo bậc"; không đọc số bậc và hệ số nhân (chưa tìm được nguồn chính cho hệ số 1,2). Trên bảng ghi "15 lovelace/byte (bậc đầu, script dưới 25 KiB)", theo bước 25 KiB của Conway ledger Haddock.
- "Ví tính phí trước khi ký": thực tế phí làm thay đổi kích thước giao dịch nên bộ dựng tính lặp; `FeeUtils.calculateTxFee` cộng thêm 8 byte dự phòng. Lời đọc không đi vào vòng lặp này.
- Người vận hành mạng: "phí gom lại chia cho các pool tạo khối" theo Cardano Docs; bỏ qua phần trích vào ngân khố (treasury) từ quỹ thưởng.
- Script tham chiếu: chỉ giải thích là "script đã đặt sẵn trên chuỗi, giao dịch trỏ tới thay vì mang theo"; không nói CIP-33, reference input.
- Ví dụ phí script dùng mức "Heavy script" của Fee Lab: 2.000.000 × 0,0577 + 700.000.000 × 0,0000721 = 115.400 + 50.470 = 165.870 lovelace, khoảng 0,17 ADA. Đây là **số minh hoạ**, không phải hợp đồng có thật; két chung của tập 5 cũng là ví dụ minh hoạ, không có số đo.
- Tiền thế chấp: chỉ nhắc một câu (tỉ lệ 150% phí, tối đa 3 món là chi tiết bỏ qua).

Không dùng:

- `TxBuilder.calculateFee()`: hàm giữ chỗ, luôn trả 0 (`tx-builder/index.ts:761-769`, docs ghi rõ là stub).
- `FeeUtils.calculateTxFee` và `@hydra-sdk/evaluator` như thể đã phát hành: cả hai có trong mã nguồn nhánh master nhưng **chưa có trên npm** (core 1.5.0 không chứa `FeeUtils`; evaluator 404; còn changeset chưa phát hành). Nếu chủ sản phẩm đồng ý đưa vào cảnh 14, cảnh mang nhãn "ĐANG HOÀN THIỆN" trên màn hình, và evaluator thêm nhãn "Experimental 0.x". Tương tự cho `complete({ fastRebalance })`.
- Câu "Hydra không có phí" hay "mọi Head đều miễn phí": cấu hình mẫu `infra/hydra-preprod` trong chính repo giữ giá thực thi script khác 0, tức giao dịch có script trong Head đó vẫn trả phí thực thi.
- Câu trong docs-v2 `2.guides/4.mint-burn-tokens.md:241-243` ("Consider network congestion when setting fees") và `4.api/4.transaction.md:625` ("Layer 2 transactions carry no fee" nói chung): không trích vì dễ hiểu sai.
- Khẳng định tuyệt đối "trả thêm phí không bao giờ được ưu tiên": nguồn cho thứ tự xử lý là nguồn cộng đồng, và CIP-0183 đang đề xuất ưu tiên theo phí. Lời đọc chỉ nói "phí không lên xuống theo lúc mạng đông, và không có cơ chế trả thêm để chen hàng như gas".
- Số liệu phí trung bình, tổng phí mạng thu, so sánh phí bằng tiền đô, tốc độ, thông lượng.
- Bất kỳ con số tham số nào không ghi kèm "epoch 661, 16/10/2026".

## Dàn ý cảnh

Thứ tự cảnh 09–11 đã đổi theo review agy: tiền thối và min-ADA đi ngay sau phương trình "Vào = Ra + Phí", rồi mới tới "biết trước phí" và so sánh với Ethereum.

| Cảnh | Tiêu đề | Ý chính (1–3 câu, nói điều gì) | Hình gợi ý | Nối với tập khác |
|---|---|---|---|---|
| 01 | Hai con số phí | Ở tập sáu, An gửi Bình hai ADA trong Head mà không mất đồng phí nào. Còn ở tập một, ly cà phê trên mạng chính tốn thêm 0,17 ADA. Tập này trả lời phí được tính thế nào, và vì sao hai con số khác nhau. | Vòng tròn Head của tập 6 với ô "An → Bình: 2 ADA · Phí: 0", bên cạnh hoá đơn cà phê "Phí: 0,17 ADA". Dấu hỏi phấn ở giữa. | Tập 6 cảnh 08–09; tập 1 cảnh 14 |
| 02 | ADA và lovelace | Phí tính bằng lovelace, một triệu lovelace bằng một ADA. 0,17 ADA là khoảng một trăm bảy mươi nghìn lovelace. | Đồng ADA phấn tách thành nhiều hạt nhỏ; dòng "1 ADA = 1.000.000 lovelace". | Tập 1 cảnh 13 |
| 03 | Bảng giá niêm yết | Phí không do ai mặc cả, mà đọc từ một bảng giá công khai gọi là tham số giao thức. Mọi giao dịch cùng lúc dùng chung một bảng, và bảng chỉ đổi khi mạng cập nhật tham số. | Tấm bảng giá bốn dòng còn trống, phía trên ghi "Tham số giao thức". Góc nhỏ: "Mainnet, epoch 661, 16/10/2026". | — |
| 04 | Dòng một: phí cố định | Giao dịch nào cũng trả một khoản cố định 155.381 lovelace, dù to hay nhỏ. Khoản này làm cho việc gửi hàng loạt giao dịch rác trở nên tốn kém. | Dòng 1 sáng cam, nhãn "mọi giao dịch". Hàng phong bì rác bị chặn bởi đồng phí. | — |
| 05 | Dòng hai: theo kích thước | Giao dịch nào cũng trả thêm 44 lovelace cho mỗi byte. Đầu vào, đầu ra và mỗi chữ ký đều chiếm chỗ. Giao dịch cà phê dài khoảng ba trăm byte thì phần này là 13.200 lovelace. | Quả cân xanh lá đặt lên cân; dòng 2 sáng, nhãn "mọi giao dịch". Bàn tính: 44 × 300 = 13.200. Nhãn "300 byte: số minh hoạ". | Tập 4 (chữ ký) |
| 06 | Dòng ba: công vặn ổ khoá | Chỉ khi giao dịch phải chạy script, ví dụ mở chiếc két chung của tập năm, mới có dòng này. Script tốn bộ nhớ và số bước tính, gọi chung là đơn vị thực thi, mỗi loại có giá riêng. | Ổ khoá bánh răng trắng của tập 5 quay; hai đồng hồ đo "Bộ nhớ" và "Số bước". Dòng 3 sáng, nhãn "chỉ khi có script". Ví dụ minh hoạ bên lề: 2 triệu bộ nhớ, 700 triệu bước → 165.870 lovelace. | Tập 5 cảnh 04 |
| 07 | Dòng bốn: script tham chiếu | Từ bản nâng cấp Conway, giao dịch có thể trỏ tới một script đặt sẵn trên chuỗi thay vì mang theo. Khi đó trả thêm theo số byte của script ấy, script càng lớn thì giá mỗi byte càng tăng theo bậc. | Ổ khoá tím trên kệ chuỗi khối, giao dịch chỉ mang mũi tên trỏ tới. Dòng 4 sáng, nhãn "chỉ khi trỏ tới script đặt sẵn", chú thích "15 lovelace/byte (bậc đầu, script dưới 25 KiB)". | Tập 5 (ổ khoá bánh răng; tập 5 chưa nói script tham chiếu) |
| 08 | Cộng lại cho ly cà phê | Ly cà phê là giao dịch chuyển tiền thường, nên dòng ba và dòng bốn bằng không. Cộng hai dòng đầu được 168.581 lovelace, chính là 0,17 ADA của tập một. Con số này ghi thẳng vào giao dịch, và hai vế vẫn cân. | Bàn tính: 155.381 + 13.200 + 0 + 0 = 168.581 ≈ 0,17 ADA. Phương trình "Vào = Ra + Phí" của tập 1 hiện lại. Góc nhỏ: chiếc két chung có thêm dòng 3 nên phí cao hơn (không ghi tổng). | Tập 1 cảnh 08, 14 |
| 09 | Tiền thối và lượng ADA tối thiểu | Phí được trừ vào phần dư, phần còn lại về ví thành món tiền thối. Mỗi món tiền còn phải giữ một lượng ADA tối thiểu, nhưng đó không phải phí: số ADA ấy vẫn nằm trong món tiền, thuộc về người nhận. | Ô 50 ADA tách thành 30 ADA, 19,83 ADA (vàng) và đồng phí cam. Mỗi ô vàng có vạch đáy "tối thiểu", ghi chú "không phải phí". | Tập 1 cảnh 14; tập 6 cảnh 09 |
| 10 | Biết trước khi bấm gửi | Mọi thứ cần để tính phí đều nằm trong tay ta: giao dịch, các món tiền nó tiêu, và bảng giá công khai. Ví chạy thử script để biết ngân sách, tính phí rồi mới ký. Giao dịch hỏng ở vòng kiểm tra đầu thì không mất phí. | Laptop phấn của tập 5 chạy thử, bàn tính ra con số trước khi chữ ký được đóng. Nhánh phụ nhỏ: "script lỗi sau khi gửi → mất tiền thế chấp". | Tập 5 cảnh 09–10, 12 |
| 11 | Không có trả giá để chen hàng | Ở Ethereum, phí cơ bản lên xuống theo độ đầy của khối, và người gửi trả thêm tiền boa để được đưa vào sớm. Trên Cardano, phí tối thiểu không lên xuống theo lúc mạng đông hay vắng, và không có cơ chế trả thêm để chen hàng như vậy. | Bên trái: bảng con số nhảy lên xuống, mũi tên "tiền boa". Bên phải: bảng giá niêm yết đứng yên, hàng giao dịch xếp lần lượt. | Tập 5 cảnh 10 |
| 12 | Phí trong Hydra Head | Một Hydra Head có bảng giá riêng, do người vận hành Head cấu hình. Tài liệu Hydra mẫu đặt mọi khoản phí bằng không, như Head ở tập sáu; Head khác có thể giữ lại vài dòng. Còn mở và đóng Head là giao dịch trên Cardano, vẫn trả theo bảng giá của mạng chính. | Vòng tròn Head với bảng giá nhỏ của riêng nó, các dòng ghi 0; nhãn "tuỳ cấu hình của Head". Dưới đường kẻ: cửa mở/đóng Head kèm đồng phí cam của mạng chính. | Tập 2 cảnh 11; tập 3; tập 6 cảnh 08 |
| 13 | TxBuilder tự tính phí — cho lập trình viên | Khi gọi lệnh hoàn tất, TxBuilder tính phí từ bảng tham số ta đưa vào; trong Head, ta lấy bảng tham số từ chính Head. Có thể đặt mức sàn cho phí. Nếu cấp một bộ chạy thử, TxBuilder chạy script trước rồi dựng lại cho đúng phí. | Code phấn hai khối: Head — `const params = await bridge.getProtocolParameters()`, `new TxBuilder({ isHydra: true, params })`; mạng chính có script — `new TxBuilder({ params, evaluator })`, `.setMinFee('200000')`, `.complete()`. Nhãn "@hydra-sdk/transaction · @hydra-sdk/bridge", "Code rút gọn, bản đầy đủ ở hydrasdk.com". | Tập 5 cảnh 12; tập 6 cảnh 05, 08 |
| 14 | Tách phí thành từng dòng — cho lập trình viên | Hàm tính phí trong gói core trả về từng dòng của bảng giá: phần kích thước, phần script, phần script tham chiếu, kèm số byte và số người ký. Phần này đang hoàn thiện, chưa có trong bản phát hành. Cảnh viết độc lập để bỏ được nếu chủ sản phẩm chọn phương án khác ở câu hỏi 1. | Code phấn: `FeeUtils.calculateTxFee(txHex, { exUnits, resolvedUtxos })` → `{ fee, sizeFee, scriptFee, refScriptFee, txBytes, signerCount }`, nối với bốn dòng bảng giá. Nhãn lớn "ĐANG HOÀN THIỆN". | Cảnh 04–08 |
| 15 | Tóm tắt và lời kết | Thứ nhất, phí là bảng giá niêm yết: phần cố định và phần theo byte cho mọi giao dịch, phần script và script tham chiếu khi có. Thứ hai, mọi thứ để tính phí đều có sẵn, nên ta biết phí trước khi gửi. Thứ ba, trong Hydra Head, phí do cấu hình của Head quyết định. Xem thêm tại hydrasdk.com. | Ba ý viết lần lượt kèm biểu tượng màu nhấn (bảng giá cam, laptop, vòng Head). Cuối: "hydrasdk.com" ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc, không đọc. | Cả chuỗi |

Ước lượng: xem tổng ở cuối `kich-ban.md` (mục tiêu khoảng 5–6 phút; mỗi cảnh 2–4 câu ngắn để người xem kịp nhìn phép tính).

## Thuật ngữ mới cần chốt cách đọc

Chưa ghi vào `promo/shared/tu-dien-doc.md` (phiên này không sửa file chung). Đã có trong từ điển, ở trạng thái `đề xuất`, tập này dùng nhiều: ADA ("a đa"), lovelace ("lớp lây"), byte ("bai"), core ("co"), code ("cốt"), Ethereum (`đã chốt`).

| Từ | (1) Đọc nguyên văn | (2) Phiên âm đề xuất | (3) Thay bằng từ Việt | Ghi chú |
|---|---|---|---|---|
| protocol parameters | protocol parameters | — | tham số giao thức | Đề xuất (3); thuật ngữ chính của tập, ghi song ngữ trên bảng lần đầu |
| ExUnits | ExUnits | ích iu nít | đơn vị thực thi | Đề xuất (3) cho lời đọc; tên gốc chỉ viết trên bảng |
| memory / steps | memory / steps | — | bộ nhớ / số bước tính | Hai thành phần của đơn vị thực thi |
| reference script | reference script | — | script tham chiếu | Ghép với "script" đã chốt |
| Conway | Conway | Con uây | — | Tên bản nâng cấp (kỷ nguyên) của Cardano |
| epoch | epoch | í pốc | kỳ | Chỉ xuất hiện trên bảng ("epoch 661"); nếu phải đọc, đề xuất (2) |
| gas | gas | ga | phí gas | Chỉ dùng ở cảnh 10 khi nói về Ethereum; đề xuất (2) "ga", tránh đọc thành "gát" |
| min-ADA | min ADA | min a đa | lượng ADA tối thiểu | Đề xuất (3) |
| collateral | collateral | — | tiền thế chấp | Đã dùng (3) ở tập 5, giữ nguyên |
| evaluator | evaluator | — | bộ chạy thử | Đã dùng (3) ở tập 5, giữ nguyên |
| FeeUtils | FeeUtils | phi iu tiu | — | Chỉ cần nếu lời đọc cảnh 14 gọi tên; mặc định lời đọc nói "hàm tính phí trong gói co" |
| priority fee / tip | priority fee | — | tiền boa | Cảnh 10 |
| spam | spam | xờ pam | giao dịch rác | Đề xuất (3) |

## Câu hỏi cho chủ sản phẩm

1. **Cảnh 14 dùng `FeeUtils.calculateTxFee` và `@hydra-sdk/evaluator` khi chúng chưa phát hành?** Hai API này có trong mã nguồn master nhưng chưa có trên npm (core mới nhất 1.5.0 không chứa `FeeUtils`, evaluator chưa publish). Mặc định đề xuất: giữ cảnh 14 với nhãn "ĐANG HOÀN THIỆN", và nếu bản phát hành ra trước khi dựng thì bỏ nhãn. Phương án khác: bỏ cảnh 14, gộp ý "bộ chạy thử" vào cảnh 13 (chỉ dùng API đã phát hành).
2. **Có giới thiệu trang Fee Lab của playground không?** Trang `/fee-lab` có trong mã nguồn và vẽ đúng ba phần phí, hợp với tập này. Mặc định: không nhắc trong lời đọc cho tới khi xác nhận trang đã chạy trên playground.hydrasdk.com (phiên này chưa kiểm được vì trang là SPA, đường dẫn nào cũng trả 200).
3. **Con số ví dụ cà phê:** mặc định giữ "0,17 ADA" như tập 1 và nói "khoảng ba trăm byte cho ra khoảng 0,17 ADA" (168.581 lovelace). Có muốn hiện con số lovelace chính xác 168.581 trên bảng không? Mặc định: có, kèm nhãn "300 byte: số minh hoạ".
4. **Ẩn dụ "bảng giá niêm yết"** là ẩn dụ mới của tập, không đụng ẩn dụ món tiền và ổ khoá. Theo review agy, đã bỏ hình quầy bưu phẩm và nhân viên thu cước. Mặc định: dùng "bảng giá niêm yết công khai".
5. **Nói về Ethereum ở cảnh 10:** mặc định nói trung tính (phí cơ bản lên xuống theo độ đầy khối, có tiền boa để được ưu tiên), không chê. Có muốn bỏ hẳn so sánh để tránh tranh luận không? Mặc định: giữ, vì brief yêu cầu nhắc "không có đấu giá gas".
6. **Phát hiện phụ trong docs-v2 (không sửa ở phiên này):** `4.api/3.bridge.md:186` đọc `protocolParams.min_fee_a` trong khi kiểu `Protocol` dùng `minFeeA`; `4.api/4.transaction.md:862` và changelog dòng 162 vẫn ghi "no bundled offline evaluator"; `2.guides/4.mint-burn-tokens.md:243` khuyên "consider network congestion when setting fees", không khớp mô hình phí của Cardano. Có muốn mở việc sửa docs riêng không? Mặc định: ghi nhận, để phiên khác xử lý.

## Xử lý review agy

| Mục | Quyết định (sửa / không sửa) | Lý do |
|---|---|---|
| Cảnh 04, 05, 06, 08 — mâu thuẫn số học (cao) | Sửa | Đúng: ly cà phê chỉ có dòng 1 + dòng 2 (155.381 + 13.200 = 168.581 lovelace); dòng 3, 4 bằng 0 (`fee.ts:121-148`). Cảnh 08 đổi thành "Cộng lại cho ly cà phê", ví dụ script ở cảnh 06 ghi là nhánh riêng của két chung, không cộng vào; thêm hai dòng vào "Được nói". |
| Cảnh 14 — API chưa phát hành (cao) | Sửa một phần | Đã kiểm lại: đúng là chưa phát hành. Chủ sản phẩm chưa trả lời câu hỏi 1 nên giữ phương án mặc định (giữ cảnh với nhãn "ĐANG HOÀN THIỆN", lời đọc nói "chưa có trong bản phát hành"), viết cảnh độc lập để bỏ được. Không dùng câu "dự kiến có trong bản cập nhật tới" vì không có nguồn nào về lịch phát hành. |
| Cảnh 06 & 07 — tưởng mọi giao dịch đều trả 4 dòng (vừa) | Sửa | Đúng. Thêm nhãn "mọi giao dịch" cho dòng 1–2, "chỉ khi có script" / "chỉ khi trỏ tới script đặt sẵn" cho dòng 3–4, cả trên hình và trong lời đọc. |
| Cảnh 10 & 11 — thứ tự mạch (vừa) | Sửa | Hợp lý: tiền thối và min-ADA nối liền phương trình "Vào = Ra + Phí". Thứ tự mới: 08 cộng lại → 09 tiền thối, min-ADA → 10 biết trước → 11 so với Ethereum → 12 Hydra Head. |
| Cảnh 03 — quầy bưu phẩm gợi tính tập trung (vừa) | Sửa | Đúng về cảm nhận: phí không do một quầy trung tâm thu. Bỏ hình quầy và nhân viên, giữ "bảng giá niêm yết công khai" do tham số giao thức quy định; cập nhật câu hỏi 4. |
| Cảnh 07 — 15 lovelace/byte chỉ cho bậc đầu (thấp) | Sửa | Đúng theo Conway ledger Haddock (bước 25 KiB). Thêm chú thích "bậc đầu, script dưới 25 KiB" trên bảng; lời đọc không đọc số này. Không viết "chính xác tuyệt đối". |
| Cảnh 10 (nay là 11) — không tuyệt đối hoá (thấp) | Không sửa | Brief đã tuân thủ (mục "Không dùng"). Không đưa ý "stake pool tuỳ ý sắp xếp mempool" của agy vì không có nguồn chính đã đọc. |
| Cảnh 13 — `isHydra: true` bỏ qua evaluator (thấp) | Không sửa nhận định, giữ code | Agy sai một chi tiết: `complete()` chạy evaluator khi có `evaluator` và có redeemer, bất kể `isHydra` (`tx-builder/index.ts:893`); README evaluator còn có ví dụ `new TxBuilder({ isHydra: true, evaluator })`. Chỉ `fastRebalance` bị bỏ qua khi `isHydra` (dòng 910). Code trên bảng vẫn tách hai khối Head / mạng chính như agy đề xuất. |
| Thuật ngữ & phiên âm (vừa) | Không sửa (ngoài quyền) | Chốt cách đọc là việc của chủ sản phẩm và phiên chính (không sửa `tu-dien-doc.md`). `script.py` đã theo đúng đề xuất: lời đọc dùng "đơn vị thực thi" thay cho ExUnits, "phí cơ bản"/"tiền boa" thay cho base fee/tip; "lovelace", "Conway" giữ nguyên chữ để lexicon xử lý. Không dùng chữ "gas" trong lời đọc. |
| Độ dài & mật độ (vừa) | Sửa một phần | Câu đọc được gọt ngắn, mỗi cảnh 2–4 câu (quy định chung yêu cầu 2–5 câu nên không xuống 1–2 câu như agy đề xuất). Thời lượng ước lượng ghi ở cuối `kich-ban.md`. |
