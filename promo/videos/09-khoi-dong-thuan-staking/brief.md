# Tập 9 — Khối, đồng thuận và staking: ai được ghi sổ Cardano?

## Brief

| Mục | Quyết định |
|---|---|
| Chuỗi | Kiến thức nền Cardano và Hydra, đồng thời giới thiệu hydra-sdk |
| Thể loại | Giải thích khoa học |
| Phong cách | Như tập 1: phấn trắng trên nền đen, hình hiện dần như đang được vẽ |
| Lời đọc | Tiếng Việt, giọng Hải Đăng (VieNeu), không có phụ đề chạy; chữ trên màn hình chỉ là chữ được "viết" lên bảng |
| Khung hình | 16:9, 1920×1080 |
| Âm thanh | Giọng đọc + nền và hiệu ứng tự tổng hợp; thêm tiếng tích tắc nhẹ cho dải ô thời gian, tiếng "cộp" trầm khi một khối được đóng vào sổ (giữ như tập 2) |
| Khán giả | Người chưa biết gì về blockchain, đã xem tập 1–8; đoạn ngắn cho lập trình viên ở cảnh 14 |
| Độ dài | Khoảng 5–6 phút |
| Cuối video | hydrasdk.com, kèm dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc, không đọc thành lời |

**Mạch tập:** cảnh 01 nối từ tập 8 (mỗi lần đúc token là một giao dịch phải ghi vào sổ chung) sang câu tập 2 đã bỏ ngỏ. Tập này lấp khoảng trống mà tập 2 cảnh 02 đã lướt qua ("giao dịch được gom vào một khối mới, rồi cả mạng cùng chấp nhận khối đó"; brief tập 2 ghi rõ đã gộp chuyện đồng thuận và độ chắc chắn làm một). Tập này mở cái hộp đó ra theo bốn câu hỏi: khối là gì; vì sao nhiều bản sổ cần một luật chung; ai được ghi trang tiếp theo; vì sao phải chờ thêm vài khối mới yên tâm. Nửa đầu (cảnh 02–08) chỉ nói cơ chế đồng thuận; nửa sau (cảnh 09–12) mở bằng câu hỏi "người giữ ADA tham gia thế nào" và trả lời bằng uỷ thác, phần thưởng, phần stake trong địa chỉ ; sau đó nối về Hydra: mọi bước của Head chạm vào lớp một đều phải chờ đúng cơ chế vừa kể.

**Ẩn dụ dùng lại của chuỗi:** "cuốn sổ chung" và nhiều máy cùng giữ một bản (tập 2); "món tiền chưa tiêu" mang ổ khoá (tập 1); địa chỉ là ổ khoá, khoá bí mật là chìa, chữ ký là bằng chứng có chìa (tập 4); "dấu vân tay" thay cho hash (tập 1, tập 4); "phòng họp riêng" cho Hydra Head (tập 2).

**Ẩn dụ mới của tập (không mâu thuẫn với chuỗi):** khối là "một trang sổ"; slot là "một ô trên dải thời gian"; chọn người ghi là "các stake pool rút thăm, lượng stake đứng sau pool là số lá thăm"; người giữ ADA "góp lá thăm vào hũ chung của một pool". Ví của người dùng không tự rút thăm, chỉ máy của stake pool rút thăm và ghi khối. Định nghĩa kỹ thuật đi ngay sau mỗi ẩn dụ.

**Hình xuyên suốt:** dải ô thời gian (slot) chạy ngang mép dưới bảng suốt video, mỗi ô một nhịp tích tắc; phần lớn ô để trống, thỉnh thoảng một ô có trang sổ (khối) rơi xuống nối vào chuỗi trang. Màu nhấn cố định:

- Khối và cuốn sổ chung: trắng phấn (giữ như tập 2).
- Món tiền chưa tiêu: vàng phấn (giữ như tập 1).
- Phần thanh toán của địa chỉ, khoá công khai: xanh phấn (giữ như tập 4).
- Mọi thứ thuộc về stake (lá thăm, stake pool, khoá staking, phần stake của địa chỉ, địa chỉ và số dư phần thưởng): cam phấn, màu mới của tập này.
- Hydra Head: xanh phấn của "phòng họp" như tập 2 (cảnh 13).

**Ví dụ xuyên suốt:** Chi (nhân vật của tập 1, tập 5) có ADA trong ví và uỷ thác cho một stake pool tên "Hồ Sen". Tên pool, số ADA và mọi con số về Chi là **ví dụ minh hoạ**, không phải pool hay ví thật. Không hiện mã pool thật trên bảng.

**Xưng hô và thuật ngữ:** xưng "ta" khi nói chung, gọi người xem là "bạn"; snapshot giữ tên chính (đọc "xờ náp sót") nếu cần nhắc. Nhắc tập khác thì nói rõ số tập ("ở tập hai", "ở tập tám"), không nói "tập trước".

## Nguồn tham khảo

Code hydra-sdk (đã mở đọc):

