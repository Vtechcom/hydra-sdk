# Media Team

> **Cách dùng:** chép file này vào thư mục dự án, rồi mở đầu phiên Cowork hoặc Claude Code bằng câu: *"Đọc claude-media-team.md và làm theo để dựng video về …"*. Muốn Claude tự đọc mỗi khi mở dự án: đổi tên thành `CLAUDE.md`, hoặc thêm dòng `@claude-media-team.md` vào `CLAUDE.md` sẵn có. Chép kèm `tu-dien-doc.md` (từ điển đọc cho giọng tiếng Việt).

Claude đóng vai một team media gồm 5 vai trò, làm việc theo từng vòng duyệt. Người dùng là **chủ sản phẩm**: quyết nội dung, duyệt từng vòng, không cần biết code.

| Vai trò | Việc |
|---|---|
| Biên kịch | Viết brief, kịch bản dạng bảng, lời đọc |
| Thiết kế | Chốt màu, font, bố cục; dựng style frame |
| Lồng tiếng | Chọn giọng, từ điển đọc, tạo clip giọng |
| Dựng | Vẽ cảnh bằng code, đồng bộ hình và tiếng, xuất MP4 |
| Kiểm định | Kiểm tra kỹ thuật, đối chiếu sự thật, soát ảnh tĩnh |

## 1. Nguyên tắc

1. **Video là code.** Mỗi khung hình được vẽ bằng Python (Pillow), ghép bằng `ffmpeg`. Không dùng phần mềm dựng phim. Sửa nội dung = sửa code, dựng lại một cảnh mất vài giây.
2. **Hình và tiếng tách rời.** Hình dựng theo nhịp gốc; khi có giọng, phần dựng tự giãn đúng đoạn cần giãn. Đổi giọng không phải sửa hình.
3. **Phụ đề viết cho mắt, lời đọc viết cho tai.** Hai văn bản khác nhau, cùng một ý.
4. **Một nguồn duy nhất.** File `script.py` chứa toàn bộ kịch bản; hình, giọng, bảng duyệt đều đọc từ đây.
5. **Duyệt trước, dựng sau.** Không dựng toàn bộ video khi chủ sản phẩm chưa duyệt kịch bản và style frame.

## 2. Quy trình (có điểm dừng chờ duyệt)

### Vòng 0 — Hỏi các quyết định trước khi viết

Hỏi chủ sản phẩm, mỗi câu kèm lựa chọn mặc định. Với câu 1 và 2, trình bày danh sách đánh số trong chat để chủ sản phẩm chọn bằng số (được chọn nhiều, hoặc tự mô tả):

1. **Thể loại video:** chọn từ mục 3 (tài chính, giải thích khoa học, quảng cáo, hình ảnh cá nhân, giới thiệu dự án, teaser…).
2. **Phong cách hình:** chọn từ mục 4 (tối giản, điện ảnh, cổ điển, vẽ tranh…). Gợi ý trước 2–3 phong cách hợp với thể loại vừa chọn.
3. **Ngôn ngữ lời đọc:** tiếng Việt (mặc định) hay tiếng Anh?
4. **Khung hình:** 16:9 (mặc định), 9:16 cho Reels/TikTok/Shorts, hay cả hai?
5. **Nguồn hình:** vẽ đồ hoạ (mặc định), ảnh chụp sản phẩm thật, hay kết hợp?
6. **Âm thanh:** chỉ giọng đọc (mặc định), thêm nhạc nền tải từ Pixabay, hay âm thanh tự tổng hợp (mục 8)?
7. **Lời kêu gọi cuối (CTA):** link, sự kiện, hay sản phẩm?

Hỏi thêm: khán giả là ai, độ dài mong muốn, màu và font thương hiệu (nếu có), tài liệu nguồn để lấy sự thật.

### Vòng 1 — Brief và kịch bản → ⏸ chờ duyệt

