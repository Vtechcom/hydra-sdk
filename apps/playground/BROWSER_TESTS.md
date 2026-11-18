# Browser Cardano WASM Testing Guide

This guide demonstrates how to test the automatic environment detection of `@hydra-sdk/cardano-wasm` in a browser environment using the playground application.

## Test Environment

- **Application**: Nuxt 3 playground app
- **URL**: http://localhost:30019
- **Test Page**: http://localhost:30019/cardano-wasm-test

## Available Tests

### 1. Automated Browser Tests
Visit `/cardano-wasm-test` page and click "Run Tests" to execute:

- ✅ **Import Test**: Verifies CardanoWASM can be imported successfully
- ✅ **Environment Detection**: Confirms browser version is loaded
- ✅ **BigNum Functionality**: Tests basic BigNum creation and conversion
- ✅ **Mathematical Operations**: Tests BigNum addition operations
- ✅ **Method Discovery**: Lists available methods and classes

### 2. Interactive BigNum Calculator
- Input two numbers
- Perform addition, subtraction, multiplication, division
- See real-time results using CardanoWASM BigNum operations

### 3. Address Generator
- Generate random Cardano addresses (demo purposes)
- Shows address creation capabilities

### 4. Manual Console Testing
Use the browser console (F12) to run manual tests:

```javascript
// Test basic import and functionality
const { CardanoWASM } = await import('@hydra-sdk/cardano-wasm')
console.log('CardanoWASM loaded:', !!CardanoWASM)
console.log('Type:', typeof CardanoWASM)

// Test BigNum operations
const bigNum1 = CardanoWASM.BigNum.from_str('1000000')
const bigNum2 = CardanoWASM.BigNum.from_str('2000000')
const sum = bigNum1.checked_add(bigNum2)
console.log(`Result: ${sum.to_str()}`)

// List available methods
console.log('Available methods:', Object.keys(CardanoWASM).length)
```

## Expected Results

### ✅ Browser Environment Detection
- Automatically uses `@emurgo/cardano-serialization-lib-browser`
- No manual configuration required
- Conditional exports working correctly

### ✅ Full Functionality
- All BigNum operations working
- Mathematical operations (add, subtract, multiply, divide)
- Address generation capabilities
- All core Cardano WASM features available

### ✅ Integration Success
- Works seamlessly with Nuxt 3
- TypeScript support
- Vite bundler compatibility
- WASM loading works correctly

## Technical Details

### Conditional Exports in Action
The `package.json` exports field ensures that:
```json
{
  "exports": {
    ".": {
      "browser": {
        "types": "./dist/index.d.ts",
        "import": "./dist/index.mjs",
        "require": "./dist/index.js"
      },
      "node": {
        "types": "./dist/index.node.d.ts", 
        "import": "./dist/index.node.mjs",
        "require": "./dist/index.node.js"
      }
    }
  }
}
```

### Browser Bundle
- Uses `dist/index.mjs` (ESM) or `dist/index.js` (CommonJS)
- Imports `@emurgo/cardano-serialization-lib-browser`
- Compatible with modern bundlers (Vite, Webpack, etc.)

### Vite Configuration
The playground uses Vite plugins for WASM support:
- `vite-plugin-wasm`
- `vite-plugin-top-level-await`
- `vite-plugin-node-polyfills`

## Comparison: Node.js vs Browser

| Feature | Node.js | Browser |
|---------|---------|---------|
| **Library** | `@emurgo/cardano-serialization-lib-nodejs` | `@emurgo/cardano-serialization-lib-browser` |
| **Bundle** | `dist/index.node.mjs` | `dist/index.mjs` |
| **Detection** | `node` condition | `browser` condition |
| **Import** | Same: `import { CardanoWASM } from '@hydra-sdk/cardano-wasm'` | Same: `import { CardanoWASM } from '@hydra-sdk/cardano-wasm'` |
| **Functionality** | Full Cardano operations | Full Cardano operations |

## Testing Commands

```bash
# Start the playground (from workspace root)
pnpm --filter hydrawallet-playground dev

# Build cardano-wasm package
pnpm --filter @hydra-sdk/cardano-wasm build

# Access the browser test
# http://localhost:30019/cardano-wasm-test
```

This demonstrates that the same import statement `import { CardanoWASM } from '@hydra-sdk/cardano-wasm'` automatically provides the correct version for each environment without any manual configuration!

## F4 — Copy object UTxO (playground 0.1.2)

Chuẩn bị: `pnpm dev:playground`, mở `/transaction-builder`, trong rail Context bấm **UTxO manager → Sample data** (3 UTxO mẫu offline, không cần Blockfrost key).

| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| F4-1 | Nhìn hàng gọn của một UTxO có asset | Thứ tự: số ADA → badge `+N` → icon copy → nút expand (→ nút remove nếu là InputsPanel). |
| F4-2 | Hover icon copy | Tooltip "Copy UTxO"; screen reader đọc "Copy UTxO as JSON". |
| F4-3 (AC4.1) | Bấm icon copy trên UTxO đầu tiên, dán clipboard vào DevTools: `JSON.parse(await navigator.clipboard.readText())` | Toast "Copied to clipboard". JSON parse được, shape `{ input: { txHash, outputIndex }, output: { address, amount } }`, khớp ref / ADA / asset đang hiển thị; không có key mang giá trị `undefined`. |
| F4-4 (AC4.3) | Bấm icon copy trên hàng ở UTxO manager (chưa chọn và đã chọn), rồi tick một UTxO và bấm copy trên hàng tương ứng trong panel **Inputs** | Checkbox giữ nguyên trạng thái, hàng không expand, UTxO không bị bỏ khỏi Inputs. |
| F4-5 (AC4.2) | UTxO có inline datum (cần ví/địa chỉ script có UTxO kèm inline datum trên preprod) → bấm copy | `output.inlineDatum` là chuỗi CBOR hex (vd `d8799f…`), không phải `{}` hay `{"__wbg_ptr":…}`. |

Ghi chú: sample data hiện không có UTxO nào kèm inline datum, nên F4-5 chỉ chạy tay được khi có chain thật. Logic chuyển `PlutusData` → hex nằm trong hàm thuần `serializeUtxo` ở `lib/utxo.ts`.

## F1 — Derivation path (playground 0.1.2)

Trang `/transaction-builder`, panel Context → Wallet. Seed test cố định (không có tiền): `test walk nut penalty hip pave soap entry language right filter choice`, network Preprod. Địa chỉ tham chiếu lấy từ `new AppWallet({ networkId: 0, key: { type: 'mnemonic', words } }).getAccount(a, k).baseAddressBech32` chạy độc lập trong Node:

| Path | Địa chỉ mong đợi |
|---|---|
| `0'/0/0` | `addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp` |
| `0'/0/1` | `addr_test1qz7svwszky8gcmhrfza7a89z9u0dfzd3l7h23sqlc5yml7upc8zrvs42gnjnje39ypyc2ukyg34pr52z8gwwsc7n394sxgs4pg` |
| `1'/0/3` | `addr_test1qzglrh8aj4nnlk8l8vvkakw87l63fmpkj34qn74muv8f97w5pnvux7c2e2mtpm72dzyh3yup9jn6zx7zu6k87dhgxzzquetyxd` |

1. **Mặc định không đổi (AC1.1):** "Set up wallet" → dán seed, để `Account index` = `0`, `Key index` = `0` → Apply. Dòng `Path` hiện `0'/0/0`, địa chỉ khớp dòng `0'/0/0` ở bảng (giống bản 0.1.1).
2. **Key index khác (AC1.2):** nhập seed, `Account index` để trống, `Key index` = `1`. Ô path chỉ đọc hiện `m/1852'/1815'/0'/0/1` → Apply. Địa chỉ (nút copy) khớp dòng `0'/0/1`.
3. **Validate:** nhập `-1`, `abc` hoặc `2147483648` → ô viền đỏ, báo "Enter a whole number from 0 to 2147483647", path hiện `?`, nút Apply bị khoá. `2147483647` được chấp nhận. Ô rỗng được tính là `0`.
4. **Chỉ đổi index, giữ root key:** khi đã có wallet, bấm "Change" → textarea trống, hai ô index hiện giá trị đang dùng, có dòng gợi ý "Leave the key field empty…". Đổi `Key index` → Apply. Toast "Derivation path updated", dòng `Root key` không đổi, `Path` và `Address` đổi theo.
5. **Nhánh lỗi:** "Change" → nhập seed sai (`foo bar baz`) + `Key index` = `5` → Apply. Báo "Invalid mnemonic", wallet bị xoá, `sessionStorage.walletDerivation` về `{"accountIndex":0,"keyIndex":0}`.
6. **Lưu trữ (AC1.4):** đặt path `0'/0/1` → reload tab → `Path` vẫn `0'/0/1`, địa chỉ giữ nguyên. Đóng tab, mở tab mới → "No wallet yet", `walletDerivation` về `0/0`.
7. **Change address / preset mint:** với path `0'/0/1`, nút "Use as change address" và Presets → Mint dùng địa chỉ `0'/0/1`; policy script của preset mint là `8200581c` + payment key hash của địa chỉ đó (`bd063a02…`).
8. **Index thật sự đi vào `signTx`:** ký cùng một tx chưa ký với path `0'/0/0` rồi `0'/0/1`. vkey trong witness set phải khác nhau: `73fea80d…5a7d` cho `0/0`, `f626ab88…d4a1` cho `0/1`; hash của mỗi vkey bằng payment key hash của địa chỉ tương ứng.
9. **Submit preprod (AC1.3):** cần ví preprod có tiền. Tiêu UTxO của địa chỉ key `1` và ký với path `0'/0/1` → submit thành công. Ký cùng tx đó với path `0'/0/0` → node từ chối (thiếu witness).

