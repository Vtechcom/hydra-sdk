# Hydra SDK — Install Guide for AI Agents

This file is a concise, unambiguous install + setup guide for AI coding assistants
integrating **Hydra SDK** (Cardano + Hydra Layer 2) into a project. Follow the rules
exactly; they encode non-obvious requirements that break builds when missed.

## Rules (read first)

1. **Always install `@hydra-sdk/cardano-wasm`** alongside any other `@hydra-sdk/*`
   package. It is the WASM core every package imports through and must be a **direct
   dependency** so the bundler can configure it. Do not rely on it being transitive.
2. **Never import `@emurgo/cardano-serialization-lib` directly.** Import Cardano
   primitives through `@hydra-sdk/cardano-wasm` (or the re-exports in `@hydra-sdk/core`).
3. **`NETWORK_ID` is a `Record<Network, number>`, not an enum.** Keys are
   `'MAINNET' | 'PREPROD' | 'PREVIEW'` — there is **no `TESTNET`**.
   Values: `{ MAINNET: 1, PREPROD: 0, PREVIEW: 0 }`.
4. **Browser bundlers need WASM config** (Vite: `vite-plugin-wasm` +
   `vite-plugin-top-level-await` + a `buffer` polyfill, and exclude
   `@hydra-sdk/cardano-wasm` from `optimizeDeps`). See "Bundler setup" below.
5. **Node.js ≥ 18.20.0.** Package manager: npm, pnpm, or yarn.

## Packages

| Package | Install | Use for |
| --- | --- | --- |
| `@hydra-sdk/core` | `@hydra-sdk/core` | HD wallets, signing, addresses, UTxO types, utilities |
| `@hydra-sdk/bridge` | `@hydra-sdk/bridge` | Hydra Head lifecycle over WebSocket + REST |
| `@hydra-sdk/transaction` | `@hydra-sdk/transaction` | Low-level `TxBuilder` (Layer 1 + Hydra) |
| `@hydra-sdk/cardano-wasm` | `@hydra-sdk/cardano-wasm` | WASM bindings — **always install** |

## Install

Install the packages you need, always including `@hydra-sdk/cardano-wasm`:

```bash
# Wallet + WASM (minimum)
npm install @hydra-sdk/core @hydra-sdk/cardano-wasm

# Full stack (wallet + Hydra + tx building)
npm install @hydra-sdk/core @hydra-sdk/bridge @hydra-sdk/transaction @hydra-sdk/cardano-wasm
```

`pnpm add` / `yarn add` work the same way.

## Bundler setup (browser)

Node.js needs no extra config. For browser builds:

### Vite (React or Vue)

```bash
npm install -D vite-plugin-wasm vite-plugin-top-level-await vite-plugin-node-polyfills
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
// import react from '@vitejs/plugin-react'   // or: import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    // react(), // or vue(),
    wasm(),
    topLevelAwait(),
    nodePolyfills({
      include: ['buffer'],
      globals: { Buffer: true, global: false, process: false }
    })
  ],
  optimizeDeps: {
    exclude: ['@hydra-sdk/cardano-wasm']
  }
})
```

For **Nuxt 3** and **Next.js**, see the framework-specific config in the docs:
https://hydrasdk.com/getting-started/configuration

## Minimal example — create a wallet

```ts
import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'

const wallet = new AppWallet({
  networkId: NETWORK_ID.PREPROD,           // Record, not enum (see Rule 3)
  key: { type: 'mnemonic', words: AppWallet.brew() } // brew() generates a new mnemonic
})

const account = wallet.getAccount(0, 0)
console.log('Address:', account.baseAddressBech32)
```

## Build a transaction

```ts
import { TxBuilder } from '@hydra-sdk/transaction'

const tx = await new TxBuilder()
  .txOut('addr_test1...', [{ unit: 'lovelace', quantity: '1000000' }])
  .changeAddress('addr_test1...')
  .complete()

const signedCbor = await wallet.signTx(tx.to_hex())
```

## Connect to a Hydra Head

```ts
import { HydraBridge } from '@hydra-sdk/bridge'

const bridge = new HydraBridge({ url: 'ws://localhost:4001', autoReconnect: true })
bridge.events.on('onConnected', () => bridge.commands.init())
bridge.events.on('onMessage', (payload) => {
  if (payload.tag === 'HeadIsOpen') {
    const balance = bridge.getAddressBalance('addr_test1...') // O(1), in-memory cache
    console.log('ADA:', balance?.get('lovelace'))
  }
})
bridge.connect()
```

**hydra-node compatibility:** `@hydra-sdk/bridge` supports `hydra-node` **v1.3.0 through
the stable V2 line** (latest `2.2.0`). V1 uses the commit-based lifecycle; V2 is
commit-less with incremental `deposit`s. See
https://hydrasdk.com/concepts/hydra-v2-changes

## Deeper context for AI agents

- **Full docs:** https://hydrasdk.com
- **MCP server:** `https://hydrasdk.com/mcp` (streamable HTTP) — tools `list-pages`
  and `get-page` let you query the docs directly. See https://hydrasdk.com/ai
- **llms.txt:** https://hydrasdk.com/llms.txt (index) ·
  https://hydrasdk.com/llms-full.txt (full)
- **Raw markdown of any page:** append `.md` under `/raw/`, e.g.
  `https://hydrasdk.com/raw/getting-started/installation.md`
- **Machine-readable API metadata:** [`sdk-ai-agent/sdk-api-metadata-v2.json`](sdk-ai-agent/sdk-api-metadata-v2.json)
  (per-file symbols, signatures, and docs across all packages).
