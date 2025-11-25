# Hydra SDK

Bộ công cụ TypeScript hoàn chỉnh cho ví Cardano + Hydra L2. Monorepo 6 packages: core wallet, bridge, tx builder, WASM + configs chia sẻ.

**Mới:** Tài liệu hệ thống tại [docs/master-index.md](docs/master-index.md)

## 🚀 Tính năng chính

- **🏦 Ví Cardano**: Tạo/khôi phục/quản lý HD (`@hydra-sdk/core`)
- **⚡ Hydra L2**: Head lifecycle + tx real-time (`@hydra-sdk/bridge`)
- **🔧 Tx Builder**: Xây dựng tx low-level (`@hydra-sdk/transaction`)
- **📦 WASM**: Auto-detect browser/node (`@hydra-sdk/cardano-wasm`)
- **🌐 TypeScript**: Types + IntelliSense đầy đủ
- **⚙️ Monorepo**: pnpm + Turborepo

## 📦 Packages [docs/packages/](docs/packages/)

| Package | NPM | Đường dẫn |
|---------|-----|-----------|
| [@hydra-sdk/core](https://npmjs.com/package/@hydra-sdk/core) | `pnpm add @hydra-sdk/core` | [packages/core/](packages/core/) |
| [@hydra-sdk/bridge](https://npmjs.com/package/@hydra-sdk/bridge) | `pnpm add @hydra-sdk/bridge` | [packages/hydra-bridge/](packages/hydra-bridge/) |
| [@hydra-sdk/transaction](https://npmjs.com/package/@hydra-sdk/transaction) | `pnpm add @hydra-sdk/transaction` | [packages/hydra-transaction/](packages/hydra-transaction/) |
| [@hydra-sdk/cardano-wasm](https://npmjs.com/package/@hydra-sdk/cardano-wasm) | `pnpm add @hydra-sdk/cardano-wasm` | [packages/cardano-wasm/](packages/cardano-wasm/) |
| [@hydra-sdk/eslint-config](https://npmjs.com/package/@hydra-sdk/eslint-config) | ESLint chia sẻ | [packages/eslint-config/](packages/eslint-config/) |
| [@hydra-sdk/tsconfig](https://npmjs.com/package/@hydra-sdk/tsconfig) | TS config chia sẻ | [packages/tsconfig/](packages/tsconfig/)

## 🚀 Bắt đầu nhanh

### Cài đặt

```bash
# Từ NPM
pnpm add @hydra-sdk/core @hydra-sdk/bridge @hydra-sdk/transaction @hydra-sdk/cardano-wasm

# Dev local (pnpm workspaces)
git clone https://github.com/Vtechcom/hydra-sdk.git
cd hydra-sdk
pnpm install
pnpm build
pnpm --filter nodejs-playground test:all  # Test WASM
```

### Ví dụ sử dụng cơ bản

#### Tạo Wallet

```typescript
import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'

// Tạo wallet mới
const wallet = new AppWallet({
  networkId: NETWORK_ID.PREPROD,
  key: { type: 'mnemonic', words: AppWallet.brew() }
})

const account = wallet.getAccount(0, 0)
console.log('Address:', account.baseAddressBech32)
```

#### Kết nối Hydra Head

```typescript
import { HydraBridge, HexcoreConnector } from '@hydra-sdk/bridge'

const connector = new HexcoreConnector({
  socketIoUrl: 'wss://your-hydra-api.com/hydra',
  socketIoOptions: { auth: { token: 'your_jwt_token' } }
})

const bridge = new HydraBridge({ connector })
bridge.connect()

bridge.events.on('onConnected', async () => {
  const utxos = await bridge.querySnapshotUtxo()
  console.log('UTxOs:', utxos)
})
```

#### Xây dựng Transaction

```typescript
import { TxBuilder } from '@hydra-sdk/transaction'

const txBuilder = new TxBuilder({ 
  isHydra: true, 
  params: protocolParameters 
})

const tx = await txBuilder
  .setInputs(inputUtxos)
  .addLovelaceOutput(recipientAddress, '1000000') // 1 ADA
  .setChangeAddress(changeAddress)
  .complete()

// Ký và submit
const signedTx = await wallet.signTx(tx.to_hex(), false, 0, 0)
await bridge.submitTxSync({
  txId: txId,
  cborHex: signedTx,
  description: 'Payment',
  type: 'Witnessed Tx ConwayEra'
})
```

## 📚 Tài liệu

- **Master Index:** [docs/master-index.md](docs/master-index.md) (EN/VI, kỹ thuật + nội bộ)
- **Hướng dẫn Người dùng:** [hydrasdk.com](https://hydrasdk.com) (API, ví dụ, guides)
- **Kỹ thuật:** [docs/technical/bmm-index.md](docs/technical/bmm-index.md)
- **API Metadata:** [sdk-ai-agent/sdk-api-metadata.json](sdk-ai-agent/sdk-api-metadata.json)

## 🛠️ Phát triển

```bash
# Chạy web application
pnpm dev

# Build tất cả packages  
pnpm build

# Chạy tests
pnpm test

# Format code
pnpm format
```

## 📄 Giấy phép

Apache 2.0 License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 🔗 Liên kết

- 🏠 [hydrasdk.com](https://hydrasdk.com)
- 🐛 [Issues](https://github.com/Vtechcom/hydra-sdk/issues)
- 💬 [Discussions](https://github.com/Vtechcom/hydra-sdk/discussions)

### Ngoài
- [Cardano Docs](https://developers.cardano.org/)
- [Hydra Head](https://hydra.family/head-protocol/)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turborepo](https://turbo.build/repo)

---

**Hydra Wallet SDK** - Bộ công cụ hoàn chỉnh cho ứng dụng Cardano + Hydra. Được tạo với ❤️ bởi team Vtechcom.
