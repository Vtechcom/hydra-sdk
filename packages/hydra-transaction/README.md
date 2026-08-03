# @hydra-sdk/transaction

`TxBuilder` — a fluent Cardano transaction builder covering multi-asset transfers, minting and burning, Plutus scripts, staking and Hydra L2.

[![npm](https://img.shields.io/npm/v/@hydra-sdk/transaction)](https://npmjs.com/package/@hydra-sdk/transaction)

## 🎮 Try it first

The [**Transaction Builder playground**](https://playground.hydrasdk.com/transaction-builder) is this package with a UI on top: pick inputs, add outputs, mint, attach scripts and datums, then read the generated TypeScript next to the built CBOR. Every builder method below has a control there, so it doubles as a live reference.

## 🚀 Quick Start

```bash
pnpm add @hydra-sdk/transaction @hydra-sdk/cardano-wasm
```

```typescript
import { TxBuilder } from '@hydra-sdk/transaction'

const cbor = await new TxBuilder()
  .setInputs(utxos)
  .txOut('addr_test1...', [{ unit: 'lovelace', quantity: '2000000' }])
  .changeAddress(changeAddress)
  .completeCbor()

const signedTx = await wallet.signTx(cbor)
const txHash = await wallet.submitTx(signedTx)
```

For a Hydra head, pass `isHydra: true` (and the head's protocol parameters) to the constructor:

```typescript
const builder = new TxBuilder({ isHydra: true, params: await bridge.getProtocolParameters() })
```

## 🧠 WASM memory — the one thing to get right

Every object the builder touches lives in WASM linear memory and is only reclaimed by `.free()`. The JS garbage collector will not do it promptly, so a build loop leaks unless you help it.

| You need | Use | Who frees |
| --- | --- | --- |
| Just the CBOR | `completeCbor()` | The builder — nothing to free |
| A live `Transaction` | `complete()` | **You** — call `tx.free()` when done |
| Done with the builder | `dispose()`, or `using builder = new TxBuilder()` | The builder frees everything it holds |

For high-volume workloads, reuse one builder with `reset()` between transactions and `dispose()` it at the end. See [Performance](https://hydrasdk.com/resources/performance) for measurements.

## ✨ What it builds

- **Inputs** — `setInputs()` with four coin-selection strategies, or explicit `txIn()`
- **Outputs** — `txOut()` / `addOutput()`, multi-asset, inline datums
- **Mint & burn** — `mint()`, `mintingScript()`, `mintRedeemerValue()`
- **Plutus V1/V2/V3** — script inputs, datum hashes, inline datums, redeemers, collateral, reference inputs
- **Staking** — `registerStake()`, `deregisterStake()`, `delegateStake()`, `withdrawal()`
- **Metadata & validity** — `metadataValue()`, `invalidBefore()`, `invalidAfter()`
- **Fees** — computed from protocol parameters, or pinned with `setFee()` / `setMinFee()`
- **Script budgets** — pass an `evaluator` and `complete()` rebuilds with real `exUnits` so the fee is accurate (omit it for Hydra, which has no on-chain evaluation)

## 📚 Documentation

- [API reference](https://hydrasdk.com/api/transaction) · [Building transactions guide](https://hydrasdk.com/guides/transactions)
- [Mint and burn tokens](https://hydrasdk.com/guides/mint-burn-tokens) · [Configuration](https://hydrasdk.com/getting-started/configuration)
- [Changelog](https://hydrasdk.com/resources/changelog)

## License

Apache 2.0. [Repo](https://github.com/Vtechcom/hydra-sdk) | [Issues](https://github.com/Vtechcom/hydra-sdk/issues)