- `packages/core/src/constants/time.ts` — kiểu `SlotConfig` (`zeroTime`, `zeroSlot`, `slotLength` tính bằng mili giây, `startEpoch`, `epochLength`) và `SLOT_CONFIG_NETWORK`: `MAINNET` có `slotLength: 1000`, `epochLength: 432000`, `zeroSlot: 4492800`, `startEpoch: 208` (chú thích "Starting at Shelley era"); `PREPROD` cũng `432000`; `PREVIEW` có `epochLength: 86400` (một ngày).
- `packages/core/src/utils/time.ts` — `TimeUtils`: `slotToBeginUnixTime(slot, slotConfig)`, `unixTimeToEnclosingSlot(unixTime, slotConfig)`, `resolveSlotNo(network, ms)`, `resolveEpochNo(network, ms)`, `buildHydraSlotConfig(startTimestamp, options)` (mặc định `slotLength: 1000`, `epochLength: 432000`).
- `packages/core/src/index.ts` — xuất `TimeUtils`, `AddressUtils`, `Deserializer`, `KeysUtils`; `export * from './constants'` nên `SLOT_CONFIG_NETWORK`, `NETWORK_ID` lấy được từ `@hydra-sdk/core`.
- `packages/core/src/constants/chain.ts` — `Network` = `'MAINNET' | 'PREPROD' | 'PREVIEW'`.
- `packages/core/src/wallet.ts` — `AppWallet.getPaymentAddress()` trả về `baseAddressBech32`, `getEnterpriseAddress()` trả về `enterpriseAddressBech32`, `getRewardAddress()` trả về `rewardAddressBech32`.
- `packages/core/src/embedded.ts` — `WalletStaticMethods.getAddresses` dựng base address từ khoá thanh toán + khoá staking, enterprise address chỉ từ khoá thanh toán, reward address chỉ từ khoá staking; `EmbeddedWallet.signTx` chỉ ký bằng `paymentKey` (không ký bằng `stakeKey`); phần khoá DRep trong `getAccount` đang là `// TODO: fix it`.
- `packages/core/src/utils/cardano-wasm/build-keys.ts` — `buildBaseAddress(networkId, paymentKeyHash, stakeKeyHash)`, `buildRewardAddress(networkId, stakeKeyHash)`; nhánh `2 / keyIndex` ra `stakeKey`.
- `packages/core/src/utils/cardano-wasm/deserializer.ts` — `Deserializer.deserializeAddress(bech32)` trả về `DeserializerAddress` gồm `paymentCredentialHash`, `stakeCredentialHash` (với base address), `scriptHash`.
- `packages/core/src/utils/address.ts` — `AddressUtils.isValidAddress`, `AddressUtils.getPubkeyHashFromAddress` (chỉ lấy phần thanh toán, không có hàm lấy phần stake).
- `packages/hydra-transaction/src/tx-builder/index.ts` — `registerStake(rewardAddress)`, `deregisterStake(rewardAddress)`, `delegateStake(rewardAddress, poolKeyHash)`, `withdrawal(rewardAddress, amount)`; `_buildCertificate` đọc `poolKeyHash` bằng `Ed25519KeyHash.from_hex` (chuỗi hex); `PoolRegistration`/`PoolRetirement` ném lỗi "not supported yet". Kiểm thử: `packages/hydra-transaction/__tests__/unit/tx-builder/certificates-total-collateral.test.ts`.
- `packages/hydra-bridge/src/types/payload.type.ts` — `HydraNodeEnvironment` có `contestationPeriod` và `depositPeriod` (giây); `CommitRecorded` ("A deposit transaction was observed on chain. The deposit is not yet usable"), `DepositActivated` ("The deposit is now old enough to be included in a snapshot"), `DepositExpired`.

Tài liệu hydra-sdk (`apps/docs-v2/content/en`, đã mở đọc):

- `4.api/2.core.md` — mục `AppWallet.getRewardAddress` ("staking only", ví dụ `stake_test1…`), `getEnterpriseAddress` ("payment only, no staking"), các hàm `TimeUtils.*`.
- `4.api/4.transaction.md` — `registerStake`, `deregisterStake` ("reclaiming its key deposit"), `delegateStake` (ví dụ ghi `'pool1...'`, lệch với code đọc hex, xem "Không dùng").
- `5.resources/1.changelog.md` — `resolveSlotNo()` deprecated, thay bằng `unixTimeToEnclosingSlot()` với `SLOT_CONFIG_NETWORK`; chứng chỉ stake chỉ thật sự được ghi vào giao dịch từ transaction v1.2.0.
- `3.concepts/6.hydra-v2-changes.md` — bảng phiên bản hydra-node (SDK nhắm 1.3.0 dòng v1 và 2.3.0 dòng v2); 1.3.0 đổi thời gian khiếu nại mặc định từ 10 phút sang 12 giờ; "fixes for deposits/decommits across chain rollbacks".
- `3.concepts/1.index.md` — có câu "Finality 2-3 minutes" cho lớp 1 nhưng không có nguồn đo (xem "Không dùng").

Tập liên quan (đã đọc): `promo/videos/02-hydra-la-gi/brief.md` + `script.py` (cảnh 02 "Cuốn sổ chung", "khoảng hai mươi giây mới có một khối"), `promo/videos/03-vong-doi-hydra-head/brief.md` (nạp tiền chờ `DepositActivated`; đóng Head, khiếu nại, trả về là giao dịch lớp 1), `promo/videos/04-vi-khoa-dia-chi/brief.md` + `script.py` (câu 05: "ghép thêm vài thông tin nữa", base address có phần khoá staking, tập 4 cố ý không đi vào staking).

Nguồn ngoài (truy cập ngày 16/10/2026):

