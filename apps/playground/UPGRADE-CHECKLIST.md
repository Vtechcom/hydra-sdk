# Playground Upgrade Checklist — trọng tâm `/transaction-builder`

> Trạng thái: **ĐÃ TRIỂN KHAI** — P0 → P4 cho `/transaction-builder` (xem §10 để biết mục nào còn lại).
> Tham chiếu design: `apps/docs-v2` (đã deploy hydrasdk.com).

## 0. Quyết định đã chốt

| # | Quyết định | Hệ quả |
|---|---|---|
| 1 | **Giữ shadcn-vue**, chỉ thay token / font / dark mode | Không đụng ~30 component `components/ui/*`; không migrate Nuxt UI, không upgrade Nuxt 4 |
| 2 | **Bỏ free-drag** (`vue3-grid-layout-next`) | Xem §2 — chọn 1 trong 3 phương án layout |
| 3 | **Primary = green** khớp docs-v2 (`#00DC82`) | Purple `#b13dff` bị loại khỏi primary; Element Plus themeChalk purple thành lệch → xem §6.4 |
| 4 | **Làm `/transaction-builder` trước** | `/`, `/hydra-tx-trace`, 2 trang test làm phase sau |
| 5 | **Có TypeScript snippet generator** + bổ sung tính năng cho đủ SDK | Xem §3 và §4 |

---

## 1. Hiện trạng tóm tắt (ghi lại lúc khảo sát, trước khi làm)

- Playground: Nuxt 3.19 + shadcn-vue + Element Plus + reka-ui; primary purple; Inter; **dark mode bị ép tắt** (`app.vue:18-20`); grid free-drag còn nền debug `bg-amber-100`.
- docs-v2: Nuxt UI 4; green `#00DC82`; Public Sans + Space Grotesk; aurora background; `.hcard` / `.eyebrow` / `.reveal`.
- SDK đã ở `core 1.4.1 / transaction 1.2.1 / bridge 2.0.0 / cardano-wasm 1.0.0` (playground dùng `workspace:*` nên đã đúng version, nhưng **code chưa theo contract mới**).
- **UI hiện chỉ phủ ~15% API của `TxBuilder`** (xem §3).

---

## 2. Phương án layout thay cho free-drag

Ràng buộc: 6 khối hiện có (Wallet, Provider, UTxO Manager, TxBuilder, TxSigner, TxSubmit) + các khối mới (Result tabs, Code snippet, Advanced options). Cần: responsive, có luồng rõ, không mất tính "workspace" cho power user.

### Phương án A — Workspace 3 cột + bottom dock ⭐ khuyến nghị

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ◆ Hydra SDK · PLAYGROUND   [Preprod ▾]   ●Draft ─ ○Built ─ ○Signed ─ ○Sent   │
├───────────────┬───────────────────────────────────┬──────────────────────────┤
│ CONTEXT       │ BUILDER                           │ RESULT                   │
│ 280–320px     │ flex, min 480px                   │ flex 1.2, min 420px      │
│ collapse →48px│                                   │                          │
│               │ ┌ Inputs ──────────── 3 UTxO ───┐ │ [Summary][CBOR][JSON][TS]│
│ ▾ Wallet      │ │ ☑ 8f2a…#0  120.5 ADA  +2 asset│ │ ──────────────────────── │
│   addr1q…  ⧉  │ │ ☑ b71c…#1    5.0 ADA          │ │ Fee          0.172 ADA   │
│ ▾ Provider    │ │ strategy: LargestFirstMulti ▾ │ │ Total in   125.500 ADA   │
│   ● connected │ └───────────────────────────────┘ │ Total out  120.000 ADA   │
│ ▾ Protocol    │ ┌ Outputs ─────────── 1 output ─┐ │ Change       5.328 ADA   │
│   PV11 default│ │ #1 addr_test1…  100 ADA   [⋯] │ │ Size            412 B    │
│ ▾ UTxO Manager│ │ + Recipient      ⇄ JSON mode  │ │ ✓ min-ADA hợp lệ         │
│   [ Query ]   │ └───────────────────────────────┘ │ ──── Asset delta ─────── │
│   • 12 UTxO   │ ┌ Options ──────────────────────┐ │ lovelace     −5,300,000  │
│               │ │ ☐Hydra ☐Custom fee ☐Custom pP │ │ MIN          −2,000,000  │
│               │ │ ▸ Mint  ▸ Certs  ▸ Metadata   │ │                          │
│               │ │ ▸ Validity  ▸ Collateral      │ │ [Copy] [Download] [Reset]│
│               │ └───────────────────────────────┘ │                          │
│               │      [ ⚡ Build transaction ]      │                          │
├───────────────┴───────────────────────────────────┴──────────────────────────┤
│ ▸ Signer   ▸ Submitter   ▸ Code snippet          bottom dock, collapse được   │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Splitter kéo được giữa 3 cột (`components/ui/resizable` đã có sẵn), lưu tỉ lệ vào `ui.store`.
- Bottom dock mở khi build xong; Build → Signer → Submitter tự đẩy dữ liệu sang nhau.
- `< lg`: 3 cột xếp chồng thành accordion theo đúng thứ tự Context → Builder → Result.
- **Ưu**: giữ được cảm giác workspace/IDE, mọi thứ nhìn thấy cùng lúc, không mất drag-để-sắp-xếp mà vẫn responsive. **Nhược**: cần màn ≥1280px mới đẹp nhất.

