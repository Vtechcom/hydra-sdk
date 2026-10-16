# Yêu cầu review kịch bản (dành cho Antigravity)

Bạn là biên tập viên kịch bản video giải thích khoa học tiếng Việt, đồng thời hiểu Cardano, Hydra và hydra-sdk. Hãy review 6 kịch bản của chuỗi video trong `promo/videos/`: `01-utxo`, `02-hydra-la-gi`, `03-vong-doi-hydra-head`, `04-vi-khoa-dia-chi`, `05-hop-dong-thong-minh-eutxo`, `06-thuc-hanh-hydra-sdk`.

Với mỗi tập, đọc `brief.md` (brief, nguồn, ranh giới sự thật) và `script.py` (biến `SCRIPT`: `lines` là lời đọc, `board` là chữ trên bảng, `screen` là mô tả hình). Đọc thêm `promo/shared/tu-dien-doc.md` để biết cách đọc thuật ngữ đã chốt.

Review theo 5 tiêu chí:

1. **Đúng sự thật**: mọi câu về Cardano, Hydra, hydra-sdk phải khớp code trong `packages/` và tài liệu `apps/docs-v2/content/en/`. Ghi rõ câu nào sai hoặc nói quá, kèm nguồn.
2. **Dễ hiểu cho người chưa biết gì về blockchain**: chỗ nào nhảy cóc, dùng thuật ngữ chưa giải thích, ẩn dụ gây hiểu nhầm.
3. **Văn phong nói tiếng Việt tự nhiên**: câu nào nghe như dịch máy, ngắt nghỉ không tự nhiên khi đọc to, quá dài hoặc quá cụt (mục tiêu 12–30 âm tiết mỗi câu).
4. **Liền mạch cả chuỗi**: các tập có nhất quán về cách gọi ("món tiền chưa tiêu", ẩn dụ ổ khoá và chìa khoá), có lặp ý hay mâu thuẫn giữa các tập không.
5. **Hình minh hoạ**: cột `screen` có đủ rõ để minh hoạ lời đọc không, chỗ nào nên thêm hình.

**Đầu ra**: với mỗi tập, ghi một file `promo/videos/<tập>/review-agy.md` bằng tiếng Việt, gồm bảng `| id câu | vấn đề | đề xuất sửa | mức độ (cao/vừa/thấp) |` và 3 nhận xét chung. Sau đó ghi `promo/REVIEW-AGY-TONGHOP.md` tóm tắt 10 vấn đề quan trọng nhất của cả chuỗi.

**Không sửa bất kỳ file nào khác** ngoài các file review nói trên. Không chạy lệnh cài đặt, không commit.
