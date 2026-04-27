# Hydra SDK Project Context for AI Agents

## Overview
Hydra SDK is a TypeScript monorepo (pnpm workspaces + Turborepo) providing a toolkit for building Cardano + Hydra Layer 2 wallet applications.

## Architecture
The SDK is split into four primary packages:
1. `@hydra-sdk/transaction`: Low-level TxBuilder API.
2. `@hydra-sdk/core`: HD wallet creation, management, UTxO types, and utilities.
3. `@hydra-sdk/bridge`: Hydra Head lifecycle management (WebSocket + REST).
4. `@hydra-sdk/cardano-wasm`: Browser/Node WASM auto-detection wrapper for `@emurgo/cardano-serialization-lib`.

### Dependency Chain
`hydra-transaction` $\rightarrow$ `core` $\rightarrow$ `cardano-wasm` $\rightarrow$ `@emurgo/cardano-serialization-lib`
`hydra-bridge` $\rightarrow$ `core` $\rightarrow$ `cardano-wasm`

## Coding Standards
- **Language**: TypeScript
- **Formatting**: Prettier (single quotes, no semicolons, tabs for indentation, 120-char print width).
- **Build System**: `tsup` for ESM + CJS emission.
- **Testing**: Vitest.

## Key Rules for AI Agents
- **Imports**: Never import `@emurgo/cardano-serialization-lib` directly; always use `@hydra-sdk/cardano-wasm`.
- **Modifications**: Mimic existing code style and patterns.
- **Security**: Never expose or log secrets/keys.
- **Verification**: Run `pnpm lint` and `pnpm test` after modifications.
