# Báo cáo lát 2: unit test `hydra-transaction`

- Ngày: 2026-10-17
- Branch: `aniadev/refactor-test-transaction`
- Spec: `_bmad-output/planning-artifacts/test-refactor-spec.md`, mục "Lát 2" và mục 6
- Phạm vi đã sửa: `packages/hydra-transaction/__tests__/**` (không đụng `unit/golden/**`). `git diff packages/*/src` rỗng.

## 1. Tóm tắt

Bộ test của `hydra-transaction` được viết lại để kiểm tra transaction đã build thay vì kiểm tra chaining (`toBe(builder)`) hoặc sự tồn tại (`toBeDefined`). Mọi assertion trên tx đọc dạng JSON của CSL (`tx.to_json()`), nên test không giữ object WASM trung gian. B2–B6 đều tái hiện được và được ghi bằng `it.fails`. Trong quá trình viết test, lát này phát hiện thêm 5 hành vi sai chưa có trong bảng mục 6 (xem mục 6 của báo cáo); chúng cũng được ghi bằng `it.fails` và cần Ania quyết định có đưa vào bảng hay không.

## 2. Số liệu trước/sau

| | Trước | Sau |
|---|---|---|
| File trong `__tests__` (kể cả helper/mock) | 13 | 9 |
| File test | 12 | 8 |
| Số test | 298 | 118 (107 pass, 11 `it.fails`) |
| Số dòng `__tests__` | 3.267 | 1.421 |
| Full `pnpm vitest run` | 58 file, 1.134 test | 54 file, 954 test (943 pass, 11 `it.fails`) |

Số dòng sau (1.421) cao hơn mức ước tính khoảng 1,3k của spec, chủ yếu do `helpers/fixtures.ts` (204 dòng) chứa các helper tính lại min fee và `script_data_hash`.

Output của cả hai lệnh vẫn có stderr `TSConfckParseError` từ `vite-tsconfig-paths`; lát 0 xử lý lỗi này.

### Coverage của `tx-builder/index.ts`

Đo cục bộ bằng override (không commit cấu hình):

```bash
pnpm vitest run packages/hydra-transaction --coverage.enabled \
  --coverage.include='packages/hydra-transaction/src/**' --coverage.exclude='**/types/**' --coverage.reporter=text
```

| | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| Trước | 83,23% | 62,69% | 96% | 83,41% |
| Sau | 92,29% | 78,68% | 93% | 92,33% |

Funcs giảm vì các method sau không còn test nào gọi: `setInputUtxo`, `addInputUtxo` (đang là TODO, không ảnh hưởng tx), `mintPlutusScript` (no-op), `addOutput`, `addOutputs`, `setChangeAddress` (alias legacy), getter `txBuilder`. Test cũ của chúng chỉ kiểm tra `toBe(builder)`.

Coverage của `src/utils` giảm (bigint.utils khoảng 6%, datum-builder 0%) vì spec yêu cầu xoá test của helper bigint không được export và stub `datumBuilder`.

## 3. File đã xoá, gộp, viết lại

| File | Thay đổi |
|---|---|
| `helpers/fixtures.ts` | Mới. Address, `utxo()`, `lovelace()`, `SCRIPT_ADDRESS`, `ALWAYS_SUCCEEDS_V3` (+ hash), `mockEvaluator`, `txJson`, `sumInputs`/`sumOutputs`/`fee`/`outputAsset`, `minFee` (tính lại bằng CSL `min_fee` + `min_script_fee` với 1 vkey witness giả), `recomputeScriptDataHashV3`, `withTx(builder, fn)` (build, gọi `fn`, free tx, dispose builder). |
| `mocks/tx-builder.mock.ts` | Xoá (không file nào import). |
| `unit/tx-builder/inputs`, `outputs`, `collateral-mint-cert`, `metadata-validity-signers` | Xoá. Các ca throw gộp vào `staging-guards.test.ts` (bảng `it.each`, 19 ca + 1 test spy `console.error`). Phần còn lại chuyển thành assertion trên tx đã build. |
| `unit/tx-builder/certificates-total-collateral.test.ts` | Xoá. Certs/total collateral chuyển vào `complete.test.ts`; `dispose`/`completeCbor` chuyển vào `wasm-lifecycle.test.ts`. |
| `unit/tx-builder/complete.test.ts` | Viết lại: bảo toàn giá trị (lovelace và native asset), change output về change address, fee ≥ min fee tính lại và không thừa quá 1.000 lovelace, thứ tự output, validity/required signers (dedup)/metadata + `auxiliary_data_hash`, inline datum/datum hash/reference script trên output, certificate (cân bằng deposit/refund), withdrawal, mint Plutus V3 và burn native, collateral + `total_collateral` (≥ fee × `collateralPercent`) + collateral return, `script_data_hash` so với giá trị tính lại, `setMinFee`, log verbose, các lỗi (regex + spy `console.error`), Hydra mode. |
| `unit/tx-builder/script-spend.test.ts` | Mới, gộp `evaluator`, `fast-rebalance`, `script-only-spend`. Giữ các assertion cũ; thêm: tx nháp gửi cho evaluator mang exUnits placeholder, remap MINT, index SPEND ngoài phạm vi, evaluator throw (regex + spy), fastRebalance giữ cùng input và fee với rebuild đầy đủ, datum hash/inline datum trên script input. |
| `unit/tx-builder/reference-input.test.ts` | Thu từ 481 còn 71 dòng. Lỗi `expect().resolves` không `await` (dòng 57 cũ) biến mất cùng test cũ. |
| `unit/tx-builder/wasm-lifecycle.test.ts` | Mới: `_scratch` rỗng sau `complete()` (thành công, có rebuild, evaluator không đổi gì, `build_tx` throw), `reset()`/`changeAddress()`/`updateProtocolParams()` giải phóng object cũ (`__wbg_ptr === 0`), `dispose()` + `Symbol.dispose`, `completeCbor` giải phóng tx. |
| `unit/tx-builder/constructor.test.ts` | Viết lại: params từ constructor và `updateProtocolParams` được merge và tính vào fee (+100.000 lovelace khi `minFeeB` +100.000), phí script theo `priceMem`/`priceStep` (chênh 6.491 lovelace với exUnits placeholder), `calculateFee()` trả 0, `minAda` theo công thức Babbage `(160 + số byte output) × coinsPerUtxoSize`, `minAdaForAssets` gộp unit trùng. |
| `unit/utils.test.ts` | Tách thành `unit/utils/redeemer-builder.test.ts` và `unit/utils/metadata.test.ts`, assertion trên CBOR/JSON đã giải mã. Xoá test bigint helper và `datumBuilder`. |