### Phương án B — Stepper (wizard)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ①Setup ─── ②Inputs ─── ③Outputs ─── ④Options ─── ⑤Build ─── ⑥Sign&Submit │
├──────────────────────────────────────────────────────────────────────┤
│            [ nội dung step hiện tại — 1 cột ~760px ]                 │
│                                        [ ← Back ]  [ Next → ]        │
├──────────────────────────────────────────────────────────────────────┤
│  sticky: fee 0.172 ADA · in 125.5 · out 120.0 · txId 8f2a…           │
└──────────────────────────────────────────────────────────────────────┘
```

- **Ưu**: dễ nhất cho người mới, mobile-first tự nhiên, validate theo từng bước. **Nhược**: power user phải click nhiều, không thấy toàn cảnh, sửa output phải quay lui — sai tinh thần "playground".

### Phương án C — 2 cột: accordion trái + result sticky phải

```
┌────────────────────────────────┬─────────────────────────────┐
│ ▾ 1. Context (wallet/provider) │  RESULT (sticky)            │
│ ▾ 2. Inputs           3 UTxO   │  [Summary|CBOR|JSON|TS]     │
│ ▾ 3. Outputs          1 out    │                             │
│ ▸ 4. Options                   │  fee · in/out · size        │
│ ▸ 5. Sign & Submit             │  [Copy] [Download]          │
│        [ ⚡ Build ]             │                             │
└────────────────────────────────┴─────────────────────────────┘
```

- **Ưu**: đơn giản nhất để code, responsive dễ, hợp cả màn 1024px. **Nhược**: accordion đóng/mở nhiều, mất cảm giác workspace; UTxO Manager (cần rộng) bị nhét vào cột hẹp.

### Đề xuất → **đã chọn A và làm xong**

- [x] Desktop: 3 cột resizable (`ResizablePanelGroup`), tỉ lệ lưu vào `ui.store`, cột Context collapse xuống strip 48px.
- [x] Dưới `lg`: cùng bộ panel đó chuyển thành tabs `Context | Build | Result` (vai trò của phương án C).
- [x] Tính dẫn dắt của B giữ qua status bar `Draft → Built → Signed → Sent`.
- [x] Bottom dock (Signer + Submitter) tự mở khi build xong; snippet TS nằm trong tab TS của Result thay vì dock.
- [x] **Bẫy localStorage**: key cũ `layout.0.0.1` (schema `vue3-grid-layout`) bị bỏ hẳn, workspace mới dùng `hydra-playground.workspace.v1` nên user cũ không bị vỡ layout.

---

## 3. Gap: `TxBuilder` API vs UI hiện tại

Toàn bộ API công khai của `TxBuilder` (từ `packages/hydra-transaction/src/tx-builder/index.ts`) đối chiếu với những gì UI đang cho làm:

| Nhóm | API | UI hiện tại | Đề xuất |
|---|---|---|---|
| **Inputs** | `setInputs(utxos, {strategy})` | ✅ (không cho chọn strategy) | Thêm selector 4 strategy (`COIN_SELECTION_STRATEGY`) |
| | `txIn()` thủ công | ❌ | Nhập tay `txHash#index` khi không có provider |
| | `txInReference()` (reference input) | ❌ | Mục Advanced |
| | `txInScript()` / `spendingPlutusScript()` | ❌ | **Script input panel** (CBOR + version V1/V2/V3) |
| | `txInDatumHash()` / `txInInlineDatum()` | ❌ | Đi kèm script input |
| | `txInRedeemerValue()` / `txInEmptyRedeemer()` | ❌ | Redeemer editor (`RedeemerUtils` bên core) |
| | `txInCollateral()` / `totalCollateral()` / `collateralReturn()` | ❌ | **Collateral panel** — bắt buộc khi có script |
| **Outputs** | `addOutput()` | ✅ | Giữ, thêm validate min-ADA |
| | `txOutDatumHashValue()` / `txOutInlineDatumValue()` | ✅ (dán CBOR thô) | Datum **builder** bằng `DatumUtils.mkBool/mkOption/mkBytesList/mkIntList/mkOutputRef/mkAddress` |
| | `txOutReferenceScript()` | ❌ | Mục Advanced |
| **Mint** | `mint()` / `mintingScript()` / `mintPlutusScript()` / `mintRedeemerValue()` | ❌ | **Mint panel**: policyId + assetName + quantity (âm = burn), script native/Plutus (`PolicyUtils` bên core) |
| **Stake** | `registerStake()` / `deregisterStake()` / `delegateStake()` / `withdrawal()` | ❌ | **Certificates panel** — mới thật sự hoạt động từ transaction 1.2.0 |
| **Metadata** | `metadataValue(label, value)` / `auxiliaryData(hash)` | ❌ | **Metadata panel**: label + JSON (`MetadataUtils`), preview CIP-20/721 |
| **Validity** | `invalidBefore()` / `invalidAfter()` | ❌ | Slot picker + đổi từ datetime bằng `TimeUtils` |
| | `requiredSignerHash()` | ❌ | Danh sách pubKeyHash (multisig) |
| **Fee** | `setFee()` | ✅ | Giữ |
| | `setMinFee()` / `calculateFee()` | ❌ | Hiện fee tính được vs fee đặt tay |
| | `updateProtocolParams()` / `params` | ⚠️ checkbox **disabled** (`Index.vue:226`) | Bật + editor pParams (PV11 defaults của core 1.4.0) |
| **Build** | `complete()` | ✅ **không free → rò WASM** | Bọc `try/finally` + `dispose()` |
| | `completeCbor()` | ❌ | Dùng cho luồng chỉ cần hex |
| | `reset()` / `dispose()` | ❌ | Nút "Reset builder"; dispose khi unmount |
| **Options** | `isHydra` | ✅ | Giữ |
| | `evaluator` / `txEvaluationMultiplier` | ❌ | Toggle "Evaluate ExUnits" (Blockfrost) + ô multiplier |
| | `fetcher` / `submitter` | ❌ | Nối vào provider store sẵn có |
| | `verbose` / `errorLogger` | ❌ | Toggle "Debug mode" → log ra panel Errors |

