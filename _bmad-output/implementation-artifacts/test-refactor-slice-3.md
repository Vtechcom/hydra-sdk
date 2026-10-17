# Báo cáo lát 3: unit test `packages/core`

- Ngày: 2026-10-17
- Branch: `aniadev/refactor-test-core` (worktree `refactor-test-core`)
- Spec: `_bmad-output/planning-artifacts/test-refactor-spec.md`, mục "Lát 3"
- Phạm vi đã sửa: chỉ `packages/core/__tests__/**`. Không sửa `src`; `git diff master -- packages/core/src` rỗng.

## 1. Số liệu trước / sau

| Chỉ số | Trước | Sau |
|---|---|---|
| File trong `packages/core/__tests__` | 28 (26 file test + 2 mock) | 27 (25 file test + 2 helper) |
| Số dòng | 6420 | 3143 |
| Test (`pnpm vitest run packages/core`) | 527 pass | 361 pass + 5 `it.fails` (366) |
| Toàn repo (`pnpm vitest run`) | 58 file / 1134 test (theo spec) | 57 file / 968 pass + 5 `it.fails` (973) |
| stderr/stdout lọt ra khi chạy core | 6 khối (blockfrost, demeter, ogmios, `AppWallet.signData`) | 0 |

Mục tiêu spec là khoảng 3,6k dòng; kết quả là 3143 dòng. Ngoài nhiễu `TSConfckParseError` (lát 0 xử lý), cả hai lệnh đều xanh.

## 2. File đã xoá, gộp, viết lại

**Helper dùng chung (mới)**

- `helpers/fixtures.ts`: mnemonic test, các địa chỉ và key hash suy ra từ mnemonic, tx chưa ký kèm hash và witness golden, script Plutus kèm hash V1/V2/V3, native script kèm policy ID, địa chỉ pointer theo vector CIP-19. Mọi giá trị dẫn xuất được tính bằng CSL, và hash được đối chiếu độc lập bằng blake2b của `@noble/hashes`.
- `helpers/wasm.ts`: `wasmScope()` thu gom object WASM tạo trong test và `free()` chúng sau mỗi test.

**Wallet**

- Xoá `unit/wallet.test.ts`, `unit/embedded.test.ts`, `unit/cardanocli-wallet.test.ts` (tổng 1818 dòng).
- Tạo `unit/wallet/contract.test.ts`: contract dùng chung. Ba wallet được dựng từ cùng một payment key; với cùng một tx, cả ba phải tạo đúng witness golden, và chữ ký phải verify được trên tx hash. Phần partialSign, submit/fetch chạy cho `AppWallet` và `CardanoCliWallet`.
- `unit/wallet/app-wallet.test.ts`, `embedded-wallet.test.ts`, `cardanocli-wallet.test.ts`: mỗi file chỉ giữ phần riêng của class (nạp key, địa chỉ golden theo network/index, `brew`, `signTxs`, `EmbeddedWallet.signData`, key cli loại plain và extended).

**Converter**

- Xoá `unit/utils/converter/*.test.ts` (3 file) và `mocks/converter.ts`, `mocks/wallet.ts` (`mocks/wallet.ts` không còn file nào dùng).
- Tạo `unit/utils/converter.test.ts`: bỏ các `vi.mock` trỏ sai đường dẫn, bỏ spy `PlutusData.from_hex` không được restore. Thêm round-trip UTxO[] → UTxOObject → UTxO[], multi-asset hai policy, cộng dồn unit trùng, ba dạng inline datum, cache datum kèm loại bỏ (eviction) theo `maxDatumCacheSize`, bỏ qua khoá không có `#index` hợp lệ.

**Serializer / Deserializer**

- Xoá `unit/utils/serializer.test.ts`; gộp vào `unit/utils/deserializer.test.ts` dưới dạng round-trip `serializeAssetUnit` / `deserializeAssetUnit`.
- Thay toàn bộ mock CSL bằng fixture thật: địa chỉ base key/key, base script/key, enterprise key, enterprise script, pointer (CIP-19), reward; script Plutus có hash golden cho từng phiên bản.
- Thêm `deserializeAmountsFromTx`.

**Fee**

- Chuyển `__tests__/fee.test.ts` sang `unit/utils/fee.test.ts` (giữ ca so với fee CSL 174467).
- Thêm: fee reference script (421 byte × 15 = 6315 lovelace, và khi đổi `minFeeRefScriptCostPerByte`), `required_signers` (trùng với key của input thì không đếm thêm, khác key thì đếm thêm), `extraSigners`, công thức `sizeFee`, `scriptFee` golden, `feeMultiplier` + `safetyMarginLovelace`.

