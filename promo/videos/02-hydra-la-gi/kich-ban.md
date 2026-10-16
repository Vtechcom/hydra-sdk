# Tập 2 — Hydra là gì?

## Brief

| Mục | Quyết định |
|---|---|
| Chuỗi | Kiến thức nền Cardano và Hydra, đồng thời giới thiệu hydra-sdk |
| Thể loại | Giải thích khoa học |
| Phong cách | Giữ nguyên tập 1: nét trắng như phấn trên nền đen, hình hiện dần như đang được vẽ |
| Lời đọc | Tiếng Việt, giọng Hải Đăng (VieNeu), không có phụ đề chạy; chữ trên màn hình chỉ là chữ được "viết" lên bảng |
| Khung hình | 16:9, 1920×1080 |
| Âm thanh | Giọng đọc + nền và hiệu ứng tự tổng hợp |
| Khán giả | Người chưa biết gì về blockchain, đã xem tập 1; thêm một đoạn ngắn dành riêng cho lập trình viên (cảnh 12) |
| Độ dài | Khoảng 5 phút |
| Cuối video | hydrasdk.com, kèm dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc, không đọc thành lời |

**Câu hỏi mở đầu:** vì sao bốn người bạn trả tiền qua lại cho nhau mà lần nào cũng phải chờ cả mạng Cardano xác nhận?

**Ẩn dụ chính:** "phòng họp riêng". Cả nhóm vào phòng, ghi sổ nhỏ với nhau, xong mới đem kết quả cuối cùng ra sổ chung. Giữ lại từ tập 1: "món tiền chưa tiêu" (UTxO), ổ khoá và chìa khoá, "tiêu trọn món cũ, sinh món mới".

**Ví dụ xuyên tập:** bốn người bạn (An, Bình, Chi, Dũng) chơi một trò chơi trên mạng, mỗi ván người thua trả cho người thắng vài ADA. Đây là tình huống dựng lại để minh hoạ, không phải ứng dụng thật.

**Màu nhấn:** giữ vàng phấn cho "món tiền" như tập 1; thêm một màu nhấn cố định cho "phòng họp / Hydra Head" (đề xuất xanh phấn) để phân biệt lớp hai với sổ chung lớp một (trắng).

**Snapshot:** lời đọc dùng chữ **snapshot** (đọc "xờ náp sót", đã chốt) để thống nhất với tập 3 và 6. Lần đầu xuất hiện ở cảnh 08 được giải thích một lần là "trạng thái của sổ ở thời điểm đó", không dùng tên Việt thay thế ("bản chốt sổ", "bản chụp") làm tên chính; bảng ghi `Snapshot`, kèm chữ nhỏ "= trạng thái sổ lúc này" ở cảnh 08. Xưng "ta", không xưng "mình".

**HydraBridge:** lời đọc dùng tên lớp, từ điển đọc thành "cầu nối hai dra" (đã chốt); bảng vẫn ghi `HydraBridge`.

## Nguồn tham khảo

- Tài liệu docs-v2: `apps/docs-v2/content/en/3.concepts/1.index.md` (Why Hydra: isomorphic state channel, cùng hỗ trợ hợp đồng Plutus, các đánh đổi "cần các bên hợp tác", "chỉ giới hạn trong người tham gia", "mở và đóng tốn phí lớp 1", hợp với "nhóm biết nhau, giao dịch nhiều lần"), `3.concepts/2.commit-to-hydra.md` (UTxO bị khoá trên lớp 1 và dùng được bên trong Head), `3.concepts/4.transactions-in-hydra.md` (giao dịch trong Head làm như lớp 1, ký, gửi, cập nhật snapshot), `3.concepts/6.hydra-v2-changes.md` (Hydra V2 bỏ pha commit, tiền vào bằng `deposit` khi Head đã mở; bridge 2.x nhắm hydra-node v2.3.0), `2.guides/5.hydra-integration.md` (tham số phí `minFeeA: 0, minFeeB: 0` trong Head).
- Code hydra-sdk: `packages/hydra-bridge/src/bridge.ts` (`HydraBridge`, `connect`, `querySnapshotUtxo`, `submitTxSync`; mặc định kết nối bằng `WebsocketConnector`), `packages/hydra-bridge/src/types/payload.type.ts` (`SnapshotConfirmed` mang `signatures.multiSignature`; trạng thái `Idle`, `Open`, `Closed`, `FanoutPossible`), `packages/hydra-transaction/src/tx-builder/index.ts` (tuỳ chọn `isHydra`).
- `sdk-ai-agent/sdk-api-metadata.json`: có `querySnapshotUtxo`, `submitTx`, `commit`, `decommit`, `initHydraHead`.
- Tập 1: `promo/videos/01-utxo/brief.md` (mô hình UTxO, UTxO Object).
- Tham số giao thức Cardano (Shelley genesis): mỗi slot một giây, hệ số slot có khối (active slot coefficient) 0,05, nên trung bình khoảng 20 giây có một khối.

