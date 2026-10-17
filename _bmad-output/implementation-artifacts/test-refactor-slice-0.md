# Báo cáo lát 0: hạ tầng test

- Ngày: 2026-10-17
- Branch: `aniadev/refactor-test-infra`
- Spec: `_bmad-output/planning-artifacts/test-refactor-spec.md`, mục 5 "Lát 0"
- Commit: `f484db1` (config vitest), `e6bd631` (script `package.json`), `28d8aa3` (`CLAUDE.md`)

## Thay đổi

| File | Thay đổi |
|---|---|
| `vitest.config.ts` | `tsconfigPaths({ projects: [<root>/tsconfig.json] })`, không còn tự quét `apps/*` (tsconfig Nuxt extends `.nuxt/tsconfig.json` chưa được sinh) và `.claude/worktrees/*`. Bỏ include `tests/**`. Thêm `test.projects`: mỗi package một project, tên trùng tên thư mục, mỗi project có `root` riêng. Coverage exclude thay `**/index.ts` bằng `packages/*/src/index.ts`. Alias và plugin được export để config e2e dùng lại. |
| `vitest.e2e.config.ts` | Dùng chung map alias (thêm `@hydra-sdk/evaluator`, `@hydra-sdk/app-bridge`) và plugin tsconfig paths đã giới hạn. Include `packages/**/*.e2e.test.ts` bao gồm cả `packages/<pkg>/e2e/**/*.e2e.test.ts` (đã thử với file tạm `packages/core/e2e/providers/probe.e2e.test.ts`, sau đó xoá). Thêm exclude `node_modules`/`dist`. |
| `packages/{app-bridge,cardano-wasm,core,evaluator,hydra-transaction}/vitest.config.ts` | Xoá. Các file này không có alias nên không chạy được trên `src` (lỗi `Failed to resolve entry for package "@hydra-sdk/core"`); vai trò của chúng được thay bằng `test.projects`. |
| `package.json` root | `test:unit` → `vitest run __tests__/unit/`; `test:integration` → `vitest run packages/evaluator/__tests__/conformance/`; `test:debug` → `vitest run --inspect-brk --no-file-parallelism`; `test:ci` → `vitest run --coverage` (không còn gọi Jest của `apps/nodejs-playground`). |
| `CLAUDE.md` (mục Commands) | Sửa đường dẫn ví dụ, lệnh chạy theo package thành `pnpm vitest run --project core` kèm danh sách tên project, thêm một dòng về `test:unit` / `test:integration` / `test:e2e`. |

Lý do chọn `root` riêng cho từng project: với `extends: true`, vitest nối (concat) mảng `include` của root config với của project, nên khi để include ở root thì mỗi project chạy lại toàn bộ 58 file (lần thử đầu cho ra 348 file / 6804 test).

Không file test nào bị sửa. `git diff cbc3c69 -- 'packages/*/src'` rỗng.

## Kết quả trước / sau

Log đầy đủ nằm ở scratchpad của session; dưới đây là các dòng tổng kết.

| Lệnh | Trước | Sau |
|---|---|---|
| `pnpm test` | 58 file / 1134 test pass; 4 dòng `TSConfckParseError` (`apps/docs`, `apps/docs-v2`, `apps/playground`, …) | 58 file / 1134 test pass; 0 dòng `TSConfckParseError`, không có dòng `error` nào trong output |
| `pnpm test:unit` | `CACError: Unknown option --testPathPattern` | 46 file / 1069 test pass |
| `pnpm test:integration` | `CACError: Unknown option --testPathPattern` | 4 file / 11 test pass |
| `pnpm vitest run --project packages/core` (lệnh cũ trong CLAUDE.md) | exit 1, kèm `TSConfckParseError` | — |
| `pnpm vitest run --project <name>` | không có project | app-bridge 50, core 527, evaluator 19, hydra-bridge 240, hydra-transaction 298 test; tổng 1134 khớp `pnpm test`. `cardano-wasm` chưa có test nên báo "No test files found" |
| `pnpm test:debug <file>` | `--runInBand` không phải flag vitest | in `Debugger listening on ws://127.0.0.1:9229/...` |
| `pnpm vitest list --config vitest.e2e.config.ts --filesOnly` | — | `packages/hydra-bridge/e2e/bridge.e2e.test.ts` (và file probe khi có) |
| `pnpm test:coverage` | `tx-builder/index.ts` không có trong report; All files: Stmts 75.19 / Branch 67 / Funcs 76.57 / Lines 76.05 | `tx-builder/index.ts`: Stmts 83.23 / Branch 62.69 / Funcs 96 / Lines 83.41; All files: 76.73 / 66.31 / 79.54 / 77.48 |

Số dòng config: `vitest.config.ts` 55 → 74, `vitest.e2e.config.ts` 39 → 35, 5 file config package (37 dòng) → 0. Tổng 131 → 109.

`test:unit` hiện chạy 46/58 file vì 12 file chưa nằm dưới `__tests__/unit/`: 7 file `packages/app-bridge/__tests__/*.test.ts`, `packages/core/__tests__/fee.test.ts` và 4 file conformance của evaluator. Việc chuyển các file này vào `unit/` thuộc lát 3 và lát 5.

## Kiểm chứng bằng đột biến

Không áp dụng cho lát này (không viết lại file test nào); thay bằng bảng trước/sau ở trên.

## Bug ghi bằng `it.fails`

Không có; lát 0 không sở hữu bug nào trong mục 6.

## Câu hỏi mở

1. Script `test` (`vitest --run`) trong `packages/*/package.json` vẫn lỗi khi chạy từ thư mục package (`pnpm --filter @hydra-sdk/core test` → `Failed to resolve entry for package "@hydra-sdk/core"`), giống như trước lát này. Các file đó nằm ngoài ownership của lát 0. Đề xuất: đổi thành `vitest run --root ../.. --project <name>` hoặc xoá script, tuỳ quyết định của Ania.
2. `.github/workflows/nodejs-playground-test.yml` vẫn gọi `pnpm run test:ci`, nay trỏ tới `vitest run --coverage`. Lát 1 (xoá Jest playground) nên xoá hoặc sửa workflow này.
3. Coverage giờ đo cả các `index.ts` lồng nhau chỉ re-export (ví dụ `src/utils/index.ts`); chúng kéo nhẹ tỉ lệ chung. Nếu cần loại thì liệt kê cụ thể từng file thay vì quay lại glob `**/index.ts`.
4. `pnpm install` trong worktree báo lỗi ở bước `postinstall` của `apps/docs-v2` (Nuxt generate); `node_modules` vẫn đầy đủ và không ảnh hưởng tới test.
