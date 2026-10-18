# Tập 12 — Bảo mật cho người dùng mới, phần 2: trang giả, ký mù và token lạ

## Brief

| Mục | Quyết định |
|---|---|
| Chuỗi | Kiến thức nền Cardano và Hydra, đồng thời giới thiệu hydra-sdk |
| Thể loại | Giải thích khoa học (phần an toàn cho người dùng) |
| Phong cách | Như tập 1: phấn trắng trên nền đen, hình hiện dần như đang được vẽ |
| Lời đọc | Tiếng Việt, giọng Hải Đăng (VieNeu), không có phụ đề chạy; chữ trên màn hình chỉ là chữ được "viết" lên bảng |
| Khung hình | 16:9, 1920×1080 |
| Âm thanh | Giọng đọc + nền và hiệu ứng tự tổng hợp |
| Khán giả | Người chưa biết gì về blockchain, đã xem các tập trước (nhất là tập 1, 4, 5); tập 8 (token) có ích nhưng không bắt buộc, cảnh 10 tự nhắc lại đủ ý cần dùng; đoạn ngắn cho lập trình viên ở cảnh 12–13 |
| Độ dài | Khoảng 5–6 phút |
| Cuối video | hydrasdk.com, kèm dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc, không đọc thành lời |

**Mạch tập:** tập 4 kết bằng lời cảnh báo "ai hỏi cụm từ khôi phục thì hãy coi là lừa đảo". Tập này đi tiếp một bước: vì chìa không rời ví, kẻ gian có hai lối khác, hoặc lừa bạn gõ cụm từ vào một trang giả, hoặc lừa bạn tự dùng chìa của mình để ký một giao dịch có lợi cho họ. Ba mối nguy, mỗi mối nguy đi theo cùng một nhịp: tình huống → dấu hiệu nhận biết → thói quen phòng tránh. Sau đó là ba chủ đề bổ trợ: quyền kết nối của trang web, kiểm tra địa chỉ nhận, ví phần cứng.

**Ẩn dụ dùng lại của chuỗi (không thêm ẩn dụ mới mâu thuẫn):** món tiền chưa tiêu mang ổ khoá; khoá bí mật là chìa; chữ ký là bằng chứng có chìa, chìa không rời ví (tập 4). Ẩn dụ duy nhất thêm ở tập này: **"tờ giấy chờ đóng dấu"** cho giao dịch chưa ký, nối hình ảnh tập 4 cảnh 06 (giao dịch là tờ giấy, chìa đỏ đóng dấu lên đó). Ký là đóng dấu; đã đóng dấu và gửi đi thì không thu lại được.

**Hình xuyên suốt:** khung "cửa sổ xin ký" vẽ phấn, bên trong chia hai cột "Đầu vào" và "Đầu ra" như cảnh 08 tập 1. Khung này xuất hiện ở cảnh 05, 06, 07, 08, 11 và 12 (ở cảnh 12 thành khung code). Màu nhấn cố định: món tiền chưa tiêu vàng phấn (như tập 1); cụm từ khôi phục và chìa đỏ phấn (như tập 4); địa chỉ xanh phấn (như tập 4); token thường xanh lá phấn và dấu vân tay mã chính sách cam phấn (như tập 8); **dấu hiệu cảnh báo màu hồng phấn** (mới ở tập này, chỉ dùng cho chỗ "có gì đó sai" trên trang giả, giao dịch lạ, token lạ). Không dùng cam cho cảnh báo vì tập 8 đã dành cam cho mã chính sách.

**Ví dụ xuyên suốt:** An (nhân vật của tập 1 và tập 6) gặp lần lượt ba tình huống: tìm ví trên mạng và bấm vào kết quả quảng cáo; được mời "nhận thưởng" và ký một giao dịch; thấy một token lạ trong ví kèm lời mời ghé một trang web. Đây là **ví dụ minh hoạ**, không dựa trên vụ việc cụ thể nào. Mọi tên miền trên bảng dùng đuôi `.example` (tên miền dành riêng cho ví dụ theo RFC 2606), ví dụ `vi-cua-an.example` và `vi-cua-an-app.example`; không vẽ logo hay giao diện của ví, sàn hay dự án có thật.

**Cách gọi trong lời đọc:** "trang giả mạo" (phishing chỉ hiện trên bảng), "ký vội" (ví hiện đủ giao dịch nhưng người dùng không đọc mà bấm ký), "ký mù" (blind signing, ghi song ngữ lần đầu trên bảng: ví hoặc thiết bị không đọc được giao dịch mà người dùng vẫn ký), "mã chính sách" và "tên token" (giữ đúng cụm của tập 1 và tập 8), "ví phần cứng" (hardware wallet), "trang web ứng dụng" khi lời đọc cần nói dApp (chữ dApp chỉ hiện trên bảng), "quyền kết nối ví", "token lạ" (thay cho airdrop trong lời đọc).

## Nguồn tham khảo

Code và tài liệu trong repo (đã mở ra đọc):

- `packages/core/src/index.ts` — `@hydra-sdk/core` xuất các namespace `Deserializer`, `Resolver`, `AddressUtils`, `ParserUtils`; `ValidatorUtils` đánh dấu `@deprecated`.
- `packages/core/src/utils/cardano-wasm/deserializer.ts`:
  - `deserializeTx(txCborHex: string): CardanoWASM.FixedTransaction` — gọi `FixedTransaction.from_bytes`, **không** gọi `.free()` (người gọi tự giải phóng).
  - `deserializeAmountsFromTx(cborHex: string): Asset[]` — cộng lượng lovelace và token của **mọi** đầu ra (kể cả tiền thối), gộp theo `unit`. Vì vậy không dùng hàm này làm "số tiền gửi đi".