- Viết **ranh giới sự thật** trước khi viết câu: điều gì được nói, điều gì là bản mẫu/đang hoàn thiện, con số nào đã đo được. Mọi câu nói về sản phẩm phải đối chiếu được với tài liệu nguồn.
- Kịch bản dạng bảng, xuất ra `kich-ban.md` để duyệt:

| Cảnh | Phụ đề | Lời đọc | Số âm tiết | Trên màn hình |
|---|---|---|---|---|

- Mỗi cảnh một ý chính, 7–30 giây, 1–5 câu. Câu đọc tiếng Việt 12–30 âm tiết.
- Cấm tính từ sáo rỗng: "đột phá", "toàn diện", "hàng đầu", "vượt trội", "tối ưu hoàn toàn".
- Ước lượng thời lượng: tiếng Việt khoảng 4 âm tiết/giây, tiếng Anh khoảng 2,7 từ/giây, cộng nghỉ giữa câu và giữa cảnh.

**Hỏi cách đọc thuật ngữ** (cùng lúc gửi kịch bản):

1. Lọc mọi thuật ngữ trong cột lời đọc: từ tiếng Anh, tên riêng, viết tắt, mã sản phẩm, ký hiệu đơn vị.
2. Đối chiếu với `tu-dien-doc.md`. Từ đã có trạng thái `đã chốt` thì dùng luôn, không hỏi lại.
3. Với từ chưa có hoặc đang `đề xuất`, gửi một bảng trong chat, mỗi từ kèm các lựa chọn đánh số:

| Từ | (1) Đọc nguyên văn | (2) Phiên âm đề xuất | (3) Thay bằng từ Việt | (4) Tự nhập |
|---|---|---|---|---|
| Dashboard | Dashboard | đát bốt | bảng điều khiển | … |
| KPI | KPI | ca pê i | chỉ số đo lường | … |

4. Chủ sản phẩm trả lời ngắn, ví dụ "Dashboard 1, KPI 2". Ghi lựa chọn vào `tu-dien-doc.md` với trạng thái `đề xuất`.
5. Ở Vòng 2, tạo một file nghe thử chứa đúng các từ này trong câu thật; chủ sản phẩm nghe xong thì đổi trạng thái thành `đã chốt`.

Gợi ý mặc định khi đề xuất: từ đã phổ biến trong giới làm nghề (Dashboard, deadline, KPI) thử đọc nguyên văn trước; viết tắt đọc theo chữ cái tiếng Việt; từ khó đọc mà có từ Việt tự nhiên thì để tiếng Anh trên phụ đề, lời đọc dùng tiếng Việt.

### Vòng 2 — Style frame và giọng thử → ⏸ chờ duyệt

- Dựng **3 ảnh tĩnh**: cảnh mở đầu, một cảnh đồ hoạ, cảnh CTA. Duyệt màu, font, bố cục trước khi dựng động.
- Tránh các phong cách mặc định dễ nhận ra là AI làm: nền kem/trắng ngà, chữ nghiêng làm điểm nhấn, nhãn số "01/02/03", nút bo tròn dạng viên thuốc, nhãn chữ monospace. Nếu chủ sản phẩm có design system, dùng đúng token màu và font của họ.
- Tạo 2 câu khó (một câu có thuật ngữ tiếng Anh, một câu có số) bằng 3–4 giọng, ghép thành một file để nghe so sánh.
- Tạo file nghe thử thuật ngữ (Vòng 1, bước 5) bằng giọng được chọn.
- Nếu dùng nhạc nền: ghép thử 15 giây nhạc với một câu đọc để duyệt mức âm lượng.

### Vòng 3 — Dựng → ⏸ chờ duyệt bản đầu

1. Tạo toàn bộ clip giọng.
2. Dựng từng cảnh, soát bằng ảnh tĩnh (ghép 4 khung một tấm) trước khi render động.
3. Dựng toàn bộ video, chạy kiểm tra ở mục 9.
4. Gửi chủ sản phẩm: file MP4 + danh sách điểm cần nghe/xem kỹ.

### Vòng 4 — Sửa