- Cardano Developer Portal, "Consensus & Ouroboros" — https://developers.cardano.org/docs/developers/curriculum/fundamentals/consensus-and-ouroboros/ ("Slots are 1 second each; epochs are 432,000 slots (exactly 5 days)"; xác suất ghi khối tỉ lệ với stake; mỗi pool tự chạy VRF, kết quả giữ kín cho tới khi công bố khối; một slot có thể không có hoặc có nhiều người được chọn; quy tắc chuỗi dài nhất; tham số k hiện là 2160).
- Cardano Docs, "Cardano node" — https://docs.cardano.org/about-cardano/learn/cardano-node ("A Cardano epoch currently includes 432,000 slots (5 days)", mỗi slot một giây, trung bình khoảng 20 giây có một lần được chọn; pool càng nhiều stake càng dễ được chọn).
- Cardano Docs, "Ouroboros overview" — https://docs.cardano.org/about-cardano/learn/ouroboros-overview (Praos chia chuỗi thành slot gom thành epoch; chọn stake pool theo lượng stake; chọn người ghi kín đáo để kẻ xấu không đoán trước).
- Cardano Docs, "Delegation" — https://docs.cardano.org/about-cardano/learn/delegation (uỷ thác mà vẫn giữ quyền tiêu: "you can spend your ada normally at any time"; cần đăng ký địa chỉ stake, có tiền đặt cọc cho việc đăng ký, không cho việc uỷ thác).
- cardano.org, Glossary "Stake snapshot" — https://cardano.org/glossary/stake-snapshot/ (uỷ thác mới mất khoảng hai epoch để thành stake đang hoạt động; phần thưởng đầu tiên đến vài epoch sau đó; phần thưởng được tính theo epoch).
- CPS-0017 "Settlement Speed" (Open, cập nhật 04/06/2026) — https://cips.cardano.org/cps/CPS-0017 ("settlement" và "finality" chưa được định nghĩa rõ trên Cardano; các bên dùng từ một xác nhận tới 2160 khối; xác suất bị đảo ngược giảm theo hàm mũ khi chuỗi dài thêm).
- CIP-19 "Cardano Addresses" — https://cips.cardano.org/cip/CIP-0019 (địa chỉ gồm phần thanh toán và phần uỷ thác; ai giữ phần uỷ thác thì giữ quyền stake của tiền ở địa chỉ đó; địa chỉ stake còn gọi là reward address; loại địa chỉ không có phần uỷ thác thì không uỷ thác được).
- Hydra docs, "Configuration" — https://hydra.family/head-protocol/docs/configuration (thời gian khiếu nại mặc định 12 giờ "aligned with Cardano's safe zone", để "L1 transactions have enough time to settle"; giao dịch `Close`/`Contest` có thể bị từ chối khi mạng tắc; deposit period là tham số giao thức, mỗi khoản nạp có hạn chót).
- Intersect, Hydra team update 06/08/2026 — https://updates.cardano.intersectmbo.org/2026-08-06-hydra (`--deposit-activation` tách khỏi `--deposit-period`, mặc định 3600 giây; ghi là chưa phát hành tại thời điểm bài viết).
- Cexplorer, "How distribution of rewards works on Cardano" — https://cexplorer.io/article/how-distribution-of-rewards-works-on-cardano (nguồn thứ cấp: phần thưởng ghi thành số dư (reward account), không phải UTxO; giao dịch thường không gửi tiền vào đó được; rút về thì số dư thành UTxO; rút cần chữ ký khoá stake). Khớp với code: `TxBuilder.withdrawal(rewardAddress, amount)` rút một con số từ địa chỉ phần thưởng, không tiêu món tiền nào.
- Tập 8 (đã đọc): `promo/videos/08-token-va-nft/brief.md` (đúc và đốt token là giao dịch trên sổ chung) để nối cảnh 01.
- cardano.org, "Chang upgrade completed" (30/01/2025) — https://cardano.org/news/2025-01-30-chang-upgrade-completed/ (sau hard fork Plomin, rút phần thưởng cần uỷ thác cho một DRep hoặc chọn phương án định sẵn; chỉ dùng cho mục "Đơn giản hoá" và câu hỏi chủ sản phẩm).

## Ranh giới sự thật

Được nói (đã đối chiếu):

