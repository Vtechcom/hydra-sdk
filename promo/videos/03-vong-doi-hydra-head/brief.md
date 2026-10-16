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
