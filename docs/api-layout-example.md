# API Documentation Layout Example

## LAYOUT MẪU

---

### Header Section
```
@hydra-sdk/core
Functions
```

---

### Function Card Example 1: Simple Function

```
┌─────────────────────────────────────────────────────────┐
│ compare_script_address(x: Address, y: Address)          │ [...]
│                                              -> Ordering │
├─────────────────────────────────────────────────────────┤
│ So sánh hai script addresses theo thứ tự từng điểm.    │
│ Trả về Ordering (LessThan | Equal | GreaterThan)       │
│                                                          │
│ **Example:**                                             │
│ ```typescript                                            │
│ import { compare_script_address } from '@hydra-sdk/core'│
│                                                          │
│ const addr1 = '...'                                     │
│ const addr2 = '...'                                     │
│ const result = compare_script_address(addr1, addr2)    │
│ console.log(result) // "LessThan" | "Equal" | ...      │
│ ```                                                      │
│                                                          │
│ **Returns:** `Ordering`                                  │
│ - `LessThan`: x < y                                     │
│ - `Equal`: x == y                                        │
│ - `GreaterThan`: x > y                                  │
└─────────────────────────────────────────────────────────┘
```

---

### Function Card Example 2: With Parameters

```
┌─────────────────────────────────────────────────────────┐
│ signTx(txCbor: string, partialSign?: boolean)           │ [...]
│                                      -> Promise<string> │
├─────────────────────────────────────────────────────────┤
│ Ký một giao dịch Cardano. Hỗ trợ ký hoàn toàn hoặc    │
│ ký một phần (multi-sig).                                │
│                                                          │
│ **Parameters:**                                          │
│ - `txCbor` (string): Giao dịch dưới dạng CBOR hex      │
│ - `partialSign?` (boolean): Nếu true, ký một phần      │
│                                                          │
│ **Example:**                                             │
│ ```typescript                                            │
│ // Ký hoàn toàn                                          │
│ const signedTx = await wallet.signTx(unsignedTxCbor)   │
│                                                          │
│ // Ký một phần (multi-sig)                              │
│ const partialSigned = await wallet.signTx(              │
│   unsignedTxCbor,                                       │
│   true // partialSign = true                            │
│ )                                                        │
│ ```                                                      │
│                                                          │
│ **Returns:** `Promise<string>`                           │
│ Giao dịch đã ký dưới dạng CBOR hex                     │
└─────────────────────────────────────────────────────────┘
```

---

### Function Card Example 3: Utility Function

```
┌─────────────────────────────────────────────────────────┐
│ getPubkeyHashFromAddress(address: string)               │ [...]
│                                          -> string      │
├─────────────────────────────────────────────────────────┤
│ Trích xuất public key hash từ một địa chỉ Cardano.     │
│                                                          │
│ **Parameters:**                                          │
│ - `address` (string): Địa chỉ Cardano (bech32)         │
│                                                          │
│ **Example:**                                             │
│ ```typescript                                            │
│ import { getPubkeyHashFromAddress } from '@hydra-sdk/core'│
│                                                          │
│ const address = 'addr_test1qz2fxv2umyhttkxyxp8x0dlw...' │
│ const pubkeyHash = getPubkeyHashFromAddress(address)    │
│ console.log(pubkeyHash)                                 │
│ // => '00000000000000000000000000000000000000000000000000000000'│
│ ```                                                      │
│                                                          │
│ **Returns:** `string`                                    │
│ Public key hash dưới dạng hex                          │
└─────────────────────────────────────────────────────────┘
```

---

## MARKDOWN REPRESENTATION

```markdown
# @hydra-sdk/core
## Functions

### compare_script_address(x: Address, y: Address) → Ordering
[...]

So sánh hai script addresses theo thứ tự từng điểm. Trả về Ordering (LessThan | Equal | GreaterThan).

**Example:**
\`\`\`typescript
import { compare_script_address } from '@hydra-sdk/core'

const addr1 = '...'
const addr2 = '...'
const result = compare_script_address(addr1, addr2)
console.log(result) // "LessThan" | "Equal" | ...
\`\`\`

**Parameters:**
- `x` (Address): Địa chỉ thứ nhất
- `y` (Address): Địa chỉ thứ hai

**Returns:** `Ordering`
- `LessThan`: x < y
- `Equal`: x == y
- `GreaterThan`: x > y

---

### signTx(txCbor: string, partialSign?: boolean) → Promise\<string\>
[...]

Ký một giao dịch Cardano. Hỗ trợ ký hoàn toàn hoặc ký một phần (multi-sig).

**Example:**
\`\`\`typescript
// Ký hoàn toàn
const signedTx = await wallet.signTx(unsignedTxCbor)

// Ký một phần (multi-sig)
const partialSigned = await wallet.signTx(
  unsignedTxCbor,
  true // partialSign = true
)
\`\`\`

**Parameters:**
- `txCbor` (string): Giao dịch dưới dạng CBOR hex
- `partialSign?` (boolean): Nếu true, ký một phần

**Returns:** `Promise<string>`
Giao dịch đã ký dưới dạng CBOR hex

---
```

## SASS/CSS for Cards (Optional Visual Representation)

```css
.function-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  background: white;
  transition: all 0.2s ease;
}

.function-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.function-signature {
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.expand-icon {
  cursor: pointer;
  padding: 0.5rem;
  color: #6b7280;
}

.function-description {
  margin-top: 0.75rem;
  color: #4b5563;
  line-height: 1.6;
}

.function-example {
  margin-top: 1rem;
  background: #f9fafb;
  border-left: 3px solid #3b82f6;
  padding: 0.75rem;
  border-radius: 4px;
}

.return-type {
  margin-top: 1rem;
  color: #6b7280;
  font-size: 0.9rem;
}
```

---

## QUESTIONS FOR CONFIRMATION

1. **Header Format** ✓
   - Line 1: Package name (@hydra-sdk/core)
   - Line 2: Section (Functions, Classes, Types, etc.)

2. **Function Card Structure** ✓
   - Title: Function signature + return type
   - [...]  icon for expand/collapse
   - Description: Mô tả bằng tiếng Việt
   - Parameters: Chi tiết tham số
   - Example: Code ví dụ (TypeScript)
   - Returns: Kiểu trả về và giải thích

3. **Code Examples** ✓
   - Tiếng Anh cho code
   - Tiếng Việt cho comment/description

4. **Organization** ✓
   - Nhóm theo loại: Functions, Classes, Interfaces
   - Sắp xếp theo alphabet hoặc khác?

---

**Bạn có muốn tôi:**
- A) Sửa theo layout này cho tất cả content/2.api/**
- B) Điều chỉnh layout trước (style, thứ tự,...)
- C) Điều gì khác?