## Playground 0.1.2 — F2/F3: modal provider (Blockfrost / Demeter) và Remember API key

Trang `/transaction-builder`, panel Context › Provider › **Configure**. Mở DevTools (Application + Network) trước khi chạy. Request có thể quan sát trong tab Network kể cả khi server trả lỗi; với key giả thì xem URL và header, không xem kết quả.

| # | Bước | Kết quả mong đợi |
|---|---|---|
| P1 (AC3.5) | Ở tab mới, network Preprod: trong Console chạy `sessionStorage.setItem('blockfrostConfig', JSON.stringify({ apiKey: 'preprodXXX', apiEndpoint: 'https://cardano-preprod.blockfrost.io/api/v0' }))`, rồi reload. | Panel hiện `Blockfrost connected`. sessionStorage không còn `blockfrostConfig`; có `providerConfig` với `kind: "blockfrost"`, `network: "preprod"`. |
| P2 (AC3.1) | Tab Blockfrost, URL mặc định, nhập key preprod thật → Connect. Query UTxO một địa chỉ có tiền, rồi build + sign + submit. | Query trả UTxO, submit trả tx id như 0.1.1. Cần key Blockfrost preprod thật và ví có tADA. |
| P3 (AC3.2) | Tab Blockfrost, sửa API URL thành `https://my-proxy.example.test/preprod/api/v0`, key `preprod…` → Connect. Query UTxO, rồi dán một CBOR bất kỳ vào ô Submitter → Submit. | Tab Network: `GET https://my-proxy.example.test/preprod/api/v0/addresses/{addr}/utxos` và `POST …/api/v0/tx/submit`, header `project_id`. Không có request nào tới `blockfrost.io`. |
| P4 (AC3.3, subdomain) | Tab Demeter, nhập key, Auth mode **Subdomain**. Ô API URL hiện `https://{key}.cardano-preprod.blockfrost-m1.dmtr.host`; nút copy chép đúng URL. Connect → query UTxO → submit. | Panel hiện `Demeter connected`, dock hiện `Demeter ready`. Request đi tới `https://{key}.cardano-preprod.blockfrost-m1.dmtr.host/addresses/…/utxos` và `/tx/submit`, không có `/api/v0`. Với key thật: query và submit thành công. |
| P5 (AC3.3, header) | Như P4 nhưng Auth mode **Header**. | API URL `https://cardano-preprod.blockfrost-m1.dmtr.host`; request mang header `dmtr-api-key: {key}`. Với key thật: xem preflight `OPTIONS` có qua không (không key thì gateway trả 401 không kèm header CORS). |
| P6 (AC3.4) | Đang `Demeter connected` trên Preprod, đổi network sang Preview ở header. | Panel về `Provider not configured`. Mở Configure › Demeter: URL thành `…cardano-preview…`, ô key trống. Đổi về Preprod thì connected lại nếu đã Remember. |
| P7 (AC2.1) | Bật **Remember on this device** → Connect. Mở tab mới cùng URL. | Tab mới hiện connected ngay. localStorage có key `providerConfig:{provider}:{network}` chứa `apiKey`, `apiEndpoint` (và `demeterAuthMode` với Demeter). |
| P8 (AC2.2) | Tắt Remember → Connect. Mở tab mới. | Tab mới hiện `Provider not configured`; localStorage không có `providerConfig:*` của provider + network đó. |
| P9 (AC2.3) | Sau P7, mở Configure → **Forget** (icon thùng rác). Mở tab mới. | localStorage không còn key tương ứng; tab mới chưa connected. Tab hiện tại vẫn connected đến khi đóng. |
| P10 (AC2.4) | Remember một key preprod, đổi sang Preview (hoặc mở tab mới ở Preview). | Không tự connected bằng key preprod. |
| P11 | Tab Blockfrost: key không bắt đầu bằng tên network, hoặc URL không chứa tên network. Tab Demeter, mode Subdomain: key có dấu `.` hoặc khoảng trắng. | Hiện lỗi dưới ô, Connect báo toast lỗi và không đóng dialog. |
