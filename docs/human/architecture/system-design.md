# Hydra SDK System Architecture

## Overview
The Hydra SDK is designed as a modular toolkit to facilitate the integration of Cardano Hydra Heads into wallet applications. It abstracts the complexity of the Hydra protocol and the underlying Cardano serialization.

## Package Architecture

### 1. @hydra-sdk/cardano-wasm
The foundation layer. It provides a unified interface for `@emurgo/cardano-serialization-lib` regardless of the execution environment (Browser WASM, Browser asm.js, or Node.js).
- **Purpose**: Environment-agnostic WASM loading.
- **Critical Rule**: All other packages must import through this wrapper.

### 2. @hydra-sdk/core
The central logic layer. It handles the "what" of the wallet.
- **Key Responsibilities**:
    - HD Wallet management.
    - UTxO type definitions.
    - Plutus data handling (Datum, Redeemer, Policy).
    - Address derivation and key management.

### 3. @hydra-sdk/transaction
The builder layer. It handles the "how" of constructing transactions.
- **Key Responsibilities**:
    - `TxBuilder` API for fluid transaction construction.
    - Integration with `core` for UTxO and asset management.
    - Support for both Mainnet and Hydra Head transactions.

### 4. @hydra-sdk/bridge
The communication layer. It handles the "where" of the Hydra Head.
- **Key Responsibilities**:
    - WebSocket connection for real-time Hydra events.
    - REST API integration (Hexcore) for snapshots and queries.
    - Managing the Hydra Head lifecycle (Connect $\rightarrow$ Commit $\rightarrow$ Transaction $\rightarrow$ Decommit).

## Data Flow
User Request $\rightarrow$ `hydra-bridge` (Node Communication) $\rightarrow$ `hydra-transaction` (Tx Construction) $\rightarrow$ `core` (Data/Types) $\rightarrow$ `cardano-wasm` (Serialization) $\rightarrow$ Cardano Network/Hydra Node.
