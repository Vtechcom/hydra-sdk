/**
 * Memory Leak Test Script
 *
 * Builds a transaction and signs it ~2000 times consecutively WITHOUT submitting,
 * tracking heap usage to detect memory leaks.
 *
 * Usage:
 *   cd apps/nodejs-playground
 *   node --expose-gc --import tsx src/test-memory-leak.ts
 *   (--expose-gc enables manual garbage collection for more accurate measurement)
 */

import { DatumUtils, AppWallet, ProviderUtils, NETWORK_ID, Resolver } from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const isValidAddress = (address: string | Uint8Array, type: 'bech32' | 'hex' | 'bytes' = 'bech32'): boolean => {
	try {
		let wasmAddr: CardanoWASM.Address | null = null
		if (typeof address === 'string') {
			if (address.length === 0) return false
			if (type === 'bech32') {
				wasmAddr = CardanoWASM.Address.from_bech32(address)
			} else if (type === 'hex') {
				wasmAddr = CardanoWASM.Address.from_hex(address)
			} else {
				return false
			}
		} else if (address instanceof Uint8Array) {
			if (address.length === 0) return false
			wasmAddr = CardanoWASM.Address.from_bytes(address)
		} else {
			return false
		}
		if (!wasmAddr) return false
		return wasmAddr.is_malformed() === false
	} catch (e) {
		return false
	}
}

function getPubkeyHashFromAddress(address: string): string | null {
	try {
		if (!isValidAddress(address)) {
			return null
		}
		const wasmAddr = CardanoWASM.Address.from_bech32(address)
		const paymentCred = wasmAddr.payment_cred()?.to_keyhash()?.to_hex()
		return paymentCred || null
	} catch {
		return null
	}
}

// ---------------------------------------------------------------------------
// Config – same parameters as build-tx.ts
// ---------------------------------------------------------------------------

const CONFIG = {
	ITERATIONS: 2000,
	LOG_INTERVAL: 100, // log memory every N iterations
	GC_INTERVAL: 500, // force GC every N iterations to check if memory is reclaimable
	LEAK_THRESHOLD_KB_PER_ITER: 5, // warn if leak > X KB per iteration
	LEAK_THRESHOLD_MB_TOTAL: 15, // warn if total heap growth after GC > X MB

	BLOCKFROST_API_KEY: 'preprod2luHm2r4rVpgWsIomeLUBU6aoUaMK9Lv',
	NETWORK: 'preprod' as const,

	MNEMONIC:
		'rule oblige upon genre boat early absurd plate news iron mask vivid strategy hamster artwork model juice junk mechanic opera screen coach fall figure',

	INPUT_ADDRESS: 'addr_test1qpc6r7e9pyxdp4dkheztfpvlmf58cm5wwm4pa703cn2fqkpr3kmsd09nqvtg0xa5784nkgux9paaekal6shrrl07nwjszaqqx4',

	OUTPUT_ADDRESS: 'addr_test1wpqkx88tvs3897ljpgk7q43mguhsmq700r99ex6hpry5h8c3puxdp',

	MIN_FEE_A: 44,
	MIN_FEE_B: 173201,
}

// ---------------------------------------------------------------------------
// Memory helpers
// ---------------------------------------------------------------------------

