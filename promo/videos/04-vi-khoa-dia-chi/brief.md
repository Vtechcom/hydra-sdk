# Tập 4 — Ví thật ra giữ gì? Khoá, địa chỉ và cụm từ khôi phục

## Brief

| Mục | Quyết định |
|---|---|
| Chuỗi | Kiến thức nền Cardano và Hydra, đồng thời giới thiệu hydra-sdk |
| Thể loại | Giải thích khoa học |
| Phong cách | Giữ nguyên tập 1: nét phấn trắng trên nền đen, hình hiện dần như đang được vẽ |
| Lời đọc | Tiếng Việt, giọng Hải Đăng (VieNeu), không có phụ đề chạy; chữ trên màn hình chỉ là chữ được "viết" lên bảng |
| Khung hình | 16:9, 1920×1080 |
| Âm thanh | Giọng đọc + nền và hiệu ứng tự tổng hợp |
| Khán giả | Người chưa biết gì về blockchain; đoạn ngắn cho lập trình viên ở cảnh 12 |
| Độ dài | Khoảng 4–5 phút |
| Cuối video | hydrasdk.com, kèm dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc, không đọc thành lời |

**Mạch tập:** nối thẳng câu chốt của tập 1, "ví giữ chìa, không giữ tiền". Tập này trả lời chìa khoá đó là gì và sinh ra từ đâu, theo chuỗi một chiều: cụm từ khôi phục → khoá bí mật → khoá công khai → địa chỉ. Nửa sau dành cho an toàn: mất cụm từ là mất chìa, và không bao giờ đưa cụm từ cho ai.

**Ẩn dụ dùng chung cả chuỗi:** địa chỉ là ổ khoá trên món tiền chưa tiêu, khoá bí mật là chìa khoá, chữ ký là bằng chứng bạn có chìa, tạo ra mà không phải đưa chìa cho ai xem.

**Màu nhấn cố định:** món tiền chưa tiêu giữ màu vàng phấn như tập 1; cụm từ khôi phục màu đỏ phấn (thứ phải giấu), khoá công khai và địa chỉ màu xanh phấn (thứ được đưa người khác).

**Cách gọi trong lời đọc:** "cụm từ khôi phục" (seed phrase, mnemonic chỉ hiện trên bảng), "khoá bí mật" (private key), "khoá công khai" (public key), "địa chỉ" (address). Không đọc "hash", dùng lại hình ảnh "dấu vân tay" của tập 1.

## Nguồn tham khảo

- `packages/core/src/embedded.ts`:
  - `generateMnemonic(strength = 256)` gọi `generateMnemonic` của thư viện `bip39`.
  - `mnemonicToPrivateKeyHex` đổi cụm từ thành entropy rồi gọi `Bip32PrivateKey.from_bip39_entropy` để ra khoá gốc.
  - `getAddresses` dựng base address từ hash khoá công khai thanh toán và hash khoá công khai staking, enterprise address chỉ từ khoá thanh toán, reward address từ khoá staking.
  - `signTx` dùng `paymentKey.to_raw_key()` ký vào mã giao dịch, tạo `Vkeywitness` (khoá công khai kèm chữ ký).
- `packages/core/src/utils/cardano-wasm/build-keys.ts`, `buildKeys`: từ khoá gốc đi theo đường `1852' / 1815' / account' / 0 / keyIndex` ra khoá thanh toán, nhánh `2 / keyIndex` ra khoá staking (enum `Purpose.CIP1852`, `CoinTypes.CARDANO = 1815`).
- `packages/core/src/wallet.ts`: `AppWallet` bọc `EmbeddedWallet`, nhận khoá dạng `mnemonic`, `root` hoặc `cli`; `AppWallet.brew()` gọi `EmbeddedWallet.generateMnemonic`; có `getPaymentAddress`, `signTx`, `submitTx`, `queryUTxOs` (hai hàm sau cần `submitter`, `fetcher`).
- `apps/docs-v2/content/en/4.api/2.core.md`: `brew(strength)` với 128 = 12 từ, 160 = 15 từ, 256 = 24 từ, mặc định 24 từ; `AppWallet.signData()` chưa được cài đặt, chỉ `EmbeddedWallet.signData()` ký dữ liệu.
- `apps/docs-v2/content/en/2.guides/2.build-wallet-app.md`: khôi phục ví bằng cách tạo lại `AppWallet` từ cùng cụm từ (`restoreWallet` gọi lại `createWallet`).
- `apps/docs-v2/content/en/2.guides/5.hydra-integration.md`: cùng một `AppWallet` ký giao dịch bên trong Hydra Head (`this.wallet.signTx(...)`).
- `sdk-ai-agent/sdk-api-metadata.json`: có `AppWallet`, `AppWallet.brew`, `EmbeddedWallet`, `EmbeddedWallet.generateMnemonic`.

## Ranh giới sự thật

Được nói (đã đối chiếu):

