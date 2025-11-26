# Hydra SDK - Source Tree Analysis

> **Generated:** 2025-11-18  
> **Scan Level:** Deep  
> **Purpose:** Annotated directory structure for AI-assisted development

## Project Root Structure

```
hydrawallet-sdk/
├── 📦 packages/              # SDK Libraries (Publishable)
├── 🌐 apps/                  # Applications (Internal)
├── 📚 docs/                  # Documentation & Artifacts
├── 🔧 scripts/               # Build & Automation
├── 🤖 sdk-ai-agent/          # AI Agent Metadata
├── ⚙️  .github/              # CI/CD Workflows
├── 🔧 .bmad/                 # BMad Method Configuration
├── 📄 package.json           # Root workspace config
├── 📄 pnpm-workspace.yaml    # pnpm workspaces
├── 📄 turbo.json             # Turborepo config
└── 📄 tsconfig.json          # Root TypeScript config
```

## SDK Packages (`packages/`)

### Core Package - `packages/core/`

**Purpose:** Core Cardano wallet functionality  
**Entry Point:** `src/index.ts`

```
packages/core/
├── src/
│   ├── index.ts                    # 🔴 Main entry point
│   │
│   ├── wallet.ts                   # AppWallet class (HD wallet)
│   ├── cardanocli-wallet.ts        # CardanoCliWallet class
│   ├── embedded.ts                 # EmbeddedWallet utilities
│   │
│   ├── constants/                  # Constants & configs
│   │   ├── network.ts              # Network IDs (mainnet/preprod/preview)
│   │   └── protocol.ts             # Protocol parameters
│   │
│   ├── types/                      # TypeScript type definitions
│   │   ├── wallet/                 # Wallet-related types
│   │   │   ├── fetcher.ts          # UTXO fetcher interfaces
│   │   │   └── submitter.ts        # TX submitter interfaces
│   │   ├── cardano/                # Cardano blockchain types
│   │   └── protocol.ts             # Protocol types
│   │
│   └── utils/                      # Utility functions
│       ├── cardano-wasm/           # WASM utilities
│       │   ├── serializer.ts       # Serialize to CBOR
│       │   ├── deserializer.ts     # Deserialize from CBOR
│       │   ├── resolver.ts         # Resolve addresses/hashes
│       │   ├── converter.ts        # Type conversions
│       │   └── build-keys.ts       # Key derivation
│       ├── cost-models.ts          # Plutus cost models
│       ├── datum.ts                # Datum utilities
│       ├── metadata.ts             # TX metadata
│       ├── parser.ts               # Parsing utilities
│       ├── policy.ts               # Policy ID helpers
│       ├── time.ts                 # Time conversion
│       ├── validator.util.ts       # Validation helpers
│       └── providers/              # Provider integrations
│
├── dist/                           # Compiled output
│   ├── index.js                    # CJS bundle
│   ├── index.mjs                   # ESM bundle
│   └── index.d.ts                  # Type definitions
│
├── package.json                    # Package metadata
├── tsconfig.json                   # TypeScript config
├── tsup.config.ts                  # Build config
└── README.md                       # Package documentation
```

**Key Exports:**
- `AppWallet`, `CardanoCliWallet`, `EmbeddedWallet`
- `NETWORK_ID`, `SUPPORTED_HANDLES`
- Utility namespaces: `Serializer`, `Deserializer`, `Resolver`, `Converter`, `BuildKeys`, `CostModels`, `TimeUtils`, `DatumUtils`, `PolicyUtils`, `ProviderUtils`, `ValidatorUtils`, `MetadataUtils`, `ParserUtils`

---

### Bridge Package - `packages/hydra-bridge/`

**Purpose:** Hydra Layer 2 integration  
**Entry Point:** `src/index.ts`