**Ước lượng lúc khảo sát: UI phủ 6/30 dòng API.** Chia 3 tầng để không làm UI ngộp — cả 3 tầng đều đã làm:

- [x] **Tier 1 — luôn hiện**: Inputs (+ strategy), Outputs (+ min-ADA + asset picker), Change, Fee, min-fee, Hydra, Build.
- [x] **Tier 2 — accordion "Advanced"**: Custom pParams, Metadata, Mint/burn, Validity, Required signers, Collateral (+ total + return).
- [x] **Tier 3 — accordion "Expert"**: Script input (+ datum + redeemer + exUnits), Reference inputs, Certificates, Withdrawals, Evaluator, Verbose.

**Sau khi làm: 9/9 nhóm đã có UI; còn 6 dòng API lẻ chưa expose** —
`txIn()` nhập tay cho input thường (hiện chỉ script input mới nhập tay được),
`txOutReferenceScript()`,
`auxiliaryData(hash)` (mới có `metadataValue`),
hiển thị `calculateFee()`,
`fetcher`/`submitter` bơm thẳng vào `TxBuilder` (submit hiện đi qua provider store),
`errorLogger` (mới có `verbose`).
Ngoài ra vài "đề xuất" trong bảng chưa làm: datum builder bằng `DatumUtils`, slot picker theo `TimeUtils`, dựng policy bằng `PolicyUtils`, preview CIP-20/721.

