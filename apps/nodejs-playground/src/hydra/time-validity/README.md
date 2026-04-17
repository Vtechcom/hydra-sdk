# Time Validity trong Aiken và Hydra

Ví dụ này minh họa cách sử dụng time validity (giới hạn thời gian) trong Plutus V3 với Aiken, cùng với cách tích hợp vào Hydra Layer 2.

## Các file liên quan

```
apps/nodejs-playground/
├── validators/
│   └── time_valid.ak               # Aiken validator
├── plutus.json                     # Compiled blueprint (output của `aiken build`)
└── src/hydra/time-validity/
    ├── lock.ts                     # Lock funds vào script
    ├── unlock.ts                   # Unlock funds sau deadline
    └── README.md                   # File này
```

---

## Cơ chế hoạt động

Validator `time_validator` khóa ADA vào script và chỉ cho phép unlock sau khi một mốc thời gian (`deadline_timestamp`) đã qua.

```
Lock (bất kỳ lúc nào)
  → Gửi ADA vào script address
  → Datum chứa deadline_timestamp (Unix ms)

Unlock (chỉ sau deadline)
  → Tx phải có validity_range bắt đầu SAU deadline
  → Validator kiểm tra: lower_bound(validity_range) > deadline_timestamp
```

---

## Aiken Validator

```aiken
// validators/time_valid.ak
use aiken/interval.{is_entirely_after}
use cardano/transaction.{OutputReference, Transaction}

pub type TimeDatum {
  deadline_timestamp: Int,
}

validator time_validator {
  spend(
    datum: Option<TimeDatum>,
    _redeemer: Data,
    _own_ref: OutputReference,
    tx: Transaction,
  ) {
    expect Some(d) = datum
    let Transaction { validity_range, .. } = tx
    let after_deadline = is_entirely_after(validity_range, d.deadline_timestamp)
    expect after_deadline?
    True
  }

  else(_) {
    fail
  }
}
```

**Giải thích:**

- `TimeDatum` chứa `deadline_timestamp` kiểu `Int` — đây là POSIX time tính bằng **milliseconds**.
- `is_entirely_after(validity_range, d.deadline_timestamp)` kiểm tra toàn bộ khoảng thời gian hợp lệ của transaction phải nằm **sau** deadline. Nghĩa là `lowerBound(validity_range) > deadline_timestamp`.
- Nếu điều kiện không thỏa, transaction sẽ bị từ chối on-chain.
- Redeemer không được dùng (bất kỳ giá trị nào đều hợp lệ).

---

## Build Validator

```bash
cd apps/nodejs-playground
aiken build
```

Output là `plutus.json` chứa compiled code và hash của validator. File này được import trong code TypeScript qua `src/utils/getValidators.ts`.

---

## Lock Transaction

**File:** `src/hydra/time-validity/lock.ts`

### Luồng thực thi

1. Khởi tạo `AppWallet` với mnemonic từ env.
2. Kết nối Hydra node qua `HydraBridge`.
3. Query UTxO của ví.
4. Tính `deadline_timestamp = Date.now() + 3 phút` (Unix ms dạng string).
5. Build datum dạng `Constr(0, [Int(deadline_timestamp)])`.
6. Gửi 5 ADA vào `validatorAddress` với inline datum.
7. Ký và submit qua Hydra.

### Datum

```typescript
const deadline_timestamp = String(Date.now() + 3 * 60 * 1000) // now + 3 phút

const datum = DatumUtils.mkConstr(0, [DatumUtils.mkInt(deadline_timestamp)])
```

Datum được encode theo chuẩn Plutus Data:
- Constructor index `0` tương ứng với `TimeDatum { deadline_timestamp: ... }`.
- Giá trị bên trong là `Int` — dạng POSIX ms.

> **Lưu ý:** Aiken dùng POSIX milliseconds cho `deadline_timestamp`. Nếu truyền sai đơn vị (giây thay vì ms), validator sẽ luôn hoặc không bao giờ pass.

### Chạy lock

```bash
npx tsx src/hydra/time-validity/lock.ts
```

Lấy `txHash#outputIndex` từ output để dùng cho unlock.

---

## Unlock Transaction

**File:** `src/hydra/time-validity/unlock.ts`

### Luồng thực thi

1. Kết nối Hydra node, lấy `slotZeroTimestamp` từ bridge.
2. Build `slotConfig` riêng cho Hydra Head (quan trọng — xem bên dưới).
3. Tính `currentSlot` từ `Date.now()` theo `slotConfig` đó.
4. Set `invalidBefore = currentSlot` và `invalidAfter = currentSlot + 1 phút`.
5. Spend script UTxO với inline datum + empty redeemer.
6. Ký và submit.

