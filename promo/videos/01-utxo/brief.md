# Tập 1 — UTxO là gì?

## Brief

| Mục | Quyết định |
|---|---|
| Chuỗi | Kiến thức nền Cardano và Hydra, đồng thời giới thiệu hydra-sdk |
| Thể loại | Giải thích khoa học |
| Phong cách | Vẽ tay trên bảng đen: nét trắng như phấn trên nền đen, hình hiện dần như đang được vẽ; tham khảo ratiostudio-lab.com |
| Lời đọc | Tiếng Việt, không có phụ đề chạy ở đáy; chữ trên màn hình chỉ là chữ được "viết" lên bảng |
| Khung hình | 16:9, 1920×1080 |
| Âm thanh | Giọng đọc + nền và hiệu ứng tự tổng hợp |
| Khán giả | Người chưa biết gì về blockchain; thêm một đoạn ngắn dành riêng cho lập trình viên (cảnh 13–15) |
| Độ dài | Khoảng 5–6 phút |
| Cuối video | hydrasdk.com, kèm dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc, không đọc thành lời |

**Cụm thay cho "đầu ra chưa tiêu":** dùng **"món tiền chưa tiêu"** (đang chờ chủ sản phẩm chốt). Khi UTxO chứa cả token thì vẫn gọi là "món tiền" để giữ một tên duy nhất suốt video. Thuật ngữ gốc "Unspent Transaction Output" chỉ hiện trên bảng, không đọc thành lời.

## Nguồn tham khảo

- Bài giảng MIT OpenCourseWare "Transactions and the UTXO model" (Neha Narula), ghi chép tại [`promo/knowledge/transaction-and-the-utxo-model-MIT-opencourseware-Neha-Narula.md`](../../knowledge/transaction-and-the-utxo-model-MIT-opencourseware-Neha-Narula.md).
- Code hydra-sdk: `packages/core/src/types/cardano/utxo.ts` (kiểu `UTxOObject`), `packages/hydra-transaction/src/tx-builder/index.ts` (`setInputs` nhận `UTxO[]` và chọn món theo chiến lược, `changeAddress`; `setInputUtxo` nhận `UTxOObject` hiện vẫn là TODO nên video không giới thiệu).

Những gì kịch bản lấy từ bài giảng:

- Động cơ của mô hình UTxO: lỗ hổng gửi lại lệnh cũ (replay attack) trong mô hình tài khoản; Ethereum chặn bằng số thứ tự lệnh theo từng tài khoản (nonce) mà mọi nút phải nhớ; UTxO chặn tự nhiên vì mỗi đầu ra chỉ tiêu được một lần (cảnh 03, 09).
- Mỗi "đồng xu" là một đầu ra cụ thể, không thể thay thế cho nhau; muốn tiêu phải chỉ đích danh (cảnh 06, 08).
- Đầu ra mang điều kiện khoá (scriptPubKey), đầu vào mang lời giải mở khoá (scriptSig); "có tiền" nghĩa là biết thông tin để mở được các đầu ra, mạng lưới không theo dõi số dư, ví mới làm việc đó (cảnh 07, 10).
- Một giao dịch có thể có nhiều đầu vào, nhiều đầu ra (cảnh 08).
- Mã giao dịch là hash của giao dịch; sửa bất kỳ bit nào thì hash đổi và chữ ký không còn hợp lệ (cảnh 12).
- Giá trị là số nguyên theo đơn vị nhỏ nhất (satoshi ở Bitcoin; lovelace ở Cardano) (cảnh 13).
- Mọi nút giữ tập UTxO và cập nhật theo từng khối để kiểm tra tiêu hai lần nhanh (cảnh 10).
- Cái giá của mô hình: ví phải tự chọn đầu ra và tạo tiền thối đúng cách (cảnh 15).

Không đưa vào: chi tiết Bitcoin Script (P2PKH, opcode), giao dịch coinbase, số liệu kích thước tập UTxO năm 2018, chuyện quyền riêng tư và tính thay thế (fungibility). Cardano không có giao dịch coinbase như Bitcoin nên phần "tiền mới sinh ra từ đâu" để dành cho tập khác.

## Ranh giới sự thật

Được nói (đã đối chiếu):

