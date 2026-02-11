# Time Validity Range in Hydra Head

This document describes how to test and verify transaction time validity ranges (`invalidBefore` and `invalidAfter`) within a Hydra Head using the provided Node.js SDK and a local demo environment.

## Overview

In Cardano and Hydra, transactions can specify a time interval during which they are valid. This is crucial for smart contracts and time-sensitive operations. This example demonstrates:

1.  Setting up a local "Offline" Hydra Head cluster.
2.  Synchronizing time between the client and the Head.
3.  Building a transaction with a specific validity interval.
4.  Submitting the transaction to the Head and verifying its success.

## Scenario

**Goal**: Verify that a transaction submitted to the Hydra Head is accepted only when its validity interval matches the Head's current slot.

-   **Sender**: Alice
-   **Receiver**: Bob
-   **Amount**: 1 ADA
-   **Validity Interval**:
    -   `invalidBefore`: 30 seconds into the past (relative to current Head time).
    -   `invalidAfter`: 5 minutes into the future.
-   **Expected Result**: The transaction is valid and confirmed because the current Head time falls strictly within the interval.

## Prerequisites

-   **Docker** & **Docker Compose**: To preserve the Hydra Head environment.
-   **Node.js**: To run the playground scripts.
-   **pnpm** (recommended) or **npm**: To manage dependencies.

## 1. Start the Demo Environment

The demo environment consists of a 2-node Hydra Head (Alice and Bob) running in "offline mode" (no connection to L1 required for this specific logic testing). It also includes a `startup-time-logger` service that records the cluster's start time, which is essential for calculating the correct Slot number corresponding to real-world time.

1.  Navigate to the demo directory:
    ```bash
    cd demo/key-mgmt
    ```

2.  Start the cluster:
    ```bash
    docker compose up -d
    ```

3.  **Verify Startup Time**: Ensure the `startup_time.txt` file has been generated. This file is shared between the docker container and your local filesystem (mounted volume).
    ```bash
    cat startup_time.txt
    # Output should be a timestamp, e.g., 1700000000000
    ```

## 2. Run the Test Script

The test script is located in `apps/nodejs-playground/src/key-mgmt/time-validity-range.ts`.

1.  Navigate to the playground directory:
    ```bash
    cd apps/nodejs-playground
    ```

2.  Install dependencies (if not already done):
    ```bash
    pnpm install
    ```

3.  Run the script:
    ```bash
    npx tsx src/key-mgmt/time-validity-range.ts
    ```

## How It Works

### Time Synchronization
The Hydra Head (in this offline/dev mode) uses the startup time as the zero-point for its slot counting. The script reads this timestamp to construct a `HydraSlotConfig`:

```typescript
// Read the shared startup time
const startTimeStr = readFileSync('../../demo/key-mgmt/startup_time.txt').toString()
const startTime = parseInt(startTimeStr)

// Build slot configuration based on that start time
const hydraSlotConf = TimeUtils.buildHydraSlotConfig(startTime)
```

### Building the Transaction
The `TxBuilder` allows you to set the validity interval. The `TimeUtils.unixTimeToEnclosingSlot` helper converts standard Unix timestamps (milliseconds) into the appropriate Cardano Slot number for the Head.

```typescript
const tx = await txBuilder
    // ... inputs and outputs ...
    // Transaction is invalid if submitted before 30 seconds ago (effectively valid now)
    .invalidBefore(TimeUtils.unixTimeToEnclosingSlot(Date.now() - 30 * 1000, hydraSlotConf))
    // Transaction expires 5 minutes from now
    .invalidAfter(TimeUtils.unixTimeToEnclosingSlot(Date.now() + 5 * 60 * 1000, hydraSlotConf))
    .complete()
```

### Execution
The script signs the transaction with Alice's key and submits it to Alice's Hydra node (`http://localhost:4002`).

## Expected Output

If successful, the script will output the transaction details and a result object indicating validity:

```json
>>> txValiditySuccess:result: {
  "txId": "...",
  "isValid": true,
  "isConfirmed": true,
  "result": {
    "headId": "...",
    "seq": 1129,
    "snapshot": { ... },
    "tag": "SnapshotConfirmed",
    "timestamp": "..."
  }
}
```

If the transaction was submitted outside the validity range (e.g., if you modify the script to set `invalidAfter` to the past), the `isValid` field would be `false` or the submission would fail with a validation error.