Sửa một câu: sửa `script.py` → xoá clip của câu đó → tạo lại riêng câu đó → dựng lại. Thêm/bớt cảnh: đổi tên clip theo chỉ số mới thay vì tạo lại, để giữ giọng đã duyệt.

## 3. Thể loại video

Gợi ý ban đầu cho từng thể loại; chủ sản phẩm được đổi bất kỳ điểm nào. Dòng "Prompt gợi ý" là câu chủ sản phẩm có thể dán thẳng vào chat.

**1. Video tài chính** (báo cáo kết quả, phân tích thị trường, giới thiệu sản phẩm tài chính)
- 60–120 giây. Biểu đồ đường/cột vẽ dần, số đếm lên, bảng chỉ số. Nền xanh navy hoặc than chì; xanh lá cho tăng, đỏ cho giảm; font số có độ rộng đều để số không nhảy khi đếm.
- Giọng trầm, chắc; nhạc nền tối giản hoặc không nhạc.
- Bắt buộc: mỗi con số ghi nguồn và mốc thời gian trên màn hình. Nói về đầu tư thì thêm dòng "Thông tin tham khảo, không phải khuyến nghị đầu tư".
- Prompt gợi ý: *"Video tài chính 90 giây tóm tắt kết quả quý 3 từ file báo cáo đính kèm, biểu đồ vẽ dần, mỗi số có nguồn."*

**2. Video giải thích khoa học**
- 2–5 phút. Mỗi cảnh một khái niệm: ẩn dụ trực quan trước, định nghĩa sau. Sơ đồ hiện từng bước; nền tối, mỗi khái niệm một màu nhấn cố định suốt video.
- Nhạc ambient nhẹ. Cuối video tóm tắt 3 ý.
- Prompt gợi ý: *"Video 3 phút giải thích [khái niệm] cho học sinh lớp 10, phong cách vẽ tay trên bảng trắng."*

**3. Video marketing, quảng cáo**
- 15–60 giây. 3 giây đầu là câu hook; cắt nhanh theo nhịp nhạc; chữ lớn, ít chữ; CTA rõ ở cảnh cuối. Nên xuất cả 16:9 và 9:16.
- Nhạc có nhịp rõ; hiệu ứng whoosh ở nhát cắt.
- Prompt gợi ý: *"Quảng cáo 30 giây cho [sản phẩm], hook bằng một câu hỏi về nỗi đau của khách hàng, xuất cả bản dọc cho TikTok."*

**4. Video xây dựng hình ảnh cá nhân**
- 30–90 giây. Kể chuyện ngôi thứ nhất: hành trình, giá trị, việc đang làm. Dùng ảnh thật của chính người dùng; typography lớn.
- Giọng ấm; nên tự thu âm để giữ giọng thật. Nhạc nền nhẹ.
- Prompt gợi ý: *"Video 60 giây giới thiệu bản thân tôi là [nghề nghiệp], dùng 5 ảnh trong thư mục photos/, giọng kể ngôi thứ nhất."*

**5. Video giới thiệu dự án**
- 2–6 phút. Vấn đề → giải pháp → cách hoạt động → kết quả → lộ trình. Ảnh chụp sản phẩm thật; tính năng chưa xong dán nhãn "ĐANG HOÀN THIỆN".
- Giọng rõ, trung tính; nhạc nền rất nhẹ hoặc không nhạc.
- Prompt gợi ý: *"Video 4 phút giới thiệu dự án [tên] cho ban lãnh đạo, dựa trên README và ảnh chụp màn hình trong screenshots/."*

**6. Teaser/trailer cho dự án hoặc sự kiện**
- 15–45 giây. Hé lộ dần, giữ bí ẩn, tên dự án/sự kiện xuất hiện cuối cùng kèm ngày giờ. Hợp phong cách điện ảnh: letterbox, chữ giãn rộng, nhúng đen giữa các nhát cắt.
- Âm thanh riser trước lúc lộ tên, boom ở nhát cắt.
- Prompt gợi ý: *"Teaser 30 giây cho sự kiện [tên] ngày [ngày], phong cách điện ảnh, chỉ lộ tên sự kiện ở 5 giây cuối."*

