# Promo — chuỗi video Cardano & Hydra

Nội dung media giới thiệu kiến thức nền Cardano, công nghệ Hydra và hydra-sdk. Quy trình làm việc theo [claude-media-team.md](claude-media-team.md): video là code (Python + Pillow + ffmpeg), mỗi vòng có điểm dừng chờ duyệt.

## Cấu trúc

```
promo/
  claude-media-team.md      # Quy trình team media (biên kịch, thiết kế, lồng tiếng, dựng, kiểm định)
  TOM-TAT-SESSION.md        # Tóm tắt quyết định, cách dựng, bài học, việc còn mở, nội dung đăng Discord
  Y-TUONG-CHUOI-VIDEO.md    # Ý tưởng tập mới và cải tiến cho cả chuỗi
  REVIEW-PROMPT.md          # Yêu cầu review kịch bản dùng cho agy
  REVIEW-AGY-TONGHOP.md     # Tổng hợp review của agy cho cả chuỗi
  REVIEW-PROMPT-BRIEF.md    # Yêu cầu agy review nội dung brief, trước khi viết kịch bản (tập 07 trở đi)
  knowledge/                # Tài liệu nguồn (bài giảng, ghi chép) để đối chiếu sự thật
  shared/                   # Dùng chung cho mọi tập
    tu-dien-doc.md          # Từ điển đọc thuật ngữ cho giọng tiếng Việt
    lexicon.py              # Áp từ điển đọc vào lời đọc trước khi tạo giọng
    tts_vieneu.py           # Tạo clip giọng (VieNeu-TTS, mặc định giọng Hải Đăng)
    chalk.py                # Vẽ phấn trên bảng đen: phần tử vẽ dần theo t, ghép khung
    audio.py                # Nền, tiếng phấn, tick, chuông… tự tổng hợp bằng numpy; trộn có giảm nền khi có giọng
    build.py                # Dựng tập: mốc từ clip giọng → vẽ song song → NVENC → trộn tiếng → MP4
    fonts/                  # Mali (chữ phấn), JetBrains Mono (code), Be Vietnam Pro — SIL OFL
  videos/
    01-utxo/                # Tập 1 — UTxO là gì?
      brief.md              # Brief, nguồn tham khảo, ranh giới sự thật
      script.py             # Nguồn duy nhất của kịch bản
      kich-ban.md           # Bảng duyệt, sinh từ script.py
      scenes.py             # Bố cục từng cảnh trên bảng
      review-agy.md         # Nhận xét của agy cho tập này
    02-hydra-la-gi/ … 06-thuc-hanh-hydra-sdk/   # Cùng cấu trúc
```

Các tập sau thêm thư mục `videos/<số>-<chủ-đề>/` cùng cấu trúc.

## Danh sách tập

| Tập | Chủ đề | Thời lượng | Trạng thái |
|---|---|---|---|
| 01 | UTxO là gì? | 6:20 | Bản 3, chờ góp ý |
| 02 | Hydra là gì? | 5:14 | Bản đầu, chờ góp ý |
| 03 | Vòng đời của một Hydra Head | 5:26 | Bản đầu, chờ góp ý |
| 04 | Ví thật ra giữ gì? Khoá, địa chỉ và cụm từ khôi phục | 4:36 | Bản đầu, chờ góp ý |
| 05 | Hợp đồng thông minh trên eUTxO | 5:19 | Bản đầu, chờ góp ý |
| 06 | Thực hành: giao dịch đầu tiên trong Hydra Head | 6:13 | Bản đầu, chờ góp ý |
| 07 | Phí giao dịch trên Cardano được tính thế nào? | ~5:07 (ước lượng) | Kịch bản, chờ duyệt; chưa dựng |
| 08 | Token và NFT trên Cardano: tờ tiền lạ trong phong bì | ~5:59 (ước lượng) | Kịch bản, chờ duyệt; chưa dựng |
| 09 | Khối, đồng thuận và staking: ai được ghi sổ Cardano? | ~5:44 (ước lượng) | Kịch bản, chờ duyệt; chưa dựng |
| 10 | Hydra dùng vào việc gì? | ~5:13 (ước lượng) | Kịch bản, chờ duyệt; chưa dựng |
| 11 | Gỡ lỗi giao dịch Hydra thường gặp | ~5:36 (ước lượng) | Kịch bản, chờ duyệt; chưa dựng |
| 12 | Bảo mật cho người dùng mới, phần 2: trang giả, ký mù và token lạ | ~5:56 (ước lượng) | Kịch bản, chờ duyệt; chưa dựng |

Tập 07–12 mới có `brief.md`, `review-agy-brief.md` (agy review nội dung brief trước khi viết lời), `script.py` và `kich-ban.md`; chưa có `scenes.py`, chưa tạo giọng, chưa dựng.

Ý tưởng cho các tập tiếp theo: [Y-TUONG-CHUOI-VIDEO.md](Y-TUONG-CHUOI-VIDEO.md).

## Lệnh

Cài môi trường (một lần):

```bash
uv venv -p 3.12 promo/.venv-tts
VIRTUAL_ENV=promo/.venv-tts uv pip install vieneu "onnxruntime>=1.24,<1.25" "huggingface_hub<1.0"
uv venv -p 3.12 promo/.venv-render
VIRTUAL_ENV=promo/.venv-render uv pip install pillow numpy imageio-ffmpeg
```

Xuất lại bảng duyệt sau khi sửa kịch bản:

```bash
python promo/videos/01-utxo/script.py
```

Tạo giọng (bỏ qua clip đã có; `--only 03-2 --force` để tạo lại một câu):

```bash
promo/.venv-tts/Scripts/python promo/shared/tts_vieneu.py promo/videos/01-utxo
```

Soát ảnh tĩnh, dựng nháp vài cảnh, dựng cả tập:

```bash
promo/.venv-render/Scripts/python promo/shared/build.py promo/videos/01-utxo --stills
promo/.venv-render/Scripts/python promo/shared/build.py promo/videos/01-utxo --only 03,07
promo/.venv-render/Scripts/python promo/shared/build.py promo/videos/01-utxo
```

Video mã hoá bằng `h264_nvenc` (GPU NVIDIA); thêm `--cpu` để dùng `libx264`. Khung hình vẽ song song trên mọi nhân CPU.

File sinh ra khi dựng (clip giọng, ảnh soát, MP4, model TTS, môi trường Python) không đưa vào git; xem `.gitignore`.