- Cụm từ khôi phục sinh ra khoá gốc; từ khoá gốc sinh ra các khoá bí mật theo một con đường cố định; khoá bí mật cho ra khoá công khai; địa chỉ dựng từ dấu vân tay (hash) của khoá công khai. Toàn bộ chuỗi đi một chiều.
- Cùng một cụm từ luôn cho ra đúng những khoá và địa chỉ ấy, nên nhập lại cụm từ là khôi phục được ví (code tất định; tài liệu dùng đúng cách này để khôi phục).
- Một cụm từ sinh ra được nhiều khoá và nhiều địa chỉ (tham số `accountIndex`, `keyIndex`).
- hydra-sdk mặc định tạo cụm từ hai mươi bốn từ; cũng tạo được mười hai hoặc mười lăm từ.
- Danh sách từ tiếng Anh: thư viện `bip39` dùng danh sách tiếng Anh khi không chỉ định danh sách khác, và `generateMnemonic` trong code không truyền danh sách nào.
- Chữ ký: ví dùng khoá bí mật ký vào giao dịch, kèm khoá công khai; mạng kiểm tra chữ ký bằng khoá công khai và đối chiếu dấu vân tay của khoá đó với địa chỉ. Khoá bí mật không đi kèm giao dịch.
- Địa chỉ ví thông thường có thêm phần dấu vân tay của khoá staking (base address); chỉ nói "ghép thêm vài thông tin", không đi vào staking.
- `AppWallet`, `AppWallet.brew()`, `EmbeddedWallet` và các kiểu khoá đầu vào đúng như code.
- Cùng một ví ký được giao dịch trên Cardano và trong Hydra Head.

Lời khuyên an toàn (đúng, không phóng đại):

- Ai có cụm từ khôi phục là khôi phục được ví ở thiết bị khác và tiêu được mọi món tiền của ví đó.
- Giao dịch đã được mạng ghi nhận thì không có ngân hàng hay tổng đài nào đảo ngược được.
- Ví và bộ phận hỗ trợ chân chính không cần cụm từ của bạn để giúp bạn; ai hỏi thì hãy coi là lừa đảo. Kịch bản nói "hãy coi là lừa đảo", không khẳng định tuyệt đối về mọi trường hợp.
- Không ai cấp lại được cụm từ đã mất; ví tự giữ khoá không có chức năng "quên mật khẩu".
- Cất giữ: viết ra giấy, cất nơi an toàn; không chụp ảnh, không lưu lên mạng, không gửi qua tin nhắn. Đây là lời khuyên phổ biến; không nhắc ví cứng, tấm kim loại hay chia nhiều bản để tránh dài.

Đơn giản hoá có chủ ý:

- "Ví tạo một số ngẫu nhiên rồi viết nó thành các từ": bỏ qua phần kiểm tra (checksum) ở từ cuối và mật khẩu tuỳ chọn (code để mặc định rỗng).
- "Khoá công khai tính ra từ khoá bí mật, không đi ngược được": nói theo nghĩa thực tế (không thể tính ngược trong thời gian hợp lý), ẩn dụ pha sơn.
- "Ổ khoá trên món tiền chính là địa chỉ": đúng với món tiền khoá bằng chữ ký; ổ khoá hợp đồng thông minh đã nói ở tập 1, tập này không nhắc lại.
- Không nói tên chuẩn (BIP39, CIP-1852) thành lời; chỉ hiện nhỏ trên bảng ở cảnh lập trình viên, có nguồn ở trên.

Không nói ở tập này: ví cứng, ví nhiều chữ ký, staking và ví phần thưởng, mật khẩu ứng dụng ví (mã khoá màn hình khác với cụm từ khôi phục), số lượng tổ hợp cụm từ có thể có.

## Thuật ngữ mới cần chốt cách đọc

Các từ dưới đây đã được phiên chính thêm vào `promo/shared/tu-dien-doc.md` với trạng thái `đề xuất`, chờ nghe thử ở Vòng 2. Số âm tiết trong kịch bản đã đếm theo cách đọc này.

| Từ | Cách đọc đang dùng | Ghi chú |
|---|---|---|
| AppWallet | áp oa lét | Tên lớp, cảnh 12 |
| EmbeddedWallet | em bét đít oa lét | Tên lớp, cảnh 12 |
| core | co | Cảnh 12, "gói core của hydra-sdk"; phương án khác là "gói lõi" |

Các từ chỉ hiện trên bảng, không đọc: seed phrase, mnemonic, private key, public key, address, BIP39, CIP-1852, `brew()`, `NETWORK_ID.PREPROD`, `addr1…`.

## Quyết định đã chốt

1. Cả chuỗi thống nhất cách nói: khoá bí mật là chìa, chữ ký là bằng chứng có chìa, chìa không rời ví. Tập 1 đang được sửa theo hướng này ở phiên chính.
2. Giữ giọng cảnh báo dứt khoát ở cảnh 10: ai hỏi cụm từ khôi phục thì hãy coi là lừa đảo.
3. Màu nhấn: đỏ phấn cho cụm từ khôi phục, xanh phấn cho khoá công khai và địa chỉ, vàng phấn cho món tiền chưa tiêu như tập 1.
4. Cụm từ hiện trên bảng là từ minh hoạ dựng lại, làm mờ một nửa; không bao giờ hiện cụm từ của ví thật.
5. Lời đọc xưng "ta" khi nói chung, gọi người xem là "bạn".
6. Liên kết tập: điều được nhắc lại từ tập 1 thì nói rõ "tập một" hoặc "các tập trước", không nói "tập trước" vì tập liền trước là tập 3.

## Lịch sử sửa

- Vòng 1, bản 2 (theo review của agy, chủ sản phẩm duyệt): sửa câu 01-0 và 05-1 về liên kết tập; đoạn code cảnh 12 ghi rõ `networkId: NETWORK_ID.PREPROD` cho khớp tập 6; mô tả hình cảnh 07 không còn nhắc "tập trước".