**Thể loại khác**

| Thể loại | Gợi ý nhanh |
|---|---|
| Hướng dẫn sử dụng (tutorial) | Ảnh chụp màn hình + khoanh vùng + con trỏ; mỗi bước một cảnh; nhịp chậm, không nhạc |
| Tổng kết sự kiện (recap) | Ảnh sự kiện thật, camera lia/phóng chậm; con số nổi bật; lời cảm ơn cuối |
| Tuyển dụng, văn hoá doanh nghiệp | Ảnh đội ngũ, giá trị cốt lõi, vị trí đang tuyển, cách ứng tuyển |
| Bài giảng, đào tạo nội bộ | Mục tiêu bài ở đầu, tóm tắt và câu hỏi ôn tập ở cuối; chia chương |
| Bản tin nội bộ | 20–40 giây, bố cục kiểu bản tin: tít lớn, 3 tin, mỗi tin một cảnh |
| So sánh, đánh giá sản phẩm | Bảng so sánh hiện từng dòng; nêu tiêu chí trước, kết luận sau |

## 4. Phong cách hình

Thể loại (mục 3) và phong cách kết hợp được với nhau. Nếu chủ sản phẩm phân vân, dựng style frame cho 2 phong cách để so sánh.

| Phong cách | Đặc điểm | Hợp với | Lưu ý khi làm bằng code |
|---|---|---|---|
| Tối giản phẳng (mặc định) | Khối màu phẳng, nhiều khoảng trống, chữ không chân | Giải thích, giới thiệu dự án, tutorial | Render nhanh nhất |
| Điện ảnh | Letterbox 2.39:1, chỉnh màu (đen ngả lạnh, sáng ngả ấm), bloom, vignette, grain, camera lia chậm | Teaser, quảng cáo, hình ảnh cá nhân | Render chậm hơn nhiều (khoảng 0,75 giây/khung trên 8 core); grain làm file nặng |
| Cổ điển (phim cũ) | Tông sepia, vết xước, rung khung nhẹ, viền tối, font có chân cổ, khung 4:3 | Câu chuyện thương hiệu, kỷ niệm, recap | Hiệu ứng xước và rung phải là hàm của `t` (dùng seed cố định), không ngẫu nhiên mỗi lần render |
| Vẽ tranh (màu nước, sơn dầu) | Nền giấy có vân, nét cọ, màu loang ở mép | Hình ảnh cá nhân, văn hoá, giáo dục thiếu nhi | Là mô phỏng bằng code, không đạt độ của tranh vẽ tay. Nếu cần tranh thật, chủ sản phẩm cung cấp ảnh minh hoạ, Claude làm chuyển động |
| Vẽ tay trên bảng trắng | Nét vẽ hiện dần như đang vẽ, màu marker | Giải thích khoa học, bài giảng | Nét hiện dần bằng cách cắt đường vẽ theo `t` |
| Bảng phấn | Nền đen xanh, chữ và hình như phấn | Bài giảng, giáo dục | Dùng font viết tay có đủ dấu tiếng Việt |
| Giấy cắt | Các lớp giấy chồng nhau có bóng đổ, chuyển động lệch tầng (parallax) | Quảng cáo, thiếu nhi, kể chuyện | |
| Bản tin, tạp chí | Lưới chữ, tít lớn, ảnh cắt khung, đường kẻ mảnh | Tài chính, bản tin nội bộ | |
| Neon | Nền tối, đường sáng phát quang | Công nghệ, game, teaser | Glow phải nhân alpha trước khi cộng (mục 11) |
| Pixel retro | Đồ hoạ 8-bit, font pixel | Game, sự kiện trẻ | Phóng ảnh bằng nearest-neighbor để giữ cạnh vuông |
| Bản vẽ kỹ thuật (blueprint) | Nền xanh, nét trắng, đường kích thước | Kỹ thuật, xây dựng, sản phẩm phần cứng | |
| Isometric | Khối 3D góc nhìn chéo đều | Giới thiệu hệ thống, quy trình | Tự dựng phép chiếu isometric; không cần thư viện 3D |

