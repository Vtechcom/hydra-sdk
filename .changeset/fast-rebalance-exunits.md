---
'@hydra-sdk/transaction': minor
---

Add `complete({ fastRebalance: true })` to `TxBuilder` — a lighter second build pass for evaluated transactions.

When an `evaluator` is supplied, `complete()` runs a second pass to write the real exUnits back and reprice the fee. By default that second pass re-runs coin selection, which is wasteful. `fastRebalance` instead reuses the exact inputs the first pass already selected — adding them explicitly and letting CSL recompute fee, change, and `script_data_hash` via `add_change_if_needed` — so the expensive coin-selection step runs only once.

The rebalanced transaction is byte-for-byte equivalent to the full rebuild (same inputs, same fee, same exUnits); it is just cheaper to compute. Opt-in and backward-compatible: the default `complete()` is unchanged, and `fastRebalance` is ignored for Hydra builds (`isHydra`) or when no change address is set.
