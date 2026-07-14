---
title: Guides
description: Step-by-step guides and best practices for building wallet apps with Hydra SDK
---

# Guides

Welcome to the guides section of the Hydra SDK documentation. Here you'll find step-by-step tutorials and best practices for building Cardano wallet applications with Hydra Layer 2 integration.

## Overview

The guides are organized into several categories:

1. **[Building Wallet Apps](/guides/building-wallet-app)** - Creating and managing Cardano wallets
2. **[Working with Utilities](/guides/working-with-utilities)** - Using SDK utility functions effectively
3. **[Minting and Burning Tokens](/guides/mint-burn-tokens)** - Native token operations
4. **Hydra Head Management** - Connecting to Hydra Layer 2 and managing Hydra Heads
5. **Testing Strategies** - Testing your applications

## What's New in v1.4.0

- **RedeemerUtils** - New namespace for building script redeemers (`mkRedeemer`, `mkSpendRedeemer`, `mkMintRedeemer`, `mkUnitRedeemer`)
- **New DatumUtils encoders** - `mkList`, `mkBool`, `mkOption`, `mkBytesList`, `mkIntList`, `mkOutputRef`, `mkAddress`, `parseAddress`
- **ValidationUtils & AddressUtils** - `ValidationUtils.isValidTxOutput`, plus relocated `AddressUtils.isValidAddress` and `getPubkeyHashFromAddress`
- **Deserializer.deserializeAmountsFromTx** - Read merged output amounts from a transaction; includes a Resolver memory-leak fix and protocol v11 defaults

> See also: [Getting Started](/getting-started/), [API](/api/), [Examples](/examples/)
