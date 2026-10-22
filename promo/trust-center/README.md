# Chuỗi video Trust Center (Hydra delegated topology)

Chuỗi giải thích Trust Center cho Hydra delegated topology, dựng bằng cùng pipeline với chuỗi Cardano & Hydra (`promo/shared`). Nguồn sự thật là các tài liệu thiết kế trong `hydraone/_bmad-output/planning-artifacts/trust-center-*.md`; mỗi tập ghi rõ tài liệu và trạng thái của nó trong `brief.md`.

## Danh sách tập

| Tập | Chủ đề | Thời lượng | Trạng thái |
|---|---|---|---|
| 01 | Khi mọi node cùng ký sai: biên nhận, ký quỹ và thách thức (Trust Center v2) | 6:31 | Tập thử bộ chuyển động mới; bản đầu, chờ duyệt |

Tập 01 dựng từ cùng kịch bản và giọng đọc theo ba cách: bản chính 2.5D isometric theo Motion Prompt (`motion/build.py --scenes scenes-iso.mjs --tag iso`, ra `out/<tập>-iso.mp4`), bản 2D theo Motion Prompt (`out/<tập>-motion.mp4`) và bản phấn (`shared/build.py`, ra `out/<tập>-full.mp4`, chưa dựng lại sau khi bỏ cảnh 12); xem [../motion/README.md](../motion/README.md). Cảnh "cần thử trước khi viết đặc tả" đã bỏ khỏi kịch bản theo yêu cầu chủ sản phẩm.

Cấu trúc mỗi tập giống chuỗi cũ: `brief.md`, `script.py` (nguồn duy nhất), `kich-ban.md` (sinh từ `script.py`), `scenes.py`.

Mỗi cảnh nói phần kỹ thuật trước, sau đó là một đoạn ví dụ để so sánh; câu mở đầu đoạn ví dụ bắt đầu bằng "Ví dụ,". Lời đọc được trau chuốt bằng agy CLI (`review-prompt-agy.md`, kết quả ở `review-agy.md`). agy chạy headless sẽ tự từ chối quyền đọc file, nên dán brief và lời đọc thẳng vào prompt: `agy --mode plan --disable-slash-commands -p "$(cat prompt.md)"`; cờ `-p` phải đặt cuối, ngay trước chuỗi prompt.

Khác chuỗi cũ ở cách đọc thuật ngữ: không phiên âm tiếng Việt, lời đọc giữ nguyên tiếng Anh và đặt trong nháy kép, ví dụ "snapshot". `script.py` khai `READ_MODE = 'quote'` để `tts_vieneu.py` bỏ qua `shared/tu-dien-doc.md`.

## Bộ chuyển động mới (`shared/chalk.py`)

Các hàm dưới đây thêm vào sau tập 12 của chuỗi cũ. 6 tập đã dựng của chuỗi cũ (01–06) dựng lại vẫn ra đúng từng pixel và đúng danh sách tiếng hiệu ứng như trước.

