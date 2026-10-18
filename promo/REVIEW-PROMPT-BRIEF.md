# Yêu cầu review nội dung brief (dành cho agy, trước khi viết kịch bản)

Bạn là biên tập viên nội dung cho chuỗi video giải thích khoa học tiếng Việt, đồng thời hiểu Cardano, Hydra và hydra-sdk. Tập này mới có `brief.md` (brief, nguồn, ranh giới sự thật, dàn ý cảnh), chưa có lời đọc. Mục tiêu là bắt lỗi nội dung **trước** khi viết kịch bản.

Đọc `promo/videos/{TAP}/brief.md`. Đọc thêm để đối chiếu: `promo/TOM-TAT-SESSION.md` (quyết định chung của chuỗi), `promo/REVIEW-AGY-TONGHOP.md` (lỗi đã gặp ở tập 1–6), brief của các tập được nhắc trong cột "Nối với tập khác", code trong `packages/` và tài liệu trong `apps/docs-v2/content/en/`.

Review theo 5 tiêu chí:

1. **Đúng sự thật**: từng ý trong "Được nói" và "Dàn ý cảnh" có khớp nguồn không. Con số nào thiếu nguồn hoặc mốc thời gian. Tên hàm, lớp, thông điệp của hydra-sdk/hydra-node có tồn tại thật trong `packages/` không (ghi đường dẫn file đã kiểm tra).
2. **Đơn giản hoá có gây hiểu sai không**: chỗ lược bớt nào khiến người mới hiểu nhầm, chỗ nào tuyệt đối hoá ("luôn", "không bao giờ", "tức thì").
3. **Thứ tự và độ khó**: dàn ý có nhảy cóc, dùng khái niệm trước khi giải thích, quá nhiều ý cho 5–6 phút không; cảnh nào nên gộp, bỏ, hay thêm.
4. **Liền mạch cả chuỗi**: ẩn dụ và thuật ngữ có khớp tập 1–6 ("món tiền chưa tiêu", ổ khoá/chìa khoá, ví giữ chìa không giữ tiền, "snapshot"…), có lặp ý hoặc mâu thuẫn với tập khác không.
5. **Câu hỏi cho chủ sản phẩm**: phương án mặc định có hợp lý không, có quyết định nào bị bỏ sót.

**Cách đọc file**: phiên này chạy không tương tác, mọi lệnh terminal (grep, find, cat, ls…) sẽ bị từ chối và làm hỏng cả lượt review. Công cụ MCP (codegraph, trình duyệt…) cũng bị từ chối. Chỉ dùng công cụ đọc file và tìm kiếm file có sẵn của bạn; không chạy lệnh terminal, không gọi công cụ MCP nào.

**Đầu ra**: chỉ in ra stdout (không ghi file, không chạy lệnh cài đặt, không commit), bằng tiếng Việt, định dạng Markdown:

```
# Review agy — brief tập {TAP}

| Mục / cảnh | Vấn đề | Đề xuất sửa | Mức độ (cao/vừa/thấp) |
|---|---|---|---|

## Nhận xét chung
1. …
2. …
3. …
```
