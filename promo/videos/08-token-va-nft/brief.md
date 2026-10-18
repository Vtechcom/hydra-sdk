# Tập 8 — Token và NFT trên Cardano: tờ tiền lạ trong phong bì

## Brief

| Mục | Quyết định |
|---|---|
| Chuỗi | Kiến thức nền Cardano và Hydra, đồng thời giới thiệu hydra-sdk |
| Thể loại | Giải thích khoa học |
| Phong cách | Như tập 1: phấn trắng trên nền đen, hình hiện dần như đang được vẽ |
| Lời đọc | Tiếng Việt, giọng Hải Đăng (VieNeu), không có phụ đề chạy; chữ trên màn hình chỉ là chữ được "viết" lên bảng |
| Khung hình | 16:9, 1920×1080, 25 fps |
| Âm thanh | Giọng đọc + nền và hiệu ứng tự tổng hợp |
| Khán giả | Người chưa biết gì về blockchain, đã xem tập 1–7; đoạn ngắn cho lập trình viên ở cảnh 12–13 |
| Độ dài | Khoảng 5–6 phút (15 cảnh, trung bình khoảng 22 giây mỗi cảnh) |
| Cuối video | hydrasdk.com, kèm dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc, không đọc thành lời |

**Mạch tập:** nối từ tập 7 (lượng ADA tối thiểu của mỗi món tiền tuỳ theo kích thước), rồi mở lại chiếc phong bì ở cảnh 11 tập 1 ("một món tiền chứa được nhiều loại token, như một phong bì đựng nhiều loại tiền") và trả lời hai câu hỏi: những tờ tiền lạ ấy do ai in ra, và vì sao có tờ chỉ có đúng một bản. Tập 1 đã ghi chú "tổng vào bằng tổng ra cộng phí" bỏ qua đúc và đốt; tập này bổ sung đúng chỗ đó, tách riêng từng loại tài sản. Cụm "lượng ADA tối thiểu" dùng đúng như tập 7 (bảng thuật ngữ tập 7: min-ADA → "lượng ADA tối thiểu"), và giữ ý của tập 7 là lượng đó không phải phí. Tập 5 đã nói native script là "loại ổ khoá ghép được mà không cần viết chương trình"; tập này dùng lại đúng ý ấy cho luật đúc.

**Hình xuyên suốt:** chiếc phong bì của tập 1 (món tiền chưa tiêu) mở ra trên bảng. Bên cạnh là một con dấu in tiền tượng trưng cho luật đúc; mỗi tờ token mang một dấu vân tay nhỏ in ở góc, chính là mã chính sách. Màu nhấn cố định: món tiền và ADA giữ vàng phấn như tập 1; token thường (điểm tích luỹ) xanh lá phấn; NFT (thẻ hội viên) tím phấn; dấu vân tay mã chính sách cam phấn; con dấu luật đúc trắng (như bánh răng script ở tập 5); ổ khoá thời gian vẽ thêm một mặt đồng hồ nhỏ trắng.

**Ví dụ xuyên suốt:** quán cà phê của tập 1 phát hành hai thứ. Thứ nhất là "điểm tích luỹ", token tên `DIEM`, đúc nhiều đơn vị, khách mua cà phê được tặng điểm, đổi quà thì quán đốt điểm. Thứ hai là "thẻ hội viên sáng lập số 01", một NFT tên `SangLap01`, chỉ có một bản. Đây là **ví dụ minh hoạ**: không có quán, token hay NFT nào như vậy trên mạng; mã chính sách và số liệu trên bảng là chuỗi rút gọn dựng lại (`a3f9…7c`), không phải giá trị thật.

## Nguồn tham khảo

Code hydra-sdk (đã mở đọc, nhánh `claude/cardano-hydra-video-series-c086de`, 16/10/2026):

