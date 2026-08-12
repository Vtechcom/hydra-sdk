# @hydra-sdk/evaluator

> **Experimental (0.x).** Offline, transaction-level Plutus evaluator for the Hydra SDK.

Implements `IEvaluator` for `@hydra-sdk/transaction`, so `TxBuilder.complete()` can obtain real script execution units (exUnits) — and therefore a correct fee — **without a provider, API key, or network I/O**. This is the only way to get real exUnits inside a Hydra head, where no provider exists to evaluate scripts.

It is not a thin wrapper around a UPLC interpreter: it decodes the transaction, resolves the referenced UTxOs, builds the engine input, executes each redeemer with cost accounting, and maps the result back to `EvalAction`.

## Install

The execution engine (`whisky-evaluator`, a ~13 MB Rust/WASM package) is an **optional peer dependency** — the SDK does not force every consumer to download it. Install it alongside this package:

```bash
npm install @hydra-sdk/evaluator whisky-evaluator@0.1.1
```

If it is missing, `createEvaluator()` throws `EvaluatorError('ENGINE_NOT_INSTALLED')` with install instructions.

## Usage

```ts
import { TxBuilder } from '@hydra-sdk/transaction'
import { createEvaluator, fromUtxos } from '@hydra-sdk/evaluator'

// createEvaluator is async — it loads the WASM engine lazily.
const evaluator = await createEvaluator({
	source: fromUtxos(resolvedUtxos) // the UTxOs the transaction spends
})

const builder = new TxBuilder({ isHydra: true, evaluator })
const tx = await builder /* … stage inputs/scripts … */.complete()
// complete() evaluated the scripts, wrote real exUnits into the redeemers,
// and rebuilt so the fee is correct.
```

### Inside a Hydra head

```ts
import { createEvaluator, fromHydraSnapshot } from '@hydra-sdk/evaluator'
import { TimeUtils } from '@hydra-sdk/core'

const evaluator = await createEvaluator({
	source: fromHydraSnapshot(bridge.snapshotUTxOObject),
	context: { slotConfig: TimeUtils.buildHydraSlotConfig(bridge.slotZeroTimestamp) }
})
```

`fromHydraSnapshot` takes a plain `UTxOObject` (e.g. `bridge.snapshotUTxOObject`), **not** a `HydraBridge` — this keeps `@hydra-sdk/evaluator` off the `@hydra-sdk/bridge` dependency chain.

### Diagnostics

`evaluateTxDetailed()` returns the budgets plus a context fingerprint, the engine identity, and an `unmapped` flag for redeemer categories the TxBuilder does not yet remap.

### Fee — without a rebuild

Pricing the full transaction fee does not require a second TxBuilder pass (which would re-run coin selection). `OfflineEvaluator.calculateFee()` evaluates the scripts and prices the tx in one call:

```ts
const breakdown = await evaluator.calculateFee(txHex)
// { fee, baseFee, sizeFee, scriptFee, refScriptFee, txBytes, signerCount, refScriptBytes }
```

The fee math itself lives in `@hydra-sdk/core` as `FeeUtils.calculateTxFee` and needs no execution engine — any exUnits source (Blockfrost, Ogmios, or this evaluator) can price a tx locally:

```ts
import { FeeUtils } from '@hydra-sdk/core' // also re-exported from @hydra-sdk/evaluator

const breakdown = FeeUtils.calculateTxFee(txHex, {
	exUnits: [{ mem: 500, steps: 64100 }], // from any evaluator; omit to use the tx's own redeemer exUnits
	resolvedUtxos, // used to count signers and size reference scripts
	feeMultiplier: 1.05 // optional headroom
})
```

It returns a **safe estimate**: `>=` the fee CSL's own build converges on (typically within ~0.1%), so it never under-provisions. It returns the number, not a rebalanced transaction — adjust the change output yourself if you need a valid tx.

## The offline contract (fail-closed)

Everything the evaluation needs is local and explicit. Any transaction input, collateral, or reference input that cannot be resolved from `additionalUtxos`, `additionalTxs`, or the context source throws `EvaluatorError('MISSING_UTXO')` **before** the engine runs. The evaluator never fetches over the network and never returns a placeholder or zero budget.

## Determinism & product claim

**Claim:** deterministic offline evaluation with *pinned context*. Two evaluations of the same transaction with the same context fingerprint (cost models + slot config + engine version) produce the same budgets.

**Not claimed (0.x):** `cardano-node` equivalence. That requires a wider differential corpus (V1/V2/V3 × SPEND/MINT × reference script × inline datum × invalid script × validity range × multiple protocol-era cost models) against a declared cardano-node/Ogmios oracle.

## Compatibility matrix

| Dimension        | V1 support                                  | Notes                                                       |
| ---------------- | ------------------------------------------- | ---------------------------------------------------------- |
| Plutus language  | V1, V2, V3                                   | Cost models default to the SDK `DEFAULT_V*_COST_MODEL_LIST` |
| Redeemer purpose | `SPEND`, `MINT` (remapped by TxBuilder)      | `CERT/REWARD/VOTE/PROPOSE` evaluated but flagged `unmapped` |
| Protocol era     | Conway (current cost models)                | Pin + differential-test other eras before claiming them    |
| Engine           | `whisky-evaluator@0.1.1` (primary)          | `scalus@0.17.0` is the conformance oracle (dev only)       |
| Runtime          | Node, browser/worker                        | Node loads the CJS engine build; browser uses a bundler    |

## Engine provenance & release gates

The primary engine is pinned to `whisky-evaluator@0.1.1` exactly (not a caret range). Before promoting past 0.x, these must be resolved:

- `whisky-evaluator@0.1.1` does not publish a `repository` in its npm metadata — provenance is weaker than Scalus.
- The binary embeds `cardano-serialization-lib 15.0.0-beta.1`; cost accounting must be differential-tested per era.
- Fallback if provenance cannot be verified: fork/rebuild a source-audited Rust `wasm-bindgen` adapter behind the same `EvaluationEngine` interface.

## Conformance

`__tests__/conformance/differential.test.ts` runs the same always-succeed V3 SPEND through both `whisky-evaluator` and `scalus` and asserts they agree on the exact budget (`{ mem: 500, steps: 64100 }` for the fixture). The engine is swappable behind the `EvaluationEngine` interface without touching `IEvaluator`.
