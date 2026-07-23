#!/usr/bin/env bash
# Regenerate protocol-parameters.json (the Head's L2 ledger) from a live node.
#
# Takes L1 parameters verbatim — so script costs and size limits inside the head
# match mainnet-like behaviour — then zeroes the economics that make no sense on
# L2: there is no fee market and no min-UTxO deposit inside a Head.
#
# Re-run this after a hard fork: PV11 (van Rossem) repriced Plutus builtins, and
# a stale cost model silently skews every ExUnits estimate.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

MAGIC="${CARDANO_TESTNET_MAGIC:-1}"
CONTAINER="${CARDANO_NODE_CONTAINER:-cardano-node}"
SOCKET_IN_CONTAINER="${CARDANO_NODE_SOCKET_IN_CONTAINER:-/workspace/node.socket}"

if command -v cardano-cli >/dev/null 2>&1; then
  QUERY=(cardano-cli query protocol-parameters --testnet-magic "$MAGIC"
         --socket-path "${CARDANO_NODE_SOCKET_PATH:?set CARDANO_NODE_SOCKET_PATH}")
else
  echo "cardano-cli not on PATH — querying through docker exec $CONTAINER" >&2
  QUERY=(docker exec "$CONTAINER" cardano-cli query protocol-parameters
         --testnet-magic "$MAGIC" --socket-path "$SOCKET_IN_CONTAINER")
fi

"${QUERY[@]}" > "$DIR/.pp-l1.json"

node -e "
const fs=require('fs');
const pp=JSON.parse(fs.readFileSync('$DIR/.pp-l1.json','utf8'));
pp.txFeeFixed=0; pp.txFeePerByte=0; pp.utxoCostPerByte=0;
fs.writeFileSync('$DIR/protocol-parameters.json', JSON.stringify(pp,null,2)+'\n');
console.log('protocol-parameters.json <- live L1, fees+minUTxO zeroed');
console.log('  protocolVersion', JSON.stringify(pp.protocolVersion), '| PlutusV3 cost entries', pp.costModels.PlutusV3.length);
"
rm -f "$DIR/.pp-l1.json"
