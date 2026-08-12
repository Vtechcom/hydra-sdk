---
'@hydra-sdk/evaluator': minor
'@hydra-sdk/core': minor
---

Add `@hydra-sdk/evaluator` — an offline, transaction-level Plutus evaluator implementing `IEvaluator` for `@hydra-sdk/transaction` — and `FeeUtils.calculateTxFee` in `@hydra-sdk/core`.

`TxBuilder.complete()` can now obtain real script execution units (exUnits), and therefore a correct fee, without a provider, API key, or network I/O — including inside a Hydra head, where no provider exists to evaluate scripts. Previously the only path to real exUnits was a Blockfrost/Ogmios provider; in a head, script transactions were stuck with placeholder exUnits and an incorrect fee.

- **Public surface:** `createEvaluator` (async — loads the WASM engine lazily), `OfflineEvaluator`, `evaluateTx` (Mesh-compatible) / `evaluateTxDetailed` (diagnostics + context fingerprint), the context sources `fromUtxos` / `fromUtxoObject` / `fromHydraSnapshot`, and the typed `EvaluatorError`.
- **Fail-closed offline contract:** any unresolved input/collateral/reference throws `EvaluatorError('MISSING_UTXO')` before the engine runs; never fetches, never returns a zero/placeholder budget.
- **Engine behind an adapter:** `whisky-evaluator@0.1.1` (Rust/WASM) is the primary engine, shipped as an **optional peer dependency** (~13 MB, opt-in). `scalus@0.17.0` is a second conformance oracle (dev only); a differential test asserts both engines agree on the exact budget for an always-succeed V3 SPEND.
- **V1 scope:** Plutus V1/V2/V3, `SPEND` + `MINT` remapped by the builder (`CERT/REWARD/VOTE/PROPOSE` evaluated but flagged `unmapped`). Node + browser/worker.

**Full fee without a rebuild.** New `FeeUtils.calculateTxFee(txHex, { exUnits, resolvedUtxos, params })` in `@hydra-sdk/core` prices a transaction's full fee (size + script + reference-script components) without re-running coin selection or a TxBuilder rebuild. It returns a safe estimate — `>=` the fee CSL's own build converges on (typically within ~0.1%), never under-provisioning — as a number, not a rebalanced transaction. It needs no execution engine, so any exUnits source (Blockfrost, Ogmios, or the offline evaluator) can price locally. `OfflineEvaluator.calculateFee()` is a convenience that evaluates and prices in one call; `@hydra-sdk/evaluator` re-exports `FeeUtils` for a single import.

Experimental (0.x). Claim: deterministic offline evaluation with pinned context — not `cardano-node` equivalence.
