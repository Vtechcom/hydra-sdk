# @hydra-sdk/bridge

Talk to a `hydra-node`: head lifecycle, real-time events, snapshot UTxOs and L2 transaction submission.

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
[MIGRATION-v2.md](https://github.com/Vtechcom/hydra-sdk/blob/master/packages/hydra-bridge/MIGRATION-v2.md).

## 🎮 Try it first

The [**Hydra SDK Playground**](https://playground.hydrasdk.com) builds and inspects Hydra transactions in the browser — switch the [transaction builder](https://playground.hydrasdk.com/transaction-builder) into Hydra mode to see how an L2 transaction differs from an L1 one. When a head rejects a transaction, [Hydra Message Trace](https://playground.hydrasdk.com/hydra-tx-trace) decodes the node's `validationError` into something readable.

## 🚀 Quick Start

```bash
pnpm add @hydra-sdk/bridge @hydra-sdk/cardano-wasm
```

```typescript
import { HydraBridge } from '@hydra-sdk/bridge'

const bridge = new HydraBridge({ url: 'ws://localhost:4001', verbose: true })
await bridge.connect()

const info = await bridge.headInfo()
const utxos = bridge.snapshotUtxoArray()
```

`url` accepts `ws://`, `wss://`, `http://`, `https://`, and gateway URLs carrying `?X-Api-Key=…`. For Socket.IO endpoints with JWT auth, pass a `HexcoreConnector` as `connector` instead — see the [API reference](https://hydrasdk.com/api/bridge#connectors).

## ✨ Key Features

- **Head lifecycle** — `commands.init()`, `close()`, `safeClose()`, `contest()`, `fanout()`, `partialFanout()`
- **Incremental deposits** — `pendingDeposits()` and `recoverDeposit()` replace the v1 commit phase
- **L2 submission** — `submitL2Tx()` over `POST /transaction`, plus `submitTxSync()` (Promise) and `submitTx()` (error-first callback)
- **O(1) balance and UTxO reads** from an in-memory snapshot cache — no I/O per call
- **Real-time events** for every head state transition, with the payload union fully typed
- **Protocol parameters** — `getProtocolParameters()`, and `getRawProtocolParameters()` for `costModels` / `protocolVersion` when budgeting exUnits
- **Auto-reconnect** with configurable interval and attempt cap, cancelled safely on `disconnect()`

## 📚 Documentation

- [API reference](https://hydrasdk.com/api/bridge) · [Hydra integration guide](https://hydrasdk.com/guides/hydra-integration)
- [Transactions in Hydra](https://hydrasdk.com/concepts/transactions-in-hydra) · [Hydra protocol versions](https://hydrasdk.com/concepts/hydra-v2-changes)
- [v1 → v2 migration](https://github.com/Vtechcom/hydra-sdk/blob/master/packages/hydra-bridge/MIGRATION-v2.md) · [Changelog](https://hydrasdk.com/resources/changelog)

## License

Apache 2.0. [Repo](https://github.com/Vtechcom/hydra-sdk) | [Issues](https://github.com/Vtechcom/hydra-sdk/issues)