**Provider**

- Xoá `unit/utils/provider/base.test.ts`.
- `demeter.test.ts` rút còn phần baseURL/header (`it.each` theo network và `apiVersion`) cùng ca thiếu token.
- `blockfrost.test.ts`, `ogmios.test.ts`: spy `console.error` và assert nội dung ở các nhánh lỗi; bỏ các test chỉ có `toBeDefined`, bỏ test đếm số lần gọi interceptor.

**Golden và bổ sung**

- `time.test.ts`: slot/epoch golden theo từng network, lấy từ genesis (mainnet: hard fork Shelley tại slot 4492800 = 2020-07-29T21:44:51Z; preprod: epoch 4 = slot 86400 = 2022-06-21; preview: 2022-10-25 = slot 0). Mỗi network có hai mốc, kèm kiểm tra biên giây và biên epoch.
- `policy.test.ts`: policy ID golden (blake2b-224 của `0x00 || script`, đối chiếu bằng `@noble/hashes`).
- `metadata.test.ts`: giới hạn 64 byte tính theo byte UTF-8 (ca 22 ký tự 3 byte = 66 byte bị từ chối), giới hạn 64 byte cho dữ liệu nhị phân, giá trị lồng nhau, từ chối số không nguyên (`1.5`, `-0.1`, `NaN`, `Infinity`), CBOR golden.
- Mới: `parser.test.ts` (ParserUtils), `cost-models.test.ts` (CostModels).
- `build-keys.test.ts`: đường dẫn suy diễn CIP-1852 golden, nhánh nhận cặp key, `clampScalar`, `stripExtendedKey`, `buildDRepID`.
- `plutus-script.test.ts`: thêm nhánh V1/V2/Native, ca type không hỗ trợ, địa chỉ base có stake credential, địa chỉ enterprise mainnet.
- Cắt gọn bằng `it.each` và CBOR golden: `datum`, `keys.util`, `address`, `validation`, `resolver`.
- Giữ nguyên: `constants/chain.test.ts`, `cli-key-envelope.test.ts`, `redeemer.test.ts` (vốn đã kiểm tra hành vi).

Sau refactor, grep `toBeDefined|toBeInstanceOf|toThrow()` trong `packages/core/__tests__` không còn kết quả nào. Riêng `chain.test.ts` vẫn có một `.not.toThrow()` hợp lệ.

## 3. Kiểm chứng bằng đột biến

Mỗi đột biến được áp tạm vào `src`, chạy file test tương ứng, rồi hoàn tác. Lệnh `git diff master -- packages/core/src` cho kết quả rỗng.

