#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')
const { performance } = require('node:perf_hooks')

const meshRepo = process.env.MESH_REPO
if (!meshRepo) {
	throw new Error('Set MESH_REPO to a MeshJS checkout containing packages/mesh-core-csl/test/offline-providers/evaluator.test.ts')
}

const fixturePath = path.join(meshRepo, 'packages/mesh-core-csl/test/offline-providers/evaluator.test.ts')
const { txHex, utxos } = readFirstMeshFixture(fixturePath)

const {
	DEFAULT_V1_COST_MODEL_LIST,
	DEFAULT_V2_COST_MODEL_LIST,
	DEFAULT_V3_COST_MODEL_LIST,
	SLOT_CONFIG_NETWORK
} = require('@meshsdk/common')
const { utxosToCborMap } = require('@meshsdk/core-cst')
const { Scalus, SlotConfig } = require('scalus')
const { js_evaluate_tx_scripts: evaluateWithWhisky } = require('whisky-evaluator')

const costModels = [DEFAULT_V1_COST_MODEL_LIST, DEFAULT_V2_COST_MODEL_LIST, DEFAULT_V3_COST_MODEL_LIST]
const slotConfig = {
	zeroTime: SLOT_CONFIG_NETWORK.preprod.zeroTime,
	zeroSlot: SLOT_CONFIG_NETWORK.preprod.zeroSlot,
	slotLength: SLOT_CONFIG_NETWORK.preprod.slotLength
}
const expected = [{ tag: 'MINT', index: 0, budget: { mem: 508703, steps: 164980381 } }]

const whiskyRun = () => {
	const result = evaluateWithWhisky(
		txHex,
		utxos.map(utxo => JSON.stringify(utxo)),
		[],
		JSON.stringify({ plutus_v1: costModels[0], plutus_v2: costModels[1], plutus_v3: costModels[2] }),
		JSON.stringify(slotConfig)
	)

	if (result.get_status() !== 'success') throw new Error(result.get_error())
	return JSON.parse(result.get_data()).map(action => {
		if (action.error) throw new Error(JSON.stringify(action.error))
		const success = action.success
		return {
			tag: success.tag.toUpperCase(),
			index: success.index,
			budget: { mem: success.budget.mem, steps: success.budget.steps }
		}
	})
}

const utxoMapHex = utxosToCborMap(utxos)
const scalusSlotConfig = new SlotConfig(slotConfig.zeroTime, slotConfig.zeroSlot, slotConfig.slotLength)
const scalusRun = () =>
	Scalus.evalPlutusScripts(Buffer.from(txHex, 'hex'), Buffer.from(utxoMapHex, 'hex'), scalusSlotConfig, costModels).map(
		redeemer => ({
			tag: normalizeScalusTag(redeemer.tag),
			index: redeemer.index,
			budget: { mem: Number(redeemer.budget.memory), steps: Number(redeemer.budget.steps) }
		})
	)

const missingContext = {
	whisky: probeWhiskyFailure(() =>
		evaluateWithWhisky(
			txHex,
			[],
			[],
			JSON.stringify({ plutus_v1: costModels[0], plutus_v2: costModels[1], plutus_v3: costModels[2] }),
			JSON.stringify(slotConfig)
		)
	),
	scalus: captureFailure(() =>
		Scalus.evalPlutusScripts(Buffer.from(txHex, 'hex'), Buffer.from('a0', 'hex'), scalusSlotConfig, costModels)
	)
}

const whisky = benchmark(whiskyRun)
const scalus = benchmark(scalusRun)

const report = {
	fixture: {
		source: fixturePath,
		txBytes: txHex.length / 2,
		utxoCount: utxos.length,
		expected
	},
	engines: {
		whisky: {
			package: packageVersion('whisky-evaluator'),
			artifactBytes: packageArtifactBytes('whisky-evaluator'),
			...whisky,
			matchesMeshExpected: sameResult(whisky.result, expected)
		},
			scalus: {
			package: packageVersion('scalus'),
			artifactBytes: packageArtifactBytes('scalus'),
			...scalus,
			matchesMeshExpected: sameResult(scalus.result, expected)
		}
	},
	missingContext,
	crossEngineMatch: sameResult(whisky.result, scalus.result)
}

