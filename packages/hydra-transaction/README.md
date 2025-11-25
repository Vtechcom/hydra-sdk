# @hydra-sdk/transaction

Tx builder: Fluent API, multi-asset, mint/burn, Plutus. **See [docs/master-index.md](../docs/master-index.md)**.

[![npm](https://img.shields.io/npm/v/@hydra-sdk/transaction)](https://npmjs.com/package/@hydra-sdk/transaction)

## 🚀 Quick Start

```bash
pnpm add @hydra-sdk/transaction
```

```typescript
import { TxBuilder } from '@hydra-sdk/transaction'

const txBuilder = new TxBuilder({ isHydra: true, params: protocolParams })
  .setInputs(inputUtxos)
  .addLovelaceOutput(addr, '1000000')
  .complete()
```

## ✨ Key Features

- 🔧 **Fluent API** with intuitive method chaining
- 🎯 **Smart Contracts** with complete Plutus support (V1, V2, V3)
- 💎 **Multi-Asset** support for native tokens and NFTs
- 🏗️ **Minting & Burning** with policy script management
- 🔐 **Built-in Validation** and comprehensive error handling
- 📊 **UTxO Management** with intelligent coin selection

## 📚 Documentation

For comprehensive guides, examples, and API reference:

**Docs:** [hydrasdk.com/docs](https://hydrasdk.com/docs) | [Technical](../docs/technical/bmm-index.md)

## 🛠️ Build Configuration

The SDK works with modern build tools. For detailed setup instructions, visit our [Configuration Guide](https://hydrasdk.com/getting-started/configuration).

## License

Apache 2.0. [Repo](https://github.com/Vtechcom/hydra-sdk) | [Issues](https://github.com/Vtechcom/hydra-sdk/issues)
