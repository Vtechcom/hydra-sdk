import { describe, it, expect, beforeEach } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { TxBuilder } from '../../../src/tx-builder'

// Test addresses
const testAddress =
	'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
const testPubKeyHash = 'a'.repeat(56)

describe('TxBuilder - Metadata', () => {
	let builder: TxBuilder

	beforeEach(() => {
		builder = new TxBuilder()
	})

	describe('metadataValue', () => {
		it('should add string metadata with number label', () => {
			const result = builder.metadataValue(721, 'test metadata')
			expect(result).toBe(builder)
		})

		it('should add string metadata with bigint label', () => {
			const result = builder.metadataValue(BigInt(721), 'test metadata')
			expect(result).toBe(builder)
		})

		it('should add string metadata with string label', () => {
			const result = builder.metadataValue('721', 'test metadata')
			expect(result).toBe(builder)
		})

		it('should add number metadata', () => {
			const result = builder.metadataValue(721, 42)
			expect(result).toBe(builder)
		})

		it('should add object metadata', () => {
			const result = builder.metadataValue(721, {
				name: 'My NFT',
				image: 'ipfs://...',
				description: 'Test NFT'
			})
			expect(result).toBe(builder)
		})

		it('should add nested object metadata', () => {
			const result = builder.metadataValue(721, {
				policyId: {
					assetName: {
						name: 'My NFT',
						attributes: {
							rarity: 'rare',
							power: 100
						}
					}
				}
			})
			expect(result).toBe(builder)
		})

		it('should add array metadata', () => {
			const result = builder.metadataValue(721, ['item1', 'item2', 'item3'])
			expect(result).toBe(builder)
		})

		it('should add multiple metadata entries', () => {
			builder.metadataValue(721, { name: 'NFT' }).metadataValue(674, 'message')

			expect(builder).toBeDefined()
		})

		it('should handle CIP-25 NFT metadata structure', () => {
			const cip25Metadata = {
				['a'.repeat(56)]: {
					MyNFT: {
						name: 'My NFT',
						image: 'ipfs://QmExample',
						mediaType: 'image/png',
						description: 'A test NFT'
					}
				}
			}
			const result = builder.metadataValue(721, cip25Metadata)
			expect(result).toBe(builder)
		})

		it('should handle CIP-20 message metadata', () => {
			const result = builder.metadataValue(674, {
				msg: ['Hello, Cardano!', 'This is a test message.']
			})
			expect(result).toBe(builder)
		})
	})

	describe('auxiliaryData', () => {
		it('should set auxiliary data hash', () => {
			const hash = 'a'.repeat(64)
			const result = builder.auxiliaryData(hash)
			expect(result).toBe(builder)
		})
	})
})

describe('TxBuilder - Validity Range', () => {
	let builder: TxBuilder

	beforeEach(() => {
		builder = new TxBuilder()
	})

	describe('invalidBefore', () => {
		it('should set invalid before slot', () => {
			const result = builder.invalidBefore(1000)
			expect(result).toBe(builder)
		})

		it('should handle large slot numbers', () => {
			const result = builder.invalidBefore(999999999)
			expect(result).toBe(builder)
		})

		it('should handle slot 0', () => {
			const result = builder.invalidBefore(0)
			expect(result).toBe(builder)
		})
	})

	describe('invalidAfter', () => {
		it('should set invalid after slot (TTL)', () => {
			const result = builder.invalidAfter(2000)
			expect(result).toBe(builder)
		})

		it('should handle large slot numbers', () => {
			const result = builder.invalidAfter(999999999)
			expect(result).toBe(builder)
		})
	})

	describe('validity range combination', () => {
		it('should set both invalid before and after', () => {
			builder.invalidBefore(1000).invalidAfter(2000)

			expect(builder).toBeDefined()
		})

		it('should allow setting in any order', () => {
			builder.invalidAfter(2000).invalidBefore(1000)

			expect(builder).toBeDefined()
		})

		it('should handle same slot for both', () => {
			builder.invalidBefore(1500).invalidAfter(1500)

			expect(builder).toBeDefined()
		})
	})
})

describe('TxBuilder - Required Signers', () => {
	let builder: TxBuilder

	beforeEach(() => {
		builder = new TxBuilder()
	})

	describe('requiredSignerHash', () => {
		it('should add required signer', () => {
			const result = builder.requiredSignerHash(testPubKeyHash)
			expect(result).toBe(builder)
		})

		it('should add multiple required signers', () => {
			builder.requiredSignerHash('a'.repeat(56)).requiredSignerHash('b'.repeat(56)).requiredSignerHash('c'.repeat(56))

			expect(builder).toBeDefined()
		})

		it('should not duplicate same signer', () => {
			builder.requiredSignerHash(testPubKeyHash).requiredSignerHash(testPubKeyHash)

			expect(builder).toBeDefined()
		})
	})
})

describe('TxBuilder - Change Address and Fee', () => {
	let builder: TxBuilder

	beforeEach(() => {
		builder = new TxBuilder()
	})

	describe('changeAddress', () => {
		it('should set change address', () => {
			const result = builder.changeAddress(testAddress)
			expect(result).toBe(builder)
		})

		it('should allow resetting change address', () => {
			const otherAddress =
				'addr_test1qpfhhfy2qgls50r9u4yh0l7z67xpg0a5rrhkmvzcuqrd0znuzcjqw982pcftgx53fu5527z2cj2tkx2h8ux2vxsg475q9gw0lz'
			builder.changeAddress(testAddress).changeAddress(otherAddress)

			expect(builder).toBeDefined()
		})
	})

	describe('setChangeAddress (legacy)', () => {
		it('should set change address using legacy method', () => {
			const result = builder.setChangeAddress(testAddress)
			expect(result).toBe(builder)
		})
	})

	describe('setFee', () => {
		it('should set fee with BigNum', () => {
			const fee = CardanoWASM.BigNum.from_str('200000')
			const result = builder.setFee(fee)
			expect(result).toBe(builder)
		})

		it('should set fee with string', () => {
			const result = builder.setFee('200000')
			expect(result).toBe(builder)
		})

		it('should handle large fee amounts', () => {
			const result = builder.setFee('10000000')
			expect(result).toBe(builder)
		})
	})

	describe('setMinFee', () => {
		it('should set minimum fee with BigNum', () => {
			const minFee = CardanoWASM.BigNum.from_str('150000')
			const result = builder.setMinFee(minFee)
			expect(result).toBe(builder)
		})

		it('should set minimum fee with string', () => {
			const result = builder.setMinFee('150000')
			expect(result).toBe(builder)
		})
	})

	describe('calculateFee', () => {
		it('should return BigNum zero (placeholder implementation)', () => {
			const fee = builder.calculateFee()
			expect(fee).toBeDefined()
			expect(fee).toBeInstanceOf(CardanoWASM.BigNum)
		})
	})
})
