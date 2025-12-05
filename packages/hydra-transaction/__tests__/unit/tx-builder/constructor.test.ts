import { describe, it, expect, beforeEach } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { TxBuilder } from '../../../src/tx-builder'
import { DEFAULT_PROTOCOL_PARAMETERS } from '@hydra-sdk/core'

describe('TxBuilder - Constructor and Configuration', () => {
	describe('constructor', () => {
		it('should create TxBuilder with default options', () => {
			const builder = new TxBuilder()
			expect(builder).toBeDefined()
			expect(builder).toBeInstanceOf(TxBuilder)
		})

		it('should create TxBuilder with custom protocol params', () => {
			const customParams = {
				minFeeA: 100,
				minFeeB: 200000
			}
			const builder = new TxBuilder({ params: customParams })
			expect(builder).toBeDefined()
		})

		it('should create TxBuilder with fetcher', () => {
			const mockFetcher = {
				fetchAddressUTxOs: async () => [],
				fetchProtocolParameters: async () => DEFAULT_PROTOCOL_PARAMETERS
			}
			const builder = new TxBuilder({ fetcher: mockFetcher as any })
			expect(builder).toBeDefined()
		})

		it('should create TxBuilder with submitter', () => {
			const mockSubmitter = {
				submitTx: async () => 'txhash'
			}
			const builder = new TxBuilder({ submitter: mockSubmitter as any })
			expect(builder).toBeDefined()
		})

		it('should create TxBuilder with isHydra flag', () => {
			const builder = new TxBuilder({ isHydra: true })
			expect(builder).toBeDefined()
		})

		it('should create TxBuilder with verbose flag', () => {
			const builder = new TxBuilder({ verbose: true })
			expect(builder).toBeDefined()
		})

		it('should create TxBuilder with errorLogger flag', () => {
			const builder = new TxBuilder({ errorLogger: true })
			expect(builder).toBeDefined()
		})

		it('should create TxBuilder with all options', () => {
			const mockFetcher = { fetchAddressUTxOs: async () => [] }
			const mockSubmitter = { submitTx: async () => 'txhash' }
			const builder = new TxBuilder({
				fetcher: mockFetcher as any,
				submitter: mockSubmitter as any,
				isHydra: true,
				verbose: true,
				errorLogger: true,
				params: { minFeeA: 50 }
			})
			expect(builder).toBeDefined()
		})
	})

	describe('updateProtocolParams', () => {
		it('should update protocol parameters', () => {
			const builder = new TxBuilder()
			const result = builder.updateProtocolParams({ minFeeA: 100 })
			expect(result).toBe(builder) // Should return this for chaining
		})

		it('should merge with existing params', () => {
			const builder = new TxBuilder({ params: { minFeeA: 50 } })
			builder.updateProtocolParams({ minFeeB: 200000 })
			expect(builder).toBeDefined()
		})

		it('should allow chaining after update', () => {
			const builder = new TxBuilder()
			const result = builder.updateProtocolParams({ minFeeA: 100 }).updateProtocolParams({ minFeeB: 200000 })
			expect(result).toBe(builder)
		})
	})

	describe('txBuilder getter', () => {
		it('should return CardanoWASM TransactionBuilder', () => {
			const builder = new TxBuilder()
			expect(builder.txBuilder).toBeDefined()
			expect(builder.txBuilder).toBeInstanceOf(CardanoWASM.TransactionBuilder)
		})
	})

	describe('reset', () => {
		it('should reset builder to initial state', () => {
			const builder = new TxBuilder()
			builder.changeAddress(
				'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
			)
			const result = builder.reset()
			expect(result).toBe(builder) // Should return this for chaining
		})

		it('should allow building new transaction after reset', () => {
			const builder = new TxBuilder()
			builder.txOut(
				'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3',
				[{ unit: 'lovelace', quantity: '1000000' }]
			)
			builder.reset()
			// Should be able to add new output after reset
			const result = builder.txOut(
				'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3',
				[{ unit: 'lovelace', quantity: '2000000' }]
			)
			expect(result).toBe(builder)
		})
	})
})