---

## 4. TypeScript snippet generator

- [x] Tab **`TS`** trong panel Result, cập nhật **live** theo state builder (không cần bấm Build).
- [x] Sinh đúng thứ tự gọi API, ví dụ:

```ts
import { TxBuilder } from '@hydra-sdk/transaction'
import { Deserializer, Resolver } from '@hydra-sdk/core'

const builder = new TxBuilder({ isHydra: false })
builder.setInputs(utxos, { strategy: 'LargestFirstMultiAsset' })
builder.addOutput({ address: 'addr_test1…', amount: [{ unit: 'lovelace', quantity: '100000000' }] })
builder.setChangeAddress('addr_test1…')

const tx = await builder.complete()
try {
  const cborHex = tx.to_hex()
  const txId = Resolver.resolveTxHash(cborHex)
} finally {
  tx.free()        // Transaction sống trong WASM — phải free
  builder.dispose() // giải phóng toàn bộ bộ nhớ WASM của builder
}
```

- [x] Render bằng shiki (đã có), theme theo color mode; nút Copy + Download.
- [x] **Snippet phản chiếu đúng form**: mọi row (mint / cert / withdrawal / collateral / metadata / reference input / signer) đều được sinh ra kể cả khi còn field trống. Trước đó snippet `continue` khi thiếu `policyId` nên mint không bao giờ xuất hiện.
- [ ] Link "Open in docs" từ snippet sang docs-v2 — **chưa làm**.
- [x] Sinh kèm phần khai báo `utxos` (từ inputs đang chọn) để snippet chạy được ngay khi paste.
- [x] Biến thể: `complete()` vs `completeCbor()` — nút toggle `completeCbor()` trong tab TS.
- [x] **Giá trị phụ**: snippet dạy đúng WASM lifecycle — thứ mà chính playground đang làm sai.

> Code: `composables/useTxSnippet.ts` + tab TS trong `components/workspace/ResultPanel.vue`.

---

## 5. Nâng cấp theo SDK mới (bug + API)

### 5.1 Bắt buộc (P0)

- [x] **Rò WASM** — build path mới (`stores/txbuilder.store.ts`) bọc `try/finally`: `tx.free()`, free mọi datum/redeemer caller-owned đã cấp cho builder, rồi `builder.dispose()`. Kiểm chứng: build 5 lần liên tiếp có inline datum, fee giống hệt nhau, không use-after-free.
- [x] **Bug nút `Set`** ở JSON mode → nút "Apply JSON" thật, có validate + báo lỗi (`components/workspace/OutputsPanel.vue`).
- [x] **Shiki hardcode `github-light`** → chọn `github-dark`/`github-light` theo `useColorMode()`.
- [x] Xoá dead code `txOutputs` (cả file `components/tx-builder/` đã bị thay thế).

### 5.2 API mới nên khai thác

- [x] Bật `useCustomPParams` — checkbox + editor 8 field, nút reset về PV11 defaults.
- [x] `evaluator` + `txEvaluationMultiplier` — toggle trong Expert; `IEvaluator` tự viết trên Blockfrost `/utils/txs/evaluate` (`lib/evaluator.ts`) vì core chưa có provider nào implement.
- [x] Fee thật trong Summary (fee / total in / total out / change / size). *Chưa* tách riêng phần script-fee vs linear-fee.
- [x] Output amounts (merge theo unit) trong Summary — **đọc từ tx JSON đã decode**, không dùng `deserializeAmountsFromTx()`: hàm đó đang trả unit sai, xem bug ở §10.
- [ ] `resolveTxFees(txSize)` để so fee ước tính vs fee thực tế — **chưa làm**.
- [x] min-ADA per output — ước lượng theo công thức `(160 + size) × coinsPerUtxoSize` (`lib/min-ada.ts`), cảnh báo inline dưới ô ADA. Không dùng CSL `min_ada_for_output` vì nó cần cấp/giải phóng WASM trên mỗi lần gõ phím; build vẫn là nguồn phán quyết cuối.

