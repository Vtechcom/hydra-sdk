# Hydra SDK Documentation v1.1.0

Welcome to the comprehensive documentation for Hydra SDK - a complete toolkit for building Cardano wallet applications with Hydra Layer 2 integration.

## What is Hydra SDK?

Hydra SDK is a comprehensive software development kit that provides essential libraries and tools to integrate Cardano wallet functionality and Hydra Head management into your applications. Built on a monorepo architecture using Turborepo, it offers a modular, extensible approach to Cardano development.

**Latest Release: v1.1.0** - Enhanced with powerful utility functions and improved developer experience.

## Key Features

- **🏦 Cardano Wallet Management**: Complete HD wallet support with account/address derivation
- **⚡ Hydra Layer 2 Integration**: Full Hydra Head lifecycle management and real-time processing
- **🔧 Transaction Builder**: Advanced transaction building with Hydra support
- **🌐 Real-time Events**: WebSocket and Socket.IO support for live updates
- **📦 Modular Architecture**: Package-based architecture for easy customization
- **🔒 TypeScript First**: Comprehensive type definitions and type safety
- **🛠️ Powerful Utilities**: Rich collection of utility functions for Cardano development
- **📊 Data Conversion**: Advanced serialization, deserialization, and data parsing utilities

## Quick Start

Get started with Hydra SDK in minutes:

```bash
# Install core packages
npm install @hydra-sdk/core @hydra-sdk/bridge @hydra-sdk/transaction

# Create a simple wallet with utilities
import { 
  AppWallet, 
  NETWORK_ID, 
  ParserUtils, 
  TimeUtils, 
  DatumUtils 
} from '@hydra-sdk/core'

const wallet = new AppWallet({
  networkId: NETWORK_ID.PREPROD,
  key: { type: 'mnemonic', words: AppWallet.brew() }
})

const account = wallet.getAccount(0, 0)
console.log('Address:', account.baseAddressBech32)

// Use utilities for common tasks
const currentSlot = TimeUtils.resolveSlotNo('preprod')
const datum = DatumUtils.mkInt(42)
const hexData = ParserUtils.stringToHex('Hello Hydra SDK v1.1.0!')

console.log('Current slot:', currentSlot)
console.log('Datum hex:', datum.to_hex())
console.log('Message as hex:', hexData)
```

## Core Packages

### [@hydra-sdk/core](/api/core)
Core Cardano wallet functionality including HD wallet support, transaction signing, and network integration.

### [@hydra-sdk/bridge](/api/bridge)
Hydra Layer 2 integration with complete Head lifecycle management, real-time events, and transaction processing.

### [@hydra-sdk/transaction](/api/transaction)
Advanced transaction building utilities with Hydra support, UTxO management, and fee optimization.

### [@hydra-sdk/cardano-wasm](/api/cardano-wasm)
Cardano WASM bindings for browser applications with serialization and cryptographic operations.

## Architecture Overview

```mermaid
graph TD
    A[Your Application] --> B[@hydra-sdk/core]
    A --> C[@hydra-sdk/bridge]
    A --> D[@hydra-sdk/transaction]
    
    B --> E[@hydra-sdk/cardano-wasm]
    C --> B
    C --> E
    D --> B
    D --> E
    
    E --> F[Cardano Serialization Lib]
    C --> G[Socket.IO Client]
    
    H[Hydra Node] -.-> C
    I[Cardano Network] -.-> B
```

## Use Cases

### DApp Development
Build decentralized applications with seamless Cardano wallet integration and Hydra Layer 2 scaling.

### Wallet Applications
Create full-featured wallet applications with HD wallet support, transaction management, and real-time updates.

### Payment Solutions
Implement fast, low-cost payment solutions using Hydra Heads for instant transactions.

### DeFi Protocols
Integrate with DeFi protocols using advanced transaction building and real-time state management.

## Getting Started

Ready to start building? Check out our guides:

- [Installation Guide](/getting-started/installation) - Set up your development environment
- [Quick Start Tutorial](/getting-started/quick-start) - Build your first application
- [Configuration Guide](/getting-started/configuration) - Configure your project

## Examples

Explore practical examples:

- [Wallet Creation](/examples/wallet-creation) - Create and manage wallets
- [Hydra Integration](/examples/hydra-integration) - Connect to Hydra Heads
- [Transaction Building](/examples/transaction-building) - Build and submit transactions
- [Full Application](/examples/full-application) - Complete application examples

## Community & Support

- **GitHub**: [hydra-sdk](https://github.com/Vtechcom/hydra-sdk)
- **Documentation**: [hydra-sdk.dev](https://hydra-sdk.dev)
- **Issues**: [Report bugs and request features](https://github.com/Vtechcom/hydra-sdk/issues)
- **Discussions**: [Community discussions](https://github.com/Vtechcom/hydra-sdk/discussions)

## License

Hydra SDK is open source software licensed under the [MIT License](https://github.com/Vtechcom/hydra-sdk/blob/dev/LICENSE).
