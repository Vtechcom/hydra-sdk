import { describe, it, expect } from 'vitest'
import { Serializer } from '../../../src'

const mockData = {
	policyId: '0836587ed7cee3c0790e24c930c67f31fc2511a3c25aa66ed205e05f',
	assetName: '74525053'
}

describe('Serializer Utils', () => {
	describe('serializeAssetUnit', () => {
		it('should concatenate policyId and assetName', () => {
			const result = Serializer.serializeAssetUnit(mockData.policyId, mockData.assetName)

			expect(result).toBe(mockData.policyId + mockData.assetName)
			expect(result).toBe('0836587ed7cee3c0790e24c930c67f31fc2511a3c25aa66ed205e05f74525053')
		})

		it('should handle empty assetName', () => {
			const result = Serializer.serializeAssetUnit(mockData.policyId, '')

			expect(result).toBe(mockData.policyId)
		})

		it('should handle empty policyId', () => {
			const result = Serializer.serializeAssetUnit('', mockData.assetName)

			expect(result).toBe(mockData.assetName)
		})

		it('should handle both empty strings', () => {
			const result = Serializer.serializeAssetUnit('', '')

			expect(result).toBe('')
		})

		it('should return 56 char policyId + assetName length', () => {
			const result = Serializer.serializeAssetUnit(mockData.policyId, mockData.assetName)

			expect(result).toHaveLength(mockData.policyId.length + mockData.assetName.length)
			expect(result).toHaveLength(56 + 8)
		})

		it('should preserve hex format of inputs', () => {
			const policyId = 'a'.repeat(56)
			const assetName = 'deadbeef'

			const result = Serializer.serializeAssetUnit(policyId, assetName)

			expect(result).toMatch(/^[0-9a-f]+$/)
			expect(result).toBe(policyId + assetName)
		})
	})
})
