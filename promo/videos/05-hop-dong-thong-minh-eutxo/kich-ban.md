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

## Kịch bản

Không có phụ đề chạy; cột "Chữ trên bảng" là chữ được viết lên bảng trong cảnh. Số âm tiết đếm sau khi phiên âm theo từ điển đọc.

| Cảnh | Chữ trên bảng | Lời đọc | Số âm tiết | Trên màn hình | Âm thanh |
|---|---|---|---|---|---|
| **01. Mở đầu**<br>~21 giây | `Ổ khoá biết suy nghĩ?` | 01-0: Ở tập một, ta đã thấy mỗi món tiền chưa tiêu đều mang theo một ổ khoá.<br>01-1: Thường thì ổ khoá ấy chỉ hỏi đúng một câu, đây có phải chữ ký của chủ hay không.<br>01-2: Nhưng trên Cardano, ổ khoá còn làm được nhiều hơn. Nó biết đọc, biết tính, rồi tự quyết định.<br>01-3: Hôm nay ta sẽ mở chiếc ổ khoá biết suy nghĩ ấy ra, xem bên trong có những gì. | 17<br>19<br>21<br>19 | Gợi lại hình cuối tập 1: ô UTxO vàng phấn có ổ khoá bánh răng. Camera tiến lại gần ổ khoá, bánh răng bắt đầu quay. Chữ "Ổ khoá biết suy nghĩ?" viết chậm phía trên. | Nền vào dần. Tiếng phấn. Tiếng bánh răng nhỏ khi ổ khoá bắt đầu quay. |
| **02. Chiếc két chung**<br>~21 giây | `An · Bình · Chi`<br>`Luật 1: 2 trong 3 người ký`<br>`Luật 2: mở từ 01/01 năm sau` | 02-0: Hãy hình dung ba anh em An, Bình và Chi cùng góp tiền vào một chiếc két chung.<br>02-1: Họ đặt ra hai luật. Thứ nhất, phải có ít nhất hai trong ba người đồng ý thì két mới mở.<br>02-2: Thứ hai, két chỉ được mở từ ngày một tháng một năm sau trở đi.<br>02-3: Ngoài đời, muốn giữ đúng hai luật này thì cần một người giữ két đáng tin. Trên blockchain thì sao? | 18<br>21<br>15<br>22 | Chiếc két vẽ phấn ở giữa, ba hình người nhỏ mang tên An, Bình, Chi. Hai luật viết lần lượt bên phải. Cuối cảnh: một hình người giữ két hiện ra rồi bị gạch, thay bằng dấu hỏi. | Tiếng phấn; tiếng gạch khi người giữ két bị gạch. |
| **03. Ổ khoá đơn giản và ổ khoá biết suy nghĩ**<br>~24 giây | `Native script`<br>`đếm chữ ký · so thời gian`<br>`Hợp đồng thông minh = chương trình canh tiền` | 03-0: Với hai luật đơn giản như vậy, Cardano có sẵn một loại ổ khoá ghép được mà không cần viết chương trình.<br>03-1: Loại ổ này chỉ biết vài việc như đếm chữ ký và so thời gian, nhưng ghép lại thì đủ cho chiếc két.<br>03-2: Còn khi luật phức tạp hơn, như mỗi người được rút bao nhiêu, ta cần một ổ khoá thật sự biết suy nghĩ.<br>03-3: Đó là hợp đồng thông minh, một chương trình nhỏ đứng canh món tiền, gọi là script. | 24<br>23<br>23<br>18 | Bên trái: ổ khoá ghép từ vài khối nhỏ (chữ ký ×3, "≥ 2", đồng hồ cát), nhãn nhỏ "Native script". Bên phải: ổ khoá bánh răng lớn, nhãn "Hợp đồng thông minh". Mũi tên từ luật phức tạp chỉ sang ổ bánh răng. | Tiếng "tick" khi từng khối ghép vào; tiếng bánh răng khi ổ bên phải hiện ra. |
| **04. Ba thứ đi vào ổ khoá**<br>~23 giây | `Datum`<br>`Redeemer`<br>`Giao dịch`<br>`Có / Không` | 04-0: Mỗi lần có người muốn mở món tiền, script nhận vào ba thứ.<br>04-1: Thứ nhất là datum, mẩu dữ liệu được gắn sẵn trên món tiền từ lúc khoá.<br>04-2: Thứ hai là redeemer, thứ mà người muốn mở mang đến và đưa vào.<br>04-3: Thứ ba là chính giao dịch đang muốn tiêu món tiền, với đủ đầu vào, đầu ra và chữ ký.<br>04-4: Từ ba thứ đó, script chỉ trả lời đúng một câu, có hoặc không. | 14<br>17<br>16<br>20<br>15 | Ổ khoá bánh răng ở giữa. Ba mũi tên đi vào từ ba phía: tờ ghi chú xanh lam (datum), tờ đơn hồng (redeemer), khối "Giao dịch" trắng. Phía dưới ổ khoá: hai ô "Có" và "Không". | Ba tiếng "tick" khi ba thứ lần lượt đi vào; tiếng bánh răng. |
| **05. Datum — tờ ghi chú trên cửa két**<br>~22 giây | `Người ký: An, Bình, Chi`<br>`Cần: 2 chữ ký`<br>`Mở từ: 01/01 năm sau` | 05-0: Quay lại chiếc két, datum giống như một tờ ghi chú dán trên cửa két.<br>05-1: Trên đó ghi tên ba người có quyền ký, số chữ ký cần có là hai, và ngày được mở.<br>05-2: Tờ ghi chú được dán lúc khoá tiền, rồi nằm yên cùng món tiền cho đến khi nó được tiêu.<br>05-3: Nhờ vậy, một ổ khoá có thể canh hàng nghìn chiếc két, mỗi két mang một tờ ghi chú khác nhau. | 16<br>20<br>20<br>21 | Tờ ghi chú xanh lam dán lên cửa két, ba dòng viết dần. Cuối cảnh: camera lùi xa, nhiều chiếc két cùng một kiểu ổ khoá, mỗi két một tờ ghi chú khác. | Tiếng giấy dán; tiếng phấn theo từng dòng. |
| **06. Redeemer — tờ đơn xin mở**<br>~23 giây | `Rút theo hạn → 2 chữ ký`<br>`Huỷ trước hạn → 3 chữ ký` | 06-0: Còn redeemer là thứ người mở mang đến, giống như tờ đơn nộp kèm khi xin mở két.<br>06-1: Ví dụ, tờ đơn có thể ghi là rút tiền theo hạn, hoặc là huỷ két trước hạn.<br>06-2: Ổ khoá đọc tờ đơn để biết phải áp dụng luật nào. Rút theo hạn cần hai chữ ký, huỷ trước hạn cần đủ cả ba.<br>06-3: Redeemer không phải chìa khoá. Nó chỉ cho ổ khoá biết bạn đang xin điều gì. | 20<br>18<br>26<br>18 | Tờ đơn hồng đưa vào khe ổ khoá. Hai nhánh đường ray rẽ ra bên trong ổ: "Rút theo hạn" và "Huỷ trước hạn", nhánh được chọn sáng lên. | Tiếng giấy trượt vào khe; tiếng "cạch" khi bẻ ghi sang một nhánh. |
| **07. Bình và Chi mở két**<br>~25 giây | `Đơn: rút theo hạn`<br>`Chữ ký: Bình ✓ Chi ✓`<br>`Hợp lệ từ: 02/01`<br>`Có` | 07-0: Giờ Bình và Chi muốn rút tiền. Họ tạo một giao dịch, nộp đơn rút theo hạn, và cả hai cùng ký.<br>07-1: Đầu tiên, script đọc tờ ghi chú, rồi kiểm tra xem giao dịch có đủ hai chữ ký hợp lệ trong danh sách hay không.<br>07-2: Tiếp theo, script xem ngày. Giao dịch này chỉ có hiệu lực từ ngày mồng hai tháng một, tức là đã qua hạn.<br>07-3: Cả hai điều kiện đều đạt, nên script trả lời có, và món tiền được mở ra. | 22<br>26<br>24<br>18 | Khối giao dịch đi vào ổ khoá mang tờ đơn hồng và hai chữ ký. Bên trong ổ: hai dấu tích lần lượt hiện cạnh "2 chữ ký" và "ngày". Ổ bật mở, món tiền vàng phấn đi ra hai phần cho Bình và Chi. Ghi chú nhỏ "ví dụ minh hoạ". | Hai tiếng "tick" cho dấu tích; tiếng "cạch" khi ổ mở; nốt chuông nhẹ. |
| **08. Ổ khoá không có đồng hồ**<br>~22 giây | `Script không xem đồng hồ`<br>`Hợp lệ từ … đến …`<br>`So với ngày trên tờ ghi chú` | 08-0: Khoan đã, làm sao ổ khoá biết hôm nay là ngày nào?<br>08-1: Câu trả lời là nó không biết, vì script trên Cardano không được phép xem đồng hồ.<br>08-2: Thay vào đó, mỗi giao dịch tự ghi rằng nó chỉ có hiệu lực trong một khoảng thời gian nhất định.<br>08-3: Mạng lưới chỉ nhận giao dịch khi thời điểm thật nằm trong khoảng đó, nên script chỉ việc so khoảng ấy với ngày trên tờ ghi chú. | 12<br>20<br>21<br>28 | Một chiếc đồng hồ phấn bên cạnh ổ khoá bị gạch chéo. Trên khối giao dịch hiện một thanh thời gian "từ 02/01 đến 03/01". Thanh này được đặt cạnh tờ ghi chú "Mở từ 01/01" để so. | Tiếng tích tắc ngắn rồi tắt khi đồng hồ bị gạch. |
| **09. Biết trước khi gửi**<br>~24 giây | `Datum + Redeemer + Giao dịch`<br>`Chạy thử trên máy bạn`<br>`Kết quả giống mạng lưới`<br>`Hỏng → không gửi, không mất phí` | 09-0: Điều đáng giá nằm ở chỗ này. Thứ mà script nhìn vào chỉ có datum, redeemer và giao dịch, ngoài ra không còn gì khác.<br>09-1: Mà cả ba thứ này đều đã nằm trong tay bạn trước khi bạn bấm gửi.<br>09-2: Vì thế, ví có thể chạy thử ổ khoá ngay trên máy bạn, và kết quả sẽ giống khi mạng lưới chạy.<br>09-3: Ổ không mở thì ví báo ngay. Bạn sửa lại hoặc thôi không gửi, chẳng mất đồng phí nào. | 29<br>16<br>22<br>19 | Ba thứ (ghi chú, đơn, giao dịch) gom vào một chiếc laptop phấn, bên trong có bản sao ổ khoá chạy thử. Mũi tên nối sang mạng lưới, cùng một ổ khoá cho cùng kết quả. Nhánh "Không": giao dịch quay về, không đi lên mạng. | Tiếng bánh răng nhỏ trong laptop; nốt chuông khi hai kết quả khớp nhau. |
| **10. Còn bất ngờ nào không?**<br>~23 giây | `Mô hình tài khoản: hỏng vẫn mất phí`<br>`eUTxO: món tiền đã bị tiêu trước`<br>`Từ chối ngay, không mất phí` | 10-0: Ở mô hình tài khoản, giao dịch chạy trên trạng thái chung lúc nó được xử lý, có thể đã khác lúc bạn thử.<br>10-1: Vì thế có lúc giao dịch thất bại mà phí vẫn bị trừ.<br>10-2: Trên Cardano, chỉ còn một tình huống bất ngờ, đó là có người đã tiêu món tiền ấy trước bạn.<br>10-3: Khi đó giao dịch bị từ chối ngay ở vòng kiểm tra đầu tiên, script không cần chạy, và bạn cũng không mất phí. | 24<br>13<br>22<br>25 | Bên trái: sổ cái tài khoản, giao dịch đi vào thì số trong sổ đã đổi, giao dịch hỏng nhưng vẫn rơi một đồng phí. Bên phải: hai giao dịch cùng nhắm một món tiền, một cái tới trước, cái sau bị đóng dấu "Từ chối" trước khi tới ổ khoá, đồng phí vẫn ở lại ví. | Tiếng đồng xu rơi ở bên trái; một tiếng trầm ngắn khi bị từ chối ở bên phải. |
| **11. DatumUtils — cho lập trình viên**<br>~28 giây | `import { DatumUtils, RedeemerUtils } from '@hydra-sdk/core'`<br>`const datum = DatumUtils.mkConstr(0, [`<br>`  DatumUtils.mkBytesList([an, binh, chi]),`<br>`  DatumUtils.mkInt(2),`<br>`  DatumUtils.mkInt(unlockAt)`<br>`])`<br>`const redeemer = RedeemerUtils.mkSpendRedeemer(`<br>`  DatumUtils.mkConstr(0, [])  // Rút theo hạn`<br>`)` | 11-0: Phần này dành cho lập trình viên. Trên Cardano, datum và redeemer dùng chung một kiểu dữ liệu, gọi là Plutus Data.<br>11-1: Trong gói core của hydra-sdk, DatumUtils giúp bạn dựng kiểu dữ liệu này từ số, chuỗi byte và danh sách.<br>11-2: Ví dụ, tờ ghi chú của chiếc két là một cấu trúc gồm ba mã khoá, con số hai và mốc thời gian được mở.<br>11-3: Redeemer cũng dựng bằng DatumUtils, rồi RedeemerUtils gói nó lại để gắn vào giao dịch. | 29<br>27<br>25<br>24 | Đoạn code viết tay bằng phấn, từng dòng hiện theo lời đọc. Dòng datum có tờ ghi chú xanh lam nhỏ bên cạnh, dòng redeemer có tờ đơn hồng. Góc trên: nhãn nhỏ "@hydra-sdk/core". Code minh hoạ, cấu trúc datum tuỳ hợp đồng. | Tiếng gõ phấn nhanh theo từng dòng code. |
| **12. PlutusUtils và TxBuilder — cho lập trình viên**<br>~30 giây | `PlutusUtils.applyParamsToScript(…)`<br>`PlutusUtils.validatorToAddress(…)`<br>`.txInScript(…)`<br>`.txInInlineDatum(…)`<br>`.txInRedeemerValue(…)`<br>`.txInCollateral(…)`<br>`.invalidBefore(slot)` | 12-0: Còn PlutusUtils làm việc với chính chiếc ổ khoá đã được biên dịch.<br>12-1: Nó gắn tham số vào script, tính mã băm của script, và suy ra địa chỉ để bạn gửi tiền vào khoá.<br>12-2: Khi mở khoá, TxBuilder nhận script, datum, redeemer, và khoảng thời gian có hiệu lực của giao dịch.<br>12-3: Nó còn cần thêm một món tiền thế chấp, phòng khi script chạy lỗi sau khi giao dịch đã được gửi đi.<br>12-4: Nếu bạn cấp cho nó một bộ chạy thử, TxBuilder sẽ chạy script trước để tính phí cho chính xác. | 16<br>24<br>25<br>23<br>24 | Hai dòng PlutusUtils bên trái, mũi tên từ ổ khoá bánh răng ra một địa chỉ "addr_test1…". Bên phải chuỗi phương thức TxBuilder viết dần, mỗi dòng gắn biểu tượng tương ứng (bánh răng, ghi chú, đơn, đồng xu thế chấp, thanh thời gian). Nhãn nhỏ "@hydra-sdk/core · @hydra-sdk/transaction". | Tiếng gõ phấn; nốt chuông khi chuỗi phương thức viết xong. |
| **13. Cùng ổ khoá trong Hydra Head**<br>~20 giây | `Cardano (lớp 1)`<br>`Hydra Head (lớp 2)`<br>`Cùng script · cùng datum · cùng redeemer`<br>`Luật thời gian: kiểm tra lại` | 13-0: Cũng chiếc ổ khoá ấy có thể chạy trong một Hydra Head, với cùng datum và cùng redeemer.<br>13-1: Bạn không phải sửa dòng nào trong script, vì Hydra dùng chung mô hình eUTxO với mạng chính.<br>13-2: Riêng những luật dựa vào thời gian thì nên kiểm tra kỹ, vì mốc thời gian trong Hydra Head được tính theo cách riêng. | 22<br>24<br>25 | Đường kẻ ngang: dưới là Cardano, trên là vòng tròn "Hydra Head". Chiếc két với ổ khoá bánh răng đi lên vào vòng tròn, vẫn nguyên tờ ghi chú. Thanh thời gian bên cạnh có dấu chấm than nhỏ. | Nền chuyển hợp âm sang phần kết. |
| **14. Tóm tắt và lời kết**<br>~27 giây | `1. Datum: ghi chú trên món tiền`<br>`2. Redeemer: đơn của người mở`<br>`3. Script: luật, chạy thử được trước`<br>`hydrasdk.com`<br>`Thực hiện cùng VTechcom Labs` | 14-0: Tóm lại, qua tập này bạn chỉ cần nhớ ba ý chính.<br>14-1: Thứ nhất, datum là tờ ghi chú gắn trên món tiền, nói luật của nó áp dụng cho ai và khi nào.<br>14-2: Thứ hai, redeemer là tờ đơn của người muốn mở, cho ổ khoá biết họ đang xin điều gì.<br>14-3: Thứ ba, script là luật quyết định mở hay không, và bạn chạy thử được trước khi gửi.<br>14-4: Bạn có thể xem thêm tài liệu và ví dụ về hợp đồng thông minh tại hydrasdk.com. | 12<br>23<br>21<br>19<br>23 | Ba ý viết lần lượt, mỗi ý kèm biểu tượng màu nhấn của nó. Cuối: "hydrasdk.com" ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" kèm logo ở góc dưới phải, không đọc thành lời. | Một nốt chuông cho mỗi ý; nền ra dần trong 2 giây cuối. |

**Tổng:** 58 câu, 1208 âm tiết, ước lượng khoảng 5 phút 33 giây (tính 4.2 âm tiết/giây, cộng nghỉ giữa câu và giữa cảnh).