- Khối là một nhóm giao dịch được ghi cùng lúc vào sổ chung; mỗi khối nối với khối trước bằng dấu vân tay của khối đó, nên sửa một khối cũ sẽ làm các khối sau không còn khớp (cơ chế chuỗi khối chung, khớp hình "dấu vân tay" của tập 1 và tập 4).
- Nhiều máy cùng giữ sổ nên cần một luật chung để mọi máy chọn cùng một trang tiếp theo; luật đó gọi là đồng thuận (consensus). Cardano dùng họ giao thức Ouroboros, bản đang chạy là Ouroboros Praos (developers.cardano.org; docs.cardano.org "Ouroboros overview").
- Thời gian được chia thành slot, mỗi slot một giây; 432.000 slot gom thành một epoch, tức năm ngày. Điều kiện: đây là tham số của **mạng chính** "hiện tại" (docs.cardano.org dùng chữ "currently"); mạng thử Preview có epoch một ngày (`SLOT_CONFIG_NETWORK.PREVIEW.epochLength = 86400`). Code hydra-sdk khớp: `MAINNET.slotLength = 1000` mili giây, `epochLength = 432000`.
- Phần lớn slot không có khối; trung bình khoảng hai mươi giây có một khối (docs.cardano.org "Cardano node"; tập 2 đã nói con số này).
- Người ghi khối là các stake pool (nút tạo khối do nhà vận hành chạy); ví của người dùng thường không tham gia rút thăm (developers.cardano.org: "each pool evaluates a VRF locally"; docs.cardano.org "Delegation": người giữ ADA tham gia bằng uỷ thác).
- Ở mỗi slot, mỗi stake pool tự "rút thăm" bằng một phép tính riêng (VRF); kết quả giữ kín cho tới khi pool công bố khối kèm bằng chứng. Pool nắm càng nhiều stake thì càng dễ trúng; về trung bình, giữ khoảng 1% stake thì ghi khoảng 1% số khối (developers.cardano.org). Kịch bản nói "tỉ lệ với lượng stake", không nói chắc chắn trúng.
- Một slot có thể không ai trúng, cũng có thể nhiều pool cùng trúng; khi đó chuỗi rẽ nhánh và các máy theo nhánh dài hơn, khối ở nhánh còn lại bị bỏ (developers.cardano.org "zero or multiple leaders per slot", "longest chain rule"). Giao dịch trong khối bị bỏ chỉ "có thể" được ghi lại sau nếu vẫn hợp lệ (đầu vào chưa bị tiêu, chưa hết hạn); kịch bản không hứa mọi giao dịch đều quay lại.
- Xác nhận trên Cardano là theo xác suất: mỗi khối mới chồng lên trên làm khả năng khối cũ bị đảo ngược giảm nhanh (CPS-0017: giảm theo hàm mũ). Không có một con số chung cho "đủ chắc": CPS-0017 ghi các bên dùng từ một xác nhận tới 2160 khối, tuỳ giá trị và mức rủi ro chấp nhận được. Kịch bản nói "tuỳ ví, tuỳ ứng dụng chọn mức chờ", không đưa số khối.
- Stake pool do một người vận hành chạy máy ghi khối; người giữ ADA uỷ thác stake cho pool để tăng cơ hội trúng của pool đó; giao thức chia phần thưởng cho người uỷ thác và cho nhà vận hành (docs.cardano.org "Delegation").
- Uỷ thác không chuyển ADA đi: các món tiền vẫn nằm ở địa chỉ của bạn, vẫn tiêu được bất cứ lúc nào; ngoại lệ duy nhất là khoản tiền đặt cọc đăng ký, được giữ lại cho tới khi huỷ đăng ký (docs.cardano.org "Delegation": "you can spend your ada normally at any time"). Việc uỷ thác là một chứng chỉ (certificate) ghi lên sổ chung qua một giao dịch.
- Muốn uỷ thác phải đăng ký địa chỉ stake một lần, có tiền đặt cọc cho việc đăng ký; huỷ đăng ký thì lấy lại tiền đặt cọc (docs.cardano.org "Delegation"; docs-v2 `deregisterStake` "reclaiming its key deposit"). Không nói số tiền đặt cọc.
- Phần thưởng không nằm thành món tiền chưa tiêu mà được cộng vào một số dư gắn với địa chỉ stake; muốn tiêu thì ví làm giao dịch rút về, số dư thành món tiền chưa tiêu bình thường (Cexplorer, nguồn thứ cấp; khớp `TxBuilder.withdrawal(rewardAddress, amount)`). Lời đọc gọi đây là "một ngoại lệ so với tập một" để không mâu thuẫn câu "Cardano không có ô số dư".
- Phần thưởng được tính theo từng epoch. Uỷ thác mới mất khoảng hai epoch để có hiệu lực, phần thưởng đầu tiên đến vài epoch sau đó (cardano.org Glossary "Stake snapshot"). Kịch bản nói "phải chờ vài epoch", không hứa ngày cụ thể, không nói mức lợi suất.
- Địa chỉ ví thông thường (base address) gồm hai phần: phần thanh toán (từ khoá thanh toán, là "ổ khoá" của tập 4) và phần stake (từ khoá staking); ai giữ phần stake thì giữ quyền uỷ thác số tiền ở địa chỉ đó (CIP-19; `WalletStaticMethods.getAddresses`). Địa chỉ không có phần stake (enterprise address) thì tiền ở đó không uỷ thác được (CIP-19; docs-v2 "payment only, no staking"). Có thêm một địa chỉ stake riêng (reward address, bắt đầu bằng `stake…`) là nơi ghi phần thưởng (CIP-19 "stake addresses (also known as reward addresses)"; `getRewardAddress`).
- Cả hai phần của địa chỉ sinh ra từ cùng cụm từ khôi phục (tập 4), theo hai nhánh khác nhau (`buildKeys`: nhánh `0` ra khoá thanh toán, nhánh `2` ra khoá staking).
- Mở Head, nạp tiền, đóng Head, khiếu nại và trả về (fanout) là giao dịch lớp 1 nên phải chờ khối như mọi giao dịch khác (tập 2, tập 3). Nút Hydra chỉ đưa khoản nạp vào snapshot khi nó đã được ghi trên lớp 1 và "đủ cũ" (`CommitRecorded` rồi `DepositActivated`).
- Thời gian khiếu nại mặc định của hydra-node được chọn khớp với "vùng an toàn" của Cardano, để giao dịch lớp 1 có đủ thời gian ổn định và thành viên kịp khiếu nại (hydra.family "Configuration"). Bên trong Head thì không chờ khối (tập 2).
- API trong cảnh 14 đúng tên hiện có ở `@hydra-sdk/core`.

Đơn giản hoá có chủ ý (không nói sai, nhưng lược bớt):

- "Rút thăm" thay cho VRF; không giải thích VRF, không đọc chữ "VRF" (chỉ có thể viết nhỏ trên bảng).
- "Mỗi ADA uỷ thác là một lá thăm": thực tế xác suất trúng phụ thuộc phần stake tương đối của pool và hệ số slot có khối (active slot coefficient); ẩn dụ chỉ giữ ý "nhiều stake hơn thì dễ trúng hơn".
- "Theo nhánh dài hơn": quy tắc chọn chuỗi của Praos còn có luật phá thế hoà (theo giá trị VRF) và giới hạn độ sâu k; kịch bản không nhắc.
- "Phần thưởng chia theo epoch": bỏ qua công thức (phí, quỹ dự trữ, biên lợi nhuận và chi phí cố định của pool, mức bão hoà pool).
- "Phần thưởng dồn vào số dư phần thưởng, muốn dùng thì rút về bằng một giao dịch": đúng về cơ chế (reward address, `withdrawal`); bỏ qua chi tiết phải rút toàn bộ số dư một lần (nguồn thứ cấp, chưa đối chiếu nguồn chính thức), và bỏ qua điều kiện mới từ hard fork Plomin (tháng 1/2025): muốn rút phần thưởng thì khoá staking phải uỷ thác quyền biểu quyết cho một DRep hoặc chọn phương án định sẵn. Ví phổ biến thường làm bước này giúp người dùng. Xem câu hỏi 2.
- "Nút Hydra chờ khoản nạp đủ cũ": lý do kỹ thuật có thể là để giảm rủi ro giao dịch nạp bị đảo ngược trên lớp 1, nhưng phiên này **chưa tìm được nguồn nói thẳng lý do đó**. docs-v2 (`3.concepts/6.hydra-v2-changes.md`, mục 1.3.0) có ghi "fixes for deposits/decommits across chain rollbacks", cho thấy khoản nạp chịu ảnh hưởng của rollback lớp 1, nhưng không nói đó là mục đích của bước chờ. Lời đọc chỉ nói điều đã đối chiếu: nút chờ giao dịch nạp được ghi và đủ cũ; câu "vì một khối mới ghi vẫn có thể bị đảo" chỉ được gắn với thời gian khiếu nại (có nguồn hydra.family).
- Không nhắc chuyện slot battle, pool bão hoà, pledge, nút relay.

Không dùng:

