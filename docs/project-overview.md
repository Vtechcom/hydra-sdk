# Hydra SDK - Project Overview

> **Generated:** 2025-11-18  
> **Version:** 1.1.3  
> **Type:** Monorepo SDK + Documentation Site

## Executive Summary

**Hydra SDK** là bộ công cụ hoàn chỉnh để xây dựng ứng dụng Cardano wallet với Hydra Layer 2 support. Project được tổ chức dưới dạng monorepo với TypeScript libraries và web applications.

## Project Structure

- **Repository Type:** Monorepo (pnpm workspaces + Turborepo)
- **Total Packages:** 6 SDK libraries + 3 web applications
- **Primary Language:** TypeScript 5.x
- **License:** Apache-2.0

## Core SDK Libraries

### 1. @hydra-sdk/core
**Path:** `packages/core/`  
**Purpose:** Core Cardano wallet functionality

**Key Features:**
- HD Wallet creation & restoration
- Mnemonic (BIP39) support
- Address generation
- UTXO management
- Transaction building utilities

**Main Classes:**
- `AppWallet` - Main wallet class
- `CardanoCliWallet` - CLI wallet integration
- `EmbeddedWallet` - Embedded wallet utilities

**Utilities:**
- Serializer/Deserializer (WASM)
- Converter, Resolver, BuildKeys
- CostModels, Time, Datum, Policy
- Provider, Validator, Metadata, Parser

### 2. @hydra-sdk/bridge
**Path:** `packages/hydra-bridge/`  
**Purpose:** Hydra Layer 2 integration

**Key Features:**
- Hydra Head lifecycle management
- Real-time transaction monitoring (WebSocket)
- Socket.IO integration
- Event-driven architecture (mitt)

**Main Classes:**
- `HydraBridge` - Main bridge class
- Connectors for Hydra node communication

### 3. @hydra-sdk/transaction
**Path:** `packages/hydra-transaction/`  
**Purpose:** Transaction builder utilities

**Key Features:**
- Transaction construction
- Datum builder
- Redeemer builder
- BigInt handling for large numbers
- Plutus script utilities

### 4. @hydra-sdk/cardano-wasm
**Path:** `packages/cardano-wasm/`  
**Purpose:** Cardano WASM bindings

**Key Features:**
- Wraps `@emurgo/cardano-serialization-lib-browser`
- Browser & Node.js compatible
- Type-safe WASM interfaces

### 5. @hydra-sdk/eslint-config
**Path:** `packages/eslint-config/`  
**Purpose:** Shared ESLint configuration

### 6. @hydra-sdk/tsconfig
**Path:** `packages/tsconfig/`  
**Purpose:** Shared TypeScript configuration

## Web Applications

### 1. @hydra-sdk/docs
**Path:** `apps/docs/`  
**Technology:** Nuxt 3 + Nuxt Content

**Purpose:** Official documentation site với bilingual support (EN + VI)

**Features:**
- SSR/SSG documentation
- Interactive code examples
- Mermaid diagrams
- Full-text search
- Dark mode support
- Responsive design (TailwindCSS)

### 2. @hydra-sdk/playground
**Path:** `apps/playground/`  
**Purpose:** Interactive demo & testing playground

### 3. Web Client
**Path:** `apps/web/`  
**Purpose:** Web wallet client application

## Technology Stack

### Build System
- **Package Manager:** pnpm
- **Monorepo Tool:** Turborepo
- **Bundler:** tsup (for libraries)
- **Version Management:** Changesets

### SDK Development
- **Language:** TypeScript 5.x
- **Testing:** Vitest
- **Code Quality:** ESLint + Prettier
- **Type Checking:** tsc

### Web Development
- **Framework:** Nuxt 3 (3.18.1)
- **UI Library:** @nuxt/ui + TailwindCSS
- **Content:** @nuxt/content
- **Internationalization:** @nuxtjs/i18n
- **Vue:** 3.5.16

