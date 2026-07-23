# Recorded server outputs — hydra-node 2.3.0, preprod

Verbatim WebSocket payloads captured while driving a real head on preprod. One
JSON object per line.

These exist because the bridge's L1 payload types are hand-derived from the
hydra Haskell source. Reading the source got several of them wrong; only live
data settled it. Use them as fixtures rather than trusting a fresh read.

| File | Tags |
| --- | --- |
| `1-init.jsonl` | `Greetings`, `HeadIsOpen` |
| `2-commit.jsonl` | `CommitRecorded` |
| `2-commit-expired.jsonl` | `CommitRecorded`, `DepositExpired` |
| `2b-watch-deposit.jsonl` | `DepositActivated`, `DepositExpired`, `NodeSynced`, `NodeUnsynced`, `SyncedStatusReport` |
| `3-recover.jsonl` | `PostTxOnChainFailed` |

## What they pin down

**The timed/untimed envelope split.** `ServerOutput` messages are wrapped in
`TimedServerOutput` and carry `seq` + `timestamp`; `Greetings`, `InvalidInput`
and every `ClientMessage` are sent raw and carry neither. Both halves are
evidenced here — compare `NodeSynced` (has both) against `SyncedStatusReport`
and `PostTxOnChainFailed` (have neither).

**`PostTxOnChainFailed` is not fixed-shape.** The captured one is
`postTxError.tag = FailedToPostTx` over `postChainTx.tag = RecoverTx`. The
pre-v2 SDK hardcoded `ScriptFailedInWallet` / `InitTx` and would have been wrong
here.

**Deposit timing.** `2-commit-expired.jsonl` and `2b-watch-deposit.jsonl` show a
deposit expiring rather than finalizing. Per `Hydra.HeadLogic`:

```
Active  when chainTime > created  + depositPeriod
Expired when chainTime > deadline - depositPeriod   (deadline = draft + 3P)
```

The second recording captures the actual cause: the node crossed its
`unsynced-period` mid-window (`NodeUnsynced`, drift 64s), stopped signing
snapshots, and the window closed. That is why the sample now defaults
`--unsynced-period` to 180s.

## Not covered

No head was closed or fanned out during capture, so `HeadIsClosed`,
`ReadyToFanout`, `HeadIsFinalized`, the four `Decommit*` outputs and
`CommitRecovered` are still unrecorded. See issue #59.

## Regenerating

```bash
pnpm tsx infra/hydra-preprod/flow/1-init.mts          # posts a real InitTx
pnpm tsx infra/hydra-preprod/flow/2-commit.mts <txin>
pnpm tsx infra/hydra-preprod/flow/2b-watch-deposit.mts
pnpm tsx infra/hydra-preprod/flow/3-recover.mts
```

Every step spends real preprod ADA.