### Chạy unlock

```bash
# Phải chờ ít nhất 3 phút sau khi lock
npx tsx src/hydra/time-validity/unlock.ts <txHash#outputIndex>

# Ví dụ:
npx tsx src/hydra/time-validity/unlock.ts c0fd0d0f09ab82f1617a859274e05d83bfe88cbc41da1e436ac780f394fc98d8#0
```

---

## Time Validity trong Hydra — Điểm khác biệt quan trọng

### Vấn đề slot config

Trên **Cardano mainnet/testnet**, slot config được xác định bởi genesis parameters của chain — thường dùng constant `SLOT_CONFIG_NETWORK`:

```typescript
// Cardano L1 — KHÔNG dùng cho Hydra
const slotConfig = SLOT_CONFIG_NETWORK['Preprod']
```

Trên **Hydra**, mỗi Head có thời điểm khởi tạo riêng (`slotZeroTimestamp`), vì slot trong Hydra Head bắt đầu từ 0 tại thời điểm Head mở. Nếu dùng sai slot config, việc chuyển đổi giữa Unix timestamp và slot number sẽ bị lệch hoàn toàn, khiến `invalidBefore`/`invalidAfter` không hợp lệ.

```typescript
// Hydra — phải dùng slotZeroTimestamp của Head
const slotZeroTimestamp = bridge.slotZeroTimestamp || 0
const slotConfig = TimeUtils.buildHydraSlotConfig(slotZeroTimestamp)
```

`buildHydraSlotConfig` tạo một slot config với:
- `zeroTime = slotZeroTimestamp` (thời điểm Head mở)
- `slotLength = 1000` ms (1 slot = 1 giây, giống Cardano L1)
- `zeroSlot = 0`

### Tại sao phải set `invalidBefore` và `invalidAfter`?

Cardano (và Hydra) yêu cầu transaction phải khai báo khoảng thời gian hợp lệ để validator có thể kiểm tra `validity_range`. Nếu không set:
- `tx.validity_range` sẽ là `(-∞, +∞)`.
- `is_entirely_after((-∞, +∞), deadline)` luôn trả về `False` vì khoảng vô hạn không nằm hoàn toàn sau deadline.
- Transaction bị từ chối mặc dù thời gian thực đã qua deadline.

```typescript
.invalidBefore(TimeUtils.unixTimeToEnclosingSlot(Date.now(), slotConfig))
.invalidAfter(TimeUtils.unixTimeToEnclosingSlot(Date.now() + 60_000, slotConfig))
```

Khoảng `[currentSlot, currentSlot + 60s]` đảm bảo:
1. Transaction chỉ valid sau thời điểm hiện tại (lower bound > deadline nếu đã qua).
2. Transaction có thời hạn submit ngắn (tránh replay attack, giữ tx "tươi").

### Sơ đồ thời gian

```
slotZeroTimestamp (Head opens)
       │
       ▼ slot = 0
───────┼──────────────────────────────────────────────────────▶ time
       │              │              │              │
   lock tx       deadline       unlock window    invalidAfter
  (t=0 + X)   (t=0 + X + 3m)   [deadline, +1m]
```

---

## Collateral trong Hydra

Khi spending Plutus script trên Cardano L1, collateral là bắt buộc để đảm bảo phí nếu script fail. Trên Hydra, script execution vẫn cần collateral vì Hydra node validate transaction giống như L1.

```typescript
const collateral = addressUTxO.find(
  u =>
    u.output.amount.length === 1 &&
    u.output.amount[0].unit === 'lovelace' &&
    Number(u.output.amount[0].quantity) === 5_000_000
)
```

Collateral UTxO được **loại trừ khỏi inputs** để tránh double-spend:

```typescript
.setInputs(
  addressUTxO.filter(u => u.input.txHash !== collateral.input.txHash)
)
```

---

## Environment Variables

```env
HYDRA_WALLET_MNEMONIC="word1 word2 ... word24"
HYDRA_NODE_URL="ws://localhost:4001"
```

---

## Tóm tắt các điểm cần nhớ

| Điểm | Cardano L1 | Hydra |
|------|-----------|-------|
| Slot config | `SLOT_CONFIG_NETWORK['Preprod']` | `TimeUtils.buildHydraSlotConfig(bridge.slotZeroTimestamp)` |
| Slot zero | Genesis block | Thời điểm Head mở |
| `invalidBefore`/`invalidAfter` | Bắt buộc cho time validator | Bắt buộc (giống L1) |
| Collateral | Bắt buộc | Bắt buộc |
| Fee params | Theo network | Thường `minFeeA: 0, minFeeB: 0` trong Head |
| Submit | Blockfrost / Ogmios | `HydraBridge.submitTxSync()` |
