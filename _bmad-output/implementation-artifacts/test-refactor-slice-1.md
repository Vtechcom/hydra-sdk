# Báo cáo lát 1: `apps/nodejs-playground`

- Ngày: 2026-10-17
- Branch: `aniadev/refactor-test-playground`
- Spec: `_bmad-output/planning-artifacts/test-refactor-spec.md`, mục "Lát 1"
- Commit: `30be010` (golden), `4c550f0` (e2e provider), `4f90bce` (gỡ Jest)

## Tóm tắt

Bộ test Jest của `apps/nodejs-playground` đã được gỡ hoàn toàn. Hai test golden về tx-builder được chuyển sang vitest trong `packages/hydra-transaction/__tests__/unit/golden/`, chạy trên `src` qua alias. Hai test provider được chuyển sang e2e tại `packages/core/e2e/providers/`. Các test trùng với `core` bị xoá. Golden `always-true` đã cũ và được tạo lại bằng script có commit; nguyên nhân giá trị đổi đã được xác định bằng bisect (xem mục 3).

## 1. File đã xoá, chuyển, viết lại

| File cũ | Xử lý |
|---|---|
| `src/__tests__/utilities/deserializer.test.ts` | Xoá (trùng test của `core`) |
| `src/__tests__/utilities/keys-utils.test.ts` | Xoá (trùng) |
| `src/__tests__/utilities/metadata.test.ts` | Xoá (trùng). Suite này đỏ dưới Jest vì assertion cũ (`toMatch` trên object `Error`, message cũ `Max metadata bytes too long`), không phải bug source. |
| `src/__tests__/utilities/converter.test.ts`, `converter.ts` | Xoá (trùng) |
| `src/__tests__/1.wallet/setup-wallet.test.ts` | Xoá (trùng) |
| `src/__tests__/__mocks__/**` (`wallet.json`, `big-utxo-object.json`, `contract/always-true.json`) | Xoá. Không file nào ngoài `__tests__` dùng các mock này; giá trị cần thiết được viết thẳng vào fixture mới. |
| `src/__tests__/tx-builder/simple-tx.test.ts` | Viết lại thành `packages/hydra-transaction/__tests__/unit/golden/simple-tx.test.ts` |
| `src/__tests__/tx-builder/contract-interaction/always-true.test.ts` (+ `always-true.json`) | Viết lại thành `golden/always-true.test.ts` + `golden/always-true.fixture.ts` |
| `src/__tests__/1.wallet/providers/blockfrost.test.ts` | Chuyển thành `packages/core/e2e/providers/blockfrost.e2e.test.ts` |
| `src/__tests__/1.wallet/providers/ogmios.test.ts` | Chuyển thành `packages/core/e2e/providers/ogmios.e2e.test.ts` |
| `jest.config.js`, `JEST_CI_CONFIG.md` | Xoá |
| `.github/workflows/nodejs-playground-test.yml` | Xoá |
| `package.json` của playground | Bỏ script `test`, `test:watch`, `test:coverage`, `test:ci`, `update:snapshot`; bỏ devDependency `jest`, `ts-jest`, `jest-junit`, `@types/jest`. Script không phải test (`build`, `dev`, `start`, `test:memory-leak`, `src/test-memory-leak-*.ts`) giữ nguyên. |
| `pnpm-lock.yaml` | Cập nhật theo việc gỡ dependency (xem câu hỏi mở 2). |

File mới trong `golden/`:

- `simple-tx.test.ts`: 2 nhóm (chỉ lovelace; lovelace + native token), mỗi nhóm build tx một lần trong `beforeAll` và `free()` trong `afterAll`. Assertion: CBOR chưa ký và txId golden, fee golden, bảo toàn giá trị (input = output + fee), địa chỉ người nhận và change, số lượng từng token ở output và change, CBOR đã ký golden và txId không đổi sau khi ký, lỗi `Not enough ADA leftover…` kiểm tra bằng `rejects.toThrow(/…/)`.
- `always-true.fixture.ts`: hằng số và các hàm build tx lock/unlock, dùng chung cho test và script tạo lại golden. Không import helper của lát 2.
- `always-true.test.ts`: datum và datum hash golden; lock inline datum (CBOR + txId golden, input được chọn); lock datum hash (output chứa `DataHash` đúng, fee golden); unlock theo bảng `describe.each` cho inline datum và datum hash: txId, fee, `script_data_hash` golden; `script_data_hash` khớp giá trị tính lại bằng `hash_script_data` từ redeemer, datum trong witness và cost model V3 mặc định; fee không nhỏ hơn phí theo kích thước cộng phí ex-unit (6491 lovelace); input đúng và bảo toàn giá trị; collateral đúng, không có collateral return; witness có 1 script, 1 redeemer spend, có datum khi dùng datum hash và không có khi dùng inline datum.
- `regenerate-always-true.ts` + `tsconfig.json`: script in ra các giá trị golden, chạy trên `src` (tsconfig chỉ khai báo `paths` giống alias của `vitest.config.ts`).

