# Tài Liệu Hydra SDK v1.4.0

Chào mừng bạn đến với tài liệu toàn diện cho Hydra SDK - bộ công cụ hoàn chỉnh để xây dựng ứng dụng ví Cardano với tích hợp Hydra Layer 2.

## Hydra SDK là gì?

Hydra SDK là một bộ phát triển phần mềm toàn diện cung cấp các thư viện và công cụ thiết yếu để tích hợp chức năng ví Cardano và quản lý Hydra Head vào ứng dụng của bạn. Được xây dựng trên kiến trúc monorepo sử dụng Turborepo, nó cung cấp một cách tiếp cận mô-đun, có thể mở rộng cho việc phát triển Cardano.

**Bản phát hành mới nhất: v1.4.0** (`@hydra-sdk/core` 1.4.0, `@hydra-sdk/bridge` 1.3.1) - Bổ sung namespace RedeemerUtils, các encoder DatumUtils mới, ValidationUtils, và hỗ trợ Cardano protocol v11.

## Tính Năng Chính

- **🏦 Quản Lý Ví Cardano**: Hỗ trợ HD wallet hoàn chỉnh với tạo tài khoản/địa chỉ
- **⚡ Tích Hợp Hydra Layer 2**: Quản lý vòng đời Hydra Head đầy đủ và xử lý thời gian thực
- **🔧 Transaction Builder**: Xây dựng giao dịch nâng cao với hỗ trợ Hydra
- **🌐 Sự Kiện Thời Gian Thực**: Hỗ trợ WebSocket và Socket.IO cho cập nhật trực tiếp
- **📦 Kiến Trúc Mô-đun**: Kiến trúc dựa trên package để dễ dàng tùy chỉnh
- **🔒 TypeScript Đầu Tiên**: Định nghĩa kiểu toàn diện và an toàn kiểu
- **🛠️ Utilities Mạnh Mẽ**: Bộ sưu tập phong phú các utility functions cho phát triển Cardano
- **📊 Chuyển Đổi Dữ Liệu**: Utilities nâng cao cho serialization, deserialization, và parsing dữ liệu

## Bắt Đầu Nhanh

Bắt đầu với Hydra SDK trong vài phút:

```bash
# Cài đặt các package core
npm install @hydra-sdk/core @hydra-sdk/bridge @hydra-sdk/transaction

# Tạo một ví đơn giản với utilities
import {
  AppWallet,
  NETWORK_ID,
  ParserUtils,
  TimeUtils,
  DatumUtils
} from '@hydra-sdk/core'

const wallet = new AppWallet({
  networkId: NETWORK_ID.PREPROD,
  key: { type: 'mnemonic', words: AppWallet.brew() }
})

const account = wallet.getAccount(0, 0)
console.log('Địa chỉ:', account.baseAddressBech32)

// Sử dụng utilities cho các tác vụ thông thường
const currentSlot = TimeUtils.resolveSlotNo('preprod')
const datum = DatumUtils.mkInt(42)
const hexData = ParserUtils.stringToHex('Xin chào Hydra SDK v1.1.0!')

console.log('Slot hiện tại:', currentSlot)
console.log('Datum hex:', datum.to_hex())
console.log('Message dạng hex:', hexData)
```

## Các Package Core

### [@hydra-sdk/core](/vi/api/core)

Chức năng ví Cardano cốt lõi bao gồm hỗ trợ HD wallet, ký giao dịch và tích hợp mạng.

### [@hydra-sdk/bridge](/vi/api/bridge)

Tích hợp Hydra Layer 2 với quản lý vòng đời Head hoàn chỉnh, sự kiện thời gian thực và xử lý giao dịch.

### [@hydra-sdk/transaction](/vi/api/transaction)

Tiện ích xây dựng giao dịch nâng cao với hỗ trợ Hydra, quản lý UTxO và tối ưu hóa phí.

### [@hydra-sdk/cardano-wasm](/vi/api/cardano-wasm)

Bindings Cardano WASM cho ứng dụng trình duyệt với các hoạt động serialization và mật mã.

## Tổng Quan Kiến Trúc

```mermaid
graph TD
    A[Ứng Dụng Của Bạn] --> B[@hydra-sdk/core]
    A --> C[@hydra-sdk/bridge]
    A --> D[@hydra-sdk/transaction]

    B --> E[@hydra-sdk/cardano-wasm]
    C --> B
    C --> E
    D --> B
    D --> E

    E --> F[Cardano Serialization Lib]
    C --> G[Socket.IO Client]

    H[Hydra Node] -.-> C
    I[Cardano Network] -.-> B
```

## Các Trường Hợp Sử Dụng

### Phát Triển DApp

Xây dựng ứng dụng phi tập trung với tích hợp ví Cardano liền mạch và mở rộng Hydra Layer 2.

### Ứng Dụng Ví

Tạo ứng dụng ví đầy đủ tính năng với hỗ trợ HD wallet, quản lý giao dịch và cập nhật thời gian thực.

### Giải Pháp Thanh Toán

Triển khai giải pháp thanh toán nhanh, chi phí thấp sử dụng Hydra Heads cho giao dịch tức thì.

### Giao Thức DeFi

Tích hợp với các giao thức DeFi sử dụng xây dựng giao dịch nâng cao và quản lý trạng thái thời gian thực.

## Bắt Đầu

Sẵn sàng bắt đầu xây dựng? Xem các hướng dẫn của chúng tôi:

- [Hướng Dẫn Cài Đặt](/vi/getting-started/installation) - Thiết lập môi trường phát triển
- [Hướng Dẫn Bắt Đầu Nhanh](/vi/getting-started/quick-start) - Xây dựng ứng dụng đầu tiên
- [Hướng Dẫn Cấu Hình](/vi/getting-started/configuration) - Cấu hình dự án

## Ví Dụ

Khám phá các ví dụ thực tế:

- [Tạo Ví](/vi/examples/wallet-creation) - Tạo và quản lý ví
- [Tích Hợp Hydra](/vi/examples/hydra-integration) - Kết nối với Hydra Heads
- [Xây Dựng Giao Dịch](/vi/examples/transaction-building) - Xây dựng và gửi giao dịch
- [Ứng Dụng Hoàn Chỉnh](/vi/examples/full-application) - Ví dụ ứng dụng hoàn chỉnh

## Cộng Đồng & Hỗ Trợ

- **GitHub**: [hydra-sdk](https://github.com/Vtechcom/hydra-sdk)
- **Tài liệu**: [hydra-sdk.dev](https://hydra-sdk.dev)
- **Issues**: [Báo cáo lỗi và yêu cầu tính năng](https://github.com/Vtechcom/hydra-sdk/issues)
- **Thảo luận**: [Thảo luận cộng đồng](https://github.com/Vtechcom/hydra-sdk/discussions)

## Giấy Phép

Hydra SDK là phần mềm mã nguồn mở được cấp phép theo [MIT License](https://github.com/Vtechcom/hydra-sdk/blob/dev/LICENSE).