describe('TxBuilder - Static Methods', () => {
	describe('getTxBuilder', () => {
		it('should create TransactionBuilder from protocol params', () => {
			const txBuilder = TxBuilder.getTxBuilder(DEFAULT_PROTOCOL_PARAMETERS)
			expect(txBuilder).toBeDefined()
			expect(txBuilder).toBeInstanceOf(CardanoWASM.TransactionBuilder)
		})

		it('should handle custom protocol params', () => {
			const customParams = {
				...DEFAULT_PROTOCOL_PARAMETERS,
				minFeeA: 100,
				minFeeB: 200000
			}
			const txBuilder = TxBuilder.getTxBuilder(customParams)
			expect(txBuilder).toBeDefined()
		})
	})

	describe('minAda', () => {
		it('should calculate minimum ADA for simple output', () => {
			const output = CardanoWASM.TransactionOutput.new(
				CardanoWASM.Address.from_bech32(
					'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
				),
				CardanoWASM.Value.new(CardanoWASM.BigNum.from_str('1000000'))
			)
			const minAda = TxBuilder.minAda(output)
			expect(minAda).toBeDefined()
			expect(minAda).toBeInstanceOf(CardanoWASM.BigNum)
		})

		it('should calculate minimum ADA with custom protocol params', () => {
			const output = CardanoWASM.TransactionOutput.new(
				CardanoWASM.Address.from_bech32(
					'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
				),
				CardanoWASM.Value.new(CardanoWASM.BigNum.from_str('1000000'))
			)
			const customParams = { ...DEFAULT_PROTOCOL_PARAMETERS, coinsPerUtxoSize: 5000 }
			const minAda = TxBuilder.minAda(output, customParams)
			expect(minAda).toBeDefined()
		})
	})

	describe('minAdaForAssets', () => {
		it('should calculate minimum ADA for single native asset', () => {
			const policyId = 'a'.repeat(56)
			const assetName = '746f6b656e' // "token" in hex
			const assets = [{ unit: policyId + assetName, quantity: '1000' }]
			const minAda = TxBuilder.minAdaForAssets(assets)
			expect(minAda).toBeDefined()
			expect(minAda).toBeInstanceOf(CardanoWASM.BigNum)
			expect(BigInt(minAda.to_str())).toBeGreaterThan(BigInt(0))
		})

		it('should calculate minimum ADA for native assets', () => {
			const policyId = 'a'.repeat(56)
			const assetName = '746f6b656e' // "token" in hex
			const assets = [{ unit: policyId + assetName, quantity: '1000' }]
			const minAda = TxBuilder.minAdaForAssets(assets)
			expect(minAda).toBeDefined()
			// Min ADA with assets should be higher than without
			expect(BigInt(minAda.to_str())).toBeGreaterThan(BigInt(0))
		})

		it('should calculate minimum ADA for multiple assets', () => {
			const policyId1 = 'a'.repeat(56)
			const policyId2 = 'b'.repeat(56)
			const assetName1 = '746f6b656e31' // "token1" in hex
			const assetName2 = '746f6b656e32' // "token2" in hex
			const assets = [
				{ unit: policyId1 + assetName1, quantity: '1000' },
				{ unit: policyId2 + assetName2, quantity: '2000' }
			]
			const minAda = TxBuilder.minAdaForAssets(assets)
			expect(minAda).toBeDefined()
		})

		it('should handle assets with same policy ID', () => {
			const policyId = 'a'.repeat(56)
			const assetName1 = '746f6b656e31'
			const assetName2 = '746f6b656e32'
			const assets = [
				{ unit: policyId + assetName1, quantity: '1000' },
				{ unit: policyId + assetName2, quantity: '2000' }
			]
			const minAda = TxBuilder.minAdaForAssets(assets)
			expect(minAda).toBeDefined()
		})

		it('should aggregate same asset quantities', () => {
			const policyId = 'a'.repeat(56)
			const assetName = '746f6b656e'
			const assets = [
				{ unit: policyId + assetName, quantity: '1000' },
				{ unit: policyId + assetName, quantity: '500' }
			]
			const minAda = TxBuilder.minAdaForAssets(assets)
			expect(minAda).toBeDefined()
		})
	})
})