## 2. Số liệu trước và sau

| | Trước | Sau |
|---|---|---|
| Playground (Jest, chạy trên `dist`) | 9 suite, 30 test; 4 suite đỏ, 3 test đỏ (2 provider đỏ lúc import vì thiếu env, `metadata`, `always-true`) | Không còn test |
| Golden trong `hydra-transaction` (vitest) | 0 | 2 file, 23 test |
| E2E provider trong `core` | 0 | 2 file, 4 test (skip khi thiếu env) |
| `pnpm vitest run` toàn repo | 58 file, 1134 test | 60 file, 1157 test, tất cả xanh |
| `pnpm vitest run packages/hydra-transaction` | — | 14 file, 321 test xanh |
| Số dòng test trong phạm vi | 1115 dòng test + 35 dòng `jest.config.js` + 179 dòng `JEST_CI_CONFIG.md` + 204 dòng workflow | 555 dòng (golden 476 gồm fixture 86, script 38, tsconfig 17; e2e 79) |

Output của `pnpm vitest run` không có dòng `TSConfckParseError` trong worktree này (đếm được 0), kể cả sau khi thêm `golden/tsconfig.json`.

## 3. Vì sao golden `always-true` đổi

Bisect bằng cách build cùng một tx unlock (datum hash, redeemer rỗng) trên `src` của từng commit:

| Commit | `script_data_hash` | fee |
|---|---|---|
| `f4e96ce` (golden cũ được ghi lúc này) | `aa56924a…ca440` | 181869 |
| `3eae146~1` | `aa56924a…ca440` | 181869 |
| `3eae146` chore: update protocol parameters to v11, … sync updated cost models | `5f29ce13…f115b` | 181869 |
| `aca752e~1` | `5f29ce13…f115b` | 181869 |
| `aca752e` release(transaction): v1.2.0 — … fee config | `5f29ce13…f115b` | 188360 |
| `HEAD` | `5f29ce13…f115b` | 188360 |

- `script_data_hash` đổi ở `3eae146`: commit này thay cost model PlutusV3 trong `packages/core/src/constants/cost-models.ts`. Language view của V3 nằm trong dữ liệu được băm, nên hash đổi dù redeemer và datum giữ nguyên.
- Fee đổi ở `aca752e`: trước commit này `ex_unit_prices` bị hardcode bằng 0; sau commit, giá lấy từ `priceMem`/`priceStep`. Với ngân sách mặc định của redeemer rỗng (mem 100000, steps 10000000): 0,0577 × 100000 + 0,0000721 × 10000000 = 5770 + 721 = 6491 lovelace, khớp với 188360 − 181869.
- Tx lock không có script nên không bị ảnh hưởng; golden lock và golden `simple-tx` giữ nguyên giá trị cũ.

Lệnh tạo lại golden (đã ghi trong header của script):

```bash
pnpm exec tsx --tsconfig packages/hydra-transaction/__tests__/unit/golden/tsconfig.json \
  packages/hydra-transaction/__tests__/unit/golden/regenerate-always-true.ts
```

Nguồn gốc golden: các giá trị là golden hồi quy (regression), tính bằng CSL thông qua `TxBuilder`, không lấy từ cardano-cli hay node thật. Golden ký (`simple-tx`) là chữ ký ed25519 tất định từ mnemonic trong test.

## 4. Kiểm chứng bằng đột biến

Mỗi đột biến được áp vào `src`, chạy `pnpm vitest run packages/hydra-transaction/__tests__/unit/golden`, rồi hoàn tác bằng `git checkout`. `git diff packages/*/src` rỗng ở cuối.

