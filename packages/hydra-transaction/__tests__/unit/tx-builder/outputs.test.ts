import { describe, it, expect, beforeEach } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { TxBuilder } from '../../../src/tx-builder'

// Test addresses
const testAddress =
	'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
const mainnetAddress =
	'addr1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xspeqa7n'

describe('TxBuilder - Transaction Outputs', () => {
	let builder: TxBuilder

	beforeEach(() => {
		builder = new TxBuilder()
	})

	describe('txOut', () => {
		it('should add basic lovelace output', () => {
			const result = builder.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
			expect(result).toBe(builder) // Should return this for chaining
		})

		it('should add output with native assets', () => {
			const policyId = 'a'.repeat(56)
			const assetName = '746f6b656e' // "token" in hex
			const result = builder.txOut(testAddress, [
				{ unit: 'lovelace', quantity: '2000000' },
				{ unit: policyId + assetName, quantity: '1000' }
			])
			expect(result).toBe(builder)
		})

		it('should add multiple outputs', () => {
			builder
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '2000000' }])
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '3000000' }])

			expect(builder).toBeDefined()
		})

		it('should add output to mainnet address', () => {
			const result = builder.txOut(mainnetAddress, [{ unit: 'lovelace', quantity: '1000000' }])
			expect(result).toBe(builder)
		})

		it('should add output with multiple native assets', () => {
			const policyId1 = 'a'.repeat(56)
			const policyId2 = 'b'.repeat(56)
			const assetName1 = '746f6b656e31'
			const assetName2 = '746f6b656e32'
			const result = builder.txOut(testAddress, [
				{ unit: 'lovelace', quantity: '5000000' },
				{ unit: policyId1 + assetName1, quantity: '1000' },
				{ unit: policyId2 + assetName2, quantity: '2000' }
			])
			expect(result).toBe(builder)
		})

		it('should add output with zero lovelace and only assets', () => {
			const policyId = 'a'.repeat(56)
			const assetName = '746f6b656e'
			// Note: This may require minimum ADA to be added
			const result = builder.txOut(testAddress, [{ unit: policyId + assetName, quantity: '1000' }])
			expect(result).toBe(builder)
		})
	})

	describe('txOutInlineDatumValue', () => {
		it('should add inline datum to last output', () => {
			const datum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))
			builder.txOut(testAddress, [{ unit: 'lovelace', quantity: '2000000' }])
			const result = builder.txOutInlineDatumValue(datum)
			expect(result).toBe(builder)
		})

		it('should throw error if no output exists', () => {
			const datum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))
			expect(() => builder.txOutInlineDatumValue(datum)).toThrow('No output to attach datum to')
		})

		it('should throw error if datum hash already set', () => {
			const datum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))
			builder.txOut(testAddress, [{ unit: 'lovelace', quantity: '2000000' }]).txOutDatumHashValue(datum)

			expect(() => builder.txOutInlineDatumValue(datum)).toThrow('datumHash already set')
		})

		it('should handle complex inline datum', () => {
			const fields = CardanoWASM.PlutusList.new()
			fields.add(CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('1')))
			fields.add(CardanoWASM.PlutusData.new_bytes(Buffer.from('hello')))
			const datum = CardanoWASM.PlutusData.new_constr_plutus_data(
				CardanoWASM.ConstrPlutusData.new(CardanoWASM.BigNum.zero(), fields)
			)

			builder.txOut(testAddress, [{ unit: 'lovelace', quantity: '2000000' }])
			const result = builder.txOutInlineDatumValue(datum)
			expect(result).toBe(builder)
		})
	})

	describe('txOutDatumHashValue', () => {
		it('should add datum hash to last output', () => {
			const datum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))
			builder.txOut(testAddress, [{ unit: 'lovelace', quantity: '2000000' }])
			const result = builder.txOutDatumHashValue(datum)
			expect(result).toBe(builder)
		})

		it('should throw error if no output exists', () => {
			const datum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))
			expect(() => builder.txOutDatumHashValue(datum)).toThrow('No output to attach datum to')
		})

		it('should throw error if inline datum already set', () => {
			const datum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))
			builder.txOut(testAddress, [{ unit: 'lovelace', quantity: '2000000' }]).txOutInlineDatumValue(datum)

			expect(() => builder.txOutDatumHashValue(datum)).toThrow('inlineDatum already set')
		})
	})

	describe('txOutReferenceScript', () => {
		const scriptCbor = '4e4d01000033222220051'

		it('should add reference script to last output', () => {
			builder.txOut(testAddress, [{ unit: 'lovelace', quantity: '5000000' }])
			const result = builder.txOutReferenceScript(scriptCbor)
			expect(result).toBe(builder)
		})

		it('should add reference script with version', () => {
			builder.txOut(testAddress, [{ unit: 'lovelace', quantity: '5000000' }])
			const result = builder.txOutReferenceScript(scriptCbor, 'V2')
			expect(result).toBe(builder)
		})

		it('should throw error if no output exists', () => {
			expect(() => builder.txOutReferenceScript(scriptCbor)).toThrow('No output to attach script to')
		})
	})

	describe('addOutput (legacy)', () => {
		it('should add output using legacy method', () => {
			const output = {
				address: testAddress,
				amount: [{ unit: 'lovelace', quantity: '1000000' }]
			}
			const result = builder.addOutput(output)
			expect(result).toBe(builder)
		})

		it('should add output with assets using legacy method', () => {
			const policyId = 'a'.repeat(56)
			const assetName = '746f6b656e'
			const output = {
				address: testAddress,
				amount: [
					{ unit: 'lovelace', quantity: '2000000' },
					{ unit: policyId + assetName, quantity: '500' }
				]
			}
			const result = builder.addOutput(output)
			expect(result).toBe(builder)
		})
	})

	describe('addOutputs (legacy)', () => {
		it('should add multiple outputs using legacy method', () => {
			const outputs = [
				{
					address: testAddress,
					amount: [{ unit: 'lovelace', quantity: '1000000' }]
				},
				{
					address: testAddress,
					amount: [{ unit: 'lovelace', quantity: '2000000' }]
				}
			]
			const result = builder.addOutputs(outputs)
			expect(result).toBe(builder)
		})

		it('should handle empty array', () => {
			const result = builder.addOutputs([])
			expect(result).toBe(builder)
		})
	})

	describe('addLovelaceOutput (legacy)', () => {
		it('should add lovelace-only output', () => {
			const result = builder.addLovelaceOutput(testAddress, '1500000')
			expect(result).toBe(builder)
		})

		it('should add multiple lovelace outputs', () => {
			builder
				.addLovelaceOutput(testAddress, '1000000')
				.addLovelaceOutput(testAddress, '2000000')
				.addLovelaceOutput(testAddress, '3000000')

			expect(builder).toBeDefined()
		})
	})
})