- `packages/core/src/utils/cardano-wasm/resolver.ts` — `resolveTxHash(cborHex)` trả mã giao dịch dạng hex, có `tx.free()`.
- `packages/core/src/utils/address.ts` — `isValidAddress(address, type = 'bech32')` (chỉ kiểm tra địa chỉ đúng định dạng, không kiểm tra địa chỉ đó "đúng người"); `getPubkeyHashFromAddress(address)`.
- `packages/core/src/utils/parser.ts` — `ParserUtils` chỉ có `bytesToHex`, `hexToBytes`, `stringToHex`, `hexToString`, `toBytes` (và `fromUTF8`, `toUTF8` deprecated); **không** có hàm đọc giao dịch. Yêu cầu riêng gợi ý ParserUtils, nhưng hàm đọc giao dịch nằm ở `Deserializer`.
- Thư viện bên dưới, `@emurgo/cardano-serialization-lib-nodejs@14.1.2` (qua `@hydra-sdk/cardano-wasm`), file `cardano_serialization_lib.d.ts`: `FixedTransaction.body()`, `.transaction_hash()`, `.free()`; `TransactionBody.inputs()`, `.outputs()`, `.fee()`, `.mint()`; `TransactionOutput.address()`, `.amount()`; `Address.to_bech32(prefix?)`.
- `packages/core/src/wallet.ts` và `apps/docs-v2/content/en/4.api/2.core.md` — `AppWallet.signTx(txCbor, partialSign?, accountIndex?, keyIndex?) → Promise<string>` trả giao dịch đã ký (CBOR hex). Đây là trường hợp ứng dụng tự giữ chìa (tập 4).
- `apps/docs-v2/content/en/4.api/6.utilities.md` (dòng 1181–1240) và `2.guides/6.utilities-cookbook.md` (dòng 284–297) — tài liệu cho `Deserializer.deserializeTx`, `Deserializer.deserializeAmountsFromTx` (ghi "New in v1.4.0"), `Resolver.resolveTxHash`. `packages/core/package.json` hiện ở `1.5.0`.
- `packages/app-bridge` (`@hydra-sdk/app-bridge`, `package.json` version `0.1.0`; README viết tiếng Việt):
  - `src/client.ts` — lớp `WalletBridgeClient`: `signTx(txHex, partialSign = false, options?) → Promise<string | null>` gửi yêu cầu `WALLET_SIGN_TX` qua `window.parent.postMessage` lên trang chủ (host), trang chủ gọi `api.signTx` của ví CIP-30; `signData(address, hexPayload)`; `getUtxos`, `getChangeAddress`, `getBalance`. Tuỳ chọn `appCenterOrigin` (constructor đặt mặc định `'*'`, tức nhận mọi nguồn); khi khác `'*'` thì message từ origin khác bị bỏ qua; chỉ nhận message có `event.source === window.parent`.
  - Ở chế độ chạy độc lập (`fallbackToExtension: true`), `signTx` gọi thẳng `api.signTx(txHex, partialSign)` của ví và trả nguyên kết quả.
  - `src/errors.ts` — `WalletBridgeUserRejectedError`, `WalletBridgeTimeoutError` (xuất từ `src/index.ts`).
  - Gói này chưa được nhắc trong `apps/docs-v2/content/en/**`.
