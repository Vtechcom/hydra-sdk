import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import * as FeeUtils from '../../../src/utils/fee'
import type { UTxO } from '../../../src/types/cardano'
import { OTHER_ADDRESS_KEY_HASH, PLUTUS_SCRIPT, TEST_WALLET } from '../../helpers/fixtures'
import { wasmScope } from '../../helpers/wasm'

// A committed always-succeed Plutus V3 SPEND built by @hydra-sdk/transaction.
// CSL priced this transaction's fee at 174467 lovelace during its own build.
const txHex =
	'84a600d9010281825820bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb01018282583900e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebfeee790c7bb9c497f716fcec7d92a4d68c27b48c9e301b7c547c653cd1a000f424082583900e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebfeee790c7bb9c497f716fcec7d92a4d68c27b48c9e301b7c547c653cd1a003a5f7d021a0002a983075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6c0b58209a05f31c960920a19a22fbcbb179faa37bf1d8309452ee892e09545a4efeadb90dd9010281825820cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc00a207d90102814645010100249905a182000082d87980821901f419fa64f5a0'
const CSL_FEE = 174467n

const resolvedUtxos: UTxO[] = [
	{
		input: { txHash: 'a'.repeat(64), outputIndex: 0 },
		output: {
			address:
				'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3',
			amount: [{ unit: 'lovelace', quantity: '10000000' }]
		}
	},
	{
		input: { txHash: 'b'.repeat(64), outputIndex: 1 },
		output: {
			address: 'addr_test1wqvxuvh64q9zdqgrjt76d42eclk5wgdxtnsun4808cwg0dqxy2mj0',
			amount: [{ unit: 'lovelace', quantity: '5000000' }]
		}
	},
	{
		input: { txHash: 'c'.repeat(64), outputIndex: 0 },
		output: {
			address:
				'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3',
			amount: [{ unit: 'lovelace', quantity: '5000000' }]
		}
	}
]

describe('FeeUtils.calculateTxFee', () => {
	it('prices a script tx >= CSL and within a tight band, no rebuild', () => {
		const b = FeeUtils.calculateTxFee(txHex, { resolvedUtxos })
		const estimate = BigInt(b.fee)
		expect(estimate).toBeGreaterThanOrEqual(CSL_FEE)
		expect(Number(estimate - CSL_FEE) / Number(CSL_FEE)).toBeLessThan(0.02)
	})

	it('breaks the fee into components and derives one signer', () => {
		const b = FeeUtils.calculateTxFee(txHex, { resolvedUtxos })
		expect(BigInt(b.sizeFee)).toBeGreaterThan(0n)
		expect(BigInt(b.scriptFee)).toBeGreaterThan(0n)
		expect(b.refScriptFee).toBe('0')
		expect(b.signerCount).toBe(1) // both key inputs share one payment credential
		expect(BigInt(b.baseFee)).toBe(BigInt(b.sizeFee) + BigInt(b.scriptFee) + BigInt(b.refScriptFee))
	})

	it('overrides exUnits when provided', () => {
		const low = FeeUtils.calculateTxFee(txHex, { resolvedUtxos, exUnits: [{ mem: 1, steps: 1 }] })
		const high = FeeUtils.calculateTxFee(txHex, { resolvedUtxos, exUnits: [{ mem: 1_000_000, steps: 1_000_000_000 }] })
		expect(BigInt(high.scriptFee)).toBeGreaterThan(BigInt(low.scriptFee))
	})

	it('throws on non-transaction hex', () => {
		expect(() => FeeUtils.calculateTxFee('00')).toThrow(/failed to decode transaction CBOR/)
	})

	it('prices exUnits with priceMem/priceStep, rounding up', () => {
		const b = FeeUtils.calculateTxFee(txHex, { resolvedUtxos, exUnits: [{ mem: 1_000_000, steps: 1_000_000_000 }] })

		// ceil(0.0577 × 1e6 + 0.0000721 × 1e9) = 57700 + 72100
		expect(b.scriptFee).toBe('129800')
	})

	it('computes sizeFee as minFeeA × (txBytes + 8 bytes fee-field headroom) + minFeeB', () => {
		const b = FeeUtils.calculateTxFee(txHex, { resolvedUtxos })

		expect(BigInt(b.sizeFee)).toBe(44n * BigInt(b.txBytes + 8) + 155381n)
	})

	it('applies feeMultiplier then adds safetyMarginLovelace', () => {
		const base = FeeUtils.calculateTxFee(txHex, { resolvedUtxos })
		const padded = FeeUtils.calculateTxFee(txHex, { resolvedUtxos, feeMultiplier: 1.1, safetyMarginLovelace: 1000 })

		expect(padded.baseFee).toBe(base.baseFee)
		expect(BigInt(padded.fee)).toBe(BigInt(Math.ceil(Number(base.baseFee) * 1.1)) + 1000n)
	})
})

