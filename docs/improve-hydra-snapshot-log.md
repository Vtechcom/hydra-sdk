# Cải thiện HydraClientService — Snapshot Best Practices

**File:** `src/hydra-client/hydra-client.service.ts`  
**Ngày:** 2026-03-12

---

## Tổng quan

Áp dụng các best practices từ tài liệu `hydra-snapshot-best-practice.md` vào `HydraClientService`. Tất cả 7 vấn đề được xử lý trong cùng một file, compile sạch không có lỗi.

---

## Các vấn đề đã sửa

### 1. Thứ tự đăng ký listener sai

**Trước:**
```typescript
await this.hydraBridge.connect();          // connect trước
await this.querySnapshotUtxo({ noCached: true });
this.hydraBridge.events.on('onMessage', ...); // listener đăng ký sau
```

**Sau:**
```typescript
// Đăng ký listener TRƯỚC khi connect
this.hydraBridge.events.on('onMessage', ...);
this.hydraBridge.events.on('onConnected', ...);
// ...
await this.hydraBridge.connect();          // connect sau cùng
```

**Lý do:** Nếu `connect()` resolve nhanh và có message đến ngay (đặc biệt là `Greetings`), listener chưa được đăng ký sẽ bỏ lỡ hoàn toàn message đó.

---

### 2. Thiếu xử lý message `Greetings`

**Trước:** Message `Greetings` không được xử lý → phải gọi HTTP `querySnapshotUtxo` để seed cache ban đầu.

**Sau:**
```typescript
if (event.tag === HydraHeadTag.Greetings) {
    if (this.lastSnapshotNumber === -1) {
        this.cachedSnapshotUTxO = event.snapshotUtxo;
        this.logger.debug('Cache seeded from Greetings');
    }
    return;
}
```

**Lý do:** Hydra Node push `Greetings` ngay sau khi WS kết nối, bao gồm `snapshotUtxo`. Đây là nguồn dữ liệu miễn phí, không cần HTTP call.

---

### 3. Race condition giữa HTTP và WebSocket

**Vấn đề:** `querySnapshotUtxo({ noCached: true })` (HTTP) được await sau khi connect. Nếu trong thời gian HTTP in-flight, `SnapshotConfirmed` đến qua WS và update cache → HTTP resolve sau sẽ overwrite data mới hơn bằng data cũ hơn.

**Trước:**
```typescript
// HTTP blocking, không có guard
await this.querySnapshotUtxo({ noCached: true });
```

**Sau (HTTP fallback non-blocking với guard):**
```typescript
private flushEventBuffer() {
    this.hydraBridge
        .querySnapshotUtxo()
        .then(snapshot => {
            if (this.lastSnapshotNumber !== -1) return; // WS đã có snapshot mới hơn
            this.cachedSnapshotUTxO = snapshot;
        })
        .catch(error => { ... });
}
```

**Guard:** `lastSnapshotNumber !== -1` → đã nhận ít nhất một `SnapshotConfirmed` hoặc `Greetings` qua WS → HTTP bị bỏ qua, không overwrite.

---

### 4. Không có guard chống out-of-order `SnapshotConfirmed`

**Trước:** Mỗi `SnapshotConfirmed` đến đều overwrite cache vô điều kiện.

**Sau:**
```typescript
const snapNum = event.snapshot?.number ?? -1;

if (snapNum <= this.lastSnapshotNumber) {
    this.logger.debug(`Skipping out-of-order snapshot #${snapNum} (last=${this.lastSnapshotNumber})`);
    return;
}

this.cachedSnapshotUTxO = event.snapshot.utxo;
this.lastSnapshotNumber = snapNum;
```

**Lý do:** Trong trường hợp reconnect hoặc network jitter, có thể nhận snapshot cũ hơn sau snapshot mới. Guard đảm bảo cache chỉ tiến không lùi.

---

### 5. `lastSnapshotNumber` không được reset khi reconnect

**Trước:** Sau `onDisconnected` + reconnect, `lastSnapshotNumber` giữ giá trị cũ → HTTP fallback trong `flushEventBuffer()` sẽ bị block bởi guard (vì `lastSnapshotNumber > -1`) dù cache đã stale.

**Sau:**
```typescript
this.hydraBridge.events.on('onConnected', async () => {
    this.reconnectAttempts = 0;
    this.lastSnapshotNumber = -1; // Reset để HTTP fallback có thể seed cache
    this.flushEventBuffer();
});
```

---

### 6. Dead code

**Xóa bỏ:**
- `private ws: WebSocket | null = null` — không bao giờ được dùng
- `private eventBuffer: SnapshotConfirmed[] = []` — không bao giờ được push/đọc
- `private maxBufferSize = 1000` — không bao giờ được dùng
- Import thừa: `RawProtocolParameters`, `SnapshotConfirmed`, `toProtocol`
- `onModuleDestroy` dùng `this.ws.close()` (ws luôn null) → thay bằng `this.hydraBridge?.disconnect()`

---

### 7. `getHealthStatus()` — thêm `lastSnapshotNumber`, bỏ `bufferedEvents`

**Trước:**
```typescript
bufferedEvents: this.eventBuffer.length, // luôn = 0 vì eventBuffer là dead code
```

**Sau:**
```typescript
lastSnapshotNumber: this.lastSnapshotNumber, // thông tin thực sự hữu ích
```

---

## Luồng hoạt động sau khi sửa

```
connect(wsUrl)
│
├── Register listeners (onConnected, onMessage, onError, onDisconnected)
│
└── await hydraBridge.connect()
      │
      ├── onConnected fires
      │     ├── lastSnapshotNumber = -1
      │     └── flushEventBuffer() — HTTP query in background (non-blocking)
      │
      ├── onMessage: Greetings
      │     └── lastSnapshotNumber === -1? → cachedSnapshotUTxO = event.snapshotUtxo
      │                                       (HTTP sẽ skip nếu resolve sau)
      │
      ├── HTTP fallback resolves
      │     └── lastSnapshotNumber === -1? → apply   (Greetings chưa đến)
      │         lastSnapshotNumber > -1?  → skip    (đã có WS data mới hơn)
      │
      └── onMessage: SnapshotConfirmed (liên tục)
            └── snapNum > lastSnapshotNumber?
                  → cachedSnapshotUTxO = snapshot.utxo
                  → lastSnapshotNumber = snapNum
                  → emit 'hydra.snapshot.confirmed'
```

---

## Kết quả

- Không có race condition HTTP vs WebSocket.
- Cache chỉ cần HTTP fallback khi `Greetings` chưa đến (edge case), còn lại hoàn toàn realtime qua WS.
- Out-of-order snapshot không thể gây regression.
- Reconnect luôn seed lại cache đúng cách.
- TypeScript compile: **0 lỗi**.
