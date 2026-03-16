import { performance } from 'node:perf_hooks'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import type { UTxO, UTxOObject } from '../src/types/cardano'
import {
	convertUTxOObjectToUTxO,
	convertUTxOObjectToUTxOWithOptions,
	convertUTxOToUTxOObject
} from '../src/utils/cardano-wasm/converter'

type BenchmarkOptions = {
	size: number
	assetsPerUtxo: number
	runs: number
	inlineDatumEvery: number
	datumPoolSize: number
	maxDatumCacheSize: number
}

const parseIntArg = (name: string, fallback: number): number => {
	const arg = process.argv.find(value => value.startsWith(`--${name}=`))
	if (!arg) return fallback
	const parsed = Number(arg.split('=')[1])
	return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

const options: BenchmarkOptions = {
	size: parseIntArg('size', 10000),
	assetsPerUtxo: parseIntArg('assets', 3),
	runs: parseIntArg('runs', 5),
	inlineDatumEvery: parseIntArg('inline-every', 3),
	datumPoolSize: parseIntArg('datum-pool', 64),
	maxDatumCacheSize: parseIntArg('cache-size', 1024)
}

const toHex = (value: number, length: number): string => value.toString(16).padStart(length, '0').slice(-length)

const buildDatumPool = (size: number): CardanoWASM.PlutusData[] => {
	const schema = CardanoWASM.PlutusDatumSchema.DetailedSchema
	const pool: CardanoWASM.PlutusData[] = new Array(size)
	for (let i = 0; i < size; i++) {
		pool[i] = CardanoWASM.PlutusData.from_json(`{"int":${i}}`, schema)
	}
	return pool
}

const generateUTxOs = (config: BenchmarkOptions): UTxO[] => {
	const address = 'addr_test1vzyl6h5kz40w5f4g3w2qj8rf6nzf8hsh9e77l6pk56p9m8gjf57hm'
	const datumPool = buildDatumPool(config.datumPoolSize)
	const policyPool = Array.from({ length: 20 }, (_, i) => toHex(i + 1, 56))
	const utxos: UTxO[] = new Array(config.size)

	for (let i = 0; i < config.size; i++) {
		const amount = [{ unit: 'lovelace', quantity: String(2_000_000 + (i % 10_000)) }]
		for (let assetIndex = 0; assetIndex < config.assetsPerUtxo; assetIndex++) {
			const policyId = policyPool[(i + assetIndex) % policyPool.length]
			const assetName = toHex((i * 17 + assetIndex) % 0xffff, 8)
			amount.push({
				unit: policyId + assetName,
				quantity: String(1 + ((i + assetIndex) % 5000))
			})
		}

		const hasInlineDatum = i % config.inlineDatumEvery === 0
		const inlineDatum = hasInlineDatum ? datumPool[i % datumPool.length] : null

		utxos[i] = {
			input: {
				txHash: toHex(i + 1, 64),
				outputIndex: i % 3
			},
			output: {
				address,
				amount,
				datum: null,
				datumHash: hasInlineDatum ? null : toHex(i + 1000, 64),
				inlineDatum,
				scriptRef: null,
				scriptHash: null
			}
		}
	}

	return utxos
}

type BenchResult<T> = {
	name: string
	avgMs: number
	minMs: number
	maxMs: number
	lastResult: T
}

const benchmark = <T>(name: string, runs: number, fn: () => T): BenchResult<T> => {
	fn()
	const times: number[] = []
	let lastResult: T = fn()

	for (let i = 0; i < runs; i++) {
		const started = performance.now()
		lastResult = fn()
		times.push(performance.now() - started)
	}

	const total = times.reduce((sum, value) => sum + value, 0)
	return {
		name,
		avgMs: total / times.length,
		minMs: Math.min(...times),
		maxMs: Math.max(...times),
		lastResult
	}
}

const formatMs = (value: number): string => `${value.toFixed(2)} ms`

const printResult = (result: BenchResult<unknown>) => {
	console.log(
		`${result.name.padEnd(40)} avg=${formatMs(result.avgMs)} | min=${formatMs(result.minMs)} | max=${formatMs(result.maxMs)}`
	)
}

const main = () => {
	console.log('Benchmark options:', options)
	const sourceUtxos = generateUTxOs(options)
	console.log(`Generated source UTxOs: ${sourceUtxos.length}`)

	const toObjectResult = benchmark('convertUTxOToUTxOObject', options.runs, () => convertUTxOToUTxOObject(sourceUtxos))
	printResult(toObjectResult)

	const utxoObject = toObjectResult.lastResult as UTxOObject
	const toUtxoDefaultResult = benchmark('convertUTxOObjectToUTxO (default)', options.runs, () =>
		convertUTxOObjectToUTxO(utxoObject)
	)
	printResult(toUtxoDefaultResult)

	const toUtxoBoundedResult = benchmark(
		`convertUTxOObjectToUTxOWithOptions (cache=${options.maxDatumCacheSize})`,
		options.runs,
		() => convertUTxOObjectToUTxOWithOptions(utxoObject, { maxDatumCacheSize: options.maxDatumCacheSize })
	)
	printResult(toUtxoBoundedResult)

	const heapUsedMb = process.memoryUsage().heapUsed / (1024 * 1024)
	console.log(`Heap used after benchmark: ${heapUsedMb.toFixed(2)} MB`)
}

main()
