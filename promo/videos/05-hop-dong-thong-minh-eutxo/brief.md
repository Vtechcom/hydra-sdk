# Tập 5 — Hợp đồng thông minh trên eUTxO: ổ khoá biết suy nghĩ

## Brief

| Mục | Quyết định |
|---|---|
| Chuỗi | Kiến thức nền Cardano và Hydra, đồng thời giới thiệu hydra-sdk |
| Thể loại | Giải thích khoa học |
| Phong cách | Như tập 1: phấn trắng trên nền đen, hình hiện dần như đang được vẽ |
| Lời đọc | Tiếng Việt, giọng Hải Đăng (VieNeu), không có phụ đề chạy; chữ trên màn hình chỉ là chữ được "viết" lên bảng |
| Khung hình | 16:9, 1920×1080 |
| Âm thanh | Giọng đọc + nền và hiệu ứng tự tổng hợp |
| Khán giả | Người chưa biết gì về blockchain, đã xem tập 1; thêm đoạn ngắn cho lập trình viên (cảnh 11–12) |
| Độ dài | Khoảng 5–6 phút |
| Cuối video | hydrasdk.com, kèm dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc, không đọc thành lời |

**Hình xuyên suốt:** chiếc ổ khoá có bánh răng ở cảnh 11 tập 1 được phóng to và mở ra. Màu nhấn cố định: món tiền giữ vàng phấn như tập 1; datum (tờ ghi chú) xanh lam phấn; redeemer (tờ đơn) hồng phấn; script (bánh răng) trắng.

**Ví dụ xuyên suốt:** chiếc két chung của ba anh em An, Bình, Chi. Luật của két: cần ít nhất hai trong ba chữ ký, và chỉ mở từ ngày một tháng một năm sau. Thêm một nhánh "huỷ két trước hạn, cần đủ ba chữ ký" để redeemer có việc làm. Đây là **ví dụ minh hoạ**, không phải hợp đồng có sẵn trong hydra-sdk hay trên mạng.

## Nguồn tham khảo

- Tài liệu hydra-sdk: `apps/docs-v2/content/en/3.concepts/5.smart-contracts-in-hydra.md` (script dùng y nguyên trong Hydra Head; ví dụ khoá và mở khoá; datum mẫu gồm mã khoá và mốc thời gian dựng bằng `DatumUtils.mkConstr`, `mkBytes`, `mkInt`; cảnh báo về luật dựa vào thời gian trong Head).
- Code hydra-sdk:
  - `packages/core/src/utils/datum.ts` — `DatumUtils`: `mkInt`, `mkBytes`, `mkConstr`, `mkMap`, `mkList`, `mkBool`, `mkOption`, `mkBytesList`, `mkIntList`, `mkOutputRef`, `mkAddress`, `parseAddress`.
  - `packages/core/src/utils/plutus-script.util.ts` — `PlutusUtils`: `applyParamsToScript`, `validatorToScriptHash`, `validatorToAddress`, `mintingPolicyToId`.
  - `packages/core/src/utils/redeemer.ts` — `RedeemerUtils`: `mkRedeemer`, `mkSpendRedeemer`, `mkMintRedeemer`, `mkUnitRedeemer` (ví dụ trong chú thích: `DatumUtils.mkConstr(1, [])` làm redeemer `Cancel`).
  - `packages/core/src/index.ts` — cả ba được xuất từ `@hydra-sdk/core`.
  - `packages/hydra-transaction/src/tx-builder/index.ts` — `txInScript`, `txInInlineDatum`, `txInRedeemerValue`, `txInCollateral`, `txOutInlineDatumValue`, `invalidBefore`, `invalidAfter`, `requiredSignerHash`; `complete()` chạy thử script qua `evaluator` (nếu được truyền vào) để lấy chi phí thực thi rồi dựng lại giao dịch cho đúng phí. Không có `evaluator` (như khi dựng cho Hydra) thì không chạy thử.
  - `apps/nodejs-playground/src/contract/apply-params-to-script.ts` — ví dụ `applyParamsToScript` + `validatorToAddress` + `mintingPolicyToId`.