describe('FeeUtils.calculateTxFee — signers and reference scripts', () => {
	const keep = wasmScope()
	const INPUT = { txHash: 'a'.repeat(64), outputIndex: 0 }
	const REF_INPUT = { txHash: 'b'.repeat(64), outputIndex: 0 }

	/** A minimal key-only tx; optional required signers and reference inputs. */
	const buildTx = ({ requiredSigners = [] as string[], withReferenceInput = false } = {}) => {
		const toInputs = (refs: { txHash: string; outputIndex: number }[]) => {
			const inputs = keep(CardanoWASM.TransactionInputs.new())
			for (const r of refs)
				inputs.add(
					keep(CardanoWASM.TransactionInput.new(keep(CardanoWASM.TransactionHash.from_hex(r.txHash)), r.outputIndex))
				)
			return inputs
		}
		const outputs = keep(CardanoWASM.TransactionOutputs.new())
		outputs.add(
			keep(
				CardanoWASM.TransactionOutput.new(
					keep(CardanoWASM.Address.from_bech32(TEST_WALLET.baseAddressPreprod)),
					keep(CardanoWASM.Value.new(keep(CardanoWASM.BigNum.from_str('1000000'))))
				)
			)
		)
		const body = keep(
			CardanoWASM.TransactionBody.new_tx_body(toInputs([INPUT]), outputs, keep(CardanoWASM.BigNum.from_str('200000')))
		)
		if (withReferenceInput) body.set_reference_inputs(toInputs([REF_INPUT]))
		if (requiredSigners.length) {
			const signers = keep(CardanoWASM.Ed25519KeyHashes.new())
			for (const h of requiredSigners) signers.add(keep(CardanoWASM.Ed25519KeyHash.from_hex(h)))
			body.set_required_signers(signers)
		}
		return keep(CardanoWASM.Transaction.new(body, keep(CardanoWASM.TransactionWitnessSet.new()))).to_hex()
	}

	const keyUtxo: UTxO = {
		input: INPUT,
		output: { address: TEST_WALLET.baseAddressPreprod, amount: [{ unit: 'lovelace', quantity: '5000000' }] }
	}
	const refScriptUtxo: UTxO = {
		input: REF_INPUT,
		output: {
			address: TEST_WALLET.enterpriseAddressPreprod,
			amount: [{ unit: 'lovelace', quantity: '20000000' }],
			scriptRef: { scriptCbor: PLUTUS_SCRIPT.cborHex, version: 'V3' }
		}
	}

	it.each([
		['no required signers', [], 1],
		['a required signer that is also the input key', [TEST_WALLET.paymentKeyHash], 1],
		['a distinct required signer', [OTHER_ADDRESS_KEY_HASH], 2],
		['two distinct required signers', [OTHER_ADDRESS_KEY_HASH, TEST_WALLET.stakeKeyHash], 3]
	])('counts distinct vkey signers with %s', (_name, requiredSigners, expected) => {
		const b = FeeUtils.calculateTxFee(buildTx({ requiredSigners }), { resolvedUtxos: [keyUtxo] })

		expect(b.signerCount).toBe(expected)
	})

	it('adds extraSigners to the derived signer count', () => {
		const b = FeeUtils.calculateTxFee(buildTx(), { resolvedUtxos: [keyUtxo], extraSigners: 2 })

		expect(b.signerCount).toBe(3)
	})

	// New finding (not in spec §6 yet): every mock witness uses the same all-zero vkey, and CSL's
	// Vkeywitnesses is a set, so all signers after the first collapse into one witness. The size fee
	// is then short by minFeeA × 101 bytes per extra signer, contradicting "never under-provisions".
	it.fails('grows the measured size by one vkey witness per extra signer [mock witnesses deduplicated]', () => {
		const tx = buildTx()
		const one = FeeUtils.calculateTxFee(tx, { resolvedUtxos: [keyUtxo] })
		const two = FeeUtils.calculateTxFee(tx, { resolvedUtxos: [keyUtxo], extraSigners: 1 })

		// one more `[vkey(32), sig(64)]` CBOR entry: 1 + 34 + 66 = 101 bytes
		expect(two.txBytes - one.txBytes).toBe(101)
	})

	it('charges minFeeRefScriptCostPerByte for reference scripts on resolved reference inputs', () => {
		const tx = buildTx({ withReferenceInput: true })

		const b = FeeUtils.calculateTxFee(tx, { resolvedUtxos: [keyUtxo, refScriptUtxo] })
		expect(b.refScriptBytes).toBe(421)
		expect(b.refScriptFee).toBe(String(15 * 421))
		expect(BigInt(b.baseFee)).toBe(BigInt(b.sizeFee) + BigInt(b.refScriptFee))

		const pricier = FeeUtils.calculateTxFee(tx, {
			resolvedUtxos: [keyUtxo, refScriptUtxo],
			params: { minFeeRefScriptCostPerByte: 20 }
		})
		expect(pricier.refScriptFee).toBe(String(20 * 421))
	})

	it('ignores reference inputs that are not resolved or carry no script', () => {
		const tx = buildTx({ withReferenceInput: true })

		expect(FeeUtils.calculateTxFee(tx, { resolvedUtxos: [keyUtxo] }).refScriptFee).toBe('0')
		expect(
			FeeUtils.calculateTxFee(tx, {
				resolvedUtxos: [keyUtxo, { ...refScriptUtxo, output: { ...refScriptUtxo.output, scriptRef: undefined } }]
			}).refScriptBytes
		).toBe(0)
	})
})
