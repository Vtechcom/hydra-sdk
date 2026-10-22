# Review văn phong của agy — Trust Center tập 1

agy chạy ở chế độ không quyền ghi (`agy --mode plan -p`), mọi tài liệu dán thẳng trong prompt. Đã áp dụng mọi đề xuất, trừ: `09-0` và `10-1` (agy dùng cách nói tuyệt đối "hoàn toàn công bằng", "không thể có lời"), `10-2` (giữ con số 100 triệu / 120 triệu vì ví dụ cụ thể dễ hiểu hơn), `13-1` (giữ câu kết ngắn).

### 1. Bảng đối chiếu các câu được chỉnh sửa

| Mã câu | Bản cũ | Bản mới | Lý do |
| :--- | :--- | :--- | :--- |
| `01-0` | Bắt đầu với phần kỹ thuật. Một "Hydra Head" là một nhóm "node" cùng giữ một sổ cái riêng, ở đây là ba "node" X, Y và Z. | Một "Hydra Head" là một nhóm gồm ba "node" X, Y và Z cùng giữ một sổ cái riêng. | Bỏ câu dẫn chuyển cảnh mang tính máy móc ("Bắt đầu với phần kỹ thuật"), mở đầu tự nhiên, gãy gọn (21 âm tiết). |
| `01-1` | Người chơi An có một trăm "ADA" trong "Head", nhưng An không vận hành "node" nào. | Người chơi An có một trăm "ADA" trong "Head", nhưng An không tự giữ "node" nào. | Đổi "vận hành" thành "tự giữ" cho gần gũi với người chơi phổ thông, văn nói mượt mà hơn. |
| `02-2` | Khi đóng "Head", "Cardano" chỉ kiểm tra bản chốt có đủ chữ ký hay không. Đủ ba chữ ký, nên bản chốt được chấp nhận. | Khi đóng "Head", "Cardano" chỉ kiểm tra bản chốt có đủ chữ ký hay không. Vì đủ ba chữ ký, bản chốt vẫn được chấp nhận. | Nối vế tự nhiên bằng liên từ ("Vì... vẫn"), tránh lỗi ngắt nhịp cộc lốc của TTS. |
| `02-5` | Phiên bản hai nhắm tới ba việc. Khi chuyện xảy ra thì có bằng chứng, các "node" bị phạt tự động, và An được đền tiền. | Phiên bản hai nhắm tới ba việc. Khi gian lận xảy ra thì có bằng chứng, các "node" bị phạt tự động, và An được đền tiền. | Xác định rõ "chuyện xảy ra" là "gian lận xảy ra" để người xem nắm bắt ngay bối cảnh phòng chống gian lận. |
| `03-3` | Mỗi khi An nhận tiền, phần mềm chạy cạnh "node" gửi cho An một biên lai, gồm bản chốt, đủ ba chữ ký, và phép chứng minh cho một trăm "ADA" của An. | Mỗi khi An nhận tiền, phần mềm cạnh "node" gửi cho An biên lai, gồm bản chốt đủ ba chữ ký và bằng chứng cho một trăm "ADA". | Rút gọn từ 36 xuống 28 âm tiết (đạt chuẩn 12–30 âm tiết), bỏ bớt từ đệm, giọng đọc máy ngắt hơi chuẩn xác hơn. |
| `05-3` | Người nộp được thưởng một phần tiền phạt. | Người nộp bằng chứng lên hợp đồng sẽ được thưởng một phần tiền phạt. | Tăng từ 10 lên 16 âm tiết (đạt chuẩn tối thiểu 12 âm tiết), làm rõ hành vi nộp bằng chứng hợp lệ. |
| `05-4` | Ví dụ, một hoá đơn số bốn mươi hai mà có hai bản, ghi hai số tiền khác nhau, cùng có đủ chữ ký. | Ví dụ, cùng một số hoá đơn mà có hai bản ghi hai số tiền khác nhau, nhưng cùng có đủ chữ ký. | Bỏ con số "bốn mươi hai" ngẫu nhiên gây phân tâm; bắt đầu đúng quy chuẩn bằng "Ví dụ," và đối chiếu thẳng với khái niệm "cùng số thứ tự". |
| `07-3` | Trả lời được thì ký quỹ được mở khoá, và năm "ADA" đặt cọc được trả cho "node" đã trả lời. | Nếu trả lời hợp lệ, tiền ký quỹ được gỡ khoá, và năm "ADA" đặt cọc được trả cho "node" đó. | Dùng thuật ngữ "hợp lệ" chuẩn thiết kế (§6.3, membership proof/chữ ký) thay cho "được", tránh lặp từ "đã trả lời". |
| `07-4` | Ví dụ, ba thủ quỹ được hai ngày để trình chứng từ. | Ví dụ, ba thủ quỹ có bốn mươi tám giờ để trình chứng từ hợp lệ. | Đồng nhất mốc thời gian "bốn mươi tám giờ" xuyên suốt, khớp hoàn toàn với phần kỹ thuật ngay trước đó. |
| `08-1` | Tiền phạt chia theo thứ tự. Trước hết đền An đủ một trăm "ADA". Sau đó thưởng người phát hiện, rồi trả lại khoản đặt cọc. | Tiền phạt chia theo thứ tự. Trước hết đền An đủ một trăm "ADA", kế đến thưởng người phát hiện và hoàn tiền đặt cọc. | Bỏ cấu trúc ngắt vụn, nối câu mượt mà, đúng thứ tự phân bổ (§5.3) và không dùng dấu hai chấm liệt kê. |
| `09-0` | Vì sao phạt cả ba "node" là công bằng? | Vì sao việc phạt cả ba "node" lại hoàn toàn công bằng? | Kéo dài từ 10 lên 14 âm tiết (đạt ngưỡng tối thiểu 12 âm tiết) giúp ngữ điệu câu hỏi của VieNeu-TTS tự nhiên hơn. |
| `10-1` | Nếu ký quỹ lớn hơn hoặc bằng tiền trong "Head", thì dù thông đồng lấy hết, họ cũng mất ít nhất ngần ấy, nên gian lận không có lời. | Nếu ký quỹ lớn hơn hoặc bằng tiền trong "Head", họ có lấy hết cũng bị phạt mất ngần ấy, nên không thể có lời. | Rút gọn từ 33 xuống 28 âm tiết, lập luận chặt chẽ về mặt kinh tế học (Collusion Resistance). |
| `10-2` | Ví dụ, một người giữ hộ một trăm triệu nhưng đã đặt cọc một trăm hai mươi triệu. Ôm tiền bỏ trốn thì chỉ thiệt thêm. | Ví dụ, người giữ hộ tiền đã đặt cọc một khoản lớn hơn số tiền nhận giữ. Nếu ôm tiền bỏ trốn, họ chỉ thiệt hại thêm. | Loại bỏ đơn vị tiền tệ pháp định ("triệu") không có trong tài liệu; tập trung vào bản chất tỷ lệ cọc vượt giá trị giữ hộ. |
| `11-1` | Người chơi không thể tự canh từng ấy thời gian, nên bắt buộc phải có dịch vụ canh gác chạy tự động, và ai cũng tự chạy được một dịch vụ như vậy. | Người chơi không thể tự canh liên tục, nên cần dịch vụ canh gác tự động, và ai cũng có thể tự chạy dịch vụ này. | Rút gọn từ 33 xuống 26 âm tiết, diễn đạt thanh thoát, tránh câu dài gây hụt hơi khi đọc máy. |
| `13-1` | Hẹn gặp lại ở tập sau. | Hẹn gặp lại các bạn trong những tập phân tích tiếp theo. | Mở rộng từ 6 lên 14 âm tiết (đạt chuẩn 12–30 âm tiết), tạo câu kết video trọn vẹn và trang trọng. |

