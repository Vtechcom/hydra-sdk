# Hydra SDK - Architecture Documentation

> **Generated:** 2025-11-18  
> **Type:** SDK Library Architecture  
> **Pattern:** Module-based + Event-driven

## Executive Summary

Hydra SDK là TypeScript-based monorepo cung cấp comprehensive toolkit để xây dựng Cardano wallet applications với Hydra Layer 2 support. Architecture được thiết kế theo nguyên tắc modular, type-safe, và tree-shakeable.

## Architecture Principles

### 1. Modular Design
- **Separation of Concerns:** Mỗi package có responsibility rõ ràng
- **Loose Coupling:** Packages có thể sử dụng độc lập
- **High Cohesion:** Related functionality được nhóm lại

### 2. Type Safety
- **Full TypeScript:** 100% TypeScript codebase
- **Strict Mode:** Enabled for all packages
- **Type Exports:** `.d.ts` files for consumers

### 3. Tree-shakeability
- **ES Modules:** Primary distribution format
- **Named Exports:** Avoid `export default`
- **Side-effect Free:** No global state mutations

### 4. Browser + Node.js Support
- **Universal Modules:** Works in both environments
- **Conditional Exports:** package.json `exports` field
- **WASM Compatibility:** Browser-optimized WASM bindings

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User Applications                     │
│        (dApps, Wallets, CLI Tools, Web Apps)            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                  Hydra SDK (Public API)                  │
├─────────────────────────────────────────────────────────┤
│  @hydra-sdk/core  │  @hydra-sdk/bridge  │  @hydra-sdk   │
│                   │                      │  /transaction │
├─────────────────────────────────────────────────────────┤
│           @hydra-sdk/cardano-wasm (WASM Layer)          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│         External Dependencies & Services                 │
├─────────────────────────────────────────────────────────┤
│  Cardano Node API  │  Hydra Node   │  Blockfrost API   │
│  (GraphQL/REST)    │  (WebSocket)  │  (REST)           │
└─────────────────────────────────────────────────────────┘
```

---

## Package Architecture

### Core Package (`@hydra-sdk/core`)

**Responsibility:** Foundation for Cardano wallet operations

```
┌─────────────────────────────────────────┐
│           @hydra-sdk/core               │
├─────────────────────────────────────────┤
│  Wallet Management Layer                │
│  ┌─────────────────────────────────┐   │
│  │  AppWallet                      │   │
│  │  ├─ HD Key Derivation (BIP32)  │   │
│  │  ├─ Address Generation         │   │
│  │  ├─ UTXO Management             │   │
│  │  └─ Account Management          │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  Utility Layer                          │
│  ┌─────────────────────────────────┐   │
│  │  Serializer   │  Deserializer   │   │
│  │  Converter    │  Resolver       │   │
│  │  BuildKeys    │  CostModels     │   │
│  │  Datum        │  Policy         │   │
│  │  Metadata     │  Time           │   │
│  │  Parser       │  Validator      │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  Type System Layer                      │
│  ┌─────────────────────────────────┐   │
│  │  Wallet Types  │  Cardano Types │   │
│  │  Protocol      │  Fetcher       │   │
│  │  Submitter     │                │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  WASM Abstraction Layer                 │
│  └───────> @hydra-sdk/cardano-wasm     │
└─────────────────────────────────────────┘
```

**Key Design Patterns:**

1. **Factory Pattern** - Wallet creation
   ```typescript
   const wallet = new AppWallet({
     networkId: NETWORK_ID.PREPROD,
     key: { type: 'mnemonic', words: mnemonic }
   })
   ```

2. **Strategy Pattern** - Provider abstraction
   ```typescript
   interface IFetcher {
     fetchAddressUTxOs(address: string): Promise<UTxO[]>
   }
   ```

3. **Utility Namespaces** - Organized helpers
   ```typescript
   import { Serializer, Deserializer, Converter } from '@hydra-sdk/core'
   ```

---

### Bridge Package (`@hydra-sdk/bridge`)

**Responsibility:** Hydra Layer 2 integration với real-time communication

```
┌──────────────────────────────────────────┐
│         @hydra-sdk/bridge                │
├──────────────────────────────────────────┤
│  Event-Driven Layer (mitt)               │
│  ┌────────────────────────────────────┐  │
│  │  Event Bus                         │  │
│  │  ├─ HeadIsInitializing             │  │
│  │  ├─ HeadIsOpen                     │  │
│  │  ├─ TxValid / TxInvalid            │  │
│  │  ├─ SnapshotConfirmed              │  │
│  │  └─ HeadIsClosed                   │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  Connection Layer                        │
│  ┌────────────────────────────────────┐  │
│  │  WebSocket Connector               │  │
│  │  ├─ Native WebSocket               │  │
│  │  └─ Auto-reconnect                 │  │
│  ├────────────────────────────────────┤  │
│  │  Socket.IO Connector               │  │
│  │  ├─ Socket.IO Client               │  │
│  │  └─ Fallback Transport             │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  State Management Layer                  │
│  ┌────────────────────────────────────┐  │
│  │  Hydra Head State Machine          │  │
│  │  ├─ Initializing                   │  │
│  │  ├─ Open                            │  │
│  │  ├─ Closed                          │  │
│  │  └─ Final                           │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  Core Dependencies                       │
│  └───────> @hydra-sdk/core              │
└──────────────────────────────────────────┘
```

**Key Design Patterns:**

1. **Observer Pattern** - Event subscriptions
   ```typescript
   bridge.on('HeadIsOpen', (data) => {
     console.log('Head opened:', data)
   })
   ```

2. **State Machine** - Head lifecycle
   ```typescript
   Initializing → Open → Closed → Final
   ```

3. **Adapter Pattern** - Connector abstraction
   ```typescript
   interface IConnector {
     connect(): Promise<void>
     send(message: any): void
     on(event: string, handler: Function): void
   }
   ```

---

### Transaction Package (`@hydra-sdk/transaction`)

**Responsibility:** Transaction building utilities

```
┌──────────────────────────────────────────┐
│      @hydra-sdk/transaction              │
├──────────────────────────────────────────┤
│  Transaction Builder Layer               │
│  ┌────────────────────────────────────┐  │
│  │  BasicTxBuilder                    │  │
│  │  MintTxBuilder                     │  │
│  │  ScriptTxBuilder                   │  │
│  │  MetadataTxBuilder                 │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  Plutus Utilities Layer                  │
│  ┌────────────────────────────────────┐  │
│  │  datumBuilder()                    │  │
│  │  ├─ int, bytes                     │  │
│  │  ├─ list, map                      │  │
│  │  └─ constr                         │  │
│  ├────────────────────────────────────┤  │
│  │  buildRedeemer()                   │  │
│  │  emptyRedeemer()                   │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  UTXO Selection Layer                    │
│  ┌────────────────────────────────────┐  │
│  │  Coin Selection Algorithms         │  │
│  │  ├─ Largest First                  │  │
│  │  ├─ Random Improve                 │  │
│  │  └─ Custom Strategies              │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  Fee Calculation Layer                   │
│  ┌────────────────────────────────────┐  │
│  │  Fee Estimation                    │  │
│  │  Min ADA Calculation               │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  Core Dependencies                       │
│  └───────> @hydra-sdk/core              │
└──────────────────────────────────────────┘
```

**Key Design Patterns:**

1. **Builder Pattern** - TX construction
   ```typescript
   const tx = new BasicTxBuilder()
     .addInput(utxo)
     .addOutput(address, amount)
     .build()
   ```

2. **Factory Functions** - Datum/Redeemer creation
   ```typescript
   const datum = datumBuilder({ type: 'constr', ... })
   const redeemer = buildRedeemer(jsValue, options)
   ```

3. **Strategy Pattern** - Coin selection
   ```typescript
   interface ICoinSelection {
     select(utxos: UTxO[], target: Value): UTxO[]
   }
   ```

---

### WASM Package (`@hydra-sdk/cardano-wasm`)

**Responsibility:** Cardano WASM bindings wrapper

```
┌──────────────────────────────────────────┐
│      @hydra-sdk/cardano-wasm             │
├──────────────────────────────────────────┤
│  Re-export Layer                         │
│  ┌────────────────────────────────────┐  │
│  │  @emurgo/cardano-serialization-    │  │
│  │  lib-browser                       │  │
│  │  ├─ Address                        │  │
│  │  ├─ Transaction                    │  │
│  │  ├─ TransactionBuilder             │  │
│  │  ├─ PlutusData                     │  │
│  │  └─ ...all WASM types              │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  Loader Layer                            │
│  ┌────────────────────────────────────┐  │
│  │  Dynamic WASM Loading              │  │
│  │  ├─ Browser: fetch + instantiate   │  │
│  │  └─ Node.js: fs + WebAssembly      │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