- `packages/core/src/utils/policy.ts` — `PolicyUtils` có bốn hàm: `buildPolicyScriptFromPubkey({ type: 'sig', keyHash })`, `buildMintingPolicyScriptFromAddress(addressBech32)`, `buildMintingPolicyScriptFromKeyHash(keyHashHex)`, `policyIdFromNativeScript(scriptHex)`. Ba hàm "build" chỉ dựng native script một chữ ký (`ScriptPubkey`), trả về chuỗi CBOR hex. `policyIdFromNativeScript` nhận native script hex bất kỳ (`NativeScript.from_hex(...).hash()`), nên dùng được cho script có khoá thời gian dựng ở nơi khác. Đã chạy thử với `cardano-serialization-lib-nodejs` trong repo: chuỗi trả về (`8200581c…`) trùng với `NativeScript.to_hex()`, và mã băm tính ra giống nhau.
- `packages/core/src/utils/plutus-script.util.ts` — `PlutusUtils.mintingPolicyToId(mintingPolicy)` gọi `validatorToScriptHash`, nhận `{ type: 'PlutusV1' | 'PlutusV2' | 'PlutusV3' | 'Native', scriptCborHex }` (kiểu `MintingPolicy = Script` trong `packages/core/src/types/cardano/plutus-script.ts`).
- `packages/core/src/utils/metadata.ts` — `MetadataUtils.metadataObjToMetadatum(value)`: đổi object, Map, mảng, chuỗi, số nguyên, byte thành metadata giao dịch; chuỗi và byte tối đa 64 byte (`METADATA_MAX_TEXT_BYTES`, `METADATA_MAX_BYTES`), số phải là số nguyên.
- `packages/core/src/types/cardano/asset-metadata.ts` — kiểu `AssetMetadata`, `FungibleAssetMetadata` (`ticker`, `decimals`, `version`), `NonFungibleAssetMetadata` (`ImageAssetMetadata` với `files`, `artists`, `attributes`, `traits`), `RoyaltiesStandard`; danh sách khoá `metadataStandardKeys` (`name`, `image`, `mediaType`, `description`…); hàm `metadataToCip68`. Được xuất qua `export * from './types/cardano'` trong `packages/core/src/index.ts`.
- `packages/core/src/utils/parser.ts` — `ParserUtils.stringToHex`; `toBytes(hex)` coi chuỗi là hex nếu độ dài chẵn và chỉ gồm ký tự hex, nếu không thì mã hoá UTF-8.
- `packages/core/src/utils/cardano-wasm/serializer.ts` — `Serializer.serializeAssetUnit(policyId, assetName)` trả về `policyId + assetName` (nối liền, không có dấu chấm).
- `packages/core/src/utils/redeemer.ts` — `RedeemerUtils.mkMintRedeemer(data)` (redeemer gắn nhãn `mint`).
- `packages/hydra-transaction/src/tx-builder/index.ts` — `mint(quantity, policyId, assetName)` (số lượng âm là đốt, đưa vào `Int.from_str`); `mintingScript({ type, scriptCborHex })` gắn script cho lần `mint` gần nhất; `mintRedeemerValue(redeemer)` cho luật Plutus; `_addMintToBuilder` báo lỗi nếu mã băm của script khác `policyId` ("Mint policy ID does not match script hash"); tên token đi qua `ParserUtils.toBytes`; `metadataValue(label, value)` dùng `metadataObjToMetadatum`; `invalidBefore(slot)`, `invalidAfter(slot)`; `mintPlutusScript(version)` hiện là hàm rỗng (no-op), giữ lại cho tương thích.
- `packages/hydra-transaction/src/types/index.ts` — `PolicyScript`, `MintAsset { assetName, quantity, policyId, policyScript?, redeemer? }`.
- `apps/playground/lib/tx-fixtures.ts` — preset "Mint a native token": `buildMintingPolicyScriptFromAddress` + `policyIdFromNativeScript`, đúc 1000 token tên hex `4859445241` ("HYDRA"), đầu ra kèm 2 ADA.

Tài liệu hydra-sdk (docs-v2):

- `apps/docs-v2/content/en/2.guides/4.mint-burn-tokens.md` — đúc bằng `mint('1000000', policyId, assetNameHex)` + `mintingScript({ type: 'Native', scriptCborHex })` + `metadataValue(721, { [policyId]: { [assetNameHex]: {...} } })`; đốt bằng `mint('-1000000', …)`; tên token đổi sang hex bằng `ParserUtils.stringToHex`. Hướng dẫn chạy trên Cardano preprod (L1), không phải trong Hydra Head.
- `apps/docs-v2/content/en/2.guides/3.transactions.md`, mục "Minting and burning tokens".
- `apps/docs-v2/content/en/3.concepts/5.smart-contracts-in-hydra.md`, "Notes & Best Practices": luật đúc Plutus vẫn chạy trong Head nếu không phụ thuộc dữ liệu riêng của L1 hay thời gian.
- `apps/docs-v2/content/en/3.concepts/1.index.md`: "Native tokens and NFTs" trong danh sách Head hỗ trợ; ví dụ chuyển NFT trong Head bằng `TxBuilder({ isHydra: true })`.
- `apps/docs-v2/content/en/4.api/6.utilities.md`, mục Policy Utilities.

Nguồn ngoài (truy cập 16/10/2026):

