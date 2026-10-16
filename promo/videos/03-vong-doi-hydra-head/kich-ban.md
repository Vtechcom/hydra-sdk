# Tập 3 — Vòng đời của một Hydra Head

## Brief

| Mục | Quyết định |
|---|---|
| Chuỗi | Kiến thức nền Cardano và Hydra, đồng thời giới thiệu hydra-sdk |
| Thể loại | Giải thích khoa học |
| Phong cách | Giữ nguyên tập 1: nét phấn trắng trên nền đen, hình hiện dần như đang được vẽ |
| Lời đọc | Tiếng Việt, giọng Hải Đăng (VieNeu), không có phụ đề chạy; chữ trên màn hình chỉ là chữ được "viết" lên bảng |
| Khung hình | 16:9, 1920×1080 |
| Âm thanh | Giọng đọc + nền và hiệu ứng tự tổng hợp; thêm tiếng tích tắc cho đồng hồ đếm ngược ở cảnh khiếu nại |
| Khán giả | Người chưa biết gì về blockchain, đã xem tập 1 và 2; đoạn ngắn cho lập trình viên ở cảnh 13–14 |
| Độ dài | Khoảng 5–6 phút |
| Cuối video | hydrasdk.com, kèm dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc, không đọc thành lời |

**Xưng hô và thuật ngữ thống nhất cả chuỗi:** xưng "ta", không xưng "mình"; snapshot là tên chính (đọc "xờ náp sót"), không dùng "bản chụp".

**Mạch kể:** đi theo các ô vàng "món tiền chưa tiêu" của tập 1. Chúng đi từ mạng chính lên Head, được tiêu và sinh món mới bên trong, rồi quay về mạng chính khi Head đóng. Ẩn dụ ổ khoá và chìa khoá giữ nguyên: món tiền trên Head vẫn mang ổ khoá của chủ nó. Hai nhân vật An và Bình của tập 1 quay lại ở cảnh khiếu nại.

**Sáu chặng dùng trong video** (tên tiếng Việt để đọc, tên tiếng Anh chỉ viết nhỏ trên bảng):

| Chặng | Đọc là | Trên bảng | Lệnh và sự kiện thật |
|---|---|---|---|
| 1 | mở Head | `Init` | lệnh `Init` → sự kiện `HeadIsOpen` |
| 2 | nạp tiền vào | `Commit (deposit)` | `POST /commit` soạn giao dịch nạp → `CommitRecorded` → `DepositActivated` → `CommitApproved` → `CommitFinalized` |
| 3 | giao dịch bên trong | `Open` | lệnh `NewTx` → `TxValid`, `SnapshotConfirmed` |
| 4 | đóng Head | `Close` | lệnh `Close` → `HeadIsClosed` (kèm `contestationDeadline`) |
| 5 | khiếu nại | `Contest` | lệnh `Contest` → `HeadIsContested`; hết hạn → `ReadyToFanout` |
| 6 | trả về mạng chính | `Fanout` | lệnh `Fanout` → `HeadIsFinalized` (kèm `finalizedUTxO`) |

## ⚠ Điểm lệch so với ý tưởng đã chốt

Ý tưởng ban đầu kể theo thứ tự Init → Commit → Open, tức góp tiền xong rồi mới mở Head. Đó là vòng đời của **Hydra v1**. hydra-sdk hiện nhắm **hydra-node v2.3.0**, và v2 đã bỏ hẳn pha góp tiền trước khi mở (ADR-33): Head mở ngay sau `Init`, tiền được nạp dần bằng giao dịch nạp (deposit) trong lúc Head đang mở. Bridge 1.x (dòng v1) đã ngừng phát hành.

Kịch bản này kể theo **v2** (mở trước, nạp sau), giữ tên "Commit" trên bảng vì API vẫn dùng chữ này (`POST /commit`, `CommitFinalized`). Cảnh 04 nói ngắn về sự thay đổi so với phiên bản trước. Chủ sản phẩm đã quyết giữ cảnh 04, kể cả sau review của agy (đề xuất bỏ cảnh này không được áp dụng).