- Số khối cụ thể để "yên tâm" (10–20, 15 xác nhận của sàn, 2160 khối, 12 giờ, 36 giờ): có nguồn nhưng các nguồn tự nói là chưa thống nhất (CPS-0017), đưa vào lời đọc dễ thành lời khuyên. Nếu chủ sản phẩm muốn có mốc k = 2160, xem câu hỏi 3.
- Câu "Finality 2-3 minutes" và "20+ seconds" ở `apps/docs-v2/content/en/3.concepts/1.index.md`: không có nguồn đo.
- So sánh với proof of work của Bitcoin: phiên này chưa đối chiếu nguồn cho câu so sánh; không đưa vào.
- Ouroboros Peras, Genesis hay các bản nâng cấp đồng thuận khác: chưa kiểm chứng trạng thái triển khai tại thời điểm làm video.
- Mức lợi suất staking, số stake pool, tổng stake, số tiền đặt cọc đăng ký (review agy nêu "2 ADA" nhưng phiên này chưa đối chiếu tham số giao thức hiện tại), câu "khác với nhiều mạng khác, tiền uỷ thác không bị khoá": không có nguồn kèm mốc thời gian trong phiên này.
- `TxBuilder.delegateStake` / `registerStake` trên bảng cho người xem làm theo: (1) docs-v2 ghi ví dụ `'pool1...'` nhưng code đọc `poolKeyHash` bằng `Ed25519KeyHash.from_hex`, nên mã pool dạng bech32 sẽ lỗi; (2) chứng chỉ uỷ thác cần chữ ký bằng khoá staking, còn `AppWallet.signTx`/`EmbeddedWallet.signTx` chỉ ký bằng khoá thanh toán, nên luồng uỷ thác đầy đủ chưa đi được chỉ bằng `AppWallet`; (3) chưa có chứng chỉ uỷ thác DRep, phần khoá DRep trong `getAccount` còn `TODO`. Cảnh 14 chỉ nhắc một dòng nhãn "TxBuilder có registerStake, delegateStake — xem tài liệu", không chạy, không đọc tên hàm. Ghi lại cho đội SDK: lệch docs/code ở `delegateStake` và ở chữ ký `config?` (docs-v2 ghi `slotToBeginUnixTime(slot, config?)` là tuỳ chọn, code bắt buộc `slotConfig`).
- `TimeUtils.resolveSlotNo`: changelog ghi deprecated. Dùng `unixTimeToEnclosingSlot` với `SLOT_CONFIG_NETWORK`.
- `AddressUtils` cho phần stake: chỉ có `isValidAddress` và `getPubkeyHashFromAddress` (lấy phần thanh toán). Phần stake lấy qua `Deserializer.deserializeAddress(...).stakeCredentialHash`.
- Tiền nằm trong Hydra Head có còn được uỷ thác/sinh phần thưởng không: phụ thuộc địa chỉ script của Head trên lớp 1, phiên này chưa kiểm chứng. Không nói.
- Câu kiểu "uỷ thác hoàn toàn không rủi ro": chỉ nói điều có nguồn (tiền không rời ví, vẫn tiêu được).

## Dàn ý cảnh

Bản 2 (sau review agy): nửa đầu gom trọn cơ chế đồng thuận (cảnh 02–08), nửa sau mở bằng câu hỏi "người giữ ADA tham gia thế nào?" (cảnh 09–12), rồi nối Hydra và phần lập trình viên.