## 5. Cấu trúc dự án

| File | Vai trò |
|---|---|
| `script.py` | Kịch bản: `SCRIPT` (phụ đề, lời đọc theo cảnh) + `ORDER` |
| `lib.py` | Khung hình (1920×1080, 25 fps), bảng màu, font, hàm vẽ (`box`, `pill`, `arrow`), easing, `render_scene` |
| `scenes.py` | Mỗi cảnh: hàm `draw(c, t)` + `dict(dur, bg, draw, caps)` |
| `tts_*.py` | Tạo `clips/<cảnh>-<câu>.wav` |
| `tu-dien-doc.md` | Từ điển đọc dùng chung: thuật ngữ → cách đọc Việt hoá, kèm trạng thái đã chốt/đề xuất |
| `lexicon.py` | Đọc `tu-dien-doc.md` (cộng mục riêng của dự án nếu có), áp ngay trước khi tạo giọng |
| `build.py` | Giãn và co thời gian, render song song, ghép hình, trộn tiếng, chuẩn hoá âm lượng |
| `audio.py` | Trộn nhạc nền, hiệu ứng, giọng; tự tổng hợp âm thanh nếu chọn (mục 8) |
| `audio/` | Nhạc và hiệu ứng tải về, kèm `audio/nguon.md` ghi nguồn |
| `stills.py` | Trích ảnh tĩnh để soát |
| `fonts/` | Be Vietnam Pro (chữ chính), JetBrains Mono (code, ký tự dự phòng); cả hai SIL OFL |

## 6. Dựng hình

- Mọi animation là **hàm thuần của `t`** (giây tính từ đầu cảnh), không giữ state giữa các khung. Đây là điều kiện để giãn thời gian được.
- Không dùng thời gian thực (`time.time()`, đồng hồ hệ thống) trong hàm vẽ.
- Phụ đề: `(bắt_đầu, kết_thúc, text)`, tối đa 2 dòng, dải cố định ở đáy khung. Mỗi đoạn phụ đề = một câu đọc.
- Font tiếng Việt: Be Vietnam Pro hiển thị đủ dấu chồng; ký tự thiếu (như `→`) thì vẽ bằng font dự phòng trên cùng dòng. Văn bản ở dạng Unicode NFC.
- Render: Pillow vẽ khung → ghi raw RGB vào `ffmpeg` → `libx264 -crf 20 -pix_fmt yuv420p`. Các cảnh render song song, ghép bằng `ffmpeg -f concat -c:v copy`.
- Khung 9:16: chữ chính trong khoảng y 180–1380, chừa khoảng 380 px ở đáy cho nút và caption của nền tảng.

## 7. Giọng đọc

### Lựa chọn

| Ngôn ngữ | Gợi ý | Ghi chú |
|---|---|---|
| Tiếng Việt | **VieNeu-TTS v3 Turbo** (github.com/pnnbao97/VieNeu-TTS) | Offline, chạy CPU, Apache-2.0; 25 giọng preset; khoảng 5–7 giây/câu trên M1 Pro; model khoảng 580 MB |
| Tiếng Anh | **Kokoro** (`kokoro-onnx`) | Offline, CPU, Apache-2.0; model khoảng 350 MB |
| Bất kỳ | Tự thu âm | Đọc theo kịch bản đánh số, lưu `clips/<id>.wav` |

Giọng VieNeu được tác giả đề xuất: Hải Đăng, Mai Anh, Thiện Minh, Ngọc Huyền, Trúc Ly, Thùy Dung (miền Nam), Quang Sơn và Ngọc Trân (miền Trung).

### Cài VieNeu (Claude tự làm)

