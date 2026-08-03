# @hydra-sdk/transaction

## 1.2.2

### Patch Changes

- Updated dependencies
  - @hydra-sdk/core@1.4.2

## 1.2.1

### Patch Changes

- fix(tx-builder): allow spending a script UTxO whose script input alone funds the outputs

  `_addInputsToBuilder` unconditionally called `selectUtxosFrom`, which throws "UTxO inputs
  Insufficient" when there are no _normal_ inputs to select from. This blocked the legitimate
  pattern where a single script input already funds the transaction's outputs (common in Hydra —
  e.g. a session/state UTxO continuing to an equal-value output). Coin selection is now skipped when
  there are no normal inputs; the script data hash is already computed and, with no change output,
  nothing invalidates it.

## 1.2.0

### Minor Changes

- Fix WASM memory leak and progressive build slowdown in `TxBuilder` under high-volume workloads (e.g. spike-building thousands of transactions in Node.js).

  Every `@emurgo/cardano-serialization-lib` object lives in WASM linear memory and is only reclaimed by `.free()`. CSL's `FinalizationRegistry` auto-cleanup is non-deterministic and cannot keep up under a tight build loop, so the WASM heap grew unbounded and per-transaction build time degraded steadily. The build path now frees the WASM objects it allocates deterministically. Measured result: flat WASM memory (~0 KB/iter) and steady throughput across 10,000 builds; 280 existing tests unchanged.

  Changes:
  - Track every internally-allocated CSL object during `complete()` and free them in a `finally` block after `build_tx()` (the returned `Transaction` is an independent struct and is unaffected). Caller-supplied objects (datum/redeemer/script) are never freed.
  - `getTxBuilder()` now frees the intermediate config-builder objects it creates (the immutable config-builder chain otherwise orphaned each step). The shared `defaultCostModels` singleton is intentionally not freed.
  - Fix constructor double-allocating the underlying `TransactionBuilder` when `params` is supplied (the first one leaked on every instantiation).
  - `reset()` now frees the replaced `TransactionBuilder`, plutus scripts and change config, and recreates the metadata container (previously freed but not recreated — a latent use-after-free).
  - `changeAddress()` / `updateProtocolParams()` free the state object they replace.

- Add `dispose()` (and `[Symbol.dispose]` for `using`) to release all WASM memory held by a builder. Recommended for high-volume/spike workloads instead of relying on the GC.

- Add `completeCbor()`: builds the transaction and returns its CBOR hex, freeing the intermediate `Transaction` immediately — the leak-free path when you only need the serialized bytes. `complete()` still returns a live `Transaction`; callers are responsible for calling `.free()` on it.

- Implement stake certificates in the transaction body. `registerStake()`, `deregisterStake()` and `delegateStake()` previously staged certificates that were silently dropped at build time — they are now applied via `set_certs`, so the built transaction actually contains the certificate(s). The stake credential is resolved from the bech32 reward (stake) address; an invalid reward address now throws instead of being ignored. `PoolRegistration`/`PoolRetirement` throw a clear "not supported yet" error.

- Apply `totalCollateral()` to the built transaction via `set_total_collateral` (previously the value was stored but never written to the transaction).

- Internal cleanup: remove dead/unused code paths (`_addInputToBuilder`, `_outputAmountToValue`, and unused `_nativeScripts`/`_scriptDataHash` state), strip stray `console.log`/`console.error` debug output and commented-out blocks, and gate remaining diagnostics behind the `verbose`/`errorLogger` flags. No public API removed.

- Fix fee configuration for script transactions. The transaction builder config previously hardcoded `ex_unit_prices` to zero and `ref_script_coins_per_byte` to `15/1`, so the script-execution component of the fee (priceMem·exMem + priceStep·exSteps) was omitted and reference-script pricing ignored the protocol params. Both are now sourced from the protocol parameters (`priceMem`, `priceStep`, `minFeeRefScriptCostPerByte`), so CSL computes the full minimum fee. Non-script transfers were already correct (the linear fee is computed by `build_tx()`); this fixes under-funded script transactions.

- Add optional script execution-unit evaluation. `TxBuilder` accepts an `evaluator?: IEvaluator` (plus `txEvaluationMultiplier?` safety margin). When supplied and the transaction contains Plutus redeemers, `complete()` runs a second build pass: the draft transaction is evaluated to obtain real `exUnits`, those are written back into the redeemers (SPEND matched by input `txHash#index`, MINT by policy id), and the transaction is rebuilt so the fee is accurate. CSL cannot evaluate Plutus scripts itself, so this is opt-in — provide an evaluator backed by a provider (Blockfrost / Ogmios / Demeter) or an offline UPLC evaluator. Without an evaluator (e.g. for Hydra, which has no on-chain script evaluation), behaviour is unchanged and the placeholder exUnits are kept. The `IEvaluator`/`EvalAction`/`Budget` types mirror MeshJS for interoperability.

  Known limitations / follow-ups:
  - Only `SPEND` and `MINT` redeemers are remapped from evaluation results. `CERT` / `REWARD` / `VOTE` / `PROPOSE` budgets are returned by the evaluator but not yet written back.
  - No bundled offline evaluator yet — you must supply one (provider-backed, or a UPLC evaluator such as `@harmoniclabs/uplc`). A first-class offline evaluator is planned.
  - The rebuild runs a single extra pass; it does not iterate to a fixed point, so a safety `txEvaluationMultiplier` (e.g. `1.1`) is recommended when exact fees matter.

