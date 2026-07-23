/**
 * Step 1 — open the head.
 *
 * Posts a real InitTx to preprod. hydra-node v2 removed the commit phase
 * (ADR-33), so a single-party head goes straight to Open; there is no
 * HeadIsInitializing and no Committed.
 *
 *   pnpm tsx infra/hydra-preprod/flow/1-init.mts
 */
import { connect, summary, waitFor, HydraHeadTag } from './record.mts'

const bridge = await connect()

console.log(`node ${bridge.nodeVersion} | synced=${bridge.syncedStatus}`)

const info = await bridge.headInfo()
if (info.headStatus !== 'Idle') {
	console.error(`head is already ${info.headStatus} (id ${info.headId}) — nothing to init`)
	process.exit(1)
}

console.log('\nsending Init (posts InitTx to preprod)…')
const opened = waitFor(bridge, p => p.tag === HydraHeadTag.HeadIsOpen, 'HeadIsOpen')
bridge.commands.init()

const payload = await opened
console.log('\n✓ head open')
console.log('  headId :', (payload as { headId: string }).headId)
console.log('  parties:', JSON.stringify((payload as { parties: unknown }).parties))

// v2 HeadIsOpen carries `parties`, not `utxo` — the v1 field is gone.
if ('utxo' in payload) console.error('  ⚠️  unexpected `utxo` field on HeadIsOpen')
if (!('parties' in payload)) console.error('  ⚠️  missing `parties` field on HeadIsOpen')

summary()
await bridge.disconnect()
process.exit(0)
