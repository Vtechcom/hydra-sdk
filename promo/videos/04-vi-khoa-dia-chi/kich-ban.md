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

## Kịch bản

Không có phụ đề chạy; cột "Chữ trên bảng" là chữ được viết lên bảng trong cảnh. Số âm tiết đếm sau khi phiên âm theo từ điển đọc.

| Cảnh | Chữ trên bảng | Lời đọc | Số âm tiết | Trên màn hình | Âm thanh |
|---|---|---|---|---|---|
| **01. Mở đầu**<br>~17 giây | `Ví giữ chìa, không giữ tiền`<br>`Chìa khoá là gì?` | 01-0: Ở tập một, ta đã biết một câu, ví của bạn không chứa tiền mà chỉ giữ chìa khoá.<br>01-1: Vậy chiếc chìa khoá đó trông như thế nào, và nó từ đâu mà có?<br>01-2: Hiểu được điều này, bạn sẽ biết thứ gì trong ví phải giữ thật kỹ, và thứ gì đưa cho người khác cũng không sao. | 19<br>15<br>25 | Chiếc ví phấn của tập 1 mở ra, bên trong chỉ có một chùm chìa. Câu "Ví giữ chìa, không giữ tiền" viết lại ở trên. Một dấu hỏi lớn hiện cạnh chùm chìa. | Nền vào dần. Tiếng phấn khi viết. Tiếng chùm chìa leng keng nhẹ. |
| **02. Đánh rơi điện thoại**<br>~17 giây | `Mất điện thoại`<br>`Mất tiền?` | 02-0: Thử tưởng tượng bạn đánh rơi chiếc điện thoại có cài ví. Tiền của bạn có mất theo không?<br>02-1: Câu trả lời là không. Các món tiền chưa tiêu vẫn nằm yên trên blockchain, chẳng hề nằm trong điện thoại.<br>02-2: Câu hỏi thật sự là bạn có còn cách nào lấy lại chiếc chìa khoá hay không. | 19<br>23<br>17 | Chiếc điện thoại phấn rơi xuống, vỡ một góc. Phía trên, dải blockchain với các ô món tiền màu vàng phấn vẫn đứng yên, mỗi ô một ổ khoá. Dấu hỏi chuyển sang chiếc chìa. | Tiếng rơi trầm, ngắn. Một nhịp lặng rồi nền vào lại. |
| **03. Khoá bí mật**<br>~18 giây | `Khoá bí mật`<br>`(private key)`<br>`Một con số rất lớn, ngẫu nhiên` | 03-0: Chiếc chìa khoá ấy có tên là khoá bí mật. Nó là một con số cực lớn, được chọn một cách ngẫu nhiên.<br>03-1: Lớn đến mức không ai có thể đoán trúng, kể cả khi cho thật nhiều máy tính đoán liên tục.<br>03-2: Ai biết con số này thì mở được mọi món tiền mà nó khoá. Vì vậy nó phải được giữ thật kín. | 23<br>20<br>22 | Một chiếc chìa vẽ phấn, thân chìa là một dãy số dài chạy ra khỏi mép bảng. Nhãn "Khoá bí mật". Bên cạnh, một máy tính nhỏ đoán số liên tục, các con số đều bị gạch. | Tiếng tick nhanh liên tục khi máy tính đoán số, dừng lại đột ngột. |
| **04. Khoá công khai**<br>~18 giây | `Khoá bí mật → Khoá công khai`<br>`Một chiều`<br>`(public key)` | 04-0: Từ khoá bí mật, ví tính ra một con số thứ hai, gọi là khoá công khai.<br>04-1: Phép tính này chỉ đi một chiều. Có khoá bí mật thì ra khoá công khai rất dễ, còn đi ngược lại thì không thể.<br>04-2: Cũng như pha hai màu sơn vào nhau thì dễ, nhưng tách chúng ra lại như cũ thì gần như không ai làm được. | 17<br>25<br>24 | Mũi tên một chiều từ chìa (đỏ phấn) sang một ô khoá công khai (xanh phấn). Mũi tên ngược lại bị gạch chéo. Hai vệt sơn trộn vào nhau thành một màu, mũi tên tách ra bị gạch. | Một nốt chuông khi khoá công khai hiện ra; tiếng trầm ngắn khi mũi tên ngược bị gạch. |
| **05. Địa chỉ là ổ khoá**<br>~24 giây | `Khoá công khai → Dấu vân tay → Địa chỉ`<br>`addr1…`<br>`Địa chỉ = ổ khoá` | 05-0: Từ khoá công khai, ví lấy ra một dấu vân tay ngắn gọn, ghép thêm vài thông tin nữa, và thế là có địa chỉ.<br>05-1: Địa chỉ này chính là ổ khoá gắn trên những món tiền chưa tiêu mà ta đã gặp ở các tập trước.<br>05-2: Ai muốn gửi tiền cho bạn thì tạo một món tiền mới, khoá bằng địa chỉ của bạn.<br>05-3: Vì thế, địa chỉ cứ việc đưa cho người khác, cũng như khi bạn đưa số tài khoản để nhận tiền. | 25<br>22<br>18<br>21 | Khoá công khai thu nhỏ thành một dấu vân tay phấn, dấu vân tay ghép thêm một mảnh nhỏ rồi thành chuỗi "addr1…" (xanh phấn). Chuỗi bay xuống, khắc lên ổ khoá của một ô món tiền màu vàng. | Tiếng phấn; tiếng "cạch" khi địa chỉ khắc lên ổ khoá. |
| **06. Chữ ký**<br>~25 giây | `Ký bằng khoá bí mật`<br>`Kiểm tra bằng khoá công khai`<br>`Chìa không rời ví` | 06-0: Khi bạn tiêu tiền, ví dùng khoá bí mật để ký lên giao dịch, rồi gửi chữ ký kèm khoá công khai.<br>06-1: Mạng lưới kiểm tra hai điều. Thứ nhất, chữ ký có khớp với khoá công khai này không?<br>06-2: Thứ hai, dấu vân tay của khoá công khai có khớp với ổ khoá trên món tiền không. Khớp cả hai thì ổ khoá mở.<br>06-3: Điều đáng chú ý là khoá bí mật chưa bao giờ rời khỏi ví. Chữ ký chứng minh bạn có chìa, mà không phải đưa chìa cho ai. | 22<br>18<br>25<br>28 | Giao dịch là một tờ giấy phấn; chìa đỏ đóng một con dấu lên đó rồi quay về ví. Tờ giấy bay đi kèm khoá công khai xanh. Hai dấu tích lần lượt hiện. Ổ khoá trên ô món tiền bật mở. Chìa đỏ vẫn nằm trong ví suốt cảnh. | Tiếng đóng dấu; hai tiếng tick; tiếng "cạch" khi ổ khoá mở. |
| **07. Cụm từ khôi phục**<br>~20 giây | `Cụm từ khôi phục`<br>`(seed phrase · mnemonic)`<br>`24 từ` | 07-0: Khoá bí mật là một dãy số rất dài, chép tay thì dễ sai mà đọc lên thì rất khó nhớ.<br>07-1: Vì vậy, khi tạo ví mới, ví chọn ngẫu nhiên một con số gốc rồi viết nó thành một chuỗi từ tiếng Anh thông dụng.<br>07-2: Chuỗi này gọi là cụm từ khôi phục. Với hydra-sdk, mặc định là hai mươi bốn từ, theo đúng thứ tự. | 21<br>25<br>25 | Dãy số dài của khoá bí mật (cảnh 03) cuộn lại, rồi biến thành lưới 24 ô từ (đỏ phấn), mỗi ô một từ tiếng Anh đơn giản và một số thứ tự. Các từ là từ dựng lại để minh hoạ, một nửa bị làm mờ. | Tiếng phấn viết nhanh theo từng ô từ. |
| **08. Một cụm từ, cả chùm chìa**<br>~21 giây | `Cụm từ → Khoá gốc`<br>`Khoá con 1, 2, 3…`<br>`Địa chỉ 1, 2, 3…` | 08-0: Từ cụm từ khôi phục, ví tính ra một khoá gốc. Từ khoá gốc, nó sinh ra các khoá bí mật theo một con đường cố định.<br>08-1: Mỗi khoá bí mật lại cho ra khoá công khai và địa chỉ của riêng nó, nên một cụm từ có thể có rất nhiều địa chỉ.<br>08-2: Điều quan trọng nhất là cùng một cụm từ thì lần nào cũng ra đúng những khoá ấy, đúng những địa chỉ ấy. | 27<br>27<br>23 | Cây phấn mọc từ lưới cụm từ: gốc là khoá gốc, các nhánh là khoá bí mật (đỏ), đầu mỗi nhánh nở ra một địa chỉ (xanh). Toàn cảnh: cụm từ → khoá bí mật → khoá công khai → địa chỉ, mũi tên một chiều. | Tiếng tick mỗi khi một nhánh mọc ra; nốt chuông khi cây hoàn chỉnh. |
| **09. Mất cụm từ là mất chìa**<br>~25 giây | `Còn cụm từ → khôi phục`<br>`Mất cụm từ → mất chìa`<br>`Không có "quên mật khẩu"` | 09-0: Quay lại chiếc điện thoại bị rơi. Nếu bạn còn giữ cụm từ khôi phục, chỉ cần nhập lại vào ứng dụng ví.<br>09-1: Ví sẽ tính lại đúng những khoá cũ, tìm lại đúng những món tiền cũ, và mọi thứ trở về như trước.<br>09-2: Nhưng nếu mất cả cụm từ lẫn ví thì sao? Không ngân hàng hay tổng đài nào cấp lại được, cũng chẳng có nút quên mật khẩu.<br>09-3: Tiền vẫn còn nằm trên blockchain, nhưng sẽ không còn ai mở được những ổ khoá ấy nữa. | 23<br>22<br>27<br>20 | Nhánh trái: điện thoại mới, lưới cụm từ nhập vào, cây khoá mọc lại, các ô món tiền sáng lên. Nhánh phải: lưới cụm từ bị lau mất; các ô món tiền vẫn ở đó nhưng ổ khoá phủ một lớp mờ, không chìa nào khớp. | Hợp âm sáng ở nhánh trái; tiếng lau bảng và một nốt trầm ở nhánh phải. |
| **10. Không đưa cho ai**<br>~28 giây | `Có cụm từ = có mọi chìa`<br>`Không thể đảo ngược`<br>`Ai hỏi → lừa đảo` | 10-0: Cũng vì thế mà cụm từ khôi phục chính là toàn bộ chùm chìa khoá của bạn.<br>10-1: Ai có nó thì khôi phục được ví của bạn trên máy của họ, rồi chuyển hết tiền đi.<br>10-2: Giao dịch đã được mạng ghi nhận thì không ai đảo ngược được, cũng không có ai để bạn khiếu nại.<br>10-3: Ví hay bộ phận hỗ trợ chân chính không bao giờ cần cụm từ của bạn để giúp bạn.<br>10-4: Vậy nên bất kể ai hỏi, qua tin nhắn, trang web hay một người xưng là nhân viên, hãy coi đó là lừa đảo. | 17<br>19<br>21<br>19<br>24 | Lưới cụm từ đỏ bị một bàn tay lạ chép lại; ở một chiếc máy khác cây khoá mọc lên y hệt, các ô món tiền bị kéo đi. Rồi ba khung nhỏ: một tin nhắn, một trang web có ô "Nhập cụm từ để nhận quà", một người đội mũ "Hỗ trợ". Cả ba bị đóng dấu "Lừa đảo". | Tiếng tick nhanh khi tiền bị kéo đi; tiếng đóng dấu ba lần. |
| **11. Cất giữ thế nào**<br>~14 giây | `Viết ra giấy`<br>`Cất nơi an toàn`<br>`Không chụp ảnh · Không lưu lên mạng · Không gửi tin nhắn` | 11-0: Vậy nên giữ cụm từ khôi phục thế nào cho an toàn? Cách đơn giản nhất là viết ra giấy, rồi cất ở nơi an toàn.<br>11-1: Đừng chụp ảnh, đừng lưu lên mạng, và cũng đừng gửi nó qua tin nhắn cho bất kỳ ai, kể cả người thân. | 26<br>23 | Tờ giấy phấn chép cụm từ (các từ làm mờ) được gấp lại, cất vào một chiếc hộp có khoá. Bên cạnh ba biểu tượng máy ảnh, đám mây, bong bóng tin nhắn, mỗi cái bị gạch chéo. | Tiếng giấy gấp; tiếng hộp đóng; ba tiếng gạch phấn. |
| **12. AppWallet và EmbeddedWallet — cho lập trình viên**<br>~38 giây | `import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'`<br>`const words = AppWallet.brew()   // 24 từ`<br>`const wallet = new AppWallet({`<br>`  networkId: NETWORK_ID.PREPROD,`<br>`  key: { type: 'mnemonic', words }`<br>`})`<br>`wallet.getPaymentAddress()   // addr…`<br>`wallet.signTx(unsignedTx)`<br>`EmbeddedWallet · m/1852'/1815'/0'/0/0` | 12-0: Phần này dành cho lập trình viên. Trong gói core của hydra-sdk, lớp AppWallet làm đúng chuỗi việc vừa kể.<br>12-1: Hàm brew tạo cụm từ khôi phục hai mươi bốn từ. Đưa cụm từ đó vào AppWallet là ví có ngay địa chỉ và ký được giao dịch.<br>12-2: Bên dưới là lớp EmbeddedWallet, đi từ khoá gốc ra từng khoá con theo con đường chuẩn của Cardano.<br>12-3: Lớp này còn nhận được khoá gốc có sẵn, hoặc khoá tạo bằng công cụ dòng lệnh của Cardano.<br>12-4: Cùng một ví ký được giao dịch trên Cardano và cả bên trong Hydra Head.<br>12-5: Vì ứng dụng của bạn đang giữ chìa, đừng bao giờ ghi cụm từ ra nhật ký hay gửi nó về máy chủ. | 26<br>30<br>25<br>21<br>18<br>23 | Đoạn code viết tay bằng phấn, từng dòng hiện theo lời đọc; "brew()" khoanh đỏ, "getPaymentAddress()" gạch chân xanh. Dòng cuối là đường dẫn khoá viết nhỏ, cạnh nhãn "CIP-1852" và "BIP39". Góc trên: nhãn nhỏ "@hydra-sdk/core". | Tiếng gõ phấn nhanh theo từng dòng code. |
| **13. Tóm tắt và lời kết**<br>~27 giây | `1. Cụm từ → khoá bí mật → khoá công khai → địa chỉ`<br>`2. Địa chỉ cho ai cũng được`<br>`3. Cụm từ không đưa cho ai`<br>`hydrasdk.com`<br>`Thực hiện cùng VTechcom Labs` | 13-0: Tóm lại, qua tập này bạn chỉ cần nhớ ba ý chính.<br>13-1: Thứ nhất, cụm từ khôi phục sinh ra khoá bí mật, rồi khoá công khai, rồi địa chỉ, và chỉ đi theo một chiều.<br>13-2: Thứ hai, địa chỉ là ổ khoá trên món tiền của bạn, cứ việc đưa cho người khác để nhận tiền.<br>13-3: Thứ ba, cụm từ khôi phục là toàn bộ chìa khoá. Giữ nó thật kỹ và đừng đưa cho bất kỳ ai.<br>13-4: Bạn có thể xem thêm tài liệu và ví dụ tại hydrasdk.com. | 12<br>24<br>21<br>22<br>18 | Ba ý viết lần lượt, ý ba gạch chân đỏ. Cuối: "hydrasdk.com" ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" kèm logo ở góc dưới phải, không đọc thành lời. | Một nốt chuông cho mỗi ý; nền ra dần trong 2 giây cuối. |

**Tổng:** 48 câu, 1057 âm tiết, ước lượng khoảng 4 phút 51 giây (tính 4.2 âm tiết/giây, cộng nghỉ giữa câu và giữa cảnh).
