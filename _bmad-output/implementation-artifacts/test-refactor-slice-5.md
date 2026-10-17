# Báo cáo lát 5: `app-bridge`, `evaluator`, `cardano-wasm`

- Ngày: 2026-10-17
- Branch: `aniadev/refactor-test-appbridge-evaluator-wasm`
- Spec: `_bmad-output/planning-artifacts/test-refactor-spec.md`, mục "Lát 5"
- Commit: `af7211e` (evaluator), `92f1558` (app-bridge), `e5f55a4` (cardano-wasm), cộng commit báo cáo này
- `git diff cbc3c69 -- packages/*/src` rỗng: lát này không sửa source.

## 1. Kết quả

| Phạm vi | Trước (file / test / dòng) | Sau (file / test / dòng) |
|---|---|---|
| `app-bridge` | 7 / 50 / 1.244 | 7 / 155 / 1.798 (gồm helper 116 dòng) |
| `evaluator` | 6 / 19 / 509 | 6 / 42 + 3 `it.fails` / 875 |
| `cardano-wasm` | 0 test vitest; 2 script thủ công / 54 dòng | 1 / 5 / 88 |
| Tổng lát 5 | 13 / 69 / 1.807 | 14 / 202 + 3 `it.fails` / 2.761 |
| Toàn repo (`pnpm vitest run`) | 58 / 1.134 | 59 / 1.267 + 3 `it.fails` |

Số dòng tăng vì lát này chủ yếu bổ sung hành vi chưa có test (spec không đặt mục tiêu giảm dòng cho lát 5). `pnpm vitest run` toàn repo xanh, exit 0, không có dòng `stderr |` và không có `TSConfckParseError` trong output của worktree này. `pnpm --filter @hydra-sdk/app-bridge test` và `pnpm --filter @hydra-sdk/cardano-wasm test` cũng xanh.

## 2. Thay đổi theo file

### `packages/app-bridge/__tests__`

Toàn bộ test chuyển vào `unit/` theo quy ước layout (mục 4 của spec).

- **Tạo mới `helpers/fake-window.ts`**: stub `window` dạng iframe (`installIframe`) và trang top-level (`installTopWindow`), cùng `connectMockHost()` nối một iframe giả với `MockBridgeHost` thật chạy ở parent. Mỗi phía có message bus riêng; `toParent`/`toIframe` ghi lại mọi message đi qua ranh giới `postMessage`. Nhờ đó test assert trên message gửi đi và nhận về, thay vì đếm lần gọi mock.
- **Viết lại `client.test.ts`**:
  - Ghim hành vi khi `appCenterOrigin` mặc định là `'*'`: mọi request (kể cả payload ký) được post với `targetOrigin '*'`; reply và push event được chấp nhận từ mọi origin, miễn là `source === window.parent`; message từ source khác bị bỏ qua.
  - Khi đã cấu hình origin: request post tới đúng origin, message từ origin khác bị bỏ và có `console.warn` (đã spy và assert); `setAppCenterOrigin` đổi đích cho request sau.
  - Tách test RPC gộp thành bảng `it.each` 12 method (payload gửi đi + kết quả resolve), thêm ca reply sai thứ tự và `requestId` lạ.
  - Reply mang state (`WALLET_ADDRESS_RESULT` connect/disconnect, `WALLET_CONNECT_RESULT`, `WALLET_PONG` + capability), 7 loại push event bằng `it.each`, `off()`, handler throw được log qua `console.error`.
  - Lỗi: từ chối của người dùng theo từng từ khoá, `WalletBridgeRpcError`, timeout theo từng tầng `DEFAULT_TIMEOUTS` (fake timers, không timeout ở `n-1` ms), `timeoutMs` theo lời gọi, `postMessage` throw, `destroy()`. Mọi lỗi được kiểm tra kèm regex message.
  - Round-trip thật với `MockBridgeHost`, chế độ mock standalone, extension fallback CIP-30 (ví ưu tiên, hex → bech32, không có ví, `enable()` trả null, batch có request con lỗi).
- **Viết lại `auth.test.ts`**:
  - Luồng login chạy qua `MockBridgeHost`: message `WALLET_SIGN_DATA` mang challenge đã hex hoá, challenge đã là hex (có `0x`) không bị encode lại, token được lưu cả local lẫn host relay.
  - 4 nhánh lỗi của `login()` bằng `it.each`, mỗi nhánh kiểm tra message, không lưu token và không phát auth change.
  - JWT hết hạn: `getToken()`/`isAuthenticated()` trả null/false, logout ở microtask sau, không logout nếu token đã bị thay trước microtask; `checkJwtExpiry: false`; `getTokenAsync` qua host relay với token hợp lệ và hết hạn; `getJwtPayload`.
  - Logout khi `accountChanged`/`disconnected` (push thật từ host), `autoResetOnAccountChange: false`, `destroy()`, listener throw được log và không chặn listener khác.
