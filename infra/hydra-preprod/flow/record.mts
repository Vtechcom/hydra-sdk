/**
 * Drive a real Hydra head on preprod through its lifecycle, recording every
 * WebSocket payload verbatim.
 *
 * The recording is the point: the bridge's L1 payload types are hand-derived
 * from the hydra Haskell source and have never been checked against a live
 * node. The offline e2e run found four such types wrong, so the L1 ones are
 * suspect until proven otherwise.
 *
 * Output goes to ./recordings/<step>.jsonl — one JSON payload per line.
 *
 *   pnpm tsx infra/hydra-preprod/flow/record.mts <step>
 *
 * Steps are separate invocations on purpose: each posts real transactions to
 * preprod, so they must be run deliberately, not as one unattended script.
 */
import { appendFileSync, mkdirSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HydraBridge, HydraHeadTag } from '@hydra-sdk/bridge'
import type { HydraPayload } from '@hydra-sdk/bridge'

const API_PORT = Number(process.env.HYDRA_API_PORT ?? 4004)
const HERE = dirname(fileURLToPath(import.meta.url))
// Name the recording after the entry script, not argv[2] — steps take their own
// arguments and would otherwise scatter recordings under unrelated names.
const step = process.env.STEP ?? (process.argv[1] ? basename(process.argv[1]).replace(/\.mts$/, '') : 'unnamed')

const outDir = join(HERE, 'recordings')
mkdirSync(outDir, { recursive: true })
const outFile = join(outDir, `${step}.jsonl`)

const seen = new Map<string, number>()

export const record = (payload: HydraPayload) => {
	const tag = payload.tag ?? '(untagged)'
	seen.set(tag, (seen.get(tag) ?? 0) + 1)
	appendFileSync(outFile, JSON.stringify(payload) + '\n')
	const detail = 'seq' in payload ? ` seq=${(payload as { seq: number }).seq}` : ' (untimed)'
	console.log(`  ← ${tag}${detail}`)
}

export const summary = () => {
	console.log(`\n  recorded → ${outFile}`)
	for (const [tag, n] of [...seen].sort()) console.log(`    ${tag} ×${n}`)
}

export const connect = async () => {
	const bridge = new HydraBridge({ url: `ws://localhost:${API_PORT}`, history: false })
	bridge.events.on('onMessage', record)
	await bridge.connect()
	return bridge
}

/** Resolve when `predicate` matches, reject on timeout. */
export const waitFor = <T extends HydraPayload>(
	bridge: HydraBridge,
	predicate: (p: HydraPayload) => boolean,
	label: string,
	timeout = 180_000
): Promise<T> =>
	new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			bridge.events.off('onMessage', handler)
			reject(new Error(`timed out after ${timeout / 1000}s waiting for ${label}`))
		}, timeout)
		const handler = (p: HydraPayload) => {
			if (!predicate(p)) return
			clearTimeout(timer)
			bridge.events.off('onMessage', handler)
			resolve(p as T)
		}
		bridge.events.on('onMessage', handler)
	})

export { HydraHeadTag, type HydraPayload }