### 5.3 bridge 2.0.0 — dọn nợ (phase sau)

- [ ] 4 component **dead, không page nào dùng**, còn viết theo bridge v1: `components/HydraBridgeContainer.vue`, `components/WebsocketContainer.vue`, `components/WalletConfig.vue` (bản root), `components/CardanoMainchainInfo.vue` → xoá hoặc port theo `packages/hydra-bridge/MIGRATION-v2.md`.
- [ ] Cơ hội: `submitL2Tx()` để submit thẳng vào Hydra head khi bật "Use Hydra"; `getRawProtocolParameters()`; `bridge.syncedStatus` / `nodeVersion`.

---

## 6. Design system → green (khớp docs-v2)

### 6.1 Token (`assets/css/tailwind.css`)

- [x] Thay scale `--color-primary-*` purple bằng **green scale của docs-v2**; `--color-green-*` cũng trỏ về cùng scale để CSS port từ docs chạy nguyên văn.
- [x] Map lại semantic token shadcn cho **cả `:root` và `.dark`**. Light dùng green-700 cho `--primary` (đạt 4.5:1 cả khi làm chữ lẫn nền nút); dark dùng green-400.
- [x] `--border` / `--input` chuyển từ `secondary-100` (ám xanh dương) sang neutral; scale secondary blue giữ nguyên cho thông tin.
- [x] Xoá `@layer base` bị lặp 2 lần.
- [x] Cập nhật `assets/scss/base/_scrollbar.scss` + `main.scss` theo token (kèm `scrollbar-color` cho Firefox).

### 6.2 Typography

- [x] `@nuxtjs/google-fonts`: Inter → **Public Sans** (body) + **Space Grotesk** (`--font-display`, heading `letter-spacing: -0.02em`).
- [x] **Giữ JetBrains Mono** cho CBOR / hash / address.

### 6.3 Surface, motion, dark

- [x] Port `.hcard` + `.eyebrow`; aurora background **bản tĩnh** (bỏ `aurora-breath 14s`).
- [x] Bỏ ép `colorMode.preference = 'light'`; thêm `BaseColorModeToggle` trên header; `preference: 'system'` + `fallback: 'dark'`.
- [x] Quét hardcode `bg-amber-*` / `bg-white` / `text-gray-*` — các file chứa chúng đều đã bị xoá hoặc viết lại.
- [x] Tôn trọng `prefers-reduced-motion` (hover-lift của `.hcard` nằm trong `@media (prefers-reduced-motion: no-preference)`).

### 6.4 Element Plus (lưu ý khi đổi sang green)

`nuxt.config.ts:116-128` cấu hình themeChalk primary purple. Element Plus **không dùng ở `/transaction-builder`** (chỉ ở `/`, `/hydra-tx-trace`, 2 trang test). Sau khi đổi green, các trang đó sẽ lệch màu.
- [x] Trước mắt: đổi `$colors.primary.base` sang green (`#007f45` light / `#00dc82` dark).
- [ ] Phase sau: gỡ hẳn Element Plus (~70 chỗ dùng ở 4 trang + 4 component dead) — **chưa làm**.

### 6.5 Header & meta

- [x] `components/layout/MainHeader.vue` viết lại theo `AppHeader.vue` của docs: logo + wordmark 2 dòng, cùng bộ social links (GitHub / Discord / X), cao 56px.
- [x] Link Playground → Docs (`hydrasdk.com`).
- [ ] Link ngược Docs → Playground (sửa bên `apps/docs-v2`) — **chưa làm**.
- [x] Sửa meta sai: `theme-color` → `#00dc82`; `og:locale` → `en_US`.
- [ ] Thống nhất logo giữa hai site (playground vẫn dùng `/logo-sdk.png`) — **chưa làm**.

---

## 7. UX chi tiết `/transaction-builder`

