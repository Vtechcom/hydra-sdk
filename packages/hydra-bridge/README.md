# @hydra-sdk/bridge

Hydra L2 bridge: Head lifecycle, real-time tx, UTxO mgmt. **See [docs/master-index.md](../docs/master-index.md)**.

[![npm](https://img.shields.io/npm/v/@hydra-sdk/bridge)](https://npmjs.com/package/@hydra-sdk/bridge)

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