Golden trong test có nguồn ghi trong comment: hash datum `42` tính bằng CSL `hash_plutus_data`; `script_data_hash` và min fee tính lại bằng CSL trong `helpers/fixtures.ts`; 6.491 = 100.000 × 0,0577 + 10.000.000 × 0,0000721.

## 4. Kiểm chứng bằng đột biến

Mỗi đột biến áp vào `src`, chạy file test tương ứng, rồi `git checkout` lại. Sau cùng `git diff packages/hydra-transaction/src` rỗng.

| # | Đột biến (`src/...`) | File test | Test đỏ |
|---|---|---|---|
| M1 | `tx-builder/index.ts` `_addOutputToBuilder`: bỏ cộng dồn số lượng asset trùng unit | `complete` | conserves native assets |
| M2 | `selectUtxosFrom`: bỏ tính lại `script_data_hash` sau coin selection | `complete` | balances script + funding inputs … script_data_hash |
| M3 | `_applyEvaluatedExUnits`: `Math.floor` → `Math.ceil` cho mem | `script-spend` | applies the txEvaluationMultiplier |
| M4 | `txOutDatumHashValue`: bỏ kiểm tra `inlineDatum` | `staging-guards` | rejects txOutDatumHashValue after txOutInlineDatumValue |
| M5 | `_assembleAndBuild`: bỏ `_addReferenceInputsToBuilder` | `reference-input` | 2 test (lists reference inputs …, combines with a script spend) |
| M6 | `_assembleAndBuild`: bỏ `_freeScratch()` trong `finally` | `wasm-lifecycle` | 4 test `_scratch` |
| M7 | `getTxBuilder`: `step_price` dùng 0 | `constructor` | charges script execution at priceMem/priceStep |
| M8 | `redeemer-builder.ts`: dùng key thay value khi tạo bytes | `utils/redeemer-builder` | wraps every value as bytes … |
| M9 | `metadata.ts`: number → `new_text` | `utils/metadata` | 4 test |
| M10 | `getTxBuilder`: `minFeeB + 1000` | `complete` | 2 test kiểm tra min fee |
| M11 | `reset()`: bỏ free `_changeConfig` | `wasm-lifecycle` | reset() frees the previous WASM state |

Ngoài ra, cả 11 `it.fails` được đổi tạm thành `it` để xác nhận chúng đỏ vì đúng lý do (assertion hoặc lỗi mô tả bug), không phải vì lỗi khác của test.

## 5. Bug trong bảng mục 6 (B2–B6)

