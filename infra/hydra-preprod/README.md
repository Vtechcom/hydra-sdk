# Online Hydra head — preprod

A Hydra head connected to a **real cardano-node on preprod**. Unlike
[`../hydra-offline`](../hydra-offline/), this talks to L1, so it can exercise
everything an offline head cannot:

`Init` · commit / incremental deposit · `Close` · `Contest` · `Fanout` ·
`ReadyToFanout` · `HeadIsFinalized` · `CommitRecovered` · `PostTxOnChainFailed`

That matters because those paths are otherwise **unverified** — the bridge's
types for them are hand-derived from the hydra Haskell source, and the offline
e2e run already found three places where hand-derived types were wrong.

> Driving this with an AI agent? [PROMPT-GUIDE.md](./PROMPT-GUIDE.md) has
> copy-paste prompts with the known pitfalls already encoded.

> ⚠️ Every head operation posts a real transaction and spends real preprod ADA.
> `Init`, `Close` and `Fanout` are on-chain and cannot be undone.

---

## Prerequisites

**1. A synced cardano-node on preprod.** Verify:

```bash
docker exec cardano-node cardano-cli query tip \
  --testnet-magic 1 --socket-path /workspace/node.socket
# syncProgress must read "100.00"
```

**2. A funded L1 key.** hydra-node spends from `--cardano-signing-key` as fuel
for every protocol transaction.

This repo ships funded preprod demo credentials, so the sample runs with no
setup: `run-online.sh` defaults to
`demo/2.0.0-alpha/credentials/alice/alice-funds.sk`. Check the balance before
relying on it:

```bash
docker exec cardano-node cardano-cli query utxo \
  --address "$(cat ../../demo/2.0.0-alpha/credentials/alice/alice-funds.addr)" \
  --testnet-magic 1 --socket-path /workspace/node.socket
```

Empty? Top up from the [faucet](https://docs.cardano.org/cardano-testnets/tools/faucet),
or bring your own key with `HYDRA_CARDANO_SIGNING_KEY`.

**3. The hydra-node binary** — see [`../hydra-offline/README.md`](../hydra-offline/README.md).

---

## ⚠️ Docker Desktop: the socket needs a bridge

If cardano-node runs in Docker Desktop (macOS/Windows), its `node.socket` is
bind-mounted to the host but **cannot be connected to** from there — only the
inode crosses the VM boundary; the listener stays inside the Linux VM. You get:

```
Network.Socket.connect: does not exist (Connection refused)
```

hydra-node has to run natively on the host (the official image is amd64-only and
its embedded etcd crashes under emulation on arm64), so it cannot reach the
socket directly. Two hops fix it:

```
hydra-node → host UDS → socket-bridge.mjs → TCP → socat container → node.socket
```

```bash
./bridge-up.sh            # start both hops
./bridge-up.sh --stop     # tear down
```

The container hop is `alpine/socat`; the host hop is plain Node, so there is
nothing to install. `run-online.sh` probes the socket before launching and
points here if it is unreachable.

**Native Linux, or cardano-node running directly on the host?** Skip the bridge
and point `CARDANO_NODE_SOCKET_PATH` at the real socket.

---

## Run

```bash
./bridge-up.sh                                              # Docker Desktop only
CARDANO_NODE_SOCKET_PATH=/tmp/cardano-node-preprod.socket \
  ./run-online.sh
```

Check it is following the chain:

```bash
curl -s localhost:4001/head | jq .tag        # "Idle" until a head is opened
```

Then over the WebSocket, `Greetings.currentSlot` should match the L1 tip and
`chainSyncedStatus` should read `InSync`.

### Opening a head

```ts
import { HydraBridge } from '@hydra-sdk/bridge'

const bridge = new HydraBridge({ url: 'ws://localhost:4001' })
await bridge.connect()

await bridge.commands.initSync!(3, 20_000)   // posts InitTx — costs ADA
```

For a single-party head this opens directly (hydra-node v2 removed the commit
phase), so `initSync` resolves on `HeadIsOpen`.

Funds enter an open head incrementally:

```ts
const draft = await bridge.commit({ utxoToCommit })   // POST /commit
// sign draft with your L1 key, submit to L1, then watch:
//   CommitRecorded → DepositActivated → CommitApproved → CommitFinalized
```

---

## Configuration

| Variable | Default |
| --- | --- |
| `HYDRA_NODE_BIN` | `../hydra-offline/bin/hydra-node` |
| `HYDRA_NODE_ID` | `1` |
| `HYDRA_API_PORT` | `4001` |
| `HYDRA_LISTEN_PORT` | `5001` |
| `HYDRA_MONITORING_PORT` | `6001` |
| `HYDRA_NETWORK` | `preprod` (selects pre-published Hydra scripts) |
| `CARDANO_TESTNET_MAGIC` | `1` |
| `CARDANO_NODE_SOCKET_PATH` | `node.socket` (only used when backend is `direct`) |
| `CARDANO_NODE_DIR` | — required by `bridge-up.sh`: host dir holding `node.socket` |
| `HYDRA_CHAIN_BACKEND` | `blockfrost` when a key file is found, else `direct` |
| `HYDRA_BLOCKFROST_KEY_FILE` | `demo/2.0.0-alpha/.blockfrost` |
| `HYDRA_UNSYNCED_PERIOD` | `180s` |
| `HYDRA_CARDANO_SIGNING_KEY` | demo alice funds key |
| `HYDRA_SIGNING_KEY_BASE` | demo alice hydra key (basename, no extension) |
| `HYDRA_CONTESTATION_PERIOD` | `120s` |
| `HYDRA_DEPOSIT_PERIOD` | `120s` |
| `HYDRA_PROTOCOL_PARAMETERS` | `./protocol-parameters.json` |
| `HYDRA_PERSISTENCE_DIR` | `./persistence/node-$HYDRA_NODE_ID` |

Durations parse through Haskell's `Read` for `NominalDiffTime` and **require the
`s` suffix** — a bare `120` is rejected. The script appends it for you.

### Contestation period

Defaulted to `120s` so a `Close → ReadyToFanout → Fanout` cycle finishes in
minutes. **On mainnet this must be ≥ 43200s (12h)** — hydra-node's own default
since v1.3.0 — or a long chain fork can leave you unable to contest in time.

### L2 protocol parameters

`protocol-parameters.json` is the ledger *inside* the head. It is taken verbatim
from live preprod — so script costs and size limits behave like L1 — with the
economics that make no sense on L2 zeroed:

```
txFeeFixed      0
txFeePerByte    0
utxoCostPerByte 0
```

Regenerate after a hard fork; PV11 (van Rossem) repriced Plutus builtins, and a
stale cost model silently skews every ExUnits estimate:

```bash
./gen-l2-params.sh
```

---

## Files

| Path | Role |
| --- | --- |
| `run-online.sh` | boot hydra-node against L1 (env-overridable, with preflight) |
| `bridge-up.sh` | UDS↔TCP bridge for a Dockerised cardano-node |
| `socket-bridge.mjs` | host half of that bridge (plain Node, no deps) |
| `gen-l2-params.sh` | regenerate the L2 ledger params from a live node |
| `protocol-parameters.json` | L2 ledger parameters |
| `credentials/` | hydra keys, generated when not using the demo ones (gitignored) |
| `persistence/` | node state + embedded etcd (gitignored) |

L1 signing keys are **never** stored here — supply them via
`HYDRA_CARDANO_SIGNING_KEY`.