```
packages/hydra-bridge/
├── src/
│   ├── index.ts                    # 🔴 Main entry point
│   │
│   ├── bridge.ts                   # HydraBridge class
│   │
│   ├── connector/                  # Hydra node connectors
│   │   ├── websocket.ts            # WebSocket connector
│   │   └── socketio.ts             # Socket.IO connector
│   │
│   ├── constants/                  # Bridge constants
│   │   ├── events.ts               # Event names
│   │   └── states.ts               # Head states
│   │
│   ├── types/                      # TypeScript types
│   │   ├── bridge.ts               # Bridge interfaces
│   │   ├── hydra-head.ts           # Hydra Head types
│   │   └── events.ts               # Event types
│   │
│   └── utils/                      # Utility functions
│       ├── state-machine.ts        # Head state management
│       └── tx-validator.ts         # TX validation
│
├── dist/                           # Compiled output
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

**Key Exports:**
- `HydraBridge` class
- Event types and constants
- Connector utilities

**Dependencies:**
- `socket.io-client` - Real-time communication
- `mitt` - Event emitter
- `@hydra-sdk/core` - Core wallet functions

---

### Transaction Package - `packages/hydra-transaction/`

**Purpose:** Transaction builder utilities  
**Entry Point:** `src/index.ts`

```
packages/hydra-transaction/
├── src/
│   ├── index.ts                    # 🔴 Main entry point
│   │
│   ├── tx-builder/                 # Transaction builders
│   │   ├── basic-tx.ts             # Basic transfers
│   │   ├── mint-tx.ts              # Token minting
│   │   ├── script-tx.ts            # Plutus scripts
│   │   └── metadata-tx.ts          # With metadata
│   │
│   ├── types/                      # TypeScript types
│   │   ├── transaction.ts          # TX types
│   │   └── utxo.ts                 # UTXO types
│   │
│   └── utils/                      # Utility functions
│       ├── datum-builder.ts        # 🔧 Datum construction
│       ├── redeemer-builder.ts     # 🔧 Redeemer construction
│       ├── bigint.utils.ts         # BigInt handling
│       ├── coin-selection.ts       # UTXO selection
│       └── fee-calculation.ts      # Fee computation
│
├── dist/                           # Compiled output
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

**Key Exports:**
- Transaction builders
- `datumBuilder`, `buildRedeemer`, `emptyRedeemer`
- `bigIntReplacer`, `bigIntReviver`
- Coin selection algorithms

**Dependencies:**
- `json-bigint` - Large number support
- `@hydra-sdk/core` - Core utilities

---

### WASM Package - `packages/cardano-wasm/`

**Purpose:** Cardano WASM bindings wrapper  
**Entry Point:** `src/index.ts`

```
packages/cardano-wasm/
├── src/
│   ├── index.ts                    # 🔴 Re-exports WASM lib
│   └── utils/
│       └── loader.ts               # Dynamic WASM loading
│
├── dist/
├── package.json
├── tsconfig.json
└── README.md
```

**Key Exports:**
- Re-exports `@emurgo/cardano-serialization-lib-browser`
- Browser & Node.js compatible loader

---

### Config Packages

#### `packages/eslint-config/`
Shared ESLint configuration for monorepo

#### `packages/tsconfig/`
Shared TypeScript base configuration

---

## Web Applications (`apps/`)

### Documentation Site - `apps/docs/`

**Purpose:** Official documentation site (Nuxt 3)  
**Entry Point:** `app.vue`

```
apps/docs/
├── app.vue                         # 🔴 Root component
├── nuxt.config.ts                  # Nuxt configuration
│
├── content/                        # Nuxt Content (Markdown)
│   ├── index.md                    # Homepage
│   ├── 1.getting-started/          # Getting Started guides
│   ├── 2.api/                      # API reference
│   ├── 3.examples/                 # Code examples
│   ├── 4.guides/                   # How-to guides
│   ├── 5.packages/                 # Package docs
│   ├── 6.hydra-concept/            # Hydra concepts
│   └── vi/                         # Vietnamese translations
│
├── components/                     # Vue components
│   ├── content/                    # Content components
│   ├── layout/                     # Layout components
│   └── ui/                         # UI components
│
├── composables/                    # Vue composables
│   ├── useNavigation.ts
│   └── useSearch.ts
│
├── layouts/                        # Nuxt layouts
│   ├── default.vue
│   └── docs.vue
│
├── pages/                          # File-based routing
│   ├── index.vue
│   └── [...slug].vue               # Catch-all for content
│
├── public/                         # Static assets
│   ├── images/
│   └── favicon.ico
│
├── assets/                         # CSS & assets
│   └── css/
│       └── tailwind.css
│
├── i18n/                           # Internationalization
│   └── locales/
│       ├── en.json
│       └── vi.json
│
└── plugins/                        # Nuxt plugins
```

**Key Features:**
- Bilingual support (EN + VI)
- Full-text search (MiniSearch)
- Mermaid diagrams
- Code syntax highlighting (Shiki)
- Dark mode
- SEO optimized

