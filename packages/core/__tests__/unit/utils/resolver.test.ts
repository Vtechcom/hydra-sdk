import { describe, it, expect } from 'vitest'
import { resolveTxHash, resolveTxBodyHash } from '../../../src/utils/cardano-wasm/resolver'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

const mockTx = {
	txCborHex:
		'84a400d9010281825820a3d36ebe9989d832841c683544a9304d3de3dee218872ca982f7d2770489e01800018282583900e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebfeee790c7bb9c497f716fcec7d92a4d68c27b48c9e301b7c547c653cd1a05f5e1008258390015bc6c82189db95e8eb57107e06b8819b8ddbdb9ae873c8487249825d7ea711f85c8f93a1e1176bac951b6332b0875661c9ffc4547416fc1821a05f34273a1581c0836587ed7cee3c0790e24c930c67f31fc2511a3c25aa66ed205e05fa14474525053192710021a00029e8d075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6ca0f5a0',
	txHash: 'f7867871ba75ce5e3c513d1279812556938a281e6098bd1e848b61c31144be98'
}

describe('Resolver Utils', () => {
	describe('resolveTxHash', () => {
		it('should resolve transaction hash from valid CBOR hex', () => {
			const result = resolveTxHash(mockTx.txCborHex)
			expect(result).toBe(mockTx.txHash)
		})

		it('should return a 64 character hex string', () => {
			const result = resolveTxHash(mockTx.txCborHex)
			expect(result).toHaveLength(64)
			expect(result).toMatch(/^[0-9a-f]{64}$/)
		})

		it('should throw error for invalid CBOR hex', () => {
			expect(() => resolveTxHash('invalid_cbor')).toThrow()
		})

		it('should throw error for empty string', () => {
			expect(() => resolveTxHash('')).toThrow()
		})
	})

	describe('resolveTxBodyHash', () => {
		it('should resolve transaction body hash', () => {
			const fixedTx = CardanoWASM.FixedTransaction.from_hex(mockTx.txCborHex)
			const txBody = fixedTx.body()

			const result = resolveTxBodyHash(txBody)

			expect(result).toBeDefined()
			expect(result.to_hex()).toHaveLength(64)
			expect(result.to_hex()).toMatch(/^[0-9a-f]{64}$/)
		})

		it('should return consistent hash for same transaction body', () => {
			const fixedTx = CardanoWASM.FixedTransaction.from_hex(mockTx.txCborHex)
			const txBody = fixedTx.body()

			const result1 = resolveTxBodyHash(txBody)
			const result2 = resolveTxBodyHash(txBody)

			expect(result1.to_hex()).toBe(result2.to_hex())
		})
	})
})