| Hàm | Tác dụng |
|---|---|
| `b.cam(t0, t1, zoom, cx, cy)`, `b.cam_reset(t0, t1)` | Camera đẩy vào hoặc kéo ra một vùng bảng; zoom nội suy theo log, khung nhìn không ra ngoài mép bảng; tự thêm tiếng gió lướt |
| `b.shake(t, dur, amp)` | Rung bảng khi phạt, đóng băng |
| `el.pop(at)`, `el.scale(t0, t1, s0, s1, kind)` | Bật ra có nảy; phóng to, thu nhỏ một phần tử hoặc cả group |
| `el.move(..., kind)` | Thêm kiểu easing: `smooth` (mặc định), `out`, `expo`, `back`, `spring`, `linear` |
| `b.packet(pts, at)` | Chấm dữ liệu chạy dọc đường gấp khúc, có vệt và nhãn tuỳ chọn |
| `b.ripple(x, y, at)` | Gợn sóng toả ra rồi tan, báo một sự kiện |
| `b.ring(x, y, rx, ry, at)` | Vòng phấn khoanh tay quanh chỗ cần nhấn |
| `b.focus(t0, t1, keep)` | Làm mờ mọi thứ đang hiện trừ các phần tử trong `keep` |
| `b.counter(x, y, v0, v1, at)` | Số đếm lên hoặc xuống, `fmt` là chuỗi định dạng hoặc hàm |
| `b.stagger(items, at, step)` | Cho một nhóm hiện so le, kèm pop |
| `b.wipe(t, dur)` | Lau bảng theo vệt ngang, phần tử hơi trôi lên khi tan; một tiếng lau cho cả vệt |
| `Path(..., glow=True, fill=màu, fill_level=0.22)` | Viền sáng mờ quanh nét; tô nền nhạt cho hình kín |
| `b.group(..., hud=True)` | Lớp HUD: vẽ sau camera, không bị zoom, dùng cho thẻ nằm cố định trên màn hình |
| `b.cam(..., zoom < 1)` | Camera lùi: cả bảng thu nhỏ, phần ngoài bảng là nền |

Tập 01 dùng hai hàm trên để làm đoạn ví dụ (`example()` trong `scenes.py`): camera lùi để sơ đồ kỹ thuật thu về bên trái, thẻ "Ví dụ" (HUD) trượt vào bên phải, mỗi dòng trên thẻ hiện đúng lúc câu tương ứng được đọc.

Âm thanh thêm `whoosh` (tiếng gió lướt) cho camera và chuyển cảnh. `scenes.py` có thể khai `CHORD_CHANGES` để chọn cảnh đổi hợp âm nền.

Nền: `scenes.py` khai `BACKGROUND = 'clean'` để dùng nền phẳng màu than, sáng nhẹ ở giữa, vân phấn trên nét rất nhẹ. Chuỗi Trust Center dùng nền này. Không khai thì giữ bảng đen loang `'chalk'` của chuỗi cũ.

Lưu ý khi dùng:

- `Group` có `at = 0`; `focus`, `wipe`, `stagger` lấy mốc hiện thật của group bằng `el.start()`. Gọi `g.pop(at)` cho group thì luôn truyền `at`.
- Font Mali thiếu ∈ ∉ Σ: chuỗi có các ký hiệu này dùng `mono=True` (JetBrains Mono).

## Chạy trên Mac (Apple Silicon)

Không có CUDA: `build.py` tự ghép khung bằng numpy và mã hoá bằng libx264. Tập 01 (khoảng 7.600 khung) dựng trong vài phút trên M1 Pro.

ONNX Runtime từ chối model VieNeu nếu file trong cache Hugging Face là symlink (mặc định trên macOS). Chép model ra file thật trong `promo/models/hf-cache` (đã gitignore), sau đó `tts_vieneu.py` tự dùng thư mục này:

```bash
SRC=~/.cache/huggingface/hub; DST=promo/models/hf-cache
for m in models--pnnbao-ump--VieNeu-TTS-v3-Turbo models--OpenMOSS-Team--MOSS-Audio-Tokenizer-Nano-ONNX; do mkdir -p $DST/$m/snapshots && cp -R $SRC/$m/refs $DST/$m/ && cp -RL $SRC/$m/snapshots/* $DST/$m/snapshots/; done
```

Tạo giọng, soát ảnh tĩnh, dựng cả tập:

```bash
HF_HUB_OFFLINE=1 promo/.venv-tts/bin/python promo/shared/tts_vieneu.py promo/trust-center/01-khi-moi-node-cung-ky-sai
promo/.venv-render/bin/python promo/shared/build.py promo/trust-center/01-khi-moi-node-cung-ky-sai --stills
promo/.venv-render/bin/python promo/shared/build.py promo/trust-center/01-khi-moi-node-cung-ky-sai
```