## Nguồn

Code (`packages/hydra-bridge/src`):

- `types/payload.type.ts:13-23` — `HydraHeadStatus`: `Idle`, `Open`, `Closed`, `FanoutPossible` (`FanningOut` là thử nghiệm, chưa có trong bản 2.3.0).
- `types/payload.type.ts:30-48` — `HydraCommand`: `Init`, `NewTx`, `Recover`, `Decommit`, `Close`, `SafeClose`, `Contest`, `Fanout`, `SideLoadSnapshot`, `PartialFanout` (thử nghiệm).
- `types/payload.type.ts:72-82` — nhãn vòng đời: `HeadIsOpen`, `HeadIsClosed`, `HeadIsContested`, `ReadyToFanout`, `HeadIsFinalized`.
- `types/payload.type.ts:304-344` — nội dung từng sự kiện: `HeadIsOpen` có `parties`; `HeadIsClosed` và `HeadIsContested` có `snapshotNumber`, `contestationDeadline`; ghi chú "wait for `ReadyToFanout` before sending `Fanout`" (dòng 315-316); `HeadIsFinalized` có `finalizedUTxO` "distributed back to L1".
- `types/payload.type.ts:410-417` — `SnapshotConfirmed` có `snapshot` và `signatures.multiSignature`.
- `types/payload.type.ts:459-463` — `DecommitFinalized` có `distributedUTxO` (rút món tiền ra giữa chừng).
- `types/payload.type.ts:469-517` — nạp tiền: `CommitRecorded` ("deposit is not yet usable"), `DepositActivated` ("old enough to be included in a snapshot"), `DepositExpired` ("passed its deadline and can only be recovered"), `CommitFinalized`, `CommitRecovered`.
- `types/payload.type.ts:551`, `:567-570` và `:583-614` — `HeadState` qua `GET /head` chỉ có `Idle`, `Open`, `Closed`; `HeadParameters` gồm `contestationPeriod` và `parties`.
- `types/commit.type.ts:4-11` — `POST /commit` soạn sẵn giao dịch nạp chưa ký, client ký rồi gửi lên L1.
- `bridge.ts:550-556` — "hydra-node v2 removed the commit phase (ADR-33) — there is no `HeadIsInitializing` any more and the head opens directly".
- `bridge.ts:484-546` — `bridge.commands`: `init`, `close`, `safeClose`, `fanout`, `contest`, `recover`, `decommit`, `partialFanout`, `newTx`.
- `bridge.ts:386-388` — `bridge.commit()` gọi `POST /commit`, chỉ trả về giao dịch nạp chưa ký (`types/commit.type.ts:4-11`); ví phải ký và gửi lên mạng chính; `bridge.ts:636-656` — `decommit` chờ `DecommitApproved`.
- `bridge.ts:24-58` — tuỳ chọn khởi tạo `url` (WebSocket của hydra-node); `connector/websocket.ts:368` — mọi tin từ node phát ra sự kiện `onMessage`.

Tài liệu (`apps/docs-v2/content/en`):

- `3.concepts/6.hydra-v2-changes.md:11-13` — bridge 2.x nhắm hydra-node v2 (kiểm với 2.3.0); bridge 1.x hết hỗ trợ.
- `3.concepts/6.hydra-v2-changes.md:52-58` — v1 là `Init` → `Commit` → `CollectCom`; v2 mở Head trực tiếp, không còn `commit`, `collectCom`, `abort`; tiền vào qua `deposit` khi Head đang mở.
- `3.concepts/6.hydra-v2-changes.md:37` — thời gian khiếu nại mặc định của hydra-node đổi từ 10 phút sang 12 giờ (từ bản 1.3.0).
- `3.concepts/2.commit-to-hydra.md:11` — trang này mô tả luồng v1, có ghi chú trỏ sang v2.
- `4.api/3.bridge.md:747-776` — ví dụ `bridge.events.on('onMessage', …)` với `switch (payload.tag)`.

