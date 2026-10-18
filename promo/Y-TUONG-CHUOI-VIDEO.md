# Ý tưởng cho chuỗi video Cardano & Hydra

Danh sách ý tưởng để làm sau. Muốn bắt đầu ý nào thì mở Vòng 0 theo [claude-media-team.md](claude-media-team.md); các quyết định chung (phong cách, giọng, khung hình, cảnh cuối) xem trong [TOM-TAT-SESSION.md](TOM-TAT-SESSION.md).

## Đã làm

| Tập | Chủ đề |
|---|---|
| 1 | UTxO là gì? |
| 2 | Hydra là gì? |
| 3 | Vòng đời của một Hydra Head |
| 4 | Ví thật ra giữ gì? Khoá, địa chỉ và cụm từ khôi phục |
| 5 | Hợp đồng thông minh trên eUTxO: ổ khoá biết suy nghĩ |
| 6 | Thực hành: giao dịch đầu tiên trong Hydra Head với hydra-sdk |
| 7 | Phí giao dịch trên Cardano được tính thế nào? (kịch bản) |
| 8 | Token và NFT trên Cardano (kịch bản) |
| 9 | Khối, đồng thuận và staking (kịch bản) |
| 10 | Hydra dùng vào việc gì? (kịch bản) |
| 11 | Gỡ lỗi giao dịch Hydra thường gặp (kịch bản) |
| 12 | Bảo mật cho người dùng mới, phần 2 (kịch bản) |

## Ý tưởng tập mới

1. **Bản ngắn 60–90 giây khung dọc 9:16** cho mỗi tập dài, đăng Shorts/TikTok/Reels và dẫn về bản đầy đủ.

## Cải tiến cho cả chuỗi

- **Mở và kết thống nhất:** đoạn mở 3–5 giây có tên chuỗi và số tập; cảnh kết chung có hydrasdk.com, playground và tên tập sau.
- **Phụ đề tuỳ chọn (.srt):** `script.py` đã có lời đọc và mốc thời gian, xuất `.srt` cho YouTube gần như không tốn công.
- **Bản tiếng Anh:** dùng chung `scenes.py`, chỉ dịch `lines` và `board`, tạo giọng tiếng Anh (Kokoro).
- **Chương trên YouTube:** sinh mốc chương theo từng cảnh từ `build.py`, dán vào mô tả.
- **Chốt nốt từ điển đọc:** nghe và chốt một lần các từ còn ở trạng thái đề xuất trong [shared/tu-dien-doc.md](shared/tu-dien-doc.md).
- **Ảnh bìa:** dựng bằng chính thư viện phấn, mỗi tập một hình chủ đạo và tiêu đề ngắn.
- **Logo sponsor:** thêm logo VTechcom Labs vào cảnh cuối khi có file PNG nền trong suốt.
- **Rà sự thật định kỳ:** khi hydra-sdk hoặc hydra-node đổi phiên bản, rà lại tập 3 và tập 6 trước.
