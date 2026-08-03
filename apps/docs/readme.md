> [!WARNING]
> **Deprecated — superseded by [`apps/docs-v2`](../docs-v2).**
>
> This is the v1 documentation site (Nuxt Content, EN/VI/JA). It is no longer the
> published documentation and receives no new content. Anything written here will
> not reach readers.
>
> Write documentation in `apps/docs-v2/content/en/**` instead (`pnpm dev:docs-v2`).
> This app is kept for reference and for its existing URLs only; treat it as frozen
> unless you are deliberately working on the v1 site.

# Documentation Content Structure

This shows the complete content structure for the documentation site.

## Directory Structure

```
apps/docs/
├── components/
│   ├── content/
│   │   ├── ProseCode.vue          # Custom code block styling
│   │   ├── ProseCodeInline.vue    # Inline code styling
│   │   └── DocsNavigation.vue     # Documentation navigation
│   ├── examples/
│   │   ├── WalletExample.vue      # Interactive wallet demo
│   │   ├── HydraExample.vue       # Hydra bridge demo
│   │   └── TransactionExample.vue # Transaction builder demo
│   └── ui/
│       ├── CodeBlock.vue          # Code block component
│       ├── ApiReference.vue       # API reference component
│       └── FeatureCard.vue        # Feature showcase card
├── content/
│   ├── getting-started/
│   │   ├── index.md              # Getting started overview
│   │   ├── installation.md       # Installation guide
│   │   ├── quick-start.md        # Quick start tutorial
│   │   └── configuration.md      # Configuration guide
│   ├── api/
│   │   ├── index.md              # API overview
│   │   ├── core.md               # Core package API
│   │   ├── bridge.md             # Bridge package API
│   │   ├── transaction.md        # Transaction package API
│   │   └── cardano-wasm.md       # WASM package API
│   ├── examples/
│   │   ├── index.md              # Examples overview
│   │   ├── wallet-creation.md    # Wallet creation examples
│   │   ├── hydra-integration.md  # Hydra integration examples
│   │   ├── transaction-building.md # Transaction examples
│   │   └── full-application.md   # Complete app examples
│   ├── guides/
│   │   ├── index.md              # Guides overview
│   │   ├── building-wallet-app.md # Building wallet app guide
│   │   ├── hydra-head-management.md # Hydra head guide
│   │   ├── testing-strategies.md # Testing guide
│   │   └── deployment.md         # Deployment guide
│   └── index.md                  # Documentation home
├── layouts/
│   ├── default.vue               # Main layout (already created)
│   └── docs.vue                  # Documentation-specific layout
├── pages/
│   ├── getting-started/
│   │   └── [...slug].vue         # Dynamic getting started pages
│   ├── api/
│   │   └── [...slug].vue         # Dynamic API pages
│   ├── examples/
│   │   └── [...slug].vue         # Dynamic examples pages
│   ├── guides/
│   │   └── [...slug].vue         # Dynamic guides pages
│   └── index.vue                 # Homepage (already created)
├── assets/
│   └── css/
│       └── main.css              # Global styles
└── public/
    ├── favicon.ico
    ├── og-image.png              # Social media image
    └── images/
        └── architecture/         # Architecture diagrams
```

## Content Files to Create

### 1. Getting Started Section
- **installation.md**: Complete installation instructions for all packages
- **quick-start.md**: Step-by-step tutorial for first wallet app
- **configuration.md**: Environment variables and configuration options

### 2. API Reference Section  
- **core.md**: Complete API docs for @hydra-sdk/core
- **bridge.md**: Hydra bridge API documentation
- **transaction.md**: Transaction builder API
- **cardano-wasm.md**: WASM wrapper API

### 3. Examples Section
- **wallet-creation.md**: Various wallet creation patterns
- **hydra-integration.md**: Hydra head integration examples
- **transaction-building.md**: Transaction building examples
- **full-application.md**: Complete application examples

### 4. Guides Section
- **building-wallet-app.md**: Complete tutorial for building a wallet app
- **hydra-head-management.md**: Guide to managing Hydra heads
- **testing-strategies.md**: Testing patterns and strategies
- **deployment.md**: Deployment and production considerations

## Interactive Components

The documentation will include interactive examples that users can try directly in the browser:

- **Live Wallet Demo**: Create wallets and generate addresses
- **Hydra Bridge Simulator**: Connect to test Hydra nodes
- **Transaction Builder**: Build and visualize transactions
- **Code Playground**: Interactive code editor with SDK examples
