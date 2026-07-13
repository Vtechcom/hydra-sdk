import { describe, it, expect, vi, beforeEach } from 'vitest'
import { convertTxOutputToWasm } from '../../../../src/utils/cardano-wasm/converter'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { mockData } from '../../../mocks/converter'
import { TxOutput } from '../../../../src/types/cardano'

// Mock dependencies
vi.mock('../../../../src/utils/address', () => ({
	isValidAddress: vi.fn(addr => addr && addr.startsWith('addr_test'))
}))

// Valid testnet address for testing
const VALID_ADDRESS = mockData.address

describe('convertTxOutputToWasm', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	// ------------------------------
	// 1. INVALID INPUTS
	// ------------------------------
	it('throws error for invalid address', () => {
		const input: TxOutput = {
			address: 'invalid',
			amount: [{ unit: 'lovelace', quantity: '1000' }]
		}
		expect(() => convertTxOutputToWasm(input)).toThrow('Invalid address')
	})

	it('throws error for invalid amount', () => {
		const input = { address: VALID_ADDRESS, amount: null as any }
		expect(() => convertTxOutputToWasm(input)).toThrow('Invalid amount')
	})

	it('throws if both inlineDatum and datum are provided', () => {
		const inlineDatum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('1'))
		const datum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('2'))
		const txOutput: TxOutput = {
			address: VALID_ADDRESS,
			amount: [{ unit: 'lovelace', quantity: '1000' }],
			inlineDatum,
			datum
		}
		expect(() => convertTxOutputToWasm(txOutput)).toThrow('Cannot use both inlineDatum and datumHash')
	})

	// ------------------------------
	// 2. SIMPLE OUTPUT (ONLY LOVELACE)
	// ------------------------------
	it('creates output with lovelace only', () => {
		const input: TxOutput = {
			address: VALID_ADDRESS,
			amount: [{ unit: 'lovelace', quantity: '2000000' }]
		}

		const result = convertTxOutputToWasm(input)

		expect(result).toBeDefined()
		expect(result.address().to_bech32()).toBe(VALID_ADDRESS)
		expect(result.amount().coin().to_str()).toBe('2000000')
		expect(result.amount().multiasset()).toBeUndefined()
	})

	// ------------------------------
	// 3. OUTPUT WITH MULTI-ASSETS
	// ------------------------------
	it('handles multi-asset output correctly', () => {
		const policyId = 'a'.repeat(56) // Valid 56 char hex policy id
		const assetName = '746f6b656e31' // "token1" in hex

		const input: TxOutput = {
			address: VALID_ADDRESS,
			amount: [
				{ unit: 'lovelace', quantity: '5000000' },
				{ unit: `${policyId}${assetName}`, quantity: '10' },
				{ unit: `${policyId}${assetName}`, quantity: '5' } // sum = 15
			]
		}

		const result = convertTxOutputToWasm(input)

		expect(result).toBeDefined()
		expect(result.amount().coin().to_str()).toBe('5000000')
		expect(result.amount().multiasset()).toBeDefined()
	})

	// ------------------------------
	// 4. INLINE DATUM
	// ------------------------------
	it('sets inline datum correctly', () => {
		const inlineDatum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))
		const input: TxOutput = {
			address: VALID_ADDRESS,
			amount: [{ unit: 'lovelace', quantity: '1000000' }],
			inlineDatum
		}

		const result = convertTxOutputToWasm(input)

		expect(result).toBeDefined()
		expect(result.plutus_data()).toBeDefined()
	})

	// ------------------------------
	// 5. DATUM HASH
	// ------------------------------
	it('sets datum hash correctly', () => {
		const datum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('123'))
		const input: TxOutput = {
			address: VALID_ADDRESS,
			amount: [{ unit: 'lovelace', quantity: '1000000' }],
			datum
		}

		const result = convertTxOutputToWasm(input)

		expect(result).toBeDefined()
		expect(result.data_hash()).toBeDefined()
	})
})