| Cảnh | Tiêu đề | Ý chính (1–3 câu, nói điều gì) | Hình gợi ý | Nối với tập khác |
|---|---|---|---|---|
| 01 | Mở đầu: trang sổ tiếp theo | Ở tập tám, mỗi lần đúc token là một giao dịch phải ghi vào sổ chung; ở tập hai, ta nói giao dịch được gom vào khối rồi cả mạng cùng chấp nhận. Nhưng hàng nghìn máy cùng giữ sổ, vậy ai được ghi trang tiếp theo, và vì sao người khác tin trang đó? | Một tờ giao dịch đúc token (phong bì của tập 8) đi vào hàng chờ trước cuốn sổ chung trắng phấn của tập 2, quanh sổ là các máy tính nhỏ; một trang trống lơ lửng phía trên, dấu hỏi lớn. Dải ô thời gian bắt đầu chạy ở mép dưới. | Tập 8 (đúc token), tập 2 cảnh 02 |
| 02 | Khối là một trang sổ | Khối là một trang gồm nhiều giao dịch được ghi cùng lúc. Mỗi trang mang dấu vân tay của trang trước, nên sửa một trang cũ thì mọi trang sau không còn khớp. | Các trang trắng nối thành chuỗi, mỗi trang có ô nhỏ "dấu vân tay trang trước". Một bàn tay phấn sửa trang giữa, các dấu vân tay phía sau lần lượt bật dấu chéo vẽ bằng nét. | Dấu vân tay ở tập 1, tập 4 |
| 03 | Vì sao cần đồng thuận | Ai cũng có thể đề xuất một trang, nhưng mọi máy phải chọn cùng một trang thì sổ mới là một. Luật chung để chọn trang gọi là đồng thuận (consensus); ở Cardano, luật đó tên là Ouroboros. | Ba máy mỗi máy đưa ra một trang khác nhau, sổ bị tách làm ba; rồi một quyển luật nhỏ hiện ra, ba máy cùng chọn một trang. Chữ "Đồng thuận · Ouroboros", phác con rắn cắn đuôi nhỏ. | |
| 04 | Đồng hồ của sổ: slot và epoch | Thời gian được chia thành ô, gọi là slot, mỗi ô một giây; bốn trăm ba mươi hai nghìn ô gom thành một epoch, tức năm ngày trên mạng chính. Không phải ô nào cũng có khối, trung bình khoảng hai mươi giây mới có một. | Dải ô thời gian phóng to; "1 slot = 1 giây", gom thành cụm lớn "1 epoch = 432.000 slot = 5 ngày". Phần lớn ô trống, thỉnh thoảng một ô rơi ra trang sổ. Chữ nhỏ "mạng chính Cardano". | Tập 2: "khoảng hai mươi giây một khối" |
| 05 | Ai được ghi: stake pool rút thăm | Người ghi trang là các stake pool, tức những máy chuyên ghi sổ chạy suốt ngày đêm; ví của người dùng thường không tự rút thăm. Ở mỗi slot, mỗi pool rút thăm một lần; lượng ADA đứng sau pool gọi là stake, stake càng nhiều thì càng dễ trúng, nhưng không pool nào chắc chắn trúng. | Vài máy pool cam phấn đứng thành hàng, mỗi máy có cột lá thăm cao thấp khác nhau. Một máy trúng, viết trang sổ. Bên cạnh, một chiếc điện thoại có ví đứng ngoài, gạch nối mờ "không tự rút thăm". Chữ "xác suất ~ lượng stake". | |
| 06 | Rút thăm kín (Ouroboros Praos) | Bản Ouroboros đang chạy là Praos. Mỗi pool tự rút thăm và giữ kín, chỉ khi công bố khối mới đưa bằng chứng đã trúng, nên kẻ xấu không biết trước pool nào sẽ ghi để nhắm vào. | Mỗi máy pool rút thăm sau tấm bình phong riêng; máy trúng bước ra, giơ trang sổ kèm "bằng chứng trúng". Một kẻ đeo mặt nạ đứng ngoài, không biết nhắm vào đâu. | |
| 07 | Khi hai pool cùng trúng | Có slot không pool nào trúng, có slot hai pool cùng trúng, chuỗi tạm rẽ hai nhánh. Các máy đi theo nhánh dài hơn, trang ở nhánh còn lại bị bỏ; giao dịch trong trang đó nếu vẫn hợp lệ thì có thể được ghi lại ở một khối sau. | Chuỗi trang rẽ hai nhánh; nhánh trên được nối thêm trang, nhánh dưới mờ dần; các tờ giao dịch trong trang bị bỏ bay về hàng chờ, một tờ đã có ở nhánh trên thì mờ đi. | |
| 08 | Vì sao phải chờ thêm vài khối | Vì có lúc rẽ nhánh, một trang vừa ghi vẫn có thể bị thay. Mỗi trang mới chồng lên làm khả năng đó nhỏ đi nhanh; không có một con số chung, mỗi ví và ứng dụng tự chọn mức chờ theo giá trị giao dịch. | Một trang có tờ giao dịch của Chi; các trang mới chồng dần lên trên, bên cạnh là thanh "khả năng bị đảo" thấp dần (không ghi số). Chữ "xác nhận theo xác suất". | Tập 2 brief: đã gộp đồng thuận và độ chắc chắn |
| 09 | Người giữ ADA tham gia thế nào | Vậy những người chỉ có ADA trong ví thì góp phần ở đâu? Họ uỷ thác stake cho một pool, như góp lá thăm vào một hũ chung; người vận hành pool chạy máy, và khi pool ghi được khối, phần thưởng được chia cho cả nhóm như tiền công giữ sổ. | Chi (nhân vật tập 1, tập 5) cầm vài lá thăm cam, bỏ vào hũ chung của máy pool "Hồ Sen" (ví dụ minh hoạ); người vận hành ngồi cạnh máy sáng đèn. | Chi ở tập 1, tập 5 |
| 10 | Uỷ thác: tiền không rời ví | Ví của Chi không chuyển tiền đi đâu cả, chỉ ghi lên sổ một tờ chứng chỉ uỷ thác; các món tiền vẫn nằm ở địa chỉ của Chi, vẫn tiêu được bất cứ lúc nào. Chỉ có một khoản tiền đặt cọc nhỏ khi đăng ký lần đầu là được giữ lại, và trả về khi huỷ đăng ký. | Các ô món tiền vàng của Chi đứng yên với ổ khoá xanh; một tờ cam nhỏ "chứng chỉ uỷ thác → Hồ Sen" được dán vào sổ. Chi tiêu một món ngay sau đó, tờ cam vẫn còn. Một đồng nhỏ "tiền đặt cọc" khoá riêng ở góc, mũi tên "trả về khi huỷ". | Món tiền và ổ khoá, tập 1 và 4 |
| 11 | Phần thưởng chia theo epoch | Phần thưởng tính theo từng epoch; uỷ thác mới phải chờ vài epoch mới có lần thưởng đầu. Phần thưởng là một ngoại lệ so với tập một, nó không nằm thành món tiền chưa tiêu mà được cộng vào một số dư gắn với địa chỉ stake; muốn tiêu thì ví làm một giao dịch rút về, số dư đó trở thành một món tiền chưa tiêu bình thường. | Dải ô thời gian thu lại thành các khối epoch dài; mũi tên "vài epoch sau: lần thưởng đầu"; từ đó mỗi epoch một đồng cam nhỏ rơi vào hộp "số dư phần thưởng" (có dấu "ngoại lệ"). Một giao dịch rút về biến cả hộp thành một ô món tiền vàng. Chữ nhỏ trên bảng: "Rút phần thưởng: ví có thể hỏi thêm bước chọn đại diện biểu quyết". | Tập 1: không có ô số dư |
| 12 | Địa chỉ có hai phần | Ở tập bốn, ta nói địa chỉ được "ghép thêm vài thông tin". Phần ghép thêm chính là phần stake: một bên là ổ khoá thanh toán, một bên cho biết ai giữ quyền uỷ thác. Địa chỉ không có phần stake thì tiền ở đó không uỷ thác được. | Chuỗi "addr1…" tách làm hai: nửa xanh "thanh toán · ổ khoá", nửa cam "stake · quyền uỷ thác". Cạnh đó địa chỉ "stake1…" cam gắn với hộp số dư phần thưởng. Cụm từ khôi phục đỏ ở trên, hai nhánh khoá đi xuống hai nửa. | Tập 4 câu 05 "ghép thêm vài thông tin" |
| 13 | Nối sang Hydra: chờ ở lớp một | Mở Head, nạp tiền, đóng Head, khiếu nại và trả về đều là giao dịch trên lớp một, nên chờ khối và chờ chắc chắn theo đúng cách vừa kể. Nút Hydra chỉ tính khoản nạp khi nó đã được ghi và đủ cũ; thời gian khiếu nại mặc định được chọn đủ dài để giao dịch lớp một kịp ổn định. Còn bên trong Head thì không phải chờ khối. | Phòng họp xanh của tập 2 phía trên đường kẻ; dưới là chuỗi trang trắng. Mũi tên nạp tiền đi xuống, đứng chờ vài trang chồng lên rồi mới đi lên phòng. Mũi tên đóng Head kèm đồng hồ cát, rồi mũi tên trả về. Bên trong phòng, giao dịch chạy liền không có dải ô. | Tập 2 cảnh 06, 09; tập 3 sáu chặng |
| 14 | Cho lập trình viên: slot, epoch và phần stake | Trong gói core của hydra-sdk, TimeUtils đổi qua lại giữa thời gian và slot theo cấu hình của từng mạng, và tính số epoch. Ví lấy được địa chỉ phần thưởng, còn một hàm tách địa chỉ đọc ra phần stake nằm trong địa chỉ thanh toán. | Code phấn (xem bên dưới); "SLOT_CONFIG_NETWORK.MAINNET" nối mũi tên tới dải ô "1 giây/slot, 432.000 slot/epoch"; chữ nhỏ "PREVIEW: epoch 1 ngày". Góc: nhãn "Code rút gọn, bản đầy đủ ở hydrasdk.com". | Tập 4 cảnh 12 (`AppWallet`) |
| 15 | Tóm tắt và lời kết | Ba ý: khối là trang sổ, Ouroboros Praos để stake pool rút thăm theo stake; xác nhận theo xác suất nên chờ thêm vài khối; uỷ thác không chuyển tiền đi, phần thưởng tính theo epoch. Xem thêm tại hydrasdk.com. | Ba ý viết lần lượt; dải ô thời gian chạy chậm dần rồi dừng. Cuối: "hydrasdk.com" ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc, không đọc thành lời. | |

