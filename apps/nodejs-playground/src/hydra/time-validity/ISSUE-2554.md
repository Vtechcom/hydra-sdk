# Vấn đề về chuyển đổi Slot <-> Time (POSIX Time) trong Hydra

Khi sử dụng time validity (giới hạn thời gian) trong Plutus V3 trên mạng Hydra (phiên bản `1.2.0` và `1.3.0`), có một lỗi nghiêm trọng liên quan đến quá trình chuyển đổi giữa `Slot` và `POSIX Time`.

Vấn đề này đã được báo cáo và xác nhận trong Hydra repository:
🔗 **[Issue #2554: Slot <-> Time conversion issue on preprod network](https://github.com/cardano-scaling/hydra/issues/2554)**

---

## 1. Nội dung Issue (Trích xuất từ GitHub)

### 📌 Tiêu đề: Slot <-> Time conversion issue on preprod network
**Tác giả:** golddydev
**Trạng thái:** CLOSED

### 📝 Bối cảnh (Context)
Việc thực thi smart contract có kiểm tra `validity_range` của transaction luôn bị thất bại trên mạng `preprod`.

Nguyên nhân là do cấu hình `fixedEpochInfo` của Hydra mặc định giả định rằng `slotLength` luôn là 1 giây trong toàn bộ lịch sử hệ thống. Điều này đúng với mạng `preview`, nhưng **sai đối với `mainnet` và `preprod`** (do kỷ nguyên `Byron` có slot dài 20 giây).

### 🛠️ Cách tái hiện (Steps to reproduce)
* Chuẩn bị một smart contract kiểm tra khoảng thời gian hợp lệ (`validity_range`) của transaction.
* Thiết lập `validity_start` và `ttl` trong transaction rồi submit lên Hydra node.

### ❌ Hành vi thực tế (Actual behavior)
Khi smart contract được evaluate bởi Hydra node, `PosixTimeRange` (được chuyển đổi từ `ValidityInterval` của transaction) **không khớp** với giá trị POSIX Time mà offchain đã tạo.

### ✅ Hành vi kỳ vọng (Expected behavior)
`PosixTimeRange` khi vào bên trong Plutus Context phải khớp chính xác với giá trị offchain đã dùng để build `ValidityInterval`.

---

## 2. Diễn biến và bình luận (Comments)

* **ch1bo** (Member):
  > "We also encountered this in the demo of MS5 in this catalyst project: https://cardano-scaling.github.io/eutxo-l2-interop/ms5/index.html. CC @Micrograx @ignaciodopazo"

* **v0d1ch** (Contributor):
  > "This was fixed in https://github.com/cardano-scaling/hydra/pull/2564"

* **golddydev**:
  > "Is this fix reflected on the latest release?"

* **v0d1ch**:
  > "Yes it is in there."

* **golddydev**:
  > "Can you let me know which version it is? I have used 1.3.0, and it still has issue."

* **v0d1ch**:
  > "2.0.0"

* **ch1bo**:
  > "Given that `2.0.0` is still considered alpha, can we backport this fix onto `1.3.x` and `1.2.x`? The above mentioned catalyst project is blocked from close-out by this and uses `1.2.0` with a currently open head that we'd like to re-use. So a `1.2.1` is likely what is needed for that. CC @Micrograx"

* **aniadev**:
  > "I am using 1.3.0, can you apply that fix for a new release of 1.3.1?"

---

## 3. Khuyến cáo thực tế (Tháng 5/2026)

Dựa trên thông tin từ Issue trên, **KHUYẾN CÁO QUAN TRỌNG** khi viết code DApp tương tác với thời gian (Time-validity) trên Hydra Head:

1. **KHÔNG SỬ DỤNG** code chứa các Plutus script phụ thuộc vào Time Validity (POSIXTime trong transaction `validRange`) nếu Hydra node của mạng đang chạy ở **phiên bản `1.2.0` hoặc `1.3.0`**.
2. Trên các phiên bản lỗi này, Hydra node bị sai lệch thông số Slot <-> POSIX time trên các mạng (như Preprod/Mainnet). Lỗi này sẽ dẫn đến Plutus validation fail (CekError) vì `Valid range` khi vào script bị đẩy lùi về quá khứ so với thời gian hiện tại.
3. **Cách giải quyết:**
   - **Nâng cấp (Đề xuất):** Nâng cấp Hydra node và client lên bản **`2.0.0`** (hoặc bản patch `1.3.1` / `1.2.1` nếu có) để có bản vá (PR #2564).
   - **Workaround cho bản lỗi (Hack):** Nếu buộc phải dùng Hydra bản cũ, không dùng `buildHydraSlotConfig` (L2 time) khi tạo TX off-chain, mà truyền trực tiếp Slot config của mạng Cardano L1 (ví dụ `SLOT_CONFIG_NETWORK['Preprod']`). Mặc dù sai về mặt lý thuyết Hydra, nhưng cách này qua mặt được Node logic hiện tại.

*Tài liệu hướng dẫn (README.md) trong thư mục này được viết chuẩn theo lý thuyết cho các phiên bản Hydra Node mới (>=2.0.0).*
