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
pnpm dev:docs-v2       # Docs site (current)
pnpm dev:docs          # Docs site v1 — DEPRECATED, see below
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
  docs-v2/               # Nuxt 4 + Nuxt UI docs site (EN) — the live docs, hydrasdk.com
  docs/                  # DEPRECATED Nuxt Content docs site (EN/VI/JA) — superseded by docs-v2
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

## Documentation Rules

`apps/docs-v2` is the documentation. Write there.

- Content lives in `apps/docs-v2/content/en/**` and is **English only** — the site is not translated, so there is nothing to keep in sync.
- Release notes go in `apps/docs-v2/content/en/5.resources/1.changelog.md`, newest entry first, and the `(Latest)` marker moves to it.
- Check available API functions in `sdk-ai-agent/sdk-api-metadata.json` before adding docs.

### `apps/docs` is deprecated

The v1 site (Nuxt Content, EN/VI/JA) is superseded by `docs-v2` and is kept only for reference and for its URLs. **Do not add or update content there** — a change made in `apps/docs` will not reach readers, and mirroring an edit into both sites just creates two versions of the truth. Its old rules (keep EN/VI/JA in sync, translate guides only, glossary terms in `apps/docs/i18n/locales/*.json`, no all-caps Vietnamese titles) apply only if you are explicitly asked to touch that site.

## Code Style

Prettier config (`.prettierrc`): single quotes, no semicolons, tabs for indentation (width 1), LF line endings, 120-char print width for `.ts` files.
