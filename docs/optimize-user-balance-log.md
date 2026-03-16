# Tối ưu lưu trữ User Balance từ Snapshot UTxO

**Ngày:** 2026-03-12  
**Files thay đổi:**
- `src/hydra-client/hydra-client.service.ts`
- `src/deposit/deposit.service.ts`
- `src/deposit/deposit.module.ts`

---

## Vấn đề ban đầu

Mỗi lần gọi `GET /deposits/balance`, `DepositService.getBalance()` đọc từ bảng `player_balances` trong DB.  
Bảng này chỉ được cập nhật khi có webhook CREDITED từ Hydra Fast Deposit System — **không phản ánh trạng thái real-time của Hydra Head**.

Ngoài ra, `queryAddressUTxO()` (dùng ở nhiều chỗ) mỗi lần chạy đều:
1. Gọi `Converter.convertUTxOObjectToUTxO(cachedSnapshotUTxO)` → alloc array **5000 phần tử**
2. `.filter()` scan toàn bộ 5000 UTxOs → **O(n) mỗi request**

Khi nhiều users đọc balance đồng thời → GC pressure liên tục + latency tăng tuyến tính theo số UTxOs.

---

## Giải pháp: Pre-computed In-memory Balance Cache

### Nguyên tắc

> **O(n) một lần khi snapshot đến — O(1) mỗi lần đọc.**

Thay vì scan UTxOs mỗi lần đọc, scan **một lần duy nhất** khi snapshot mới đến (Greetings / SnapshotConfirmed / HTTP fallback), build sẵn `Map<address, Map<assetUnit, bigint>>`.
Sau đó `getBalance(address)` chỉ là một map lookup.

---

## Thay đổi chi tiết

### 1. `HydraClientService` — thêm `balanceCache`

**Field mới:**
```typescript
/** Pre-computed address → assetUnit → balance. Rebuilt O(n) once per snapshot arrival. */
private readonly balanceCache = new Map<string, Map<string, bigint>>();
```

**Method `updateBalanceCache(snapshot)`** — gọi O(n) mỗi lần snapshot đến:
```typescript
private updateBalanceCache(snapshot: UTxOObject): void {
    this.balanceCache.clear();                                  // tái dùng Map object, không alloc mới
    const utxos = Converter.convertUTxOObjectToUTxO(snapshot);
    for (const utxo of utxos) {
        const addr = utxo.output.address;
        let addrMap = this.balanceCache.get(addr);
        if (!addrMap) {
            addrMap = new Map<string, bigint>();
            this.balanceCache.set(addr, addrMap);
        }
        for (const asset of utxo.output.amount) {
            const prev = addrMap.get(asset.unit) ?? 0n;
            addrMap.set(asset.unit, prev + BigInt(asset.quantity));
        }
    }
}
```

**Method `getAddressBalance(address)` — O(1):**
```typescript
getAddressBalance(address: string): Map<string, bigint> | null {
    if (this.balanceCache.size === 0) return null; // cold start: cache chưa seeded
    return this.balanceCache.get(address) ?? new Map();
}
```

- Trả về `null` khi cache chưa được seeded (cold start sau restart) → caller biết phải fallback DB.
- Trả về `Map rỗng` khi address không có UTxO nào trong snapshot.

**`updateBalanceCache()` được gọi tại 3 điểm:**

| Điểm gọi | Thời điểm |
|---|---|
| `handleEvent(Greetings)` | Ngay sau WS kết nối, nhận snapshotUtxo miễn phí |
| `handleEvent(SnapshotConfirmed)` | Mỗi snapshot được đồng thuận (real-time) |
| `flushEventBuffer()` HTTP fallback | Khi WS chưa kịp gửi Greetings/SnapshotConfirmed |

---

### 2. `DepositService.getBalance()` — đọc từ cache trước, DB fallback

**Trước:**
```typescript
async getBalance(walletAddress: string): Promise<BalanceResponseDto> {
    const rows = await this.balanceRepo.findAllByWallet(walletAddress); // query DB mọi lần
    return { walletAddress, balances: rows.map(AssetBalanceDto.fromEntity) };
}
```