Code dự kiến trên bảng ở cảnh 14 (mọi tên đã đối chiếu `packages/core/src`):

```ts
import { TimeUtils, SLOT_CONFIG_NETWORK, Deserializer } from '@hydra-sdk/core'
// wallet: AppWallet đã tạo ở tập 4

const cfg = SLOT_CONFIG_NETWORK.MAINNET          // 1 giây/slot, 432.000 slot/epoch
const slot = TimeUtils.unixTimeToEnclosingSlot(Date.now(), cfg)
const ms = TimeUtils.slotToBeginUnixTime(slot, cfg)
const epoch = TimeUtils.resolveEpochNo('MAINNET')

const addr = wallet.getPaymentAddress()          // addr1…  (địa chỉ thanh toán)
Deserializer.deserializeAddress(addr).stakeCredentialHash   // phần stake bên trong
wallet.getRewardAddress()                        // stake1…  (địa chỉ phần thưởng)
```

Ghi chú cho cảnh 14: `wallet` là `AppWallet` đã tạo ở tập 4 cảnh 12, `addr` khai báo ngay trên bảng để code tự đủ ngữ cảnh (tránh lỗi tập 6). Luôn truyền `SlotConfig` vào hai hàm chuyển đổi (code bắt buộc). `resolveEpochNo` tính từ cấu hình cố định kể từ đầu kỷ Shelley, đúng khi độ dài epoch không đổi. Lời đọc không đọc chữ `Deserializer`, chỉ nói "hàm tách địa chỉ".

## Thuật ngữ mới cần chốt cách đọc

Chưa ghi vào `promo/shared/tu-dien-doc.md` (phiên này không sửa file chung). Phương án mặc định đề xuất in đậm.

| Từ | (1) Đọc nguyên văn | (2) Phiên âm đề xuất | (3) Thay bằng từ Việt | Ghi chú |
|---|---|---|---|---|
| block | block | bờ lốc | **khối** | Tập 2 đã dùng "khối"; giữ (3) |
| consensus | consensus | — | **đồng thuận** | Lần đầu đọc "đồng thuận", bảng ghi "Consensus" nhỏ |
| slot | slot | **xờ lót** | ô thời gian | Đề xuất (2) làm tên chính, ẩn dụ "ô" dùng ở phần dẫn |
| epoch | epoch | **ê pốc** | kỳ | "kỳ" dễ lẫn nghĩa thường; đề xuất (2) |
| Ouroboros | Ouroboros | **Ô rô bo rốt** | — | Tên riêng |
| Praos | Praos | **Pra ốt** | — | Tên riêng, dùng trong cụm "Ouroboros Praos" |
| Ouroboros Praos | — | Ô rô bo rốt Pra ốt | — | Cụm dài, lexicon thay trước |
| stake | stake | **xờ tếch** | lượng ADA uỷ thác | Dùng làm tên chính sau lần định nghĩa đầu |
| stake pool | stake pool | **xờ tếch pun** | nhóm góp stake | Lexicon phải thay cụm này trước "stake" |
| pool (đứng riêng) | pool | **pun** | — | `script.py` dùng "pool" đứng riêng nhiều lần (cảnh 05–10); cần dòng riêng sau "stake pool" |
| staking | staking | xờ tếch kinh | — | Chỉ có trong tên tập và trên bảng; lời đọc `script.py` dùng "stake", không dùng "staking" |
| delegation | delegation | — | **uỷ thác** | Docs Cardano dùng "delegation"; lời đọc chỉ dùng "uỷ thác" |
| certificate | certificate | — | **chứng chỉ** | "chứng chỉ uỷ thác" |
| reward address | — | — | **địa chỉ phần thưởng** | Bảng ghi `stake1…`; số dư trên đó gọi là "số dư phần thưởng" |
| VRF | VRF | vê e rờ ép | rút thăm kín | Đề xuất không đọc, chỉ viết nhỏ trên bảng |
| DRep | DRep | đi rép | đại diện biểu quyết | Chỉ cần nếu chủ sản phẩm chọn nhắc (câu hỏi 2) |
| TimeUtils | TimeUtils | **tham iu tiu** | — | Cùng mẫu "iu tiu" với `DatumUtils` |
| Deserializer | Deserializer | đi xi ri a lai giơ | **hàm tách địa chỉ** | Không đọc tên lớp (theo review agy); chỉ ghi trên bảng |
| SLOT_CONFIG_NETWORK | — | — | cấu hình slot của từng mạng | Chỉ viết trên bảng, không đọc tên hằng |
| Preview | Preview | pri viu | mạng thử | Chỉ viết nhỏ trên bảng |

