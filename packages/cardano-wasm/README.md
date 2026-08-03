# @hydra-sdk/cardano-wasm

The `@emurgo/cardano-serialization-lib` bindings every Hydra SDK package imports through, with the right build picked for your target.

[![npm](https://img.shields.io/npm/v/@hydra-sdk/cardano-wasm)](https://npmjs.com/package/@hydra-sdk/cardano-wasm)

## 🎮 Try it first

The [**Hydra SDK Playground**](https://playground.hydrasdk.com/transaction-builder) runs these bindings in a real browser bundle — useful as a working reference for the bundler setup below.

## 🚀 Quick Start

```bash
pnpm add @hydra-sdk/cardano-wasm
```

```typescript
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

const address = CardanoWASM.Address.from_bech32('addr1...')
const value = CardanoWASM.Value.new(CardanoWASM.BigNum.from_str('2000000'))
```

Keep this package a **direct dependency** even when you only use `@hydra-sdk/core`, `@hydra-sdk/bridge` or `@hydra-sdk/transaction` — your bundler has to see it to configure WASM handling.

## 📦 How the build is selected

Selection happens at **resolution time** through `exports` conditions, not at runtime:

| Condition | Resolves to |
| --- | --- |
| `browser` | `@emurgo/cardano-serialization-lib-browser` (WASM) |
| `node` | `@emurgo/cardano-serialization-lib-nodejs` |
| default | the browser build |

Your bundler or the Node.js resolver picks the condition — there is no environment sniffing in the package.

### asm.js fallback

For targets without WebAssembly, import the opt-in subpath:

```typescript
import { CardanoWASM } from '@hydra-sdk/cardano-wasm/asmjs'
```

It is significantly slower and much larger; use it only where WASM is genuinely unavailable.

## 🛠️ Bundler setup

WASM needs a little configuration in the browser. With Vite:

```typescript
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
  plugins: [wasm(), topLevelAwait()],
  optimizeDeps: { exclude: ['@hydra-sdk/cardano-wasm'] }
})
```

The WASM module is instantiated **asynchronously**, so never call into `CardanoWASM` at module-evaluation time — do it inside a function or after your app has started. See the [Configuration Guide](https://hydrasdk.com/getting-started/configuration) for Next.js, Webpack and Node.js setups.

## 🔨 Development

```bash
pnpm build   # emit all variants
pnpm dev     # watch mode
pnpm test
```

Build output:

- `dist/index.js` / `index.mjs` — browser build (CJS / ESM)
- `dist/index.node.js` / `index.node.mjs` — Node.js build (CJS / ESM)
- `dist/index.asmjs.js` / `index.asmjs.mjs` — asm.js fallback (CJS / ESM)
- matching `.d.ts` / `.d.mts` declarations for each

## 📚 Documentation

- [API reference](https://hydrasdk.com/api/cardano-wasm) · [Configuration](https://hydrasdk.com/getting-started/configuration)
- [Changelog](https://hydrasdk.com/resources/changelog)

## License

Apache 2.0. [Repo](https://github.com/Vtechcom/hydra-sdk) | [Issues](https://github.com/Vtechcom/hydra-sdk/issues)