- Nguồn ngoài (cho ý "biết trước giao dịch hợp lệ" và khoá thời gian):
  - IOG, "No surprises: transaction validation on Cardano" — https://www.iog.io/news/no-surprises-transaction-validation-on-cardano
  - Cardano Docs, "Transaction costs and determinism" — https://docs.cardano.org/about-cardano/learn/transaction-costs-determinism
  - Cardano Developer Portal, "EUTXO" — https://developers.cardano.org/docs/learn/core-concepts/eutxo
  - Plutus Pioneer Program, tuần 3 "Script Context" (script không đọc giờ hiện tại, chỉ đọc khoảng hiệu lực của giao dịch) — https://plutus-pioneer-program.readthedocs.io/en/latest/pioneer/week3.html
  - Native script (`sig`, `all`, `any`, `atLeast`, `after`, `before`): ngữ pháp trong CIP-1854 và tài liệu simple scripts của cardano-node; tóm tắt tại https://pycardano.readthedocs.io/en/latest/api/pycardano.nativescript.html

## Ranh giới sự thật

Được nói (đã đối chiếu):

- Trên Cardano, ổ khoá của một món tiền có thể là chữ ký (hash khoá công khai) hoặc script.
- Hai luật "hai trong ba chữ ký" và "chỉ mở sau một thời điểm" làm được bằng **native script** (`atLeast` + `after`), không cần viết chương trình Plutus. Kịch bản nói điều này ở cảnh 03 để không ngầm bảo rằng hai luật đó bắt buộc phải dùng hợp đồng thông minh.
- Một script Plutus khi mở món tiền nhận vào datum, redeemer và ngữ cảnh giao dịch (toàn bộ giao dịch: đầu vào, đầu ra, chữ ký yêu cầu, khoảng hiệu lực…), rồi trả về hợp lệ hoặc thất bại.
- Datum gắn vào món tiền lúc khoá, đi cùng món tiền; nhiều món ở cùng địa chỉ script có thể mang datum khác nhau.
- Redeemer do người tiêu đưa vào giao dịch; dùng để chọn nhánh luật (ví dụ `Cancel` trong chú thích `RedeemerUtils`).
- Script không đọc được giờ hiện tại; giao dịch ghi khoảng hiệu lực (`invalidBefore` / `invalidAfter`), mạng chỉ chấp nhận khi thời điểm thật nằm trong khoảng đó, script so khoảng ấy với mốc trong datum.
- Vì script chỉ phụ thuộc giao dịch và các món tiền nó chỉ đích danh, ví chạy thử được trước khi gửi và kết quả khớp với mạng; giao dịch hỏng ở bước này thì không gửi, không mất phí.
- Ngoại lệ: món tiền đầu vào đã bị người khác tiêu trước. Giao dịch bị từ chối ở vòng kiểm tra đầu (phase 1), script không chạy, không mất phí.
- Ở mô hình tài khoản (như Ethereum), kết quả phụ thuộc trạng thái chung lúc giao dịch được xử lý; giao dịch thất bại vẫn tốn phí gas.
- Script trong Hydra Head chạy như trên mạng chính, dùng cùng datum và redeemer (docs-v2, "Smart Contracts in Hydra"); luật dựa vào thời gian cần kiểm tra lại vì mốc slot trong Head được cấu hình riêng (`SLOT_CONFIG.zeroTime` là lúc mở Head).
- API trong cảnh 11–12 đúng tên hàm hiện có ở `@hydra-sdk/core` và `@hydra-sdk/transaction`.

Đơn giản hoá có chủ ý (không nói sai, nhưng lược bớt):

- "Script nhận ba thứ": ở Plutus V3 datum là tham số tuỳ chọn (`Option<Data>`), và về kỹ thuật cả ba được gói trong một ngữ cảnh; kịch bản tách ba thứ cho dễ hiểu.
- "Ngày" thay cho slot; bỏ qua quy đổi thời gian sang slot.
- "Chạy thử trên máy bạn": cần ví hoặc công cụ có bộ chạy thử (evaluator) và đúng tham số giao thức. Kịch bản không hứa mọi ví đều làm điều này.
- Không nói về tiền thế chấp (collateral) ở phần cho người xem phổ thông. Cảnh 12 có một câu riêng giải thích nó là món tiền "phòng khi script chạy lỗi sau khi giao dịch đã được gửi đi". Sự thật đầy đủ: nếu một giao dịch được gửi lên mà script thất bại (phase 2), mạng thu món tiền thế chấp thay cho phí.
- "Kiểm tra xem giao dịch có đủ hai chữ ký hợp lệ trong danh sách" (câu 07-1): script so danh sách người ký yêu cầu (`extra_signatories`, tức `requiredSignerHash` trong TxBuilder) với danh sách trong datum; việc chữ ký có thật sự hợp lệ là do mạng kiểm tra ở phase 1, trước khi script chạy.
- Không nhắc chi phí thực thi (ExUnits), reference script, minting policy.

