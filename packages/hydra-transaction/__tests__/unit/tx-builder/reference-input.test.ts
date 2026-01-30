import { describe, it, expect, beforeEach } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { TxBuilder } from '../../../src/tx-builder'
import type { UTxO } from '@hydra-sdk/core'

// Test addresses
const testAddress =
	'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
const testTxHash = 'a'.repeat(64)
const refTxHash = 'b'.repeat(64)

// Helper to create test UTxOs
const createTestUtxo = (
	txHash: string,
	outputIndex: number,
	lovelace: string,
	assets: { unit: string; quantity: string }[] = []
): UTxO => ({
	input: { txHash, outputIndex },
	output: {
		address: testAddress,
		amount: [{ unit: 'lovelace', quantity: lovelace }, ...assets]
	}
})

describe('TxBuilder - Reference Inputs', () => {
	let builder: TxBuilder

	beforeEach(() => {
		builder = new TxBuilder({ isHydra: true })
	})

	describe('txInReference - basic functionality', () => {
		it('should add a single reference input', () => {
			const result = builder.txInReference(refTxHash, 0)

			expect(result).toBe(builder) // Should return builder for chaining
		})

		it('should support method chaining', () => {
			const result = builder.txInReference(refTxHash, 0).txInReference(refTxHash, 1).txInReference(refTxHash, 2)

			expect(result).toBe(builder)
		})

		it('should add multiple reference inputs', () => {
			builder.txInReference(refTxHash, 0).txInReference(refTxHash, 1).txInReference('c'.repeat(64), 0)

			// Verify by building a transaction
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			expect(builder.complete()).resolves.toBeDefined()
		})

		it('should handle different output indices', () => {
			builder
				.txInReference(refTxHash, 0)
				.txInReference(refTxHash, 5)
				.txInReference(refTxHash, 10)
				.txInReference(refTxHash, 999)

			expect(builder).toBeDefined()
		})

		it('should accept valid 64-character tx hash', () => {
			const validTxHash = 'a'.repeat(64)

			expect(() => builder.txInReference(validTxHash, 0)).not.toThrow()
		})
	})

	describe('txInReference - transaction building', () => {
		it('should build transaction with single reference input', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.txInReference(refTxHash, 0)
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
			expect(tx).toBeInstanceOf(CardanoWASM.Transaction)
		})

		it('should build transaction with multiple reference inputs', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.txInReference(refTxHash, 0)
				.txInReference(refTxHash, 1)
				.txInReference('c'.repeat(64), 0)
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
			expect(tx).toBeInstanceOf(CardanoWASM.Transaction)
		})

		it('should build transaction without reference inputs', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
		})

		it('should work with reference inputs before setting regular inputs', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder.txInReference(refTxHash, 0) // Reference input first

			builder
				.setInputs(utxos) // Regular inputs after
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
		})

		it('should work with reference inputs after setting regular inputs', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.setInputs(utxos) // Regular inputs first
				.txInReference(refTxHash, 0) // Reference input after
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
		})
	})

	describe('txInReference - with regular inputs', () => {
		it('should combine reference inputs with regular inputs', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000'), createTestUtxo(testTxHash, 1, '5000000')]

			builder
				.txInReference(refTxHash, 0) // Reference input (not consumed)
				.setInputs(utxos) // Regular inputs (consumed)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '13000000' }])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
			tx.body().reference_inputs().len()
			// Regular inputs should be in the transaction
			expect(tx.body().inputs().len()).toBe(2)
		})

		it('should not affect transaction balance with reference inputs', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			// Build transaction without reference input
			const builder1 = new TxBuilder({ isHydra: true })
			builder1
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			const tx1 = await builder1.complete()
			const outputsWithoutRef = tx1.body().outputs().len()

			// Build same transaction with reference input
			const builder2 = new TxBuilder({ isHydra: true })
			builder2
				.txInReference(refTxHash, 0) // Add reference input
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			const tx2 = await builder2.complete()
			const outputsWithRef = tx2.body().outputs().len()

			// Outputs should be same (reference inputs don't affect balance)
			expect(outputsWithRef).toBe(outputsWithoutRef)
		})
	})

	describe('txInReference - with other transaction features', () => {
		it('should work with validity range', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.txInReference(refTxHash, 0)
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.invalidBefore(1000)
				.invalidAfter(2000)
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
			expect(tx.body().validity_start_interval_bignum()?.to_str()).toBe('1000')
			expect(tx.body().ttl_bignum()?.to_str()).toBe('2000')
		})

		it('should work with metadata', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.txInReference(refTxHash, 0)
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.metadataValue(674, { msg: ['Reference input test'] })
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
			expect(tx.auxiliary_data()).toBeDefined()
		})

		it('should work with required signers', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]
			const signerHash = 'a'.repeat(56)

			builder
				.txInReference(refTxHash, 0)
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.requiredSignerHash(signerHash)
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
			expect(tx.body().required_signers()?.len()).toBe(1)
		})

		it('should work with inline datum outputs', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]
			const datum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))

			builder
				.txInReference(refTxHash, 0)
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '2000000' }])
				.txOutInlineDatumValue(datum)
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
		})

		it('should work with datum hash outputs', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]
			const datum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))

			builder
				.txInReference(refTxHash, 0)
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '2000000' }])
				.txOutDatumHashValue(datum)
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
		})

		it('should work with collateral', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.txInReference(refTxHash, 0)
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.txInCollateral('c'.repeat(64), 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
		})

		it('should work with native assets', async () => {
			const policyId = 'a'.repeat(56)
			const assetName = '746f6b656e'
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000', [{ unit: policyId + assetName, quantity: '1000' }])]

			builder
				.txInReference(refTxHash, 0)
				.setInputs(utxos)
				.txOut(testAddress, [
					{ unit: 'lovelace', quantity: '2000000' },
					{ unit: policyId + assetName, quantity: '500' }
				])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
		})
	})

	describe('txInReference - transaction serialization', () => {
		it('should produce valid hex with reference inputs', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.txInReference(refTxHash, 0)
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			const txHex = tx.to_hex()

			expect(txHex).toBeDefined()
			expect(typeof txHex).toBe('string')
			expect(txHex.length).toBeGreaterThan(0)
		})

		it('should produce deserializable transaction with reference inputs', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.txInReference(refTxHash, 0)
				.txInReference(refTxHash, 1)
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			const txHex = tx.to_hex()

			// Should be able to deserialize back
			const deserialized = CardanoWASM.Transaction.from_hex(txHex)
			expect(deserialized).toBeDefined()
			expect(deserialized.body().outputs().len()).toBe(tx.body().outputs().len())
			expect(deserialized.body().inputs().len()).toBe(tx.body().inputs().len())
		})
	})

	describe('txInReference - edge cases', () => {
		it('should handle zero output index', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.txInReference(refTxHash, 0)
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
		})

		it('should handle large output index', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.txInReference(refTxHash, 9999)
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
		})

		it('should handle same reference input used multiple times', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.txInReference(refTxHash, 0)
				.txInReference(refTxHash, 0) // Same reference input twice
				.txInReference(refTxHash, 0) // And again
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
		})

		it('should handle many reference inputs', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			// Add 10 reference inputs
			for (let i = 0; i < 10; i++) {
				builder.txInReference(refTxHash, i)
			}

			builder
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
		})

		it('should handle different tx hashes as reference inputs', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.txInReference('a'.repeat(64), 0)
				.txInReference('b'.repeat(64), 0)
				.txInReference('c'.repeat(64), 0)
				.txInReference('d'.repeat(64), 0)
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
		})
	})

	describe('txInReference - complex scenarios', () => {
		it('should build complex transaction with multiple features and reference inputs', async () => {
			const policyId = 'a'.repeat(56)
			const assetName = '746f6b656e'
			const utxos: UTxO[] = [
				createTestUtxo(testTxHash, 0, '50000000', [{ unit: policyId + assetName, quantity: '1000' }]),
				createTestUtxo(testTxHash, 1, '30000000')
			]
			const datum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('123'))
			const signerHash = 'a'.repeat(56)

			builder
				.txInReference(refTxHash, 0) // Reference script
				.txInReference(refTxHash, 1) // Reference datum
				.setInputs(utxos)
				.txOut(testAddress, [
					{ unit: 'lovelace', quantity: '50000000' },
					{ unit: policyId + assetName, quantity: '500' }
				])
				.txOutInlineDatumValue(datum)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '20000000' }])
				.invalidBefore(1000)
				.invalidAfter(5000)
				.requiredSignerHash(signerHash)
				.metadataValue(674, { msg: ['Complex transaction with reference inputs'] })
				.txInCollateral('c'.repeat(64), 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
			expect(tx).toBeInstanceOf(CardanoWASM.Transaction)

			// Verify key properties
			expect(tx.body().inputs().len()).toBe(2) // Regular inputs
			expect(tx.body().reference_inputs().len()).toBe(2) // Reference inputs
			expect(tx.body().outputs().len()).toBeGreaterThanOrEqual(2)
			expect(tx.body().validity_start_interval_bignum()?.to_str()).toBe('1000')
			expect(tx.body().ttl_bignum()?.to_str()).toBe('5000')
			expect(tx.body().required_signers()?.len()).toBe(1)
			expect(tx.auxiliary_data()).toBeDefined()
		})

		it('should support full method chaining with reference inputs', () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '50000000')]

			const result = builder
				.txInReference(refTxHash, 0)
				.txInReference(refTxHash, 1)
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '2000000' }])
				.invalidBefore(1000)
				.invalidAfter(5000)
				.requiredSignerHash('a'.repeat(56))
				.metadataValue(674, { msg: ['test'] })
				.changeAddress(testAddress)

			expect(result).toBe(builder)
		})
	})
})