**Sau:**
```typescript
async getBalance(walletAddress: string): Promise<BalanceResponseDto> {
    const snapshotBalances = this.hydraClient.getAddressBalance(walletAddress);

    if (snapshotBalances !== null) {
        // primary path: đọc từ in-memory cache — O(1), không DB, không I/O
        const health = this.hydraClient.getHealthStatus();
        const seqNo = health.lastSnapshotNumber >= 0 ? health.lastSnapshotNumber.toString() : null;
        const updatedAt = health.lastSnapshot ?? new Date();
        const balances: AssetBalanceDto[] = [];
        for (const [assetUnit, balance] of snapshotBalances) {
            const dto = new AssetBalanceDto();
            dto.assetUnit = assetUnit;
            dto.balance = balance.toString();
            dto.lastSnapshotSeqNo = seqNo;
            dto.updatedAt = updatedAt;
            balances.push(dto);
        }
        return { walletAddress, balances };
    }

    // fallback: snapshot chưa được seeded (cold start)
    const rows = await this.balanceRepo.findAllByWallet(walletAddress);
    return { walletAddress, balances: rows.map(AssetBalanceDto.fromEntity) };
}
```

---

### 3. `DepositModule` — import `HydraClientModule`

```typescript
@Module({
    imports: [
        TypeOrmModule.forFeature([DepositEntity, PlayerBalanceEntity]),
        HydraClientModule, // ← thêm để inject HydraClientService vào DepositService
    ],
    ...
})
```

NestJS dùng lại singleton `HydraClientService` đã tồn tại — không tạo instance thứ hai.

---

## Luồng dữ liệu sau khi tối ưu

```
Hydra Node (WebSocket)
  │
  ├── Greetings { snapshotUtxo }
  │     └── updateBalanceCache(snapshotUtxo)
  │           Map<addr, Map<asset, bigint>> được build sẵn
  │
  └── SnapshotConfirmed { snapshot.utxo }  [liên tục, có thể hàng trăm lần/phút]
        └── updateBalanceCache(snapshot.utxo)
              balanceCache.clear() + rebuild  →  O(n), 1 lần mỗi snapshot

GET /deposits/balance
  │
  └── hydraClient.getAddressBalance(walletAddress)
        ├── cache seeded?  → return Map.get(address)  [O(1), không I/O]
        └── cold start?    → query player_balances DB  [fallback]
```

---

## So sánh hiệu năng

| Thao tác | Trước | Sau |
|---|---|---|
| `getBalance()` API call | DB query + O(1) | O(1) map lookup (no DB, no I/O) |
| Snapshot arrival (mỗi SnapshotConfirmed) | O(1) (chỉ lưu ref) | O(n) một lần rebuild cache |
| 100 users đọc balance đồng thời | 100 × DB query | 100 × O(1) map lookup |
| GC pressure khi đọc balance | Array alloc 5000 mỗi request | Không alloc |
| Balance freshness | Chỉ khi có webhook CREDITED | Real-time theo snapshot (block time ~ms) |
| Cold start (trước khi có snapshot) | DB (luôn dùng DB) | DB fallback (chỉ khi cache chưa seeded) |

---

## Bộ nhớ sử dụng thêm

Ước tính cho snapshot 5000 UTxOs, 2000 địa chỉ unique, trung bình 2 assets/địa chỉ:

```
2000 Map entries (outer) × ~100 bytes  ≈  200KB
4000 Map entries (inner) × ~64 bytes   ≈  256KB
─────────────────────────────────────────────
Tổng                                   ≈  ~500KB
```

Hoàn toàn chấp nhận được. `balanceCache.clear()` tái dùng Map object nên không gây GC mỗi lần rebuild.

---

## Lưu ý quan trọng

- **DB `player_balances` vẫn giữ nguyên** — là audit trail cho deposit webhook, không bị xóa hay thay thế.
- Balance từ snapshot = trạng thái **thực tế trong Hydra Head** tại thời điểm snapshot đó.
- Balance từ DB = tổng tích lũy từ các lần deposit CREDITED — có thể khác nhau nếu có rút tiền (withdraw) hay deduction chưa được ghi vào DB.
- Việc dùng snapshot balance là đúng cho usecase **hiển thị số dư hiện tại trong Head** (real-time); DB balance phù hợp hơn cho **reconciliation** và **audit**.
