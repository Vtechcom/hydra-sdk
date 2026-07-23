#!/usr/bin/env bash
# Boot hydra-node against a real cardano-node on **preprod**.
#
# Unlike ../hydra-offline this talks to L1, so it can exercise everything the
# offline head cannot: commit/deposit, decommit, close, contest and fanout.
#
# It costs real preprod ADA. The --cardano-signing-key must control a funded
# address — hydra-node spends from it as "fuel" for every protocol transaction.
#
# Defaults:
#   API         http://localhost:4001   (WebSocket + REST)
#   network     0.0.0.0:5001
#   monitoring  6001
#
# See README.md for prerequisites and the full env-override table.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- knobs -------------------------------------------------------------------
NODE_ID="${HYDRA_NODE_ID:-1}"
API_PORT="${HYDRA_API_PORT:-4001}"
LISTEN_PORT="${HYDRA_LISTEN_PORT:-5001}"
MONITORING_PORT="${HYDRA_MONITORING_PORT:-6001}"

TESTNET_MAGIC="${CARDANO_TESTNET_MAGIC:-1}"          # 1 = preprod
NETWORK="${HYDRA_NETWORK:-preprod}"                  # picks pre-published scripts
# Only consulted when HYDRA_CHAIN_BACKEND=direct.
NODE_SOCKET="${CARDANO_NODE_SOCKET_PATH:-node.socket}"

# --- chain backend -----------------------------------------------------------
# Blockfrost is the default because it needs nothing local: no cardano-node, no
# socket, and none of the Docker Desktop socket gymnastics (a bind-mounted
# node.socket is visible on the host but refuses connections — the listener
# lives inside the Linux VM).
#
# Set HYDRA_CHAIN_BACKEND=direct to talk to a local cardano-node instead.
BLOCKFROST_KEY_FILE="${HYDRA_BLOCKFROST_KEY_FILE:-}"
if [[ -z "$BLOCKFROST_KEY_FILE" && -f "$DIR/../../demo/2.0.0-alpha/.blockfrost" ]]; then
  BLOCKFROST_KEY_FILE="$DIR/../../demo/2.0.0-alpha/.blockfrost"
fi

BACKEND="${HYDRA_CHAIN_BACKEND:-}"
if [[ -z "$BACKEND" ]]; then
  BACKEND=$([[ -f "$BLOCKFROST_KEY_FILE" ]] && echo blockfrost || echo direct)
fi

# hydra-node's --unsynced-period default of 60s is too tight for either backend
# here, and the consequence is not just cosmetic: since v1.3.0 an unsynced node
# stops signing snapshots and REJECTS client inputs.
#
# Measured on preprod:
#   blockfrost      drift 50-80s  (HTTP polling, not a chain follower)
#   bridged socket  drift  ~64s   (socat + host proxy adds latency)
#   native socket   drift    ~0s
#
# Observed failure: a deposit activated, the node then crossed 60s of drift and
# went unsynced mid-window, so the increment never got signed and the deposit
# expired. 180s absorbs that while still catching a genuinely stalled node.
UNSYNCED_PERIOD="${HYDRA_UNSYNCED_PERIOD:-180s}"
[[ "$UNSYNCED_PERIOD" =~ ^[0-9]+$ ]] && UNSYNCED_PERIOD="${UNSYNCED_PERIOD}s"

# hydra-node >= 1.3.0 defaults contestation to 12h. Correct for mainnet, but it
# makes a close→fanout cycle untestable, so default low here and warn instead.
#
# NOTE: these parse via Haskell's Read for NominalDiffTime, which REQUIRES the
# 's' suffix — a bare `120` is rejected. Accept either and normalize.
# depositPeriod governs a deposit's usable window, per Hydra.HeadLogic:
#   Active  when chainTime > created  + depositPeriod
#   Expired when chainTime > deadline - depositPeriod   (deadline = draft + 3P)
# so the window is roughly P wide and only opens after P has elapsed. At 120s a
# single ~2min gap between preprod blocks steps straight from Inactive to
# Expired. 300s survives that while still finishing in minutes.
# hydra-node's own default is 3600s.
CONTESTATION_PERIOD="${HYDRA_CONTESTATION_PERIOD:-120s}"
DEPOSIT_PERIOD="${HYDRA_DEPOSIT_PERIOD:-300s}"
[[ "$CONTESTATION_PERIOD" =~ ^[0-9]+$ ]] && CONTESTATION_PERIOD="${CONTESTATION_PERIOD}s"
[[ "$DEPOSIT_PERIOD" =~ ^[0-9]+$ ]] && DEPOSIT_PERIOD="${DEPOSIT_PERIOD}s"

