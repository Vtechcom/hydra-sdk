---
title: Hướng Dẫn
description: Hướng dẫn từng bước và best practices khi xây dựng ứng dụng ví với Hydra SDK
---

# Hướng Dẫn

Chào mừng đến với phần hướng dẫn của tài liệu Hydra SDK. Tại đây bạn sẽ tìm thấy các tutorial từng bước và best practices để xây dựng ứng dụng ví Cardano với tích hợp Hydra Layer 2.

## Tổng Quan

Các hướng dẫn được tổ chức thành nhiều danh mục:

1. **[Xây Dựng Ứng Dụng Ví](/vi/guides/building-wallet-app)** - Tạo và quản lý ví Cardano
2. **[Làm Việc với Utilities](/vi/guides/working-with-utilities)** - Sử dụng hiệu quả các utility functions của SDK
3. **[Mint và Burn Tokens](/vi/guides/mint-burn-tokens)** - Các thao tác với native token
4. **Quản Lý Hydra Head** - Kết nối với Hydra Layer 2 và quản lý Hydra Heads
5. **Chiến Lược Kiểm Thử** - Kiểm thử ứng dụng của bạn

## Có gì mới trong v1.4.0

- **RedeemerUtils** - Namespace mới để xây dựng script redeemers (`mkRedeemer`, `mkSpendRedeemer`, `mkMintRedeemer`, `mkUnitRedeemer`)
- **Các encoder DatumUtils mới** - `mkList`, `mkBool`, `mkOption`, `mkBytesList`, `mkIntList`, `mkOutputRef`, `mkAddress`, `parseAddress`
- **ValidationUtils & AddressUtils** - `ValidationUtils.isValidTxOutput`, cùng với `AddressUtils.isValidAddress` và `getPubkeyHashFromAddress` được chuyển vị trí
- **Deserializer.deserializeAmountsFromTx** - Đọc các amount đầu ra đã gộp từ một transaction; bao gồm bản vá memory-leak của Resolver và các giá trị mặc định protocol v11

> Xem thêm: [Bắt đầu](/vi/getting-started/), [API](/vi/api/), [Ví dụ](/vi/examples/)