console.log(JSON.stringify(report, null, 2))
if (!report.engines.whisky.matchesMeshExpected || !report.engines.scalus.matchesMeshExpected || !report.crossEngineMatch) {
	process.exitCode = 1
}

function benchmark(run, samples = 7) {
	const coldStart = timed(run)
	const timings = []
	let result = coldStart.result
	for (let i = 0; i < samples; i++) {
		const sample = timed(run)
		timings.push(sample.durationMs)
		result = sample.result
	}
	timings.sort((a, b) => a - b)
	return {
		result,
		coldStartMs: round(coldStart.durationMs),
		medianWarmMs: round(timings[Math.floor(timings.length / 2)]),
		warmSamplesMs: timings.map(round)
	}
}

function timed(run) {
	const start = performance.now()
	const result = run()
	return { result, durationMs: performance.now() - start }
}

function readFirstMeshFixture(filePath) {
	const source = fs.readFileSync(filePath, 'utf8')
	const start = source.indexOf('it("should successfully evaluate correct tx"')
	const end = source.indexOf('it("should successfully evaluate correct tx 2"', start)
	if (start < 0 || end < 0) throw new Error(`Unable to locate the first evaluator fixture in ${filePath}`)
	const block = source.slice(start, end)
	const txMatch = block.match(/const txHex\s*=\s*"([0-9a-f]+)";/)
	if (!txMatch) throw new Error('Unable to extract txHex from the MeshJS fixture')

	const utxos = [...block.matchAll(/const utxo_(\d+) = (\{[\s\S]*?\n    \});/g)]
		.sort((left, right) => Number(left[1]) - Number(right[1]))
		.map(match => Function(`"use strict"; return (${match[2]})`)())
	if (!utxos.length) throw new Error('Unable to extract UTxOs from the MeshJS fixture')
	return { txHex: txMatch[1], utxos }
}

function normalizeScalusTag(tag) {
	return (
		{
			Spend: 'SPEND',
			Mint: 'MINT',
			Cert: 'CERT',
			Reward: 'REWARD',
			Voting: 'VOTE',
			Proposing: 'PROPOSE'
		}[tag] ?? String(tag).toUpperCase()
	)
}

function packageVersion(name) {
	const entry = require.resolve(name)
	let directory = path.dirname(entry)
	while (directory !== path.dirname(directory)) {
		const packageJson = path.join(directory, 'package.json')
		if (fs.existsSync(packageJson)) return JSON.parse(fs.readFileSync(packageJson, 'utf8')).version
		directory = path.dirname(directory)
	}
	throw new Error(`Unable to resolve package.json for ${name}`)
}

function packageArtifactBytes(name) {
	const entry = require.resolve(name)
	const packageDirectory = findPackageDirectory(entry)
	return directoryBytes(packageDirectory)
}

function findPackageDirectory(entry) {
	let directory = path.dirname(entry)
	while (directory !== path.dirname(directory)) {
		if (fs.existsSync(path.join(directory, 'package.json'))) return directory
		directory = path.dirname(directory)
	}
	throw new Error(`Unable to find package directory for ${entry}`)
}

function directoryBytes(directory) {
	let total = 0
	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		const fullPath = path.join(directory, entry.name)
		total += entry.isDirectory() ? directoryBytes(fullPath) : fs.statSync(fullPath).size
	}
	return total
}

function sameResult(left, right) {
	return JSON.stringify(left) === JSON.stringify(right)
}

function captureFailure(run) {
	try {
		const value = run()
		return { threw: false, valueType: typeof value }
	} catch (error) {
		return {
			threw: true,
			errorType: error?.constructor?.name ?? 'Error',
			message: String(error?.message ?? error).slice(0, 240),
			logs: Array.isArray(error?.logs) ? error.logs.slice(0, 5) : undefined
		}
	}
}

function probeWhiskyFailure(run) {
	try {
		const result = run()
		return {
			threw: false,
			status: result.get_status(),
			error: String(result.get_error() ?? '').slice(0, 240)
		}
	} catch (error) {
		return {
			threw: true,
			errorType: error?.constructor?.name ?? 'Error',
			message: String(error?.message ?? error).slice(0, 240)
		}
	}
}

function round(value) {
	return Number(value.toFixed(3))
}
