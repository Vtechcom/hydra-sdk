#!/usr/bin/env bash
# Boot hydra-node in offline mode — a single-party Hydra head with no L1.
#
# Offline mode needs no cardano-node, no socket and no funded wallet: the head
# is seeded straight from --initial-utxo and is Open the moment the node starts.
# That makes it the cheapest way to develop against @hydra-sdk/bridge.
#
# Defaults:
#   API         http://localhost:4001   (WebSocket + REST)
#   network     0.0.0.0:5001
#   monitoring  6001
#
# Every path and port is overridable, so a second head can run alongside the
# first without copying this directory. See README.md.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- knobs -------------------------------------------------------------------
NODE_ID="${HYDRA_NODE_ID:-1}"
API_PORT="${HYDRA_API_PORT:-4001}"
LISTEN_PORT="${HYDRA_LISTEN_PORT:-5001}"
MONITORING_PORT="${HYDRA_MONITORING_PORT:-6001}"
HEAD_SEED="${HYDRA_HEAD_SEED:-0000000000000000000000000000000000000000000000000000000000000001}"

PROTOCOL_PARAMETERS="${HYDRA_PROTOCOL_PARAMETERS:-$DIR/protocol-parameters.json}"
LEDGER_GENESIS="${HYDRA_LEDGER_GENESIS:-$DIR/shelley-genesis.json}"
INITIAL_UTXO="${HYDRA_INITIAL_UTXO:-$DIR/initial-utxo.json}"
PERSISTENCE_DIR="${HYDRA_PERSISTENCE_DIR:-$DIR/persistence/node-$NODE_ID}"
CREDENTIALS_DIR="${HYDRA_CREDENTIALS_DIR:-$DIR/credentials}"
KEY="$CREDENTIALS_DIR/node-$NODE_ID"

# --- binary ------------------------------------------------------------------
# The native binary is ~428MB and is not vendored. Fetch it into ./bin or point
# HYDRA_NODE_BIN at an existing copy.
BIN="${HYDRA_NODE_BIN:-$DIR/bin/hydra-node}"

if [[ ! -x "$BIN" ]]; then
  cat >&2 <<EOF
hydra-node binary not found at: $BIN

Fetch it (macOS arm64 shown; see README.md for other platforms):

  mkdir -p "$DIR/bin" && cd "$DIR/bin"
  gh release download 2.3.0 --repo cardano-scaling/hydra \\
    --pattern 'hydra-aarch64-darwin-2.3.0.zip' --clobber
  unzip -o hydra-aarch64-darwin-2.3.0.zip

…or point at one you already have:

  HYDRA_NODE_BIN=/path/to/hydra-node $0
EOF
  exit 1
fi

# --- keys --------------------------------------------------------------------
# Generated on first run rather than committed — throwaway credentials for a
# single-party offline head.
if [[ ! -f "$KEY.sk" ]]; then
  echo "generating hydra key pair -> $KEY.{sk,vk}" >&2
  mkdir -p "$CREDENTIALS_DIR"
  "$BIN" gen-hydra-key --output-file "$KEY"
fi

mkdir -p "$PERSISTENCE_DIR"

echo "hydra-node $("$BIN" --version)" >&2
echo "  api          :$API_PORT" >&2
echo "  initial-utxo $INITIAL_UTXO" >&2
echo "  persistence  $PERSISTENCE_DIR" >&2

exec "$BIN" \
  --node-id "$NODE_ID" \
  --api-host 0.0.0.0 \
  --api-port "$API_PORT" \
  --listen "0.0.0.0:$LISTEN_PORT" \
  --monitoring-port "$MONITORING_PORT" \
  --hydra-signing-key "$KEY.sk" \
  --persistence-dir "$PERSISTENCE_DIR" \
  --persistence-rotate-after 20000 \
  --offline-head-seed "$HEAD_SEED" \
  --ledger-protocol-parameters "$PROTOCOL_PARAMETERS" \
  --initial-utxo "$INITIAL_UTXO" \
  --ledger-genesis "$LEDGER_GENESIS"