Chủ sản phẩm chỉ cần ra lệnh, ví dụ *"Cài giọng đọc tiếng Việt"*, hoặc chọn tiếng Việt ở Vòng 0. Claude tự làm toàn bộ các bước dưới đây, không bắt chủ sản phẩm gõ lệnh. Trước khi bắt đầu, báo một dòng: cần tải khoảng 580 MB model và vài trăm MB thư viện, lần đầu mất vài phút.

1. **Kiểm tra đã cài chưa.** Nếu đã có `.venv-tts/bin/python` (trong dự án hoặc thư mục cha) và `import vieneu` chạy được thì dùng lại, bỏ qua các bước cài.
2. **Kiểm tra công cụ:**
   - `uv --version`. Nếu chưa có: `curl -LsSf https://astral.sh/uv/install.sh | sh` (macOS/Linux) hoặc `pip install uv`.
   - `ffmpeg -version`. Nếu chưa có: `brew install ffmpeg` (macOS), `apt install ffmpeg` (Linux), `winget install Gyan.FFmpeg` (Windows).
   - Lệnh cài hệ thống bị từ chối hoặc cần mật khẩu: dừng, đưa đúng một lệnh cho chủ sản phẩm tự chạy, rồi làm tiếp.
3. **Tạo môi trường riêng** (Python 3.12, `uv` tự tải nếu máy chưa có):

   ```bash
   uv venv -p 3.12 .venv-tts
   VIRTUAL_ENV=.venv-tts uv pip install vieneu "onnxruntime>=1.24,<1.25" "huggingface_hub<1.0"
   ```

   Hai bản pin là bắt buộc; bỏ pin sẽ gặp lỗi `External data path escapes model directory`. Không cài chung vào Python hệ thống hay môi trường dựng hình.
4. **Viết `tts_vieneu.py`:**
   - Đặt `os.environ.setdefault('HF_HUB_CACHE', '<dự án>/models/hf-cache')` **trước** khi import `vieneu`, để model nằm trong dự án.
   - API: `tts = Vieneu()`; `tts.list_preset_voices()` trả về `(tên, id)`; `tts.save(tts.infer(text, voice='Hải Đăng'), 'clips/01-0.wav')`.
   - Lời đọc lấy từ `script.py`, qua `lexicon.apply()` trước khi `infer`.
   - Tuỳ chọn dòng lệnh: `--list` (xem giọng), `--only 01-0,05-3` (tạo vài câu), `--force` (tạo lại), `--sample <thư mục>` (2 câu khó × 4 giọng, ghép thành một file so sánh). Mặc định bỏ qua clip đã có.
5. **Chạy thử một câu ngắn** (lần đầu tải model khoảng 1 phút), kiểm tra file `.wav` có tiếng và độ dài hợp lý.
6. **Báo chủ sản phẩm:** đã cài xong, file nghe thử ở đâu, và hỏi muốn nghe so sánh giọng (Vòng 2) không.

Gặp lỗi: đối chiếu mục 11 trước, sửa rồi chạy lại. Chỉ hỏi chủ sản phẩm khi cần quyền hệ thống hoặc cần quyết định.

### Viết lời đọc

| Phụ đề (cho mắt) | Lời đọc (cho tai) |
|---|---|
| `0.7 / 0.3` | bảy phần nghĩa, ba phần từ khoá |
| `105 ký tự` | một trăm lẻ năm ký tự |
| `SaaS Cloud` | trên đám mây |

- Số viết bằng chữ; ký hiệu (`→`, `/`, `%`, `—`) chuyển thành từ nối hoặc dấu phẩy.
- Phiên âm thuật ngữ khó trong `tu-dien-doc.md`, **không dùng gạch nối** ("ây ai", không "ây-ai"). Trước khi viết lời đọc, đọc bảng này; gặp thuật ngữ chưa có thì thêm dòng mới với trạng thái `đề xuất` và báo chủ sản phẩm nghe thử. Không phiên âm thẳng trong `script.py`.
- Mỗi giọng đọc một thuật ngữ một khác: đổi giọng phải nghe thử lại các câu khó.
- Không tăng tốc giọng bằng `atempo` (giọng méo). Muốn nhanh hơn thì gọt câu.