### Key Dependencies
- `bip39` - Mnemonic generation
- `axios` - HTTP client
- `socket.io-client` - Real-time communication
- `json-bigint` - Large number handling
- `@scure/base` - Encoding utilities

## Architecture Pattern

### SDK Libraries
- **Pattern:** Module-based exports
- **Distribution:** Dual ESM + CJS
- **Type Safety:** Full TypeScript with .d.ts
- **Tree-shakeable:** ES modules support

### Web Applications
- **Pattern:** Server-Side Rendered (SSR) / Static Site Generated (SSG)
- **Routing:** File-based (Nuxt)
- **State Management:** Composables + Pinia (if needed)
- **API Layer:** Nuxt server routes

## Repository Organization

```
hydra-sdk/
├── packages/          # SDK libraries (publishable)
│   ├── core/
│   ├── bridge/
│   ├── transaction/
│   ├── cardano-wasm/
│   ├── eslint-config/
│   └── tsconfig/
├── apps/              # Applications (not published)
│   ├── docs/         # Documentation site
│   ├── playground/   # Interactive demo
│   └── web/          # Web client
├── docs/              # Project documentation
│   ├── technical/    # Technical docs (BMM)
│   └── sprint-artifacts/
├── scripts/           # Build & automation scripts
└── sdk-ai-agent/     # AI agent metadata
```

## Distribution

### NPM Packages
All SDK libraries are published to npm under `@hydra-sdk/*` scope:

- `@hydra-sdk/core`
- `@hydra-sdk/bridge`
- `@hydra-sdk/transaction`
- `@hydra-sdk/cardano-wasm`

### Package Registry
- **Registry:** npm (public)
- **Access:** Public
- **Homepage:** https://hydrasdk.com

## Development Workflow

### Install Dependencies
```bash
pnpm install
```

### Development Mode
```bash
pnpm dev:docs        # Run docs site
pnpm dev:playground  # Run playground
pnpm dev:web        # Run web client
```

### Build
```bash
pnpm build:packages  # Build all SDK packages
pnpm build:web       # Build web client
```

### Testing
```bash
pnpm test:ci         # Run all tests
```

### Linting
```bash
pnpm lint            # Lint all packages
pnpm format          # Format code
```

## Key Documentation

### Existing Documentation
- **Root README:** Comprehensive getting started guide (EN + VI)
- **Package READMEs:** Per-package documentation
- **PUBLISH_GUIDE.md:** Publishing workflow
- **CARDANO_WASM_IMPLEMENTATION.md:** WASM integration details
- **apps/docs/content/:** Full documentation site content
- **sdk-ai-agent/sdk-api-metadata.json:** Extracted API metadata

### Generated Documentation (This Suite)
- **bmm-index.md:** Master navigation
- **project-overview.md:** This file
- **source-tree-analysis.md:** Directory structure details
- **architecture-sdk.md:** SDK architecture design
- **development-guide.md:** Development setup & workflows
- **api-reference.md:** API documentation from metadata

## Project Goals

1. **Comprehensive SDK:** Provide complete toolkit for Cardano wallet development
2. **Hydra Layer 2:** Enable fast, scalable transactions via Hydra
3. **Developer Experience:** Type-safe, well-documented, easy to use
4. **Cross-Platform:** Browser + Node.js support
5. **Open Source:** Community-driven with Apache-2.0 license

## Target Audience

- **dApp Developers:** Building Cardano applications
- **Wallet Developers:** Creating custom wallet solutions
- **Layer 2 Enthusiasts:** Exploring Hydra scaling
- **Blockchain Learners:** Understanding Cardano development

## Links

- **Homepage:** https://hydrasdk.com
- **Repository:** https://github.com/Vtechcom/hydra-sdk
- **NPM:** https://npmjs.com/org/hydra-sdk
- **Documentation:** https://hydrasdk.com/docs

---

**Next:** See [Architecture Documentation](./architecture-sdk.md) for design details.