| # | Đột biến | Kết quả |
|---|---|---|
| M1 | `core/src/constants/protocol-parameters.ts`: `minFeeA: 44` → `45` | 11/23 đỏ, gồm cả hai file: CBOR/txId golden, fee 168625/174213, change token, bảo toàn giá trị trong unlock |
| M2 | `hydra-transaction/src/tx-builder/index.ts`: `mem_price: priceToRational(pp.priceMem)` → `priceToRational(0)` (hoàn tác một phần bản sửa của `aca752e`) | 4/23 đỏ: txId/fee/script_data_hash golden và bảo toàn giá trị của cả hai ca unlock |
| M3 | `core/src/constants/cost-models.ts`: hệ số đầu của cost model V3 `100788` → `100789` | 4/23 đỏ: golden `script_data_hash` của hai ca unlock (lúc đó test tính lại còn so với golden; sau đó đã đổi thành so với hash của chính tx để kiểm tra tính nhất quán độc lập với golden) |
| M4 | `tx-builder/index.ts`: `PlutusWitness.new(witnessScript, datum!, redeemer)` → `new_without_datum(...)` | 3/23 đỏ: ca datum hash (golden, bảo toàn giá trị, witness thiếu datum) |
| M5 | `tx-builder/index.ts`: bỏ cả ba lời gọi `calc_script_data_hash(costMdls)` | `complete()` throw trong `beforeAll`, hai suite unlock đỏ (12 test bị skip theo suite đỏ) |

E2E provider: không làm được đột biến có ý nghĩa vì không có API key/endpoint thật. Đã kiểm chứng hai điều thay thế: thiếu env thì 4 test bị skip kèm message (`BLOCKFROST_PROVIDER_API_KEY is not set`, `OGMIOS_PROVIDER_HTTP_URL is not set`); đặt env giả (`preprodFAKE`, `http://127.0.0.1:9`) thì 4 test chạy thật và đỏ với `expected 0 to be greater than 0`.

## 5. Bug ghi nhận bằng `it.fails`

Không có. Các bug B1–B7 của mục 6 nằm trong `core/src` và `hydra-transaction/src`, thuộc lát 2 và lát 3. Test golden của lát này không đi qua các nhánh đó (không dùng `strategy`, `collateralReturn`, mint, `auxiliaryData`, hay input có datum mà không có `txInScript`).

Một quan sát ngoài bảng: `fetchAddressUTxOs` của cả `BlockfrostProvider` và `OgmiosProvider` nuốt mọi lỗi và trả `[]`, nên lỗi mạng hoặc API key sai không phân biệt được với địa chỉ không có UTxO. E2E chỉ phát hiện được qua assertion `length > 0`. Đây là hành vi thiết kế hiện tại, chưa coi là bug; cần Ania quyết định có tạo issue không.

## 6. Câu hỏi mở

1. Script `test:ci` ở `package.json` root vẫn gọi `pnpm --filter ./apps/nodejs-playground test:ci`, script này đã bị xoá nên `pnpm test:ci` sẽ lỗi cho tới khi lát 0 xoá hoặc trỏ lại `test:ci`. Root `package.json` cũng còn devDependency `@types/jest` và `ts-jest`; theo phân công, phần này thuộc lát 0.
2. `pnpm-lock.yaml` không nằm trong danh sách ownership nhưng phải đổi khi gỡ dependency (−297/+34 dòng, gồm cả việc pnpm dedupe lại một số package `@babel/*`). Nếu lát khác cũng đổi lockfile thì khi merge nên giải xung đột bằng cách chạy lại `pnpm install` thay vì sửa tay.
3. `CLAUDE.md` vẫn ghi `nodejs-playground/  # Node.js integration tests (Jest)`; theo phân công, lát 0 sửa file này.
4. `README.md`/`README_VI.md` ở root nhắc `pnpm --filter nodejs-playground test:all`, nhưng script này đã không tồn tại từ trước lát này. Chưa sửa vì nằm ngoài ownership.
5. E2E provider đọc env từ `process.env`, không còn tự load `.env` của playground qua `dotenv`. Cần chạy kiểu `BLOCKFROST_PROVIDER_API_KEY=… pnpm test:e2e packages/core/e2e/providers`. Nếu muốn `vitest.e2e.config.ts` tự load `.env`, việc đó thuộc lát 0.