`sdk-ai-agent/sdk-api-metadata.json` có `commit` và `decommit` của bridge (dòng 976, 1052), khớp code. Thư mục `promo/knowledge/` chưa có tài liệu riêng về Hydra.

## Ranh giới sự thật

Được nói (đã đối chiếu code và tài liệu):

- Head ở hydra-node v2 mở ngay sau lệnh mở (`Init`), lúc đầu chưa có món tiền nào; không còn pha góp tiền trước khi mở.
- Giao dịch mở Head ghi lên mạng chính danh sách thành viên (`parties`) và thời gian khiếu nại (`contestationPeriod`).
- Ở phiên bản trước (v1), mọi người phải góp xong thì Head mới mở; nếu không thì phải huỷ (`abort`).
- Nạp tiền là một giao dịch trên mạng chính; nút Hydra chờ giao dịch nạp đủ "cũ" (`DepositActivated`) rồi mới đưa vào snapshot; quá hạn thì chỉ có thể lấy lại (`DepositExpired`, `Recover`).
- Món tiền nạp vào giữ nguyên địa chỉ (ổ khoá) bên trong Head (`utxoToCommit` là một `UTxOObject`).
- Trong Head, giao dịch theo cùng luật UTxO; kết quả được xác nhận bằng snapshot có số thứ tự và chữ ký của mọi thành viên (`multiSignature`).
- Có thể rút riêng món tiền về mạng chính mà không đóng Head (`Decommit`, `DecommitFinalized`).
- Đóng Head đưa một snapshot lên mạng chính (`HeadIsClosed.snapshotNumber`); Head không nhận giao dịch mới sau khi đóng.
- Trong thời gian khiếu nại, thành viên khác gửi `Contest` với snapshot mới hơn (`HeadIsContested.snapshotNumber`); chỉ khi có `ReadyToFanout` mới gửi `Fanout`.
- `Fanout` tạo lại trên mạng chính các món tiền theo snapshot cuối (`HeadIsFinalized.finalizedUTxO`).
- `HydraBridge` kết nối hydra-node qua WebSocket, phát sự kiện `onMessage` cho mỗi tin, có nhóm lệnh `commands`.

Đơn giản hoá có chủ ý:

- "Ổ khoá đặc biệt dành cho việc nạp" gộp hợp đồng deposit và hợp đồng của Head trên mạng chính làm một hình ảnh.
- "Snapshot số lớn hơn sẽ được dùng" lược bỏ chi tiết hạn chót có thể được cập nhật sau mỗi lần khiếu nại (`HeadIsContested` mang `contestationDeadline` mới).
- Món tiền trả về mạng chính có cùng địa chỉ và số lượng, nhưng mang tên riêng mới (mã giao dịch `Fanout`). Lời đọc nói "cùng địa chỉ và số lượng", không nói "cùng tên".
- Không nhắc `SafeClose`, `SideLoadSnapshot`, `PartialFanout` (trả về nhiều đợt cho Head lớn, đang thử nghiệm), `FanningOut`.
- Ví dụ An và Bình với snapshot số bốn và số năm là minh hoạ, không phải số liệu thật.

Không nói ở tập này: Hydra nhanh bao nhiêu, phí trong Head, số giao dịch mỗi giây, độ dài thời gian khiếu nại cụ thể (12 giờ chỉ là mặc định của hydra-node, mỗi Head đặt riêng), và khẳng định kiểu "chỉ cần một người trung thực là an toàn" vì repo chưa có nguồn cho câu này.

## Thuật ngữ và cách đọc

Chủ sản phẩm đã quyết (ghi trong `promo/shared/tu-dien-doc.md`):

| Từ | Cách đọc | Trạng thái | Dùng ở |
|---|---|---|---|
| snapshot | xờ náp sót | đã chốt | 07, 09, 10, 11, 12, 15; dùng làm tên chính, thống nhất cả chuỗi, không dùng "bản chụp" |
| HydraBridge | cầu nối hai dra | đã chốt | 13, 14; trên bảng vẫn ghi tên lớp |
| Head (đứng riêng) | hét | đề xuất | khắp video |
| WebSocket | goép sóc kịt | đề xuất | 13; phương án khác trong từ điển là "kết nối thời gian thực" |

