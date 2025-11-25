---
title: Examples
description: Real-world examples based on nodejs-playground implementations
---

# Examples

Comprehensive examples based on real implementations from `nodejs-playground/src`.

## Core Examples

### [Wallet Creation](/examples/wallet-creation)
Real patterns for wallet creation and restoration:
- Creating wallets from fresh mnemonic
- Restoring wallets from existing mnemonic
- Account management and address generation
- **Based on**: `nodejs-playground/src/index.ts` patterns

### [Transaction Building](/examples/transaction-building)  
Complete transaction building workflows:
- Simple ADA transfers with Blockfrost/Ogmios
- Token minting with metadata (from `mint-burn-token.ts`)
- Token burning operations
- Collateral management for Plutus scripts
- **Based on**: `examples/wallet-with-*.ts`, `mint-burn-token.ts`

### [Transaction Signing](/examples/transaction-signing)
Advanced signing patterns and error handling:
- Basic transaction signing (from `sign-tx.ts`)
- Multi-signature workflows
- Conditional signing with analysis
- Batch signing operations
- **Based on**: `sign-tx.ts`, real error handling patterns

### [Hydra Integration](/examples/hydra-integration)
Hydra network specific implementations:
- Hydra bridge connections with Socket.IO
- Hydra-specific transaction building
- Custom API integrations (HexcoreApi pattern)
- Real-time event handling
- **Based on**: Production Hydra integration patterns

## Advanced Examples

### [Utilities Examples](/examples/utilities-examples)
Production utility usage patterns:
- Complex datum creation (from `buildDatum` function)
- Asset unit serialization for outputs
- Provider integrations (Blockfrost/Ogmios)
- Custom API implementations
- **Based on**: All `nodejs-playground/src` utilities usage

### [Full Application Examples](/examples/full-application)
Complete application architectures:
- Node.js backend integration
- Environment configuration management
- Error handling and retry logic
- **Based on**: Real application patterns

### [React Integration](/examples/full-react-app)
React-specific implementations:
- Wallet management in React components
- Transaction state management
- Provider integration patterns
- **Updated with**: Real-world React patterns

### [Vue.js Integration](/examples/full-vuejs-app)
Vue.js ecosystem integration:
- Vue 3 Composition API patterns
- State management with Pinia
- Component lifecycle management
- **Updated with**: Production Vue patterns

## Key Features Demonstrated

### Real Implementation Patterns
- ✅ **Actual Code**: All examples use real patterns from `nodejs-playground`
- ✅ **Production Ready**: Error handling, retry logic, performance monitoring
- ✅ **Best Practices**: TypeScript types, proper imports, memory cleanup

### Provider Integrations
- **Blockfrost Provider**: `new ProviderUtils.BlockfrostProvider()`
- **Ogmios Provider**: `new ProviderUtils.OgmiosProvider()`
- **Custom APIs**: HexcoreApi, OgmiosApi implementations

### Utilities Usage
- **ParserUtils**: String/hex conversion, binary data handling
- **DatumUtils**: Complex nested datums, constructor patterns
- **PolicyUtils**: Policy script generation, asset management
- **Real Patterns**: From mint/burn operations, complex datum building

### Transaction Types
- Simple ADA transfers
- Token minting/burning with metadata
- Multi-signature transactions
- Hydra-specific transactions (zero fees)

## Getting Started

1. **Choose your integration**: React, Vue.js, or Node.js
2. **Select provider**: Blockfrost, Ogmios, or custom API  
3. **Copy real patterns**: All code is from working implementations
4. **Adapt to your needs**: Modify environment variables and endpoints

## Environment Setup

Based on real `.env` patterns:

```bash
# Blockfrost (for preprod)
BLOCKFROST_PROVIDER_API_KEY=your_blockfrost_key

# Ogmios (for RPC access) 
OGMIOS_PROVIDER_HTTP_URL=https://preprod.cardano-rpc.hydrawallet.app

# Hydra (for L2 operations)
HEXCORE_API_TOKEN=your_hexcore_token
```

All examples include proper environment variable handling as shown in playground implementations.
