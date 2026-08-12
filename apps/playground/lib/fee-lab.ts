import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { DEFAULT_PROTOCOL_PARAMETERS, FeeUtils, type FeeBreakdown, type Protocol, type UTxO } from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'

/**
 * Everything the Fee Lab needs to visualise how a script transaction's fee is
 * built up. The heavy lifting is `FeeUtils.calculateTxFee` from `@hydra-sdk/core`
 * — it needs no execution engine, so the whole page runs offline in the browser.
 */

/** An always-succeeds Plutus V3 validator — a minimal real script for the demo. */
export const DEMO_SCRIPT_CBOR = '46450101002499'
const DEMO_ADDRESS =
	'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
const FUND_TX = 'a'.repeat(64)
const SCRIPT_TX = 'b'.repeat(64)
const COLLATERAL_TX = 'c'.repeat(64)

/** emptyRedeemer placeholder exUnits the builder stamps before evaluation. */
export const PLACEHOLDER_EXUNITS = { mem: 100000, steps: 10000000 }

const scriptAddress = (): string => {
	const script = CardanoWASM.PlutusScript.from_hex_with_version(DEMO_SCRIPT_CBOR, CardanoWASM.Language.new_plutus_v3())
	const addr = CardanoWASM.EnterpriseAddress.new(0, CardanoWASM.Credential.from_scripthash(script.hash()))
	const bech = addr.to_address().to_bech32()
	script.free()
	addr.free()
	return bech
}

export interface DemoTx {
	txHex: string
	resolvedUtxos: UTxO[]
}

/**
 * Build a demo Plutus V3 SPEND transaction (one script input, one funding input,
 * collateral, one output) entirely in the browser. Built as a Hydra blueprint so
 * it needs no on-chain balancing — we only price it, never submit it.
 */
export const buildDemoTx = async (): Promise<DemoTx> => {
	const addr = scriptAddress()
	const builder = new TxBuilder({ isHydra: true })
	const tx = await builder
		.txIn(FUND_TX, 0, [{ unit: 'lovelace', quantity: '10000000' }], DEMO_ADDRESS)
		.txIn(SCRIPT_TX, 1, [{ unit: 'lovelace', quantity: '5000000' }], addr)
		.txInScript(DEMO_SCRIPT_CBOR, 'V3')
		.txInEmptyRedeemer()
		.txInCollateral(COLLATERAL_TX, 0, [{ unit: 'lovelace', quantity: '5000000' }], DEMO_ADDRESS)
		.txOut(DEMO_ADDRESS, [{ unit: 'lovelace', quantity: '2000000' }])
		.changeAddress(DEMO_ADDRESS)
		.complete()
	const txHex = tx.to_hex()
	tx.free()

	return {
		txHex,
		resolvedUtxos: [
			{
				input: { txHash: FUND_TX, outputIndex: 0 },
				output: { address: DEMO_ADDRESS, amount: [{ unit: 'lovelace', quantity: '10000000' }] }
			},
			{
				input: { txHash: SCRIPT_TX, outputIndex: 1 },
				output: { address: addr, amount: [{ unit: 'lovelace', quantity: '5000000' }] }
			},
			{
				input: { txHash: COLLATERAL_TX, outputIndex: 0 },
				output: { address: DEMO_ADDRESS, amount: [{ unit: 'lovelace', quantity: '5000000' }] }
			}
		]
	}
}

export interface FeeInputs {
	mem: number
	steps: number
}

/** Price the demo tx for the given exUnits. Pure `@hydra-sdk/core`, no engine. */
export const priceDemoTx = (demo: DemoTx, exUnits: FeeInputs, params: Partial<Protocol> = {}): FeeBreakdown =>
	FeeUtils.calculateTxFee(demo.txHex, {
		exUnits: [{ mem: exUnits.mem, steps: exUnits.steps }],
		resolvedUtxos: demo.resolvedUtxos,
		params
	})

/** The protocol constants the fee formula reads, surfaced for the visualisation. */
export const feeParams = () => {
	const p = DEFAULT_PROTOCOL_PARAMETERS
	return {
		minFeeA: p.minFeeA,
		minFeeB: p.minFeeB,
		priceMem: p.priceMem,
		priceStep: p.priceStep,
		minFeeRefScriptCostPerByte: p.minFeeRefScriptCostPerByte,
		coinsPerUtxoSize: p.coinsPerUtxoSize
	}
}

/** lovelace → ADA, trimmed. */
export const toAda = (lovelace: string | number | bigint): string => {
	const n = typeof lovelace === 'bigint' ? lovelace : BigInt(Math.round(Number(lovelace)))
	const whole = n / 1_000_000n
	const frac = (n % 1_000_000n).toString().padStart(6, '0').replace(/0+$/, '')
	return frac ? `${whole}.${frac}` : `${whole}`
}