PROTOCOL_PARAMETERS="${HYDRA_PROTOCOL_PARAMETERS:-$DIR/protocol-parameters.json}"
PERSISTENCE_DIR="${HYDRA_PERSISTENCE_DIR:-$DIR/persistence/node-$NODE_ID}"
CREDENTIALS_DIR="${HYDRA_CREDENTIALS_DIR:-$DIR/credentials}"

# This repo ships funded preprod demo credentials, so the sample runs with no
# setup here. Copied elsewhere, both must be supplied explicitly.
DEMO_CREDS="$DIR/../../demo/2.0.0-alpha/credentials/alice"

# The L1 key that pays for every protocol transaction ("fuel").
CARDANO_SIGNING_KEY="${HYDRA_CARDANO_SIGNING_KEY:-}"
if [[ -z "$CARDANO_SIGNING_KEY" && -f "$DEMO_CREDS/alice-funds.sk" ]]; then
  CARDANO_SIGNING_KEY="$DEMO_CREDS/alice-funds.sk"
fi

# Hydra (off-chain) key. Reuse the demo party when present so this head has the
# same identity as demo/2.0.0-alpha; otherwise generate a throwaway one.
HYDRA_KEY="${HYDRA_SIGNING_KEY_BASE:-}"
if [[ -z "$HYDRA_KEY" ]]; then
  if [[ -f "$DEMO_CREDS/alice-hydra.sk" ]]; then
    HYDRA_KEY="$DEMO_CREDS/alice-hydra"
  else
    HYDRA_KEY="$CREDENTIALS_DIR/node-$NODE_ID"
  fi
fi

BIN="${HYDRA_NODE_BIN:-$DIR/../hydra-offline/bin/hydra-node}"

# --- preflight ---------------------------------------------------------------
fail() { echo "✗ $*" >&2; exit 1; }

[[ -x "$BIN" ]] || fail "hydra-node binary not found at: $BIN
  Fetch it or set HYDRA_NODE_BIN — see ../hydra-offline/README.md"

[[ -n "$CARDANO_SIGNING_KEY" ]] || fail "No Cardano signing key.
  This sample defaults to demo/2.0.0-alpha/credentials/alice, which is absent
  here. Point at a key whose address holds preprod ADA:

    HYDRA_CARDANO_SIGNING_KEY=/path/to/payment.skey $0

  Fund the address from https://docs.cardano.org/cardano-testnets/tools/faucet"

[[ -f "$CARDANO_SIGNING_KEY" ]] || fail "signing key not found: $CARDANO_SIGNING_KEY"

if [[ "$BACKEND" == blockfrost ]]; then
  [[ -f "$BLOCKFROST_KEY_FILE" ]] || fail "Blockfrost key file not found: ${BLOCKFROST_KEY_FILE:-<unset>}
  Create a file holding just the project id (e.g. preprod<...>) and point at it:

    HYDRA_BLOCKFROST_KEY_FILE=/path/to/blockfrost.txt $0

  Get one at https://blockfrost.io — the key's prefix selects the network."

  # A key for the wrong network fails much later, deep in chain observation.
  grep -q "^${NETWORK}" "$BLOCKFROST_KEY_FILE" || fail "Blockfrost key is not for '$NETWORK'.
  The project id must start with the network name, e.g. ${NETWORK}XXXXXXXX.
  File: $BLOCKFROST_KEY_FILE"

