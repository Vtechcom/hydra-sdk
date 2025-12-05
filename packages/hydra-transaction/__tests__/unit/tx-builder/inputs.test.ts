import { describe, it, expect, beforeEach } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { TxBuilder } from '../../../src/tx-builder'
import { emptyRedeemer } from '../../../src/utils/redeemer-builder'

// Test addresses
const testAddress =
	'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
const testTxHash = 'a'.repeat(64)

describe('TxBuilder - Transaction Inputs', () => {
	let builder: TxBuilder

	beforeEach(() => {
		builder = new TxBuilder()
	})

	describe('txIn', () => {
		it('should add basic transaction input', () => {
			const result = builder.txIn(testTxHash, 0)
			expect(result).toBe(builder) // Should return this for chaining
		})

		it('should add input with amount', () => {
			const result = builder.txIn(testTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }])
			expect(result).toBe(builder)
		})

		it('should add input with address', () => {
			const result = builder.txIn(testTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
			expect(result).toBe(builder)
		})

		it('should add multiple inputs', () => {
			builder
				.txIn(testTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
				.txIn('b'.repeat(64), 1, [{ unit: 'lovelace', quantity: '3000000' }], testAddress)

			expect(builder).toBeDefined()
		})

		it('should add input with native assets', () => {
			const policyId = 'c'.repeat(56)
			const assetName = '746f6b656e'
			const result = builder.txIn(
				testTxHash,
				0,
				[
					{ unit: 'lovelace', quantity: '5000000' },
					{ unit: policyId + assetName, quantity: '1000' }
				],
				testAddress
			)
			expect(result).toBe(builder)
		})
	})

	describe('txInInlineDatum', () => {
		it('should add inline datum to last input', () => {
			const datum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))
			builder.txIn(testTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
			const result = builder.txInInlineDatum(datum)
			expect(result).toBe(builder)
		})

		it('should throw error if no input exists', () => {
			const datum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))
			expect(() => builder.txInInlineDatum(datum)).toThrow('No input to attach inline datum to')
		})

		it('should throw error if datum already set', () => {
			const datum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))
			builder.txIn(testTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress).txInDatumHash(datum)

			expect(() => builder.txInInlineDatum(datum)).toThrow('Cannot use both inlineDatum and datumHash')
		})
	})

	describe('txInDatumHash', () => {
		it('should add datum hash to last input', () => {
			const datum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))
			builder.txIn(testTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
			const result = builder.txInDatumHash(datum)
			expect(result).toBe(builder)
		})

		it('should throw error if no input exists', () => {
			const datum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))
			expect(() => builder.txInDatumHash(datum)).toThrow('No input to attach datum hash to')
		})

		it('should throw error if inline datum already set', () => {
			const datum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))
			builder.txIn(testTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress).txInInlineDatum(datum)

			expect(() => builder.txInDatumHash(datum)).toThrow('Cannot use both inlineDatum and datumHash')
		})
	})

	describe('txInRedeemerValue', () => {
		it('should add redeemer to last input', () => {
			const redeemer = emptyRedeemer({ type: 'int' })
			builder.txIn(testTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
			const result = builder.txInRedeemerValue(redeemer)
			expect(result).toBe(builder)
		})

		it('should throw error if no input exists', () => {
			const redeemer = emptyRedeemer({ type: 'int' })
			expect(() => builder.txInRedeemerValue(redeemer)).toThrow('No input to attach redeemer to')
		})
	})

	describe('txInEmptyRedeemer', () => {
		it('should add empty redeemer to last input', () => {
			builder.txIn(testTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
			const result = builder.txInEmptyRedeemer()
			expect(result).toBe(builder)
		})

		it('should throw error if no input exists', () => {
			expect(() => builder.txInEmptyRedeemer()).toThrow('No input to attach redeemer to')
		})
	})

	describe('txInScript', () => {
		// Note: txInScript requires valid Plutus script CBOR that can be parsed by the WASM library.
		// The actual script parsing is tested in integration tests. Here we test error handling.
		const scriptCbor = '4e4d010000332222200510'

		it('should throw error if no input exists', () => {
			expect(() => builder.txInScript(scriptCbor)).toThrow('No input to attach script to')
		})

		it('should throw error if no input exists for V1', () => {
			expect(() => builder.txInScript(scriptCbor, 'V1')).toThrow('No input to attach script to')
		})

		it('should throw error if no input exists for V2', () => {
			expect(() => builder.txInScript(scriptCbor, 'V2')).toThrow('No input to attach script to')
		})

		it('should throw error if no input exists for V3', () => {
			expect(() => builder.txInScript(scriptCbor, 'V3')).toThrow('No input to attach script to')
		})
	})

	describe('spendingPlutusScript', () => {
		it('should throw error if no input exists', () => {
			expect(() => builder.spendingPlutusScript('V3')).toThrow('No input to set script version for')
		})

		it('should throw error if no script attached', () => {
			builder.txIn(testTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
			expect(() => builder.spendingPlutusScript('V3')).toThrow('No script attached to input')
		})
	})

	describe('setInputs (legacy)', () => {
		it('should set inputs from UTxO array', () => {
			const utxos = [
				{
					input: { txHash: testTxHash, outputIndex: 0 },
					output: {
						address: testAddress,
						amount: [{ unit: 'lovelace', quantity: '5000000' }]
					}
				}
			]
			const result = builder.setInputs(utxos)
			expect(result).toBe(builder)
		})

		it('should set inputs with custom strategy', () => {
			const utxos = [
				{
					input: { txHash: testTxHash, outputIndex: 0 },
					output: {
						address: testAddress,
						amount: [{ unit: 'lovelace', quantity: '5000000' }]
					}
				}
			]
			const result = builder.setInputs(utxos, { strategy: 'RandomImprove' })
			expect(result).toBe(builder)
		})
	})

	describe('setInputUtxo', () => {
		it('should set input UTxO object', () => {
			const utxoObject = {
				[`${testTxHash}#0` as const]: {
					address: testAddress,
					datum: null,
					datumhash: null,
					inlineDatum: null,
					referenceScript: null,
					value: { lovelace: 5000000 }
				}
			}
			const result = builder.setInputUtxo(utxoObject)
			expect(result).toBe(builder)
		})
	})

	describe('addInputUtxo', () => {
		it('should add to existing input UTxO object', () => {
			const utxoObject1 = {
				[`${testTxHash}#0` as const]: {
					address: testAddress,
					datum: null,
					datumhash: null,
					inlineDatum: null,
					referenceScript: null,
					value: { lovelace: 5000000 }
				}
			}
			const utxoObject2 = {
				[`${'b'.repeat(64)}#1` as const]: {
					address: testAddress,
					datum: null,
					datumhash: null,
					inlineDatum: null,
					referenceScript: null,
					value: { lovelace: 3000000 }
				}
			}
			builder.setInputUtxo(utxoObject1)
			const result = builder.addInputUtxo(utxoObject2)
			expect(result).toBe(builder)
		})
	})
})
