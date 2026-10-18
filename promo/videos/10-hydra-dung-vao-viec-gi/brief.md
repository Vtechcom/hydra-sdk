# Tập 10 — Hydra dùng vào việc gì?

## Brief

| Mục | Quyết định |
|---|---|
| Chuỗi | Kiến thức nền Cardano và Hydra, đồng thời giới thiệu hydra-sdk |
| Thể loại | Giải thích khoa học (tập định vị: khi nào nên và không nên dùng Hydra Head) |
| Phong cách | Như các tập trước: phấn trắng trên nền đen, hình hiện dần như đang được vẽ |
| Lời đọc | Tiếng Việt, giọng Hải Đăng (VieNeu), không có phụ đề chạy; chữ trên màn hình chỉ là chữ được "viết" lên bảng |
| Khung hình | 16:9, 1920×1080 |
| Âm thanh | Giọng đọc + nền và hiệu ứng tự tổng hợp; một tiếng chuông nhẹ khi một tình huống "qua" bộ lọc, một tiếng trầm ngắn khi "không qua" |
| Khán giả | Người chưa biết gì về blockchain, đã xem tập 1–9 (nhất là tập 2, 3 và 9); đoạn ngắn cho lập trình viên ở cảnh 11–12 |
| Độ dài | Khoảng 5–6 phút |
| Cuối video | hydrasdk.com, kèm dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc, không đọc thành lời |

**Câu hỏi mở đầu:** tập 9 vừa cho thấy cả mạng Cardano phải cùng đồng ý về từng khối, nên ai ghi sổ cũng phải chờ. Phòng họp riêng của tập 2 rất hợp với bốn người bạn chơi trò chơi. Vậy những việc khác thì sao, việc nào nên đem vào phòng, việc nào nên để ở sổ chung?

**Ẩn dụ chính:** giữ nguyên "phòng họp riêng" (Hydra Head) của tập 2 và "món tiền chưa tiêu" mang ổ khoá của tập 1. Thêm một hình phụ không mâu thuẫn với ẩn dụ cũ: **ba điều kiện viết trên cửa phòng**, dùng làm bộ lọc cho mọi tình huống:

1. Danh sách thành viên chốt từ lúc mở phòng, không ai vào thêm giữa chừng.
2. Mỗi snapshot cần chữ ký của tất cả thành viên, nên nút Hydra của mọi người phải cùng đang chạy. "Có mặt" trong video luôn hiểu là nút Hydra đang chạy và tự ký; người dùng không phải ngồi canh từng giao dịch.
3. Chỉ tiêu được những món tiền đang nằm trong phòng. Tiền vẫn nạp thêm hay rút bớt từng món được khi Head đang mở; trả cho người ngoài thì phải đem tiền ra sổ chung.

Ba điều kiện này đều đã xuất hiện ở tập 2 (cảnh 08, 11) và tập 3 (cảnh 03, 05, 07); tập 10 chỉ gom chúng lại và dùng làm thước đo.

**Hình xuyên suốt:** cánh cửa phòng họp vẽ xanh phấn ở bên trái bảng, trên cửa là ba dòng điều kiện. Mỗi tình huống được vẽ thành một tấm thẻ trắng, đi qua cửa: điều kiện nào thoả thì dòng đó sáng lên. Thẻ qua được cả ba điều kiện thì vào phòng và có dấu tích; thẻ vướng điều kiện nào thì dừng trước cửa, dòng đó gạch chéo. Dấu tích và dấu chéo vẽ bằng nét (font Mali không có ✓, ✗).

**Màu nhấn cố định:** món tiền vàng phấn (như tập 1); phòng họp, Hydra Head xanh lam phấn (như tập 2); sổ chung lớp một trắng; dấu tích xanh lá phấn; dấu chéo và dòng điều kiện bị vướng cam phấn (không dùng đỏ đậm để khỏi lẫn với cảnh báo lừa đảo của tập 4).

**Ví dụ xuyên suốt:** bốn người bạn An, Bình, Chi, Dũng của tập 2 mở đầu và kết thúc video. Các tình huống còn lại (quán cà phê và khách quen, phiên đấu giá nhỏ, một ví thanh toán cho cả thành phố) là **ví dụ minh hoạ**, không phải ứng dụng có thật và không phải sản phẩm dựng bằng hydra-sdk.

**Xưng hô và thuật ngữ:** xưng "ta", không xưng "mình". Snapshot là tên chính ("xờ náp sót"). Khoảng chờ khi đóng Head gọi là **thời gian khiếu nại** như tập 3 (tập 2 câu 09-3 dùng "thời gian đối chiếu"; tập này theo tập 3 và ghi lại điểm lệch này cho phiên quản lý chuỗi).

## Nguồn tham khảo

Code hydra-sdk (đã mở đọc):