- Cardano Developer Portal, "What Are Native Tokens" — https://developers.cardano.org/docs/developers/curriculum/native-tokens/overview/ — token do sổ cái theo dõi trực tiếp cạnh ADA, chuyển token không chạy hợp đồng; policy ID là mã băm 28 byte (56 ký tự hex) của luật đúc; asset name tối đa 32 byte, có thể rỗng; hai token chỉ cùng loại khi trùng cả policy ID và asset name; khác biệt duy nhất trên chuỗi giữa token thường và NFT là số lượng; mỗi món tiền mang token phải kèm lượng ADA tối thiểu, tăng theo kích thước, tính bằng `coinsPerUtxoByte` (tham số do quản trị mạng quyết định) nhân kích thước đầu ra; "không gửi được chỉ một token".
- Cardano Developer Portal, "Minting Policies" — https://developers.cardano.org/docs/developers/curriculum/native-tokens/minting-policies/ (cập nhật 01/10/2026) — luật đúc chạy mỗi khi giao dịch đúc hoặc đốt dưới mã chính sách đó; số dương là đúc, số âm là đốt; luật đúc nhận redeemer và ngữ cảnh, không có datum; native script gồm chữ ký và khoá thời gian (`all [ before slot, sig ]`), là cách thường dùng để khoá NFT hay bộ sưu tập; luật Plutus "one-shot" đòi tiêu một món tiền cụ thể nên chỉ đúc được đúng một lần.
- Cardano Developer Portal, "Mint an NFT" — https://developers.cardano.org/docs/developers/curriculum/native-tokens/mint-nft/ — NFT số lượng 1, luật đúc có khoá thời gian, metadata CIP-25; min ADA đi cùng NFT.
- Cardano Docs, "Minimum ada value requirement" — https://docs.cardano.org/native-tokens/minimum-ada-value-requirement/ — công thức (160 + kích thước đầu ra theo byte) × `coinsPerUTxOByte`; đầu ra chỉ có token mà không có ADA là không được (đối chiếu qua kết quả tìm kiếm, trang hiển thị bằng JavaScript nên không tải được toàn văn).
- Cardano Docs, "Learn about native tokens" — https://docs.cardano.org/native-tokens/learn/ — asset ID gồm policy ID và asset name (đối chiếu qua kết quả tìm kiếm, cùng lý do).
- CIP-25 — https://cips.cardano.org/cip/CIP-0025 — nhãn metadata 721, gắn vào giao dịch đúc; `name`, `image` bắt buộc; `files`, `mediaType`, `description` tuỳ chọn; muốn cập nhật phải đúc lại, chỉ khi luật đúc còn cho phép.
- CIP-68 — https://cips.cardano.org/cip/CIP-0068 — metadata nằm trong datum của một đầu ra giữ "reference NFT" (nhãn 100), đi cặp token người dùng (222 cho NFT, 333 cho FT); người phát hành chọn script khoá nên metadata có thể cố định hoặc sửa được; script Plutus đọc được; tiền tố nhãn theo CIP-67.
- Hydra, "Known issues and limitations" — https://hydra.family/head-protocol/docs/known-issues — token được đúc mà chưa đốt trong một Head đang mở sẽ làm Head không kết thúc trọn (finalize) được; partial fanout vẫn trả các món khác, nhưng món mang token ấy và giao dịch cuối không trả ra được; issue https://github.com/cardano-scaling/hydra/issues/2334. Đối chiếu thêm bản local `hydra/docs/docs/known-issues.md` và `docs/dev/architecture/partial-fanout.md` (commit `8a1208d75`, 09/10/2026).
- Hydra, "Configuration → Ledger parameters" (bản local `hydra/docs/docs/configuration.md` và `CHANGELOG.md`, mục UNRELEASED, PR #2815, 08/2026) — file tham số mẫu cho L2 đã đặt lại `utxoCostPerByte` = 4310 như mainnet để món tiền nào cũng trả ra L1 được; trước đó (bản 2.2.0) giá trị này là 0. Nghĩa là lượng ADA tối thiểu trong Head phụ thuộc cấu hình của từng Head.
- Hydra, "Auctions" — https://hydra.family/head-protocol/use-cases/auctions — Cardano tính token không phải ADA ngay trong sổ cái cạnh ADA, không cần hợp đồng riêng.

## Ranh giới sự thật

Được nói (đã đối chiếu):

- Trên Cardano, token nằm ngay trong món tiền chưa tiêu, cạnh ADA; sổ cái tự theo dõi token như theo dõi ADA. Chuyển token giữa các ví là một giao dịch bình thường (tiêu món cũ, sinh món mới); bản thân token không cần một hợp đồng giữ sổ số dư như ở Ethereum (Developer Portal "What Are Native Tokens": "without a smart contract for basic transfers"; hydra.family "Auctions"). Món tiền mang token mà đang khoá bằng script (như chiếc két của tập 5) thì khi tiêu vẫn phải qua script đó, nên lời đọc nói "giữa các ví".
- Ở Ethereum, mỗi token thường là một hợp đồng giữ sổ riêng ai có bao nhiêu (ERC-20, ERC-721); mỗi lần chuyển là một lần gọi hợp đồng, tốn phí gas và có thể thất bại theo logic của hợp đồng (cùng nguồn). Lời đọc nói "thường là", không khẳng định mọi token trên Ethereum.
- Một món tiền chứa được ADA và nhiều loại token cùng lúc (giá trị là bảng `policyId → assetName → số lượng`, khớp `UTxOObject.value` ở tập 1).
- Mỗi token gắn với một luật đúc (minting policy). Luật đúc chạy mỗi khi giao dịch đúc hoặc đốt token dưới mã chính sách đó, phải trả lời "có" thì giao dịch mới hợp lệ.
- Mã chính sách (policy ID) là mã băm của luật đúc, dài 28 byte, viết ra là 56 ký tự hex. Đổi luật thì mã đổi, nên luật gắn chặt với danh tính token.
- Tên token (asset name) phân biệt các token trong cùng một mã chính sách, tối đa 32 byte, có thể để trống. Hai token chỉ là cùng một loại khi trùng cả mã chính sách lẫn tên; cùng tên mà khác mã chính sách là hai token khác nhau.
- Đúc là số lượng dương trong phần "đúc" của giao dịch, đốt là số lượng âm. Phép cân bằng tính riêng cho từng loại tài sản: với token, tổng vào cộng phần đúc bằng tổng ra (đốt là phần đúc mang dấu âm); với ADA, tổng vào bằng tổng ra cộng phí. Phí luôn trả bằng ADA (lovelace), không trả bằng token (tập 7).
- Luật đúc có hai loại: native script (chữ ký, khoá thời gian, ghép bằng "tất cả / một trong / ít nhất k trong n") và script Plutus. Luật đúc Plutus nhận redeemer và ngữ cảnh giao dịch, không có datum.
- Trên chuỗi, khác biệt duy nhất giữa token thường và NFT là số lượng: NFT có số lượng đúng một.
- Số lượng một chưa đủ để NFT là duy nhất: nếu luật đúc vẫn cho phép, người phát hành (người ký được theo luật) có thể đúc thêm. Cách thường dùng là luật "chữ ký của người phát hành và chỉ trước một mốc thời gian"; qua mốc đó, không ai đúc thêm được nữa dưới mã chính sách này, ai cũng tự kiểm tra được bằng cách đọc luật (vì mã chính sách là mã băm của luật).
- Trước mốc, người xem phải tin người phát hành không đúc thêm. Luật Plutus "one-shot" đòi tiêu một món tiền cụ thể; mỗi món tiền chỉ tiêu được một lần (tập 1) nên luật chỉ đúng được một lần, đây là cách đảm bảo duy nhất mà không cần tin người phát hành.
- CIP-25: tên, ảnh, mô tả ghi trong metadata của giao dịch đúc, nhãn 721; ví và trang tra cứu đọc phần này. Script không đọc được metadata giao dịch.
- CIP-68: thông tin nằm trong datum của một món tiền riêng giữ token tham chiếu (nhãn 100), đi cặp với token người dùng cầm (nhãn 222 cho NFT); script đọc được, và sửa được nếu script khoá món tiền đó cho phép.
- Mỗi món tiền mang token phải kèm một lượng ADA tối thiểu, tăng theo kích thước món tiền; không gửi được "chỉ token". Mục đích là chặn việc tạo vô số món tiền nhỏ làm phình sổ cái. Lượng đó không phải phí, vẫn nằm trong món tiền và thuộc về người nhận (tập 7; Developer Portal: "the surplus stays spendable by the recipient").
- Món tiền mang token nạp vào Hydra Head được giao dịch trong Head như món tiền thường (cùng mô hình eUTxO, tập 2, tập 6; docs-v2 "Native tokens and NFTs").
- Token đúc bên trong Head mà chưa đốt trước khi đóng sẽ làm Head không kết thúc trọn được; các món tiền khác vẫn trả ra được bằng partial fanout, còn món mang token đó và phần cuối thì không (hydra.family known issues, truy cập 16/10/2026). Lời đọc nói theo điều kiện: "nếu đúc trong Head thì cần đốt trước khi đóng".
- API cảnh 12–13 đúng tên hiện có: `PolicyUtils.buildMintingPolicyScriptFromAddress`, `PolicyUtils.policyIdFromNativeScript`, `PlutusUtils.mintingPolicyToId`, `ParserUtils.stringToHex`, `TxBuilder.mint`, `.mintingScript`, `.mintRedeemerValue`, `.metadataValue`, `.invalidAfter`, `Serializer.serializeAssetUnit`.
- `PolicyUtils` chỉ dựng được luật một chữ ký. Luật có khoá thời gian phải dựng bằng công cụ khác (ví dụ `cardano-cli`), rồi đưa chuỗi hex vào `mintingScript({ type: 'Native', scriptCborHex })`; mã chính sách tính bằng `PlutusUtils.mintingPolicyToId` hoặc `PolicyUtils.policyIdFromNativeScript`.
- `TxBuilder` tự kiểm tra mã băm của luật khớp `policyId` đã khai, sai thì báo lỗi trước khi dựng.

Đơn giản hoá có chủ ý (không nói sai, nhưng lược bớt):

- "Mốc thời gian" thay cho slot; không giải thích quy đổi slot. Giao dịch đúc dưới luật `before` cần đặt khoảng hiệu lực kết thúc trước mốc (`invalidAfter`), nối ý "ổ khoá không có đồng hồ" của tập 5, chỉ hiện trên bảng ở cảnh 13 (lời đọc nói "hạn hiệu lực trước mốc").
- "Qua mốc thì không đúc thêm được": luật native script không phân biệt đúc hay đốt, nên qua mốc cũng không đốt được nữa. Lời đọc chỉ nói "không ai đúc thêm"; bảng có thể ghi nhỏ "cũng không đốt được".
- "Người phát hành có thể đúc thêm trước mốc": họ có thể đúc thêm cùng tên, hoặc đúc nhiều tên khác nhau dưới cùng mã chính sách (một bộ sưu tập). Không đi vào bộ sưu tập.
- Không đọc con số lượng ADA tối thiểu. Developer Portal ước khoảng 1,2 ADA cho một món chứa một token (trang "What Are Native Tokens", truy cập 16/10/2026) và nói con số đổi theo nội dung món tiền và theo quyết định quản trị mạng. Nếu chủ sản phẩm muốn có số trên bảng, ghi "khoảng 1,2 ADA, ước lượng của developers.cardano.org, 10/2026".
- Ảnh của NFT thường không nằm trên chuỗi; `image` trong CIP-25 là một đường dẫn (URI), hay gặp `ipfs://`. Lời đọc nói "thường chỉ là đường dẫn tới ảnh", không giải thích IPFS.
- CIP-68 chỉ nói ở mức "thông tin nằm trong một món tiền riêng, script đọc được"; không giải thích tiền tố CIP-67, các nhãn 333 và 444.
- "Token không cần hợp đồng": nói cho việc chuyển token. Bản thân luật đúc là một script; tập 5 đã gọi native script là "ổ khoá đơn giản, không cần viết chương trình", tập này giữ cách nói đó.
- Tập 1 có câu "Token thì ghi theo mã chính sách và tên token"; tập này giữ đúng hai cụm "mã chính sách" và "tên token".

Không dùng:

- `TxBuilder.mintPlutusScript(version)`: hiện là hàm rỗng (chú thích trong code: "Currently a no-op"). Không đưa lên bảng.
- `metadataToCip68` (`packages/core/src/types/cardano/asset-metadata.ts`): trả về dữ liệu theo định dạng `Data` của Mesh, chưa có tài liệu, chưa thấy test hay ví dụ dùng cùng `TxBuilder`. Cảnh 10 nói CIP-68 như khái niệm, không gắn với hàm này.
- Native script nhiều chữ ký hay có khoá thời gian trong hydra-sdk: `PolicyUtils` chưa có hàm dựng `before` / `after` / `all` (giống ghi chú ở tập 5). Cảnh 13 ghi rõ luật có khoá thời gian "dựng bằng công cụ khác".
- `txInCollateral` trong cảnh đúc bằng native script: hướng dẫn `4.mint-burn-tokens.md` có thêm collateral, nhưng tiền thế chấp chỉ cần khi giao dịch chạy script Plutus (tập 5, cảnh 12). Cảnh 12 không đưa collateral vào để tránh hiểu nhầm.
- Dạng unit `${policy}.${name}` (có dấu chấm) trong ví dụ của `3.concepts/1.index.md`: SDK nối liền `policyId + assetNameHex` (`Serializer.serializeAssetUnit`, preset playground). Bảng dùng dạng nối liền.
- Mô tả "Returns: Script in JSON format" của `PolicyUtils` trong `4.api/6.utilities.md`: code trả về chuỗi CBOR hex. Video không nói về định dạng trả về.
- Câu "`utxoCostPerByte` bằng 0 trên L2, một giao dịch trong Head chỉ cần 1 lovelace" trong `3.concepts/6.hydra-v2-changes.md`: đúng với file tham số mẫu của bản 2.2.0, nhưng hydra đã đổi lại 4310 (CHANGELOG UNRELEASED, PR #2815). Video không nói về lượng ADA tối thiểu trong Head.
- Đúc NFT có khoá thời gian bên trong Head: mốc thời gian trong Head tính theo cách riêng (tập 5, cảnh 14) và token đúc trong Head phải đốt trước khi đóng, nên không dùng làm ví dụ.
- Số liệu về số lượng token, NFT trên mạng, giá NFT, phí đúc.
- Tên dự án NFT, token thật (SpaceBudz, HOSKY…), dù nguồn có nhắc.

## Dàn ý cảnh

| Cảnh | Tiêu đề | Ý chính (1–3 câu, nói điều gì) | Hình gợi ý | Nối với tập khác |
|---|---|---|---|---|
| 01 | Mở đầu | Ở tập trước, ta thấy mỗi món tiền phải giữ một lượng ADA tối thiểu, và lượng đó tuỳ theo kích thước món tiền. Một món tiền to ra khi nó chứa thêm token, như chiếc phong bì đựng nhiều loại tiền ở tập một. Hôm nay ta hỏi tiếp: những tờ tiền lạ ấy do ai in, và vì sao có tờ chỉ có đúng một bản. | Phong bì vàng phấn của tập 1 vẽ lại, bên trong có đồng ADA vàng, vài tờ xanh lá và một tờ tím; dấu chấm hỏi trên tờ tím. | Tập 7, cảnh 09 (lượng ADA tối thiểu); tập 1, cảnh 11 |
| 02 | Token không cần hợp đồng riêng | Ở Ethereum, một token thường là một hợp đồng giữ cuốn sổ riêng ai có bao nhiêu, mỗi lần chuyển là một lần gọi hợp đồng. Trên Cardano, chính sổ cái ghi token ngay trong món tiền, cạnh ADA; chuyển token giữa các ví cũng là tiêu món cũ, sinh món mới như chuyển ADA, không cần hợp đồng nào giữ sổ cho token. | Hai cột: bên trái một hộp "hợp đồng" ôm cuốn sổ con; bên phải phong bì đi qua giao dịch như tập 1, token nằm trong phong bì cạnh đồng ADA. | Tập 1 (mô hình tài khoản và UTxO) |
| 03 | Ai được in tiền mới? | Ai cũng tạo được token, nhưng mỗi loại token gắn với một luật đúc, quy định ai được đúc, khi nào và bao nhiêu. Mỗi lần giao dịch đúc hay đốt token loại đó, luật đúc được kiểm tra, trả lời có thì mới hợp lệ. | Con dấu in tiền màu trắng; dưới con dấu là tờ "luật đúc" ghi "cần chữ ký của chủ quán". Một giao dịch đi qua con dấu, nhận dấu tích. | Tập 4 (chữ ký là bằng chứng có chìa); tập 5 (script trả lời có hoặc không) |
| 04 | Mã chính sách và tên token | Mã chính sách là dấu vân tay của luật đúc, dài năm mươi sáu ký tự; đổi một chữ trong luật là dấu vân tay đổi hẳn. Tên token phân biệt các loại trong cùng một luật. Hai token chỉ cùng loại khi trùng cả hai; cùng tên mà khác mã chính sách là hàng khác, nên muốn biết thật giả thì nhìn mã chính sách. | Tờ token xanh lá có dấu vân tay cam ở góc và chữ `DIEM`. Bên cạnh một tờ giả cũng ghi `DIEM` nhưng dấu vân tay khác, bị gạch chéo. Bảng ghi `a3f9…7c` + `DIEM`. | Tập 1, cảnh 12 (dấu vân tay); tập 4 (dấu vân tay của khoá) |
| 05 | Đúc và đốt | Giao dịch có thêm một phần "đúc": số dương là đúc thêm, số âm là đốt bớt. Quán cà phê đúc một nghìn điểm tích luỹ, tặng khách; khách đổi quà thì quán đốt số điểm đó. Phép cân bằng của tập một và tập bảy tính riêng cho từng loại: với điểm, vào cộng phần đúc bằng ra; phí thì luôn trả bằng ADA. | Hai phương trình xếp chồng: dòng vàng "ADA: vào = ra + phí", dòng xanh lá "DIEM: vào + đúc = ra". Dòng `+1000 DIEM` rồi `−50 DIEM`; tờ bị đốt cháy thành tro phấn. Đồng phí cam chỉ nằm ở dòng ADA. | Tập 1, tập 7 (vào bằng ra cộng phí) |
| 06 | Token không đi một mình | Vì món tiền mang token to hơn, nó cần lượng ADA tối thiểu nhiều hơn món chỉ có ADA. Không gửi được một token trơn; ví gửi kèm một ít ADA, và như tập trước đã nói, số ADA đó không phải phí, vẫn thuộc về người nhận. | Phong bì chỉ có tờ xanh lá bị trả lại (dấu chéo); phong bì có thêm đồng ADA vàng thì đi qua. Vạch đáy "tối thiểu" của tập 7 vẽ cao hơn ở phong bì có token. Không ghi con số (xem câu hỏi 2). | Tập 7, cảnh 09 |
| 07 | Luật đúc làm bằng gì? | Luật đúc đơn giản nhất chỉ cần một chữ ký, hoặc ghép thêm khoá thời gian, đúng loại ổ khoá ghép được ở tập năm. Khi cần luật phức tạp hơn, luật đúc là một script Plutus, nhận tờ đơn (redeemer) và giao dịch, không có tờ ghi chú. | Hai con dấu: một con dấu đơn giản có ổ khoá chữ ký và đồng hồ nhỏ; một con dấu có bánh răng (Plutus). Dòng nhỏ "luật đúc: không có datum". | Tập 5, cảnh 03 và 06 |
| 08 | NFT: chỉ một bản | Về kỹ thuật, NFT cũng là token như điểm tích luỹ, chỉ khác số lượng là đúng một. Nhưng số lượng một chưa nói hết: nếu luật đúc vẫn mở, người có chữ ký hợp lệ có thể đúc thêm bản thứ hai. | Tờ tím `SangLap01 × 1`. Con dấu vẫn đặt cạnh, in ra bản thứ hai mờ mờ, có dấu hỏi. | — |
| 09 | Khoá luật sau một mốc | Cách thường dùng là luật "cần chữ ký của quán, và chỉ trước một mốc thời gian". Qua mốc, không ai đúc thêm được dưới mã chính sách này, và ai cũng tự kiểm tra được vì luật gắn với dấu vân tay. Trước mốc thì người mua vẫn phải tin người phát hành. | Con dấu có mặt đồng hồ; kim chạy qua vạch mốc thì con dấu bị khoá xích lại. Dấu vân tay cam sáng lên. Ghi nhỏ "sau mốc: không đúc, cũng không đốt được". | Tập 5, cảnh 08 (ổ khoá không có đồng hồ) |
| 10 | Một lần duy nhất | Muốn chắc chắn hơn, luật Plutus có thể đòi tiêu một món tiền cụ thể khi đúc. Mỗi món tiền chỉ tiêu được một lần, nên luật ấy chỉ đúng được một lần trong lịch sử, không cần tin ai. | Một món tiền vàng mang tên `a1b2…f9#0` bị tiêu, gạch đi; con dấu bánh răng in đúng một tờ tím; lần thử thứ hai bị đóng dấu "Từ chối" như tập 1. | Tập 1, cảnh 09 (mỗi món tiêu một lần) |
| 11 | Tên và ảnh của NFT | Tên, mô tả và đường dẫn tới ảnh được ghi kèm theo chuẩn chung. Cách phổ biến (CIP-25) ghi vào giao dịch đúc để ví và trang tra cứu đọc. Cách mới hơn (CIP-68) cất thông tin trong tờ ghi chú của một món tiền riêng, nên script đọc được và có thể cập nhật nếu luật cho phép. | Bên trái: giao dịch đúc kèm tấm thẻ "CIP-25: name, image". Bên phải: món tiền riêng mang tờ ghi chú xanh lam (datum) và nhãn "token tham chiếu", nối bằng dây với nhãn "token của khách" trong ví khách. Không ghi số nhãn 100, 222. Ảnh vẽ là khung tranh có mũi tên "đường dẫn". | Tập 5 (datum là tờ ghi chú) |
| 12 | Đúc token — cho lập trình viên | Trong hydra-sdk, `PolicyUtils` dựng luật đúc một chữ ký từ địa chỉ ví và tính ra mã chính sách. `TxBuilder` nhận lệnh đúc với số lượng, mã chính sách và tên token dạng hex, kèm luật đúc; số âm là đốt. Đầu ra kèm hai ADA, mức dư so với lượng tối thiểu. | Code phấn: `buildMintingPolicyScriptFromAddress(addr)` → `policyIdFromNativeScript(script)` → `stringToHex('DIEM')` → `.mint('1000', policyId, assetHex).mintingScript({ type: 'Native', scriptCborHex })`; đầu ra `serializeAssetUnit(policyId, assetHex)` kèm `2 ADA` và ghi chú nhỏ "dư so với mức tối thiểu". Nhãn "Code rút gọn, bản đầy đủ ở hydrasdk.com". | Tập 6 (`TxBuilder`, `setInputs`, `changeAddress`) |
| 13 | NFT và metadata — cho lập trình viên | Với NFT, đúc số lượng một và gắn thông tin mô tả theo nhãn bảy trăm hai mươi mốt; tên hiển thị viết bằng chữ thường, khác với tên token dạng hex. Luật có khoá thời gian hiện phải dựng bằng công cụ khác như cardano-cli; hydra-sdk nhận chuỗi script đó, tính mã chính sách bằng cùng hàm ở cảnh 12, và giao dịch đặt hạn hiệu lực trước mốc. Luật Plutus thì thêm redeemer cho phần đúc. | Code phấn: `policyIdFromNativeScript(timeLockedScriptHex)`, `.mint('1', policyId, assetHex)`, `.mintingScript({ type: 'Native', … })`, `.invalidAfter(lockSlot)`, `.metadataValue(721, { [policyId]: { [assetHex]: { name: 'Thẻ sáng lập 01', image: 'ipfs://…' } } })`. Ghi chú nhỏ: "script có khoá thời gian: dựng ngoài SDK"; "Plutus: `mintingPolicyToId`, `mintRedeemerValue`". | Tập 5, cảnh 12 (`invalidBefore`, redeemer) |
| 14 | Token trong Hydra Head | Món tiền mang token nạp vào Hydra Head được giao dịch như mọi món tiền khác, vì Head dùng cùng mô hình eUTxO. Nếu đúc token mới bên trong Head, cần đốt chúng trước khi đóng; nếu không, Head không kết thúc trọn được và món tiền mang token đó không trả về mạng chính. | Vòng tròn Hydra Head của tập 2; phong bì có tờ xanh lá đi vào, đổi chủ bên trong, đi ra. Một tờ đúc trong Head mang nhãn đỏ "đốt trước khi đóng"; mũi tên ra ngoài của nó bị chặn. | Tập 2, tập 3 (đóng và trả về) |
| 15 | Tóm tắt và lời kết | Thứ nhất, token nằm ngay trong món tiền cạnh ADA, sổ cái tự theo dõi. Thứ hai, mỗi token mang mã chính sách là dấu vân tay của luật đúc; luật quyết định ai đúc, ai đốt. Thứ ba, NFT là token chỉ có một bản, và luật đúc bị khoá lại để không ai đúc thêm. | Ba ý viết lần lượt. Cuối: "hydrasdk.com" ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc dưới phải, không đọc thành lời. | Như cảnh cuối các tập trước |

## Thuật ngữ mới cần chốt cách đọc

Chưa ghi vào `promo/shared/tu-dien-doc.md` (phiên này không sửa file chung). Các từ đã chốt dùng lại: token "tốc cừn", script "scờ ríp", datum "đa từm", UTxO, Cardano, Ethereum, Hydra Head, TxBuilder; đang đề xuất: ADA, redeemer, Plutus, PlutusUtils, RedeemerUtils, core, code.

| Từ | (1) Đọc nguyên văn | (2) Phiên âm đề xuất | (3) Thay bằng từ Việt | Ghi chú |
|---|---|---|---|---|
| NFT | NFT | en ép ti | token độc bản | Đề xuất (2); viết tắt đọc theo chữ cái tiếng Anh vì giới làm nghề nói vậy |
| policy ID | policy ID | pô li xi ai đi | mã chính sách | Đề xuất (3), giữ đúng cụm của tập 1 câu 13-3; bảng ghi "policy ID" |
| minting policy | minting policy | min tinh pô li xi | luật đúc | Đề xuất (3); chỉ hiện trên bảng |
| asset name | asset name | ét xét nêm | tên token | Đề xuất (3), giữ cụm của tập 1 |
| native token | native token | nây tịp tốc cừn | token gốc của Cardano | Đề xuất (3), hoặc chỉ nói "token"; chỉ hiện trên bảng |
| native script | native script | nây tịp scờ ríp | luật đơn giản | Đề xuất (3), nối với "ổ khoá đơn giản" của tập 5 |
| mint / burn | mint / burn | min / bơn | đúc / đốt | Đề xuất (3); `mint` trong code đọc "hàm mint" thì dùng (2) "min" |
| metadata | metadata | mê ta đây ta | thông tin mô tả | Đề xuất (3) cho cả tập, chỉ viết "metadata" trên bảng |
| CIP-25 | CIP-25 | xíp hai lăm | chuẩn hai lăm | Đề xuất (2) |
| CIP-68 | CIP-68 | xíp sáu tám | chuẩn sáu tám | Đề xuất (2) |
| PolicyUtils | PolicyUtils | pô li xi iu tiu | — | Theo mẫu "PlutusUtils" |
| MetadataUtils | MetadataUtils | mê ta đây ta iu tiu | — | Chỉ nếu cảnh 13 nhắc tên; hiện chưa cần đọc |
| hex | hex | hếch | dạng thập lục phân | Đề xuất (2) trong cụm "tên token dạng hếch" (cảnh 12) |
| cardano-cli | cardano-cli | Ca đa nô xi eo ai | công cụ dòng lệnh của Cardano | Đề xuất (3) cho lời đọc, bảng ghi tên thật |
| DIEM, SangLap01 | — | — | "điểm", "sáng lập không một" | Tên token minh hoạ, chỉ viết trên bảng; lời đọc dùng từ Việt |

Dạng viết hoa đầu câu: `lexicon.py` đã tự khớp, không cần thêm dòng riêng. Không bắt đầu câu bằng "NFT" nếu cách đọc chưa được nghe thử.

Tên hàm và tên kiểu (`mintingPolicyToId`, `invalidAfter`, `stringToHex`, `metadataValue`…) chỉ viết trên bảng; lời đọc nói bằng từ Việt ("tính mã chính sách", "hạn hiệu lực trước mốc", "đổi sang dạng hex", "thông tin mô tả"). Lời đọc chỉ gọi tên `PolicyUtils` và `TxBuilder`. Vì "NFT" và "PolicyUtils" chưa có trong từ điển, `lexicon.syllables` đếm mỗi từ là một âm tiết (đọc thật là ba và năm), nên các câu chứa hai từ này đã được giữ dưới 25 âm tiết theo cách đếm của script.

## Câu hỏi cho chủ sản phẩm

1. **Cụm cho policy ID.** Tập 1 đã đọc "mã chính sách", còn tập này gọi minting policy là "luật đúc", nên người xem có thể không nối được "chính sách" với "luật". Mặc định đề xuất: giữ "mã chính sách" cho thống nhất với tập 1, và cảnh 04 nói một câu nối: "mã chính sách chính là dấu vân tay của luật đúc". Phương án khác: đổi thành "mã luật đúc" ở tập này và sửa câu 13-3 của tập 1.
2. **Con số lượng ADA tối thiểu.** Mặc định: không đọc số, bảng không ghi số (con số đổi theo kích thước món tiền và theo quyết định quản trị mạng). Phương án khác: bảng ghi nhỏ "khoảng 1,2 ADA cho một món chứa một token, ước lượng của developers.cardano.org, 10/2026".
3. **Cảnh 14, hạn chế khi đúc trong Hydra Head.** Mặc định: giữ một câu "đúc trong Head thì cần đốt trước khi đóng", vì đây là rủi ro mất quyền rút tiền mà tài liệu Hydra nêu ở mục known issues. Phương án khác: bỏ phần đúc trong Head, chỉ nói token chuyển được trong Head.
4. **Cảnh 10 (luật Plutus one-shot).** Mặc định: giữ, vì đây là câu trả lời đầy đủ cho "duy nhất" mà không cần tin người phát hành, và nối được với ý "mỗi món chỉ tiêu một lần" của tập 1. Phương án khác: gộp thành một câu cuối cảnh 09 để rút còn 14 cảnh.
5. **Ví dụ xuyên suốt.** Mặc định: quán cà phê của tập 1 (điểm tích luỹ + thẻ hội viên sáng lập). Phương án khác: dùng lại ba anh em An, Bình, Chi của tập 5.
6. **Lệch giữa docs-v2 và code/hydra mà phiên này tìm thấy** (không ảnh hưởng lời đọc vì video đã tránh): `4.api/6.utilities.md` ghi `PolicyUtils` trả về "JSON" trong khi code trả CBOR hex; `3.concepts/1.index.md` dùng unit có dấu chấm; `2.guides/4.mint-burn-tokens.md` thêm collateral cho luật native; `3.concepts/6.hydra-v2-changes.md` nói `utxoCostPerByte` bằng 0 trên L2 (đã đổi lại 4310 sau bản 2.2.0); `3.concepts/5.smart-contracts-in-hydra.md` chưa có cảnh báo token đúc trong Head phải đốt trước khi đóng. Mặc định: ghi lại để một phiên khác sửa docs-v2, tập này không sửa.

## Xử lý review agy

| Mục | Quyết định (sửa / không sửa) | Lý do |
|---|---|---|
| Cảnh 03 — "chỉ chìa của chủ quán" (cao) | Sửa | Đúng: theo tập 4, chìa không rời ví, luật chỉ kiểm tra chữ ký. Bảng và lời đọc cảnh 03 ghi "cần chữ ký của chủ quán"; cảnh 08 đổi "người giữ chìa" thành "người ký được". |
| Cảnh 13 — `{ name, image }` lấy nhầm tên hex; ưu tiên `policyIdFromNativeScript` (cao) | Sửa | Đúng: shorthand `name` sẽ là chuỗi hex. Code tách `assetHex` và `name: 'Thẻ sáng lập 01'`; mã chính sách dùng `PolicyUtils.policyIdFromNativeScript` như cảnh 12; `PlutusUtils.mintingPolicyToId` chỉ ghi ở dòng Plutus. Lời đọc thêm câu "tên hiển thị viết bằng chữ thường, khác với tên token đã đổi sang hex". |
| Cảnh 02 — "không cần chạy hợp đồng" quá rộng (vừa) | Sửa | Đúng: món tiền mang token đang khoá bằng script thì tiêu vẫn qua script. Lời đọc nói "chuyển token giữa các ví"; tiêu đề cảnh đổi thành "Token không cần hợp đồng riêng"; Ranh giới sự thật ghi rõ điều kiện. Nguồn Developer Portal cũng nói "for basic transfers". |
| Cảnh 05 — phí trả bằng ADA, cân bằng từng loại (vừa) | Sửa | Đúng: phí Cardano tính bằng lovelace (tập 7). Bảng có hai phương trình riêng "ADA: vào = ra + phí" và "DIEM: vào + đúc = ra"; lời đọc có câu "phí vẫn luôn được trả bằng ADA". |
| Cảnh 11 — thứ tự min-ADA, giải thích 2 ADA ở cảnh 12 (vừa) | Sửa (phương án B) | Tập 7 vừa giới thiệu lượng ADA tối thiểu, nên cảnh này đưa lên thành cảnh 06, ngay sau đúc và đốt; cảnh 01 cũng nối từ tập 7. Cảnh 12 ghi chú "dư so với mức tối thiểu" trên bảng và trong lời đọc. Cụm "lượng ADA tối thiểu" và ý "không phải phí, thuộc về người nhận" giữ đúng như tập 7. |
| Cảnh 10 (nay là 11) — nhãn số 100 / 222 (vừa) | Sửa | Đồng ý giảm tải: bảng ghi "token tham chiếu" và "token của khách", không ghi số nhãn. |
| Cảnh 14 — thêm ví dụ chip poker để giải thích vì sao đúc trong Head (thấp) | Không sửa | Không có nguồn trong docs-v2 hay tài liệu Hydra mô tả ứng dụng này; brief chỉ đưa ý có nguồn. Cảnh 14 giữ cảnh báo theo điều kiện. |
| Cảnh 08 (nay là 09) — qua mốc cũng không đốt được (thấp) | Sửa | Đã có trong "Đơn giản hoá có chủ ý"; nay bảng ghi "Sau mốc: không đúc, cũng không đốt được". Lời đọc vẫn chỉ nói "không ai đúc thêm" để câu gọn. |
| Bảng thuật ngữ — tên hàm camelCase trong lời đọc (thấp) | Sửa | Thêm quy tắc dưới bảng thuật ngữ: tên hàm chỉ trên bảng, lời đọc dùng từ Việt; chỉ gọi tên `PolicyUtils` và `TxBuilder`. |

Thứ tự cảnh sau khi sửa: 01 mở đầu (nối tập 7) → 02 token không cần hợp đồng riêng → 03 luật đúc → 04 mã chính sách → 05 đúc và đốt → 06 lượng ADA tối thiểu → 07 luật đúc làm bằng gì → 08 NFT → 09 khoá sau mốc → 10 một lần duy nhất → 11 tên và ảnh → 12–13 lập trình viên → 14 Hydra Head → 15 tóm tắt.