---

## Integration Architecture

### Package Dependencies

```
@hydra-sdk/core
    │
    ├─── @hydra-sdk/cardano-wasm
    ├─── bip39
    ├─── axios
    └─── @scure/base

@hydra-sdk/bridge
    │
    ├─── @hydra-sdk/core ───┐
    ├─── @hydra-sdk/cardano-wasm ───┘
    ├─── socket.io-client
    ├─── mitt
    └─── axios

@hydra-sdk/transaction
    │
    ├─── @hydra-sdk/core ───┐
    ├─── @hydra-sdk/cardano-wasm ───┘
    ├─── json-bigint
    └─── @scure/base
```

### Data Flow

```
User Application
      │
      ├─── Wallet Operations ──────> @hydra-sdk/core
      │         │
      │         └─── WASM ────────> @hydra-sdk/cardano-wasm
      │                                     │
      │                                     └──> Emurgo CSL
      │
      ├─── Layer 2 Operations ─────> @hydra-sdk/bridge
      │         │
      │         ├─── Core Wallet ───> @hydra-sdk/core
      │         └─── WebSocket ─────> Hydra Node
      │
      └─── TX Building ────────────> @hydra-sdk/transaction
                │
                ├─── Core Utils ───> @hydra-sdk/core
                └─── Plutus Data ──> @hydra-sdk/cardano-wasm
```

