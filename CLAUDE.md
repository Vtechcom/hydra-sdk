# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Hydra SDK is a TypeScript monorepo (pnpm workspaces + Turborepo) providing a toolkit for building Cardano + Hydra Layer 2 wallet applications. It wraps `@emurgo/cardano-serialization-lib` WASM bindings and the Hydra Head protocol.

## Commands

```bash
# Install dependencies
pnpm install

# Build all SDK packages
pnpm build:packages

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Lint
pnpm lint

# Format
pnpm format

# Dev servers
pnpm dev:playground    # Nuxt playground app
pnpm dev:docs          # Docs site
pnpm dev:nodejs        # Node.js playground
```

To run a single test file:
```bash
pnpm vitest run packages/core/tests/some.test.ts
```

To run tests for a specific package:
```bash
pnpm vitest run --project packages/core
```

## Package Architecture

```
packages/
  core/                  # @hydra-sdk/core — HD wallet creation/management, UTxO types, utilities
  hydra-bridge/          # @hydra-sdk/bridge — Hydra Head lifecycle (WebSocket + REST)
  hydra-transaction/     # @hydra-sdk/transaction — Low-level TxBuilder API
  cardano-wasm/          # @hydra-sdk/cardano-wasm — Browser/Node WASM auto-detection wrapper
  eslint-config/         # Shared ESLint config
  tsconfig/              # Shared TypeScript config
apps/
  playground/            # Nuxt 3 + Vue 3 interactive demo
  nodejs-playground/     # Node.js integration tests (Jest)
  docs/                  # Nuxt Content docs site (EN/VI/JA)
```

### Dependency chain

`hydra-transaction` → `core` → `cardano-wasm` → `@emurgo/cardano-serialization-lib`
`hydra-bridge` → `core` → `cardano-wasm`

### `@hydra-sdk/core`

Entry: `packages/core/src/index.ts`

Exports three wallet classes (`AppWallet`, `EmbeddedWallet`, `CardanoCLIWallet`) plus namespaced utilities:
- **Serializer/Deserializer/Converter/BuildKeys/Resolver** — thin wrappers around `cardano-wasm`
- **DatumUtils, PolicyUtils, PlutusUtils** — Plutus/CBOR data handling
- **AddressUtils, KeysUtils** — address derivation and key management
- **MetadataUtils, ValidatorUtils, ParserUtils, TimeUtils, ProviderUtils** — misc helpers

### `@hydra-sdk/bridge`

Entry: `packages/hydra-bridge/src/index.ts`

`HydraBridge` class manages the full Hydra Head lifecycle. It connects via:
- `WebSocketConnector` — real-time Hydra node events
- `HexcoreConnector` — REST API for snapshot/UTxO queries

### `@hydra-sdk/cardano-wasm`

Selects the correct build of `@emurgo/cardano-serialization-lib` via package.json `exports` conditions: the `browser` condition resolves the browser WASM build and the `node` condition resolves the Node.js build (chosen by the consumer's bundler/runtime, not at runtime). The browser asm.js fallback build is opt-in via the `@hydra-sdk/cardano-wasm/asmjs` subpath. All other packages import through this package — never import `@emurgo/cardano-serialization-lib` directly.

### Build system

Each SDK package uses `tsup` to emit ESM + CJS. `turbo run build` respects the `^build` dependency so packages build in order. Test aliases in `vitest.config.ts` point directly to `src/` to skip the build step during testing.

## Documentation Rules (from `.github/copilot-instructions.md`)

- Keep English (`docs/content/**/**.md`), Vietnamese (`docs/content/vi/**/**.md`), and Japanese (`docs/content/ja/**/**.md`) docs in sync.
- Translate guides/tutorials only; keep code, variables, keywords, and glossary terms (`migration`, `wasm`, `utilities`, `Hydra Head`, `UTxO`, `Plutus`, `CBOR`) in English.
- Glossary terms live in `apps/docs/i18n/locales/en.json`, `vi.json`, `ja.json`. Add new terms to all three files.
- Check available API functions in `sdk-ai-agent/sdk-api-metadata.json` before adding docs.
- Do not capitalize all words in Vietnamese titles.

## Code Style

Prettier config (`.prettierrc`): single quotes, no semicolons, tabs for indentation (width 1), LF line endings, 120-char print width for `.ts` files.
