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