- `packages/hydra-bridge/src/types/payload.type.ts`
  - dòng 58–85 — `HydraHeadTag`, có `PeerConnected`, `PeerDisconnected`, `NetworkConnected`, `NetworkDisconnected`, cùng các nhãn vòng đời `HeadIsOpen`, `HeadIsClosed`, `HeadIsContested`, `ReadyToFanout`, `HeadIsFinalized`; `HeadPartiallyFannedOut` ghi `@experimental`.
  - dòng 283–291 — `PeerConnected` và `PeerDisconnected` mang trường `peer: string`.
  - dòng 304–308 — `HeadIsOpen` mang `headId` và `parties: VKeyAddress[]` (danh sách thành viên).
  - dòng 567–570 — `HeadParameters` gồm `contestationPeriod` và `parties`.
- `packages/hydra-bridge/src/bridge.ts`
  - `:362-380` — `headInfo()` trả `headId`, `headStatus`, `vkey`; JSDoc ghi `vkey` là khoá của thành viên **đầu tiên** trong tham số Head (`parameters.parties[0]`), không nhất thiết là nút đang kết nối; khoá của chính nút đọc từ `Greetings.me.vkey`. Tập này không dùng `headInfo()` trên bảng.
  - `:386-388` — `commit(data)` gọi `POST /commit`, trả giao dịch nạp chưa ký.
  - `:438`, `:452` — `pendingDeposits()`, `recoverDeposit(depositTxId)`.
  - `:475-482` — `addressesInHead()` trả các địa chỉ đang có món tiền trong Head.
  - `:484-546` — `bridge.commands`: `init`, `close`, `safeClose`, `fanout`, `contest`, `recover`, `decommit`, `partialFanout`, `newTx`.
  - `:596` — `submitTxSync(tx)`; `:636` — `decommit({ cborHex, txId })`; `:660-662` — `events`.
- `packages/hydra-bridge/src/connector/websocket.ts:368` — mọi tin từ hydra-node phát ra sự kiện `onMessage`.
- `packages/hydra-transaction/src/tx-builder/index.ts` — `TxBuilder` với `isHydra`, `setFee` (`:774`), `metadataValue` (`:682`); các hàm script `txInScript`, `txInRedeemerValue`, `txOutInlineDatumValue` (đã dùng ở tập 5).
- `packages/app-bridge/README.md`, `packages/app-bridge/docs/ARCHITECTURE-AND-IMPLEMENTATION-GUIDE.md`, `packages/app-bridge/src/client.ts` — `@hydra-sdk/app-bridge` 0.1.0: kênh `postMessage` để trò chơi chạy trong `<iframe>` nhờ trang chủ (App Center của HydraOne) gọi ví CIP-30 (`WalletBridgeClient`, `signTx`, `signData`, `getUtxos`, `submitTx`). Gói này **không** tự kết nối Hydra Head; `submitTx` gửi lên lớp một ("Submit transaction lên chain L1", README mục 5.1). Các bản v0.2.0–v1.0.0 trong tài liệu kiến trúc là lộ trình, chưa có.
- Không có gói `game-sdk` trong `packages/` hiện tại; lịch sử git có commit `da1ddf3` ("introduce game-sdk package…", 2026-09-28) rồi đổi thành `app-bridge` (`f1db905`, cùng ngày).
- `apps/nodejs-playground/src/hydra/` — chỉ có ví dụ chung (kết nối, nạp, rút, dựng giao dịch); không có ví dụ trò chơi, đấu giá hay thanh toán vi mô.

Tài liệu docs-v2 (đã mở đọc):

- `apps/docs-v2/content/en/3.concepts/1.index.md` — "Why Hydra?": mục Use Cases (Gaming, Micropayments & Streaming, DeFi Trading, NFT Marketplaces, Social & Governance); mục Trade-offs (dòng 257–260: "Requires participant cooperation", "Limited to participants in head", "Opening/closing has Layer 1 costs"); mục When to Use Hydra (dòng 264–277: hợp với "Known Participants", "Session-Based", "Many transactions between known parties"; không hợp với "One-Time Transactions", "Unknown Parties", "Long-Term Storage", "Public Access").
- `apps/docs-v2/content/en/3.concepts/5.smart-contracts-in-hydra.md` — script Plutus chạy y nguyên trong Head.
- `apps/docs-v2/content/en/3.concepts/6.hydra-v2-changes.md:13,52-57` — v2 mở Head trực tiếp, tiền vào bằng `deposit` khi Head đang mở.
- `apps/docs-v2/content/en/index.md:155-266` — mục "Ecosystem / Apps built with Hydra SDK" liệt kê Hydra Hub, Playground và bốn trò chơi trên `alpha.hydraone.app` (Hydra Fly, River Cross, Hydra Gacha, Knight; mô tả ghi cược bằng tADA, tức ADA mạng thử nghiệm). Xem "Câu hỏi cho chủ sản phẩm", câu 3.

Nguồn ngoài (đã mở đọc ngày 16/10/2026):