---

## Build & Distribution Architecture

### Build Pipeline

```
Source (TypeScript)
      │
      ├─── tsup (bundler)
      │     ├─── ESM (.mjs)
      │     └─── CJS (.js)
      │
      └─── tsc (types)
            └─── Type Definitions (.d.ts)
```

### Package.json Exports

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",  // ESM
      "require": "./dist/index.js"   // CJS
    }
  }
}
```

### Monorepo Build Flow

```
Turborepo Pipeline
      │
      ├─── packages/cardano-wasm (first)
      │
      ├─── packages/core (depends on cardano-wasm)
      │
      ├─── packages/bridge (depends on core)
      │
      ├─── packages/transaction (depends on core)
      │
      └─── apps/* (parallel, depends on all packages)
```

---

## Error Handling Architecture

### Error Hierarchy

```
Error
  │
  ├─── CardanoError (base)
  │     ├─── WalletError
  │     ├─── TransactionError
  │     └─── NetworkError
  │
  └─── HydraError (base)
        ├─── ConnectionError
        ├─── StateError
        └─── ValidationError
```

### Error Propagation

```
Application Layer
      │
      ├─── Try/Catch
      │
SDK Layer
      │
      ├─── Throw typed errors
      │
WASM Layer
      │
      └─── Convert WASM errors to SDK errors
```

---

## Testing Architecture

### Test Structure

```
packages/*/src/
      └─── __tests__/
            ├─── unit/
            ├─── integration/
            └─── fixtures/
```

### Test Stack
- **Framework:** Vitest
- **Assertions:** Vitest built-in
- **Coverage:** V8
- **Mocking:** Vitest mock utilities

---

## Security Considerations

### Private Key Handling
- **Never stored in plain text**
- **Derived on-demand from mnemonic**
- **Cleared from memory after use**

### WASM Security
- **Trusted source:** Official Emurgo library
- **Integrity:** Package lock ensures exact version
- **Isolation:** WASM sandbox

### Network Security
- **HTTPS only** for API calls
- **WSS** for WebSocket connections
- **No credentials in logs**

---

## Performance Considerations

### Bundle Size Optimization
- **Tree-shaking:** ES modules enable tree-shaking
- **Lazy loading:** WASM loaded on demand
- **Code splitting:** Apps can import only needed packages

### WASM Performance
- **Faster serialization** than pure JS
- **Efficient crypto operations**
- **Memory-efficient** large data handling

### Caching Strategy
- **UTxO caching:** Reduce blockchain queries
- **Address caching:** Reuse derived addresses
- **Protocol params caching:** Avoid repeated fetches

---

## Deployment Architecture

### NPM Publishing
```
Changesets → Version Bump → Build → Test → Publish
```

### Documentation Deployment
```
Nuxt Generate → Static Site → Deploy to CDN
```

---

## Future Architecture Goals

1. **Plugin System:** Allow extensions without forking
2. **Multi-chain Support:** Abstract blockchain-specific code
3. **Offline Mode:** Full functionality without network
4. **Hardware Wallet:** Ledger/Trezor integration
5. **Mobile SDK:** React Native / Flutter bindings

---

**Next:** See [Development Guide](./development-guide.md) for setup instructions.
