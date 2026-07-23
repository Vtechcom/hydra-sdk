#!/usr/bin/env bash
# Make a Dockerised cardano-node's socket reachable from the host.
#
# Only needed when cardano-node runs in Docker Desktop on macOS/Windows: the
# bind-mounted node.socket is visible on the host but not connectable, because
# the listening end lives inside the Linux VM. On native Linux, or with a
# cardano-node running directly on the host, skip this and point
# CARDANO_NODE_SOCKET_PATH straight at the real socket.
#
#   ./bridge-up.sh          # start both hops
#   ./bridge-up.sh --stop   # tear down
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

CONTAINER="${CARDANO_SOCAT_CONTAINER:-cardano-socket-bridge}"
# Host directory bind-mounted into the cardano-node container, i.e. the one
# holding node.socket. Required — there is no sensible default.
NODE_DIR="${CARDANO_NODE_DIR:?set CARDANO_NODE_DIR to the directory holding node.socket}"
SOCKET_IN_CONTAINER="${CARDANO_NODE_SOCKET_IN_CONTAINER:-/workspace/node.socket}"
TCP_PORT="${CARDANO_SOCKET_TCP_PORT:-3001}"
HOST_SOCKET="${CARDANO_NODE_SOCKET_PATH:-/tmp/cardano-node-preprod.socket}"
PIDFILE="$DIR/.bridge.pid"

stop() {
  if [[ -f "$PIDFILE" ]]; then
    kill "$(cat "$PIDFILE")" 2>/dev/null || true
    rm -f "$PIDFILE"
    echo "stopped host bridge" >&2
  fi
  docker rm -f "$CONTAINER" >/dev/null 2>&1 && echo "removed $CONTAINER" >&2 || true
  rm -f "$HOST_SOCKET"
}

if [[ "${1:-}" == "--stop" ]]; then
  stop
  exit 0
fi

stop  # idempotent restart

# Hop 1 — inside the VM: node.socket -> TCP
docker run -d --name "$CONTAINER" \
  -v "$NODE_DIR:/workspace" \
  -p "$TCP_PORT:$TCP_PORT" \
  alpine/socat:latest \
  "TCP-LISTEN:$TCP_PORT,fork,reuseaddr" "UNIX-CONNECT:$SOCKET_IN_CONTAINER" >/dev/null

# Hop 2 — on the host: TCP -> unix socket hydra-node can open.
# Detach fully: inheriting this shell's stdout would keep the pipe open and make
# callers (and CI) hang waiting for EOF.
LOGFILE="$DIR/.bridge.log"
node "$DIR/socket-bridge.mjs" --socket "$HOST_SOCKET" --port "$TCP_PORT" >"$LOGFILE" 2>&1 &
echo $! > "$PIDFILE"
disown 2>/dev/null || true

sleep 1
[[ -S "$HOST_SOCKET" ]] || { echo "✗ host socket was not created: $HOST_SOCKET" >&2; exit 1; }

cat >&2 <<EOF
socket bridge up
  container   $CONTAINER  ($SOCKET_IN_CONTAINER -> :$TCP_PORT)
  host socket $HOST_SOCKET

Point hydra-node at it:
  CARDANO_NODE_SOCKET_PATH=$HOST_SOCKET ./run-online.sh
EOF