## Ranh giới sự thật

Được nói (đã đối chiếu):

- Cardano mạng chính là lớp một; Hydra là giải pháp lớp hai của Cardano (docs-v2 "Why Hydra?").
- Mỗi Hydra Head là một kênh trạng thái riêng của một nhóm người tham gia; nhiều Head có thể chạy cùng lúc, độc lập với nhau.
- Hydra Head dùng cùng luật sổ cái eUTxO như Cardano ("isomorphic"): vẫn là UTxO, vẫn có token và hợp đồng thông minh Plutus.
- Để đem tiền vào Head, UTxO bị khoá trên lớp một và dùng được bên trong Head; khi Head đóng, các UTxO cuối cùng được trả về lớp một (fanout). Kịch bản chỉ nói "khoá lại" và "trả về", không đi vào commit hay deposit để đúng cho cả V1 và V2.
- Người xác nhận giao dịch bên trong Head là chính các thành viên: mỗi người chạy một nút Hydra; một snapshot chỉ được xác nhận khi có chữ ký của tất cả thành viên (`SnapshotConfirmed` có `multiSignature`).
- Bên trong Head không phải chờ khối của lớp một; xác nhận diễn ra khi cả nhóm ký snapshot.
- Bất kỳ thành viên nào cũng có thể đóng Head bằng snapshot mới nhất đã được cả nhóm ký; sau thời gian đối chiếu (contestation period) trên lớp một, trong đó thành viên khác có thể đưa ra snapshot mới hơn, tiền được trả về theo snapshot cuối cùng (fanout). Vì vậy một người bỏ đi không làm mắc kẹt tiền của người khác. Thời gian đối chiếu do cấu hình Head quyết định (docs-v2 ghi mặc định của hydra-node 1.3.0 là 12 giờ); kịch bản không nói độ dài.
- Nếu một thành viên ngừng ký, Head không thể tiến thêm; phải đóng Head để rút tiền về.
- Mở và đóng Head là giao dịch trên lớp một, có phí và phải chờ như mọi giao dịch khác.
- Chỉ thành viên trong Head giao dịch được với nhau; muốn trả cho người ngoài thì phải đem tiền ra lớp một.
- Phí bên trong Head do tham số giao thức của chính Head quyết định; các ví dụ trong tài liệu hydra-sdk đặt phí bằng không.
- hydra-sdk: `HydraBridge` kết nối tới nút Hydra qua WebSocket, `querySnapshotUtxo()` trả về `UTxOObject`, `TxBuilder({ isHydra: true })` dựng giao dịch cho Head, `submitTxSync()` gửi và chờ kết quả xác nhận.

Đơn giản hoá có chủ ý (không nói sai, nhưng lược bớt):

- "Mỗi người chạy một máy riêng": thực tế mỗi thành viên vận hành một hydra-node (có thể thuê dịch vụ như Hexcore chạy hộ). Không nhắc.
- "Cả mạng cùng chấp nhận khối": gộp chuyện đồng thuận Ouroboros và độ chắc chắn (finality) làm một.
- Thời gian đối chiếu (contestation period) chỉ được nhắc một câu ở cảnh 09, không nói độ dài, không giải thích cơ chế đưa snapshot mới hơn; các trạng thái `Closed`, `FanoutPossible` để dành cho tập 3.
- Bỏ qua chuyện rút một phần tiền ra khi Head đang mở (decommit) và nạp thêm (deposit).
- "Sổ chung chỉ ghi vài giao dịch để mở và đóng phòng": không đếm chính xác số giao dịch lớp một, vì khác nhau giữa V1 và V2.
- Hydra trong thần thoại Hy Lạp là con rắn nước nhiều đầu; tên gọi "Head" lấy ý từ đó. Đây là chuyện tên gọi, không phải thông số kỹ thuật.

