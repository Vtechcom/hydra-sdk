# @hydra-sdk/core

HD wallets, key management and Cardano utilities — the foundation every other Hydra SDK package builds on.

[![npm](https://img.shields.io/npm/v/@hydra-sdk/core)](https://npmjs.com/package/@hydra-sdk/core)

## 🎮 Try it first

The [**Hydra SDK Playground**](https://playground.hydrasdk.com/transaction-builder) runs this package in your browser — generate a wallet, derive accounts, pick UTxOs and build a transaction, with the matching TypeScript written out as you go. It is the quickest way to see what the API feels like before installing anything.

## 🚀 Quick Start

```bash
pnpm add @hydra-sdk/core @hydra-sdk/cardano-wasm
```

`@hydra-sdk/cardano-wasm` carries the WASM every package imports through, so keep it a direct dependency — your bundler needs to see it. See the [Configuration Guide](https://hydrasdk.com/getting-started/configuration) for Vite / Next.js / Webpack setup.

```typescript
import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'

const wallet = new AppWallet({
  networkId: NETWORK_ID.PREPROD,
  key: { type: 'mnemonic', words: AppWallet.brew() }
})

const account = wallet.getAccount(0, 0)
console.log(account.baseAddressBech32)
```

`NETWORK_ID` is a `Record`, not an enum — `{ MAINNET: 1, PREPROD: 0, PREVIEW: 0 }`. There is no `TESTNET` key.

## 📦 What's inside

**Wallets**

- `AppWallet` — HD wallet (BIP39/BIP44) from a `mnemonic`, a bech32 `root` key or `cli` signing keys, with signing, UTxO queries and submission through a fetcher/submitter pair
- `EmbeddedWallet` — lower-level key derivation without the account bookkeeping
- `CardanoCliWallet` — signing keys in the `cardano-cli` JSON envelope format

**Utility namespaces**

| Namespace | Covers |
| --- | --- |
| `Serializer` / `Deserializer` / `Converter` / `Resolver` | CBOR ↔ objects, hashes, address and UTxO conversion |
| `DatumUtils` / `RedeemerUtils` / `PlutusUtils` | Plutus data, redeemers, script handling |
| `AddressUtils` / `KeysUtils` / `BuildKeys` | Address derivation, key material |
| `MetadataUtils` / `TimeUtils` / `ParserUtils` | Tx metadata, slot ↔ time, hex and bytes |
| `ProviderUtils` | Blockfrost, Ogmios and other chain providers |
| `ValidationUtils` / `CostModels` | Address and output validation, Plutus cost models |

Constants: `NETWORK_ID`, `NETWORK_MAGIC`, `DEFAULT_PROTOCOL_PARAMETERS` (PV11), `SLOT_CONFIG_NETWORK`.

## 📚 Documentation

- [API reference](https://hydrasdk.com/api/core) · [Utilities reference](https://hydrasdk.com/api/utilities)
- [Quick start](https://hydrasdk.com/getting-started/quick-start) · [Configuration](https://hydrasdk.com/getting-started/configuration)
- [Guides](https://hydrasdk.com/guides) · [Changelog](https://hydrasdk.com/resources/changelog)

## License

Apache 2.0. [Repo](https://github.com/Vtechcom/hydra-sdk) | [Issues](https://github.com/Vtechcom/hydra-sdk/issues)
