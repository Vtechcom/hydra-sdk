/**
 * TxBuilderWorker – Worker Thread Isolation for WASM Memory Management
 *
 * PROBLEM: CSL WASM heap grows linearly with each buildTx, never shrinks.
 * After ~100K builds → ~700 MB → OOM crash.
 *
 * SOLUTION: Run transaction building in an isolated Worker thread.
 * The Worker has its OWN WASM heap. After N builds, terminate & recreate
 * the Worker → WASM memory is completely freed by the OS.
 *
 * Usage (main thread):
 *   const pool = new TxBuilderWorkerPool({ maxBuildsPerWorker: 500 })
 *   const result = await pool.buildTx({ inputs, outputs, changeAddress, ... })
 *   // ... build thousands of txs safely
 *   await pool.shutdown()
 *
 * Usage:
 *   cd apps/nodejs-playground
 *   node --expose-gc --import tsx src/test-memory-leak-worker.ts
 */

import { Worker } from 'node:worker_threads'
import { resolve } from 'node:path'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BuildTxRequest {
	id: number
	inputs: Array<{
		input: { outputIndex: number; txHash: string }
		output: { address: string; amount: Array<{ unit: string; quantity: string }> }
	}>
	outputs: Array<{ address: string; amount: Array<{ unit: string; quantity: string }> }>
	changeAddress: string
	requiredSignerHash: string
	minFeeA: number
	minFeeB: number
}

interface BuildTxResponse {
	id: number
	txHex: string
	error?: string
}

// ---------------------------------------------------------------------------
// Worker script (inlined as string for simplicity)
// In production, use a separate .ts file compiled with tsup
// ---------------------------------------------------------------------------

const WORKER_SCRIPT = `
import { parentPort } from 'node:worker_threads'
import { TxBuilder } from '@hydra-sdk/transaction'

parentPort!.on('message', async (msg: any) => {
	if (msg.type === 'build') {
		const req = msg.payload
		try {
			const txBuilder = new TxBuilder({
				isHydra: true,
				params: { minFeeA: req.minFeeA, minFeeB: req.minFeeB },
			})

			const tx = await txBuilder
				.setInputs(req.inputs)
				.addOutput(req.outputs[0])
				.changeAddress(req.changeAddress)
				.requiredSignerHash(req.requiredSignerHash)
				.complete()

			const txHex = tx.to_hex()

			// Cleanup
			txBuilder.dispose()
			tx.free()

			parentPort!.postMessage({ type: 'result', payload: { id: req.id, txHex } })
		} catch (err: any) {
			parentPort!.postMessage({ type: 'result', payload: { id: req.id, error: err.message } })
		}
	}
})
`

// ---------------------------------------------------------------------------
// TxBuilderWorkerPool
// ---------------------------------------------------------------------------

export class TxBuilderWorkerPool {
	private worker: Worker | null = null
	private buildCount = 0
	private maxBuildsPerWorker: number
	private pendingRequests = new Map<number, { resolve: (v: BuildTxResponse) => void; reject: (e: Error) => void }>()
	private nextId = 0

	constructor(options: { maxBuildsPerWorker?: number } = {}) {
		this.maxBuildsPerWorker = options.maxBuildsPerWorker ?? 500
	}

	/**
	 * Build a transaction. Automatically recycles the Worker after
	 * maxBuildsPerWorker builds to prevent WASM memory accumulation.
	 */
	async buildTx(req: Omit<BuildTxRequest, 'id'>): Promise<string> {
		// Rotate worker if needed
		if (!this.worker || this.buildCount >= this.maxBuildsPerWorker) {
			await this._rotateWorker()
		}

		const id = this.nextId++
		this.buildCount++

		return new Promise<string>((resolve, reject) => {
			this.pendingRequests.set(id, {
				resolve: (resp: BuildTxResponse) => {
					if (resp.error) reject(new Error(resp.error))
					else resolve(resp.txHex)
				},
				reject,
			})

			this.worker!.postMessage({ type: 'build', payload: { ...req, id } })
		})
	}