---

### 3. Nhận xét chung về độ dễ hiểu và tính chuẩn xác sự thật

1. **Tuân thủ ranh giới sự thật**: Bản lời đọc giữ đúng tinh thần đây là bản thiết kế (design v2), nêu rõ "theo thiết kế" và "chưa chạy thử", không phóng đại tính an toàn hay cam kết tuyệt đối.
2. **Tính nhất quán của ví dụ**: Mọi đoạn so sánh đều bắt đầu đúng bằng từ "Ví dụ,", loại bỏ hoàn toàn cụm từ cấm "ví dụ đời thường", và bảo toàn nguyên vẹn tuyến nhân vật xuyên suốt (ba node X, Y, Z / ba thủ quỹ; An có 100 ADA; 5 ADA đặt cọc; thời hạn 48 giờ).
3. **Chuẩn hóa cho giọng đọc máy (VieNeu-TTS)**: Toàn bộ các câu ngắn dưới 12 âm tiết hoặc dài quá 30 âm tiết đã được điều chỉnh về dải tối ưu 12–30 âm tiết; số được viết hoàn toàn bằng chữ; các thuật ngữ kỹ thuật tiếng Anh đều được đặt trong ngoặc kép `"..."`.
4. **Cấu trúc phân cảnh mạch lạc**: Mỗi phân cảnh phân tách rành mạch hai phần: khái niệm kỹ thuật cốt lõi đi trước, hình tượng tương đương (sổ quỹ, cọc nhà, quầy khiếu nại) đi liền sau, giúp khán giả không chuyên dễ dàng tiếp thu.