---

### Playground - `apps/playground/`

**Purpose:** Interactive demo & testing

```
apps/playground/
├── app.vue
├── nuxt.config.ts
├── components/
├── pages/
└── public/
```

---

### Web Client - `apps/web/`

**Purpose:** Web wallet client

```
apps/web/
├── app.vue
├── nuxt.config.ts
├── components/
├── pages/
└── public/
```

---

## Documentation & Artifacts (`docs/`)

```
docs/
├── technical/                      # 📚 BMM Technical Documentation
│   ├── bmm-index.md                # Master index (you are here!)
│   ├── project-overview.md         # Project summary
│   ├── source-tree-analysis.md     # This file
│   ├── architecture-sdk.md         # Architecture design
│   ├── development-guide.md        # Dev setup
│   ├── api-reference.md            # API docs
│   └── project-scan-report.json    # Workflow state
│
├── sprint-artifacts/               # Sprint planning & tracking
│
└── bmm-workflow-status.yaml        # BMM workflow tracking
```

---

## Build & Automation (`scripts/`)

```
scripts/
├── build-docs.sh                   # Build documentation
├── extract-sdk-api.ts              # Extract API metadata
└── publish.sh                      # Publishing workflow
```

---

## AI Agent Metadata (`sdk-ai-agent/`)

```
sdk-ai-agent/
└── sdk-api-metadata.json           # 🤖 Extracted API metadata
                                    # Generated by extract-sdk-api.ts
                                    # Used by AI agents for code assistance
```

**Contents:** 1855 lines of extracted API metadata including:
- Function signatures
- Parameter types
- Return types
- Descriptions
- From all SDK packages

---

## CI/CD (`.github/`)

```
.github/
├── workflows/
│   ├── ci.yml                      # Continuous Integration
│   ├── publish.yml                 # NPM Publishing
│   └── docs-deploy.yml             # Docs deployment
│
└── README.md                       # Workflow documentation
```

---

## Configuration Files (Root)

| File | Purpose |
|------|---------|
| `package.json` | Root workspace configuration |
| `pnpm-workspace.yaml` | pnpm workspace definition |
| `turbo.json` | Turborepo pipeline configuration |
| `tsconfig.json` | Root TypeScript config with path aliases |
| `.nvmrc` | Node version specification |
| `.prettierrc` | Prettier code formatting |
| `.prettierignore` | Prettier ignore patterns |
| `.gitignore` | Git ignore patterns |
| `LICENSE.md` | Apache-2.0 license |
| `README.md` | Project README (English) |
| `README_VI.md` | Project README (Vietnamese) |
| `PUBLISH_GUIDE.md` | Publishing workflow guide |
| `CARDANO_WASM_IMPLEMENTATION.md` | WASM integration details |

---

## Critical Directories Summary

### For SDK Development
- **`packages/*/src/`** - Source code for libraries
- **`packages/*/dist/`** - Compiled output (gitignored, built by tsup)
- **`sdk-ai-agent/`** - API metadata for AI assistance

### For Documentation
- **`apps/docs/content/`** - Markdown documentation source
- **`docs/technical/`** - BMM technical documentation

### For Development
- **`scripts/`** - Build automation
- **`.github/workflows/`** - CI/CD pipelines

### For Configuration
- **Root `*.json`, `*.yaml`** - Monorepo & build configs
- **`packages/*/tsconfig.json`** - Per-package TS configs

---

## Entry Points Reference

| Package | Entry Point | Purpose |
|---------|-------------|---------|
| `@hydra-sdk/core` | `packages/core/src/index.ts` | Wallet, utils, types exports |
| `@hydra-sdk/bridge` | `packages/hydra-bridge/src/index.ts` | Bridge class, connectors |
| `@hydra-sdk/transaction` | `packages/hydra-transaction/src/index.ts` | TX builders, utilities |
| `@hydra-sdk/cardano-wasm` | `packages/cardano-wasm/src/index.ts` | WASM re-exports |
| `@hydra-sdk/docs` | `apps/docs/app.vue` | Nuxt root component |
| `@hydra-sdk/playground` | `apps/playground/app.vue` | Playground root |
| Web | `apps/web/app.vue` | Web client root |

---

**Next:** See [Architecture Documentation](./architecture-sdk.md) for design patterns and integration details.