- Hydra docs, Protocol overview — https://hydra.family/head-protocol/docs/protocol-overview — "all participants must acknowledge and agree on the new state in so-called snapshots"; tham số mở Head gồm danh sách thành viên và thời gian khiếu nại; "Any participant can close the head using a snapshot".
- Hydra docs, FAQs — https://hydra.family/head-protocol/docs/faqs — thành viên mới "cannot join and must be decided upfront".
- Hydra docs, Use cases — https://hydra.family/head-protocol/use-cases — trang mục lục có ba nhóm: Auctions, Payments, Other (một mục về poker). Chưa mở từng mục con.
- IOG, "Implementing Hydra Heads: the first step towards the full Hydra vision" (03/02/2022, Matthias Benkort) — https://www.iog.io/news/implementing-hydra-heads-the-first-step-towards-the-full-hydra-vision — Interhead Hydra là nghiên cứu đã công bố, "defines a method for interconnecting two Heads together" và "in the long run" hướng tới "a network of interconnected Hydra Heads"; Hydra Tail "still under research"; "the consensus inside a Head requires every participant to react to every transaction"; Head hợp khi "a small group of participants need to process many quick interactions"; chưa phải lời giải cho thanh toán đại trà giữa người tiêu dùng; ví von "If someone doesn't play, then the game doesn't progress".
- IOG, "Scaling Cardano applications with Hydra" (27/10/2025) — https://www.iog.io/news/scaling-cardano-applications-with-hydra — hợp với "gaming, micropayments, auctions, or collaborative tools"; giới hạn hiện tại "a limited number of participants".
- Cardano.org, Glossary "Hydra" — https://cardano.org/glossary/hydra/ — "a known set of participants and many small transactions, such as payments, gaming and auctions".
- IOG, "Implementing auction projects using Hydra" (20/01/2023, IOG và MLabs) — https://www.iog.io/news/implementing-auction-projects-using-hydra — thiết kế "delegated voucher auction": người đấu giá không ở trong Head, một nhóm đại diện (delegates) chạy Head; lý do là tránh việc mọi người phải luôn có mặt.
- IOG, "Hydra for Payments…" (10/11/2022, Obsidian Systems viết) — https://www.iog.io/news/hydra-for-payments-introducing-developer-tooling-to-unlock-micropayments-on-cardano — bộ công cụ mã nguồn mở cho thanh toán dựa trên Hydra Head, dành cho nhóm "relatively small".
- IOG, "Hydra Doom tournament finale…" (02/2025) — https://www.iog.io/news/hydra-doom-tournament-finale-shines-at-cplay-marking-cardanos-milestone-of-1m-tps — chỉ để đối chiếu, mặc định không dùng (xem "Không dùng").

Tập liên quan: `promo/videos/09-khoi-dong-thuan-staking/brief.md` (cảnh 01–05, 13: khối, cả mạng đồng ý, chờ khối; nhắc tập khác bằng số tập, không nói "tập trước"), `promo/videos/02-hydra-la-gi/brief.md` và `script.py` (cảnh 08, 09, 11), `03-vong-doi-hydra-head/brief.md` và `script.py` (cảnh 03, 05, 07, 08, 12), `06-thuc-hanh-hydra-sdk/brief.md` (API `submitTxSync`, `events`).

## Ranh giới sự thật

Được nói (đã đối chiếu):

