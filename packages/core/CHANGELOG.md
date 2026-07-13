# @hydra-sdk/core

## 1.4.0

### Minor Changes

#### Protocol parameters upgraded to v11 (`constants/protocol-parameters.ts`)

- **`DEFAULT_PROTOCOL_PARAMETERS.minPoolCost`** lowered from `340000000` (340 ADA) to `170000000` (170 ADA), matching the Cardano v11 protocol parameter update. All other default parameters are unchanged.

#### Cost models synced with the v11 on-chain cost models (`constants/cost-models.ts`)

- **`DEFAULT_V1_COST_MODEL_LIST`** and **`DEFAULT_V2_COST_MODEL_LIST`** extended with the additional Plutus builtin cost entries introduced in the current on-chain cost models — the lists now cover the full set of operations expected by protocol v11 evaluators (previously they stopped short of the newer builtins).
- **`DEFAULT_V3_COST_MODEL_LIST`** coefficients updated to the v11 values (e.g. the `byteStringToInteger` group `1716, 549, 57` → `1716, 960, 57`, and the `24548, 29498, 38` group → `30623, 28755, 75`).

> These are the default cost models used when a provider does not supply its own. Consumers building or evaluating Plutus transactions offline are now costed against the v11 parameters. Applications that pin their own protocol parameters / cost models are unaffected.

#### `deserializer.ts` — New `deserializeAmountsFromTx` helper

- **`Deserializer.deserializeAmountsFromTx(cborHex)`** (new): decodes a transaction CBOR and returns every amount (lovelace + native tokens) across **all** outputs, merged by `unit` with quantities summed. `'lovelace'` is always present unless the transaction has zero outputs. Returns `Asset[]` (`{ unit, quantity }`), so it plugs directly into the existing asset helpers such as `mergeAssets`.

  ```ts
  const amounts = Deserializer.deserializeAmountsFromTx(txCborHex)
  // [{ unit: 'lovelace', quantity: '2000000' }, { unit: '<policy><assetName>', quantity: '5' }]
  ```

#### `DatumUtils` — New Plutus-data encoders

- **`mkBool`** — encode an Aiken `Bool` (`False = Constr(0, [])`, `True = Constr(1, [])`).
- **`mkOption`** — encode an `Option`/`Maybe` (`Some = Constr(0, [v])`, `None = Constr(1, [])`).
- **`mkBytesList`** / **`mkIntList`** — encode `List<ByteArray>` / `List<Int>` (accepting hex strings or raw bytes, and `string | number | bigint` respectively).
- **`mkOutputRef`** — encode a Plutus `OutputReference` (`Constr(0, [Bytes(txHash), Int(index)])`).
- **`mkAddress`** / **`parseAddress`** — convert a bech32 address to/from Plutus `Address` data. Handles key & script credentials and enterprise (no-stake) addresses; `parseAddress` rebuilds a bech32 address for a given network id.

#### `RedeemerUtils` — New namespace

- **`RedeemerUtils.mkRedeemer(data, options?)`** (new): wraps any `PlutusData` (e.g. built with `DatumUtils`) into a `Redeemer` with configurable `tag` / `index` / `exUnits`, ready to attach to the `@hydra-sdk/transaction` TxBuilder. Convenience helpers **`mkSpendRedeemer`**, **`mkMintRedeemer`**, **`mkUnitRedeemer`**, plus low-level **`mkRedeemerTag`**, **`mkExUnits`** and **`DEFAULT_EX_UNITS`** are included.

#### Address validation reorganised out of `validator.util`

- **`AddressUtils.isValidAddress`** and new **`ValidationUtils.isValidTxOutput`** now hold these validation helpers, which previously lived in `validator.util` — a name easily confused with Plutus **validator scripts** (`plutus-script.util`).
- **`ValidatorUtils`** is retained as a **deprecated** re-export for backward compatibility, so existing `ValidatorUtils.isValidAddress` / `ValidatorUtils.isValidTxOutput` calls keep working.

### Patch Changes

#### `resolver.ts` — Fix WASM memory leak in `resolveTxHash`

- **`Resolver.resolveTxHash`** now calls `.free()` on the intermediate `FixedTransaction` WASM object before returning. Previously the object was left un-freed on every call, leaking WASM heap memory in long-running processes that hash many transactions (surfaced by the new memory-leak test suite).

## 1.3.2

### Patch Changes

#### `metadata.ts` — Validation & logic fixes for `metadataObjToMetadatum`