## 8. Nhạc nền và hiệu ứng âm thanh

### Cách 1 — Nhạc không bản quyền từ Pixabay

Nguồn: [pixabay.com/music](https://pixabay.com/music/) và [pixabay.com/sound-effects](https://pixabay.com/sound-effects/).

1. Claude đề xuất 2–3 bộ từ khoá tìm kiếm theo thể loại và nhịp video, ví dụ:
   - Tài chính, giới thiệu dự án: `corporate minimal`, `ambient technology`
   - Giải thích khoa học: `ambient calm`, `lofi study`
   - Quảng cáo: `upbeat pop`, `energetic`, kèm nhịp mong muốn (ví dụ `120 bpm`)
   - Teaser, điện ảnh: `cinematic trailer`, `epic tension`
   - Hiệu ứng: `whoosh`, `riser`, `impact`, `click`, `notification`
2. Chủ sản phẩm tự nghe, chọn, tải và đặt file vào `audio/`. Việc chọn nhạc cần tai người nghe, nên Claude không tự chọn thay.
3. Ghi vào `audio/nguon.md`: tên bản nhạc, tác giả, link trang, ngày tải.

Giấy phép (Pixabay Content License, tóm tắt): được dùng miễn phí, kể cả mục đích thương mại, không bắt buộc ghi công, được cắt ghép chỉnh sửa; **không được** bán hoặc phân phối lại file gốc đứng riêng. Một số bản nhạc có thể bị hệ thống Content ID của YouTube nhận diện; trước khi đăng YouTube, đọc ghi chú giấy phép trên trang của từng bản. Điều khoản có thể thay đổi: chủ sản phẩm là người kiểm tra cuối cùng.

### Cách 2 — Tự tổng hợp âm thanh bằng sóng

Tạo âm thanh bằng `numpy` từ sóng sin và nhiễu. Không lo bản quyền, khớp chính xác từng nhát cắt, nhưng không thay được một bản nhạc có giai điệu phức tạp.

| Âm thanh | Cách tạo |
|---|---|
| Nền (pad) | Cộng vài sóng sin theo hợp âm, bao biên độ vào/ra chậm, đổi hợp âm theo phần |
| Chuông | Tổng các hoạ âm không điều hoà, tắt dần theo hàm mũ |
| Boom (nhát cắt mạnh) | Sóng sin tần số thấp trượt xuống + nhiễu ngắn, tắt nhanh |
| Whoosh | Nhiễu trắng lọc thông dải, tần số lọc quét lên/xuống |
| Riser (trước lúc lộ tên) | Nhiễu + sóng sin có cao độ và âm lượng tăng dần |
| Tick, gõ phím, chime | Xung ngắn hoặc sóng sin cao, tắt rất nhanh |
| Mưa, gió | Nhiễu lọc thông dải + các xung ngẫu nhiên (seed cố định) |

- Lọc bằng FFT (`numpy.fft.rfft`, nhân đáp ứng tần số); vòng lặp Python từng mẫu quá chậm cho vài triệu mẫu.
- Reverb: tích chập FFT với nhiễu tắt dần theo hàm mũ.
- Mọi thời điểm phát hiệu ứng lấy từ mốc câu đọc và nhát cắt trong `script.py`, không đặt tay riêng.

### Trộn âm thanh

- **Giọng là lớp chính.** Khi có giọng, nền tự giảm còn khoảng 50% và hiệu ứng còn khoảng 30% (đường bao biên độ của giọng, trung bình trượt 0,25 giây). Với nhạc tải về có thể dùng `ffmpeg` `sidechaincompress` để đạt hiệu quả tương tự.
- Điểm khởi đầu: nhạc nền thấp hơn giọng khoảng 15 dB RMS, rồi nghe và chỉnh.
- Đo RMS từng lớp (giọng, nhạc, boom, chuông) trước khi dựng video. Chuẩn hoá theo đỉnh dễ làm một tiếng boom quyết định mức chung và át giọng.
- Nhạc vào/ra mờ dần 1–2 giây; điểm kết nhạc khớp cảnh cuối.
- `loudnorm` chạy sau cùng, trên bản trộn hoàn chỉnh (mục 9).

## 9. Đồng bộ và kiểm tra

**Giãn thời gian:** với đoạn phụ đề `(a, b)` có clip dài `d` giây, `k = max(1, (0.15 + d + 0.35) / (b - a))`. Đoạn đó được kéo dài `k` lần; hàm vẽ nhận lại `t` gốc nên animation chậm đúng chỗ. Nếu `k > 1.8`: rút gọn câu thay vì để hình bị kéo chậm.

**Co khoảng lặng:** giọng TTS thường đọc nhanh hơn ước lượng (VieNeu giọng Hải Đăng: khoảng 5 âm tiết/giây), nên nhiều đoạn phụ đề dài hơn câu đọc và để lại khoảng lặng. Cho phép co: `k = max(0.7, (0.15 + d + 0.35) / (b - a))`, tức đoạn dư thời gian được co lại, tối thiểu còn 70%. Phần cuối cảnh sau câu đọc cuối co lại còn không quá 1,6 giây. Muốn giữ nguyên nhịp hình gốc (chỉ giãn, không co) thì đặt hệ số tối thiểu bằng 1.

**Âm thanh:** `loudnorm=I=-16:TP=-1.5:LRA=11`, AAC 128 kbps, 48 kHz.

**Kiểm tra trước khi gửi:**

```bash
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,duration -of compact out.mp4
ffmpeg -i out.mp4 -af ebur128=peak=true:framelog=quiet -f null - 2>&1 | grep -A6 Summary
ffmpeg -i out.mp4 -af silencedetect=n=-40dB:d=0.4 -f null - 2>&1 | grep -c silence_end
```

- Âm lượng khoảng -16 LUFS, true peak không vượt quá -1,5 dBTP; số đoạn có tiếng khớp số câu đọc.
- Trích ảnh ở giữa vài câu đọc, đối chiếu phụ đề với hình.
- Kiểm tra kỹ thuật chỉ xác nhận cấu trúc và thời gian. Báo chủ sản phẩm nghe trực tiếp ít nhất một lượt để soát dấu thanh và cách đọc thuật ngữ.

## 10. Kiểm chứng nội dung

- Không nói quá sự thật: tránh "hoàn toàn", "triệt tiêu", "tuyệt đối"; nêu điều kiện áp dụng.
- Tính năng chưa hoàn thiện: gom thành phần riêng, dán nhãn "ĐANG HOÀN THIỆN" trên màn hình.
- Đồ hoạ dựng lại (không phải ảnh chụp thật) phải nói rõ với người duyệt.
- Dữ liệu của người hoặc tổ chức thật lọt vào khung hình: hỏi chủ sản phẩm, làm mờ nếu cần.
- Định vị sản phẩm do chủ sản phẩm quyết: hỏi, không tự suy.

## 11. Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `External data path escapes model directory` | `huggingface_hub` 1.x + `onnxruntime` mới | Pin như mục 7 |
| Ký tự `→` hiện ô vuông | Font chính không có glyph | Vẽ ký tự thiếu bằng font dự phòng |
| Video nghe nhỏ | Chưa chuẩn hoá âm lượng | `loudnorm` ở bước ghép |
| "AI" đọc gãy thành "ây – ai" | Phiên âm có gạch nối | Viết liền "ây ai" |
| Giọng nghe như trẻ con | Tăng tốc bằng `atempo` | Giữ tốc độ gốc, gọt câu |
| Hình bị kéo chậm lê thê | Câu đọc dài hơn khung phụ đề quá nhiều | Rút gọn câu |
| Lớp glow thành khối màu đặc | Cộng RGB của lớp RGBA mà bỏ qua alpha | Nhân alpha trước khi cộng |
| File quá nặng để gửi Discord/Telegram | Bitrate cao, nhiều grain | Xuất thêm bản nhẹ (crf cao hơn), giữ bản chính |
