# Cập nhật Hydra v2.3.0 - Tháng 7/2026

**Ngày cập nhật:** 20 tháng 7, 2026
**Phiên bản:** Hydra v2.3.0 (latest)
**Nguồn:** [GitHub Releases - cardano-scaling/hydra](https://github.com/cardano-scaling/hydra/releases)
**Trạng thái:** Dòng v2.x đang tiến gần stable; project hydra-perps hiện pin **v2.3.0**

---

## 🎯 Thông tin Quan trọng

### **Hydra v2.3.0 đã được phát hành (15/07/2026)**

**Timeline:**
- v1.0.0: Ra mắt Tháng 10/2025 (production-ready)
- v2.0.0 alpha: 2 tháng 4, 2026
- v2.1.0: 13 tháng 5, 2026 (SQLite event store, deposit hardening)
- v2.2.0: 12 tháng 6, 2026 (Partial Fanout)
- v2.3.0: 15 tháng 7, 2026 (latest — bỏ re-eval Plutus khi snapshot, HD-wallet key)

**Ý nghĩa:**
- v2.3.0 là bản mới nhất của dòng v2, build tiếp trên v2.1.0 (SQLite) và v2.2.0 (Partial Fanout).
- Tập trung vào hiệu năng snapshot (không re-evaluate Plutus scripts đã validate), HD-wallet signing key, và cấu hình node bằng YAML.
- Toàn dòng v2.1.0 → v2.3.0 dùng chung Cardano Node v11.0.1 / CLI v11.0.0 / Mithril v2617.
- **Project hydra-perps** đã pin `hydra-node v2.3.0` (khớp `@hydra-sdk` mà Ania maintain).

---

## 📋 Tính năng Mới — Tổng hợp từ v2.0.0 đến v2.3.0

### **A. Thay đổi cốt lõi từ v2.0.0 (còn hiệu lực):**

1. **Loại bỏ Commit Phase (ADR-33)** — PR [#2536](https://github.com/cardano-scaling/hydra/pull/2536) ✅
   - Head mở trực tiếp ngay khi khởi tạo.
   - Không còn giao dịch `collectCom` và `abort`.
   - **Impact:** Giảm độ phức tạp và chi phí vận hành Head.

2. **Incremental Deposits** — PR [#2536](https://github.com/cardano-scaling/hydra/pull/2536) ✅
   - Tiền được nạp vào Head một cách lũy tiến thông qua giao dịch `deposit`.
   - Giải quyết vấn đề "non-abortable head" khi có người commit UTxO quá lớn.

3. **Nâng cấp Token HydraHeadV2** — PR [#2561](https://github.com/cardano-scaling/hydra/pull/2561) ✅
   - Token định danh Head đổi tên từ `HydraHeadV1` sang `HydraHeadV2`.

4. **Era-aware Plutus Scripts** — PR [#2564](https://github.com/cardano-scaling/hydra/pull/2564) ✅
   - Dùng `EpochInfo` theo thời gian thực từ chuỗi thay vì `fixedEpochInfo`.

5. **Loại bỏ hard-coded 100 ADA commit limit** — PR [#2564](https://github.com/cardano-scaling/hydra/pull/2564) ✅

---

### **B. Tính năng trong v2.1.0 (13/05/2026):**

6. **BREAKING: Slim down persisted StateChanged events** — PR [#2577](https://github.com/cardano-scaling/hydra/pull/2577) ✅
   - `SnapshotRequested`: `snapshot` → `requestedSnapshot`; bỏ field `requestedTxIds`.
   - `PartySignedSnapshot`: `snapshot :: Snapshot tx` → `snapshotNumber :: SnapshotNumber`.
   - `SnapshotConfirmed`: `snapshot :: Snapshot tx` → `Maybe (Snapshot tx)`.
   - `DecommitRecorded`: bỏ field `utxoToDecommit`.

7. **SQLite-backed Event Store** — PR [#2578](https://github.com/cardano-scaling/hydra/pull/2578) ✅
   - Events lưu trong `hydra.db` (SQLite) thay cho file JSON append-only (`state`).
   - Tự động migrate `state` cũ → `hydra.db` + rename thành `state.migrated` khi khởi động lần đầu.

8. **Giảm ~7% snapshot confirmation latency** — PR [#2571](https://github.com/cardano-scaling/hydra/pull/2571) ✅
   - Cache pre-computed signable bytes trong `SeenSnapshot`, tránh serialize/hash UTxO lặp lại trên mỗi `AckSn`.

9. **Blockfrost transient error retries** — PR [#2579](https://github.com/cardano-scaling/hydra/pull/2579) ✅
   - Retry exponential backoff cho lỗi transient (DecodeError, MissingNextBlockHash...) thay vì crash node.

10. **Deposit Plutus Validator Hardening** ✅
    - Hardened validator chống malformed increment transactions.

---

### **C. Tính năng mới trong v2.2.0 (12/06/2026):**

11. **Partial Fanout** ✅
    - Head với UTxO set lớn tùy ý có thể fanout thành **nhiều bước** qua `PartialFanoutTx` + `FinalPartialFanoutTx`.
    - Bỏ giới hạn UTxO ceiling trên mỗi head — xác thực bằng BLS accumulator membership proof.
    - **Impact:** Đóng thẳng vấn đề "head quá lớn không fanout được" (thay cho PR pending #2324 cũ).

12. **BREAKING: Fanout state schema thay đổi** ⚠️
    - `HeadIsFinalized`: field `utxo` → `finalizedUTxO`, đổi từ map sang **array**.
    - `ClosedState`: đổi tên field fanout; cả hai chuyển sang array `TxOut`.
    - Bỏ field `newLocalUTxO` khỏi state change events (giảm dung lượng event store).

13. **hydra-tui làm lại** ✅
    - Pending-deposit recovery, dark/light theme toggle, event-history filter, tab navigation.

14. **Benchmark E2E nâng cấp** ✅
    - Real-world TPS metrics, generator UTxO `Mixed`, tùy chọn incremental commit/decommit cycle.

15. **Validator guards chống mint/burn trái phép** ✅ — kèm fix event replay corruption + recovered deposit reappearing.

---

### **D. Tính năng mới trong v2.3.0 (15/07/2026):**

16. **Bỏ re-evaluate Plutus scripts khi xử lý snapshot** ✅
    - Snapshot processing KHÔNG re-evaluate Plutus scripts của các tx đã validate lúc nhận.
    - **Impact:** Tăng throughput đáng kể cho workload nặng script (perp matching/settlement là đối tượng hưởng lợi chính).

17. **Native HD-wallet signing key** ✅
    - Hỗ trợ `PaymentExtendedKey` signing key (khóa HD ví native).

18. **YAML-based node configuration** ✅
    - Cấu hình hydra-node bằng YAML thay cho chuỗi flag dài.

19. **Fixes đáng chú ý** ✅
    - Event-log rotation giữ lại pending deposits.
    - Deposit observation scoped về đúng head hiện tại.
    - Sửa Blockfrost backend error handling + datum-decoding.
    - Sửa deadlock `PersistentQueue` ở network layer.
    - Sửa non-canonical inline datum JSON serialization.

---

## 🔍 Thông tin Kỹ thuật & Khả năng Tương thích

### **Thông số Phiên bản (v2.1.0 → v2.3.0 — dùng chung):**
- **Cardano Node:** v11.0.1
- **Cardano CLI:** v11.0.0
- **Mithril:** v2617

### **Thay đổi API / Persistence (tích lũy):**
- ❌ Loại bỏ endpoint `GET /head-initialization` (v2.0.0, không còn commit phase).
- ⚠️ **BREAKING** Schema `StateChanged` events slim down (v2.1.0).
- ⚠️ **BREAKING** File persistence: `state` (JSON) → `hydra.db` (SQLite) (v2.1.0).
- ⚠️ **BREAKING** Fanout schema: `finalizedUTxO` array + `ClosedState` field rename (v2.2.0).

### **Hydra Scripts (v2.3.0 — mỗi network có 2 script hash: μHead + ν):**
- `preview`:
  - `4797dc5e1c497d7dce0e591e6322855c836f9eac6a253d1342e58778962931e7`
  - `68c0f7527e9c8ddb5f76cb3b020faa60a623cee6abaf74fb33334c803f906a97`
- `preprod`:
  - `b88df0c62f9734f0a6dba0faa7636ed51699cbe21706ce4a9736684daf418d67`
  - `40ab074125b4734939cd45a00b2cfe1b20d679b2a1c52d6472aca193f637a2bc`
- `mainnet`:
  - `f72df33dbc1001c9e65e454e97558b34afe254a77d6fd29270ad45a2328e06aa`
  - `d7adaca74e78536dfa7beb5c550d97675513e9b004afb1d9aba479b8972cdd8f`

> Script hash đổi so với v2.1.0 → khi deploy/redeploy phải cập nhật hash tham chiếu trên L1.

---

## 🍴 Cardano Hard Fork mới — van Rossem (Protocol Version 11)

**Bản fork mới nhất của Cardano ảnh hưởng trực tiếp tới môi trường chạy Hydra + Aiken/Plutus của project.**

### **Timeline:**
- **26/05/2026:** Submit Plutus Cost Model update action lên mainnet.
- **13/06/2026:** DReps + CC ratify (68.57% DRep approval, 5/7 Constitutional Committee).
- **18/06/2026 21:45 UTC:** Enact bản cập nhật Plutus cost model (gán giá cho các primitive mới TRƯỚC hard fork).
- **18/07/2026 21:44:51 UTC (Slot 192,844,800):** Enact hard fork van Rossem → **Protocol Version 11**.
- **Cột mốc governance:** Đây là hard fork đầu tiên của Cardano được ratify hoàn toàn qua on-chain governance (không theo timeline do foundation ấn định).

### **Thay đổi Protocol Parameter chính:**

1. **Cập nhật Plutus Cost Model (2 giai đoạn):**
   - Giai đoạn 1 (18/06): **tăng cost** của một số primitive hiện có + gán giá cho các primitive mới.
   - Giai đoạn 2 (18/07): kích hoạt primitive mới cùng hard fork.
   - **Tổng thể:** giảm chi phí chạy Plutus smart contract cho phần lớn workload phổ biến.

2. **Primitive & CIP mới bật cùng PV11:**
   - CIP-0109, CIP-0132, CIP-0133, CIP-0138, CIP-0153 (built-in cryptographic + tiện ích mới).
   - **Unified built-in availability** — built-in dùng chung nhất quán qua Plutus V1/V2/V3.
   - **Case expressions** trên `Bool`, `Integer`, và `Data` trong UPLC.

3. **Ledger & bảo mật:**
   - **VRF key uniqueness** — siết luật để đảm bảo tính duy nhất của VRF key.
   - Dọn dẹp ledger rules (cleaner inter-era rules).

### **Impact lên hydra-perps:**

- ✅ **Aiken/Plutus v3 validators** (`commit_batcher.ak`, `perp_state.ak`) chạy trên cost model mới → chi phí execution units **có thể đổi**; cần re-benchmark ExUnits budget của settlement/matching tx sau fork.
- ⚠️ **Cost model thay đổi = fee/ExUnits khác** → verify lại các tx builder (SettlementTxBuilderV3) không vượt budget với cost model PV11.
- ✅ **Built-in mới** (unified V1/V2/V3, case expr, CIP crypto) → cân nhắc dùng nếu tối ưu được validator, nhưng KHÔNG bắt buộc.
- ⚠️ **hydra-node phải chạy trên Cardano Node hỗ trợ PV11.** v2.3.0 pin cardano-node v11.0.1 — cần xác nhận build này đã enact được PV11 trên preprod/preprod-alpha trước khi QA.
- 📌 **Preprod/preprod-alpha** (target QA của project) đi theo lịch hard fork riêng — kiểm tra preprod đã ở PV11 chưa trước khi deploy golden scripts mới.

---

## 📊 Impact lên Architecture Hiện tại

#### **1. Version selection**
- Project đã pin **v2.3.0** (không còn ở tình thế "tránh alpha"). Dòng v2.x đã trưởng thành: SQLite (2.1) + Partial Fanout (2.2) + snapshot no-reeval (2.3).
- Persistent Head model, topology node, data lifecycle: **không đổi**.

#### **2. Performance**
- SQLite event store → startup/recovery nhanh hơn đáng kể.
- Snapshot: cache signable bytes (2.1, ~7%) + **bỏ re-eval Plutus (2.3)** → throughput script-heavy tốt hơn rõ.
- Partial Fanout → không còn nghẽn khi close head có nhiều UTxO.

#### **3. Cost**
- utxoCostPerByte = 0 (devnet/testnet) → giảm chi phí tx L2.
- **PV11 cost model** → chi phí Plutus execution trên L1 thay đổi; re-estimate cho settlement/fanout tx.

#### **4. Risk**
- ⚠️ 3 lớp BREAKING tích lũy (StateChanged slim → SQLite → fanout schema) → integration đọc event/persistence phải cập nhật theo v2.3.0, không nhảy cóc từ v1.x.
- ⚠️ Hard fork PV11: cost model đổi → phải re-verify ExUnits budget validator trước khi lên preprod/mainnet.

---

## 🎯 Action Items

### **Ngắn hạn (Tháng 7-8/2026):**

1. **Xác nhận runtime PV11 trên preprod-alpha**
   - [ ] Kiểm tra cardano-node của v2.3.0 đã enact van Rossem (PV11) trên preprod.
   - [ ] Re-run golden ExUnits benchmark cho `perp_state.ak` + `commit_batcher.ak` với cost model PV11.
   - **Owner:** Technical Architect · **Deadline:** 1 tuần

2. **Verify tx builders không vượt budget**
   - [ ] SettlementTxBuilderV3 (5 redeemer paths) đo lại ExUnits với PV11.
   - [ ] Kiểm tra fanout/decommit tx còn nằm trong maxTxExUnits.
   - **Owner:** Technical Architect · **Deadline:** 2 tuần

3. **Cập nhật script hashes v2.3.0**
   - [ ] Đồng bộ hash preview/preprod/mainnet vào config deploy.
   - **Owner:** DevOps Lead · **Deadline:** 1 tuần

### **Trung hạn (Tháng 9-12/2026):**

4. **Đánh giá dùng built-in PV11 mới** (unified V1/V2/V3, case expr, CIP-0109/0132/0133/0138/0153) nếu tối ưu được validator.
5. **Theo dõi dòng v2.x tiến stable** + Leios upgrade tiếp theo.

---

## 📊 Version Comparison Matrix (Updated)

| Feature | v1.0.0 (Stable) | v2.3.0 (Latest) | Impact |
|---------|-----------------|-----------------|--------|
| **Persistent Head** | ✅ Supported | ✅ Improved | Tốt hơn |
| **Commit Phase** | ✅ Required | ❌ Removed (ADR-33) | Đơn giản hơn |
| **Deposit Model** | Commit-then-deposit | Incremental deposit | Linh hoạt hơn |
| **Persistence** | JSON file | SQLite database | Nhanh hơn |
| **Fanout** | Single-tx (UTxO ceiling) | Partial Fanout (multi-step) | Không nghẽn |
| **Snapshot Plutus re-eval** | Có | ❌ Bỏ (2.3.0) | Throughput cao hơn |
| **HD-wallet key** | ❌ | ✅ PaymentExtendedKey | Mới |
| **Head Token** | HydraHeadV1 | HydraHeadV2 | Cần migrate |
| **Plutus Scripts** | fixedEpochInfo | Era-aware EpochInfo | Chính xác hơn |
| **Cardano Node** | v10.4.1 | v11.0.1 (PV11-ready) | Mới hơn |
| **Production Ready** | ✅ Yes | ⏳ v2.x tiến stable | Đang dùng cho QA |

---

## 🔗 Resources để Theo dõi

- **Hydra Docs:** https://hydra.family/head-protocol/
- **GitHub Releases:** https://github.com/cardano-scaling/hydra/releases
- **Closed PRs:** https://github.com/cardano-scaling/hydra/pulls?q=is%3Apr+is%3Aclosed
- **van Rossem hard fork (Intersect):** https://intersectmbo.org/news/cardano-upgrade-van-rossem-hard-fork
- **Cardano Hard Forks history:** https://cardano.org/hardforks/
- **IOG Blog:** https://iohk.io/en/blog/ (tag "Hydra")

---

**Tài liệu liên quan:**
- architecture-decisions-hydra-eutxo.md
- why-hydra-vs-alternatives.md

**Cập nhật lần cuối:** 2026-07-20
**Người cập nhật:** Mia — AI Assistant
**Next review:** 2026-08-20 (theo dõi v2.x stable + trạng thái PV11 trên preprod)
