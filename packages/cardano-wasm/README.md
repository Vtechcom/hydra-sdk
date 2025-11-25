# @hydra-sdk/cardano-wasm

Cardano WASM bindings: Auto browser/node detection. **See [docs/master-index.md](../docs/master-index.md)**.

## Features

- **Automatic Environment Detection**: Automatically uses the browser version (`@emurgo/cardano-serialization-lib-browser`) when bundled for browsers and the Node.js version (`@emurgo/cardano-serialization-lib-nodejs`) when run in Node.js environments.
- **TypeScript Support**: Full TypeScript support with proper type definitions for both environments.
- **Multiple Module Formats**: Supports both CommonJS and ES modules.

## Installation

```bash
npm install @hydra-sdk/cardano-wasm
# or
pnpm add @hydra-sdk/cardano-wasm
```

## Usage

```typescript
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

// CardanoWASM will automatically be the browser or Node.js version
// depending on your environment
const address = CardanoWASM.Address.from_bech32('addr1...')
```

## How it Works

This package uses Node.js conditional exports to provide different entry points:

- **Browser environments**: Uses `@emurgo/cardano-serialization-lib-browser`
- **Node.js environments**: Uses `@emurgo/cardano-serialization-lib-nodejs`
- **Default fallback**: Uses the browser version

The selection happens automatically based on your bundler's environment detection or Node.js's module resolution.

## Development

```bash
# Build the package
pnpm build

# Run tests
pnpm test

# Development with watch mode
pnpm dev
```

## Build Output

The build process generates multiple files:

- `dist/index.js` / `dist/index.mjs` - Browser version (CommonJS/ESM)
- `dist/index.node.js` / `dist/index.node.mjs` - Node.js version (CommonJS/ESM)
- `dist/index.d.ts` / `dist/index.node.d.ts` - TypeScript declarations

## Docs
[hydrasdk.com/docs](https://hydrasdk.com/docs) | [Technical](../docs/technical/bmm-index.md)

Apache 2.0. [Repo](https://github.com/Vtechcom/hydra-sdk)
