# Review của agy — 06-thuc-hanh-hydra-sdk

| id câu | vấn đề | đề xuất sửa | mức độ |
|---|---|---|---|
| 04-code | Trong đoạn code tạo ví, biến `words` xuất hiện trực tiếp (`key: { type: 'mnemonic', words }`) mà không có dòng khai báo trước, lập trình viên sao chép sẽ bị lỗi `ReferenceError`. | Thêm chú thích hoặc dòng khai báo: `const words = AppWallet.brew() // 24 từ ghi nhớ của An`. | Vừa |
| 09-code | Trong đoạn code dựng giao dịch, biến `bobAddress` được truyền vào `address: bobAddress` mà chưa từng được định nghĩa ở các dòng trước. | Thêm dòng chú thích ngay bên cạnh: `address: bobAddress, // địa chỉ nhận của Bình`. | Thấp |
| 10-3 | Nhãn trên bảng nối mũi tên tạo `txId#0` và `txId#1` cần lưu ý đây là kết quả của ví dụ cụ thể này, tránh để người xem hiểu lầm thứ tự index luôn cố định như vậy. | Bổ sung chữ nhỏ ở góc hình: "thứ tự đầu ra theo ví dụ minh hoạ". | Thấp |
| 15-0 | Tên miền `playground.hydrasdk.com` là cụm từ ghép dài, từ điển đang ở mức `đề xuất`. Cần kiểm tra kỹ phát âm để không bị ngắt vụn âm thanh. | Kiểm tra kỹ file audio sinh ra từ lexicon để đảm bảo đọc liền mạch: "pờ lây gờ rao chấm hai dra ét đi cây chấm com". | Thấp |

**3 nhận xét chung:**
1. **Tập kết bài thực chiến mẫu mực:** Đưa toàn bộ lý thuyết trừu tượng của 5 tập trước vào đúng 6 bước mã nguồn TypeScript chạy thật, tạo cảm giác trọn vẹn và thúc đẩy hành động ("chốt đơn") mạnh mẽ.
2. **Tuyệt đối trung thực với tài liệu và code:** Code trên bảng khớp từng tham số với `apps/nodejs-playground` và `apps/docs-v2`, đồng thời giữ đúng cam kết không quảng cáo quá đà về playground (nêu rõ chỉ dựng giao dịch và lấy code mẫu, không gửi trực tiếp vào Head).
3. **Phong cách bảng vẽ nhất quán:** Giải pháp vẽ phấn lại giao diện terminal và playground thay vì chèn ảnh chụp màn hình thật giúp video giữ nguyên vẹn tính nghệ thuật đồng nhất của toàn chuỗi.