Không đọc, chỉ viết trên bảng: `HeadIsOpen`, `HeadIsClosed`, `HeadIsContested`, `ReadyToFanout`, `HeadIsFinalized`, `onMessage`, `commands`. Lời đọc cảnh 13–14 mô tả bằng tiếng Việt ("nhãn báo Head đã mở", "nhãn báo sẵn sàng trả về", "nghe mọi tin nhắn gửi về"…). Chủ sản phẩm chưa chọn cách đọc các tên này; nếu sau này muốn đọc nguyên văn thì chỉ cần sửa lời đọc hai cảnh đó.

## Kịch bản

Không có phụ đề chạy; cột "Chữ trên bảng" là chữ được viết lên bảng trong cảnh. Số âm tiết đếm sau khi phiên âm theo từ điển đọc.

| Cảnh | Chữ trên bảng | Lời đọc | Số âm tiết | Trên màn hình | Âm thanh |
|---|---|---|---|---|---|
| **01. Mở đầu**<br>~22 giây | `Cardano (lớp 1)`<br>`Hydra Head (lớp 2)`<br>`Mở → Dùng → Đóng` | 01-0: Ở tập trước, bạn đã biết Hydra Head là nơi một nhóm nhỏ giao dịch với nhau, bên trên mạng chính Cardano.<br>01-1: Nhưng một Head không tồn tại mãi. Nó được mở ra, được dùng, rồi được đóng lại.<br>01-2: Vậy tiền đi vào Head bằng cách nào, và làm sao để lấy ra an toàn?<br>01-3: Tập này sẽ đi theo những món tiền chưa tiêu, từ lúc lên Head cho tới lúc trở về. | 25<br>17<br>16<br>19 | Gợi lại cảnh cuối tập 1: đường kẻ ngang, dưới là Cardano, trên là vòng tròn "Hydra Head". Vòng tròn được vẽ ra rồi bị một nét phấn khép lại. Vài ô vàng (món tiền chưa tiêu) nằm dưới đường kẻ, một dấu hỏi giữa ô và vòng tròn. | Nền vào dần. Tiếng phấn khi vẽ vòng tròn. |
| **02. Sáu chặng**<br>~18 giây | `1. Mở Head`<br>`2. Nạp tiền`<br>`3. Giao dịch`<br>`4. Đóng Head`<br>`5. Khiếu nại`<br>`6. Trả về` | 02-0: Vòng đời của một Head có sáu chặng, nối tiếp nhau theo đúng thứ tự.<br>02-1: Ba chặng đầu là mở Head, nạp tiền vào, rồi giao dịch ở bên trong.<br>02-2: Ba chặng sau là đóng Head, chờ hết thời gian khiếu nại, rồi trả tiền về mạng chính.<br>02-3: Ta sẽ lần lượt đi qua từng chặng, bắt đầu từ lúc mở Head. | 15<br>15<br>18<br>14 | Một vòng cung sáu chặng vẽ dần từ trái sang phải: ba chặng đi lên phía Head, ba chặng đi xuống về mạng chính. Mỗi chặng một biểu tượng nhỏ (cửa mở, ô vàng đi lên, mũi tên tách ghép, cửa đóng, đồng hồ, ô vàng đi xuống). Bản đồ này thu nhỏ vào góc trên và sáng chặng đang kể ở các cảnh sau. | Một tiếng "tick" cho mỗi chặng hiện ra. |
| **03. Chặng 1 — Mở Head**<br>~28 giây | `Mở Head · Init`<br>`Thành viên`<br>`Thời gian khiếu nại`<br>`Head: trống` | 03-0: Trước hết, một nhóm người thống nhất sẽ cùng mở một Head. Mỗi người chạy một nút Hydra của riêng họ.<br>03-1: Một người gửi lệnh mở Head. Lệnh này tạo ra một giao dịch trên mạng chính Cardano.<br>03-2: Giao dịch đó ghi lại hai điều. Thứ nhất là danh sách thành viên, thứ hai là thời gian khiếu nại.<br>03-3: Thời gian khiếu nại là khoảng chờ khi đóng Head. Ta sẽ quay lại với khoảng chờ này ở chặng thứ năm.<br>03-4: Khi giao dịch được ghi nhận, Head mở ra ngay, nhưng bên trong vẫn còn trống. | 22<br>19<br>21<br>22<br>16 | Ba hình người vẽ phấn, mỗi người cạnh một hộp nhỏ "nút Hydra". Một người gửi lệnh "Init"; một tờ giấy (giao dịch) rơi xuống đường kẻ mạng chính, trên giấy ghi danh sách thành viên và một đồng hồ nhỏ. Vòng tròn Head mở ra, bên trong trống. | Tiếng "cạch" khi Head mở. |
| **04. Mở trước, nạp sau**<br>~17 giây | `Trước đây: Init → Commit → Open`<br>`Hydra v2: Init → Open → nạp dần` | 04-0: Ở các phiên bản Hydra trước, mọi người phải góp tiền xong thì Head mới được mở.<br>04-1: Chỉ cần một người chậm chân là cả nhóm phải chờ, hoặc huỷ Head rồi làm lại từ đầu.<br>04-2: Từ Hydra phiên bản hai, Head mở trước. Ai muốn góp tiền thì nạp vào sau, trong lúc Head đang mở. | 18<br>19<br>22 | Hai dòng so sánh. Dòng trên: ba người, hai người đã đặt ô vàng, người thứ ba chưa; Head đứng chờ với đồng hồ cát, rồi bị gạch chéo "huỷ". Dòng dưới: Head mở trước, các ô vàng lần lượt đi lên vào những lúc khác nhau. | Tiếng gạch phấn ở dòng trên; "tick" nhẹ mỗi khi một ô đi lên ở dòng dưới. |
| **05. Chặng 2 — Nạp tiền**<br>~26 giây | `Nạp tiền · Commit`<br>`Giao dịch nạp`<br>`Chờ cho chắc chắn`<br>`Quá hạn → lấy lại` | 05-0: Để nạp tiền, bạn gửi một giao dịch nạp trên mạng chính, chỉ đích danh những món tiền muốn đưa lên.<br>05-1: Các món này được chuyển vào một ổ khoá đặc biệt, dành riêng cho việc nạp vào Head.<br>05-2: Nút Hydra chờ thêm một lúc trên mạng chính cho chắc chắn, rồi mới đưa món tiền vào Head.<br>05-3: Nếu quá hạn mà món tiền vẫn chưa vào được Head, chủ của nó vẫn lấy lại được.<br>05-4: Lên tới Head, món tiền vẫn mang nguyên ổ khoá của bạn, như lúc còn ở mạng chính. | 21<br>18<br>20<br>18<br>18 | Một ô vàng có ổ khoá của chủ đi từ mạng chính vào một hộp có ổ khoá lớn (ổ khoá nạp). Đồng hồ nhỏ chạy vài vòng, rồi ô vàng bay lên vào vòng tròn Head, vẫn mang ổ khoá cũ. Nhánh phụ mờ: đồng hồ hết giờ, ô vàng quay về tay chủ. | "Cạch" khi ô vào hộp nạp; tiếng "vút" nhẹ khi ô bay lên Head. |
| **06. Chặng 3 — Giao dịch bên trong**<br>~19 giây | `Head đang mở · Open`<br>`Tiêu món cũ → sinh món mới`<br>`Không chờ khối` | 06-0: Khi đã có tiền, các thành viên giao dịch với nhau ngay ở trong Head.<br>06-1: Luật chơi vẫn là luật của tập một. Tiêu trọn món cũ, sinh ra món mới, có cả tiền thối.<br>06-2: Điểm khác là giao dịch không phải chờ mạng chính Cardano ghi vào khối.<br>06-3: Chỉ cần các nút Hydra trong nhóm kiểm tra và đồng ý với nhau là xong. | 15<br>20<br>16<br>17 | Bên trong vòng tròn Head: một ô vàng bị gạch, tách thành hai ô mới; hai ô khác gộp thành một. Dưới đường kẻ, mạng chính vẫn đứng yên, các khối đi chậm. Ba nút Hydra gật đầu (dấu tích) sau mỗi giao dịch. | Chuỗi "tick" nhanh theo các giao dịch trong Head; nền mạng chính trầm, chậm. |
| **07. Snapshot**<br>~21 giây | `Snapshot`<br>`#1  #2  #3 …`<br>`Đủ chữ ký cả nhóm` | 07-0: Các nút ghi lại kết quả bằng những snapshot, tức là những lần chốt lại toàn bộ sổ cái của Head.<br>07-1: Mỗi snapshot có một số thứ tự tăng dần, và phải có đủ chữ ký của mọi thành viên.<br>07-2: Snapshot mới nhất cho biết món tiền nào đang thuộc về ai.<br>07-3: Hãy nhớ kỹ chi tiết này, vì nó sẽ quyết định mọi thứ khi đóng Head. | 23<br>21<br>14<br>16 | Một khung ảnh vẽ phấn chụp lại các ô vàng trong Head, góc khung ghi "#3". Ba chữ ký ký lần lượt dưới khung. Các khung #1, #2, #3 xếp chồng, khung mới nhất nằm trên cùng và được khoanh. | Tiếng "tách" như màn trập máy ảnh mỗi khi có snapshot mới; tiếng phấn khi ký. |
| **08. Rút giữa chừng**<br>~15 giây | `Rút ra · Decommit`<br>`Head vẫn mở` | 08-0: Muốn đưa một món tiền về mạng chính sớm, bạn không cần phải đóng cả Head.<br>08-1: Head cho phép rút riêng từng món ra, trong khi những người khác vẫn tiếp tục giao dịch.<br>08-2: Món tiền rút ra sẽ xuất hiện lại trên mạng chính, vẫn mang ổ khoá của bạn. | 16<br>18<br>17 | Một ô vàng trượt xuống khỏi vòng tròn Head về mạng chính. Bên trong Head các ô khác vẫn tách ghép bình thường. | Tiếng "vút" đi xuống. |
| **09. Chặng 4 — Đóng Head**<br>~18 giây | `Đóng Head · Close`<br>`Snapshot mới nhất`<br>`Ngừng nhận giao dịch` | 09-0: Đến lúc kết thúc, một thành viên bất kỳ gửi lệnh đóng Head.<br>09-1: Lệnh này đưa lên mạng chính snapshot mới nhất mà người đó đang giữ.<br>09-2: Từ lúc này, Head ngừng nhận giao dịch mới, nhưng tiền vẫn chưa được trả về ngay.<br>09-3: Vì sao lại phải chờ? Vì người đóng Head có thể đưa lên một snapshot cũ. | 13<br>16<br>17<br>18 | Một thành viên kéo cửa vòng tròn Head khép lại. Một khung snapshot rơi xuống đường kẻ mạng chính. Dấu "Không nhận giao dịch" đóng lên Head. Cuối cảnh: một dấu hỏi nhỏ trên khung snapshot. | Tiếng "cạch" đóng cửa; nền chuyển sang hợp âm căng hơn. |
| **10. Chặng 5 — Khiếu nại**<br>~27 giây | `Khiếu nại · Contest`<br>`An đóng bằng #4`<br>`Bình đưa #5`<br>`#5 > #4` | 10-0: Giả sử ở snapshot số năm, An đã chuyển tiền cho Bình.<br>10-1: Nhưng An lại đóng Head bằng snapshot số bốn, lúc số tiền đó vẫn còn trong túi An.<br>10-2: Đồng hồ đếm ngược bắt đầu chạy. Trong thời gian đó, Bình có quyền khiếu nại.<br>10-3: Bình đưa ra snapshot số năm, có đủ chữ ký của cả nhóm, kể cả chữ ký của An.<br>10-4: Snapshot có số lớn hơn sẽ được dùng. An không làm giả được snapshot mới hơn, vì thiếu chữ ký của Bình. | 14<br>20<br>16<br>21<br>26 | Đồng hồ đếm ngược lớn vẽ phấn ở giữa bảng, kim chạy. Bên trái An đặt khung "#4"; bên phải Bình đặt khung "#5" lên trên, chữ ký của An trên khung #5 được khoanh. Khung #4 bị gạch. Một khung giả "#6" của An chỉ có một chữ ký thì bị đóng dấu "Từ chối". | Tiếng tích tắc đều suốt cảnh; tiếng gạch khi khung #4 bị loại; tiếng trầm ngắn khi khung giả bị từ chối. |
| **11. Chặng 6 — Trả về mạng chính**<br>~22 giây | `Sẵn sàng trả về · ReadyToFanout`<br>`Trả về · Fanout`<br>`Cùng địa chỉ, cùng số lượng` | 11-0: Khi đồng hồ về không, Head chuyển sang trạng thái sẵn sàng trả tiền.<br>11-1: Một thành viên gửi lệnh trả về, và các món tiền theo snapshot cuối được tạo lại trên mạng chính.<br>11-2: Mỗi món mang đúng địa chỉ và số lượng như trong snapshot, tức vẫn là ổ khoá của chủ nó.<br>11-3: Head kết thúc ở đây. Các món tiền đã đi trọn một vòng, từ mạng chính lên Head rồi quay về. | 14<br>22<br>22<br>21 | Đồng hồ về 0, chuông nhỏ. Các ô vàng trong khung snapshot #5 lần lượt rơi xuống mạng chính, mỗi ô vẫn có ổ khoá của chủ. Vòng tròn Head mờ dần. Bản đồ sáu chặng ở góc sáng trọn vòng. | Chuông khi đồng hồ về không; chuỗi "tick" khi từng ô rơi xuống. |
| **12. Phải để mắt tới Head**<br>~21 giây | `Món nào cũng có đường về`<br>`Khiếu nại đúng lúc`<br>`Theo dõi trạng thái` | 12-0: Vòng đời này cho thấy, mỗi món tiền trên Head đều có một con đường để quay về mạng chính.<br>12-1: Nhưng quyền khiếu nại chỉ có ích khi bạn để ý đến Head vào đúng lúc.<br>12-2: Nếu không ai lên tiếng, snapshot cũ sẽ được dùng khi đồng hồ về không.<br>12-3: Vì vậy, ứng dụng của bạn cần theo dõi trạng thái của Head liên tục, nhất là khi có người đóng Head. | 20<br>16<br>17<br>22 | Vòng sáu chặng vẽ lại đầy đủ. Một con mắt phấn đặt cạnh chặng "Khiếu nại", nối bằng nét đứt tới một chiếc điện thoại nhỏ (ứng dụng). | Nền chuyển hợp âm sang phần dành cho lập trình viên. |
| **13. HydraBridge — cho lập trình viên**<br>~23 giây | `const bridge = new HydraBridge({ url: 'ws://…' })`<br>`await bridge.connect()`<br>`bridge.events.on('onMessage', payload => {`<br>`  switch (payload.tag) { … }`<br>`})` | 13-0: Phần này dành cho lập trình viên. Trong hydra-sdk, việc theo dõi đó do HydraBridge đảm nhận.<br>13-1: HydraBridge kết nối với nút Hydra qua WebSocket, một đường truyền luôn mở theo cả hai chiều.<br>13-2: Mỗi khi Head có thay đổi, nút Hydra gửi về một tin nhắn mang một nhãn riêng.<br>13-3: Bạn chỉ cần đăng ký nghe mọi tin nhắn gửi về, rồi xử lý theo nhãn của từng tin. | 24<br>23<br>18<br>19 | Đoạn code viết tay bằng phấn, từng dòng hiện theo lời đọc; "onMessage" được khoanh khi lời đọc nói "nghe mọi tin nhắn". Một đường hai chiều nối hộp "nút Hydra" với hộp "ứng dụng", các tin nhắn nhỏ có nhãn chạy dọc đường. Góc trên: nhãn nhỏ "@hydra-sdk/bridge · HydraBridge". | Tiếng gõ phấn nhanh theo từng dòng code; "tick" nhỏ mỗi tin nhắn chạy qua. |
| **14. Nhãn của từng chặng**<br>~36 giây | `Mở Head → HeadIsOpen`<br>`Đóng Head → HeadIsClosed (contestationDeadline)`<br>`Khiếu nại → HeadIsContested`<br>`Hết giờ → ReadyToFanout`<br>`Trả về xong → HeadIsFinalized`<br>`bridge.commands: init · close · contest · fanout`<br>`Nạp tiền: bridge.commit() → giao dịch nạp chưa ký → ví ký, gửi lên mạng chính` | 14-0: Mỗi chặng của vòng đời ứng với một nhãn tin nhắn. Head vừa mở xong thì có nhãn báo Head đã mở.<br>14-1: Head bị đóng thì có nhãn báo đã đóng, kèm theo hạn chót của thời gian khiếu nại.<br>14-2: Có người khiếu nại thì có nhãn báo khiếu nại. Hết thời gian thì có nhãn báo sẵn sàng trả về.<br>14-3: Chỉ khi thấy nhãn sẵn sàng trả về, bạn mới gửi lệnh trả về. Xong xuôi thì có nhãn báo Head đã kết thúc.<br>14-4: Các lệnh mở, đóng, khiếu nại và trả về đều có sẵn trong HydraBridge, mỗi lệnh chỉ cần một dòng code.<br>14-5: Riêng hàm nạp tiền chỉ soạn sẵn giao dịch nạp. Ví của bạn vẫn phải ký, rồi gửi giao dịch đó lên mạng chính. | 22<br>18<br>21<br>24<br>24<br>24 | Bản đồ sáu chặng của cảnh 02 hiện lại, mỗi chặng được gắn một thẻ nhãn viết bằng phấn khi lời đọc nhắc tới; tên nhãn tiếng Anh chỉ viết trên bảng, không đọc. "contestationDeadline" nối bằng nét đứt tới đồng hồ của cảnh 10. Dòng áp chót liệt kê các lệnh, gạch chân "fanout" kèm ghi chú nhỏ "sau ReadyToFanout". Dòng cuối vẽ ba bước nạp tiền: hàm commit soạn giao dịch, chiếc ví ký, giao dịch rơi xuống mạng chính. | Tiếng phấn; "tick" mỗi khi một thẻ nhãn được gắn. |
| **15. Tóm tắt và lời kết**<br>~25 giây | `1. Mở trước, nạp sau`<br>`2. Snapshot đủ chữ ký`<br>`3. Snapshot mới nhất thắng, rồi trả về`<br>`hydrasdk.com`<br>`Thực hiện cùng VTechcom Labs` | 15-0: Tóm lại, qua tập này bạn chỉ cần nhớ ba ý chính.<br>15-1: Thứ nhất, Head mở trước, rồi các món tiền chưa tiêu được nạp lên từ mạng chính.<br>15-2: Thứ hai, bên trong Head, mọi thay đổi được ghi bằng snapshot có đủ chữ ký cả nhóm.<br>15-3: Thứ ba, khi đóng Head, snapshot mới nhất sẽ thắng, rồi tiền được trả về mạng chính.<br>15-4: Bạn có thể xem thêm tài liệu tại hydrasdk.com. Hẹn gặp lại bạn ở tập sau. | 12<br>17<br>20<br>19<br>22 | Ba ý viết lần lượt. Cuối: "hydrasdk.com" ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" kèm logo ở góc dưới phải, không đọc thành lời. | Một nốt chuông cho mỗi ý; nền ra dần trong 2 giây cuối. |

**Tổng:** 64 câu, 1208 âm tiết, ước lượng khoảng 5 phút 38 giây (tính 4.2 âm tiết/giây, cộng nghỉ giữa câu và giữa cảnh).