- Danh sách thành viên của Head được ghi lúc mở (`HeadIsOpen.parties`, `HeadParameters.parties`; hydra.family protocol overview) và không ai vào thêm khi Head đang chạy (hydra.family FAQ). Muốn đổi nhóm thì đóng Head rồi mở Head mới.
- Tiền thì vào ra được khi Head đang mở: nạp thêm bằng giao dịch nạp, rút riêng từng món mà không đóng Head (tập 3 cảnh 05, 08; `commit`, `decommit` trong `HydraBridge`). Nhóm người cố định, còn số tiền trong phòng thay đổi được.
- Mỗi snapshot cần chữ ký của tất cả thành viên (hydra.family; `SnapshotConfirmed.signatures.multiSignature`). Suy ra: một thành viên tắt máy hay mất kết nối thì Head không có snapshot mới, giao dịch không tiến thêm. Đây là suy luận trực tiếp từ luật ký, khớp tập 2 câu 11-3 và ví von của IOG (2022) "If someone doesn't play, then the game doesn't progress".
- Khi Head không tiến thêm, bất kỳ thành viên nào vẫn đóng được Head bằng snapshot mới nhất và lấy tiền về sau thời gian khiếu nại (hydra.family; tập 3). Điều kiện: thành viên phải để mắt tới Head trong thời gian khiếu nại, để kịp khiếu nại nếu có người đóng bằng snapshot cũ (tập 3 cảnh 12). Lời đọc nói "không ai chiếm được tiền, miễn là để mắt tới Head", không nói "tiền không mất" trống không.
- Mọi thành viên phải phản hồi mọi giao dịch (IOG 2022), nên một Head không lớn lên mãi theo số người; IOG (10/2025) vẫn ghi "a limited number of participants" là giới hạn hiện tại. Kịch bản nói định tính "nhóm nhỏ", không nói con số.
- Giao dịch bên trong Head không nằm trên sổ chung; sổ chung chỉ thấy giao dịch mở, nạp, rút, đóng và kết quả cuối (tập 2 cảnh 10, tập 3). Ai cần từng giao dịch hiện ngay trên lớp một cho cả mạng thấy thì Head không đáp ứng điều đó.
- Mở và đóng Head là giao dịch lớp một, có phí và phải chờ (docs-v2 Trade-offs; tập 2 câu 11-2). Vì vậy một giao dịch lẻ, làm một lần, không đáng mở phòng (docs-v2 "One-Time Transactions").
- Ba nhóm tình huống được nguồn chính thức nêu là hợp với Hydra: trò chơi, thanh toán (gồm thanh toán vi mô), đấu giá (cardano.org glossary; IOG 10/2025; hydra.family use cases). Tình huống "vài đối tác trả qua lại nhiều lần" khớp tiêu chí "many transactions between known parties", "session-based" của docs-v2.
- Script Plutus chạy trong Head như trên mạng chính (docs-v2 "Smart Contracts in Hydra"), nên luật của trò chơi hay phiên đấu giá có thể viết bằng script như tập 5.
- hydra-sdk cung cấp phần chung cho mọi tình huống trên: kết nối Head và nghe sự kiện (`HydraBridge`, `events`, `onMessage`), nạp và rút tiền (`commit`, `decommit`), dựng giao dịch có hoặc không có script (`TxBuilder` với `isHydra`), đóng Head (`commands.close`). hydra-sdk không có sẵn mô-đun trò chơi, đấu giá hay thanh toán vi mô; luật nghiệp vụ do ứng dụng tự viết.
- Câu định vị (cảnh 08): một Head là một phòng của một nhóm; nhiều nhóm mở nhiều Head cùng lúc (tập 2 cảnh 05). Bài IOG ngày 03/02/2022 cho biết đã có nghiên cứu nối hai Head với nhau, về lâu dài hướng tới mạng nhiều Head. Lời đọc gắn mốc năm 2022 và nói "lúc đó là hướng nghiên cứu", không khẳng định trạng thái hiện nay; bảng ghi thêm "chưa có trong hydra-sdk" (đã kiểm `packages/`).
- Câu nối tập 9 (cảnh 01, 04): cả mạng phải đồng ý về từng khối và phải chờ khối; bên trong Head không phải chờ khối (tập 9 cảnh 13, tập 2).
- `HydraBridge` báo khi nút Hydra mất hoặc có lại kết nối với một thành viên (`PeerDisconnected`, `PeerConnected`, trường `peer`), nên ứng dụng biết được lúc nào điều kiện "mọi người có mặt" không còn thoả.

Đơn giản hoá có chủ ý:

- "Mọi người phải có mặt": thực tế là mọi **nút Hydra** của thành viên phải chạy và nối được với nhau; nút tự kiểm tra và ký, người dùng không cần ngồi trước máy. Lời đọc nói rõ ở cảnh 03 ("nút Hydra của mọi người phải cùng đang chạy") và cảnh 04 ("việc ký do nút Hydra tự làm"), sau đó mới nói gọn "có mặt".
- `PeerDisconnected` cho biết mất kết nối tới một nút, không có nghĩa nút đó đã tắt hẳn; kết nối có thể trở lại (`PeerConnected`). Cảnh 12 nói "báo cho ứng dụng biết một thành viên đang mất kết nối", không nói "thành viên đã bỏ đi".
- Đấu giá: kịch bản vẽ phiên đấu giá nhỏ, người đấu giá là thành viên Head. Thiết kế tham khảo của IOG và MLabs (2023) để người đấu giá ở ngoài, chỉ nhóm đại diện chạy Head, chính để tránh điều kiện "mọi người có mặt". Kịch bản nhắc ở cảnh 07 rằng "có những thiết kế để người đấu giá đứng ngoài phòng", không đi vào chi tiết.
- Thanh toán vi mô: ví dụ quán cà phê và vài khách quen là minh hoạ; không nói về bộ công cụ Hydra for Payments cụ thể.
- "Nhóm nhỏ" không có con số. Không nói "tối đa bao nhiêu người".
- Phí bên trong Head: chỉ nói "do chính Head đặt, các ví dụ của hydra-sdk đặt bằng không" như tập 2, không nói "miễn phí".
- Không nói về mạng nhiều Head nối nhau hay các thiết kế lớp hai khác để phục vụ nhóm lớn.

Không dùng:

- Số liệu trong `3.concepts/1.index.md` (1.000+ TPS mỗi Head, xác nhận dưới một giây, phí khoảng 0,001 ADA, giảm 99%): tài liệu không kèm phép đo hay mốc thời gian; các tập trước cũng đã không dùng.
- Con số 1 triệu TPS của Hydra Doom và "100 nút mỗi Head" trong FAQ (FAQ ghi là "stretch goal", không phải giới hạn đo được).
- Tên dự án có thật (Hydra Doom, Hydra for Payments, các trò chơi trên `alpha.hydraone.app`, Hydra Hub) trong lời đọc, cho tới khi chủ sản phẩm quyết (câu hỏi 3). Nếu được duyệt, mỗi tên phải kèm nguồn và mốc thời gian trên bảng.
- Các ví dụ code trong `1.index.md` (truyền phát trả theo giây bằng `setInterval`, giao dịch sàn DEX, bỏ phiếu bằng metadata): đây là đoạn minh hoạ chưa có ví dụ chạy được trong repo; ví dụ trả theo giây còn dùng lại cùng `utxos` mỗi lần, không chạy đúng nếu chép nguyên. Không đưa lên bảng.
- Khẳng định "Hydra hợp với người tin nhau" hoặc "chỉ cần một người trung thực là an toàn": docs-v2 ghi "Trusted or semi-trusted parties" nhưng cơ chế đóng Head và khiếu nại không đòi hỏi tin nhau về tiền; tập 3 đã tránh câu này. Lời đọc dùng "biết trước nhau là ai".
- `@hydra-sdk/app-bridge` như một công cụ "chạy trò chơi trên Hydra": gói này chỉ chuyển yêu cầu ký ví từ trò chơi trong iframe lên trang chủ, gửi giao dịch lên lớp một, không kết nối Head. Lộ trình v0.2.0–v1.0.0 (Unity, CLI `create-game`, Developer Portal) chưa có.
- `HeadPartiallyFannedOut`, `partialFanout` (thử nghiệm), `SafeClose`, `SideLoadSnapshot`.
- Câu "các giải pháp kết nối nhiều phòng họp đang được nghiên cứu" ở thì hiện tại (review agy đề xuất): nguồn chính thức tìm được chỉ có bài IOG 02/2022; không có nguồn mới hơn từ hydra.family hay IOG nói về trạng thái hiện nay. Lời đọc chỉ nói điều bài 2022 ghi. Không nhắc Hydra Tail, "Head-in-Head" hay "nhiều Head trên một nút" (chỉ thấy qua nguồn thứ cấp).
- `headInfo().vkey` như "khoá của mình": đó là khoá của thành viên đầu tiên.

## Dàn ý cảnh

