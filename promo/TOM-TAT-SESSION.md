# Tóm tắt session dựng chuỗi video Cardano & Hydra

Session ngày 15–16/10/2026, chủ sản phẩm: Ania. Mục tiêu: chuỗi video giải thích kiến thức nền Cardano và Hydra cho người chưa biết gì về blockchain, đồng thời giới thiệu hydra-sdk. Quy trình theo [claude-media-team.md](claude-media-team.md).

## Kết quả

| Tập | Thư mục | Thời lượng | Trạng thái |
|---|---|---|---|
| 1. UTxO là gì? | `videos/01-utxo` | 6:20 | Bản 3, đã sửa theo review của agy |
| 2. Hydra là gì? | `videos/02-hydra-la-gi` | 5:14 | Bản đầu |
| 3. Vòng đời Hydra Head | `videos/03-vong-doi-hydra-head` | 5:26 | Bản đầu |
| 4. Ví, khoá và địa chỉ | `videos/04-vi-khoa-dia-chi` | 4:36 | Bản đầu |
| 5. Hợp đồng thông minh eUTxO | `videos/05-hop-dong-thong-minh-eutxo` | 5:19 | Bản đầu |
| 6. Thực hành với hydra-sdk | `videos/06-thuc-hanh-hydra-sdk` | 6:13 | Bản đầu |

Mọi tập đo được khoảng −17 LUFS, đỉnh dưới −2 dBFS. Chủ sản phẩm đang nghe cả 6 tập để gửi góp ý. File MP4, clip giọng và ảnh soát nằm trong `out/`, `clips/`, `stills/` của từng tập, không đưa vào git; dựng lại được bằng các lệnh trong [README.md](README.md).

## Quyết định đã chốt (dùng chung cho cả chuỗi)

- Thể loại giải thích khoa học; phong cách phấn trắng trên nền đen, nét vẽ hiện dần; khung 16:9, 1920×1080, 25 fps.
- Lời đọc tiếng Việt, giọng Hải Đăng (VieNeu-TTS v3 Turbo); không có phụ đề chạy, chữ trên màn hình chỉ là chữ viết lên bảng.
- Âm thanh tự tổng hợp: nền hợp âm, tiếng phấn, tick, chuông, trầm, lau bảng; nền tự giảm khi có giọng.
- Cuối mỗi tập: hydrasdk.com ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc, không đọc thành lời.
- Khán giả: người chưa biết gì về blockchain, mỗi tập có một đoạn ngắn cho lập trình viên.
- UTxO gọi là "món tiền chưa tiêu" (thay cho "đầu ra chưa tiêu" vì khó hiểu). Ẩn dụ xuyên chuỗi: món tiền mang ổ khoá; khoá bí mật là chìa, chữ ký là bằng chứng có chìa; ví giữ chìa, không giữ tiền.
- Cách đọc thuật ngữ nằm trong [shared/tu-dien-doc.md](shared/tu-dien-doc.md). Đã chốt: Bitcoin "bít coi", Ethereum "E thơ rum", blockchain "Bờ lốc chên", UTxO "iu ti ích ô", Cardano "Ca đa nô", eUTxO "i iu ti ích ô", Hydra "hai dra", token "tốc cừn", script "scờ ríp", TxBuilder "Tê ích biu đơ", datum "đa từm", snapshot "xờ náp sót", HydraBridge đọc là "cầu nối Hydra".
- Tập 3 kể vòng đời theo Hydra v2 (mở Head trước, nạp tiền sau) và giữ cảnh 04 so sánh với v1.
- Tập 6 vẽ phấn lại theo kết quả mẫu trong tài liệu (không chụp màn hình thật), chỉ nhắc lại Head đã mở ở tập 3, có nhãn "Code rút gọn, bản đầy đủ ở hydrasdk.com".

## Cách dựng (đã làm được)