- **Viết lại `utils.test.ts`**: `cardanoHexToBech32` so với bech32 chuẩn của CSL cho 8 loại header (base key/key và script/key, pointer, enterprise, enterprise script, reward, reward script; testnet và mainnet), cả hex chữ hoa; các input trả nguyên. Golden sinh bằng `Address.from_hex(hex).to_bech32()` của `cardano-serialization-lib-nodejs` (ghi trong comment). Thêm `parseUtxoAssets`, skew của `isJwtExpired`, payload JWT UTF-8 và JWT hỏng.
- **Viết lại `simulator.test.ts`**: assert message host trả về hoặc push, không đọc `host.isAudioMuted`/`host.context`. Bảng RPC, storage + batch, `autoApprove: false`, request lạ, `stop()`, 7 push event bằng `it.each`, RPC sau push phản ánh state mới, `postMessage` lỗi được log. DevTools: mount khởi động host trả lời request thật, unmount gỡ listener và widget, mount hai lần thay widget cũ, không có DOM.
- **Viết lại `lifecycle.test.ts`**: client thật → `MockBridgeHost`, assert payload gửi đi (kể cả giá trị mặc định) và kết quả `getContext()`.
- **Bổ sung `storage.test.ts`**: host relay lỗi → `console.warn` (spy và assert) và resolve; `throwOnError` throw lại; `getItemAsync` khi relay lỗi.
- **Bổ sung `vue.test.ts`**: capability từ `WALLET_PONG`, lời gọi composable sau đổi `appCenterOrigin` của client dùng chung.

### `packages/evaluator/__tests__`

- **Xoá `conformance/encode-gate.test.ts`**: ca "whisky trả budget thật" đã nằm trong `differential.test.ts` (golden + Scalus); ca "thiếu UTxO" chuyển sang `differential.test.ts`. File này còn copy riêng fixture SPEND, nay dùng `helpers/spend-tx`.
- **Viết lại `helpers/spend-tx.ts`**: script always-succeeds V1/V2/V3 và always-fails V3 (`(program 1.1.0 (error))`), `stageSpendTx(builder, version, cbor)` (V1/V2 có datum hash), `spendFixture`, `stageMintTx`/`mintFixture`, `refScriptSpendFixture` (TxBuilder chưa hỗ trợ spend qua reference script, nên fixture chuyển script từ witness set sang một reference input), `redeemerBudgets()`. Các object WASM do helper tạo đều được `free()`.
- **`helpers/utxo-cbor.ts`**: hỗ trợ datum hash (cần cho V1/V2 trên Scalus), free WASM.
- **Viết lại `differential.test.ts`**: `it.each` V1/V2/V3 SPEND và V3 MINT, whisky và Scalus phải cho cùng một budget, so với golden. Golden V1/V2 `{ mem: 1700, steps: 256100 }` và V3 `{ mem: 500, steps: 64100 }` được cả hai engine xác nhận.
- **Viết lại `txbuilder-integration.test.ts`**: `complete()` ghi budget thật vào redeemer cho V1/V2/V3 SPEND và MINT; `evaluateTx` trả đúng một action; `SCRIPT_FAILURE` với script always-fails; `MISSING_UTXO` cho reference input; fingerprint đổi khi cost model đổi. Thêm 2 `it.fails` (mục 4).
- **Tạo mới `unit/evaluator.test.ts`** (engine giả): context truyền vào engine (cost model mặc định/ghi đè, slot config), cờ `unmapped` cho tag không remap, `evaluateTx` bỏ `logs`, lỗi engine (`UNSUPPORTED_LANGUAGE`, `MISSING_COST_MODEL`, `SCRIPT_FAILURE`) truyền nguyên trạng, engine không chạy khi resolve lỗi, `autoDispose` mặc định, `autoDispose: false` + `dispose()`, engine không có `dispose`.
- **Viết lại `unit/resolver.test.ts`**: `MISSING_UTXO` cho từng loại input/collateral/reference, có `details.utxo` và message; UTxO thừa không bắt buộc; ưu tiên `additionalUtxos` hơn source; input được phủ bởi output của tx chuỗi (`additionalTxs`); `DECODE_FAILURE` cho tx và cho `additionalTxs`.
- **`unit/encode.test.ts`**: thêm multi-asset + quantity dạng số, free `PlutusData`; ca `scriptRef` chuyển thành `it.fails` (mục 4).
- `conformance/fee.test.ts` giữ nguyên, vẫn chạy với helper mới.

### `packages/cardano-wasm`

