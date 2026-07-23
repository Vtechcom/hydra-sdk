/**
 * Step 3 — recover a deposit that never made it into the head.
 *
 * A deposit expires when the chain does not advance through its activation
 * window in time; the funds are then only reclaimable through recovery. This
 * exercises `DELETE /commits/{txId}` and the `CommitRecovered` output, neither
 * of which an offline head can produce.
 *
 *   pnpm tsx infra/hydra-preprod/flow/3-recover.mts [depositTxId]
 *
 * With no argument it recovers whatever `GET /commits` reports as pending.
 */
import { connect, summary, waitFor, HydraHeadTag } from './record.mts'
import type { HydraPayload } from './record.mts'

const bridge = await connect()
await waitFor(bridge, p => p.tag === HydraHeadTag.Greetings, 'Greetings', 15_000)

const pending = await bridge.pendingDeposits()
console.log('pending deposits:', pending.length ? pending.join(', ') : '(none)')

const depositTxId = process.argv[2] ?? pending[0]
if (!depositTxId) {
	console.error('nothing to recover')
	process.exit(1)
}

console.log(`\nDELETE /commits/${depositTxId} …`)
const recovered = waitFor<HydraPayload & { recoveredTxId: string; recoveredUTxO: Record<string, unknown> }>(
	bridge,
	p => p.tag === HydraHeadTag.CommitRecovered,
	'CommitRecovered'
)

const response = await bridge.recoverDeposit(depositTxId)
console.log('  ->', JSON.stringify(response))

const payload = await recovered
console.log('\n✓ recovered')
console.log('  recoveredTxId :', payload.recoveredTxId)
console.log('  recoveredUTxO :', Object.keys(payload.recoveredUTxO).length, 'entries')

console.log('\npending after recovery:', (await bridge.pendingDeposits()).length)

summary()
await bridge.disconnect()
process.exit(0)
