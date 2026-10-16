# Review của agy — tổng hợp cả chuỗi

10 vấn đề quan trọng nhất của cả chuỗi kịch bản:

1. **Mâu thuẫn khái niệm "Chìa khoá vs Chữ ký" giữa Tập 1 và Tập 4:** Bảng cảnh 07 Tập 1 ghi `Chìa khoá = chữ ký` và câu 08-1 nói "kèm chìa khoá để mở", mâu thuẫn trực tiếp với Tập 4 (khoá bí mật là chìa, chữ ký là bằng chứng; chìa không bao giờ rời ví). Cần chuẩn hoá Tập 1 theo Tập 4.
2. **Sai lệch tham chiếu tập ở Tập 4 (cảnh 01 và 05):** Lời dẫn "Ở tập trước, chúng ta dừng lại ở một câu: ví không chứa tiền mà chỉ giữ chìa khoá..." bị sai thứ tự phát hành, vì tập ngay trước Tập 4 là Tập 3 (Vòng đời), còn nội dung được trích dẫn thuộc Tập 1. Cần sửa thành "Ở tập một...".
3. **Bất nhất ngôi xưng ở Tập 3 (cảnh 02 và 03):** Đột ngột xưng "Mình" ("Mình sẽ lần lượt...", "Mình sẽ quay lại..."), trong khi cả 5 tập còn lại đều dùng "ta" / "chúng ta" hoặc diễn đạt khách quan. Cần đổi toàn bộ về "Ta".
4. **Không nhất quán thuật ngữ dịch tiếng Việt cho "Snapshot":** Tập 2 dùng "bản chốt sổ", Tập 3 dùng "bản chụp", Tập 6 kết hợp cả hai. Cần thống nhất một cách gọi tiếng Việt chuẩn (khuyến nghị: "bản chụp (snapshot)") để tránh làm người xem bối rối.
5. **Gây hiểu nhầm về tốc độ rút tiền khi đóng Head ở Tập 2 (cảnh 09):** Câu 09-3 nói đóng Head là tiền trả về ngay theo snapshot, bỏ qua giai đoạn khiếu nại (Contestation Period) và Fanout, dễ khiến người xem ngộ nhận tính tức thời khi tương tác với L1.
6. **Giải thích cơ chế chống gửi lại lệnh của Ethereum chưa chuẩn xác (Tập 1 cảnh 03):** Câu 03-2 nói "Ethereum đánh số từng lệnh" dễ hiểu nhầm thành ID giao dịch. Bản chất kỹ thuật là số đếm giao dịch của tài khoản (`nonce`).
7. **Cảnh 04 Tập 3 làm tăng tải nhận thức không cần thiết:** Việc dành riêng một cảnh để so sánh lịch sử Hydra v1 vs v2 làm người xem mới bị phân tâm, nên tinh giản hoặc tích hợp ngắn gọn vào cảnh nạp tiền.
8. **Khái niệm "tiền thế chấp" (Collateral) xuất hiện bất ngờ ở Tập 5 (cảnh 12):** Lời đọc liệt kê tiền thế chấp trong TxBuilder nhưng không hề giải thích lý do tồn tại của nó trên Cardano, gây khó hiểu cho người xem phổ thông.
9. **Đoạn code trên bảng ở Tập 6 thiếu ngữ cảnh biến:** Các biến `words` (cảnh 04) và `bobAddress` (cảnh 09) được dùng trực tiếp mà không có khai báo hay chú thích nguồn gốc, làm giảm tính tự hoàn thiện của mã ví dụ.
10. **Dao động độ dài âm tiết ở một số câu:** Tập 1 có các câu vượt trần (`13-0` 31 âm tiết, `16-0` 32 âm tiết) và các câu dưới sàn (`14-0` 11 âm tiết, `15-0` 10 âm tiết, `15-2` 11 âm tiết); Tập 2 có câu `08-0` 10 âm tiết. Cần điều chỉnh để đảm bảo toàn bộ chuỗi nằm trọn vẹn trong khoảng chuẩn 12–30 âm tiết.
