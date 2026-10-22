# Engine motion: dựng video bằng Canvas 2D theo Motion Prompt

Cách dựng thứ hai, song song với pipeline phấn (`shared/chalk.py`). Hình vẽ bằng Canvas 2D (`@napi-rs/canvas`, chạy trong Node, không cần trình duyệt), theo phong cách và các kiểu chuyển động của [Motion Prompt](https://github.com/showheyohtaki/motion-prompt) (MIT, Shohei Ohtaki). Giọng đọc, mốc thời gian, `script.py` và phần trộn tiếng vẫn dùng chung với pipeline phấn.

## Chạy

Cài một lần (Node 18+):

```bash
cd promo/motion && npm install
```

Soát ảnh tĩnh, rồi dựng cả tập:

```bash
promo/.venv-render/bin/python promo/motion/build.py promo/trust-center/01-khi-moi-node-cung-ky-sai --stills
promo/.venv-render/bin/python promo/motion/build.py promo/trust-center/01-khi-moi-node-cung-ky-sai
```

Kết quả: `<tập>/out/<tập>-motion.mp4`, ảnh soát ở `<tập>/stills-motion/`. Tập 01 (khoảng 9.200 khung) dựng trong vài phút trên M1 Pro.

## Cấu trúc

| File | Việc |
|---|---|
| `build.py` | Lấy mốc từ clip giọng (cùng `chalk.Timing`), ghi `<tập>/motion/timeline.json`, gọi `render.mjs`, trộn tiếng bằng `shared/audio.py`, ghép MP4 |
| `render.mjs` | Vẽ từng khung, chuyển cảnh bằng dải màu, split screen cho đoạn ví dụ, đẩy khung sang ffmpeg, gom tiếng hiệu ứng ra `sfx-motion.json` |
| `fx.mjs` | Các kiểu chuyển động port từ Motion Prompt (giữ dòng giấy phép MIT của từng phần tử) |
| `ui.mjs` | Biểu tượng phẳng: node, bản chốt, đồng tiền, người, ví, két, con mắt, bánh răng, nhà, ngân hàng, hoá đơn, sổ… |
| `<tập>/motion/scenes.mjs` | Bố cục từng cảnh của tập; thẻ "Ví dụ" khai `rows` và `icon` |

Cảnh là hàm thuần `draw(k, t, T)`: `T.L(i, f)` là lúc câu `i` đọc được `f` phần. Các hàm hiệu ứng tự ghi mốc tiếng (`ev`), nên phải được gọi vô điều kiện; khi cần ẩn hiện thì bọc bằng `layer(k, alpha, fn)` thay cho `if`.

## Dựng riêng vài cảnh, bản thử 2.5D

`--only 01` chỉ dựng các cảnh được chọn (tiếng trộn lại cho đúng đoạn đó); `--scenes` chọn file cảnh khác trong `<tập>/motion/`; `--tag` đặt tên file ra.

Bản chính của tập 01 là 2.5D isometric (`scenes-iso.mjs`, ra `out/<tập>-iso.mp4`): Cardano là mặt đất, Hydra Head là tấm nổi phía trên, node, két ký quỹ, hợp đồng, cột tiền là khối hộp; thẻ "Ví dụ" và rows lấy từ `scenes.mjs`. Bản 2D (`scenes.mjs`, ra `out/<tập>-motion.mp4`) giữ để tham khảo. Dựng cả tập bản 2.5D, hoặc riêng một cảnh:

```bash
promo/.venv-render/bin/python promo/motion/build.py promo/trust-center/01-khi-moi-node-cung-ky-sai --scenes scenes-iso.mjs --tag iso
promo/.venv-render/bin/python promo/motion/build.py promo/trust-center/01-khi-moi-node-cung-ky-sai --scenes scenes-iso.mjs --only 01 --tag iso-01
```

`iso.mjs` có phép chiếu isometric (`view`), khối hộp ba mặt sáng tối (`box`), vòng và bóng trên mặt phẳng (`ring`, `shadow`), đường chấm (`dashed`) và nhãn đứng (`label`). Không có che khuất tự động: cảnh vẽ từ xa tới gần theo `x + y`. Chữ và thẻ vẫn vẽ phẳng (billboard) để dễ đọc.

## Kiểu chuyển động đã port

Port theo cách "move the numbers" trong hướng dẫn của Motion Prompt: giữ nguyên thời lượng, easing, độ vượt đích; nội dung, màu và bố cục thay bằng của tập.

| Số | Tên | Dùng cho |
|---|---|---|
| [#001](https://showheyohtaki.github.io/motion-prompt/#001) | Pop-in | node, thẻ, nhãn, dấu tích bật ra bằng lò xo |
| [#002](https://showheyohtaki.github.io/motion-prompt/#002) | Stagger | ô số dư, cột ký quỹ, dãy con mắt canh gác hiện so le |
| [#004](https://showheyohtaki.github.io/motion-prompt/#004) | Line draw | đường chứng minh, đường nối node, vòng khoanh |
| [#005](https://showheyohtaki.github.io/motion-prompt/#005) | Mask reveal | tiêu đề mỗi cảnh, tiêu đề kết |
| [#007](https://showheyohtaki.github.io/motion-prompt/#007) | Count-up | đồng hồ 48 giờ đếm lùi, "0 giờ" nảy khi chạm đích |
| [#018](https://showheyohtaki.github.io/motion-prompt/#018) | Shape transition | chuyển cảnh bằng bốn dải màu |
| [#022](https://showheyohtaki.github.io/motion-prompt/#022) | Light sweep | huy hiệu BONDED |
| [#024](https://showheyohtaki.github.io/motion-prompt/#024) | Impact shake | dấu "Cardano: hợp lệ", "phạt ngay", "phạt" rơi xuống, cả khung rung |
| [#125](https://showheyohtaki.github.io/motion-prompt/#125) | Pulse | vòng lan quanh node thông đồng, két bị khoá |
| [#126](https://showheyohtaki.github.io/motion-prompt/#126) | Motion path | chữ ký, biên lai, tiền đi theo đường chấm và để lại vệt |
| [#129](https://showheyohtaki.github.io/motion-prompt/#129) | Text scramble | mã tóm tắt số dư |
| [#144](https://showheyohtaki.github.io/motion-prompt/#144) | Split screen | đoạn ví dụ: khung tách đôi, nửa phải là thẻ "Ví dụ" nền kem |

Muốn đổi hoặc thêm kiểu: cài skill (`npx skills add showheyohtaki/motion-prompt`), mở thư viện để chọn, lấy code bằng `get <số>` rồi port vào `fx.mjs`.

## Font

Be Vietnam Pro (Medium, SemiBold, Bold, ExtraBold) và JetBrains Mono trong `shared/fonts/`, giấy phép SIL OFL. Be Vietnam Pro không có ký tự `→`; các ký hiệu `≠ ≥ <` hiển thị được.
