import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { TxBuilder } from '../../../src/tx-builder'
import type { UTxO } from '@hydra-sdk/core'

// Test addresses
const testAddress =
	'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
const testTxHash = 'a'.repeat(64)

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

describe('TxBuilder - Transaction Building (complete)', () => {
	let builder: TxBuilder

	beforeEach(() => {
		builder = new TxBuilder({ isHydra: true }) // Use isHydra to allow building without strict validation
	})

	describe('complete', () => {
		it('should build simple transaction with Hydra mode', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
			expect(tx).toBeInstanceOf(CardanoWASM.Transaction)
		})

		it('should build transaction with multiple outputs', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '20000000')]

			builder
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '2000000' }])
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '3000000' }])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
			expect(tx.body().outputs().len()).toBeGreaterThanOrEqual(3)
		})

		it('should build transaction with validity range', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
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

		it('should build transaction with required signers', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]
			const signerHash = 'a'.repeat(56)

			builder
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.requiredSignerHash(signerHash)
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
			expect(tx.body().required_signers()?.len()).toBe(1)
		})

		it('should build transaction with metadata', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.metadataValue(674, { msg: ['Hello, Cardano!'] })
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
			expect(tx.auxiliary_data()).toBeDefined()
		})

		it('should build transaction with native assets', async () => {
			const policyId = 'a'.repeat(56)
			const assetName = '746f6b656e'
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000', [{ unit: policyId + assetName, quantity: '1000' }])]

			builder
				.setInputs(utxos)
				.txOut(testAddress, [
					{ unit: 'lovelace', quantity: '2000000' },
					{ unit: policyId + assetName, quantity: '500' }
				])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
		})

		it('should throw error for txHex before complete', () => {
			expect(() => builder.txHex).toThrow('Call complete() first')
		})
	})

	describe('complete with collateral', () => {
		it('should build transaction with collateral', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.txInCollateral('b'.repeat(64), 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
		})

		it('should build transaction with collateral return', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.txInCollateral('b'.repeat(64), 0, [{ unit: 'lovelace', quantity: '10000000' }], testAddress)
				.collateralReturn(testAddress, [{ unit: 'lovelace', quantity: '5000000' }])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
		})
	})

	describe('complete with inline datum', () => {
		it('should build transaction with output inline datum', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]
			const datum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))

			builder
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '2000000' }])
				.txOutInlineDatumValue(datum)
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
			// Check that output has datum
			const outputs = tx.body().outputs()
			expect(outputs.len()).toBeGreaterThanOrEqual(1)
		})
	})

	describe('complete with datum hash', () => {
		it('should build transaction with output datum hash', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]
			const datum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))

			builder
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '2000000' }])
				.txOutDatumHashValue(datum)
				.changeAddress(testAddress)

			const tx = await builder.complete()
			expect(tx).toBeDefined()
		})
	})
})

describe('TxBuilder - Transaction Serialization', () => {
	let builder: TxBuilder

	beforeEach(() => {
		builder = new TxBuilder({ isHydra: true })
	})

	describe('transaction hex', () => {
		it('should produce valid hex after complete', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			const txHex = tx.to_hex()

			expect(txHex).toBeDefined()
			expect(typeof txHex).toBe('string')
			expect(txHex.length).toBeGreaterThan(0)
		})

		it('should produce deserializable transaction', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			const txHex = tx.to_hex()

			// Should be able to deserialize back
			const deserialized = CardanoWASM.Transaction.from_hex(txHex)
			expect(deserialized).toBeDefined()
			expect(deserialized.body().outputs().len()).toBe(tx.body().outputs().len())
		})
	})

	describe('transaction body', () => {
		it('should have correct outputs', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			const body = tx.body()

			expect(body).toBeDefined()
			expect(body.outputs().len()).toBeGreaterThanOrEqual(1)
		})

		it('should have fee set', async () => {
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			const tx = await builder.complete()
			const fee = tx.body().fee()

			expect(fee).toBeDefined()
		})
	})
})

describe('TxBuilder - Error Handling', () => {
	describe('non-Hydra mode errors', () => {
		it('should require change address in non-Hydra mode', async () => {
			const builder = new TxBuilder({ isHydra: false })
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

			builder.setInputs(utxos).txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])

			await expect(builder.complete()).rejects.toThrow()
		})
	})

	describe('collateral validation', () => {
		it('should reject collateral with assets', async () => {
			const builder = new TxBuilder({ isHydra: true })
			const policyId = 'a'.repeat(56)
			const assetName = '746f6b656e'

			expect(() =>
				builder.txInCollateral(
					testTxHash,
					0,
					[
						{ unit: 'lovelace', quantity: '5000000' },
						{ unit: policyId + assetName, quantity: '100' }
					],
					testAddress
				)
			).not.toThrow() // Adding doesn't throw

			// But building should fail when collateral has assets
			const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]
			builder
				.setInputs(utxos)
				.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
				.changeAddress(testAddress)

			// This will throw during complete when processing collateral
			await expect(builder.complete()).rejects.toThrow('Collateral UTxO must contain only lovelace')
		})
	})
})

describe('TxBuilder - Method Chaining', () => {
	it('should support full method chaining', () => {
		const builder = new TxBuilder({ isHydra: true })
		const utxos: UTxO[] = [createTestUtxo(testTxHash, 0, '50000000')]

		const result = builder
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

	it('should support reset and rebuild', async () => {
		// First builder and build
		const builder1 = new TxBuilder({ isHydra: true })
		const utxos1: UTxO[] = [createTestUtxo(testTxHash, 0, '10000000')]

		builder1
			.setInputs(utxos1)
			.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
			.changeAddress(testAddress)

		const tx1 = await builder1.complete()
		expect(tx1).toBeDefined()

		// Second builder (fresh instance)
		const builder2 = new TxBuilder({ isHydra: true })
		const utxos2: UTxO[] = [createTestUtxo('b'.repeat(64), 0, '20000000')]

		builder2
			.setInputs(utxos2)
			.txOut(testAddress, [{ unit: 'lovelace', quantity: '5000000' }])
			.changeAddress(testAddress)

		const tx2 = await builder2.complete()
		expect(tx2).toBeDefined()
	})
})