| Cảnh | Tiêu đề | Ý chính (1–3 câu, nói điều gì) | Hình gợi ý | Nối với tập khác |
|---|---|---|---|---|
| 01 | Mở đầu | Ở tập 9, cả mạng phải cùng đồng ý về từng khối nên ai ghi sổ cũng phải chờ. Ở tập 2, bốn người bạn có phòng họp riêng, chỉ người trong phòng cần đồng ý. Nhưng không phải việc gì cũng nên đem vào phòng; tập này tìm cách phân biệt. | Chuỗi trang sổ trắng và dải ô thời gian của tập 9 ở mép dưới; phía trên, phòng xanh phấn với bốn hình người quanh bàn (vẽ lại cảnh 04 tập 2); ngoài cửa nhiều tấm thẻ trắng xếp hàng, mỗi thẻ một dấu hỏi | Tập 9 cảnh 01–05, 13; tập 2 cảnh 01, 04 |
| 02 | Nhắc lại phòng họp | Hydra Head là phòng họp riêng trên Cardano: món tiền được nạp vào, cả nhóm giao dịch, ký snapshot, xong thì đem kết quả ra sổ chung. | Sơ đồ ngắn: sổ chung trắng, món tiền vàng đi lên phòng, snapshot có bốn chữ ký, món tiền quay về | Tập 2 cảnh 05–10; tập 3 cảnh 02 |
| 03 | Ba điều kiện trên cửa | Thứ nhất, danh sách thành viên chốt từ lúc mở. Thứ hai, mỗi snapshot cần chữ ký của tất cả, nên nút Hydra của mọi người phải cùng đang chạy. Thứ ba, chỉ tiêu được tiền đang nằm trong phòng; nạp thêm, rút bớt được, nhưng trả người ngoài thì phải đem tiền ra. | Cánh cửa xanh phấn, ba dòng điều kiện viết lần lượt; mỗi dòng có biểu tượng nhỏ (danh sách tên, bốn chữ ký, món tiền vàng có mũi tên vào ra) | Tập 3 cảnh 03, 05, 07, 08 |
| 04 | Vì sao có ba điều kiện | Không có ai đứng ngoài xác nhận, nên các thành viên phải cùng ký; việc ký do nút Hydra tự làm. Đổi lại, không phải chờ khối như tập 9, và ai cũng có quyền đóng Head để đem tiền về. | Bốn máy tính nhỏ nối thành vòng, mỗi máy tự đóng dấu chữ ký; một trang sổ của tập 9 đứng ngoài, gạch mờ; chiếc chìa đóng cửa trong tay từng người | Tập 2 cảnh 08, 09; tập 3 cảnh 09–11; tập 9 |
| 05 | Phù hợp 1: trò chơi theo lượt | Bốn người bạn chơi theo lượt cả buổi, tiền cược đã nạp sẵn. Qua cả ba điều kiện; luật chơi có thể viết bằng script như tập 5. | Thẻ "Trò chơi theo lượt" qua cửa, ba dòng lần lượt sáng, dấu tích xanh lá; bàn chơi có các đồng ADA vàng | Tập 2; tập 5 |
| 06 | Phù hợp 2: thanh toán vi mô trong nhóm cố định | Một quán cà phê và vài khách quen trả nhau từng khoản nhỏ. Mở phòng một lần, trả nhiều lần, rồi mới đem kết quả ra sổ chung. | Thẻ "Thanh toán vi mô" qua cửa; nhiều đồng vàng nhỏ chuyền qua lại; cuối cảnh gom thành một dòng trên sổ chung | Tập 2 cảnh 03 |
| 07 | Phù hợp 3: phiên đấu giá nhỏ | Một món hàng, vài người trả giá biết trước, trả giá liên tục trong thời gian ngắn, luật viết bằng script. Phiên đông người hơn khó giữ mọi người có mặt, nên có thiết kế để người trả giá đứng ngoài, chỉ nhóm đại diện chạy Head. | Thẻ "Đấu giá nhỏ" qua cửa; giá trả tăng dần trên tờ datum xanh lam (như tập 5); chữ nhỏ "thiết kế khác: người trả giá đứng ngoài, IOG và MLabs, 01/2023" | Tập 5 |
| 08 | Không phù hợp 1: nhóm luôn thay đổi | Một ví thanh toán cho cả thành phố: người đến đi từng phút và rất đông, vướng điều kiện thứ nhất; nhóm càng đông, mỗi giao dịch càng phải chờ nhiều người phản hồi. Mỗi Head chỉ dành cho nhóm của nó; nhiều nhóm thì mở nhiều Head. Năm 2022, nhóm phát triển Hydra cho biết đã có nghiên cứu nối các Head với nhau, lúc đó là hướng nghiên cứu. | Thẻ "Ví cho cả thành phố" dừng trước cửa; dòng 1 gạch chéo cam; đám đông ngoài cửa. Cuối cảnh: vài phòng xanh nhỏ đứng cạnh nhau, một đường chấm nối hai phòng, chữ nhỏ "Nghiên cứu nối các Head (IOG, 02/2022), chưa có trong hydra-sdk" | Tập 2 cảnh 05, câu 11-1 |
| 09 | Không phù hợp 2: không giữ được mọi người cùng có mặt | Một nút tắt máy là snapshot thiếu chữ ký, cả phòng đứng chờ. Không ai chiếm được tiền, miễn là để mắt tới Head trong thời gian khiếu nại; nhưng việc đang làm thì dừng. | Bốn máy, một máy tắt; snapshot thiếu một chữ ký, đồng hồ cát; dòng 2 gạch chéo; chiếc chìa đóng cửa vẫn sáng, cạnh đó con mắt nhỏ "để mắt tới Head" | Tập 2 câu 11-3; tập 3 cảnh 09–12 |
| 10 | Không phù hợp 3: giao dịch lẻ hoặc cần hiện ngay trên sổ chung | Trả một lần rồi thôi thì mở và đóng phòng tốn hơn trả thẳng ở lớp một. Giao dịch trong phòng không nằm trên sổ chung, nên việc cần cả mạng thấy ngay từng giao dịch nên làm ở lớp một. | Thẻ "Trả một lần" cạnh hai giao dịch mở và đóng trên sổ chung; thẻ "Cần công khai ngay" với sổ chung chỉ có dòng mở, nạp, rút, đóng và kết quả cuối | Tập 2 cảnh 10, câu 11-2 |
| 11 | Cho lập trình viên: theo dõi ba điều kiện | HydraBridge cho ứng dụng nghe các tin từ Head. Tin báo Head đã mở mang danh sách thành viên. Tin báo mất kết nối với một thành viên giúp ứng dụng báo người dùng, chờ kết nối lại hoặc quyết định đóng Head. | Code: `bridge.events.on('onMessage', payload => { … })`, nhánh `payload.tag === 'HeadIsOpen'` đọc `payload.parties`, nhánh `'PeerDisconnected'` đọc `payload.peer`, chú thích `bridge.commands.close()` | Tập 3 cảnh 13–14; tập 6 cảnh 13 |
| 12 | Cho lập trình viên: SDK lo phần nào | hydra-sdk lo phần chung: kết nối, nạp và rút tiền, dựng giao dịch có script, đóng Head. Luật trò chơi hay đấu giá là phần ứng dụng tự viết; SDK chưa có mô-đun riêng cho các việc đó. | Hai cột phấn: "hydra-sdk" (`HydraBridge`, `commit`, `decommit`, `new TxBuilder({ isHydra: true })`, `commands.close`) và "Ứng dụng của bạn" (luật chơi, luật đấu giá, giao diện) | Tập 5 cảnh 11–12; tập 6 |
| 13 | Tóm tắt và lời kết | Ba ý: Head hợp với nhóm biết trước nhau, giao dịch nhiều lần trong một đợt; thử mỗi việc với ba điều kiện; vướng điều kiện nào thì để ở sổ chung. Tài liệu tại hydrasdk.com. | Cửa với ba dòng điều kiện, bên trong ba thẻ có dấu tích, bên ngoài ba thẻ dừng lại; hydrasdk.com ở giữa; góc dưới "Thực hiện cùng VTechcom Labs" (không đọc) | Cả chuỗi |

