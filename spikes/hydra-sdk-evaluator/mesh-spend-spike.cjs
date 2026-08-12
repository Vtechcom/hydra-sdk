#!/usr/bin/env node

const {
	DEFAULT_V1_COST_MODEL_LIST,
	DEFAULT_V2_COST_MODEL_LIST,
	DEFAULT_V3_COST_MODEL_LIST,
	SLOT_CONFIG_NETWORK
} = require('@meshsdk/common')
const {
	MeshTxBuilder,
	OfflineFetcher,
	applyCborEncoding,
	resolveScriptHash,
	serializePlutusScript
} = require('@meshsdk/core')
const { CSLSerializer } = require('@meshsdk/core-csl')
const { blake2b, utxosToCborMap } = require('@meshsdk/core-cst')
const { Scalus, SlotConfig } = require('scalus')
const { js_evaluate_tx_scripts: evaluateWithWhisky } = require('whisky-evaluator')

const address = 'addr_test1qpvx0sacufuypa2k4sngk7q40zc5c4npl337uusdh64kv0uafhxhu32dys6pvn6wlw8dav6cmp4pmtv7cc3yel9uu0nq93swx9'
const alwaysSucceedCbor = applyCborEncoding(
	'58340101002332259800a518a4d153300249011856616c696461746f722072657475726e65642066616c736500136564004ae715cd01'
)
const alwaysSucceedHash = resolveScriptHash(alwaysSucceedCbor, 'V3')
const txHash = label => blake2b.hash(Buffer.from(label, 'utf8'), 32)
const scriptUtxo = {
	input: { txHash: txHash('tx2'), outputIndex: 0 },
	output: {
		address: serializePlutusScript({ code: alwaysSucceedCbor, version: 'V3' }).address,
		amount: [{ unit: 'lovelace', quantity: '100000000' }]
	}
}
const collateralUtxo = {
	input: { txHash: txHash('tx1'), outputIndex: 0 },
	output: { address, amount: [{ unit: 'lovelace', quantity: '100000000' }] }
}

main().catch(error => {
	console.error(error)
	process.exitCode = 1
})

async function main() {
	const fetcher = new OfflineFetcher()
	fetcher.fetchCostModels = async () => [
		DEFAULT_V1_COST_MODEL_LIST,
		DEFAULT_V2_COST_MODEL_LIST,
		DEFAULT_V3_COST_MODEL_LIST
	]
	fetcher.addUTxOs([collateralUtxo, scriptUtxo])
	const builder = new MeshTxBuilder({ serializer: new CSLSerializer(), fetcher })
	const txHex = await builder
		.spendingPlutusScriptV3()
		.txIn(scriptUtxo.input.txHash, scriptUtxo.input.outputIndex)
		.txInInlineDatumPresent()
		.txInRedeemerValue('')
		.txInScript(alwaysSucceedCbor)
		.txInCollateral(collateralUtxo.input.txHash, collateralUtxo.input.outputIndex)
		.changeAddress(address)
		.setFee('5000000')
		.complete()

	const resolvedUtxos = [scriptUtxo, collateralUtxo]
	const costModels = [DEFAULT_V1_COST_MODEL_LIST, DEFAULT_V2_COST_MODEL_LIST, DEFAULT_V3_COST_MODEL_LIST]
	const slotConfig = {
		zeroTime: SLOT_CONFIG_NETWORK.preprod.zeroTime,
		zeroSlot: SLOT_CONFIG_NETWORK.preprod.zeroSlot,
		slotLength: SLOT_CONFIG_NETWORK.preprod.slotLength
	}
	const expected = [{ tag: 'SPEND', index: 0, budget: { mem: 2001, steps: 380149 } }]

	const whisky = runWhisky(txHex, resolvedUtxos, costModels, slotConfig)
	const scalus = runScalus(txHex, resolvedUtxos, costModels, slotConfig)
	const missingContext = {
		whisky: probeWhisky(txHex, [], costModels, slotConfig),
		scalus: probeScalus(txHex, [], costModels, slotConfig)
	}
	const report = {
		fixture: { kind: 'MeshJS V3 always-succeed SPEND', txBytes: txHex.length / 2, utxoCount: resolvedUtxos.length, expected },
		whisky,
		scalus,
		missingContext,
		whiskyMatchesExpected: sameResult(whisky, expected),
		scalusMatchesExpected: sameResult(scalus, expected),
		crossEngineMatch: sameResult(whisky, scalus)
	}
	console.log(JSON.stringify(report, null, 2))
	if (!report.whiskyMatchesExpected || !report.scalusMatchesExpected || !report.crossEngineMatch) process.exitCode = 1
}

function runWhisky(txHex, utxos, costModels, slotConfig) {
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
		return {
			tag: action.success.tag.toUpperCase(),
			index: action.success.index,
			budget: action.success.budget
		}
	})
}

function runScalus(txHex, utxos, costModels, slotConfig) {
	const encodedUtxos = Buffer.from(utxosToCborMap(utxos), 'hex')
	const config = new SlotConfig(slotConfig.zeroTime, slotConfig.zeroSlot, slotConfig.slotLength)
	return Scalus.evalPlutusScripts(Buffer.from(txHex, 'hex'), encodedUtxos, config, costModels).map(redeemer => ({
		tag: ({ Spend: 'SPEND', Mint: 'MINT', Cert: 'CERT', Reward: 'REWARD', Voting: 'VOTE', Proposing: 'PROPOSE' })[
			redeemer.tag
		],
		index: redeemer.index,
		budget: { mem: Number(redeemer.budget.memory), steps: Number(redeemer.budget.steps) }
	}))
}

function probeWhisky(txHex, utxos, costModels, slotConfig) {
	try {
		return { threw: false, result: runWhisky(txHex, utxos, costModels, slotConfig) }
	} catch (error) {
		return { threw: true, message: String(error.message ?? error).slice(0, 240) }
	}
}

function probeScalus(txHex, utxos, costModels, slotConfig) {
	try {
		return { threw: false, result: runScalus(txHex, utxos, costModels, slotConfig) }
	} catch (error) {
		return {
			threw: true,
			errorType: error?.constructor?.name ?? 'Error',
			message: String(error.message ?? error).slice(0, 240),
			logs: Array.isArray(error.logs) ? error.logs.slice(0, 5) : undefined
		}
	}
}

function sameResult(left, right) {
	return JSON.stringify(left) === JSON.stringify(right)
}
