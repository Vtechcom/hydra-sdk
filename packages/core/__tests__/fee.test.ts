import { describe, it, expect } from 'vitest'
import { FeeUtils } from '@hydra-sdk/core'
import type { UTxO } from '@hydra-sdk/core'

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
		expect(() => FeeUtils.calculateTxFee('00')).toThrow(/decode/)
	})
})
