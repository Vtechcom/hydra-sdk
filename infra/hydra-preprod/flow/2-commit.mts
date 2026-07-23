/**
 * Step 2 — move funds into the open head (incremental deposit).
 *
 * hydra-node v2 has no commit phase: funds enter an already-open head through a
 * deposit transaction. This exercises the whole chain the offline head cannot:
 *
 *   POST /commit → sign → POST /cardano-transaction
 *     → CommitRecorded → DepositActivated → CommitApproved → CommitFinalized
 *
 * Four server-output types here have never been checked against a live node.
 *
 *   pnpm tsx infra/hydra-preprod/flow/2-commit.mts <txHash#ix>
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { connect, summary, waitFor, HydraHeadTag } from './record.mts'
import type { HydraPayload } from './record.mts'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, '../../..')
const ALICE = join(REPO, 'demo/2.0.0-alpha/credentials/alice')

const target = process.argv[2]
if (!target) {
	console.error('usage: 2-commit.mts <txHash#ix>   (a UTxO at alice’s address)')
	process.exit(1)
}

const cli = (...args: string[]) =>
	execFileSync('docker', ['exec', 'cardano-node', 'cardano-cli', ...args], { encoding: 'utf8' })

const address = readFileSync(join(ALICE, 'alice-funds.addr'), 'utf8').trim()

// cardano-cli's --output-json UTxO shape is already what hydra expects.
const l1Utxo = JSON.parse(
	cli('query', 'utxo', '--address', address, '--testnet-magic', '1',
		'--socket-path', '/workspace/node.socket', '--output-json')
)
const utxoToCommit = { [target]: l1Utxo[target] }
if (!l1Utxo[target]) {
	console.error(`${target} not found at ${address}`)
	process.exit(1)
}
console.log(`committing ${target} (${(l1Utxo[target].value.lovelace / 1e6).toFixed(2)} ADA)`)

const bridge = await connect()
await waitFor(bridge, p => p.tag === HydraHeadTag.Greetings, 'Greetings', 15_000)

// --- 1. ask the node to draft the deposit tx --------------------------------
console.log('\nPOST /commit …')
const draft = await bridge.commit({ utxoToCommit })
if (!draft) throw new Error('no draft returned')
console.log('  draft type:', draft.type)

// --- 2. sign it with the L1 key ---------------------------------------------
// The key is a raw ed25519 signing key in a cardano-cli envelope: 0x5820 CBOR
// prefix + 32 bytes.
const skHex = JSON.parse(readFileSync(join(ALICE, 'alice-funds.sk'), 'utf8')).cborHex.slice(4)
const sk = CardanoWASM.PrivateKey.from_normal_bytes(Buffer.from(skHex, 'hex'))

// FixedTransaction preserves the node's exact body bytes. Rebuilding the tx from
// a decoded body can re-encode CBOR differently and invalidate the signature.
const fixed = CardanoWASM.FixedTransaction.from_hex(draft.cborHex)
fixed.sign_and_add_vkey_signature(sk)
const signedHex = fixed.to_hex()
const depositTxId = fixed.transaction_hash().to_hex()
console.log('  signed, depositTxId:', depositTxId)

// --- 3. submit to L1 through the node ---------------------------------------
console.log('\nPOST /cardano-transaction …')
const recorded = waitFor(bridge, p => p.tag === HydraHeadTag.CommitRecorded, 'CommitRecorded')
const submitted = await bridge.submitCardanoTransaction({
	type: 'Witnessed Tx ConwayEra',
	description: 'e2e deposit',
	cborHex: signedHex
})
console.log('  ->', JSON.stringify(submitted))

// --- 4. hand off ------------------------------------------------------------
// Activation is gated on chain time (chainTime > created + depositPeriod), so
// the wait belongs in a separate process rather than holding this one open.
await recorded
console.log('  ✓ CommitRecorded')
console.log('\nnext: pnpm tsx infra/hydra-preprod/flow/2b-watch-deposit.mts')

summary()
await bridge.disconnect()
process.exit(0)
