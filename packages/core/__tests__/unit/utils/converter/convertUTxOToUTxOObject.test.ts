import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Converter } from '../../../../src'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { mockData } from '../../../mocks/converter'

// Mock dependencies
vi.mock('../../../src/utils/validator.util', () => ({
	isValidAddress: vi.fn(addr => addr && addr.startsWith('addr_test'))
}))

vi.mock('../../../src/utils/cardano-wasm/deserializer', () => ({
	deserializeAssetUnit: vi.fn(unit => {
		if (unit === 'lovelace') {
			return { policyId: '', assetName: '' }
		}
		const policyId = unit.substring(0, 56)
		const assetName = unit.substring(56)
		return { policyId, assetName }
	})
}))

describe('Converter.convertUTxOToUTxOObject', () => {
	it('should convert real UTxO to UTxOObject - single lovelace', () => {
		const result = Converter.convertUTxOToUTxOObject(mockData.utxos)

		expect(result).toHaveProperty('1d2e5b97f1cad7bea2b06144abc4974012fa786c9e7e5faddd03243b967a03f6#0')
		expect(result['1d2e5b97f1cad7bea2b06144abc4974012fa786c9e7e5faddd03243b967a03f6#0'].address).toBe(mockData.address)
		expect(result['1d2e5b97f1cad7bea2b06144abc4974012fa786c9e7e5faddd03243b967a03f6#0'].value.lovelace).toBe(200000000)
	})

	it('should convert script UTxOs with datumHash', () => {
		const result = Converter.convertUTxOToUTxOObject([mockData.scriptUtxos[0]])

		expect(result['14a33354d554dc566f5751c1f43eca9e4a303ed4603730cd65b482b2a6772d94#0']).toBeDefined()
		expect(result['14a33354d554dc566f5751c1f43eca9e4a303ed4603730cd65b482b2a6772d94#0'].datumhash).toBe(
			'b2a341841d44a0d757a9f4a7c60da80e09e0764c00aec65b30cc1cfcbc130d59'
		)
	})

	it('should convert multiple script UTxOs', () => {
		const result = Converter.convertUTxOToUTxOObject(mockData.scriptUtxos)

		expect(Object.keys(result)).toHaveLength(2)
		expect(result['14a33354d554dc566f5751c1f43eca9e4a303ed4603730cd65b482b2a6772d94#0']).toBeDefined()
		expect(result['331bec9d3cbe4eb6760f13cae8d7cf15129cfe5166429213cea7201dcf08ebec#0']).toBeDefined()
	})
})
