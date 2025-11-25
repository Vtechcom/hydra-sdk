# @hydra-sdk/core

Core Cardano wallet library: HD wallets, multi-network, TypeScript-first. **See [docs/master-index.md](../docs/master-index.md)** for full context.

[![npm](https://img.shields.io/npm/v/@hydra-sdk/core)](https://npmjs.com/package/@hydra-sdk/core)

## 🚀 Quick Start

```bash
pnpm add @hydra-sdk/core
```

```typescript
import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'

const wallet = new AppWallet({
  networkId: NETWORK_ID.PREPROD,
  key: { type: 'mnemonic', words: AppWallet.brew() }
})
console.log(wallet.getAccount(0, 0).baseAddressBech32)
```

## ✨ Key Features

- 🌐 **Browser-optimized** with Vite/Rollup support
- 🔐 **HD Wallets** (BIP44) with secure key management  
- 📱 **DApp Integration** with popular wallet connectors
- 🔗 **Multi-network** support (Mainnet, Preprod, Preview)
- 💎 **TypeScript** with complete type definitions
- 🚀 **WebAssembly** powered for high performance

## 📚 Documentation

For comprehensive guides, examples, and API reference:

**Docs:** [hydrasdk.com/docs](https://hydrasdk.com/docs) | [Technical](../docs/technical/bmm-index.md) | [API Metadata](../sdk-ai-agent/sdk-api-metadata.json)

## 🛠️ Build Configuration

The SDK works with modern build tools. For detailed setup instructions, visit our [Configuration Guide](https://hydrasdk.com/getting-started/configuration).

## License

Apache 2.0. [Repo](https://github.com/Vtechcom/hydra-sdk) | [Issues](https://github.com/Vtechcom/hydra-sdk/issues)