| # | Tái hiện | Test `it.fails` | Hiện tượng quan sát được |
|---|---|---|---|
| B2 | Có | `complete.test.ts` › B2: coin selection uses the strategy given to setInputs() | `setInputs(..., { strategy: 'RandomImprove' })` nhưng CSL nhận `LargestFirstMultiAsset` (2 thay vì 1). Test spy `TransactionBuilder.prototype.add_inputs_from_and_change` để đọc tham số strategy; không có cách quan sát xác định nào khác vì `RandomImprove` chọn ngẫu nhiên. |
| B3 | Có, cả hai luồng | `script-spend.test.ts` › B3: keeps the collateral return after a fast rebalance; B3: keeps the collateral return when there is no funding input | Body không có `collateral_return` (và với fastRebalance cũng không có `total_collateral`), trong khi rebuild đầy đủ có cả hai. |
| B4 | Có | `wasm-lifecycle.test.ts` › B4: frees the Mint built for the verbose log | Object `Mint` do `MintBuilder.build()` trả về vẫn có `__wbg_ptr ≠ 0` sau `complete()` và `dispose()`. |
| B5 | Có | `script-spend.test.ts` › B5: an input with a redeemer but no txInScript … | Input `d#0` có redeemer nhưng không có script nhận script của `b#1`; khi tới `b#1`, `PlutusScripts.get(1)` panic trong WASM (`RuntimeError: unreachable`). Assertion của `it.fails` mô tả hành vi đúng là báo lỗi có nhắc tới input `d#0`. |
| B6 | Có | `complete.test.ts` › B6: auxiliaryData(hash) puts the given hash in the body | `auxiliary_data_hash` trong body là hash của auxiliary data rỗng (`bdaa99…`), không phải giá trị truyền vào. |

## 6. Bug mới phát hiện (chưa có trong bảng mục 6)

Các bug này đều tái hiện được bằng test và được ghi bằng `it.fails`. Đề xuất bổ sung vào bảng mục 6 và mở issue riêng; cần Ania duyệt.

| Đề xuất | Vị trí | Mô tả | Test |
|---|---|---|---|
| B8 | `_assembleAndBuild` (gọi `_addReferenceInputsToBuilder` sau `_addInputsToBuilder`) | Reference input được thêm sau khi coin selection đã chốt fee. Ngoài Hydra mode, mọi tx có `txInReference` đều bị `build_tx` từ chối: `Fee is less than the minimum fee. Min fee: 171485, Fee: 169857`. Test cũ không phát hiện vì chỉ chạy `isHydra: true` (`build_tx_unsafe` bỏ qua kiểm tra). | `reference-input.test.ts` › counts reference inputs in the fee of a balanced build |
| B9 | `_resetTxBuilderForRebuild` | Rebuild sau evaluator tạo `TransactionBuilder` mới, nên giá trị đặt bằng `setFee()`/`setMinFee()` bị mất. Script spend Hydra dùng `setFee('0')` cùng evaluator thất bại với `Fee not specified`. | `script-spend.test.ts` › keeps a fee set with setFee() through the evaluator rebuild |
| B10 | `_addWithdrawalToBuilder` | Mỗi withdrawal gọi `set_withdrawals` với một map mới, nên chỉ withdrawal cuối được giữ. Hàm còn nuốt lỗi (chỉ `console.warn` khi verbose). | `complete.test.ts` › keeps every staged withdrawal, not only the last one |
| B11 | `_addMetadata` / `_assembleAndBuild` | `this._metadata` luôn truthy, nên mọi tx đều mang auxiliary data rỗng và `auxiliary_data_hash`, làm tăng kích thước tx và fee. | `complete.test.ts` › omits auxiliary data when no metadata was staged |
| B12 | `_assembleAndBuild` | `try/finally` gọi `_freeScratch()` chỉ bao quanh `build_tx`. Lỗi throw trước đó để lại object trong `_scratch` cho tới lần build, `reset()` hoặc `dispose()` sau. Đã chạy thử hai ca: collateral có asset (còn 7 object) và thiếu change address (còn 13 object). | `wasm-lifecycle.test.ts` › frees them when assembly throws before build_tx |

## 7. Câu hỏi mở

1. Có đưa B8–B12 vào bảng mục 6 của spec và mở issue không? B8 và B9 ảnh hưởng tới người dùng (tx có reference input ngoài Hydra không build được; Hydra + evaluator + fee 0 không build được), nên có thể cần ưu tiên cao hơn các bug WASM.
2. `spendingPlutusScript(version)` chỉ ghi `scriptRef.version` vào descriptor; khi build, ngôn ngữ của script lấy từ `txInScript(..., version)`. Method này hiện không có tác dụng trên tx. Lát này không ghi nó là bug vì chưa rõ hành vi mong muốn.
3. `metadataValue` báo `Failed to add metadata: undefined` khi CSL throw chuỗi (ví dụ text quá 64 byte), vì code đọc `error.message`. Test chỉ kiểm tra tiền tố `Failed to add metadata`. Có cần ghi thành bug không?
4. B2 được ghi bằng spy trên `TransactionBuilder.prototype` của CSL, tức là quan sát tham số tại ranh giới SDK → CSL, không phải trên tx đã build. Nếu Ania muốn tránh spy hoàn toàn, có thể thay bằng một ca xác định dựa trên `LargestFirst` với output có native asset (CSL sẽ từ chối), nhưng assertion khi đó khó đọc hơn.
5. `withTx` và các helper trong `fixtures.ts` được viết để có thể chuyển sang `@hydra-sdk/testkit` sau này; lát này không tạo package mới.