function mb(bytes: number): string {
	return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

function getMem(): {
	heapUsed: number
	heapTotal: number
	external: number
	rss: number
} {
	const m = process.memoryUsage()
	return {
		heapUsed: m.heapUsed,
		heapTotal: m.heapTotal,
		external: m.external,
		rss: m.rss,
	}
}

function tryGC(): void {
	if (typeof globalThis.gc === 'function') {
		globalThis.gc()
	}
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	console.log('╔══════════════════════════════════════════════════════╗')
	console.log('║        MEMORY LEAK TEST – Build + Sign Loop        ║')
	console.log('╠══════════════════════════════════════════════════════╣')
	console.log(`║  Iterations : ${CONFIG.ITERATIONS.toString().padStart(37)}║`)
	console.log(`║  GC exposed : ${(typeof globalThis.gc === 'function').toString().padStart(37)}║`)
	console.log('╚══════════════════════════════════════════════════════╝\n')

	// --- Setup: provider, wallet (do once) ---
	const blockfrostProvider = new ProviderUtils.BlockfrostProvider({
		apiKey: CONFIG.BLOCKFROST_API_KEY,
		network: CONFIG.NETWORK,
	})

	const mnemonicWords = CONFIG.MNEMONIC.trim().split(/\s+/)
	const wallet = new AppWallet({
		networkId: NETWORK_ID.PREPROD,
		key: {
			type: 'mnemonic',
			words: mnemonicWords,
		},
		fetcher: blockfrostProvider.fetcher,
		submitter: blockfrostProvider.submitter,
	})

	// Fetch UTxOs once – outside the loop
	const utxos = await wallet.queryUTxOs(CONFIG.INPUT_ADDRESS)
	console.log(`📦 Fetched ${utxos.length} UTxO(s) for ${CONFIG.INPUT_ADDRESS.substring(0, 20)}…\n`)

	// Derive pubkey-hash once
	const pubkeyHash = getPubkeyHashFromAddress(CONFIG.INPUT_ADDRESS)!

	// --- Baseline memory ---
	tryGC()
	const baseline = getMem()
	console.log('📊 BASELINE MEMORY (after GC):')
	console.log(`   heapUsed  : ${mb(baseline.heapUsed)}`)
	console.log(`   heapTotal : ${mb(baseline.heapTotal)}`)
	console.log(`   external  : ${mb(baseline.external)}`)
	console.log(`   RSS       : ${mb(baseline.rss)}`)
	console.log('')

	// --- Tracking ---
	const samples: {
		iteration: number
		heapUsed: number
		heapTotal: number
		external: number
		rss: number
	}[] = []

	const startTime = Date.now()

	// --- Main loop ---
	for (let i = 0; i < CONFIG.ITERATIONS; i++) {
		// ── Build tx ──
		const datum = DatumUtils.mkConstr(0, [DatumUtils.mkBytes(pubkeyHash), DatumUtils.mkInt(Date.now())])

		const txBuilder = new TxBuilder({
			isHydra: true,
			params: {
				minFeeA: CONFIG.MIN_FEE_A,
				minFeeB: CONFIG.MIN_FEE_B,
			},
		})

		const tx = await txBuilder
			.setInputs(utxos)
			.addOutput({
				address: CONFIG.OUTPUT_ADDRESS,
				amount: [{ unit: 'lovelace', quantity: String(100_000_000) }],
			})
			.txOutInlineDatumValue(datum)
			.changeAddress(CONFIG.INPUT_ADDRESS)
			.requiredSignerHash(pubkeyHash)
			.complete()

		// ── Sign tx ──
		const signedCbor = await wallet.signTx(tx.to_hex())

		// ── Resolve hash (optional, to stress wasm) ──
		const txHash = await Resolver.resolveTxHash(signedCbor)

		// ── 🧹 Cleanup WASM memory (prevents external memory leak) ──
		txBuilder.dispose()
		tx.free()

		// ── Log memory at intervals ──
		if ((i + 1) % CONFIG.LOG_INTERVAL === 0 || i === 0 || i === CONFIG.ITERATIONS - 1) {
			const mem = getMem()
			samples.push({
				iteration: i + 1,
				heapUsed: mem.heapUsed,
				heapTotal: mem.heapTotal,
				external: mem.external,
				rss: mem.rss,
			})

			const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
			const deltaHeap = mem.heapUsed - baseline.heapUsed
			const sign = deltaHeap >= 0 ? '+' : ''
			const deltaExt = mem.external - baseline.external
			const signExt = deltaExt >= 0 ? '+' : ''

			console.log(
				`[${String(i + 1).padStart(4)}/${CONFIG.ITERATIONS}] ` +
					`heap: ${mb(mem.heapUsed)} (${sign}${mb(Math.abs(deltaHeap))}) | ` +
					`ext: ${mb(mem.external)} (${signExt}${mb(Math.abs(deltaExt))}) | ` +
					`rss: ${mb(mem.rss)} | ` +
					`${elapsed}s`,
			)
		}

		// ── Periodic forced GC to test reclaimability ──
		if ((i + 1) % CONFIG.GC_INTERVAL === 0) {
			const beforeGc = getMem()
			tryGC()
			const afterGc = getMem()
			const reclaimed = beforeGc.heapUsed - afterGc.heapUsed
			const extReclaimed = beforeGc.external - afterGc.external
			console.log(
				`  🧹 GC @${i + 1}: heap ${mb(beforeGc.heapUsed)} → ${mb(afterGc.heapUsed)} ` +
					`(reclaimed ${mb(reclaimed)}) | ` +
					`ext ${mb(beforeGc.external)} → ${mb(afterGc.external)} ` +
					`(reclaimed ${mb(extReclaimed)})`,
			)
		}
	}

	const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)

	// --- Final GC & memory ---
	console.log('\n🧹 Forcing GC before FINAL measurement…')
	tryGC()
	await new Promise((r) => setTimeout(r, 500)) // let GC settle
	tryGC()

	const final = getMem()
	const deltaHeapUsed = final.heapUsed - baseline.heapUsed
	const deltaHeapTotal = final.heapTotal - baseline.heapTotal
	const deltaExternal = final.external - baseline.external
	const deltaRss = final.rss - baseline.rss

	// Leak rates (KB per iteration)
	const heapLeakRateKB = deltaHeapUsed / 1024 / CONFIG.ITERATIONS
	const extLeakRateKB = deltaExternal / 1024 / CONFIG.ITERATIONS
	const rssLeakRateKB = deltaRss / 1024 / CONFIG.ITERATIONS

	// --- Report ---
	console.log('\n╔══════════════════════════════════════════════════════════╗')
	console.log('║                     FINAL REPORT                        ║')
	console.log('╠══════════════════════════════════════════════════════════╣')
	console.log(`║  Total iterations  : ${String(CONFIG.ITERATIONS).padStart(36)}║`)
	console.log(`║  Total time        : ${(totalTime + 's').padStart(36)}║`)
	console.log(`║  Avg per iteration : ${((Number(totalTime) / CONFIG.ITERATIONS) * 1000).toFixed(1).padStart(32)} ms║`)
	console.log('╠══════════════════════════════════════════════════════════╣')
	console.log('║  BASELINE → FINAL (both after forced GC):               ║')
	console.log('╠══════════════════════════════════════════════════════════╣')

	const fmtRow = (label: string, base: number, fin: number, delta: number, rateKB: number) => {
		const sign = delta >= 0 ? '+' : ''
		const deltaStr = `${sign}${mb(Math.abs(delta))}`
		const rateStr = `${sign}${rateKB.toFixed(2)} KB/iter`
		console.log(
			`║  ${label.padEnd(9)} ${mb(base).padStart(9)} → ${mb(fin).padStart(9)}  ` +
				`Δ${deltaStr.padStart(10)}  ${rateStr.padStart(16)} ║`,
		)
	}

	fmtRow('heapUsed', baseline.heapUsed, final.heapUsed, deltaHeapUsed, heapLeakRateKB)
	fmtRow('heapTotal', baseline.heapTotal, final.heapTotal, deltaHeapTotal, deltaHeapTotal / 1024 / CONFIG.ITERATIONS)
	fmtRow('external', baseline.external, final.external, deltaExternal, extLeakRateKB)
	fmtRow('RSS', baseline.rss, final.rss, deltaRss, rssLeakRateKB)
	console.log('╚══════════════════════════════════════════════════════════╝')

	// --- Multi-faceted verdict ---
	console.log('\n🔍 VERDICT (so sánh baseline vs final, cả hai đều sau GC):')
	console.log('━'.repeat(58))

	// 1. JS heap
	const heapOK = deltaHeapUsed < CONFIG.LEAK_THRESHOLD_MB_TOTAL * 1024 * 1024
	console.log(
		`   JS Heap (heapUsed):  ${heapOK ? '✅ OK' : '❌ LEAK'}  ` +
			`(Δ ${deltaHeapUsed >= 0 ? '+' : ''}${mb(Math.abs(deltaHeapUsed))}, ` +
			`${deltaHeapUsed >= 0 ? '+' : ''}${heapLeakRateKB.toFixed(2)} KB/iter)`,
	)
	if (!heapOK) {
		console.log(`      → JavaScript objects không được GC giải phóng.`)
	} else {
		console.log(`      → V8 GC hoạt động bình thường, JS objects được cleanup.`)
	}

	// 2. External (WASM/native)
	const extOK = deltaExternal < CONFIG.LEAK_THRESHOLD_MB_TOTAL * 1024 * 1024
	console.log(
		`   External (WASM):     ${extOK ? '✅ OK' : '❌ LEAK'}  ` +
			`(Δ ${deltaExternal >= 0 ? '+' : ''}${mb(Math.abs(deltaExternal))}, ` +
			`${deltaExternal >= 0 ? '+' : ''}${extLeakRateKB.toFixed(2)} KB/iter)`,
	)
	if (!extOK) {
		console.log(`      → WASM/native memory không được giải phóng sau GC.`)
		console.log(`      → Nghi ngờ: CardanoWASM objects (Address, TxBody, …) không được .free().`)
	}

	// 3. RSS
	const rssOK = deltaRss < CONFIG.LEAK_THRESHOLD_MB_TOTAL * 2 * 1024 * 1024
	console.log(
		`   RSS (OS memory):     ${rssOK ? '✅ OK' : '⚠️  HIGH'}  ` +
			`(Δ ${deltaRss >= 0 ? '+' : ''}${mb(Math.abs(deltaRss))}, ` +
			`${deltaRss >= 0 ? '+' : ''}${rssLeakRateKB.toFixed(2)} KB/iter)`,
	)
	if (!rssOK) {
		console.log(`      → Tổng bộ nhớ OS tăng đáng kể (thường do external tăng).`)
	}

	// 4. Overall
	console.log('━'.repeat(58))
	if (heapOK && extOK) {
		console.log('   🎉 TỔNG KẾT: Không phát hiện memory leak.')
	} else if (heapOK && !extOK) {
		console.log('   ⚠️  TỔNG KẾT: JS heap ổn, NHƯNG WASM/native memory bị leak.')
		console.log(`   → Sau ${CONFIG.ITERATIONS} lần: ${mb(Math.abs(deltaExternal))} WASM memory không được thu hồi.`)
		console.log(`   → Sau 10,000 lần dự kiến leak ~${mb(Math.abs(extLeakRateKB) * 10000).replace(' MB', '')} MB.`)
	} else if (!heapOK && extOK) {
		console.log('   ⚠️  TỔNG KẾT: WASM ổn, NHƯNG JS heap bị leak.')
	} else {
		console.log('   ❌ TỔNG KẾT: Memory leak ở CẢ JS heap và WASM.')
	}
}

main().catch((err) => {
	console.error('❌ Error:', err)
	process.exit(1)
})
