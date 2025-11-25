---
title: Xây Dựng Ứng Dụng Ví
description: Hướng dẫn tạo ứng dụng ví Cardano với Hydra SDK
---

# Xây Dựng Ứng Dụng Ví

Hướng dẫn từ A-Z để tạo ứng dụng ví Cardano tích hợp Hydra Layer 2.

## Kiến trúc tổng quát

- UI: React/Vue/Svelte
- Wallet: `@hydra-sdk/core`
- Transaction: `@hydra-sdk/transaction`
- Hydra L2: `@hydra-sdk/bridge`
- WASM: `@hydra-sdk/cardano-wasm`

## Các bước chính

1. Khởi tạo ví bằng `AppWallet`
2. Lấy `account` (địa chỉ, khóa)
3. Tích hợp `TxBuilder` để build transaction
4. Tùy chọn Hydra: dùng `HydraBridge` để lấy `protocol params` và submit tx lên Head
5. Xử lý sự kiện và cleanup (disconnect)

## Mẫu code

```ts
import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'
import { HydraBridge } from '@hydra-sdk/bridge'

async function run() {
  const wallet = new AppWallet({ networkId: NETWORK_ID.PREPROD, key: { type: 'mnemonic', words: AppWallet.brew() } })
  const account = wallet.getAccount(0, 0)

  const bridge = new HydraBridge({ url: 'ws://localhost:4001' })
  await bridge.connect()
  const params = await bridge.getProtocolParameters()

  const tx = await new TxBuilder({ isHydra: true, params })
    .setInputs(await bridge.queryAddressUTxO(account.baseAddressBech32))
    .txOut(account.baseAddressBech32, [{ unit: 'lovelace', quantity: '1000000' }])
    .changeAddress(account.baseAddressBech32)
    .complete()

  await bridge.submitTxSync({ type: 'Witnessed Tx ConwayEra', description: 'Ledger Cddl Format', cborHex: await wallet.signTx(tx.to_hex(), false, 0, 0), txId: 'auto' })
}
```

> Tham khảo thêm: [Bắt đầu](/vi/getting-started/), [Ví dụ](/vi/examples/), [API](/vi/api/)