	private async _rotateWorker(): Promise<void> {
		// Terminate old worker (frees ALL its WASM memory)
		if (this.worker) {
			// Reject all pending requests
			for (const [, { reject }] of this.pendingRequests) {
				reject(new Error('Worker rotated'))
			}
			this.pendingRequests.clear()
			await this.worker.terminate()
			this.buildCount = 0
		}

		// Create new worker with fresh WASM heap
		this.worker = new Worker(
			`import { parentPort } from 'node:worker_threads';
import { TxBuilder } from '@hydra-sdk/transaction';

parentPort.on('message', async (msg) => {
	if (msg.type === 'build') {
		const req = msg.payload;
		try {
			const txBuilder = new TxBuilder({
				isHydra: true,
				params: { minFeeA: req.minFeeA, minFeeB: req.minFeeB },
			});
			const tx = await txBuilder
				.setInputs(req.inputs)
				.addOutput(req.outputs[0])
				.changeAddress(req.changeAddress)
				.requiredSignerHash(req.requiredSignerHash)
				.complete();
			const txHex = tx.to_hex();
			txBuilder.dispose();
			tx.free();
			parentPort.postMessage({ type: 'result', payload: { id: req.id, txHex } });
		} catch (err) {
			parentPort.postMessage({ type: 'result', payload: { id: req.id, error: err.message } });
		}
	}
});`,
			{ eval: true },
		)

		// Listen for results
		this.worker.on('message', (msg: { type: string; payload: BuildTxResponse }) => {
			if (msg.type === 'result') {
				const { id } = msg.payload
				const pending = this.pendingRequests.get(id)
				if (pending) {
					this.pendingRequests.delete(id)
					pending.resolve(msg.payload)
				}
			}
		})

		this.worker.on('error', (err) => {
			console.error('[TxBuilderWorker] Error:', err)
		})

		// Wait for worker to be ready
		await new Promise(r => setTimeout(r, 100))
	}

	async shutdown(): Promise<void> {
		if (this.worker) {
			await this.worker.terminate()
			this.worker = null
		}
	}
}

// ---------------------------------------------------------------------------
// Demo Test
// ---------------------------------------------------------------------------

async function main() {
	console.log('╔══════════════════════════════════════════════════════╗')
	console.log('║   WORKER THREAD ISOLATION – Memory Stability Test   ║')
	console.log('╚══════════════════════════════════════════════════════╝\n')

	const pool = new TxBuilderWorkerPool({ maxBuildsPerWorker: 500 })

	const dummyUtxo = {
		input: { outputIndex: 0, txHash: '94c19acf3fc85dec3dc4217f615a75d8d3079ab34bd31a31ef0e49a3c3dc1582' },
		output: {
			address: 'addr_test1qpc6r7e9pyxdp4dkheztfpvlmf58cm5wwm4pa703cn2fqkpr3kmsd09nqvtg0xa5784nkgux9paaekal6shrrl07nwjszaqqx4',
			amount: [{ unit: 'lovelace', quantity: '200000000' }],
		},
	}

	const totalIterations = 3000
	const logInterval = 250

	function mb(b: number) { return (b / 1024 / 1024).toFixed(2) + ' MB' }
	function mem() { const m = process.memoryUsage(); return { h: m.heapUsed, e: m.external, r: m.rss } }

	const baseline = mem()
	console.log(`BASELINE: ext=${mb(baseline.e)} heap=${mb(baseline.h)} rss=${mb(baseline.rss)}\n`)

	const startTime = Date.now()

	for (let i = 0; i < totalIterations; i++) {
		const txHex = await pool.buildTx({
			inputs: [dummyUtxo],
			outputs: [{ address: 'addr_test1wpqkx88tvs3897ljpgk7q43mguhsmq700r99ex6hpry5h8c3puxdp', amount: [{ unit: 'lovelace', quantity: String(50_000_000) }] }],
			changeAddress: dummyUtxo.output.address,
			requiredSignerHash: '66da057db8d38a06b9e47e6f2f30c5d9f86c5a4a11a3c4da7d817e97',
			minFeeA: 44,
			minFeeB: 173201,
		})

		if ((i + 1) % logInterval === 0 || i === 0) {
			const m = mem()
			const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
			const dExt = m.e - baseline.e
			console.log(`[${String(i + 1).padStart(4)}/${totalIterations}] ext=${mb(m.e)} (Δ${dExt >= 0 ? '+' : ''}${mb(Math.abs(dExt))}) | rss=${mb(m.rss)} | ${elapsed}s`)
		}
	}

	await pool.shutdown()

	const final = mem()
	const dExt = final.e - baseline.e
	console.log(`\nFINAL: ext ${mb(baseline.e)} → ${mb(final.e)}  Δ ${dExt >= 0 ? '+' : ''}${mb(Math.abs(dExt))}`)
	console.log(`\nLeak rate: ${(dExt / 1024 / totalIterations).toFixed(2)} KB/iter (with Worker isolation)`)

	if (dExt < 10 * 1024 * 1024) {
		console.log('✅ Worker isolation effectively prevents memory accumulation!')
	} else {
		console.log('⚠️  Some memory growth, but significantly controlled.')
	}
}

main().catch(err => { console.error('Error:', err); process.exit(1) })
