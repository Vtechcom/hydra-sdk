# Cập nhật Hydra v1.x — Production Releases (Tháng 10/2025 → Tháng 3/2026)

**Ngày cập nhật:** 27 tháng 5, 2026
**Dòng phiên bản:** Hydra v1.x (stable / production)
**Phiên bản mới nhất:** v1.3.0
**Nguồn:** [GitHub Releases - cardano-scaling/hydra](https://github.com/cardano-scaling/hydra/releases)
**Trạng thái:** Production-ready — Đang được bảo trì song song với v2 alpha

---

## 🎯 Timeline Phát hành

```
v1.0.0        2025-10-08    Production-ready (first stable)
v1.1.0        2025-10-28    Feature release
v1.2.0        2025-11-28    Feature release
v1.3.0        2026-03-05    Major stability release (latest v1)
v1.2.1        2026-04-22    Patch backport (era-aware fix from v2)

v2.0.0 alpha  2026-04-02    New protocol (commit-less)
v2.1.0 alpha  2026-05-13    Latest v2
```

> **Lưu ý:** v1.2.1 là bản patch phát hành sau v2.0.0 alpha, backport fix era-aware EpochInfo từ v2 về v1.

---

## 📋 Chi tiết từng bản Release

---

### **v1.0.0** — 08/10/2025 — Production-ready đầu tiên

**Tương thích:** cardano-node 10.4.1 · cardano-cli 10.8.0.0 · mithril 2524.0

| Tính năng / Fix | PR / Issue | Trạng thái |
|---|---|---|
| Allow partial deposit | Issue [#2180](https://github.com/cardano-scaling/hydra/issues/2180) | 🔍 Issue only |
| Allow recovering deposit in all head states | Issue [#1812](https://github.com/cardano-scaling/hydra/issues/1812) + PR [#2217](https://github.com/cardano-scaling/hydra/pull/2217) | ✅ PR confirmed |
| Hotfix statefile corruption (ignore invalid JSON) | Issue [#2253](https://github.com/cardano-scaling/hydra/issues/2253) | 🔍 Issue only |
| Select next deposit for ReqSn using FIFO | Issue [#2263](https://github.com/cardano-scaling/hydra/issues/2263) | 🔍 Issue only |
| Fixed TUI outdated information | — | ⚠️ Không có PR/Issue |
| API server correct content-type | — | ⚠️ Không có PR/Issue |
| Greetings extra info for websocket | — | ⚠️ Không có PR/Issue |
| Bugfixes for incremental commits/decommits | — | ⚠️ Không có PR/Issue |
| POST /transaction endpoint | — | ⚠️ Không có PR/Issue |
| Improve HTTP API status codes | — | ⚠️ Không có PR/Issue |
| Renamed --script-info → --hydra-script-catalogue | — | ⚠️ Không có PR/Issue |

---

### **v1.1.0** — 28/10/2025 — Feature release

**Tương thích:** Không công bố riêng (dùng chung cardano-node 10.4.1)

| Tính năng / Fix | PR / Issue | Trạng thái |
|---|---|---|
| **BREAKING** Partial assets depositing changes | Issue [#2180](https://github.com/cardano-scaling/hydra/issues/2180) | 🔍 Issue only |
| UTxO fanout size test | PR [#2278](https://github.com/cardano-scaling/hydra/pull/2278) | ✅ PR confirmed |
| Fanout limit e2e test | PR [#2299](https://github.com/cardano-scaling/hydra/pull/2299) | ✅ PR confirmed |
| Deposit improvements | PR [#2282](https://github.com/cardano-scaling/hydra/pull/2282) | ✅ PR confirmed |
| cardano-api 10.17 | PR [#2061](https://github.com/cardano-scaling/hydra/pull/2061) | ✅ PR confirmed |
| Document commit process using user scripts | PR [#2276](https://github.com/cardano-scaling/hydra/pull/2276) | ✅ PR confirmed |
| Add haskell-accumulator dependency | PR [#2277](https://github.com/cardano-scaling/hydra/pull/2277) | ✅ PR confirmed |
| Docs banner link fix | PR [#2301](https://github.com/cardano-scaling/hydra/pull/2301) | ✅ PR confirmed |
| Stable link fix | PR [#2302](https://github.com/cardano-scaling/hydra/pull/2302) | ✅ PR confirmed |

---

### **v1.2.0** — 28/11/2025 — Feature release

**Tương thích:** cardano-node 10.5.3 · cardano-cli 10.11.0.0 · mithril 2524.0

| Tính năng / Fix | PR / Issue | Trạng thái |
|---|---|---|
| SafeClose client command | Issue [#2330](https://github.com/cardano-scaling/hydra/issues/2330) | 🔍 Issue only |
| Blockfrost support for hydra-tui | Issue [#2032](https://github.com/cardano-scaling/hydra/issues/2032) | 🔍 Issue only |
| GET /head-initialization endpoint | — | ⚠️ Không có PR/Issue |

> **Ghi chú:** `GET /head-initialization` bị loại bỏ trong v2.0.0 (PR #2564).

---

### **v1.3.0** — 05/03/2026 — Major stability release 🔥

**Tương thích:** cardano-node 10.6.2 · cardano-cli 10.15.0.0 · mithril 2524.0

Đây là bản release lớn nhất trong dòng v1, tập trung vào stability, sync, và fee optimization.

| Tính năng / Fix | PR / Issue | Trạng thái |
|---|---|---|
| Handle deposits/decommits on chain rollbacks | PR [#2491](https://github.com/cardano-scaling/hydra/pull/2491) | ✅ PR confirmed |
| Improved error reporting for missing script witnesses | PR [#2506](https://github.com/cardano-scaling/hydra/pull/2506) | ✅ PR confirmed |
| **BREAKING** Node rejects inputs when out of sync (NodeUnsynced/NodeSynced) | PR [#2290](https://github.com/cardano-scaling/hydra/pull/2290) + Issue [#2286](https://github.com/cardano-scaling/hydra/issues/2286) | ✅ PR confirmed |
| **BREAKING** defaultContestationPeriod 10min → 12h | Issue [#2389](https://github.com/cardano-scaling/hydra/issues/2389) | 🔍 Issue only |
| **BREAKING** Faster sync after inactivity (resume from last tick) | PR [#2407](https://github.com/cardano-scaling/hydra/pull/2407) + Issue [#2206](https://github.com/cardano-scaling/hydra/issues/2206) | ✅ PR confirmed |
| Bounded transactions per snapshot | PR [#2444](https://github.com/cardano-scaling/hydra/pull/2444) | ✅ PR confirmed |
| POST /snapshot returns validation failure instead of timeout | Issue [#2462](https://github.com/cardano-scaling/hydra/issues/2462) | 🔍 Issue only |
| Fee estimation fix (~4x cheaper for init/open/etc) | PR [#2473](https://github.com/cardano-scaling/hydra/pull/2473) | ✅ PR confirmed |
| Race condition fix for incremental commits/decommits | Issue [#2500](https://github.com/cardano-scaling/hydra/issues/2500) | 🔍 Issue only |
| Infinite AckSn requeue loop fix after decommit | PR [#2510](https://github.com/cardano-scaling/hydra/pull/2510) | ✅ PR confirmed |
| **BREAKING** Chain sync status reporting (drift, chainTime) | Issue [#2393](https://github.com/cardano-scaling/hydra/issues/2393) | 🔍 Issue only |

> **Ghi chú:** 3 trong 4 BREAKING changes ở v1.3.0 có PR xác nhận. Một số feature nhỏ chỉ có issue reference, không có PR riêng.

---

### **v1.2.1** — 22/04/2026 — Patch backport (Pre-release)

**Tương thích:** cardano-node 10.5.3 · cardano-cli 10.11.0.0 · mithril 2524.0

| Tính năng / Fix | PR / Issue | Trạng thái |
|---|---|---|
| Era-aware EpochInfo fix (POSIXTime trong Plutus ScriptContext) | — | ⚠️ **Không có PR/Issue riêng** |

> **Ghi chú quan trọng:** Đây là backport fix từ v2.0.0 (PR #2564) về v1. Phát hành sau v2.0.0 alpha 20 ngày. Release notes không gán PR hay issue nào — có thể được merge trực tiếp hoặc cherry-pick từ nhánh v2.

---

## 🔍 PR Verification Summary

| Feature | Release | PR/Issue | Status |
|---|---|---|---|
| Allow recovering deposit in all head states | v1.0.0 | PR #2217 | ✅ |
| Partial assets depositing changes | v1.1.0 | Issue #2180 | 🔍 |
| cardano-api 10.17 | v1.1.0 | PR #2061 | ✅ |
| Deposit improvements | v1.1.0 | PR #2282 | ✅ |
| SafeClose | v1.2.0 | Issue #2330 | 🔍 |
| Blockfrost TUI | v1.2.0 | Issue #2032 | 🔍 |
| GET /head-initialization | v1.2.0 | — | ⚠️ |
| Handle deposits on rollbacks | v1.3.0 | PR #2491 | ✅ |
| Missing script witness error | v1.3.0 | PR #2506 | ✅ |
| NodeUnsynced/NodeSynced | v1.3.0 | PR #2290 | ✅ |
| ContestationPeriod 10min→12h | v1.3.0 | Issue #2389 | 🔍 |
| Sync after inactivity | v1.3.0 | PR #2407 | ✅ |
| Bounded txs per snapshot | v1.3.0 | PR #2444 | ✅ |
| POST /snapshot validation | v1.3.0 | Issue #2462 | 🔍 |
| Fee estimation ~4x cheaper | v1.3.0 | PR #2473 | ✅ |
| Incremental commit race fix | v1.3.0 | Issue #2500 | 🔍 |
| AckSn requeue loop fix | v1.3.0 | PR #2510 | ✅ |
| Chain sync status reporting | v1.3.0 | Issue #2393 | 🔍 |
| **Era-aware EpochInfo (v1.2.1)** | v1.2.1 | — | ⚠️ **Không có PR** |

### **Tổng kết PR verification:**

- ✅ **PR confirmed:** 10 tính năng
- 🔍 **Issue only (không có PR riêng):** 8 tính năng
- ⚠️ **Không có PR/Issue nào:** 9 tính năng (chủ yếu từ v1.0.0)

> Các tính năng "issue only" thường là bug fixes nhỏ được merge trực tiếp hoặc nằm trong PR lớn hơn. Các tính năng "không có PR/Issue" chủ yếu ở v1.0.0 — bản release đầu tiên, release notes chưa chuẩn hóa việc link PR.

---

## 🔍 Thông số Kỹ thuật qua các phiên bản

| | v1.0.0 | v1.2.0 | v1.3.0 | v1.2.1 |
|---|---|---|---|---|
| **cardano-node** | 10.4.1 | 10.5.3 | 10.6.2 | 10.5.3 |
| **cardano-cli** | 10.8.0.0 | 10.11.0.0 | 10.15.0.0 | 10.11.0.0 |
| **mithril** | 2524.0 | 2524.0 | 2524.0 | 2524.0 |
| **Ngày phát hành** | 08/10/2025 | 28/11/2025 | 05/03/2026 | 22/04/2026 |
| **Trạng thái** | Stable | Stable | Stable | Pre-release |

---

## 📊 Thay đổi API qua các phiên bản

### **v1.0.0 → v1.1.0:**
- ⚠️ **BREAKING** Partial assets depositing thay đổi cách hoạt động

### **v1.1.0 → v1.2.0:**
- ➕ Thêm endpoint `GET /head-initialization`
- ➕ Thêm client command `SafeClose`

### **v1.2.0 → v1.3.0:**
- ⚠️ **BREAKING** `NodeUnsynced` / `NodeSynced` state events
- ⚠️ **BREAKING** `defaultContestationPeriod` 10 phút → 12 giờ
- ⚠️ **BREAKING** `TickObserved` schema: `chainSlot` → `chainPoint`
- ⚠️ **BREAKING** `NodeState` schema cập nhật (chain time, drift, slot)
- ➕ `Greetings` message thêm field `currentSlot` và sync status

---

## 📊 Impact lên Architecture

### **1. POC Timeline**
✅ v1.0.0 là lựa chọn an toàn nhất cho POC
✅ v1.3.0 có thêm stability fixes và fee optimization (~4x rẻ hơn)
⚠️ v1.2.1 là pre-release — không nên dùng cho production

**Khuyến nghị:** Dùng **v1.3.0** cho POC/pilot (nhiều bug fixes nhất, fee thấp nhất)

### **2. Migration path lên v2**
- v1 → v2 là breaking change hoàn toàn (khác protocol, khác token, khác scripts)
- Không có backward compatibility
- Cần plan migration riêng khi v2 stable

### **3. Risk Assessment**
✅ v1.3.0 có 4 BREAKING changes — cần test kỹ khi upgrade từ bản cũ
✅ Fee giảm ~4x là lợi ích lớn cho vận hành
⚠️ ContestationPeriod 12h có thể ảnh hưởng đến thời gian đóng Head

---

## 🎯 Action Items

### **Ngắn hạn (Tháng 5-6/2026):**

1. **Chốt phiên bản cho POC**
   - [ ] So sánh v1.0.0 vs v1.3.0
   - [ ] Test v1.3.0 BREAKING changes
   - [ ] Đánh giá fee reduction impact
   - **Owner:** Technical Architect
   - **Deadline:** 1 tuần

2. **Kiểm tra v1.2.1 backport**
   - [ ] Verify era-aware EpochInfo fix hoạt động trên mainnet
   - [ ] Xác định PR/commit gốc cho fix này
   - **Owner:** DevOps Lead
   - **Deadline:** 1 tuần

### **Trung hạn (Tháng 6-7/2026):**

3. **Deploy v1.3.0 cho POC**
   - [ ] Setup infrastructure
   - [ ] Test with actual load
   - [ ] Monitor NodeUnsynced behavior
   - **Owner:** Full Team
   - **Deadline:** Trước khi POC bắt đầu

4. **Theo dõi v1.x maintenance**
   - [ ] Track patch releases sau v1.3.0
   - [ ] Đánh giá nhu cầu upgrade lên v1.2.1
   - **Owner:** Technical Team
   - **Ongoing**

### **Dài hạn (Q4/2026+):**

5. **Plan migration v1 → v2**
   - [ ] Đánh giá breaking changes
   - [ ] Migration script/strategy
   - [ ] Rollback plan
   - **Owner:** DevOps Lead
   - **Deadline:** Khi v2 stable

---

## 📝 Notes và Observations

### **Positive Signals:**

✅ **5 releases trong 6 tháng** — team phát triển rất active
✅ **Fee giảm ~4x** — tiết kiệm chi phí vận hành đáng kể
✅ **Stability focus rõ rệt** — v1.3.0 tập trung vào sync, rollback, edge cases
✅ **Backport từ v2** — v1.2.1 cho thấy team vẫn maintain v1 song song

### **Concerns:**

⚠️ **Nhiều BREAKING changes trong v1.3.0** — upgrade từ bản cũ cần test kỹ
⚠️ **v1.2.1 không có PR trace** — era-aware fix thiếu audit trail
⚠️ **Nhiều feature v1.0.0 không có PR/Issue** — khó audit độc lập
⚠️ **Không có backward compat với v2** — migration là one-way

---

## 🔗 Resources

### **GitHub:**
- [Releases](https://github.com/cardano-scaling/hydra/releases)
- [v1.3.0 Release](https://github.com/cardano-scaling/hydra/releases/tag/1.3.0)
- [v1.2.1 Release](https://github.com/cardano-scaling/hydra/releases/tag/1.2.1)
- [CHANGELOG](https://github.com/cardano-scaling/hydra/blob/master/CHANGELOG.md)

### **PRs quan trọng cần theo dõi:**
- [#2217](https://github.com/cardano-scaling/hydra/pull/2217) — Recover deposit in all head states
- [#2290](https://github.com/cardano-scaling/hydra/pull/2290) — NodeUnsynced/NodeSynced
- [#2407](https://github.com/cardano-scaling/hydra/pull/2407) — Sync improvement
- [#2473](https://github.com/cardano-scaling/hydra/pull/2473) — Fee estimation fix
- [#2491](https://github.com/cardano-scaling/hydra/pull/2491) — Deposits on rollbacks

### **Hydra Scripts (v1.3.0 - latest v1):**
- `preview`: `8ae405c2123ae27d8030b76976d91ea224e4e448ae0cc9bcec6093174cf88621`
- `preprod`: `476b37a7bf0c502f5eae596db43c418dec9e54a31567a71f34ed206a11e8f3da`
- `mainnet`: `2c6cff509c1849407f40aa00df2bea8a9bc55f294b19fb229edf9e194d5e8b67`

---

## 📅 Version Comparison: v1 vs v2

| Khía cạnh | v1.3.0 (Stable) | v2.1.0 (Alpha) |
|---|---|---|
| **Protocol** | Commit phase + deposit | Directly open (ADR-33) |
| **Head Token** | HydraHeadV1 | HydraHeadV2 |
| **Persistence** | JSON file | SQLite database |
| **Plutus Scripts** | Era-aware (v1.2.1+) | Era-aware |
| **Fee (init/open)** | ~4x rẻ hơn v1.0 (PR #2473) | Chưa benchmark riêng |
| **Production Ready** | ✅ Yes | ❌ No |
| **Breaking changes** | Đã ổn định qua 5 releases | Đang thay đổi từng bản |
| **Khuyến nghị** | Dùng cho POC | Đợi stable |

---

## ⚠️ Ghi chú Quan trọng

### **Tính năng không có PR tương ứng:**
1. **v1.2.1 — Era-aware EpochInfo fix** — Feature quan trọng (ảnh hưởng đến Plutus script evaluation trên mainnet) nhưng **không có PR hay issue nào** trong release notes. Backport từ v2 PR #2564. Cần xác minh commit cụ thể.
2. **v1.2.0 — GET /head-initialization** — Endpoint được thêm không có PR, sau đó bị loại bỏ trong v2.0.0 (PR #2564).
3. **v1.0.0 — Nhiều feature nhỏ** — 7 tính năng không có PR/Issue trace (xem bảng chi tiết ở trên).

### **Tính năng chỉ có Issue, không có PR riêng:**
- v1.0.0: #2180, #2253, #2263 — có thể được merge trong PR lớn hơn
- v1.3.0: #2389, #2462, #2500, #2393 — các issue được close nhưng không rõ PR nào giải quyết

---

**Tài liệu liên quan:**
- v2-update.md
- architecture-decisions-hydra-eutxo.md
- why-hydra-vs-alternatives.md

**Cập nhật lần cuối:** 2026-05-27
**Người cập nhật:** Paige — Technical Writer
**Next review:** 2026-06-27