## 1.1.9

### Patch Changes

- Sync updated Cardano protocol parameters (v11) and cost models.
- Updated dependencies
  - @hydra-sdk/cardano-wasm@1.0.0
  - @hydra-sdk/core@1.4.1

## 1.1.8

### Patch Changes

- Updated dependencies
  - @hydra-sdk/core@1.2.0

## 1.1.7

### Patch Changes

- Release v1.1.7:
  - Implement CIP-8 message signing in EmbeddedWallet
  - Add support for Cardano Reference Inputs in TxBuilder
  - Add support for Reference Scripts in TxBuilder
  - Standardize Plutus types across packages
  - Update Ogmios provider for structured script references

- Updated dependencies
  - @hydra-sdk/core@1.1.7
  - @hydra-sdk/cardano-wasm@0.0.7

## 1.1.6

### Patch Changes

- View in github
- Updated dependencies
  - @hydra-sdk/cardano-wasm@0.0.6
  - @hydra-sdk/core@1.1.6

## 1.1.5

### Patch Changes

- Re-build v1.1.5
- Updated dependencies
  - @hydra-sdk/core@1.1.5

## 1.1.4

### Patch Changes

- Update keys utilities
- Updated dependencies
  - @hydra-sdk/core@1.1.4

## 1.1.3

### Patch Changes

- v1.1.3
- Updated dependencies
  - @hydra-sdk/core@1.1.3

## 1.1.2

### Patch Changes

- Add CardanoCliWallet function
- Updated dependencies
  - @hydra-sdk/core@1.1.2

## 1.1.1

### Patch Changes

- Support build blueprint tx with Hydra
- Updated dependencies
  - @hydra-sdk/core@1.1.1

## 1.1.0

### Minor Changes

- - Update dependencies to the latest versions and add new methods for transaction handling and UTxO querying.
  - Add providers: Blockfrost, and Ogmios.
  - Update documentation to reflect new features and changes.
  - Update examples nodejs-playground
  - Fix minor bugs and improve performance.
  - Update and group Utilities functions, remove old utilities.

### Patch Changes

- Updated dependencies
  - @hydra-sdk/core@1.1.0

## 1.0.14

### Patch Changes

- - Add mint/burn token in tx builder
  - Add DatumUtils for building Datum
  - Add PolicyUtils for minting policy script
  - Add example for mint/burn token in NodeJS playground
  - Fix some types
  - Update nodePolyfills configuration to include only buffer and disable global/process polyfills
- Updated dependencies
  - @hydra-sdk/core@1.0.14

## 1.0.13

### Patch Changes

- - Add TimeUtils to core for common time conversions and helpers.
  - Fix validity range setup in transaction to correctly handle lower/upper bounds and serialization.
- Updated dependencies
  - @hydra-sdk/core@1.0.13

## 1.0.12

### Patch Changes

- - Fix tx-builder:
    - Update descriptions
    - Fix redeemer builder: add more options, change default exUnits
    - Fix logs
    - Fix calculate script hash
- Updated dependencies
  - @hydra-sdk/core@1.0.12

## 1.0.11

### Patch Changes

- Sync version to 1.0.11
- Updated dependencies
  - @hydra-sdk/core@1.0.11

## 1.0.10

### Patch Changes

- Fix transaction builder
- Updated dependencies
  - @hydra-sdk/core@1.0.7

## 1.0.9

### Patch Changes

- Bump version
- Updated dependencies
  - @hydra-sdk/core@1.0.6

## 1.0.8

### Patch Changes

- - Update txBuilder, add redeemerBuilder, add bigint utils

## 1.0.7

### Patch Changes

- Remove unused logs

## 1.0.6

### Patch Changes

- Update tx-metadata functionality in tx-builder

## 1.0.5

### Patch Changes

- Updated dependencies
  - @hydra-sdk/cardano-wasm@0.0.5
  - @hydra-sdk/core@1.0.5

## 1.0.4

### Patch Changes

- Update configs
- Updated dependencies
  - @hydra-sdk/cardano-wasm@0.0.4
  - @hydra-sdk/core@1.0.4

## 1.0.3

### Patch Changes

- Update docs and Readme.md
- Updated dependencies
  - @hydra-sdk/core@1.0.3

## 1.0.2

### Patch Changes

- Update
- Updated dependencies
  - @hydra-sdk/core@1.0.2

## 1.0.1

### Patch Changes

- Fixed performance
- Updated dependencies
  - @hydra-sdk/core@1.0.1

## 1.0.0

### Major Changes

- Realease first major

### Patch Changes

- Updated dependencies
  - @hydra-sdk/core@1.0.0

## 0.0.5

### Patch Changes

- Add community link
- Updated dependencies
  - @hydra-sdk/core@0.0.5

## 0.0.4

### Patch Changes

- fix tx builder with multiasset with same policyId
- Updated dependencies
  - @hydra-sdk/core@0.0.4

## 0.0.3

### Patch Changes

- Add docs
- Updated dependencies
  - @hydra-sdk/cardano-wasm@0.0.3
  - @hydra-sdk/core@0.0.3

## 0.0.2

### Patch Changes

- First release
- Updated dependencies
  - @hydra-sdk/cardano-wasm@0.0.2
  - @hydra-sdk/core@0.0.2