Không dùng:

- `ValidatorUtils`: tên dễ gây hiểu nhầm, nhưng thực ra chỉ kiểm tra địa chỉ và đầu ra, đã bị đánh dấu deprecated (`packages/core/src/index.ts`). Phần lập trình viên dùng `DatumUtils`, `RedeemerUtils`, `PlutusUtils`.
- Native script trong hydra-sdk: `PolicyUtils` chỉ dựng native script một chữ ký (`sig`) cho minting policy; SDK chưa có hàm dựng `atLeast`/`after`. Vì vậy cảnh 03 không gắn native script với hydra-sdk.
- Số liệu về phí, tốc độ, số hợp đồng trên mạng.

## Thuật ngữ mới cần chốt cách đọc

Chưa ghi vào `promo/shared/tu-dien-doc.md` (phiên này không được sửa file chung). `script.py` dùng các cách đọc đề xuất dưới đây chỉ để đếm âm tiết; khi chủ sản phẩm chọn xong, phiên quản lý chuỗi ghi vào từ điển chung.

| Từ | (1) Đọc nguyên văn | (2) Phiên âm đề xuất | (3) Thay bằng từ Việt | Ghi chú |
|---|---|---|---|---|
| redeemer | redeemer | ri đi mơ | tờ đơn mở khoá | Đề xuất (2) cho lời đọc; ẩn dụ "tờ đơn" dùng song song |
| Plutus | Plutus | Plu tớt | — | Tên ngôn ngữ/nền tảng hợp đồng của Cardano |
| Plutus Data | Plutus Data | Plu tớt đây ta | kiểu dữ liệu Plutus | |
| DatumUtils | DatumUtils | đa từm iu tiu | — | Ghép từ "datum" đã chốt |
| RedeemerUtils | RedeemerUtils | ri đi mơ iu tiu | — | Phụ thuộc cách đọc "redeemer" |
| PlutusUtils | PlutusUtils | Plu tớt iu tiu | — | |
| core | core | co | gói lõi | Tên gói `@hydra-sdk/core`, đọc "gói co của hai dra ét đi cây" |
| byte | byte | bai | — | Trong cụm "chuỗi byte" (cảnh 11) |
| Native script | — | — | ổ khoá đơn giản | Chỉ viết trên bảng, lời đọc dùng từ Việt |

### Dạng viết hoa cần thêm vào từ điển chung

`lexicon.py` so khớp có phân biệt hoa thường, nên một từ đứng đầu câu (viết hoa chữ đầu) sẽ không được phiên âm. Kịch bản tập 5 đã viết lại để không câu nào bắt đầu bằng các từ này, nhưng để an toàn cho cả chuỗi, phiên chính nên thêm các dòng sau vào `promo/shared/tu-dien-doc.md` (cùng cách đọc và trạng thái với dạng thường):

| Dạng viết hoa | Cách đọc | Trạng thái theo dạng gốc |
|---|---|---|
| Datum | đa từm | đã chốt |
| Script | scờ ríp | đã chốt |
| Token | tốc cừn | đã chốt |
| Blockchain | Bờ lốc chên | đã chốt |
| Lovelace | lớp lây | đề xuất |
| Redeemer | ri đi mơ | đề xuất (mới ở tập này) |
| Byte | bai | đề xuất (mới ở tập này) |
| Core | co | đề xuất (mới ở tập này) |

Các tên riêng viết hoa sẵn (`DatumUtils`, `RedeemerUtils`, `PlutusUtils`, `Plutus`, `Plutus Data`) không cần thêm dạng khác. Các thuật ngữ mới của tập này đã được phiên chính ghi vào `tu-dien-doc.md` (trạng thái `đề xuất`), và `lexicon.py` nay tự khớp dạng viết hoa đầu câu, nên `script.py` không còn danh sách `PROPOSED` riêng.
