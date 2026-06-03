/**
 * Minimal Memory Leak Test – Isolate build path only (no signing, no Blockfrost)
 *
 * Usage:
 *   cd apps/nodejs-playground
 *   pnpm tsx src/test-memory-leak-minimal.ts
 *   (or with --expose-gc for manual GC)
 */

import { TxBuilder } from '@hydra-sdk/transaction'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

const ITERATIONS = 2000
const LOG_INTERVAL = 100

function mb(bytes: number): string {
	return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

function getMem() {
	const m = process.memoryUsage()
	return { heapUsed: m.heapUsed, heapTotal: m.heapTotal, external: m.external, rss: m.rss }
}

function tryGC() {
	if (typeof globalThis.gc === 'function') globalThis.gc()
}

// Dummy UTxO matching the real test
const dummyUtxo = {
	input: {
		outputIndex: 0,
		txHash: '94c19acf3fc85dec3dc4217f615a75d8d3079ab34bd31a31ef0e49a3c3dc1582',
	},
	output: {
		address:
			'addr_test1qpc6r7e9pyxdp4dkheztfpvlmf58cm5wwm4pa703cn2fqkpr3kmsd09nqvtg0xa5784nkgux9paaekal6shrrl07nwjszaqqx4',
		amount: [{ unit: 'lovelace', quantity: '200000000' }],
	},
}

const OUTPUT_ADDRESS = 'addr_test1wpqkx88tvs3897ljpgk7q43mguhsmq700r99ex6hpry5h8c3puxdp'
const PUBKEY_HASH = '66da057db8d38a06b9e47e6f2f30c5d9f86c5a4a11a3c4da7d817e97'

async function main() {
	console.log('=== MINIMAL TEST: Build only (no sign, no Blockfrost) ===\n')

	tryGC()
	const baseline = getMem()
	console.log('BASELINE:', `heap=${mb(baseline.heapUsed)} ext=${mb(baseline.external)} rss=${mb(baseline.rss)}\n`)

	const startTime = Date.now()

	for (let i = 0; i < ITERATIONS; i++) {
		const txBuilder = new TxBuilder({
			isHydra: true,
			params: { minFeeA: 44, minFeeB: 173201 },
		})

		const tx = await txBuilder
			.setInputs([dummyUtxo])
			.addOutput({
				address: OUTPUT_ADDRESS,
				amount: [{ unit: 'lovelace', quantity: String(50_000_000) }],
			})
			.changeAddress(dummyUtxo.output.address)
			.requiredSignerHash(PUBKEY_HASH)
			.complete()

		// Cleanup
		txBuilder.dispose()
		tx.free()

		if ((i + 1) % LOG_INTERVAL === 0 || i === 0) {
			const mem = getMem()
			const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
			const dExt = mem.external - baseline.external
			console.log(
				`[${String(i + 1).padStart(4)}/${ITERATIONS}] ` +
					`heap=${mb(mem.heapUsed)} ext=${mb(mem.external)} (Δ${dExt >= 0 ? '+' : ''}${mb(Math.abs(dExt))}) | ${elapsed}s`,
			)
		}
	}

	tryGC()
	await new Promise(r => setTimeout(r, 500))
	tryGC()

	const final = getMem()
	const dExt = final.external - baseline.external

	console.log('\n=== FINAL (after GC) ===')
	console.log(`heapUsed  : ${mb(baseline.heapUsed)} → ${mb(final.heapUsed)}  Δ ${dExt >= 0 ? '+' : ''}${mb(Math.abs(final.heapUsed - baseline.heapUsed))}`)
	console.log(`external  : ${mb(baseline.external)} → ${mb(final.external)}  Δ ${dExt >= 0 ? '+' : ''}${mb(Math.abs(dExt))}`)
	console.log(`rss       : ${mb(baseline.rss)} → ${mb(final.rss)}`)
	console.log(`\nExternal leak rate: ${(dExt / 1024 / ITERATIONS).toFixed(2)} KB/iter`)
	console.log(dExt < 5 * 1024 * 1024 ? '✅ External OK' : '❌ External LEAK')
}

main().catch(err => {
	console.error('Error:', err)
	process.exit(1)
})