- **Tạo mới `__tests__/unit/dist-exports.test.ts`**: mỗi ca chạy một child process `node` từ thư mục package, nên việc resolve đi qua `exports` của `package.json` bằng condition Node thật (vitest alias trỏ `@hydra-sdk/cardano-wasm` về `src`, nên không dùng được cho test này).
  - Condition `node`: `require` → `dist/index.node.js`, `import` → `dist/index.node.mjs`, và `BigNum` đồng nhất với `cardano-serialization-lib-nodejs`.
  - Condition `browser` → `dist/index.mjs`.
  - Subpath `/asmjs`: resolve cho cả `require` và `import`, đồng nhất với lib `-asmjs` và chạy được.
  - Round-trip `BigNum.from_str` với u64 max, và từ chối giá trị u64 max + 1.
  - Path ngoài `exports` báo `ERR_PACKAGE_PATH_NOT_EXPORTED`.
  - Khi thiếu `dist/`, cả `describe` được skip với tiêu đề `run pnpm --filter @hydra-sdk/cardano-wasm build first`. Đã kiểm tra bằng cách đổi tên `dist` tạm thời.
- **Xoá `test-exports.js` và `test-exports.mjs`**: không còn file nào tham chiếu.

## 3. Mutation check

Mỗi đột biến được áp dụng tạm vào `src`, chạy file test tương ứng, rồi hoàn tác bằng `git checkout`. Với `cardano-wasm`, mỗi lần đột biến đều build lại `dist`, rồi build lại sau khi hoàn tác.

| File test | Đột biến trong `src` | Test đỏ |
|---|---|---|
| `evaluator/conformance/differential` | `encode.ts`: bỏ ánh xạ `datumHash` (`if (output.datumHash)` → `if (false)`) | V1 SPEND, V2 SPEND |
| `evaluator/conformance/txbuilder-integration` | `evaluator.ts`: `MAPPED_TAGS` bỏ `'MINT'` | "returns a MINT action, mapped…" |
| `evaluator/unit/resolver` | `resolver.ts`: không thu thập reference inputs | MISSING_UTXO `'reference'` |
| `evaluator/unit/evaluator` | `evaluator.ts`: `autoDispose ?? true` → `?? false` | "frees engine resources after every evaluation…" |
| `evaluator/unit/encode` | `encode.ts`: bỏ `String(asset.quantity)` | "maps an amount with native assets…" |
| `evaluator` (kiểm tra `it.fails`) | `encode.ts`: thêm tiền tố `8203` cho `scriptRef` (bản sửa thử) | Cả 2 `it.fails` về reference script chuyển đỏ, nghĩa là bản sửa đúng sẽ làm test đổi trạng thái |
| `app-bridge/unit/client` | `client.ts`: `appCenterOrigin ?? '*'` → `?? 'null'` | Các test ghim `'*'` và bảng RPC |
| `app-bridge/unit/client` | `client.ts`: bỏ `errLower.includes('cancel')` | "…rejection word ('Signing cancelled by wallet')…" (lần đầu đột biến sống sót vì input `'User cancelled'` vẫn khớp nhánh `'user cancel'`; đã đổi input) |
| `app-bridge/unit/auth` | `auth.ts`: handler `disconnected` không gọi `logout()` | "'disconnected' clears the token…" |
| `app-bridge/unit/utils` | `utils.ts`: `isTestnet` so với `1` thay vì `0` | 8 ca bech32 |
| `app-bridge/unit/utils` | `utils.ts`: `isStake` bỏ `type === 0x0f` | "reward script, mainnet…" |
| `app-bridge/unit/simulator` | `host.ts`: `setTheme` luôn push `'dark'` | "setTheme posts…" |
| `app-bridge/unit/lifecycle` | `lifecycle.ts`: pattern mặc định `'medium'` → `'light'` | "triggerHaptic (default)…" |
| `app-bridge/unit/storage` | `storage.ts`: `setItemAsync` bỏ nhánh `throwOnError` | "setItemAsync warns… rethrows with throwOnError" |
| `app-bridge/unit/vue` | `vue.ts`: bỏ `setAppCenterOrigin` ở lời gọi sau | "…retargets the shared client…" |
| `cardano-wasm/unit/dist-exports` | `index.node.ts` import lib `-asmjs` | Test `require` và `import` theo condition `node` (lần đầu sống sót; đã thêm assert đồng nhất với lib `-nodejs`) |
| `cardano-wasm/unit/dist-exports` | `index.asmjs.ts` import lib `-nodejs` | Test subpath `/asmjs` |

## 4. Bug ghi nhận bằng `it.fails`

Mục 6 của spec không có bug nào thuộc lát 5. Trong lúc viết test, hai bug mới đã được tái hiện. Đề xuất thêm vào bảng mục 6 (B8, B9), mỗi bug một issue:

