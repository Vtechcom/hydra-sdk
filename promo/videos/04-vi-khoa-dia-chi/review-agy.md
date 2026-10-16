# Review của agy — 04-vi-khoa-dia-chi

| id câu | vấn đề | đề xuất sửa | mức độ |
|---|---|---|---|
| 01-0 | Lời đọc nói "Ở tập trước, chúng ta dừng lại ở một câu, ví của bạn không chứa tiền mà chỉ giữ chìa khoá". Đây là lỗi sai liên kết tập: câu kết này nằm ở **Tập 1**, trong khi tập ngay trước đó là **Tập 3** (Vòng đời Hydra Head). | Sửa thành: "Ở tập một, chúng ta đã biết một câu, ví của bạn không chứa tiền mà chỉ giữ chìa khoá." hoặc "Trong các tập trước, ta đã biết rằng..." | Cao |
| 05-1 | Lời đọc nói "...những món tiền chưa tiêu mà ta đã gặp ở tập trước". Khái niệm này thuộc nền tảng Tập 1 và chuỗi bài, nói "tập trước" làm đứt gãy tính liên kết logic. | Sửa thành: "...những món tiền chưa tiêu mà ta đã gặp ở các tập trước." | Thấp |
| 06-3 | Phân định rất chuẩn xác: "khoá bí mật chưa bao giờ rời khỏi ví. Chữ ký chứng minh bạn có chìa, mà không phải đưa chìa cho ai." Tuy nhiên điều này càng làm lộ rõ điểm sai ở Tập 1 cảnh 07 (`Chìa khoá = chữ ký`). | Giữ nguyên lời đọc câu này và lấy làm căn cứ để sửa chữ trên bảng ở Tập 1. | Vừa |
| 12-bảng | Đoạn code trên bảng viết `networkId, key: { type: 'mnemonic', words }` nhưng chưa chỉ rõ `networkId` lấy từ đâu (Tập 6 viết chuẩn là `NETWORK_ID.PREPROD`). | Sửa code trên bảng thành: `networkId: NETWORK_ID.PREPROD` để đồng nhất với Tập 6. | Thấp |

**3 nhận xét chung:**
1. **Nội dung giáo dục an toàn tuyệt vời:** Cảnh 09, 10, 11 cảnh báo về việc bảo mật cụm từ khôi phục (không có nút "quên mật khẩu", ai hỏi là lừa đảo, cất giấy) có giá trị thực tiễn rất cao cho người dùng mới bước chân vào Web3.
2. **Ẩn dụ toán học chuẩn xác:** Việc dùng hình ảnh pha màu sơn để giải thích hàm một chiều (tính khoá công khai từ khoá bí mật) và hình ảnh cây phân nhánh khoá (HD wallet) giúp kỹ thuật mật mã trở nên trực quan, không khô khan.
3. **Cần chỉnh sửa liên kết tập:** Sửa ngay câu mở đầu cảnh 01 để người xem xem liền mạch theo danh sách phát không bị nhầm lẫn thứ tự các tập.
