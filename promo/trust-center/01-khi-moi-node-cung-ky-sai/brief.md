# Trust Center, tập 1 — Khi mọi node cùng ký sai

## Brief

| Mục | Quyết định |
|---|---|
| Chuỗi | Giải thích Trust Center cho Hydra delegated topology (chuỗi mới, tách khỏi chuỗi Cardano & Hydra) |
| Tập | Tập thử: dựng từ bản thiết kế Trust Center v2 (safety), để duyệt bộ chuyển động mới trước khi làm cả chuỗi |
| Thể loại | Giải thích khoa học |
| Phong cách | Giữ nét phấn của chuỗi cũ trên nền phẳng màu than, sạch hơn bảng đen loang (`BACKGROUND = 'clean'`); thêm bộ chuyển động mới: camera đẩy và kéo, bật ra có nảy, chấm dữ liệu chạy dọc đường nối, gợn sóng báo sự kiện, làm mờ phần không liên quan, vòng khoanh tay, số đếm, rung khi phạt, lau bảng theo vệt |
| Lời đọc | Tiếng Việt, giọng Hải Đăng (VieNeu), không có phụ đề chạy; chữ trên màn hình chỉ là chữ viết lên bảng |
| Khung hình | 16:9, 1920×1080, 25 fps |
| Âm thanh | Giọng đọc + nền và hiệu ứng tự tổng hợp; thêm tiếng gió lướt (whoosh) cho camera và chuyển cảnh |
| Khán giả | Studio game, bên cho thuê node, lập trình viên đã biết Hydra Head là gì (tương đương đã xem tập 2–3 chuỗi cũ) |
| Độ dài | Khoảng 6–7 phút (được phép dài hơn để giải thích kỹ) |
| Cuối video | "Trust Center · Hydra delegated topology", dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc, không đọc thành lời |

**Câu hỏi mở đầu:** một Hydra Head có ba node do ba bên giữ khoá. Nếu cả ba cùng ký một snapshot lấy tiền của người chơi thì sao, khi Cardano chỉ kiểm tra chữ ký?

**Ví dụ xuyên tập:** Head do ba node X, Y, Z vận hành; người chơi An có 100 ADA trong Head nhưng không giữ node nào; đặt cọc thách thức 5 ADA; hạn trả lời 48 giờ. Đây là tình huống dựng lại để minh hoạ, theo giọng giải thích chủ sản phẩm đã duyệt.

**Cấu trúc mỗi cảnh:** nói phần kỹ thuật trước, sau đó là đoạn ví dụ so sánh (ba thủ quỹ cùng giữ sổ quỹ chung, ngân hàng chỉ đối chiếu chữ ký, biên lai gửi tiền, tiền cọc thuê nhà, hai hoá đơn cùng số, quầy khiếu nại, người giữ hộ tiền đặt cọc nhiều hơn số tiền giữ, người trông nhà thức đêm). Câu mở đầu đoạn ví dụ bắt đầu bằng "Ví dụ,"; không dùng cụm "ví dụ đời thường". Trên hình, đoạn ví dụ là thẻ "Ví dụ" trượt vào bên phải, camera lùi để sơ đồ kỹ thuật thu về bên trái (`example()` trong `scenes.py`).

**Văn phong:** trau chuốt bằng agy CLI, xem `review-agy.md`.

**Màu nhấn cố định:**

| Màu | Dùng cho |
|---|---|
| Xanh phấn (`cyan`) | Hydra Head, node, snapshot, dữ liệu Hydra đã ký |
| Vàng (`yellow`) | Món tiền của người chơi, giá trị, bồi thường |
| Xanh lá (`green`) | Biên nhận, phản hồi hợp lệ, huy hiệu `BONDED` |
| Đỏ (`red`) | Vi phạm, phạt, đóng băng bị kích hoạt |
| Trắng mờ (`dim`) | Nhãn phụ, phần bị làm mờ khi focus |

**Thuật ngữ:** lời đọc tránh các từ khó đọc, chỉ ghi trên bảng: accumulator, KZG, TVL, delegated topology, IOG, S1, S2. Lời đọc dùng "bản chốt" cho snapshot, "mã tóm tắt" cho accumulator commitment, "biên lai" cho receipt, "ký quỹ theo từng Head" cho safety bond, "ký quỹ thành viên" cho membership collateral, so sánh "tổng ký quỹ với tiền trong Head" cho coverage ratio, "dịch vụ canh gác" cho watcher, "thách thức" cho challenge, "quỹ bảo hiểm" cho insurance pool. Tên tiếng Anh còn lại trong lời đọc (Hydra Head, Head, Hydra, snapshot, node, Cardano, ADA, Trust Center, game, Vtechcom) không phiên âm: lời đọc giữ nguyên tiếng Anh, đặt trong nháy kép, ví dụ "snapshot" (`READ_MODE = 'quote'` trong `script.py`, không đi qua `shared/tu-dien-doc.md`).