Dạng viết hoa đầu câu ("Slot", "Epoch", "Stake") được `lexicon.py` tự khớp theo ghi chú của `tu-dien-doc.md`, không cần thêm dòng riêng.

## Câu hỏi cho chủ sản phẩm

1. **Tên tập.** Mặc định (bản 2, theo review agy): "Khối, đồng thuận và staking: ai được ghi sổ Cardano?". Phương án ngắn: "Ai được ghi sổ Cardano?".
2. **Có nhắc điều kiện rút phần thưởng sau hard fork Plomin (cần uỷ thác quyền biểu quyết cho một DRep) không?** Mặc định đề xuất: không đọc thành lời ở tập này để tránh mở sang chủ đề quản trị; cảnh 11 viết nhỏ trên bảng (bảng cảnh 11) "Rút phần thưởng: ví sẽ hướng dẫn thêm bước chọn đại diện biểu quyết". Nếu chuỗi có tập về quản trị, để dành cho tập đó.
3. **Có nêu mốc k = 2160 khối (khoảng 12 giờ) không?** Có nguồn (developers.cardano.org, CPS-0017) nhưng CPS-0017 nói các bên chưa thống nhất định nghĩa "settlement". Mặc định đề xuất: không nêu số, chỉ nói định tính ở cảnh 09; cảnh 13 nhắc "thời gian khiếu nại mặc định được chọn khớp với vùng an toàn của Cardano" mà không nói mười hai giờ, cho thống nhất với tập 3 (tập 3 cố ý không nói độ dài).
4. **Đoạn lập trình viên có nhắc `TxBuilder.delegateStake` không?** Mặc định đề xuất: chỉ một dòng nhãn nhỏ, không đọc, không chạy, vì luồng uỷ thác đầy đủ chưa ký được bằng `AppWallet` và docs/code đang lệch về dạng mã pool. Nếu chủ sản phẩm muốn giới thiệu uỷ thác bằng SDK, cần đội SDK sửa hai điểm trên trước.
5. **Ẩn dụ "rút thăm theo lá thăm" có hợp định vị chuỗi không** (có thể gợi liên tưởng xổ số/cờ bạc)? Mặc định đề xuất: giữ "rút thăm" và tránh hẳn chữ "xổ số", "trúng thưởng"; phần thưởng ở cảnh 09 và 11 mô tả là "trả công cho việc ghi sổ", không phải tiền trúng.

## Xử lý review agy

Nguồn: `promo/videos/09-khoi-dong-thuan-staking/review-agy-brief.md`.

| Mục | Quyết định (sửa / không sửa) | Lý do |
|---|---|---|
| Cảnh 14: biến `addr` chưa khai báo (cao) | Sửa | Đúng; thêm `const addr = wallet.getPaymentAddress()` và chú thích `wallet` lấy từ tập 4. Đã đối chiếu `wallet.ts` (`getPaymentAddress` trả `baseAddressBech32`) và `deserializer.ts` (base address có `stakeCredentialHash`). |
| Cảnh 05–06: người giữ ví tưởng mình tự rút thăm (cao) | Sửa | Đúng; developers.cardano.org ghi mỗi pool tự chạy VRF. Cảnh 05 nói rõ người ghi là stake pool, ví người dùng không tự rút thăm; thêm dòng vào "Được nói". |
| Đảo trật tự cảnh 07 so với 08–09 (vừa) | Sửa | Hợp lý; nửa đầu 02–08 là đồng thuận, nửa sau 09–12 mở bằng "người giữ ADA tham gia thế nào". Không thêm ý mới. |
| Cảnh 11–12: "tài khoản phần thưởng" mâu thuẫn tập 1 (vừa) | Sửa | Đúng; đã kiểm chứng (Cexplorer, nguồn thứ cấp; khớp `TxBuilder.withdrawal`). Lời đọc gọi là "ngoại lệ so với tập một"; đổi thuật ngữ thành "địa chỉ phần thưởng" và "số dư phần thưởng". Bỏ ẩn dụ "ống heo" để khỏi thêm ẩn dụ mới. |
| Cảnh 10: "vẫn tiêu được bất cứ lúc nào" bỏ sót tiền đặt cọc (vừa) | Sửa một phần | Đúng về tiền đặt cọc (docs.cardano.org "Delegation", docs-v2 `deregisterStake`). Không dùng số "2 ADA" và câu "khác với nhiều mạng khác" vì phiên này chưa có nguồn. |
| Cảnh 07 (cũ 08): "giao dịch quay lại hàng chờ" (thấp) | Sửa | Đúng; đổi thành "nếu vẫn hợp lệ thì có thể được ghi lại ở một khối sau". |
| Cảnh 13: thiếu chặng trả về (thấp) | Sửa | Đúng theo tập 3 (`Fanout` là giao dịch lớp 1). |
| Lý do nút chờ khoản nạp đủ cũ (thấp) | Không sửa (chỉ ghi chú) | Dòng docs-v2 "fixes for deposits/decommits across chain rollbacks" cho thấy khoản nạp chịu ảnh hưởng rollback, nhưng không nói bước chờ sinh ra để tránh rollback. Agy suy ra mục đích; giữ ở "Đơn giản hoá", ghi thêm dẫn chứng gián tiếp. |
| Không đọc `Deserializer` (thấp) | Sửa | Lời đọc nói "hàm tách địa chỉ", tên lớp chỉ trên bảng. |
| Tên tập (thấp) | Sửa (phương án mặc định) | Dùng "Khối, đồng thuận và staking: ai được ghi sổ Cardano?" làm mặc định; câu hỏi 1 vẫn để chủ sản phẩm chốt. |