- Các tập liên quan: `promo/videos/01-utxo` (đầu vào, đầu ra, tiền thối, cảnh 08), `04-vi-khoa-dia-chi` (chìa không rời ví, cảnh 06; ai hỏi cụm từ là lừa đảo, cảnh 10; ký trong Hydra Head), `05-hop-dong-thong-minh-eutxo` (giao dịch đầy đủ nằm trong tay bạn trước khi gửi, cảnh 09). `08-token-va-nft/brief.md` (đã đọc bản brief): token nằm trong món tiền cạnh ADA, chuyển token không chạy hợp đồng; "mã chính sách là dấu vân tay của luật đúc"; hai token chỉ cùng loại khi trùng cả mã chính sách lẫn tên token, cùng tên mà khác mã chính sách là hàng khác (nguồn của tập 8: Cardano Developer Portal, "What Are Native Tokens", https://developers.cardano.org/docs/developers/curriculum/native-tokens/overview/).
- `packages/core/src/types/cardano/utxo.ts` và tập 1 cảnh 13: giao dịch chỉ gọi tên món tiền đầu vào bằng `txHash#index`; số tiền và địa chỉ của món đó nằm ở giao dịch đã tạo ra nó. Trong CSL, `TransactionInput` chỉ có `transaction_id()` và `index()`.

Nguồn ngoài (đã mở, ngày truy cập 16/10/2026):

- CIP-30, "Cardano dApp-Wallet Web Bridge" — https://cips.cardano.org/cip/CIP-0030 : `cardano.{walletName}.enable()` cần ví hỏi người dùng cho phép kết nối; `api.signTx(tx, partialSign = false)` trả `cbor<transaction_witness_set>` (chỉ phần chữ ký mới), không trả giao dịch đầy đủ hay mã giao dịch; ví phải xin đồng ý của người dùng "một cách đủ thông tin" cho mỗi lần gọi ký; `signData` trả chữ ký COSE và khoá **công khai**; không có hàm nào trả khoá bí mật. Sau khi kết nối, trang web đọc được địa chỉ, số dư, danh sách món tiền (`getUsedAddresses`, `getBalance`, `getUtxos`). Spec **không** bắt buộc ví hiển thị chi tiết đầu vào/đầu ra khi `signTx`.
- cardano.org, "Common scams" — https://cardano.org/common-scams (trang không ghi ngày): trang giả mạo bắt chước ví phổ biến, lời khuyên kiểm tra kỹ URL, cân nhắc ví phần cứng, không đưa cụm từ cho cả người xưng "hỗ trợ"; quà tặng thật không bắt gửi tiền trước.
- Cardano Foundation, "Guidance for staying safe from sophisticated scams" (diễn đàn chính thức) — https://forum.cardano.org/t/the-cardano-foundation-s-guidance-for-staying-safe-from-sophisticated-scams/42293 : trang giả có thể có chứng chỉ SSL, nên biểu tượng ổ khoá trên trình duyệt không đủ để tin trang.
- Cardano Docs, "Native tokens" — https://docs.cardano.org/developer-resources/native-tokens : token gốc do sổ cái xử lý, không cần hợp đồng thông minh để chuyển; token nằm trong đầu ra cùng ADA; gửi token luôn kèm một lượng ADA tối thiểu.
- Check Point Research (2021), chiến dịch quảng cáo tìm kiếm giả mạo ví — https://research.checkpoint.com/2021/cpr-alerts-crypto-wallet-users-of-massive-search-engine-phishing-campaign-that-has-resulted-in-at-least-half-a-million-dollars-being-stolen/ : chỉ dùng để xác nhận **hình thức** quảng cáo tìm kiếm dẫn tới trang ví giả có thật; không dùng con số thiệt hại, không nêu tên thương hiệu bị nhái.
- Ledger Developer Portal, "Signing transactions and messages" — https://developers.ledger.com/docs/device-app/integration/design-guidelines/transactions : ví phần cứng hiện thông tin giao dịch (địa chỉ, số tiền, phí) trên màn hình của thiết bị để người dùng kiểm tra trước khi ký; khi thiết bị không giải mã được giao dịch thì gọi là ký mù (blind signing) và phải có cảnh báo. Đây là hướng dẫn thiết kế của một hãng, dùng làm nguồn cho khái niệm, không dùng làm cam kết cho mọi thiết bị.
- CIP-5 (tiền tố Bech32) — https://cips.cardano.org/cip/CIP-0005 và CIP-19 (định dạng địa chỉ) — https://cips.cardano.org/cip/CIP-0019 : địa chỉ mainnet bắt đầu bằng `addr`, testnet bằng `addr_test`; ký tự tiếp theo mã hoá loại địa chỉ và mạng, nên các địa chỉ ví thông thường có chung phần đầu (ví dụ `addr1q…`). Vì vậy so phần đầu không phân biệt được hai địa chỉ.
- Cho ý "giao dịch eUTxO ghi rõ đầu vào và đầu ra trước khi gửi": dùng lại nguồn tập 5 — https://developers.cardano.org/docs/learn/core-concepts/eutxo và https://www.iog.io/news/no-surprises-transaction-validation-on-cardano

## Ranh giới sự thật

Được nói (đã đối chiếu):

- Vì khoá bí mật không rời ví (tập 4), kẻ gian cần một trong hai thứ: cụm từ khôi phục của bạn, hoặc chữ ký của bạn trên một giao dịch họ soạn sẵn.
- Trang giả mạo có thể bắt chước giao diện ví và dùng tên miền gần giống tên thật; biểu tượng ổ khoá trên trình duyệt không chứng minh trang là thật (Cardano Foundation). Quảng cáo trên trang kết quả tìm kiếm từng được dùng để dẫn tới trang ví giả (Check Point Research, 2021).
- Trang web chỉ được đọc thông tin ví và xin ký sau khi bạn đồng ý kết nối; ví phải hỏi bạn mỗi lần trang xin ký (CIP-30).
- Kết nối ví theo CIP-30 không trao khoá bí mật cho trang web: trang gửi giao dịch sang ví, ví hỏi bạn, rồi trả về chữ ký. Nhưng sau khi kết nối, trang đọc được địa chỉ, số dư và các món tiền của ví (`getUsedAddresses`, `getBalance`, `getUtxos`).
- Một giao dịch eUTxO ghi đích danh các món tiền đem tiêu (đầu vào) và các món tiền mới sinh ra kèm ổ khoá, tức địa chỉ (đầu ra), trước khi ký. Nên về nguyên tắc ví có đủ dữ liệu để cho bạn xem tiền đi đâu (nối tập 1 cảnh 08, tập 5 cảnh 09).
- Ký là đồng ý với toàn bộ giao dịch đó. Giao dịch đã được mạng ghi nhận thì không đảo ngược được (đã nói ở tập 4).
- Hai trường hợp khác nhau: **ký vội** là ví đã hiện giao dịch nhưng người dùng không đọc mà bấm ký; **ký mù** là ví hoặc thiết bị không đọc được giao dịch (chỉ thấy dữ liệu mã hoá) mà người dùng vẫn ký (Ledger Developer Portal). Cả hai cùng một thói quen phòng tránh: không đọc được hoặc không hiểu thì không ký.
- Token gốc trên Cardano do sổ cái xử lý, không có chương trình chạy kèm; token nằm trong một món tiền chưa tiêu cùng một lượng ADA (Cardano Docs; tập 8). Vì vậy một token lạ nằm trong ví không tự tiêu tiền của bạn được; rủi ro đến khi bạn theo lời mời trên token, vào trang lạ, kết nối ví và ký.
- Tên token do người đúc tự đặt; hai token chỉ cùng loại khi trùng cả mã chính sách lẫn tên token (Developer Portal, theo brief tập 8). Một token lạ có thể mang tên giống token quen nhưng mã chính sách khác.
- Địa chỉ ví thông thường trên mainnet có chung phần đầu (`addr1…`, CIP-5, CIP-19), nên so phần đầu không phân biệt được hai địa chỉ; cần so phần giữa và phần cuối.
- Ví phần cứng giữ khoá bí mật trong thiết bị và hiện giao dịch trên màn hình riêng của thiết bị để bạn xác nhận; khi thiết bị không đọc được giao dịch thì có cảnh báo ký mù (Ledger Developer Portal, hướng dẫn thiết kế).
- Cardano.org khuyên cân nhắc ví phần cứng và kiểm tra kỹ URL.
- Code ở cảnh 12–13 đúng tên hàm hiện có: `Deserializer.deserializeTx`, các phương thức CSL `body().inputs()`, `body().outputs()`, `body().fee()`, `address().to_bech32()`, `amount().coin().to_str()`, `.free()`; `AppWallet.signTx`; `WalletBridgeClient.signTx`, `WalletBridgeUserRejectedError`.
- Giao dịch chỉ chứa **tham chiếu** tới món tiền đầu vào (`txHash#index`), không chứa số tiền hay địa chỉ của món đó. Muốn hiện "món nào, bao nhiêu" ở cột đầu vào, ứng dụng phải tra các món đó trong danh sách món tiền đã có (ví dụ kết quả `getUtxos` của ví, hoặc snapshot trong Hydra Head). `deserializeTx` chỉ đọc giao dịch, không tự biết đầu ra nào là tiền thối; ứng dụng tự so địa chỉ đầu ra với địa chỉ của ví. Phía người dùng, ví làm được việc này vì ví biết các món tiền của chính nó.

Đơn giản hoá có chủ ý:

- "Ví cho bạn xem giao dịch trước khi ký": lời đọc nói "nhiều ví có thể hiện", "hãy xem ví của bạn hiện gì". Không hứa mọi ví đều hiện đủ đầu vào, đầu ra và địa chỉ; CIP-30 chỉ bắt ví xin đồng ý "đủ thông tin", không quy định nội dung hiển thị.
- Giao dịch có hợp đồng thông minh (tập 5) còn có datum, redeemer, mint… mà ví có thể không diễn giải được; kịch bản chỉ nói "nếu ví báo không đọc được giao dịch thì đừng ký", không đi vào chi tiết.
- "Ký là đóng dấu, gửi đi thì không thu lại": bỏ qua trường hợp giao dịch đã ký nhưng chưa được gửi hoặc bị mạng từ chối (ví dụ món tiền đã bị tiêu trước). Lời đọc nói "một khi giao dịch đã được mạng ghi nhận".
- Kiểm tra địa chỉ nhận: khuyên so một đoạn ở giữa và đoạn cuối (không chỉ phần đầu, vì phần đầu giống nhau), và gửi thử một khoản nhỏ khi gửi tới địa chỉ mới. Đây là thói quen phổ biến, không phải đảm bảo; không nhắc mã độc tráo địa chỉ trong bộ nhớ tạm hay kiểu tấn công "đầu độc địa chỉ" vì chưa có nguồn chính thức trong brief.
- "Token lạ không tự làm gì được": đúng với token gốc nằm trong ví; không bàn trường hợp token ấy đi kèm một món tiền khoá bằng script (nó vẫn không lấy được tiền của các món khác).
- Ví phần cứng: không nêu tên hãng, không nói ví phần cứng "chống được mọi lừa đảo". Thông điệp: ví phần cứng giữ chìa khỏi máy tính, nhưng nếu bạn bấm đồng ý một giao dịch xấu thì nó vẫn ký. Cụm từ khôi phục của ví phần cứng vẫn phải giấu như tập 4.

Không dùng:

- Số liệu thiệt hại lừa đảo (kể cả con số trong bài Check Point): không có nguồn chính thức cập nhật cho Cardano, và đề bài cấm số không có nguồn + mốc thời gian.
- Tên trang, token, dự án lừa đảo có thật; tên và logo thương hiệu ví, sàn, hãng ví phần cứng thật.
- Câu "`deserializeTx` cho biết số tiền của từng đầu vào" hay "tự đánh dấu tiền thối": sai, xem mục Được nói.
- `Deserializer.deserializeAmountsFromTx` làm "số tiền gửi đi": hàm cộng cả tiền thối về ví mình, đưa lên màn hình sẽ làm người dùng tưởng mình gửi nhiều hơn thực tế (hoặc che mất phần thật sự rời ví).
- `ParserUtils` cho phần đọc giao dịch: nhóm này chỉ đổi qua lại hex/byte/chuỗi.
- `AddressUtils.isValidAddress` như cách "kiểm tra địa chỉ đúng người": hàm chỉ kiểm tra định dạng. Có thể nhắc ở cảnh 12 đúng vai trò đó, hoặc bỏ.
- `ValidatorUtils` (deprecated).
- Câu `const txHash = await client.signTx(txCborHex)` trong README của app-bridge: theo CIP-30 và theo code (`signTx` trả nguyên kết quả `api.signTx`), giá trị trả về là bộ chữ ký (witness set), không phải mã giao dịch. Cảnh 13 đặt tên biến là `witness`.
- "Hydra Head an toàn hơn" hay so sánh mức an toàn giữa lớp 1 và lớp 2: không có nguồn, ngoài phạm vi tập.
- Tên gói `game-sdk`: không có trong `packages/` hiện tại; gói gần nhất là `@hydra-sdk/app-bridge` (mô tả trong `package.json` có chữ "Game SDK").

## Dàn ý cảnh

| Cảnh | Tiêu đề | Ý chính (1–3 câu, nói điều gì) | Hình gợi ý | Nối với tập khác |
|---|---|---|---|---|
| 01 | Mở đầu | Ở tập bốn ta đã chốt một điều: ai hỏi cụm từ khôi phục thì hãy coi là lừa đảo. Nhưng kẻ gian còn lối khác: lừa bạn gõ cụm từ vào một trang giả, hoặc lừa bạn tự dùng chìa của mình để ký giúp họ. | Câu "Ai hỏi cụm từ → lừa đảo" của tập 4 viết lại; chìa đỏ vẫn trong ví; hai mũi tên hồng vòng qua bên cạnh ví, một tới ô "nhập cụm từ", một tới tờ giấy chờ đóng dấu. | Tập 4 cảnh 10 |
| 02 | Ba mối nguy | Giới thiệu ba mối nguy theo nhịp tình huống → dấu hiệu → thói quen: trang giả mạo, ký mù, token lạ. Cả ba đều nhắm vào một chỗ, là khoảnh khắc bạn gõ cụm từ hoặc bấm ký. | Ba ô cửa phấn có nhãn; bên dưới dòng nhịp "Tình huống → Dấu hiệu → Thói quen" giữ cố định suốt tập. | — |
| 03 | Trang giả mạo: tình huống | An muốn cài ví, gõ tên ví lên công cụ tìm kiếm và bấm kết quả đầu tiên, vốn là một quảng cáo. Trang trông y hệt, rồi hỏi cụm từ khôi phục "để đồng bộ ví". | Khung trình duyệt phấn, dòng kết quả có nhãn nhỏ "Quảng cáo"; trang giả có ô 24 từ màu đỏ. Tên miền `vi-cua-an-app.example`. | Tập 4 cảnh 07 (lưới cụm từ) |
| 04 | Trang giả mạo: dấu hiệu và thói quen | Dấu hiệu: tên miền lệch một chữ hay thêm chữ, đến từ quảng cáo hoặc đường dẫn trong tin nhắn, trang hỏi cụm từ. Biểu tượng ổ khoá trên trình duyệt chỉ cho biết kết nối được mã hoá, không cho biết trang là thật. Thói quen: tải ví từ trang chính thức, lưu dấu trang và mở từ dấu trang. | So hai tên miền cạnh nhau, chữ lệch khoanh hồng; biểu tượng ổ khoá trình duyệt có dấu hỏi; ngôi sao dấu trang. | — |
| 05 | Bấm "kết nối ví" là cho phép gì? | Khi một trang web xin kết nối, ví hỏi bạn trước. Đồng ý rồi, trang xem được địa chỉ, số dư, các món tiền của bạn và được quyền xin ký; nhưng chìa vẫn ở trong ví, trang không lấy được. Vì thế thứ cần canh là từng lần xin ký. | Trang web và ví nối bằng một sợi dây phấn; qua dây đi sang: địa chỉ xanh, món tiền vàng, tờ giấy chờ đóng dấu; chìa đỏ có vòng khoá không qua dây được. Nhãn nhỏ "CIP-30". | Tập 4 cảnh 06 (chìa không rời ví) |
| 06 | Ký vội và ký mù: tình huống | An được mời "nhận thưởng", trang hiện nút ký, ví đã hiện giao dịch nhưng An bấm đồng ý mà không đọc: đó là ký vội. Giao dịch thật ra tiêu các món tiền của An và tạo đầu ra khoá bằng địa chỉ của người lạ. Trường hợp thứ hai là ví báo không đọc được giao dịch mà An vẫn ký: đó là ký mù. | Cửa sổ xin ký, An đóng dấu đỏ thật nhanh; lật tờ giấy ra mặt sau: cột đầu ra là một địa chỉ lạ viền hồng, các món tiền vàng trượt đi. Khung nhỏ thứ hai: cửa sổ xin ký chỉ có chuỗi ký tự lộn xộn, nhãn "ký mù (blind signing)". | Tập 1 cảnh 08; tập 4 cảnh 06 (đóng dấu) |
| 07 | Giao dịch nói rõ tiền đi đâu | Trên Cardano, giao dịch gọi đích danh món tiền nào được tiêu và món mới khoá bằng địa chỉ nào, ngay từ trước khi ký. Ví biết các món tiền của chính nó, nên nhiều ví có thể cho bạn xem trước tiền đi đâu; hãy xem ví của bạn hiện những gì. | Tờ giấy chờ đóng dấu chia hai cột như tập 1: đầu vào vàng, đầu ra kèm địa chỉ xanh, dòng phí. Mũi tên từ cột đầu ra chỉ vào cửa sổ ví. | Tập 1 cảnh 08, 12; tập 5 cảnh 09 |
| 08 | Đọc trước khi ký: dấu hiệu và thói quen | Dấu hiệu: số tiền rời ví lớn hơn điều bạn định làm, có địa chỉ nhận bạn không biết, có token rời ví mà bạn không định gửi, trang giục "chỉ còn vài phút", hoặc ví báo không đọc được giao dịch. Thói quen: đọc từng đầu ra trước khi ký; không đọc được hay không hiểu thì không ký; từ chối ký không mất gì. | Danh sách dấu hiệu hồng; đồng hồ đếm ngược bị gạch; nút "Từ chối" được khoanh, cạnh dòng "Không mất phí". | Tập 5 cảnh 09–10 (thôi không gửi thì không mất phí) |
| 09 | Kiểm tra địa chỉ nhận | Khi chính bạn gửi tiền, đầu ra quan trọng nhất là địa chỉ nhận. Địa chỉ ví thông thường có chung phần đầu, nên so phần đầu không đủ; hãy so một đoạn ở giữa và đoạn cuối với nơi bạn lấy địa chỉ. Gửi tới địa chỉ mới thì thử một khoản nhỏ trước, vì giao dịch đã được mạng ghi nhận thì không gọi lại được. | Hai chuỗi `addr1q…` xanh xếp chồng: phần đầu giống hệt bị mờ đi, khung tròn quanh một đoạn giữa và đoạn cuối; một món tiền nhỏ đi trước, món lớn đợi sau. | Tập 4 cảnh 05 (địa chỉ là ổ khoá), cảnh 10 (không đảo ngược) |
| 10 | Token lạ trong ví | Một token An không mua xuất hiện trong ví, tên của nó là lời mời ghé một trang web để nhận thưởng. Token chỉ là một tờ tiền lạ nằm trong phong bì, tức trong một món tiền, không có chương trình chạy kèm, nên tự nó không tiêu được tiền của bạn. Tên token ai cũng tự đặt được; muốn biết token thật hay giả thì xem mã chính sách, không xem tên. Rủi ro bắt đầu khi bạn theo lời mời, kết nối ví và ký, nên thói quen là lờ token lạ đi. | Phong bì vàng của tập 1 mở ra, có thêm một tờ xanh lá lạ, góc tờ có dấu vân tay cam (mã chính sách) khác với tờ quen; trên tờ ghi "Nhận thưởng tại …example" viền hồng. Mũi tên từ tờ lạ dẫn ngược về cảnh 03 và cảnh 06, bị gạch chéo. | Tập 1 cảnh 11 (phong bì); tập 8 cảnh 02, 04 (token trong món tiền, mã chính sách) |
| 11 | Ví phần cứng | Ví phần cứng giữ chìa trong một thiết bị riêng; máy tính chỉ gửi giao dịch vào, thiết bị hiện giao dịch trên màn hình của nó và chờ bạn bấm nút. Nó giữ chìa khỏi máy tính bị nhiễm mã độc, nhưng nếu bạn đồng ý một giao dịch xấu thì nó vẫn ký; cụm từ khôi phục của nó vẫn phải giấu như mọi cụm từ khác. | Thiết bị phấn nhỏ có màn hình, chìa đỏ nằm bên trong; tờ giấy đi vào, màn hình hiện địa chỉ và số tiền, hai nút xác nhận/từ chối. Cảnh báo hồng "Không đọc được giao dịch" ở một khung nhỏ. | Lần đầu chuỗi nói về ví phần cứng (tập 4 chỉ nói cất cụm từ trên giấy, cảnh 11) |
| 12 | Hiện rõ giao dịch trước khi xin ký — cho lập trình viên | Ứng dụng của bạn nên cho người dùng đọc giao dịch trước khi đưa sang ví. Trong gói core, `Deserializer.deserializeTx` mở giao dịch để đọc danh sách tham chiếu đầu vào, từng đầu ra với địa chỉ, số tiền, token, và phí. Giao dịch không ghi số tiền của đầu vào, nên muốn hiện cột đầu vào và đánh dấu tiền thối, ứng dụng tự tra các món tiền đã có và so địa chỉ đầu ra với địa chỉ ví mình. Đừng lấy tổng mọi đầu ra làm "số tiền gửi", và giải phóng đối tượng WASM sau khi đọc. | Khung code phấn: `const tx = Deserializer.deserializeTx(txCbor)` / `const body = tx.body()` / `body.inputs()   // chỉ txHash#index` / `body.outputs()` · `body.fee()` / `out.address().to_bech32()` · `out.amount().coin().to_str()` / `tx.free()`. Bên cạnh là cửa sổ xin ký đã điền, đầu ra tiền thối có nhãn "về ví mình". Nhãn "Code rút gọn". | Tập 1 cảnh 12–13 (tên riêng món tiền, UTxO Object); tập 6 |
| 13 | Xin ký, và chấp nhận lời từ chối — cho lập trình viên | Ứng dụng tự giữ chìa thì ký bằng `AppWallet.signTx` như tập bốn. Ứng dụng chạy trên trình duyệt thì xin ví của người dùng ký qua chuẩn CIP-30; ví trả về chữ ký, không trả chìa. Gói `@hydra-sdk/app-bridge` chuyển lời xin ký này cho trang web chạy trong khung nhúng; hãy đặt đúng nguồn được tin (`appCenterOrigin`) và coi việc người dùng từ chối là chuyện bình thường. | Code theo đúng thứ tự chạy: `const client = new WalletBridgeClient({ appCenterOrigin: 'https://…example' })` / `try { const witness = await client.signTx(txHex) }` / `catch (e) { if (e instanceof WalletBridgeUserRejectedError) … }`. Nhãn nhỏ "@hydra-sdk/app-bridge 0.1.0". | Tập 4 cảnh 12 (`AppWallet`) |
| 14 | Tóm tắt và lời kết | Ba ý: một, mở ví và trang quen từ dấu trang, trang nào hỏi cụm từ thì dừng lại; hai, đọc tiền đi đâu trước khi ký, không đọc được hay không hiểu thì không ký; ba, token lạ là mồi, lờ nó đi. Xem thêm tại hydrasdk.com. | Ba ý viết lần lượt, ý hai gạch chân hồng. Cuối: "hydrasdk.com" ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc dưới phải, không đọc thành lời. | Tập 4 cảnh 13 |

Ước lượng theo `script.py`: 14 cảnh, 60 câu, khoảng 5 phút 54 giây. Thứ tự cảnh đã sửa theo review agy: kiểm tra địa chỉ nhận (09) đi liền sau phần đọc giao dịch (06–08), rồi mới tới token lạ (10) và ví phần cứng (11).

## Thuật ngữ mới cần chốt cách đọc

Chưa ghi vào `promo/shared/tu-dien-doc.md` (phiên này không sửa file chung). Phần lớn thuật ngữ được đề xuất để **chỉ hiện trên bảng**, lời đọc dùng từ Việt.

| Từ | (1) Đọc nguyên văn | (2) Phiên âm đề xuất | (3) Thay bằng từ Việt | Ghi chú |
|---|---|---|---|---|
| phishing | phishing | phi sinh | trang giả mạo | Đề xuất (3); chữ "phishing" chỉ hiện trên bảng |
| blind signing | blind signing | bờ lai xai ninh | ký mù | Đề xuất (3); ghi song ngữ trên bảng ở cảnh 06 |
| hardware wallet | hardware wallet | hát que oa lét | ví phần cứng | Đề xuất (3) |
| airdrop | airdrop | e drốp | token lạ / token được tặng | Đề xuất (3); lời đọc không dùng "airdrop" |
| dApp | dApp | đi áp | trang web ứng dụng | Đề xuất (3); "dApp" chỉ hiện trên bảng cảnh 05, 13 |
| CIP-30 | CIP-30 | xíp ba mươi | chuẩn kết nối ví | Câu 05-2 và 13-1 có đọc; phương án khác đọc chữ cái "xê i pê ba mươi" |
| Deserializer | Deserializer | đi xi ri a lai dơ | hàm mở giao dịch | Cảnh 12; tên namespace trong `@hydra-sdk/core`. Phiên chính đổi lời đọc 12-1 sang từ Việt để thống nhất với tập 9 (chỉ ghi tên lớp trên bảng) |
| deserializeTx | deserializeTx | đi xi ri a lai tê ích | — | Chỉ hiện trên bảng cảnh 12; lời đọc nói "Deserializer mở giao dịch ra" |
| signTx | signTx | xai tê ích | hàm ký | Chỉ hiện trên bảng cảnh 13, không đọc |
| app-bridge | app-bridge | áp bờ rít | — | Cảnh 13, "gói áp bờ rít của hai dra ét đi cây" |
| WalletBridgeClient | WalletBridgeClient | oa lét bờ rít cờ lai ần | — | Chỉ hiện trên bảng, không đọc |
| WASM | WASM | goát dơm | — | Phiên chính đã chọn phương án bỏ khỏi lời đọc: câu 12-4 nói "giải phóng bộ nhớ của giao dịch" |
| URL / tên miền | URL | iu a eo | tên miền / địa chỉ trang web | Đề xuất (3); tránh lẫn với "địa chỉ" ví — lời đọc dùng "tên miền" |

Từ đọc trong `lines` mà chưa có trong từ điển: CIP-30, Deserializer, app-bridge, WASM (giữ nguyên dạng trong `script.py`, lexicon chưa phiên âm; số âm tiết của các câu chứa chúng hơi thấp hơn khi đọc thật). Từ đã có trong từ điển, dùng luôn: ADA, token, Cardano, hydrasdk.com, hydra-sdk, AppWallet, core. "Mã chính sách" và "tên token" là từ Việt, theo tập 1 và tập 8.

## Câu hỏi cho chủ sản phẩm

1. **Có giới thiệu `@hydra-sdk/app-bridge` trong cảnh 13 không?** Gói ở bản `0.1.0`, chưa có trong docs-v2, README mô tả gắn với hệ sinh thái HydraOne. Mặc định đề xuất: có, một câu, nhãn "0.1.0" trên bảng, **không** nhắc HydraOne; nếu chủ sản phẩm muốn tránh, cảnh 13 chỉ giữ `AppWallet.signTx` và khái niệm CIP-30.
2. **README của app-bridge ghi `const txHash = await client.signTx(...)`**, trong khi giá trị trả về là bộ chữ ký (witness set). Mặc định: video dùng tên biến `witness`; báo lại để sửa README ở phiên khác (phiên này không sửa).
3. **Tên miền minh hoạ:** mặc định dùng đuôi `.example` (dành riêng cho ví dụ, không trỏ tới trang thật). Có muốn dùng tên hư cấu trông "thật" hơn không? Đề xuất giữ `.example` để không vô tình trùng trang có thật.
4. **Ví phần cứng:** mặc định nói chung, không tên hãng, không hình thiết bị có thật. Đồng ý?
5. **Nối tập 8 (token):** đã đọc brief tập 8. Cảnh 10 dùng đúng hình ảnh "tờ tiền lạ trong phong bì", "mã chính sách" (dấu vân tay cam) và màu xanh lá cho token thường; lời đọc chỉ dựa vào tập 1 (phong bì) để không phụ thuộc thứ tự xem. Khi tập 8 có `script.py` duyệt xong, cần đối chiếu lại câu 10-2 và 10-4.
6. **Có nêu nơi báo cáo lừa đảo không** (cardano.org có nhắc địa chỉ báo cáo trên diễn đàn)? Mặc định: không, vì địa chỉ liên hệ có thể đổi và chưa kiểm chứng từ trang chính thức.
7. **Tiêu đề "phần 2":** chuỗi không có tập nào tên "Bảo mật, phần 1" (phần cảnh báo nằm ở nửa sau tập 4). Mặc định: giữ tiêu đề do phiên điều phối giao, câu 01-0 nêu rõ "ở tập bốn"; nếu muốn tiêu đề độc lập, đề xuất "Tập 12 — Ba cái bẫy khi dùng ví: trang giả, ký mù và token lạ".

## Xử lý review agy

| Mục | Quyết định (sửa / không sửa) | Lý do |
|---|---|---|
| Cảnh 12 — đầu vào chỉ là tham chiếu (cao) | Sửa | Đúng: `TransactionInput` trong CSL chỉ có `transaction_id()` và `index()`. Dàn ý, Ranh giới sự thật và câu 12-2, 12-3 đã nói giao dịch chỉ ghi tên riêng món tiền đầu vào; ứng dụng tự tra món tiền và tự so địa chỉ để đánh dấu tiền thối. |
| Cảnh 13 — thứ tự code | Sửa | Code trên bảng theo đúng thứ tự chạy: khởi tạo `WalletBridgeClient`, rồi `try` gọi `signTx`, rồi `catch` lỗi `WalletBridgeUserRejectedError`. |
| Cảnh 06, 08 — ký vội và ký mù | Sửa | Đúng theo định nghĩa của Ledger Developer Portal. Tách thành hai thuật ngữ: "ký vội" (ví hiện nhưng không đọc) và "ký mù" (ví không đọc được). Không nhận câu "điểm mạnh vượt trội của Cardano… hiếm khi bị ép ký mù" vì không có nguồn và dùng tính từ sáo rỗng. |
| Cảnh 10 cũ — so ký tự đầu không đủ | Sửa một phần | Đúng là phần đầu `addr1…` giống nhau (CIP-5, CIP-19): lời đọc nay bảo so đoạn giữa và đoạn cuối, giữ thói quen gửi thử khoản nhỏ. Không đưa tên kiểu tấn công "address poisoning" vào vì chưa có nguồn chính thức cho Cardano. |
| Cảnh 09 cũ và mục Khán giả — phụ thuộc tập 8 | Sửa | Lời đọc cảnh token lạ (nay là cảnh 10) dựa vào phong bì của tập 1, không nói "như tập tám đã nói"; mục Khán giả ghi tập 8 có ích nhưng không bắt buộc. Hình vẫn dùng ẩn dụ và màu của tập 8. |
| Vị trí cảnh kiểm tra địa chỉ | Sửa | Đưa lên làm cảnh 09, ngay sau phần đọc giao dịch; token lạ thành cảnh 10, ví phần cứng giữ cảnh 11. |
| Cảnh 11 — tham chiếu tập 4 | Sửa | Đúng, tập 4 không nói ví phần cứng. Cột nối ghi đây là lần đầu chuỗi nói tới ví phần cứng; lời đọc nói "cụm từ của nó vẫn phải giấu thật kỹ", không nói "như tập bốn". |
| Tiêu đề "phần 2" | Không sửa | Tiêu đề do phiên điều phối giao, là quyết định định vị của chủ sản phẩm; đã thêm câu hỏi 7 kèm tiêu đề thay thế. Câu 01-0 đã nêu rõ "ở tập bốn". |
| Cảnh 12 — `coin().to_str()` | Sửa | Đúng, `coin()` trả `BigNum`; bảng ghi `out.amount().coin().to_str()` (đã đối chiếu `BigNum.to_str()` trong `.d.ts`). |
| Nhận xét chung — màu nhấn | Sửa (tự phát hiện khi đọc tập 8) | Tập 8 dành cam phấn cho mã chính sách; cảnh báo của tập này đổi sang hồng phấn để cảnh 10 không lẫn hai nghĩa. |
| Nhận xét chung — mối nguy 3 bị nén một cảnh | Không sửa | Giữ một cảnh (năm câu, có đủ tình huống, dấu hiệu, thói quen) để tổng thời lượng dưới sáu phút. |

