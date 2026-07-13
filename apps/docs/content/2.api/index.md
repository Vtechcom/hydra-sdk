# API Reference

Welcome to the API reference section of the Hydra SDK documentation. Here you'll find detailed documentation for all SDK packages and methods.

## Overview

The Hydra SDK consists of four main packages and a comprehensive utilities collection:

1. [**@hydra-sdk/core**](/api/core) - Core wallet functionality
2. [**@hydra-sdk/bridge**](/api/bridge) - Hydra Layer 2 integration
3. [**@hydra-sdk/transaction**](/api/transaction) - Transaction building utilities
4. [**@hydra-sdk/cardano-wasm**](/api/cardano-wasm) - Cardano WASM bindings for advanced blockchain operations
5. [**Utilities**](/api/utilities) - Comprehensive collection of utility functions for Cardano development

## What's New in v1.4.0

- **RedeemerUtils**: New namespace for building Plutus script redeemers (`mkRedeemer`, `mkSpendRedeemer`, `mkMintRedeemer`, `mkUnitRedeemer`)
- **DatumUtils encoders**: Added `mkList`, `mkBool`, `mkOption`, `mkBytesList`, `mkIntList`, `mkOutputRef`, `mkAddress`, and `parseAddress`
- **ValidationUtils**: New `isValidTxOutput` helper; `isValidAddress` now lives under `AddressUtils`
- **Deserializer.deserializeAmountsFromTx**: Extract merged amounts across all transaction outputs
- **Provider Abstractions**: `ProviderUtils` now includes the Demeter provider alongside Blockfrost and Ogmios
- **Protocol v11 support**: Updated default protocol parameters and cost models