| Đột biến trong `src` | Test đỏ |
|---|---|
| wallet.ts AppWallet.signTx `!partialSign` → `partialSign` | contract: AppWallet refuses/adds second witness (2 đỏ) |
| embedded.ts signTx dùng `keyIndex + 1` | contract: EmbeddedWallet attaches exactly one witness… |
| cardanocli-wallet.ts mặc định `NETWORK_ID.PREPROD` | cardanocli-wallet: defaults to mainnet |
| embedded.ts signData `===` → `!==` | embedded-wallet: rejects an address that does not belong… |
| converter.ts convertTxOutputToWasm bỏ cộng dồn số lượng (`currentQty +`) | converter: groups assets by policy and sums repeated units |
| converter.ts `hashIndex <= 0` → `< 0` | converter: defaults missing lovelace to 0 and skips keys without a valid #index |
| converter.ts cache `>=` → `>` | converter: reuses a decoded datum … evicting the oldest |
| converter.ts convertUTxOToUTxOObject số lượng asset `+ 1` | converter: keys each UTxO… ; round-trips… (2 đỏ) |
| deserializer.ts V2 dùng `from_bytes` (V1) | deserializer: hashes the script with the V2 language tag |
| deserializer.ts deserializeAssetUnit `substring(56)` → `substring(58)` | deserializer: round-trip (0), (2) |
| deserializer.ts deserializeAmountsFromTx không cộng dồn lovelace | deserializer: sums lovelace over all outputs |
| deserializer.ts vá thử B1 (dùng `name()` thay `to_hex()`) | it.fails B1 chuyển đỏ — đúng cơ chế báo "đã sửa" |
| fee.ts bỏ vòng lặp required_signers | fee: counts distinct vkey signers with a distinct / two distinct required signer(s) (2 đỏ) |
| fee.ts refScriptBytes không chia 2 | fee: charges minFeeRefScriptCostPerByte … |
| fee.ts FEE_FIELD_HEADROOM_BYTES 8 → 7 | fee: computes sizeFee as minFeeA × (txBytes + 8) + minFeeB |
| fee.ts bỏ `+ margin` | fee: applies feeMultiplier then adds safetyMarginLovelace |
| constants/time.ts PREPROD zeroTime +1000 ms | time: 4 ca PREPROD đỏ |
| time.ts `Math.floor` → `Math.round` | time: 7 đỏ (giữ slot trong cùng giây, buildHydraSlotConfig) |
| time.ts resolveEpochNo bỏ `+ startEpoch` | time: 7 đỏ (mainnet/preprod epoch, Date.now) |
| policy.ts buildMintingPolicyScriptFromAddress đổi byte đầu keyHash | policy: uses the payment key hash…; policyIdFromNativeScript… |
| policy.ts policyIdFromNativeScript `.toUpperCase()` | policy: policyIdFromNativeScript hashes the script |
| metadata.ts METADATA_MAX_TEXT_BYTES 64 → 65 | metadata: rejects text of 65 ASCII…, 22 three-byte…, nested (3 đỏ) |
| metadata.ts đếm `str.length` thay vì byte UTF-8 | metadata: rejects text of 22 three-byte characters (66 bytes, 22 chars) |
| metadata.ts `!Number.isInteger` → `Number.isNaN` | metadata: rejects the non-integer number 1.5 / -0.1 / Infinity |
| parser.ts toBytes bỏ điều kiện độ dài chẵn | parser: toBytes odd-length hex-looking text is UTF-8 |
| parser.ts asciiToBase16 sai offset chữ hoa | parser: hexToBytes accepts upper-case hex… |
| cost-models.ts chèn V2 vào khoá V1 | cost-models: buildCostModels…; defaultCostModels… (2 đỏ) |
| cost-models.ts bỏ cache (`if (true)`) | cost-models: defaultCostModels is built once and shared |
| build-keys.ts `DREP = 3` → `4` | build-keys: derives CIP-1852 keys … {0,2,3} |
| build-keys.ts clampScalar đặt bit sai (`0b0010_0000`) | build-keys: clampScalar … (3 ca it.each đỏ) |
| build-keys.ts nhánh mảng lấy stake = privateKeyHex[0] | build-keys: takes a [payment, stake] pair … |
| plutus-script.util.ts stake credential thành script hash | plutus-script: builds a base address … stake credential |
| plutus-script.util.ts PlutusV2 dùng `from_bytes_v3` | plutus-script: hashes a PlutusV2 script; base address (2 đỏ) |
| datum.ts mkBool đảo 0/1 | datum: mkBool encodes Aiken Bool |
| datum.ts parseAddress chỉ chặn alternative 2 | datum: parseAddress rejects a pointer stake credential |
| keys.util.ts genVkey bỏ nhánh XPRV_96 | keys.util: derives an extended verification key from a 96-byte xprv |
| address.ts isValidAddress `return true` thay `is_malformed() === false` | KHÔNG đỏ — đột biến tương đương (CSL ném lỗi trước khi trả địa chỉ malformed) |
| address.ts bỏ kiểm tra chuỗi rỗng | KHÔNG đỏ — tương đương (`from_bech32('')` ném lỗi, catch trả false) |
| address.ts nhánh hex dùng `from_bech32` | address: isValidAddress hex; bech32 given as hex (2 đỏ) |
| address.ts getPubkeyHash dùng `to_scripthash` | address: 6 ca getPubkeyHashFromAddress đỏ |
| validation.ts `to_hex() ? true : false` → `true` | KHÔNG đỏ — tương đương (`to_hex()` luôn khác rỗng) |
| validation.ts catch trả `true` | validation: 12 ca rejects đỏ |
| resolver.ts resolveTxBodyHash cắt 1 byte body | resolver: resolveTxBodyHash returns the same hash |
| demeter.provider.ts `blockfrost-m1` → `blockfrost-m2` trong baseURL | demeter: 4 ca puts the auth token in the subdomain đỏ |
| blockfrost.provider.ts console.error bỏ đối số error | blockfrost: logs the cause and throws … (2 đỏ) |
| ogmios.provider.ts `throw error?.response?.data` → `throw error` | ogmios: logs and returns an empty array…; rejects with the RPC error body… (2 đỏ) |

Ba đột biến không làm test đỏ đều là đột biến tương đương (hành vi quan sát được không đổi). Với mỗi file liên quan, mình đã thử thêm một đột biến không tương đương, và đột biến đó làm test đỏ.

