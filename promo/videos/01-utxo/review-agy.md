# Review của agy — 01-utxo

| id câu | vấn đề | đề xuất sửa | mức độ |
|---|---|---|---|
| 03-2 | Lời đọc nói "Ethereum chặn chuyện này bằng cách đánh số từng lệnh" dễ khiến người nghe hiểu nhầm thành ID của lệnh. Thực tế Ethereum dùng số đếm giao dịch của từng tài khoản (`nonce`). | Sửa thành: "Ethereum chặn chuyện này bằng cách đếm số thứ tự giao dịch của từng tài khoản, và cả mạng phải ghi nhớ con số đó." | Vừa |
| 07-bảng | Bảng viết `Chìa khoá = chữ ký`. Đây là cách nói sai bản chất mật mã học bất đối xứng và mâu thuẫn trực tiếp với Tập 4 (Tập 4 khẳng định: khoá bí mật là chìa, còn chữ ký là bằng chứng chứng minh có chìa). | Sửa chữ trên bảng thành: `Chữ ký mở ổ khoá` hoặc `Chìa khoá tạo chữ ký`. | Cao |
| 08-1 | Lời đọc: "kèm chìa khoá để mở chúng". Giao dịch trên blockchain chỉ đính kèm chữ ký (witness), không bao giờ đính kèm chìa khoá (khoá bí mật). | Sửa thành: "Đầu vào chỉ rõ những món tiền chưa tiêu mà bạn đem ra dùng, kèm chữ ký để mở khoá." | Cao |
| 13-0 | Câu dài 31 âm tiết (vượt trần 30 âm tiết theo quy chuẩn), dễ khiến người đọc bị hụt hơi ở đoạn chuyển giao sang phần kỹ thuật. | Tách/gọn lại: "Phần này cho lập trình viên. Đây là cách Hydra và hydra-sdk lưu các món tiền, dưới dạng đối tượng JSON." (25 âm tiết). | Thấp |
| 14-0 | Câu chỉ có 11 âm tiết (dưới sàn 12 âm tiết), mở đầu cảnh bị cụt và gắt. | Sửa thành: "Bây giờ ta hãy xem lại ly cà phê, lần này bằng dữ liệu." (16 âm tiết). | Thấp |
| 14-1 | Cụm từ "mang số không" quá vắn tắt, người chưa biết gì về blockchain không hiểu "số không" từ đâu ra (thực tế là chỉ mục đầu ra `#0`). | Sửa thành: "Trước giao dịch, ví bạn chỉ có một món duy nhất, mang số thứ tự không, ghi năm mươi ADA." | Vừa |
| 15-0 | Câu chỉ có 10 âm tiết (dưới sàn 12 âm tiết). | Sửa thành: "Thế nhưng mô hình này cũng có một cái giá của nó." (13 âm tiết). | Thấp |
| 15-2 | Câu chỉ có 11 âm tiết (dưới sàn 12 âm tiết). | Sửa thành: "Công việc này thông thường do ví hoặc bộ dựng giao dịch đảm nhận." (17 âm tiết). | Thấp |
| 16-0 | Câu dài 32 âm tiết (vượt trần 30 âm tiết), ghép hai ý khá nặng. | Tách nhịp: "Vì sao cách ghi này quan trọng? Hydra là giải pháp lớp hai của Cardano, và dùng đúng mô hình UTxO như mạng chính." (27 âm tiết). | Thấp |

**3 nhận xét chung:**
1. **Khả năng sư phạm xuất sắc:** Sử dụng ẩn dụ chiếc ví tiền mặt và giao dịch mua ly cà phê rất trực quan, giúp người xem phổ thông nắm bắt ngay bản chất "tiêu trọn món cũ, sinh ra món mới" mà không bị ngợp bởi thuật ngữ kỹ thuật.
2. **Cần chuẩn hoá thuật ngữ mật mã:** Lỗi đánh đồng "chìa khoá = chữ ký" ở cảnh 07 và 08 là điểm yếu chuyên môn lớn nhất của tập, cần sửa để bảo đảm tính chính xác và nhất quán với Tập 4.
3. **Cân chỉnh nhịp điệu âm tiết:** Đoạn cuối (cảnh 13–16) có nhiều câu bị lệch biên độ chuẩn (10–11 âm tiết hoặc 31–32 âm tiết), cần viết lại để giọng đọc VieNeu giữ được nhịp thở tự nhiên.
