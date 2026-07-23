# @hydra-sdk/bridge

Hydra L2 bridge: Head lifecycle, real-time tx, UTxO mgmt. **See [docs/master-index.md](../docs/master-index.md)**.

[![npm](https://img.shields.io/npm/v/@hydra-sdk/bridge)](https://npmjs.com/package/@hydra-sdk/bridge)

## 🔗 Supported hydra-node versions

| `@hydra-sdk/bridge` | `hydra-node` | Status |
| --- | --- | --- |
| `2.x` | `2.x` (tested against **2.3.0**) | ✅ Active |
| `1.x` | `1.x` (up to **1.3.0**) | 🚫 End of life — no further releases |

The bridge major version tracks the hydra-node major version. Minor and patch
versions move independently.

`2.0.0` targets the **v2 protocol**, which removed the commit phase (ADR-33).
Upgrading from `1.x` is a breaking change — see
[MIGRATION-v2.md](./MIGRATION-v2.md).

## 🚀 Quick Start

```bash
pnpm add @hydra-sdk/bridge
```

```typescript
import { HydraBridge, HexcoreConnector } from '@hydra-sdk/bridge'

const connector = new HexcoreConnector({ socketIoUrl: 'wss://your-hydra-api.com/hydra' })
const bridge = new HydraBridge({ connector })
bridge.connect()
```

## ✨ Key Features

- 🔌 **Multiple Connections** (WebSocket, Socket.IO)
- 🌐 **Hydra Head Lifecycle** management (Init, Open, Close, Fanout)
- 📡 **Real-time Events** for network state monitoring
- 💰 **UTxO Management** with snapshot queries
- 🔄 **Commit/Decommit** operations for fund management
- 🔐 **JWT Authentication** support

## 📚 Documentation

For comprehensive guides, examples, and API reference:

**Docs:** [hydrasdk.com/docs](https://hydrasdk.com/docs) | [Technical](../docs/technical/bmm-index.md)

## 🛠️ Build Configuration

The SDK works with modern build tools. For detailed setup instructions, visit our [Configuration Guide](https://hydrasdk.com/getting-started/configuration).

## License

Apache 2.0. [Repo](https://github.com/Vtechcom/hydra-sdk) | [Issues](https://github.com/Vtechcom/hydra-sdk/issues)