- `shared/chalk.py`: phần tử vẽ dần theo t, đường run tay, vân phấn; ghép khung trên GPU bằng CuPy, quay về numpy nếu không có CUDA.
- `shared/build.py`: mốc thời gian lấy từ độ dài clip giọng thật; vẽ song song trên mọi nhân CPU; mã hoá `h264_nvenc` (GTX 1080); trộn tiếng, `loudnorm` và giới hạn đỉnh. Cả tập render khoảng 3–4 phút, khoảng 41 khung/giây.
- `Timing` có cơ chế nhịp (`BEATS`): khi gộp hai câu đọc thành một, cảnh vẫn neo hình theo nhịp cũ.
- `shared/lexicon.py`: thay thuật ngữ trước khi tạo giọng, cụm dài thay trước, tự khớp cả dạng viết hoa đầu câu.
- Tập 2–6 được viết song song bởi 5 phiên riêng (mỗi phiên chỉ ghi vào thư mục tập của mình), phiên chính gom thuật ngữ và render lần lượt trên GPU.

## Bài học

- Font Itim vẽ dính dấu chồng ("Lỗ hổng" thành "Lõ hổng"); đổi sang Mali. Font Itim và Mali đều không có ký tự ₳, ✓, ✗: dùng chữ "ADA" và vẽ dấu tích, dấu chéo bằng nét.
- Lời đọc bản đầu bị chê "như dịch máy". Cách sửa: không dùng dấu hai chấm kiểu liệt kê, dùng "Thứ nhất, …"; gộp câu cụt thành nhịp hỏi–đáp; không viết câu phụ thuộc hình; tránh từ dịch máy; đọc số đúng ("mười chín phẩy tám mươi ba"). Haiku review văn phong, agy CLI review sự thật và độ liền mạch.
- Phải đối chiếu code trước khi đưa vào lời đọc: `TxBuilder.setInputUtxo(UTxOObject)` vẫn là TODO, đường chạy được là `setInputs(UTxO[])`; tập 1 cảnh 15 đã sửa thành "danh sách món tiền".
- agy CLI ở `C:\Users\aniadev9\AppData\Local\agy\bin\agy.exe` (chưa có trong PATH). Chế độ `-p` không xin được quyền chạy lệnh, nên chạy `--mode plan` (chỉ đọc), cho in kết quả ra stdout rồi ghi file. Không dùng `--dangerously-skip-permissions`.
- Đo tốc độ trước khi tối ưu: bước ghép khung (làm mờ, vân phấn, hoà nền) chiếm khoảng 95% thời gian mỗi khung, nên đưa lên GPU mới có tác dụng; NVENC một mình không làm GPU "chạy".

## Việc còn mở

- Chờ góp ý của chủ sản phẩm sau khi nghe 6 tập (ghi theo mã câu, ví dụ "tập 3, câu 07-2").
- Chốt các cách đọc còn ở trạng thái đề xuất: ADA, lovelace, JSON, Head, WebSocket, redeemer, Plutus, core, byte, playground, TypeScript, JavaScript, code, AppWallet, EmbeddedWallet, DatumUtils, RedeemerUtils, PlutusUtils, Plutus Data, playground.hydrasdk.com.
- Logo VTechcom Labs cho cảnh cuối (hiện chỉ có dòng chữ).
- Khi hydra-sdk đổi phiên bản, rà lại tập 3 và tập 6 (bám hydra-node v2 và API `TxBuilder` hiện tại).

## Nội dung đăng Discord

Caption từng tập (dán kèm video):

**Tập 1: UTxO là gì?** Trên Bitcoin hay Cardano không có "ô số dư" như ngân hàng. Vậy tiền của bạn nằm ở đâu?
- UTxO là một "món tiền chưa tiêu", giống từng tờ tiền trong ví
- Mỗi giao dịch tiêu trọn món cũ, sinh ra món mới, kể cả tiền thối
- Mỗi món được khoá bằng một điều kiện; ví giữ chìa khoá chứ không giữ tiền
- Mỗi món có tên riêng `txHash#index`; hydra-sdk ghi chúng bằng `UTxOObject`

