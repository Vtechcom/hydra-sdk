# Câu hỏi chờ chủ sản phẩm — tập 07–12

Kịch bản 6 tập mới đang chạy theo phương án mặc định. Trả lời theo mã, ví dụ "7.1 bỏ, 8.3 giữ". Chi tiết từng câu nằm ở mục "Câu hỏi cho chủ sản phẩm" trong `brief.md` của tập đó.

## Câu hỏi theo tập

| Mã | Câu hỏi | Mặc định đang dùng |
|---|---|---|
| 7.1 | Cảnh 14 nói về `FeeUtils` và `@hydra-sdk/evaluator`, hai thứ có trong master nhưng chưa phát hành npm | Giữ, dán nhãn "ĐANG HOÀN THIỆN"; cảnh viết độc lập để bỏ được |
| 7.2 | Nhắc trang Fee Lab của playground? | Không, chờ xác nhận trang đã chạy |
| 7.3 | Hiện con số 168.581 lovelace trên bảng? | Có |
| 8.1 | Policy ID gọi là "mã chính sách" như tập 1? | Giữ |
| 8.2 | Đọc con số lượng ADA tối thiểu (khoảng 1,2 ADA)? | Không |
| 8.3 | Giữ cảnh báo "token đúc trong Head phải đốt trước khi đóng"? | Giữ |
| 8.4 | Giữ cảnh luật Plutus one-shot (NFT duy nhất không cần tin ai)? | Giữ |
| 9.1 | Tên tập "Khối, đồng thuận và staking: ai được ghi sổ Cardano?" | Dùng tên này |
| 9.2 | Nhắc điều kiện uỷ thác cho DRep mới rút được thưởng? | Chỉ chữ nhỏ trên bảng, không đọc |
| 9.3 | Nêu mốc k = 2160 khối hay 12 giờ? | Không nêu |
| 9.4 | Nhắc `TxBuilder.delegateStake`? | Chỉ nhãn nhỏ, chờ sửa lỗi SDK bên dưới |
| 10.1 | Danh sách tình huống phù hợp | 3 tình huống: trò chơi, thanh toán vi mô, đấu giá (đã bỏ "đối tác cả tháng" theo agy) |
| 10.2 | Nêu tên dự án có thật (trò chơi trên alpha.hydraone.app, Hydra Doom)? | Không |
| 10.3 | Nhắc `@hydra-sdk/app-bridge` ở tập 10? | Không (tập 12 có nhắc) |
| 11.1 | Giới thiệu `submitL2Tx`? | Một câu ở cảnh 10, nhãn "bridge 2.x" |
| 11.2 | Đọc tên lỗi sổ cái (`BadInputsUTxO`…)? | Không, chỉ viết trên bảng |
| 12.1 | Giới thiệu `@hydra-sdk/app-bridge` 0.1.0? | Có, kèm nhãn phiên bản, không nhắc HydraOne |
| 12.2 | Tiêu đề "phần 2" hay "Ba cái bẫy khi dùng ví: trang giả, ký mù và token lạ"? | Giữ "phần 2" kèm tên phụ |
| 12.3 | Ví phần cứng: nêu tên hãng? | Không |

## Câu hỏi chung

| Mã | Câu hỏi | Mặc định |
|---|---|---|
| C.1 | Sửa câu 09-3 tập 2 "thời gian đối chiếu" thành "thời gian khiếu nại" cho khớp tập 3, 9, 10? | Chưa sửa, chờ duyệt |
| C.2 | Sửa ghi chú phiên bản `submitL2Tx` trong brief tập 6 ("cần v2.3.0" lệch CHANGELOG, thực tế là "chỉ có trong bridge 2.x")? | Chưa sửa |
| C.3 | Nghe và chốt 15 từ mới vừa thêm vào `shared/tu-dien-doc.md` (NFT, slot, epoch, stake, Ouroboros, CIP-30…) | Trạng thái "đề xuất" |

## Lỗi SDK và docs phát hiện khi đối chiếu (ngoài phạm vi video)

- `TxBuilder.delegateStake` đọc mã pool bằng `Ed25519KeyHash.from_hex`, nên mã dạng `pool1…` như ví dụ trong docs-v2 sẽ lỗi (tập 9).
- `EmbeddedWallet.signTx` chỉ ký bằng payment key, chưa ký được chứng chỉ uỷ thác (tập 9).
- `TxBuilder.calculateFee()` là hàm giữ chỗ, luôn trả 0; `mintPlutusScript` là hàm rỗng (tập 7, 8).
- `HydraBridge.submitTxSync` không bắt `InvalidInput`, nên CBOR hỏng chỉ hiện thành `Timeout`; khi chưa kết nối thì ném `Error` thường, không trả `SubmitTxError` (tập 11).
- README `@hydra-sdk/app-bridge` ghi `signTx` trả `txHash`, thực tế trả bộ chữ ký (witness set) (tập 12).
- docs-v2: `PolicyUtils` ghi trả JSON nhưng thực tế trả CBOR hex; `4.api/3.bridge.md` dùng `min_fee_a` thay vì `minFeeA`; `hydra-v2-changes.md` ghi `utxoCostPerByte` = 0 trên L2, nhưng hydra-node đã đặt lại 4310 sau bản 2.2.0; chưa có cảnh báo về token đúc trong Head (tập 7, 8).
