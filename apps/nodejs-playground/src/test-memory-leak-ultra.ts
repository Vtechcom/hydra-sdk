/**
 * Ultra-minimal test: direct CardanoWASM usage, no TxBuilder wrapper
 *
 * Usage: node --expose-gc --import tsx src/test-memory-leak-ultra.ts
 */

import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

const ITERATIONS = 5000
const LOG_INTERVAL = 500

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

async function main() {
	console.log('=== ULTRA-MINIMAL: Direct CSL TransactionBuilder.new → build_tx → free ===\n')

	tryGC()
	const baseline = getMem()
	console.log('BASELINE:', `heap=${mb(baseline.heapUsed)} ext=${mb(baseline.external)} rss=${mb(baseline.rss)}\n`)

	const linearFee = CardanoWASM.LinearFee.new(
		CardanoWASM.BigNum.from_str('44'),
		CardanoWASM.BigNum.from_str('155381'),
	)
	const exUnitPrices = CardanoWASM.ExUnitPrices.from_json(
		JSON.stringify({
			mem_price: { numerator: '0', denominator: '1' },
			step_price: { numerator: '0', denominator: '1' },
		}),
	)

	const startTime = Date.now()

	for (let i = 0; i < ITERATIONS; i++) {
		// Create builder config
		const cfg = CardanoWASM.TransactionBuilderConfigBuilder.new()
			.fee_algo(linearFee)
			.pool_deposit(CardanoWASM.BigNum.from_str('500000000'))
			.key_deposit(CardanoWASM.BigNum.from_str('2000000'))
			.max_value_size(5000)
			.max_tx_size(16384)
			.ex_unit_prices(exUnitPrices)
			.coins_per_utxo_byte(CardanoWASM.BigNum.from_str('4310'))
			.build()

		const txBuilder = CardanoWASM.TransactionBuilder.new(cfg)

		// Build a simple tx
		const txOutput = CardanoWASM.TransactionOutput.new(
			CardanoWASM.Address.from_bech32(
				'addr_test1wpqkx88tvs3897ljpgk7q43mguhsmq700r99ex6hpry5h8c3puxdp',
			),
			CardanoWASM.Value.new(CardanoWASM.BigNum.from_str('50000000')),
		)
		txBuilder.add_output(txOutput)
		txBuilder.set_fee(CardanoWASM.BigNum.from_str('200000'))

		const tx = await txBuilder.build_tx_unsafe()

		// Free all WASM objects
		tx.free()
		txBuilder.free()

		if ((i + 1) % LOG_INTERVAL === 0) {
			const mem = getMem()
			const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
			const dExt = mem.external - baseline.external
			console.log(
				`[${String(i + 1).padStart(4)}/${ITERATIONS}] ` +
					`heap=${mb(mem.heapUsed)} ext=${mb(mem.external)} (Δ${dExt >= 0 ? '+' : ''}${mb(Math.abs(dExt))}) | ${elapsed}s`,
			)
		}
	}

	// Free shared objects
	linearFee.free()
	exUnitPrices.free()

	tryGC()
	await new Promise(r => setTimeout(r, 500))
	tryGC()

	const final = getMem()
	const dExt = final.external - baseline.external
	console.log('\n=== FINAL (after GC) ===')
	console.log(`heapUsed  : ${mb(baseline.heapUsed)} → ${mb(final.heapUsed)}`)
	console.log(`external  : ${mb(baseline.external)} → ${mb(final.external)}  Δ ${dExt >= 0 ? '+' : ''}${mb(Math.abs(dExt))}`)
	console.log(`\nExternal leak rate: ${(dExt / 1024 / ITERATIONS).toFixed(2)} KB/iter`)
	console.log(dExt < 5 * 1024 * 1024 ? '✅ External OK' : '❌ External LEAK')
}

main().catch(err => {
	console.error('Error:', err)
	process.exit(1)
})