**Tập 2: Hydra là gì?** Chuyện của bốn người, sao phải chờ cả mạng Cardano xác nhận?
- Hydra Head là "phòng họp riêng": ghi sổ với nhau, xong mới đem kết quả ra sổ chung
- Lớp 1 là Cardano, lớp 2 là Hydra; bên trong Head vẫn là mô hình UTxO
- Chỉ người trong phòng cần đồng ý, không chờ khối mới
- Có người bỏ đi, tiền vẫn được trả về theo snapshot cuối cùng

**Tập 3: Vòng đời của một Hydra Head**
- Sáu chặng: mở Head, nạp tiền, giao dịch, đóng, khiếu nại, trả về
- Từ Hydra v2: Head mở trước, tiền nạp sau
- Snapshot mới nhất có đủ chữ ký là bản quyết định khi đóng Head
- Cho dev: `HydraBridge` theo dõi trạng thái Head qua WebSocket

**Tập 4: Ví thật ra giữ gì?**
- Khoá bí mật là chìa; khoá công khai và địa chỉ là ổ khoá, đưa cho ai cũng được
- Chữ ký chứng minh bạn có chìa mà không phải đưa chìa
- Cụm từ khôi phục sinh ra cả chùm chìa; mất cụm từ là mất chìa
- Ai hỏi cụm từ khôi phục, hãy coi đó là lừa đảo

**Tập 5: Hợp đồng thông minh trên eUTxO**
- Script là luật canh giữ món tiền, chỉ trả lời có hoặc không
- Datum là tờ ghi chú trên két, redeemer là tờ đơn xin mở
- Biết trước giao dịch hợp lệ hay không ngay trên máy mình
- Cho dev: `DatumUtils`, `RedeemerUtils`, `PlutusUtils`, `TxBuilder`

**Tập 6: Thực hành, giao dịch đầu tiên trong Hydra Head**
- Sáu bước: kết nối, lấy snapshot, dựng giao dịch, ký, gửi, xem snapshot mới
- `TxBuilder` tự chọn món và tạo tiền thối
- Ba lỗi hay gặp và cách tránh
- Thử ngay trên playground.hydrasdk.com

Giới thiệu chuỗi, kênh #hydra-sdk:

> **Chuỗi video: Cardano & Hydra cho người mới bắt đầu**
>
> Chuỗi video ngắn giải thích từ nền tảng Cardano tới cách dùng hydra-sdk, dễ theo cho cả người chưa biết gì về blockchain. Mỗi tập có thêm một đoạn ngắn cho lập trình viên.
>
> - Các tập đầu: UTxO, Hydra là gì, vòng đời Hydra Head, ví và khoá, hợp đồng thông minh, thực hành giao dịch đầu tiên trong Head
> - Các tập mới sẽ tiếp tục được đăng trong kênh này
> - Code trên màn hình đã đối chiếu với API hiện tại của SDK
>
> Tài liệu: hydrasdk.com · Thử ngay: playground.hydrasdk.com
> Góp ý hoặc đề xuất chủ đề, mọi người cứ để lại trong kênh.

Thông báo nội bộ, kênh #vn-general (server VTechcom):

> **VTechcom Labs ra mắt chuỗi video giải thích Cardano & Hydra**
>
> Chuỗi video ngắn, lời đọc tiếng Việt, giải thích blockchain Cardano và Hydra từ con số không, đồng thời giới thiệu hydra-sdk. Các tập đầu đã xong, các tập tiếp theo sẽ ra dần.
>
> Mọi người xem thử và góp ý giúp, nhất là chỗ giải thích còn khó hiểu, câu đọc chưa tự nhiên, hoặc chủ đề nên làm tiếp.
>
> Tài liệu hydra-sdk: hydrasdk.com