- Ngân hàng và Ethereum dùng mô hình tài khoản (một con số số dư cho mỗi tài khoản); Bitcoin và Cardano dùng mô hình UTxO.
- Ethereum chống gửi lại giao dịch bằng nonce theo từng tài khoản, lưu trong trạng thái của mạng; lời đọc nói "đếm số thứ tự giao dịch của từng tài khoản".
- Khoá bí mật không bao giờ rời ví; giao dịch chỉ kèm chữ ký (witness). Ẩn dụ của chuỗi: khoá bí mật là chìa, chữ ký là bằng chứng có chìa (thống nhất với tập 4, theo review của agy).
- Mỗi UTxO mang một điều kiện khoá: trên Cardano là phần thông tin thanh toán của địa chỉ, có thể là hash khoá công khai (cần chữ ký) hoặc script (hợp đồng thông minh, có thể đọc datum).
- hydra-sdk `TxBuilder.setInputs(utxos)` nhận danh sách UTxO (`UTxO[]`), tự chọn món theo chiến lược (mặc định `LargestFirstMultiAsset`) và thêm đầu ra tiền thối về `changeAddress`. `setInputUtxo(UTxOObject)` chưa hoạt động (TODO), nên lời đọc cảnh 15 nói "danh sách món tiền" thay vì "UTxO Object".
- Bitcoin dùng mô hình UTxO từ khi ra đời năm 2009.
- Một giao dịch tiêu trọn các UTxO đầu vào và tạo ra các UTxO đầu ra mới; phần dư quay về người gửi dưới dạng tiền thối (change).
- Mỗi UTxO chỉ tiêu được một lần; mạng kiểm tra UTxO còn trong tập chưa tiêu và người tiêu đáp ứng điều kiện (chữ ký, hoặc điều kiện của script).
- Trạng thái sổ cái là tập các UTxO chưa tiêu; số dư ví là tổng các UTxO ở địa chỉ của ví.
- Cardano dùng eUTxO (Extended UTxO): một UTxO chứa ADA cùng nhiều loại native token, và có thể mang datum.
- Mã giao dịch là chuỗi 64 ký tự hex (băm 32 byte); đầu ra đánh số từ 0; tham chiếu dạng `txHash#index`.
- 1 ADA = 1.000.000 lovelace.
- Hydra Head dùng cùng mô hình sổ cái eUTxO như mạng chính Cardano; UTxO được đưa (commit) vào Head và tiếp tục được giao dịch bên trong.
- Định dạng `UTxOObject` khớp code: `packages/core/src/types/cardano/utxo.ts` — `Record<"txHash#index", { address, value, datum, datumhash, inlineDatum, inlineDatumRaw?, referenceScript }>`, `value` gồm `lovelace` và `{ policyId: { assetNameHex: số lượng } }`.

Đơn giản hoá có chủ ý (không nói sai, nhưng lược bớt):

- "Tổng vào = tổng ra + phí": bỏ qua trường hợp đúc/đốt token, rút thưởng staking, tiền cọc. Ở Bitcoin phí là phần chênh lệch ngầm định; ở Cardano phí được ghi rõ trong giao dịch và hai vế phải cân bằng đúng — câu đọc đúng cho cả hai.
- "Mỗi máy trong mạng giữ danh sách món tiền chưa tiêu": đúng với các nút đầy đủ (full node); ví nhẹ thì hỏi qua dịch vụ khác.
- "Người đem tiêu có đúng là chủ không": gộp chữ ký và điều kiện script làm một.
- Không nhắc lượng ADA tối thiểu bắt buộc trong mỗi UTxO.

Số liệu minh hoạ, không phải giao dịch thật (cần ghi rõ với người duyệt):

- Ví dụ cà phê: 50 ADA → 30 ADA cho người bán + 19,83 ADA tiền thối + 0,17 ADA phí. Mức phí 0,17 ADA nằm trong khoảng phí thường gặp của một giao dịch đơn giản.
- Mã giao dịch hiển thị là chuỗi rút gọn dựng lại (`a1b2…f9`), không phải giao dịch thật.

Không nói ở tập này: Hydra nhanh bao nhiêu, phí Hydra, số liệu hiệu năng — để dành cho tập Hydra, cần nguồn đo được.
