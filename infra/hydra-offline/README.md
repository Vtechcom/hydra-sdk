# Offline Hydra head — local dev sample

A single-party Hydra head in **offline mode**: no Cardano L1, no cardano-node,
no socket, no funded wallet. The head is seeded from `initial-utxo.json` and is
`Open` the moment the node starts.

This is the cheapest way to develop against `@hydra-sdk/bridge` — you get a real
hydra-node speaking the real protocol without standing up a devnet.

- hydra-node **2.3.0**
- API on `http://localhost:4001` (WebSocket + REST)
- Ledger params are **PV11** (van Rossem), PlutusV3 cost model of 350 entries

> Copy this directory into your own project and edit `initial-utxo.json` — that
> is the intended way to use it.

---

## ⚠️ macOS Apple Silicon: run native, not Docker

The official `hydra-node` image is **amd64-only**, and hydra-node ships an
**embedded amd64 `etcd`** binary as its network layer. That Go binary crashes
under emulation on arm64:

| Backend | Failure |
| --- | --- |
| Rosetta | `Failed to create temporary file` |
| QEMU | etcd Go runtime SIGSEGV → `Sub-process etcd exited with: ExitFailure 2` |

This is a limit of emulation, **not something config can fix**. On Apple Silicon
run the native `aarch64-darwin` binary (it embeds a native arm64 etcd).

`docker-compose.yaml` is kept for **amd64 hosts** — CI and cloud Linux — where it
works fine.

---

## Setup (once)

The native binary is ~428MB and is not committed. Fetch it into `bin/`:

```bash
cd infra/hydra-offline
mkdir -p bin && cd bin

# macOS arm64
gh release download 2.3.0 --repo cardano-scaling/hydra \
  --pattern 'hydra-aarch64-darwin-2.3.0.zip' --clobber
unzip -o hydra-aarch64-darwin-2.3.0.zip   # -> bin/hydra-node, bin/hydra-tui
```

Other platforms: swap the pattern for `hydra-x86_64-linux-2.3.0.zip` or
`hydra-x86_64-darwin-2.3.0.zip`.

If Gatekeeper blocks it: `xattr -dr com.apple.quarantine bin/`.

Already have a binary elsewhere? Skip all this — either set `HYDRA_NODE_BIN`, or
symlink it in (`bin/` is gitignored):

```bash
mkdir -p bin && ln -sf /path/to/hydra-node bin/hydra-node
```

---

## Run

```bash
./run-offline.sh          # foreground, JSON logs on stdout
./reseed-and-run.sh       # wipe persistence first — fresh head, re-seeded UTxO
```

Hydra keys are generated into `credentials/` on first run. Nothing to prepare.

Check it is alive:

```bash
curl -s localhost:4001/protocol-parameters -o /dev/null -w '%{http_code}\n'   # 200
curl -s localhost:4001/snapshot/utxo | jq
```

Stop with `Ctrl-C`, or `pkill -f hydra-node`.

### Connect the SDK

```ts
import { HydraBridge } from '@hydra-sdk/bridge'

const bridge = new HydraBridge({ url: 'ws://localhost:4001' })
await bridge.connect()

console.log(bridge.nodeVersion) // '2.3.0-…'
console.log(await bridge.querySnapshotUtxo())
```

---

## Running more than one head

Every path and port is env-overridable, so a second head needs no second copy of
this directory:

```bash
HYDRA_NODE_ID=2 \
HYDRA_API_PORT=4002 \
HYDRA_LISTEN_PORT=5002 \
HYDRA_MONITORING_PORT=6002 \
HYDRA_HEAD_SEED=0000000000000000000000000000000000000000000000000000000000000002 \
HYDRA_INITIAL_UTXO=/path/to/other-utxo.json \
./run-offline.sh
```

| Variable | Default |
| --- | --- |
| `HYDRA_NODE_BIN` | `./bin/hydra-node` |
| `HYDRA_NODE_ID` | `1` |
| `HYDRA_API_PORT` | `4001` |
| `HYDRA_LISTEN_PORT` | `5001` |
| `HYDRA_MONITORING_PORT` | `6001` |
| `HYDRA_HEAD_SEED` | `0000…0001` |
| `HYDRA_PROTOCOL_PARAMETERS` | `./protocol-parameters.json` |
| `HYDRA_LEDGER_GENESIS` | `./shelley-genesis.json` |
| `HYDRA_INITIAL_UTXO` | `./initial-utxo.json` |
| `HYDRA_PERSISTENCE_DIR` | `./persistence/node-$HYDRA_NODE_ID` |
| `HYDRA_CREDENTIALS_DIR` | `./credentials` |

The bridge e2e suite (`packages/hydra-bridge/e2e/`) drives this same script that
way — it is the worked example.

---

## Seeding the head

`initial-utxo.json` fabricates the head's starting UTxO set:

```json
{
  "0000000000000000000000000000000000000000000000000000000000000000#0": {
    "address": "addr_test1…",
    "value": { "lovelace": 100000000000000 }
  }
}
```

Spending inside the head means signing, so the address has to be one you hold
the key for. It ships seeded to a wallet derived from a fixed throwaway mnemonic
— `seed-utxo.mjs` both derives it and exports the mnemonic — so transactions
work out of the box rather than the head being read-only.

To point it at your own wallet, edit `seed-utxo.mjs` (or hand-write the JSON):

```bash
node seed-utxo.mjs        # regenerate initial-utxo.json
./reseed-and-run.sh       # restart with the new seed
```

> The bridge e2e suite imports that mnemonic to sign with. Change the seed and
> `pnpm test:e2e` can no longer spend.

---

## What offline mode cannot do

There is no L1, so anything that needs an on-chain transaction is unavailable:

- `POST /commit` / incremental deposits, and `DELETE /commits/{txId}` recovery
- decommit, close, contest, fanout
- `NodeUnsynced` / `RejectedInputBecauseUnsynced` — an offline node is always `InSync`

Testing those needs a devnet with a real cardano-node. Offline mode covers the
L2 path: `Greetings`, `HeadIsOpen`, `NewTx`, `TxValid`, `TxInvalid`,
`SnapshotConfirmed`, and every REST read endpoint.

---

## Files

| Path | Role |
| --- | --- |
| `run-offline.sh` | boot the node (env-overridable) |
| `reseed-and-run.sh` | wipe persistence, then boot |
| `docker-compose.yaml` | amd64 hosts only |
| `protocol-parameters.json` | ledger protocol parameters (PV11) |
| `shelley-genesis.json` | genesis, used for block time |
| `initial-utxo.json` | the head's starting UTxO set |
| `seed-utxo.mjs` | regenerate the above from a mnemonic |
| `bin/` | native binary (gitignored) |
| `credentials/` | hydra keys, generated on first run (gitignored) |
| `persistence/` | node state + embedded etcd (gitignored) |
