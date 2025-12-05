import { describe, it, expect, beforeEach } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { TxBuilder } from '../../../src/tx-builder'
import { emptyRedeemer } from '../../../src/utils/redeemer-builder'

// Test addresses
const testAddress =
	'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
const testTxHash = 'a'.repeat(64)

describe('TxBuilder - Collateral', () => {
	let builder: TxBuilder

	beforeEach(() => {
		builder = new TxBuilder()
	})

	describe('txInCollateral', () => {
		it('should add collateral input', () => {
			const result = builder.txInCollateral(testTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
			expect(result).toBe(builder) // Should return this for chaining
		})

		it('should add multiple collateral inputs', () => {
			builder
				.txInCollateral(testTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
				.txInCollateral('b'.repeat(64), 1, [{ unit: 'lovelace', quantity: '3000000' }], testAddress)

			expect(builder).toBeDefined()
		})

		it('should handle collateral with exact 5 ADA', () => {
			const result = builder.txInCollateral(testTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
			expect(result).toBe(builder)
		})

		it('should handle large collateral amounts', () => {
			const result = builder.txInCollateral(testTxHash, 0, [{ unit: 'lovelace', quantity: '100000000' }], testAddress)
			expect(result).toBe(builder)
		})
	})

	describe('totalCollateral', () => {
		it('should set total collateral amount', () => {
			const result = builder.totalCollateral('5000000')
			expect(result).toBe(builder)
		})

		it('should allow chaining with txInCollateral', () => {
			const result = builder
				.txInCollateral(testTxHash, 0, [{ unit: 'lovelace', quantity: '10000000' }], testAddress)
				.totalCollateral('5000000')
			expect(result).toBe(builder)
		})
	})

	describe('collateralReturn', () => {
		it('should set collateral return output', () => {
			const result = builder.collateralReturn(testAddress, [{ unit: 'lovelace', quantity: '4500000' }])
			expect(result).toBe(builder)
		})

		it('should allow full collateral workflow', () => {
			const result = builder
				.txInCollateral(testTxHash, 0, [{ unit: 'lovelace', quantity: '10000000' }], testAddress)
				.totalCollateral('5000000')
				.collateralReturn(testAddress, [{ unit: 'lovelace', quantity: '5000000' }])
			expect(result).toBe(builder)
		})
	})
})

describe('TxBuilder - Minting', () => {
	let builder: TxBuilder

	beforeEach(() => {
		builder = new TxBuilder()
	})

	const testPolicyId = 'a'.repeat(56)
	const testAssetName = '746f6b656e' // "token" in hex

	describe('mint', () => {
		it('should add mint operation', () => {
			const result = builder.mint('1000', testPolicyId, testAssetName)
			expect(result).toBe(builder)
		})

		it('should add multiple mint operations', () => {
			builder.mint('1000', testPolicyId, testAssetName).mint('500', 'b'.repeat(56), '746f6b656e32')

			expect(builder).toBeDefined()
		})

		it('should handle negative quantity (burn)', () => {
			const result = builder.mint('-500', testPolicyId, testAssetName)
			expect(result).toBe(builder)
		})

		it('should handle large quantities', () => {
			const result = builder.mint('999999999999999', testPolicyId, testAssetName)
			expect(result).toBe(builder)
		})

		it('should handle empty asset name', () => {
			const result = builder.mint('1000', testPolicyId, '')
			expect(result).toBe(builder)
		})
	})

	describe('mintPlutusScript', () => {
		it('should set minting script version', () => {
			const result = builder.mintPlutusScript('V3')
			expect(result).toBe(builder)
		})

		it('should set V1 minting script', () => {
			const result = builder.mintPlutusScript('V1')
			expect(result).toBe(builder)
		})

		it('should set V2 minting script', () => {
			const result = builder.mintPlutusScript('V2')
			expect(result).toBe(builder)
		})
	})

	describe('mintingScript', () => {
		it('should add PlutusV3 minting script', () => {
			builder.mint('1000', testPolicyId, testAssetName)
			const result = builder.mintingScript({
				type: 'PlutusV3',
				scriptCborHex: '4e4d01000033222220051'
			})
			expect(result).toBe(builder)
		})

		it('should add PlutusV2 minting script', () => {
			builder.mint('1000', testPolicyId, testAssetName)
			const result = builder.mintingScript({
				type: 'PlutusV2',
				scriptCborHex: '4e4d01000033222220051'
			})
			expect(result).toBe(builder)
		})

		it('should add PlutusV1 minting script', () => {
			builder.mint('1000', testPolicyId, testAssetName)
			const result = builder.mintingScript({
				type: 'PlutusV1',
				scriptCborHex: '4e4d01000033222220051'
			})
			expect(result).toBe(builder)
		})

		it('should add Native minting script', () => {
			// Native script that requires signature
			const nativeScriptHex = '8200581c' + 'a'.repeat(56)
			builder.mint('1000', testPolicyId, testAssetName)
			const result = builder.mintingScript({
				type: 'Native',
				scriptCborHex: nativeScriptHex
			})
			expect(result).toBe(builder)
		})

		it('should throw error if no mint exists', () => {
			expect(() =>
				builder.mintingScript({
					type: 'PlutusV3',
					scriptCborHex: '4e4d01000033222220051'
				})
			).toThrow('No mint to attach script to')
		})
	})

	describe('mintRedeemerValue', () => {
		it('should add redeemer to mint', () => {
			const redeemer = emptyRedeemer({ type: 'int', tag: 'MINT' })
			builder.mint('1000', testPolicyId, testAssetName)
			const result = builder.mintRedeemerValue(redeemer)
			expect(result).toBe(builder)
		})

		it('should throw error if no mint exists', () => {
			const redeemer = emptyRedeemer({ type: 'int', tag: 'MINT' })
			expect(() => builder.mintRedeemerValue(redeemer)).toThrow('No mint to attach redeemer to')
		})
	})
})

describe('TxBuilder - Certificates', () => {
	let builder: TxBuilder

	beforeEach(() => {
		builder = new TxBuilder()
	})

	const testRewardAddress = 'stake_test1uqfu74w3wh4gfzu8m6e7j987h4lq9r3t7ef5gaw497uu85qsqfy27'
	const testPoolKeyHash = 'a'.repeat(56)

	describe('registerStake', () => {
		it('should register stake address', () => {
			const result = builder.registerStake(testRewardAddress)
			expect(result).toBe(builder)
		})

		it('should allow multiple stake registrations', () => {
			builder.registerStake(testRewardAddress).registerStake(testRewardAddress)

			expect(builder).toBeDefined()
		})
	})

	describe('deregisterStake', () => {
		it('should deregister stake address', () => {
			const result = builder.deregisterStake(testRewardAddress)
			expect(result).toBe(builder)
		})
	})

	describe('delegateStake', () => {
		it('should delegate stake to pool', () => {
			const result = builder.delegateStake(testRewardAddress, testPoolKeyHash)
			expect(result).toBe(builder)
		})

		it('should allow register and delegate in same transaction', () => {
			builder.registerStake(testRewardAddress).delegateStake(testRewardAddress, testPoolKeyHash)

			expect(builder).toBeDefined()
		})
	})
})

describe('TxBuilder - Withdrawals', () => {
	let builder: TxBuilder

	beforeEach(() => {
		builder = new TxBuilder()
	})

	const testRewardAddress = 'stake_test1uqfu74w3wh4gfzu8m6e7j987h4lq9r3t7ef5gaw497uu85qsqfy27'

	describe('withdrawal', () => {
		it('should add withdrawal', () => {
			const result = builder.withdrawal(testRewardAddress, '1000000')
			expect(result).toBe(builder)
		})

		it('should add multiple withdrawals', () => {
			builder.withdrawal(testRewardAddress, '1000000').withdrawal(testRewardAddress, '500000')

			expect(builder).toBeDefined()
		})

		it('should handle large withdrawal amounts', () => {
			const result = builder.withdrawal(testRewardAddress, '999999999999')
			expect(result).toBe(builder)
		})

		it('should handle zero withdrawal', () => {
			const result = builder.withdrawal(testRewardAddress, '0')
			expect(result).toBe(builder)
		})
	})
})