Ước lượng: 13 cảnh, khoảng 5 phút rưỡi (số chính xác ở cuối `kich-ban.md`).

Bản đầu có cảnh "vài đối tác trả qua lại theo đợt" (ba cửa hàng mở Head cả tháng); đã bỏ theo review agy (xem mục cuối).

## Thuật ngữ mới cần chốt cách đọc

Chưa có trong `promo/shared/tu-dien-doc.md`. Phiên này không sửa file chung.

| Từ | (1) Đọc nguyên văn | (2) Phiên âm đề xuất | (3) Thay bằng từ Việt | Ghi chú |
|---|---|---|---|---|
| micropayment | micropayment | mai crô pây mần | thanh toán vi mô | Đề xuất (3); bảng ghi "Thanh toán vi mô" |
| peer | peer | pia | thành viên / nút của thành viên | Đề xuất (3); `PeerDisconnected` chỉ viết trên bảng, không đọc |
| online / offline | online | on lai / óp lai | có mặt / vắng mặt (nút đang chạy / tắt máy) | Đề xuất (3), tránh lẫn tiếng Anh |
| parties | parties | pa tiz | danh sách thành viên | Chỉ viết trên bảng (`payload.parties`) |
| script | — | scờ ríp | — | Đã chốt, dùng lại |
| IOG | IOG | ai ô gi | — | Chỉ viết trên bảng ở cảnh 07, 08; lời đọc nói "nhóm phát triển Hydra" |
| MLabs | MLabs | em láp | — | Chỉ viết trên bảng ở cảnh 07 |
| Hydra Doom | Hydra Doom | hai dra đum | — | Chỉ cần nếu chủ sản phẩm duyệt nêu tên dự án (câu hỏi 3) |

Từ đã có và dùng lại: Hydra, Hydra Head, Head (đề xuất), hydra-sdk, hydrasdk.com, HydraBridge, snapshot, UTxO, ADA (đề xuất), TxBuilder, datum, script, token.

## Câu hỏi cho chủ sản phẩm

1. **Danh sách tình huống phù hợp.** Bản hiện tại dùng 3 tình huống: trò chơi theo lượt (bốn người bạn), thanh toán vi mô trong nhóm cố định (quán cà phê và khách quen), phiên đấu giá nhỏ, khớp ba nhóm mà nguồn chính thức nêu. Tình huống thứ tư "vài đối tác trả qua lại theo đợt" đã bỏ sau review agy (trùng ý với thanh toán vi mô; ví dụ mở Head cả tháng ngược tiêu chí "Session-Based" của docs-v2). Có muốn đưa lại không, với ví dụ ngắn ngày? Mặc định là không. Có muốn thêm "sàn giao dịch" không? Mặc định là không, vì nguồn trong repo cho tình huống này chỉ có số liệu chưa đo và đoạn code chưa chạy được.
2. **Danh sách tình huống không phù hợp.** Mặc định 3 tình huống: nhóm luôn thay đổi hoặc rất đông (gộp "ai cũng vào được" và "nhóm rất lớn"), không giữ được mọi người cùng có mặt, giao dịch lẻ hoặc cần hiện ngay trên sổ chung. Có muốn tách "nhóm rất lớn" thành cảnh riêng không? Mặc định là gộp.
3. **Có nêu tên sản phẩm, dự án có thật không?** Trang chủ hydrasdk.com (`apps/docs-v2/content/en/index.md`, mục "Apps built with Hydra SDK") ghi Hydra Hub và bốn trò chơi trên `alpha.hydraone.app` (Hydra Fly, River Cross, Hydra Gacha, Knight; mô tả ghi cược bằng tADA của mạng thử nghiệm), kèm câu "already using our SDK in production". Ngoài hệ sinh thái này có Hydra Doom (IOG, 02/2025). Mặc định: **không nêu tên** trong lời đọc, vì đây là quyết định định vị, và câu "production" mâu thuẫn với đường dẫn `alpha` và tADA. Nếu muốn nêu, đề xuất một dòng chữ nhỏ trên bảng ở cảnh 05 "Ví dụ trò chơi dùng hydra-sdk: xem mục Ecosystem trên hydrasdk.com", không đọc tên từng trò chơi và không nói "đang chạy thật".
4. **Có nhắc `@hydra-sdk/app-bridge` không?** Gói 0.1.0 này dành cho trò chơi chạy trong iframe của HydraOne, chỉ chuyển yêu cầu ký ví, không kết nối Head. Mặc định: **không nhắc** ở tập này, vì dễ khiến người xem hiểu là "SDK trò chơi chạy trên Hydra". Nếu muốn, có thể để dành cho một tập riêng khi gói có tài liệu trên docs-v2.
5. **Cảnh mở đầu nối từ tập 9.** Đã có brief tập 9 (khối, đồng thuận, staking). Cảnh 01 mở bằng câu nối "ở tập chín, cả mạng phải cùng đồng ý về từng khối", rồi mới về phòng họp của tập 2; cảnh 04 nhắc lại "không phải chờ khối như tập chín". Theo quy ước của tập 9, lời đọc gọi số tập, không nói "tập trước". Nếu thứ tự phát hành đổi, chỉ cần sửa câu 01-0 và 04-2.
6. **Tên gọi khoảng chờ khi đóng Head.** Tập 2 dùng "thời gian đối chiếu", tập 3 dùng "thời gian khiếu nại". Mặc định tập này dùng "thời gian khiếu nại" theo tập 3, và đề xuất sửa câu 09-3 tập 2 cho thống nhất.

