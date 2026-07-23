/**
 * Step 2b — follow a pending deposit to finalization.
 *
 * Split out from 2-commit.mts because activation is gated on chain time:
 * a deposit only becomes Active once `chainTime > created + depositPeriod`, so
 * the wait is at least one deposit period and the submitting script should not
 * hold the connection open for it.
 *
 *   pnpm tsx infra/hydra-preprod/flow/2b-watch-deposit.mts
 */
import { connect, summary, waitFor, HydraHeadTag } from './record.mts'
import type { HydraPayload } from './record.mts'

const WINDOW_MS = 15 * 60 * 1000

const bridge = await connect()
await waitFor(bridge, p => p.tag === HydraHeadTag.Greetings, 'Greetings', 15_000)

const pending = await bridge.pendingDeposits()
console.log('pending deposits:', pending.length ? pending.join(', ') : '(none)')
if (!pending.length) {
	console.log('nothing to watch')
	process.exit(0)
}

// DepositExpired is a terminal outcome too — report it rather than hanging.
const settled = await Promise.race([
	waitFor(bridge, p => p.tag === HydraHeadTag.DepositActivated, 'DepositActivated', WINDOW_MS).then(
		() => 'activated' as const
	),
	waitFor(bridge, p => p.tag === HydraHeadTag.DepositExpired, 'DepositExpired', WINDOW_MS).then(
		() => 'expired' as const
	)
])

if (settled === 'expired') {
	console.error('\n✗ deposit expired before it could activate')
	console.error('  raise HYDRA_DEPOSIT_PERIOD and recover with 3-recover.mts')
	summary()
	process.exit(1)
}
console.log('  ✓ DepositActivated')

await waitFor(bridge, p => p.tag === HydraHeadTag.CommitApproved, 'CommitApproved', WINDOW_MS)
console.log('  ✓ CommitApproved')

const finalized = await waitFor<HydraPayload & { depositTxId: string }>(
	bridge,
	p => p.tag === HydraHeadTag.CommitFinalized,
	'CommitFinalized',
	WINDOW_MS
)
console.log('  ✓ CommitFinalized, depositTxId:', finalized.depositTxId)

const inHead = await bridge.querySnapshotUtxo()
const total = Object.values(inHead).reduce(
	(sum, o) => sum + Number((o as { value: { lovelace: number } }).value.lovelace ?? 0),
	0
)
console.log(`\nhead UTxO: ${Object.keys(inHead).length} entries, ${(total / 1e6).toFixed(2)} ADA`)

summary()
await bridge.disconnect()
process.exit(0)
