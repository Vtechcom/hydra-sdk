# Hydra SDK

A complete TypeScript toolkit for Cardano + Hydra Layer 2 wallet apps. Monorepo with 6 packages: core wallet, bridge, tx builder, WASM bindings + shared configs.

**New:** Systematized docs at [docs/master-index.md](docs/master-index.md)

## 🚀 Key Features

- **🏦 Cardano Wallets**: HD wallet create/restore/manage (`@hydra-sdk/core`)
- **⚡ Hydra L2**: Head lifecycle + real-time tx (`@hydra-sdk/bridge`)
- **🔧 Tx Builder**: Low-level tx construction (`@hydra-sdk/transaction`)
- **📦 WASM Bindings**: Auto-detect browser/node (`@hydra-sdk/cardano-wasm`)
- **🌐 TypeScript**: Full types + IntelliSense
- **⚙️ Monorepo**: pnpm + Turborepo

## 📦 Packages [docs/packages/](docs/packages/)

| Package | NPM | Path |
|---------|-----|------|
| [@hydra-sdk/core](https://npmjs.com/package/@hydra-sdk/core) | `npm i @hydra-sdk/core` | [packages/core/](packages/core/) |
| [@hydra-sdk/bridge](https://npmjs.com/package/@hydra-sdk/bridge) | `npm i @hydra-sdk/bridge` | [packages/hydra-bridge/](packages/hydra-bridge/) |
| [@hydra-sdk/transaction](https://npmjs.com/package/@hydra-sdk/transaction) | `npm i @hydra-sdk/transaction` | [packages/hydra-transaction/](packages/hydra-transaction/) |
| [@hydra-sdk/cardano-wasm](https://npmjs.com/package/@hydra-sdk/cardano-wasm) | `npm i @hydra-sdk/cardano-wasm` | [packages/cardano-wasm/](packages/cardano-wasm/) |
| [@hydra-sdk/eslint-config](https://npmjs.com/package/@hydra-sdk/eslint-config) | Shared ESLint | [packages/eslint-config/](packages/eslint-config/) |
| [@hydra-sdk/tsconfig](https://npmjs.com/package/@hydra-sdk/tsconfig) | Shared TS config | [packages/tsconfig/](packages/tsconfig/)

## 🚀 Quick Start

### Installation

```bash
# Install from NPM
pnpm add @hydra-sdk/core @hydra-sdk/bridge @hydra-sdk/transaction @hydra-sdk/cardano-wasm

# Local dev (pnpm workspaces)
git clone https://github.com/Vtechcom/hydra-sdk.git
cd hydra-sdk
pnpm install
pnpm build
pnpm --filter nodejs-playground test:all  # Test WASM
```

### Basic Usage Examples

#### Create a Wallet

```typescript
import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'

// Generate new wallet
const wallet = new AppWallet({
  networkId: NETWORK_ID.PREPROD,
  key: { type: 'mnemonic', words: AppWallet.brew() }
})

const account = wallet.getAccount(0, 0)
console.log('Address:', account.baseAddressBech32)
```

#### Connect to Hydra Head

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

#### Build Transaction

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

// Sign and submit
const signedTx = await wallet.signTx(tx.to_hex(), false, 0, 0)
await bridge.submitTxSync({
  txId: txId,
  cborHex: signedTx,
  description: 'Payment',
  type: 'Witnessed Tx ConwayEra'
})
```

## 🛠️ Development

```bash
# Run web application
pnpm dev

# Build all packages  
pnpm build

# Run tests
pnpm test

# Format code
pnpm format
```

##  License

Apache 2.0 License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- 🏠 [hydrasdk.com](https://hydrasdk.com)
- 🐛 [Issues](https://github.com/Vtechcom/hydra-sdk/issues)
- 💬 [Discussions](https://github.com/Vtechcom/hydra-sdk/discussions)

### External
- [Cardano Docs](https://developers.cardano.org/)
- [Hydra Head](https://hydra.family/head-protocol/)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turborepo](https://turbo.build/repo)

## 📚 Documentation

- **Master Index:** [docs/master-index.md](docs/master-index.md) (EN/VI, technical + internal)
- **User Guides:** [hydrasdk.com](https://hydrasdk.com) (API, examples, guides)
- **Technical:** [docs/technical/bmm-index.md](docs/technical/bmm-index.md)
- **API Metadata:** [sdk-ai-agent/sdk-api-metadata.json](sdk-ai-agent/sdk-api-metadata.json)

---

**Hydra Wallet SDK** - The complete toolkit for Cardano + Hydra applications. Made with ❤️ by the Vtechcom team.