## Xử lý review agy

Theo `review-agy-brief.md`. Mỗi dòng đã được đối chiếu lại với code hoặc nguồn trước khi quyết.

| Mục | Quyết định (sửa / không sửa) | Lý do |
|---|---|---|
| Nguồn `headInfo()`: `vkey` là khoá thành viên đầu tiên | Sửa | Đúng. JSDoc ở `packages/hydra-bridge/src/bridge.ts:369-370` ghi "`vkey` is the FIRST party of the head, not necessarily this node. Use `Greetings.me.vkey` for that". Đã sửa dòng nguồn và thêm vào "Không dùng"; bảng không dùng `headInfo()`. |
| Cảnh 03–04: "có mặt" dễ hiểu là người dùng phải ngồi canh | Sửa | Đúng: nút Hydra tự kiểm tra và ký. Câu 03-2 nói "nút Hydra của mọi người phải cùng đang chạy", câu 04-1 nói "việc ký do nút Hydra tự làm, người dùng không phải ngồi canh"; ẩn dụ điều kiện 2 trong brief cũng ghi rõ. |
| Cảnh 03: điều kiện 3 cần nhắc nạp thêm, rút bớt | Sửa | Đúng với hydra-node v2 (deposit, decommit; tập 3 cảnh 05, 08). Câu 03-4 nói tiền vẫn nạp thêm hay rút bớt được giữa chừng. |
| Cảnh 07 cũ (ba cửa hàng mở Head cả tháng) | Sửa (bỏ cảnh) | Hai lý do đều kiểm được: trùng ý với thanh toán vi mô, và ví dụ "mở đầu tháng, đóng cuối tháng" đi ngược tiêu chí "Session-Based: Temporary, bounded interactions" (`3.concepts/1.index.md:270`). Còn 3 tình huống phù hợp, khớp ba nhóm mà cardano.org và IOG nêu. Câu hỏi 1 cho chủ sản phẩm vẫn để ngỏ chuyện đưa lại. |
| Cảnh 10 (nay là 09): "Tiền không mất" tuyệt đối hoá | Sửa | Đúng: tiền chỉ được bảo vệ khi thành viên để mắt tới Head trong thời gian khiếu nại (tập 3 cảnh 12). Câu 09-2 và 09-3 nói "không ai chiếm được tiền… miễn là bạn để mắt tới Head trong thời gian khiếu nại". |
| Cảnh 13 (nay là 12): thiếu `new` trước `TxBuilder` | Sửa | Đúng, `TxBuilder` là class (`packages/hydra-transaction/src/tx-builder/index.ts`), tập 6 cảnh 08 viết `new TxBuilder(...)`. Bảng ghi `new TxBuilder({ isHydra: true })`. |
| Câu định vị "các giải pháp kết nối nhiều phòng họp đang được nghiên cứu" | Sửa một phần | Có nguồn chính thức: IOG ngày 03/02/2022 viết Interhead Hydra "defines a method for interconnecting two Heads together" và về lâu dài hướng tới "a network of interconnected Hydra Heads". Không tìm được nguồn hydra.family hay IOG mới hơn về trạng thái hiện nay, nên không dùng thì hiện tại "đang được nghiên cứu". Cảnh 08 dùng câu có mốc năm (08-4) và câu chỉ dựa trên điều đã có nguồn "nhiều nhóm thì mở nhiều Head, mỗi nhóm một phòng" (08-3, tập 2 cảnh 05); bảng ghi "chưa có trong hydra-sdk" (đã kiểm `packages/`). |
| Cảnh 01: nối từ tập 9 | Sửa | Brief tập 9 đã có (khối, đồng thuận, staking). Câu 01-0 nối từ tập 9, câu 04-2 nhắc lại "không phải chờ khối như ở tập chín". Gọi số tập theo quy ước của tập 9, không nói "tập trước". |
| Thuật ngữ "thời gian khiếu nại" | Không sửa | Brief đã dùng "thời gian khiếu nại" theo tập 3 và đã ghi đề xuất sửa câu 09-3 tập 2 (câu hỏi 6); review đồng ý, không có gì cần đổi thêm. |