Số liệu minh hoạ, không phải dữ liệu thật (cần ghi rõ với người duyệt):

- "Cả trăm ván", "ván thứ bốn mươi bảy", "vài ADA mỗi ván": dựng lại để minh hoạ.

Không nói ở tập này:

- Số giao dịch mỗi giây, thời gian xác nhận dưới một giây, "giảm phí 99%", "1000+ TPS": tài liệu docs-v2 có ghi các con số này nhưng không kèm phép đo hay nguồn benchmark, nên không đưa vào lời đọc. Chỉ nói định tính: không phải chờ khối của cả mạng.
- So sánh với lớp hai của mạng khác (rollup, Lightning).
- Mức phí cụ thể khi mở và đóng Head.

## Thuật ngữ mới cần chốt cách đọc

Các từ chưa có trong `promo/shared/tu-dien-doc.md`. Phiên này không sửa file dùng chung; phiên chính gom lại.

| Từ | (1) Đọc nguyên văn | (2) Phiên âm đề xuất | (3) Thay bằng từ Việt | Ghi chú |
|---|---|---|---|---|
| HydraBridge | — | — | cầu nối hai dra | Đã chốt (3), đã có trong từ điển chung |
| WebSocket | WebSocket | goép sóc kịt | kết nối thời gian thực | Đã vào từ điển chung, trạng thái đề xuất; cần nghe thử câu 12-1 |
| Head (đứng riêng) | Head | hét | cái đầu | Đã vào từ điển chung, trạng thái đề xuất |
| snapshot | — | xờ náp sót | — | Đã chốt, đã có trong từ điển chung |
| Hy Lạp | — | — | — | Từ Việt, chỉ cần nghe thử giọng đọc đúng thanh |

Từ đã có trong từ điển và dùng lại: Hydra, Hydra Head, hydra-sdk, hydrasdk.com, UTxO, UTxO Object, TxBuilder, Cardano, ADA (đang `đề xuất`), token.

## Kịch bản

Không có phụ đề chạy; cột "Chữ trên bảng" là chữ được viết lên bảng trong cảnh. Số âm tiết đếm sau khi phiên âm theo từ điển đọc.

