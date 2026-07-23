#!/usr/bin/env bash
# Wipe persistence and boot a fresh head, re-seeded from --initial-utxo.
# Respects the same env overrides as run-offline.sh.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_ID="${HYDRA_NODE_ID:-1}"
PERSISTENCE_DIR="${HYDRA_PERSISTENCE_DIR:-$DIR/persistence/node-$NODE_ID}"
echo "clearing $PERSISTENCE_DIR" >&2
rm -rf "$PERSISTENCE_DIR"
exec "$DIR/run-offline.sh"