- [x] **Hand-off**: build xong → dock tự mở, CBOR chảy sang Signer; ký xong → chảy sang Submitter. Status bar `Draft → Built → Signed → Sent`.
- [x] **Tx summary**: fee, tổng in/out, change, size, số input/output, output amounts theo unit, cảnh báo Hydra unbalanced. (min-ADA cảnh báo nằm ngay dưới ô ADA của từng output.)
- [x] **Inputs**: checkbox chọn UTxO trong Context, badge số asset, "Select all", hiển thị tổng ADA/asset.
- [ ] Filter / sort / "select until X ADA" cho danh sách UTxO — **chưa làm**.
- [x] **Outputs**: ô nhập theo ADA (tự quy đổi lovelace), **asset picker lấy từ asset có trong inputs**, cảnh báo min-ADA realtime.
- [ ] Nút "max" cho ô ADA — **chưa làm**.
- [x] **Persist + share**: draft lưu `hydra-playground.tx-draft.v1` (có `mergeDefaults` để tiến hoá schema) + "Share" encode draft vào URL fragment.
- [x] **Presets 1-click**: 6 preset — Simple transfer, Multi-asset, Hydra L2, Inline datum, Metadata, Mint. Preset mint dựng policy `sig` thật từ địa chỉ ví đang cấu hình (`PolicyUtils.buildMintingPolicyScriptFromAddress` + `policyIdFromNativeScript`) nên build ra tx có mint thật, không còn form rỗng.
- [x] Lỗi validate **inline**: danh sách lý do ngay trên nút Build, lỗi datum/metadata/provider hiện tại field; toast chỉ dùng cho kết quả.
- [x] **Không còn "silent skip"**: row thiếu field (mint, script input, cert, withdrawal, collateral, reference input, metadata, signer) là lỗi validate chặn Build, thay vì bị bỏ qua âm thầm khi build.
- [x] Mật độ chữ: input `h-6` → `h-7`/`h-8`, nhãn về `text-xs`; `text-[11px]` chỉ giữ cho dữ liệu mono dày (hash, unit, CBOR).
- [x] Empty state cho Inputs / UTxO manager / Result + trạng thái "chưa có wallet / provider".
- [x] Loading cho Build & Query UTxO; nút Build disable kèm **liệt kê lý do** ngay trên nút (thay vì tooltip).
- [x] Tooltip UTxO in nguyên JSON → dòng gọn + hover xem units + click expand chi tiết (`components/workspace/UtxoRow.vue`).
- [x] Keyboard `⌘/Ctrl+B` để build; `aria-label` cho mọi nút icon-only; focus ring theo token.
- [ ] Command palette `⌘/Ctrl+K` — **chưa làm**.

---

## 8. Roadmap

| Phase | Nội dung | Trạng thái |
|---|---|---|
| **P0** | §5.1 — rò WASM, bug `Set`, shiki theme, dead code | ✅ xong |
| **P1** | §6 — token green, font, dark mode, header | ✅ xong (trừ gỡ Element Plus + thống nhất logo) |
| **P2** | §2 — layout A + hand-off + Result tabs | ✅ xong |
| **P3** | §4 snippet generator + §3 Tier 1 & 2 | ✅ xong |
| **P4** | §3 Tier 3 (script/redeemer/certs/evaluator) | ✅ xong — **chưa test với script tx thật** |
| **P5** | §5.3 bridge v2 + §6.4 gỡ Element Plus + các trang còn lại | ⬜ chưa làm |

---

## 9. Quyết định đợt 2 (đã chốt)

1. **Layout A** — workspace 3 cột + bottom dock; UTxO hiển thị gọn, hover xem units, click để expand.
2. **Tier 3 làm luôn** — script input + redeemer, reference input, certificates, withdrawals, evaluator, debug.
3. **Có sample UTxO** — bộ fixture offline để dùng được khi chưa có Blockfrost key.

---

## 10. Kết quả triển khai

### Đã xong

- **P0** — rò WASM (`tx.free()` + `builder.dispose()` + free datum/redeemer caller-owned trong `finally`), nút `Set` JSON, shiki theo color mode, dead code.
- **P1** — token green, Public Sans + Space Grotesk, dark mode bật lại, aurora tĩnh + `.hcard` + `.eyebrow`, header khớp docs, meta/theme-color/og:locale.
- **P2** — layout A: 3 cột resizable + status bar `Draft → Built → Signed → Sent` + bottom dock tự mở khi build xong; dưới `lg` chuyển thành tabs. Gỡ `vue3-grid-layout-next`.
- **P3** — Result tabs `Summary | CBOR | JSON | TS`; snippet TypeScript live; Tier 1 + 2 (strategy, pParams PV11, metadata, mint/burn, validity, required signers, collateral).
- **P4** — Tier 3 (script input + datum + redeemer + exUnits, reference inputs, certificates, withdrawals, Blockfrost evaluator, verbose).
- **P4b** — sample UTxO offline, 6 preset, persist draft có version, share link qua URL fragment.