## Nguồn tham khảo

- `hydraone/_bmad-output/planning-artifacts/trust-center-safety-v2-design.md` (2026-10-21, trạng thái: phân tích và gợi ý thiết kế, chưa phải spec, chưa code).
- `hydraone/_bmad-output/planning-artifacts/trust-center-delegated-topology-spec.md` (v1: liveness, badge, tier, trường hợp A/B1).

## Ranh giới sự thật

Được nói (theo tài liệu thiết kế):

- Head yêu cầu đủ N/N chữ ký cho mỗi snapshot; nếu cả N cùng ký một snapshot gian lận, L1 vẫn chấp nhận khi close, fanout hoặc decommit, vì giao thức chỉ kiểm tra chữ ký (§1).
- Ở delegated topology, studio có thể thuê node và bên cho thuê giữ khoá ký (trường hợp B1, spec v1 §2).
- v1 chỉ xử lý tính sẵn sàng; an toàn tài sản do người chơi hoặc studio tự đối soát (§1, spec v1 §1).
- Từ Hydra 2.2.0, mỗi snapshot cam kết vào accumulator của tập UTxO; có thể chứng minh một UTxO thuộc snapshot đã ký và kiểm tra phép chứng minh đó trên L1 (§2). Tài liệu ghi rõ điểm này đối chiếu từ mã nguồn, chưa chạy thử; lời đọc nói "theo thiết kế".
- Biên nhận gồm message snapshot, N chữ ký, commitment và membership proof; không cần thêm chữ ký riêng; ví tự kiểm tra cục bộ (§2, §6.2).
- Hai vi phạm safety: S1 ký hai snapshot khác nhau cùng số thứ tự; S2 chuyển UTxO của người dùng khi không có chữ ký của họ (§3).
- Hai loại thế chấp: thế chấp thành viên (v1) và ký quỹ an toàn theo head; ký quỹ an toàn không có khoá quản trị (§4, §6.1).
- Mức bảo chứng = tổng ký quỹ / TVL; `CR ≥ 1` thì lợi ích thông đồng tối đa không vượt phần bị phạt, head được badge `BONDED`; `CR < 1` thì hiển thị số thật và bồi thường giới hạn theo tỷ lệ (§4, §5.2).
- Luồng S2: mở thách thức kèm biên nhận và điểm neo, đặt cọc; đóng băng bond của mọi party trong cùng giao dịch; phản hồi trong `T_respond` = 48 giờ bằng membership proof ở điểm neo hoặc chữ ký của chủ sở hữu chi `u`; phản hồi hợp lệ thì gỡ đóng băng và trả tiền đặt cọc cho bên phản hồi; hết hạn thì phạt (§6.3, §8.4).
- Thứ tự chia tiền phạt S2: bồi thường `value(u)`, tiền thưởng người thách thức, hoàn tiền đặt cọc, phần còn lại vào quỹ bảo hiểm (§5.3).
- Lý do phạt mọi party: với N/N, snapshot điểm neo có chữ ký của cả N; party trung thực luôn phản hồi được bằng dữ liệu đã lưu (§6.3).
- S1 phạt tự động 100% bond của head; tiền thưởng 10% cho người nộp đầu tiên, phần còn lại vào quỹ bảo hiểm (§5.1, §5.2).
- Với contestation period mặc định 12 giờ, cửa sổ sau close khoảng 6–12 giờ; watcher tự động là thành phần bắt buộc; ai cũng chạy được watcher (§6.4, §6.1).
- Trust Center chỉ hiển thị, không ký giao dịch phạt (§6.1, §9).
- Giới hạn: chỉ bảo vệ UTxO pubkey-owned; mức phạt và thưởng là đề xuất (Q1); các giả định V1–V6 cần xác minh trước khi viết spec (§11, §12, §13).

Đơn giản hoá có chủ ý:

- Không nhắc các mã L1–L3, X1; chỉ nói người thách thức sai thì mất tiền đặt cọc.
- Không nói 5 ADA cụ thể trên lời đọc (bảng ghi "đặt cọc nhỏ"), vì còn cộng phí giao dịch dự kiến.
- Không nói tới contest làm đổi điểm neo (Q5), unbond 14 ngày, partial fanout.
- Không nhắc chi tiết validator (`head_registry`, `fraud_proof`, mẫu withdraw zero); để dành cho tập sau.
- Mô hình HFD (tiền người chơi nằm trong UTxO của operator) chỉ gói trong câu "chỉ bảo vệ món tiền do khoá công khai giữ".

Không được nói:

- Không nói Trust Center v2 "đã chạy", "đã triển khai" hay "an toàn tuyệt đối"; luôn là bản thiết kế.
- Không nói Vtechcom hay uỷ ban quyết định phạt safety.