| Cảnh | Chữ trên bảng | Lời đọc | Số âm tiết | Trên màn hình | Âm thanh |
|---|---|---|---|---|---|
| **01. Mở đầu**<br>~23 giây | `An`<br>`Bình`<br>`Chi`<br>`Dũng`<br>`+2 ADA`<br>`Đang chờ xác nhận…`<br>`?` | 01-0: Bốn người bạn chơi một trò chơi trên mạng, cứ mỗi ván, người thua trả cho người thắng vài ADA.<br>01-1: Một buổi tối họ chơi cả trăm ván, tức là cả trăm lần chuyển tiền cho nhau.<br>01-2: Và lần nào cũng phải chờ cả mạng Cardano xác nhận xong mới tính.<br>01-3: Chuyện riêng của bốn người, sao lại phải chờ cả thế giới?<br>01-4: Câu trả lời cho câu hỏi đó có một cái tên, là Hydra. | 21<br>17<br>16<br>12<br>14 | Bốn hình người vẽ phấn ngồi quanh một bàn chơi. Mỗi ván, một đồng ADA vàng phấn bay từ người này sang người kia, rồi đứng khựng lại với dòng "Đang chờ xác nhận…" và một đồng hồ cát nhỏ. Lặp nhanh vài lần, đồng hồ cát chồng lên nhau. Cuối cảnh: dấu hỏi lớn, rồi chữ "Hydra" viết chậm ở giữa bảng. | Nền vào dần. Tiếng "tick" mỗi lần đồng tiền bay; tiếng đồng hồ tích tắc chậm khi chờ. |
| **02. Cuốn sổ chung**<br>~27 giây | `Sổ chung`<br>`Khối mới`<br>`~20 giây / khối` | 02-0: Ở tập trước, ta đã biết Cardano ghi lại mọi món tiền chưa tiêu trong một cuốn sổ chung.<br>02-1: Cuốn sổ ấy không nằm ở một chỗ, mà được rất nhiều máy tính khắp thế giới cùng giữ một bản.<br>02-2: Muốn ghi thêm một giao dịch, nó phải được gom vào một khối mới, rồi cả mạng cùng chấp nhận khối đó.<br>02-3: Trung bình khoảng hai mươi giây mới có một khối. Ai muốn ghi sổ cũng phải xếp hàng chờ.<br>02-4: Cách làm này không nhanh, nhưng nhờ vậy mà không ai sửa được sổ một mình. | 21<br>21<br>22<br>19<br>16 | Một cuốn sổ lớn màu trắng phấn ở giữa, quanh nó là nhiều máy tính nhỏ, mỗi máy giữ một bản của cùng cuốn sổ. Các giao dịch xếp hàng thành một hàng dài trước cửa; cứ một nhịp lại có một "khối" được đóng vào sổ. Nhãn nhỏ "~20 giây / khối" ở góc. | Tiếng "cộp" trầm mỗi khi một khối được đóng vào sổ. |
| **03. Chuyện nhỏ trên sổ lớn**<br>~19 giây | `Ván 47`<br>`Chờ khối`<br>`Phí`<br>`Cuối buổi: mỗi người còn bao nhiêu?` | 03-0: Giờ quay lại bốn người bạn. Mỗi ván chơi là một giao dịch phải ghi vào sổ chung.<br>03-1: Mỗi lần như vậy, họ phải chờ khối mới và trả một khoản phí cho mạng lưới.<br>03-2: Trong khi đó, cả mạng chẳng cần biết ván thứ bốn mươi bảy ai thắng ai thua.<br>03-3: Điều thế giới cần biết chỉ là cuối buổi, mỗi người còn lại bao nhiêu tiền. | 18<br>17<br>17<br>16 | Hàng giao dịch trước cuốn sổ lớn dài thêm, toàn là những tờ ghi "Ván 1", "Ván 2"… của bốn người, mỗi tờ kèm một đồng phí nhỏ. Tờ "Ván 47" được phóng to rồi mờ đi. Cuối cảnh: mọi tờ gom lại thành một dòng duy nhất "Cuối buổi: mỗi người còn bao nhiêu?". | Chuỗi "tick" dày dần; một nốt chuông khi các tờ gom lại thành một dòng. |
| **04. Phòng họp riêng**<br>~21 giây | `Phòng họp riêng`<br>`Sổ nhỏ`<br>`Kết quả cuối cùng → Sổ chung` | 04-0: Hãy hình dung thế này. Thay vì ra sổ chung mỗi lần, bốn người rủ nhau vào một phòng họp riêng.<br>04-1: Trong phòng có một cuốn sổ nhỏ, chỉ bốn người cùng ghi, và ai cũng giữ một bản.<br>04-2: Ván nào xong thì ghi ngay vào sổ nhỏ, không phải xếp hàng chờ ai ở bên ngoài.<br>04-3: Đến khi chơi xong, cả nhóm mới mở cửa, đem kết quả cuối cùng ra ghi vào sổ chung. | 21<br>18<br>18<br>19 | Một căn phòng vẽ phấn màu xanh (màu nhấn của Hydra Head suốt video) mọc lên cạnh cuốn sổ lớn. Bốn người bước vào, cửa đóng. Bên trong, một cuốn sổ nhỏ được ghi liên tục, mỗi người cầm một bản. Cuối cảnh: cửa mở, một tờ giấy duy nhất đi ra và được dán vào sổ chung. | Tiếng cửa đóng nhẹ; bên trong là tiếng phấn ghi nhanh; tiếng cửa mở khi đem kết quả ra. |
| **05. Lớp một và lớp hai**<br>~30 giây | `Lớp 1: Cardano`<br>`Lớp 2: Hydra`<br>`Hydra Head` | 05-0: Hydra làm đúng như vậy. Người ta gọi mạng chính Cardano là lớp một, nơi giữ cuốn sổ chung mà ai cũng tin.<br>05-1: Những hệ thống chạy phía trên, xử lý giao dịch ở bên ngoài sổ chung, được gọi là lớp hai.<br>05-2: Hydra là một giải pháp lớp hai của Cardano, và mỗi căn phòng họp riêng được gọi là một Hydra Head.<br>05-3: Tên Hydra lấy từ con rắn nhiều đầu trong thần thoại Hy Lạp. Mỗi Head là một cái đầu.<br>05-4: Nhiều nhóm có thể mở nhiều Head cùng lúc, mỗi nhóm một phòng, không ai chen vào việc của ai. | 26<br>20<br>25<br>20<br>20 | Đường kẻ ngang chia bảng: dưới là cuốn sổ lớn "Lớp 1: Cardano", trên là căn phòng xanh "Lớp 2: Hydra". Căn phòng được dán nhãn "Hydra Head". Nét phấn phác nhanh hình con rắn nhiều đầu, mỗi đầu biến thành một căn phòng nhỏ khác nhau, mỗi phòng một nhóm người. | Nền chuyển hợp âm sang phần "lớp hai". Một nốt chuông khi nhãn "Hydra Head" viết xong. |
| **06. Đem tiền vào phòng**<br>~20 giây | `Khoá trên Cardano`<br>`Hiện ra trong Head`<br>`Cùng số lượng, cùng ổ khoá` | 06-0: Nhưng làm sao để đem tiền vào phòng mà không ai gian lận được?<br>06-1: Mỗi người khoá một số món tiền chưa tiêu của chính họ trên Cardano, dành riêng cho Head.<br>06-2: Ở bên ngoài, những món tiền này bị giữ lại, không ai đem đi tiêu ở chỗ khác được.<br>06-3: Còn bên trong Head, chúng hiện ra như cũ, cùng số lượng và cùng ổ khoá của chủ nhân. | 14<br>20<br>19<br>19 | Mỗi người đặt vài ô UTxO vàng phấn (ô có ổ khoá nhỏ như tập 1) lên cuốn sổ lớn; một sợi xích phấn quấn quanh các ô đó. Một bản sao của từng ô đi lên căn phòng xanh, giữ nguyên số và ổ khoá. | Tiếng xích "lách cách" nhỏ khi các ô bị khoá; "tick" khi ô hiện ra trong phòng. |
| **07. Bên trong vẫn là UTxO**<br>~26 giây | `Món tiền chưa tiêu`<br>`Ổ khoá + chìa khoá`<br>`Tiêu món cũ → sinh món mới`<br>`Token · Hợp đồng thông minh` | 07-0: Điều đáng chú ý là bên trong Head, mọi thứ vẫn chạy theo đúng mô hình UTxO của tập trước.<br>07-1: Vẫn là những món tiền chưa tiêu, mỗi món một ổ khoá, muốn mở thì phải có chìa.<br>07-2: Mỗi giao dịch vẫn tiêu trọn món cũ, rồi sinh ra món mới, kể cả tiền thối.<br>07-3: Token và hợp đồng thông minh cũng chạy được, vì Head dùng cùng luật ghi sổ với Cardano.<br>07-4: Vì vậy, dựng một giao dịch trong Head gần như không khác gì trên mạng chính. | 23<br>18<br>17<br>21<br>16 | Phóng vào trong căn phòng xanh: các ô UTxO tách và ghép như cảnh 08 của tập 1, ổ khoá mở bằng chìa, ô cũ bị gạch, ô mới sinh ra. Một ô mở ra như phong bì có token và ổ khoá bánh răng (gợi lại cảnh 11 tập 1). | Tiếng gạch khi ô cũ bị tiêu; "tick" khi ô mới sinh ra; tiếng bánh răng nhỏ. |
| **08. Chỉ người trong phòng cần đồng ý**<br>~28 giây | `Ai xác nhận?`<br>`Snapshot`<br>`= trạng thái sổ lúc này`<br>`✓ ✓ ✓ ✓` | 08-0: Vậy thì ở bên trong phòng, ai sẽ là người xác nhận giao dịch?<br>08-1: Câu trả lời là chính những người trong Head. Mỗi người chạy một máy riêng, giữ một bản sổ riêng.<br>08-2: Có giao dịch mới, máy của từng người cùng kiểm tra, rồi cùng ký vào một snapshot, tức là trạng thái của sổ ở thời điểm đó.<br>08-3: Chỉ khi tất cả đều ký, snapshot đó mới được tính. Thiếu một chữ ký là chưa xong.<br>08-4: Không cần cả mạng đồng ý, cũng không phải chờ khối mới. Chỉ cần những người ở trong phòng. | 14<br>20<br>29<br>20<br>19 | Bốn người trong phòng, mỗi người trước một máy tính nhỏ. Một giao dịch mới xuất hiện giữa bàn; bốn máy cùng sáng lên kiểm tra. Một tờ "Snapshot" (chữ nhỏ "= trạng thái sổ lúc này" bên dưới) đi vòng quanh bàn, nhận lần lượt bốn dấu ký. Khi đủ bốn dấu, tờ giấy sáng lên. Cuốn sổ lớn bên ngoài vẫn đứng yên. | Bốn tiếng "tick" ứng với bốn chữ ký; một nốt chuông khi đủ bốn. |
| **09. Nếu có người bỏ đi**<br>~22 giây | `Bỏ đi?`<br>`Gian lận?`<br>`Đóng Head`<br>`Snapshot mới nhất → Cardano`<br>`Thời gian đối chiếu`<br>`→ Trả tiền về` | 09-0: Nhưng nếu có người giữa chừng bỏ đi, hay cố tình gian lận thì sao?<br>09-1: Snapshot nào cũng có đủ chữ ký của cả nhóm, nên không ai tự ý sửa được.<br>09-2: Bất kỳ ai trong nhóm cũng có quyền đóng Head, rồi đem snapshot mới nhất ra Cardano.<br>09-3: Hết thời gian đối chiếu trên mạng chính, tiền của mỗi người được trả về đúng theo snapshot đó, không ai bị mắc kẹt. | 15<br>19<br>21<br>26 | Một người đứng dậy bỏ đi, ghế trống. Một người khác thử gạch sửa tờ snapshot, nhưng bốn dấu ký giữ chặt, nét gạch bị bật ra. Một người còn lại cầm tờ snapshot mới nhất bước ra cửa, đặt nó lên cuốn sổ lớn. Một đồng hồ cát lớn chạy hết (thời gian đối chiếu), rồi các ô UTxO trở về đúng chủ. | Tiếng ghế kéo; một tiếng trầm ngắn khi nét gạch bị bật ra; tiếng cửa mở. |
| **10. Đem kết quả ra sổ chung**<br>~16 giây | `Đóng Head`<br>`100 ván bên trong`<br>`Vài giao dịch trên Cardano` | 10-0: Khi cả nhóm chơi xong, Head được đóng lại, và cửa phòng mở ra.<br>10-1: Các món tiền chưa tiêu cuối cùng trong phòng được trả về Cardano, đúng người, đúng số lượng.<br>10-2: Bên trong có cả trăm ván chơi, nhưng sổ chung chỉ phải ghi vài giao dịch để mở và đóng phòng. | 14<br>20<br>21 | Cửa phòng xanh mở, các ô UTxO cuối cùng đi xuống cuốn sổ lớn, sợi xích ở cảnh 06 rơi ra. Hai cột so sánh: bên trái một chồng dày "100 ván bên trong", bên phải chỉ vài dòng "Vài giao dịch trên Cardano". | Tiếng cửa mở; "tick" khi từng ô về sổ lớn; tiếng xích rơi. |
| **11. Giới hạn của phòng họp**<br>~29 giây | `Chỉ người trong Head`<br>`Mở, đóng = giao dịch lớp 1`<br>`Cả nhóm phải có mặt`<br>`Hợp với: nhóm quen, giao dịch nhiều lần` | 11-0: Tất nhiên, phòng họp riêng cũng có những giới hạn của nó.<br>11-1: Thứ nhất, chỉ những người trong Head mới giao dịch được với nhau. Muốn trả cho người ngoài thì phải đem tiền ra.<br>11-2: Thứ hai, mở và đóng Head là giao dịch trên Cardano, nên vẫn phải chờ và trả phí như thường.<br>11-3: Thứ ba, cả nhóm phải có mặt để cùng ký. Chỉ một người tắt máy là phòng không thể giao dịch tiếp, phải đóng lại để rút tiền về.<br>11-4: Vì vậy, Hydra hợp nhất với một nhóm biết rõ nhau, cần giao dịch với nhau thật nhiều lần. | 12<br>23<br>22<br>29<br>20 | Ba dòng viết lần lượt, mỗi dòng kèm hình nhỏ: người ngoài đứng trước cửa phòng đóng; cánh cửa có đồng hồ cát và đồng phí nhỏ; một máy tính tắt, cuốn sổ nhỏ đứng yên. Cuối cảnh: dòng "Hợp với" gạch chân. | Một nốt chuông cho mỗi dòng. |
| **12. HydraBridge — cho lập trình viên**<br>~33 giây | `import { HydraBridge } from '@hydra-sdk/bridge'`<br>`const bridge = new HydraBridge({ url })`<br>`await bridge.connect()`<br>`const utxos = await bridge.querySnapshotUtxo()  // UTxOObject`<br>`new TxBuilder({ isHydra: true })`<br>`await bridge.submitTxSync(tx)` | 12-0: Phần này dành cho lập trình viên. Trong hydra-sdk, ứng dụng nói chuyện với Hydra Head qua HydraBridge.<br>12-1: Nó kết nối tới máy Hydra của bạn qua WebSocket, nhận mọi sự kiện của Head ngay khi chúng xảy ra.<br>12-2: Danh sách món tiền chưa tiêu trong Head được trả về đúng dạng UTxO Object, như ở tập trước.<br>12-3: Giao dịch vẫn dựng bằng TxBuilder, chỉ cần bật chế độ Hydra. Trong các ví dụ, phí bên trong Head đặt bằng không.<br>12-4: Gửi giao dịch xong, bạn có thể chờ đến khi snapshot chứa giao dịch đó được cả nhóm ký. | 26<br>24<br>23<br>27<br>21 | Đoạn code viết tay bằng phấn, từng dòng hiện theo lời đọc. Dòng "querySnapshotUtxo" nối mũi tên tới một mẩu JSON UTxO Object nhỏ (gợi lại cảnh 13 tập 1). "isHydra: true" gạch chân. Dòng "submitTxSync" nối tới tờ snapshot có bốn dấu ký của cảnh 08. Góc trên: nhãn nhỏ "@hydra-sdk/bridge · @hydra-sdk/transaction". | Tiếng gõ phấn nhanh theo từng dòng code; nốt chuông khi bốn dấu ký hiện ra. |
| **13. Tóm tắt và lời kết**<br>~32 giây | `1. Lớp 1 giữ sổ chung, lớp 2 ghi sổ riêng`<br>`2. Trong Head vẫn là UTxO`<br>`3. Chỉ người trong Head cần đồng ý`<br>`Tập 3: Vòng đời một Hydra Head`<br>`hydrasdk.com`<br>`Thực hiện cùng VTechcom Labs` | 13-0: Tóm lại, qua tập này bạn chỉ cần nhớ ba ý chính.<br>13-1: Thứ nhất, Cardano là lớp một, giữ cuốn sổ chung. Hydra là lớp hai, nơi cả nhóm ghi sổ riêng với nhau.<br>13-2: Thứ hai, bên trong Hydra Head vẫn là những món tiền chưa tiêu, theo đúng luật của Cardano.<br>13-3: Thứ ba, chỉ những người trong Head cần đồng ý với nhau, xong việc mới đem kết quả ra sổ chung.<br>13-4: Vậy một Head được mở ra, chạy và đóng lại như thế nào? Đó là chủ đề của tập sau.<br>13-5: Bạn có thể xem thêm tài liệu và ví dụ tại hydrasdk.com. | 12<br>25<br>21<br>21<br>20<br>18 | Ba ý viết lần lượt. Rồi căn phòng xanh vẽ lại thu nhỏ, kèm bốn mũi tên vòng quanh nó (mở, chạy, đóng, trả về) như lời hẹn tập 3. Cuối: "hydrasdk.com" ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" kèm logo ở góc dưới phải, không đọc thành lời. | Một nốt chuông cho mỗi ý; nền ra dần trong 2 giây cuối. |

**Tổng:** 60 câu, 1183 âm tiết, ước lượng khoảng 5 phút 27 giây (tính 4.2 âm tiết/giây, cộng nghỉ giữa câu và giữa cảnh).