| # | Vị trí | Mô tả | Tái hiện | Test |
|---|---|---|---|---|
| B8 | `evaluator/src/engine/encode.ts` (`toEngineUtxo`, nhánh `scriptRef`) | `scriptRef` được truyền dưới dạng CBOR script trần (`46450101002499`), trong khi whisky 0.1.1 decode trường này thành mảng CBOR ScriptRef `[language, script]` (`820346450101002499` cho V3). Kết quả: mọi tx spend qua reference script đều lỗi `ENGINE_FAILURE` "Invalid script ref bytes". Comment trong source ghi "double-encoded as the engine expects", nhưng code không làm vậy. Hướng sửa: `82 0<n> <scriptCbor>` với n = 1/2/3 theo V1/V2/V3 (đã thử V3 cho kết quả `{ mem: 500, steps: 64100 }`). | Đã chạy | `unit/encode.test.ts`, `conformance/txbuilder-integration.test.ts` |
| B9 | `evaluator/src/evaluator.ts` / `engine/whisky.ts` | `MISSING_COST_MODEL` có trong taxonomy lỗi nhưng không chỗ nào throw. Truyền `costModels.plutusV3: []` khiến whisky panic: `ENGINE_FAILURE` "RuntimeError: unreachable". Sau panic, engine vẫn dùng tiếp được (đã kiểm tra). | Đã chạy | `conformance/txbuilder-integration.test.ts` |

## 5. Phát hiện không ghi bằng `it.fails`

- **TxBuilder không evaluate mint/spend Plutus khi không có redeemer tường minh** (`hydra-transaction/src/tx-builder/index.ts`, `_hasRedeemers`). Thiếu redeemer thì builder tự chèn `emptyRedeemer` với exUnits placeholder (`100000 / 10000000`), nhưng `complete()` bỏ qua bước evaluate. Kết quả là tx có budget placeholder dù đã truyền `evaluator`. Đã tái hiện với MINT trong lúc viết fixture. Path này thuộc lát 2 nên lát 5 không ghi `it.fails`; fixture MINT gọi `mintRedeemerValue(...)` tường minh. Đề xuất chuyển cho lát 2 hoặc thêm vào bảng mục 6 (B10).
- **`UNSUPPORTED_LANGUAGE` không bao giờ được throw.** Whisky chạy được cả V1/V2/V3, và ledger hiện tại không có ngôn ngữ nào khác, nên không dựng được tx để tái hiện. Lát 5 chỉ test rằng `OfflineEvaluator` truyền nguyên lỗi này từ engine (engine giả). Theo quy tắc của mục 6, ca này không được ghi `it.fails`.
- **Whisky báo input không resolve được là `SCRIPT_FAILURE`** ("resolved Input not found"), không phải lỗi thiếu context. `resolveContext` chặn trường hợp này bằng `MISSING_UTXO` trước khi engine chạy; `differential.test.ts` có ca ghim hành vi này của engine.
- **`SCRIPT_FAILURE` không điền `details.pointer`**, dù whisky trả về `tag`/`index` của redeemer lỗi. Đây là thiếu sót về chẩn đoán, chưa phải bug; chưa ghi.

## 6. Cấu hình (thuộc lát 0)

Lát 5 không sửa file cấu hình nào. Các test mới được root vitest nhận qua include `packages/**/*.test.ts`, và được `packages/*/vitest.config.ts` nhận khi chạy theo từng package.

Lưu ý cho lát 0: `dist-exports.test.ts` chỉ chạy khi `packages/cardano-wasm/dist` đã có; nếu không, test bị skip và run vẫn xanh. Muốn smoke test thật sự chạy trong CI thì workflow cần build `cardano-wasm` trước bước test (ví dụ `pnpm build:packages` trước `pnpm test`, hoặc thêm `dependsOn: ["^build"]`/`["build"]` cho task `test` trong `turbo.json`).

## 7. Câu hỏi mở

1. Có giữ `appCenterOrigin` mặc định là `'*'` không? Hiện test chỉ ghim hành vi này để mọi thay đổi phải là quyết định có chủ đích. Ở mặc định `'*'`, payload `signData`/`signTx` được post tới bất kỳ origin nào đang làm parent, và push event (`WALLET_ACCOUNT_CHANGED`…) được nhận từ mọi origin miễn là đến từ `window.parent`.
2. B8, B9 (và B10 nếu lát 2 nhận) có được thêm vào bảng mục 6 và mở issue không?
3. Byron address: `cardanoHexToBech32` cho ra chuỗi `addr1…` (trùng với `to_bech32()` của CSL), trong khi Byron address thường hiển thị dạng base58. Chưa ghi test cho trường hợp này vì hành vi mong muốn chưa được xác định.
