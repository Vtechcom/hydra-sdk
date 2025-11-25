---
Title: Tài liệu API
description: Tài liệu tham khảo API cho Hydra SDK
---

# Tài liệu API

Chào mừng bạn đến với phần tài liệu API (API reference) của Hydra SDK. Tại đây bạn sẽ tìm thấy mô tả chi tiết cho tất cả các package và phương thức của SDK.

## Tổng quan

Hydra SDK gồm 4 package chính và bộ sưu tập utilities toàn diện:

1. [**@hydra-sdk/core**](/vi/api/core) - Chức năng ví (wallet) cốt lõi
2. [**@hydra-sdk/bridge**](/vi/api/bridge) - Tích hợp Hydra Layer 2
3. [**@hydra-sdk/transaction**](/vi/api/transaction) - Tiện ích xây dựng giao dịch (transaction builder)
4. [**@hydra-sdk/cardano-wasm**](/vi/api/cardano-wasm) - Binding WASM (WebAssembly) cho các thao tác Cardano nâng cao
5. [**Utilities**](/vi/api/utilities) - Bộ sưu tập toàn diện các utility functions cho phát triển Cardano

## Có Gì Mới trong v1.1.0

- **Enhanced Utilities**: Các utility functions mới cho data parsing, datum handling, policy management, và time calculations
- **Improved Type Safety**: Định nghĩa TypeScript tốt hơn và type checking
- **Provider Abstractions**: Unified provider interfaces cho các nguồn dữ liệu blockchain khác nhau
- **Advanced WASM Operations**: Extended WASM utilities cho serialization và deserialization