else
  [[ -S "$NODE_SOCKET" ]] || fail "cardano-node socket not found: $NODE_SOCKET
  Start your node, or set CARDANO_NODE_SOCKET_PATH.
  Or drop the local node entirely: HYDRA_CHAIN_BACKEND=blockfrost $0"

  # Existing ≠ connectable. A Dockerised node on macOS bind-mounts a socket whose
  # inode is visible on the host but whose listener lives in the Linux VM, so
  # connect() gets ECONNREFUSED. Catch that here instead of letting hydra-node die
  # with a bare "Network.Socket.connect: does not exist (Connection refused)".
  node -e "
    const net=require('net'), s=net.connect('$NODE_SOCKET');
    s.on('connect',()=>{s.destroy();process.exit(0)});
    s.on('error',()=>process.exit(1));
    setTimeout(()=>process.exit(1),3000);
  " 2>/dev/null || fail "socket exists but refuses connections: $NODE_SOCKET
  Typical when cardano-node runs in Docker Desktop (macOS/Windows) — the
  bind-mounted socket cannot be opened across the VM boundary.

  Simplest fix — skip the local node:

    HYDRA_CHAIN_BACKEND=blockfrost $0

  Or bridge the socket:

    ./bridge-up.sh
    CARDANO_NODE_SOCKET_PATH=/tmp/cardano-node-preprod.socket $0"
fi

# --- hydra keys --------------------------------------------------------------
if [[ ! -f "$HYDRA_KEY.sk" ]]; then
  echo "generating hydra key pair -> $HYDRA_KEY.{sk,vk}" >&2
  mkdir -p "$CREDENTIALS_DIR"
  "$BIN" gen-hydra-key --output-file "$HYDRA_KEY"
fi

mkdir -p "$PERSISTENCE_DIR"

# --- go ----------------------------------------------------------------------
# The two backends are mutually exclusive in hydra-node's option parser:
# --blockfrost cannot be combined with --testnet-magic / --node-socket.
if [[ "$BACKEND" == blockfrost ]]; then
  BACKEND_ARGS=(--blockfrost "$BLOCKFROST_KEY_FILE")
  BACKEND_DESC="blockfrost ($BLOCKFROST_KEY_FILE)"
else
  BACKEND_ARGS=(--testnet-magic "$TESTNET_MAGIC" --node-socket "$NODE_SOCKET")
  BACKEND_DESC="cardano-node ($NODE_SOCKET, magic $TESTNET_MAGIC)"
fi

cat >&2 <<EOF
hydra-node $("$BIN" --version)
  network             $NETWORK
  chain backend       $BACKEND_DESC
  api                 :$API_PORT
  cardano key (fuel)  $CARDANO_SIGNING_KEY
  unsynced-period     ${UNSYNCED_PERIOD}
  contestation        ${CONTESTATION_PERIOD} $([[ "${CONTESTATION_PERIOD%s}" -lt 43200 ]] && echo '  ⚠️  testing value — mainnet needs >= 43200s (12h)')
  persistence         $PERSISTENCE_DIR
EOF

exec "$BIN" \
  --node-id "$NODE_ID" \
  --api-host 0.0.0.0 \
  --api-port "$API_PORT" \
  --listen "0.0.0.0:$LISTEN_PORT" \
  --monitoring-port "$MONITORING_PORT" \
  --hydra-signing-key "$HYDRA_KEY.sk" \
  --cardano-signing-key "$CARDANO_SIGNING_KEY" \
  --persistence-dir "$PERSISTENCE_DIR" \
  --persistence-rotate-after 20000 \
  --network "$NETWORK" \
  "${BACKEND_ARGS[@]}" \
  --contestation-period "$CONTESTATION_PERIOD" \
  --deposit-period "$DEPOSIT_PERIOD" \
  --unsynced-period "$UNSYNCED_PERIOD" \
  --ledger-protocol-parameters "$PROTOCOL_PARAMETERS" \
  "$@"
