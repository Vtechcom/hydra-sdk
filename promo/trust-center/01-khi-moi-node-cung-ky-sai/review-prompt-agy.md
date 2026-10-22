# Yêu cầu trau chuốt lời đọc (dành cho agy)

Bạn là biên tập viên lời đọc cho video giải thích tiếng Việt, đồng thời hiểu Cardano và Hydra. Video: Trust Center tập 1, khán giả là studio game, nhà cung cấp node và người chơi chưa rành kỹ thuật. Giọng đọc máy (VieNeu-TTS), nên câu phải dễ đọc to.

Đọc:

- `brief.md` cùng thư mục: brief và ranh giới sự thật.
- `lines.json` (đường dẫn trong lệnh gọi): lời đọc hiện tại, khoá là mã câu `<cảnh>-<câu>`.
- Tài liệu nguồn: `trust-center-safety-v2-design.md` trong thư mục hydraone được thêm vào workspace.
- Mẫu giọng văn chủ sản phẩm muốn: phần "Mẫu giọng văn" ở cuối file này.

Yêu cầu khi viết lại:

1. Giữ đúng sự thật theo tài liệu nguồn; không thêm con số hay tính năng mới. Đây là bản thiết kế, chưa chạy thử.
2. Giữ ví dụ xuyên suốt: ba node X, Y, Z; người chơi An có 100 ADA; bản chốt; biên lai; 5 ADA đặt cọc; 48 giờ.
   Mỗi cảnh nói phần kỹ thuật trước, sau đó là đoạn ví dụ so sánh với đời thường (ba thủ quỹ giữ sổ quỹ chung, biên lai gửi tiền, tiền cọc thuê nhà, quầy khiếu nại...).
   Câu mở đầu đoạn ví dụ bắt đầu bằng "Ví dụ,". Tuyệt đối không dùng cụm "ví dụ đời thường". Ví dụ phải khớp với phần kỹ thuật ngay trước nó, không gây hiểu sai.
3. Thuật ngữ tiếng Anh giữ nguyên và đặt trong nháy kép `"..."` (ví dụ "Head", "node", "Cardano", "ADA"); không phiên âm tiếng Việt. Không thêm thuật ngữ tiếng Anh mới nếu có từ Việt tự nhiên.
4. Văn nói tự nhiên, không như dịch máy; mỗi câu khoảng 12–30 âm tiết; không dùng dấu hai chấm kiểu liệt kê; số viết bằng chữ ("một trăm", "bốn mươi tám").
5. Chỗ nào còn khó hiểu cho người không làm kỹ thuật, đổi sang cách nói đời thường hoặc thêm một vế giải thích ngắn, nhưng không kéo dài quá 20% số âm tiết của câu. Video được phép dài hơn nếu cần cho dễ hiểu.
6. Mỗi mã câu vẫn là một câu hoặc hai câu ngắn (một clip giọng); không gộp, không tách mã câu.

Đầu ra (in ra màn hình, không ghi file nào):

1. Bảng `| mã câu | bản cũ | bản mới | lý do |`, chỉ gồm câu có sửa.
2. Một khối ```json``` duy nhất chứa TOÀN BỘ mã câu → lời đọc mới (kể cả câu giữ nguyên).
3. Tối đa 5 nhận xét chung về độ dễ hiểu và sự thật.

Không sửa file nào, không chạy lệnh cài đặt, không commit.

## Mẫu giọng văn

> Bối cảnh. Một Hydra Head do ba node X, Y, Z vận hành. Người chơi An có 100 ADA trong head nhưng không giữ node nào. Hydra quy định cứ mỗi lần trạng thái trong head thay đổi, cả ba node phải cùng ký vào bản chốt trạng thái mới (snapshot), tức bản ghi "ai đang có bao nhiêu tiền". Nếu cả ba cùng thông đồng, họ có thể ký một bản chốt trong đó 100 ADA của An đã chuyển sang ví của họ. Bản chốt này đủ chữ ký nên Cardano vẫn chấp nhận khi đóng head.
>
> Biên lai. Từ bản Hydra 2.2.0, Cardano có thể kiểm tra được một khoản tiền cụ thể có nằm trong một bản chốt đã được ký hay không. Nhờ vậy, mỗi khi An nhận tiền, phần mềm cạnh node sẽ đưa cho An một biên lai. Biên lai chỉ được tạo từ chữ ký sẵn có của Hydra, nên An không cần tin phần mềm nào: ví của An tự kiểm tra được biên lai thật hay giả.
>
> Gian lận kiểu thứ hai: lấy tiền của An. Giả sử head đóng lại và bản chốt cuối cùng đưa lên Cardano không còn 100 ADA của An. An, hoặc một dịch vụ canh gác thay mặt An, nộp biên lai lên hợp đồng và đặt cọc 5 ADA. Ngay lúc đó, tiền ký quỹ của cả ba node bị khoá lại, không ai rút được. Các node có 48 giờ để trả lời bằng một trong hai cách.
>
> Vì sao phạt cả ba node là công bằng. Bản chốt cuối có chữ ký của cả ba. Nếu trong ba node có một node trung thực, node đó đã không ký bản chốt lấy tiền của An. Node trung thực cũng luôn trả lời được trong 48 giờ, vì nó có lưu dữ liệu của head.
