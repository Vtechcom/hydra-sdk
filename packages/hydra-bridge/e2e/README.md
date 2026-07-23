# `@hydra-sdk/bridge` e2e

Runs the bridge against a **real hydra-node 2.3.0** in offline mode.

The v2 payload types were derived by reading the hydra Haskell source. Only a
live node proves the wire format matches — and it already caught three bugs the
unit tests could not:

| Found | Fix |
| --- | --- |
| `Greetings.env` has no `signingKey` — the node's `ToJSON` deliberately omits it | dropped from `HydraNodeEnvironment` |
| `InvalidInput` is sent **without a `tag`** (single-constructor record, no `tagSingleConstructors`) | connectors stamp `tag` on receipt so the union stays discriminated |
| `POST /transaction` takes the **bare tx envelope**, not `{ submitL2Tx: … }` (`SubmitL2TxRequest` is a newtype with `deriving newtype FromJSON`) | corrected request body |

## Infrastructure

There is none here — this directory is just the test. The head comes from the
shared sample at [`infra/hydra-offline/`](../../../infra/hydra-offline/), driven
through its env overrides:

```jsonc
// package.json
"e2e:node": "HYDRA_NODE_ID=e2e HYDRA_API_PORT=4002 … infra/hydra-offline/run-offline.sh"
```

Ports are shifted +1 so the e2e head coexists with one already on `:4001`, and
the head seed differs so the two never share persistence. Everything else —
protocol parameters, genesis, seed UTxO, binary lookup, key generation — is the
sample's. Nothing is duplicated, so nothing can drift.

## Run

```bash
pnpm e2e:node          # boot the head on :4002 (foreground)
pnpm test:e2e          # in another shell
```

`pnpm e2e:node:reseed` wipes persistence and boots a fresh head. Do that if the
UTxO set drifts far enough that tests cannot build a spend.

The suite is **rerunnable against a used head** — it never assumes snapshot 0.

First time on a machine? See the sample's
[README](../../../infra/hydra-offline/README.md) for fetching the hydra-node
binary, including why Docker cannot be used on Apple Silicon.

## Spending inside the head

`infra/hydra-offline/initial-utxo.json` is seeded to an address derived from the
throwaway mnemonic exported by `infra/hydra-offline/seed-utxo.mjs`, which this
suite imports. That is what lets the tests **spend** in the head rather than only
read it. Change the seed and the L2 tests can no longer sign — regenerate with
`node infra/hydra-offline/seed-utxo.mjs`, then reseed.

## What offline mode cannot cover

No L1, so these paths need a devnet with a cardano-node and are **not** tested
here:

- `POST /commit` → deposit → `CommitRecorded` / `DepositActivated` / `CommitFinalized`
- `DELETE /commits/{txId}` recovery
- decommit, close, contest, fanout
- `NodeUnsynced` / `RejectedInputBecauseUnsynced` (an offline node is always `InSync`)

Worth noting that the offline head does seed itself through an internal
`IncrementTx` → `CommitApproved` → `CommitFinalized` sequence, so those payloads
do appear in the node log — just not driven by a client.
