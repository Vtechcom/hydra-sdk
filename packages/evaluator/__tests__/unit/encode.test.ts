import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import type { UTxO } from '@hydra-sdk/core'
import { toEngineUtxo } from '../../src/engine/encode'

const addr = 'addr_test1wrf8enqnl26m0q5cfg73lxf4xxtu5x5phcrfjs0lcqp7uagh2hm3k'

describe('toEngineUtxo — field naming the engine expects', () => {
	it('maps input, address, and amount', () => {
		const utxo: UTxO = {
			input: { txHash: 'a'.repeat(64), outputIndex: 2 },
			output: { address: addr, amount: [{ unit: 'lovelace', quantity: '1017160' }] }
		}
		const engine = toEngineUtxo(utxo)
		expect(engine.input).toEqual({ txHash: 'a'.repeat(64), outputIndex: 2 })
		expect(engine.output.address).toBe(addr)
		expect(engine.output.amount).toEqual([{ unit: 'lovelace', quantity: '1017160' }])
	})

	it('maps an inline datum PlutusData object to plutusData hex', () => {
		const utxo: UTxO = {
			input: { txHash: 'b'.repeat(64), outputIndex: 0 },
			output: {
				address: addr,
				amount: [{ unit: 'lovelace', quantity: '12000000' }],
				inlineDatum: CardanoWASM.PlutusData.from_hex('40')
			}
		}
		const engine = toEngineUtxo(utxo)
		expect(engine.output.plutusData).toBe('40')
		expect(engine.output.dataHash).toBeUndefined()
	})

	it('maps a datum hash to dataHash (not plutusData)', () => {
		const utxo: UTxO = {
			input: { txHash: 'c'.repeat(64), outputIndex: 0 },
			output: {
				address: addr,
				amount: [{ unit: 'lovelace', quantity: '1017160' }],
				datumHash: 'b2a341841d44a0d757a9f4a7c60da80e09e0764c00aec65b30cc1cfcbc130d59'
			}
		}
		const engine = toEngineUtxo(utxo)
		expect(engine.output.dataHash).toBe('b2a341841d44a0d757a9f4a7c60da80e09e0764c00aec65b30cc1cfcbc130d59')
		expect(engine.output.plutusData).toBeUndefined()
	})

	it('maps a reference script to scriptRef hex', () => {
		const utxo: UTxO = {
			input: { txHash: 'd'.repeat(64), outputIndex: 0 },
			output: {
				address: addr,
				amount: [{ unit: 'lovelace', quantity: '2000000' }],
				scriptRef: { scriptCbor: '46450101002499', version: 'V3' }
			}
		}
		const engine = toEngineUtxo(utxo)
		expect(engine.output.scriptRef).toBe('46450101002499')
	})
})