### File mới đáng chú ý

| File | Vai trò |
|---|---|
| `stores/txbuilder.store.ts` | Toàn bộ state builder + build/sign/submit (WASM-safe) |
| `composables/useTxSnippet.ts` | Sinh TypeScript từ draft |
| `lib/evaluator.ts` | `IEvaluator` chạy trên Blockfrost `/utils/txs/evaluate` |
| `lib/tx-draft.ts` | Kiểu dữ liệu draft + `createDefaultDraft()` — tách khỏi store để preset/snippet không import vòng |
| `lib/tx-fixtures.ts` | Sample UTxO + preset |
| `lib/min-ada.ts` | Ước lượng min-ADA (chỉ để cảnh báo) |
| `lib/share.ts` | Encode/decode draft vào URL fragment |
| `components/workspace/*` | 14 component của workspace mới |

### Bug SDK phát hiện được (chưa sửa — nằm ngoài phạm vi đợt này)

`Deserializer.deserializeAmountsFromTx()` (core 1.4.x, `src/utils/cardano-wasm/deserializer.ts:180`) dựng unit bằng `assetName.to_hex()`. Hàm này trả về **CBOR** của asset name, không phải bytes thô: name `4d494e` ("MIN") ra `434d494e` (`43` là header byte-string). Hệ quả: unit trả về không khớp dạng `policyId + assetNameHex` mà `fetchAddressUTxOs` / Blockfrost dùng, và tên asset decode ra thừa 1 ký tự.
Fix: dùng `assetName.name()` rồi hex-encode. Playground tạm né bằng cách đọc amounts từ tx JSON đã decode.

### Đã kiểm chứng

- `pnpm exec nuxt build` xanh; `pnpm build:packages` xanh; eslint 0 error (chỉ còn warning `require-default-prop` đúng loại mà các component shadcn sẵn có cũng có).
- Chạy thật trong trình duyệt (Playwright, dev server 3007): preset → Build → Sign chạy trọn, CBOR ký xong tự chảy sang Submitter; console 0 error/warning.
- Build 5 lần liên tiếp với inline datum → fee giống hệt nhau (xác nhận `free()` không gây use-after-free).
- Preset metadata → tx build ra có `auxiliary_data_hash`.
- Preset mint → snippet có `builder.mint(...)` + `mintingScript(...)`; tx build ra có `mint` trong body và native script trong witness set; Summary hiện `HYDRA 1,000`.
- Thêm 1 row mint rỗng → nút Build bị chặn kèm lý do ("Mint #2: policy id is empty" / "policy script CBOR is empty").
- Kiểm dark + light + viewport 430px.
- **Chưa test**: script input / redeemer / evaluator với script tx thật, mint với policy script thật, submit lên mạng thật (cần Blockfrost key).

### Còn lại

**P5 — dọn nợ, tách PR riêng**
- Gỡ 4 component dead theo bridge v1: `HydraBridgeContainer.vue`, `WebsocketContainer.vue`, `WalletConfig.vue` (root), `CardanoMainchainInfo.vue`.
- Hydra L2: `submitL2Tx()` khi bật Hydra mode.
- Gỡ Element Plus khỏi `/`, `/hydra-tx-trace`, 2 trang test (hiện đã đổi themeChalk sang green để đỡ lệch).
- Cập nhật `README.md` + ảnh `/images/tx-builder-demo.png`.
- Playwright smoke test cho luồng build → sign → submit.

**Việc nhỏ chưa làm trong `/transaction-builder`**
- Datum builder bằng `DatumUtils` (hiện vẫn dán CBOR hex).
- Filter / sort / "select until X ADA" cho danh sách UTxO; nút "max" cho ô ADA.
- Command palette `⌘K`; link "Open in docs" trong tab TS.
- `resolveTxFees()` để so fee ước tính vs thực tế.
- 6 dòng API lẻ ở cuối §3.
- Thống nhất logo + link ngược từ docs-v2 sang playground.