## 4. Bug ghi nhận bằng `it.fails`

| Bug | Test | Tái hiện |
|---|---|---|
| B1: `deserializeAmountsFromTx` dùng `assetName.to_hex()` | `deserializer.test.ts` › "builds native token units as policyId + raw asset name hex [B1]" | Có: unit nhận được là `…e05f4474525053`, unit đúng là `…e05f74525053`. Vá tạm bằng `name()` thì `it.fails` chuyển đỏ. |
| B7a: `AppWallet.signData` là stub, có `console.log`, không delegate | `app-wallet.test.ts` › "signData delegates to EmbeddedWallet.signData [B7]" | Có: promise bị reject với "signData() is not implemented". Có thêm một test thường assert hành vi stub hiện tại (spy `console.log`). |
| B7b: `EmbeddedWallet.signData` ghi CIP-8 trong docstring nhưng chỉ ký raw | `embedded-wallet.test.ts` › "returns a CIP-8 COSE_Sign1 signature and COSE_Key [B7]" | Có: `signature` là chữ ký ed25519 raw dài 64 byte, `key` là public key raw dài 32 byte, không phải COSE_Sign1 / COSE_Key. |
| B7c: `CardanoCliWallet.signTx` báo lỗi với tiền tố `[AppWallet]` | `cardanocli-wallet.test.ts` › "prefixes signTx errors with [CardanoCliWallet] [B7]" | Có. |
| Mới (chưa có trong mục 6): `calculateTxFee` ước tính thiếu khi có nhiều hơn 1 signer | `fee.test.ts` › "grows the measured size by one vkey witness per extra signer [mock witnesses deduplicated]" | Có: các mock witness dùng cùng vkey toàn số 0, mà `Vkeywitnesses` của CSL là tập hợp nên chỉ giữ một witness (`add` lần hai trả `false`). Mỗi signer thêm làm `sizeFee` thiếu 44 × 101 = 4444 lovelace, trái với docstring "never under-provisions". |

Không bug nào trong lát này bị loại vì không tái hiện được.

## 5. Câu hỏi mở cho Ania

1. **Bug fee mới (mục 4, dòng cuối)**: cần bổ sung vào bảng mục 6 và tạo issue riêng. Hướng sửa gợi ý: tạo mock vkey khác nhau cho từng signer (ví dụ đặt byte đầu bằng chỉ số signer).
2. **`buildDRepID` là stub** (`console.log` rồi trả `null`). Spec yêu cầu "bổ sung test", nhưng chưa có hành vi đúng để assert: chưa chốt định dạng DRep ID (CIP-105 `drep1…` hay CIP-129). Hiện có một test ghi lại hành vi stub (spy `console.log`, trả `null`). Nếu Ania chọn định dạng, test này có thể đổi thành `it.fails`.
3. **Key type `cli` của `EmbeddedWallet`/`AppWallet` không dùng được**: `getAccount()` luôn ném "Invalid Secret Key size", vì `buildKeys` đưa key 32 hoặc 64 byte vào `Bip32PrivateKey.from_hex` (hàm này cần 96 byte). Vì vậy wallet tạo từ `{ type: 'cli' }` không lấy được địa chỉ và không ký được. Mình chưa ghi `it.fails` vì chưa rõ hành vi đúng (địa chỉ enterprise từ key plain?). Có nên đưa vào bảng bug không?
4. **`convertUTxOToUTxOObject` dùng `Number(quantity)`**: số lượng lớn hơn 2^53 sẽ mất độ chính xác. Chưa tái hiện bằng test; nêu ra để Ania quyết định có cần ghi nhận không.
5. `buildMintingPolicyScriptFromAddress` nhận địa chỉ reward và dựng policy từ stake key hash (CSL `payment_cred()` trả về stake credential). Mình không viết test cho hành vi này vì không chắc đây là hành vi mong muốn.

## 6. Ghi chú

- Lúc dựng fixture, mình từng gõ tay `stakeKeyHash` bằng cách đọc bech32 và gõ sai 1 byte; lỗi được phát hiện khi đối chiếu với `deserializeAddress` và đã sửa trước commit deserializer. Từ đó mọi hex trong `fixtures.ts` đều được sao chép từ output của CSL hoặc noble, không gõ tay.
- Type-check thủ công cho `__tests__` (dùng tsconfig tạm, không commit) chỉ báo lỗi "Cannot find module '@hydra-sdk/cardano-wasm'" do package này chưa build trong worktree. Lỗi kiểu thật duy nhất (helper địa chỉ trong `build-keys.test.ts`) đã được sửa.
