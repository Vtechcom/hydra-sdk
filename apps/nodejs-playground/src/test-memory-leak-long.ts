/**
 * Long-Running Memory Stability Test
 *
 * Runs 10,000 iterations to check if WASM heap stabilizes or grows unboundedly.
 * Tracks leak rate per 500-iteration batch to detect stabilization.
 *
 * Usage:
 *   cd apps/nodejs-playground
 *   node --expose-gc --import tsx src/test-memory-leak-long.ts
 */

import { TxBuilder } from '@hydra-sdk/transaction'

const ITERATIONS = 10000
const BATCH_SIZE = 500

function mb(b: number): string { return (b / 1024 / 1024).toFixed(2) + ' MB' }
function kb(b: number): string { return (b / 1024).toFixed(1) + ' KB' }

function getMem() {
	const m = process.memoryUsage()
	return { heapUsed: m.heapUsed, heapTotal: m.heapTotal, external: m.external, rss: m.rss }
}

function tryGC() { if (typeof globalThis.gc === 'function') globalThis.gc() }

// Match real test: dummy UTxO with same structure
const dummyUtxo = {
	input: { outputIndex: 0, txHash: '94c19acf3fc85dec3dc4217f615a75d8d3079ab34bd31a31ef0e49a3c3dc1582' },
	output: {
		address: 'addr_test1qpc6r7e9pyxdp4dkheztfpvlmf58cm5wwm4pa703cn2fqkpr3kmsd09nqvtg0xa5784nkgux9paaekal6shrrl07nwjszaqqx4',
		amount: [{ unit: 'lovelace', quantity: '200000000' }],
	},
}

const OUTPUT_ADDRESS = 'addr_test1wpqkx88tvs3897ljpgk7q43mguhsmq700r99ex6hpry5h8c3puxdp'
const PUBKEY_HASH = '66da057db8d38a06b9e47e6f2f30c5d9f86c5a4a11a3c4da7d817e97'

async function main() {
	console.log('╔══════════════════════════════════════════════════════════╗')
	console.log('║     LONG-RUNNING MEMORY STABILITY TEST (10K iter)      ║')
	console.log('╚══════════════════════════════════════════════════════════╝\n')

	tryGC()
	const baseline = getMem()
	let prevBatchExt = baseline.external
	const batchRates: number[] = []

	console.log(`BASELINE: ext=${mb(baseline.external)} heap=${mb(baseline.heapUsed)}\n`)
	console.log('Batch   | End ext   | Batch Δ  | Rate/iter | Cumulative Δ | Trend')
	console.log('─'.repeat(80))

	const startTime = Date.now()

	for (let i = 0; i < ITERATIONS; i++) {
		const txBuilder = new TxBuilder({ isHydra: true, params: { minFeeA: 44, minFeeB: 173201 } })
		const tx = await txBuilder
			.setInputs([dummyUtxo])
			.addOutput({ address: OUTPUT_ADDRESS, amount: [{ unit: 'lovelace', quantity: String(50_000_000) }] })
			.changeAddress(dummyUtxo.output.address)
			.requiredSignerHash(PUBKEY_HASH)
			.complete()
		txBuilder.dispose()
		tx.free()

		// Log at end of each batch
		if ((i + 1) % BATCH_SIZE === 0) {
			tryGC()
			const mem = getMem()
			const batchDelta = mem.external - prevBatchExt
			const rateKB = batchDelta / 1024 / BATCH_SIZE
			const cumDelta = mem.external - baseline.external
			batchRates.push(rateKB)

			// Trend detection: compare last 3 batch rates
			let trend = ''
			if (batchRates.length >= 4) {
				const recent = batchRates.slice(-3)
				const avgRecent = recent.reduce((a, b) => a + b, 0) / 3
				trend = rateKB < avgRecent * 0.5 ? '📉 STABILIZING' :
				        rateKB > avgRecent * 1.5 ? '📈 GROWING' : '➡️  STEADY'
			}

			const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
			console.log(
				`${String(i + 1).padStart(5)}/${ITERATIONS} | ` +
				`${mb(mem.external).padStart(9)} | ` +
				`${batchDelta >= 0 ? '+' : ''}${mb(Math.abs(batchDelta)).padStart(8)} | ` +
				`${kb(batchDelta / BATCH_SIZE).padStart(6)}/iter | ` +
				`${cumDelta >= 0 ? '+' : ''}${mb(Math.abs(cumDelta)).padStart(11)} | ` +
				`${trend.padEnd(16)} | ${elapsed}s`
			)

			prevBatchExt = mem.external
		}
	}

	// Final GC
	tryGC()
	await new Promise(r => setTimeout(r, 500))
	tryGC()
	const final = getMem()

	console.log('\n' + '═'.repeat(80))
	console.log('FINAL SUMMARY:')
	console.log(`  External: ${mb(baseline.external)} → ${mb(final.external)}  Δ ${mb(final.external - baseline.external)}`)
	console.log(`  JS Heap:  ${mb(baseline.heapUsed)} → ${mb(final.heapUsed)}`)
	console.log(`  RSS:      ${mb(baseline.rss)} → ${mb(final.rss)}`)

	// Analyze batch rates
	if (batchRates.length >= 3) {
		const first3 = batchRates.slice(0, 3)
		const last3 = batchRates.slice(-3)
		const avgFirst = first3.reduce((a, b) => a + b, 0) / 3
		const avgLast = last3.reduce((a, b) => a + b, 0) / 3
		console.log(`\n  Avg leak rate (first 3 batches): ${kb(avgFirst * 1024)}/iter`)
		console.log(`  Avg leak rate (last 3 batches):  ${kb(avgLast * 1024)}/iter`)
		if (avgLast < avgFirst * 0.3) {
			console.log(`\n  ✅ VERDICT: WASM heap IS stabilizing — rate dropped ${((1 - avgLast/avgFirst) * 100).toFixed(0)}%`)
			console.log(`     Memory will plateau at around ${kb(final.external / 1024)}`)
		} else if (avgLast < avgFirst * 0.7) {
			console.log(`\n  ⚠️  VERDICT: WASM heap slowly stabilizing — rate dropped ${((1 - avgLast/avgFirst) * 100).toFixed(0)}%`)
		} else {
			console.log(`\n  ❌ VERDICT: WASM heap NOT stabilizing — continues growing linearly`)
			console.log(`     After 100K iterations ~${kb(final.external / 1024 * 10)} would be used`)
		}
	}
}

main().catch(err => { console.error('Error:', err); process.exit(1) })