- **String byte-length validation**: strings are now measured in UTF-8 bytes (via `ParserUtils.stringToHex`) before being passed to WASM. Throws a descriptive error when the encoded length exceeds the Cardano limit of 64 bytes, including the actual byte count and a preview of the offending value. Previously, oversized strings were silently forwarded to WASM and produced an opaque low-level error.
- **Bytes length validation**: `Uint8Array` values are now checked against the 64-byte limit. Throws with the actual size when exceeded.
- **Float number guard**: `number` values are checked with `Number.isInteger()` before conversion. Non-integer floats (e.g. `1.5`) previously caused an obscure WASM panic; they now throw a clear error.
- **`Map` branch separated**: `instanceof Map` is now handled in its own `else if` branch before the generic `typeof === 'object'` fallback. Previously it was a nested `if` inside the object branch — calling `Object.entries()` on a `Map` returns an empty array, so this was a silent data-loss bug when an empty `Map` happened to be passed. The logic is now unambiguous.

#### `providers/` — New `DemeterProvider`

- **`DemeterProvider`** (new): Blockfrost-compatible provider for [Demeter](https://demeter.run) hosted endpoints. Extends `BlockfrostProvider` and builds the authenticated endpoint URL automatically from the `authToken` and `network` fields:
  ```
  https://{authToken}.cardano-{network}.blockfrost-m1.demeter.run/api/v{version}
  ```
  All fetching, submission, and caching behaviour is inherited from `BlockfrostProvider` with no duplication.

  ```ts
  const provider = new DemeterProvider({
    authToken: 'blockfrost102lx3ckhzvkjjh7677g',
    network: 'mainnet', // 'mainnet' | 'preprod' | 'preview'
  })
  ```

- **`BlockfrostProviderConfig.baseURL`** (new optional field): allows callers to override the default Blockfrost endpoint URL. Used internally by `DemeterProvider`; also available for custom Blockfrost-compatible deployments.

#### `datum.ts` — New `mkList` helper

- **`mkList(elements)`** (new): constructs a `PlutusData` list from an array of `PlutusData` elements. Completes the datum builder API alongside the existing `mkInt`, `mkBytes`, `mkConstr`, and `mkMap`.

  ```ts
  mkList([mkInt(1n), mkBytes('deadbeef'), mkConstr(0, [])])
  ```

#### `index.ts` — New `AddressUtils` export

- **`AddressUtils`** is now exported from `@hydra-sdk/core`. Previously the address utilities were accessible only via direct file import.

### New Exports

- `DemeterProvider` — from `@hydra-sdk/core`
- `DemeterProviderConfig` — TypeScript config interface for `DemeterProvider`
- `AddressUtils` — address utility namespace, now re-exported from the package root
- `DatumUtils.mkList` — new datum builder helper

## 1.3.0

### Minor Changes

- ## @hydra-sdk/bridge v1.3.0
  - **In-memory snapshot cache**: O(1) `getAddressBalance()` and `queryAddressUTxO()` via two-level Map cache rebuilt once per `SnapshotConfirmed`/`Greetings`
  - **`submitTx` callback API**: fire-and-forget submission with Node.js error-first callback pattern
  - **Auto-reconnect**: `autoReconnect`, `reconnectInterval`, `maxReconnectAttempts` options
  - **WebSocket best practices**: `per-message deflate` disabled, ping interval tuned
  - **`awaitHydraMessage` utility**: single-cleanup Promise wrapper eliminating manual listener/timer teardown
  - **Hydra node v0.20+ compatibility**: `slotZeroTimestamp`, `lastSnapshotNumber`, `Greetings.currentSlot`
  - Bug fixes: duplicate `TxValid` events, stale listener leak on timeout, `decommit` cleanup

  ## @hydra-sdk/core v1.3.0
  - **`convertUTxOObjectToUTxOWithOptions`**: bounded datum deserialization cache (`maxDatumCacheSize`, LRU eviction)
  - **Converter performance**: `for` loops replace `reduce`/`filter` chains; no intermediate array allocations
  - **Benchmark script**: `scripts/bench-converter.ts`

## 1.3.0

### Minor Changes

#### `converter.ts` — Performance refactor

All three converter functions in `src/utils/cardano-wasm/converter.ts` have been rewritten for lower allocations and faster iteration.

**`convertUTxOObjectToUTxO`**

- Refactored into two functions: the original `convertUTxOObjectToUTxO` (unchanged public API) and a new **`convertUTxOObjectToUTxOWithOptions`** (exported) that accepts an options object.
- `for...in` loop over UTxO entries replaces `Object.entries()` — avoids allocating an intermediate `[key, value][]` array.
- Datum deserialization cache is now **bounded**: new `maxDatumCacheSize` option (default `1024`) evicts the oldest entry when the limit is reached, preventing unbounded memory growth on snapshots with many unique inline datums.
- Datum lookup priority simplified: `inlineDatumRaw` hex → `inlineDatum` string hex → `inlineDatum` object (JSON path). Redundant branching removed.
- `amount` array built with `push` instead of pre-allocated `new Array(assetCount)` — removes the O(n) pre-count pass over all policy IDs.
- Guards added: skips `null` UTxO values and malformed `txHash` strings (no `#`, or `#` at start/end).

**`convertUTxOToUTxOObject`**

- `reduce` replaced with `for` loop + mutable `result` object — avoids creating and discarding intermediate accumulator references.
- Value building split into a local `value` record populated by an explicit `for` loop, replacing the nested `reduce` inside the outer `reduce`.

**`convertTxOutputToWasm`**

- `output.amount.find(...)` + `output.amount.filter(...)` (two passes) replaced with a single `for` loop that separates lovelace and native assets in one pass.

#### New: `scripts/bench-converter.ts`

CLI benchmark script for measuring `convertUTxOObjectToUTxO` and `convertUTxOToUTxOObject` throughput under configurable workloads.

```
npx ts-node scripts/bench-converter.ts \
  --size=10000 --assets=3 --runs=5 \
  --inline-every=3 --datum-pool=64 --cache-size=1024
```

| Flag             | Default | Description                                                        |
| ---------------- | ------- | ------------------------------------------------------------------ |
| `--size`         | 10000   | Number of UTxOs in the snapshot                                    |
| `--assets`       | 3       | Native assets per UTxO                                             |
| `--runs`         | 5       | Number of benchmark iterations                                     |
| `--inline-every` | 3       | Every N-th UTxO gets an inline datum                               |
| `--datum-pool`   | 64      | Unique datum variants (tests cache hit rate)                       |
| `--cache-size`   | 1024    | `maxDatumCacheSize` passed to `convertUTxOObjectToUTxOWithOptions` |

### New Exports

- `convertUTxOObjectToUTxOWithOptions(utxoObject, options?)` — same as `convertUTxOObjectToUTxO` but accepts `{ maxDatumCacheSize?: number }`.

## 1.1.7

### Patch Changes

- Release v1.1.7:
  - Implement CIP-8 message signing in EmbeddedWallet
  - Add support for Cardano Reference Inputs in TxBuilder
  - Add support for Reference Scripts in TxBuilder
  - Standardize Plutus types across packages
  - Update Ogmios provider for structured script references

- Updated dependencies
  - @hydra-sdk/cardano-wasm@0.0.7

## 1.1.6

### Patch Changes

- View in github
- Updated dependencies
  - @hydra-sdk/cardano-wasm@0.0.6

## 1.1.5

### Patch Changes

- Re-build v1.1.5

## 1.1.4

### Patch Changes

- Update keys utilities

## 1.1.3

### Patch Changes

- v1.1.3

## 1.1.2

### Patch Changes

- Add CardanoCliWallet function

## 1.1.1

### Patch Changes

- Support build blueprint tx with Hydra

## 1.1.0

### Minor Changes

- - Update dependencies to the latest versions and add new methods for transaction handling and UTxO querying.
  - Add providers: Blockfrost, and Ogmios.
  - Update documentation to reflect new features and changes.
  - Update examples nodejs-playground
  - Fix minor bugs and improve performance.
  - Update and group Utilities functions, remove old utilities.

## 1.0.14

### Patch Changes

- - Add mint/burn token in tx builder
  - Add DatumUtils for building Datum
  - Add PolicyUtils for minting policy script
  - Add example for mint/burn token in NodeJS playground
  - Fix some types
  - Update nodePolyfills configuration to include only buffer and disable global/process polyfills

## 1.0.13

### Patch Changes

- - Add TimeUtils to core for common time conversions and helpers.
  - Fix validity range setup in transaction to correctly handle lower/upper bounds and serialization.

## 1.0.12

### Patch Changes

- - Fix tx-builder:
    - Update descriptions
    - Fix redeemer builder: add more options, change default exUnits
    - Fix logs
    - Fix calculate script hash

## 1.0.11

### Patch Changes

- Sync version to 1.0.11

## 1.0.7

### Patch Changes

- Fix transaction builder

## 1.0.6

### Patch Changes

- Bump version

## 1.0.5

### Patch Changes

- Updated dependencies
  - @hydra-sdk/cardano-wasm@0.0.5

## 1.0.4

### Patch Changes

- Update configs
- Updated dependencies
  - @hydra-sdk/cardano-wasm@0.0.4

## 1.0.3

### Patch Changes

- Update docs and Readme.md

## 1.0.2

### Patch Changes

- Update

## 1.0.1

### Patch Changes

- Fixed performance

## 1.0.0

### Major Changes

- Realease first major

## 0.0.5

### Patch Changes

- Add community link

## 0.0.4

### Patch Changes

- fix tx builder with multiasset with same policyId

## 0.0.3

### Patch Changes

- Add docs
- Updated dependencies
  - @hydra-sdk/cardano-wasm@0.0.3

## 0.0.2

### Patch Changes

- First release
- Updated dependencies
  - @hydra-sdk/cardano-wasm@0.0.2
