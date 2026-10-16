# Review của agy — 05-hop-dong-thong-minh-eutxo

| id câu | vấn đề | đề xuất sửa | mức độ |
|---|---|---|---|
| 07-1 | Lời đọc nói "script đọc tờ ghi chú, rồi đếm xem trong giao dịch có mấy chữ ký thuộc danh sách". Về kỹ thuật Plutus, script chỉ kiểm tra trường `extra_signatories` trong bối cảnh giao dịch (chữ ký do node kiểm tra ở Phase 1). Diễn đạt này hơi đơn giản hoá quá mức, dễ khiến lập trình viên hiểu sai vai trò của script. | Sửa thành: "Đầu tiên, script đọc tờ ghi chú, rồi kiểm tra xem giao dịch có đủ hai chữ ký hợp lệ trong danh sách hay không." | Thấp |
| 11-1 & 11-3 | Đọc `DatumUtils` ("đa từm iu tiu") và `RedeemerUtils` ("ri đi mơ iu tiu"). `lexicon.py` phân biệt chữ hoa/thường nên nếu viết hoa đầu câu sẽ không được chuyển đổi. | Đảm bảo các từ viết hoa/thường đều được cập nhật vào `promo/shared/tu-dien-doc.md`. | Thấp |
| 12-2 | Nhắc đến "một món tiền thế chấp" (collateral) một cách đột ngột trong danh sách tham số của TxBuilder mà chưa từng giải thích khái niệm này trước đó, gây bỡ ngỡ cho khán giả. | Bổ sung chú thích ngắn: "...một món tiền thế chấp phòng khi script chạy lỗi, và khoảng thời gian có hiệu lực." | Vừa |

**3 nhận xét chung:**
1. **Sư phạm hoá khái niệm khó nhất:** Biến `datum` thành "tờ ghi chú dán trên két" và `redeemer` thành "tờ đơn xin mở két" là cách tiếp cận sáng tạo và dễ hiểu nhất đối với mô hình eUTxO của Cardano.
2. **Làm nổi bật tính tất định (Determinism):** Giải thích rõ ràng việc script không xem đồng hồ (dùng khoảng hiệu lực) và khả năng chạy thử trước ở máy cá nhân mà không sợ mất phí oan đã nêu bật được ưu thế cốt lõi của Cardano so với Ethereum.
3. **Khớp code thực tế:** Phần lập trình viên đối chiếu rất chuẩn xác với các hàm trong `@hydra-sdk/core` (`DatumUtils`, `RedeemerUtils`, `PlutusUtils`) và `@hydra-sdk/transaction`.
