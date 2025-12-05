import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
	deserializeTx,
	deserializeAssetUnit,
	deserializeAddress,
	deserializePlutusScript,
	deserializePlutusScriptHash,
	deserializePlutusData,
	DeserializerAddress
} from '../../../src/utils/cardano-wasm/deserializer'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

// Mock test data
const MOCK_TX_CBOR_HEX = '84a40081825820' // Sample CBOR hex (truncated for testing)
const MOCK_ASSET_UNIT = 'c0ff61221a6fb0e71919e707c8e3deab033da92135ec1580b740cacbeeaa1b1a0000000000989680'
const MOCK_BECH32_ADDRESS =
	'addr_test1qzya97j3gg2lkp360m7238lfe46y0jzhl6wgsz6xysz3d5peqew2j40a7ryqyku9re6znz26uan26shczed77p9n6uwq68d0h9'

const MOCK_BECH32_ADDRESS_SCRIPT = 'addr_test1wrf8enqnl26m0q5cfg73lxf4xxtu5x5phcrfjs0lcqp7uagh2hm3k'
const MOCK_ADDRESS_SCRIPT_HASH = 'd27ccc13fab5b782984a3d1f99353197ca1a81be069941ffc003ee75'

const MOCK_PLUTUS_SCRIPT_CBOR = 'f5f100' // Minimal valid Plutus script CBOR
const MOCK_PLUTUS_DATA_CBOR = 'd8799f0102ff' // Valid PlutusData CBOR (list [1, 2])

describe('Deserializer Utils', () => {
	describe('deserializeTx', () => {
		it('should deserialize transaction from CBOR hex', () => {
			// We need to mock CardanoWASM.FixedTransaction.from_bytes
			const mockTx = {
				/* mock transaction object */
			}
			const mockFromBytes = vi.spyOn(CardanoWASM.FixedTransaction, 'from_bytes').mockReturnValue(mockTx as any)

			const result = deserializeTx(MOCK_TX_CBOR_HEX)

			expect(mockFromBytes).toHaveBeenCalledWith(Buffer.from(MOCK_TX_CBOR_HEX, 'hex'))
			expect(result).toBe(mockTx)

			mockFromBytes.mockRestore()
		})

		it('should handle invalid CBOR hex', () => {
			const mockFromBytes = vi.spyOn(CardanoWASM.FixedTransaction, 'from_bytes').mockImplementation(() => {
				throw new Error('Invalid CBOR')
			})

			expect(() => {
				deserializeTx('invalid')
			}).toThrow()

			mockFromBytes.mockRestore()
		})
	})

	describe('deserializeAssetUnit', () => {
		it('should deserialize asset unit into policyId and assetName', () => {
			const result = deserializeAssetUnit(MOCK_ASSET_UNIT)

			expect(result.policyId).toHaveLength(56)
			expect(result.assetName).toBeDefined()
			expect(result.policyId + result.assetName).toBe(MOCK_ASSET_UNIT)
		})

		it('should handle pure policy ID (no asset name)', () => {
			const assetUnit = `${'c0ff61221a6fb0e71919e707c8e3deab033da92135ec1580b740cacb'}`
			const result = deserializeAssetUnit(assetUnit)

			expect(result.policyId).toBe('c0ff61221a6fb0e71919e707c8e3deab033da92135ec1580b740cacb')
			expect(result.assetName).toBe('')
		})

		it('should extract correct length policy ID (56 chars)', () => {
			const testAssetUnit = 'abcd'.repeat(14) + '1234567890abcdef' // 56 + 16 chars
			const result = deserializeAssetUnit(testAssetUnit)

			expect(result.policyId).toHaveLength(56)
			expect(result.assetName).toHaveLength(16)
		})
	})

	describe('deserializeAddress', () => {
		it('should deserialize Base address', () => {
			const mockAddress = {
				kind: () => CardanoWASM.AddressKind.Base,
				payment_cred: () => ({
					kind: () => CardanoWASM.CredKind.Key,
					to_keyhash: () => ({ to_hex: () => 'payment_hash' })
				}),
				from_bech32: vi.fn()
			}

			const mockBaseAddress = {
				payment_cred: () => ({
					kind: () => CardanoWASM.CredKind.Key,
					to_keyhash: () => ({ to_hex: () => 'payment_hash' })
				}),
				stake_cred: () => ({
					kind: () => CardanoWASM.CredKind.Key,
					to_keyhash: () => ({ to_hex: () => 'stake_hash' })
				})
			}

			vi.spyOn(CardanoWASM.Address, 'from_bech32').mockReturnValue(mockAddress as any)
			vi.spyOn(CardanoWASM.BaseAddress, 'from_address').mockReturnValue(mockBaseAddress as any)

			const result = deserializeAddress(MOCK_BECH32_ADDRESS)

			expect(result.kind).toBe(CardanoWASM.AddressKind.Base)
			expect(result.credentialKind).toBe(CardanoWASM.CredKind.Key)
			expect(result.paymentCredentialHash).toBe('payment_hash')
			expect(result.stakeCredentialHash).toBe('stake_hash')

			vi.restoreAllMocks()
		})

		it('should deserialize Enterprise address', () => {
			const mockAddress = {
				kind: () => CardanoWASM.AddressKind.Enterprise,
				payment_cred: () => ({
					kind: () => CardanoWASM.CredKind.Key,
					to_keyhash: () => ({ to_hex: () => 'payment_hash' })
				})
			}

			const mockEnterpriseAddress = {
				payment_cred: () => ({
					kind: () => CardanoWASM.CredKind.Key,
					to_keyhash: () => ({ to_hex: () => 'payment_hash' })
				})
			}

			vi.spyOn(CardanoWASM.Address, 'from_bech32').mockReturnValue(mockAddress as any)
			vi.spyOn(CardanoWASM.EnterpriseAddress, 'from_address').mockReturnValue(mockEnterpriseAddress as any)

			const result = deserializeAddress(MOCK_BECH32_ADDRESS)

			expect(result.kind).toBe(CardanoWASM.AddressKind.Enterprise)
			expect(result.credentialKind).toBe(CardanoWASM.CredKind.Key)
			expect(result.paymentCredentialHash).toBe('payment_hash')

			vi.restoreAllMocks()
		})

		it('should handle script credential kind', () => {
			const result = deserializeAddress(MOCK_BECH32_ADDRESS_SCRIPT)

			expect(result.credentialKind).toBe(CardanoWASM.CredKind.Script)
			expect(result.scriptHash).toBe(MOCK_ADDRESS_SCRIPT_HASH)

			vi.restoreAllMocks()
		})

		it('should handle Pointer address', () => {
			const mockAddress = {
				kind: () => CardanoWASM.AddressKind.Pointer,
				payment_cred: () => ({
					kind: () => CardanoWASM.CredKind.Key,
					to_keyhash: () => ({ to_hex: () => 'payment_hash' })
				})
			}

			const mockPointerAddress = {
				payment_cred: () => ({
					kind: () => CardanoWASM.CredKind.Key,
					to_keyhash: () => ({ to_hex: () => 'payment_hash' })
				})
			}

			vi.spyOn(CardanoWASM.Address, 'from_bech32').mockReturnValue(mockAddress as any)
			vi.spyOn(CardanoWASM.PointerAddress, 'from_address').mockReturnValue(mockPointerAddress as any)

			const result = deserializeAddress(MOCK_BECH32_ADDRESS)

			expect(result.kind).toBe(CardanoWASM.AddressKind.Pointer)

			vi.restoreAllMocks()
		})

		it('should handle Reward address', () => {
			const mockAddress = {
				kind: () => CardanoWASM.AddressKind.Reward,
				payment_cred: () => ({
					kind: () => CardanoWASM.CredKind.Key
				})
			}

			const mockRewardAddress = {
				payment_cred: () => ({
					to_keyhash: () => ({ to_bytes: () => Buffer.from('stake_hash') })
				})
			}

			vi.spyOn(CardanoWASM.Address, 'from_bech32').mockReturnValue(mockAddress as any)
			vi.spyOn(CardanoWASM.RewardAddress, 'from_address').mockReturnValue(mockRewardAddress as any)

			const result = deserializeAddress(MOCK_BECH32_ADDRESS)

			expect(result.kind).toBe(CardanoWASM.AddressKind.Reward)
			expect(result.stakeCredentialHash).toBeDefined()

			vi.restoreAllMocks()
		})

		it('should throw error for invalid bech32 address', () => {
			vi.spyOn(CardanoWASM.Address, 'from_bech32').mockImplementation(() => {
				throw new Error('Invalid bech32')
			})

			expect(() => {
				deserializeAddress('invalid_address')
			}).toThrow('Invalid bech32')

			vi.restoreAllMocks()
		})

		it('should throw error for malformed address', () => {
			const mockAddress = {
				kind: () => CardanoWASM.AddressKind.Malformed,
				payment_cred: () => ({
					kind: () => CardanoWASM.CredKind.Key
				})
			}

			vi.spyOn(CardanoWASM.Address, 'from_bech32').mockReturnValue(mockAddress as any)

			expect(() => {
				deserializeAddress(mockAddress as any)
			}).toThrow('Malformed address')

			vi.restoreAllMocks()
		})
	})

	describe('deserializePlutusScript', () => {
		it('should deserialize Plutus V1 script', () => {
			const mockScript = { hash: () => ({ to_hex: () => 'script_hash' }) }
			const mockFromBytes = vi.spyOn(CardanoWASM.PlutusScript, 'from_bytes').mockReturnValue(mockScript as any)

			const result = deserializePlutusScript(MOCK_PLUTUS_SCRIPT_CBOR, 'V1')

			expect(mockFromBytes).toHaveBeenCalled()
			expect(result).toBe(mockScript)

			mockFromBytes.mockRestore()
		})

		it('should deserialize Plutus V2 script', () => {
			const mockScript = { hash: () => ({ to_hex: () => 'script_hash' }) }
			const mockFromBytesV2 = vi.spyOn(CardanoWASM.PlutusScript, 'from_bytes_v2').mockReturnValue(mockScript as any)

			const result = deserializePlutusScript(MOCK_PLUTUS_SCRIPT_CBOR, 'V2')

			expect(mockFromBytesV2).toHaveBeenCalled()
			expect(result).toBe(mockScript)

			mockFromBytesV2.mockRestore()
		})

		it('should deserialize Plutus V3 script (default)', () => {
			const mockScript = { hash: () => ({ to_hex: () => 'script_hash' }) }
			const mockFromBytesV3 = vi.spyOn(CardanoWASM.PlutusScript, 'from_bytes_v3').mockReturnValue(mockScript as any)

			const result = deserializePlutusScript(MOCK_PLUTUS_SCRIPT_CBOR)

			expect(mockFromBytesV3).toHaveBeenCalled()
			expect(result).toBe(mockScript)

			mockFromBytesV3.mockRestore()
		})

		it('should default to V3 when no version specified', () => {
			const mockScript = { hash: () => ({ to_hex: () => 'script_hash' }) }
			const mockFromBytesV3 = vi.spyOn(CardanoWASM.PlutusScript, 'from_bytes_v3').mockReturnValue(mockScript as any)

			deserializePlutusScript(MOCK_PLUTUS_SCRIPT_CBOR)

			expect(mockFromBytesV3).toHaveBeenCalled()

			mockFromBytesV3.mockRestore()
		})

		it('should throw error for unsupported script version', () => {
			expect(() => {
				deserializePlutusScript(MOCK_PLUTUS_SCRIPT_CBOR, 'V4' as any)
			}).toThrow('Unsupported script version')
		})
	})

	describe('deserializePlutusScriptHash', () => {
		it('should return script hash for V1', () => {
			const mockScript = {
				hash: () => ({ to_hex: () => 'mocked_hash_v1' })
			}
			const mockFromBytes = vi.spyOn(CardanoWASM.PlutusScript, 'from_bytes').mockReturnValue(mockScript as any)

			const result = deserializePlutusScriptHash(MOCK_PLUTUS_SCRIPT_CBOR, 'V1')

			expect(result).toBe('mocked_hash_v1')

			mockFromBytes.mockRestore()
		})

		it('should return script hash for V2', () => {
			const mockScript = {
				hash: () => ({ to_hex: () => 'mocked_hash_v2' })
			}
			const mockFromBytesV2 = vi.spyOn(CardanoWASM.PlutusScript, 'from_bytes_v2').mockReturnValue(mockScript as any)

			const result = deserializePlutusScriptHash(MOCK_PLUTUS_SCRIPT_CBOR, 'V2')

			expect(result).toBe('mocked_hash_v2')

			mockFromBytesV2.mockRestore()
		})

		it('should return script hash for V3 (default)', () => {
			const mockScript = {
				hash: () => ({ to_hex: () => 'mocked_hash_v3' })
			}
			const mockFromBytesV3 = vi.spyOn(CardanoWASM.PlutusScript, 'from_bytes_v3').mockReturnValue(mockScript as any)

			const result = deserializePlutusScriptHash(MOCK_PLUTUS_SCRIPT_CBOR)

			expect(result).toBe('mocked_hash_v3')

			mockFromBytesV3.mockRestore()
		})

		it('should propagate error from deserialization', () => {
			const mockFromBytesV3 = vi.spyOn(CardanoWASM.PlutusScript, 'from_bytes_v3').mockImplementation(() => {
				throw new Error('Deserialization failed')
			})

			expect(() => {
				deserializePlutusScriptHash(MOCK_PLUTUS_SCRIPT_CBOR)
			}).toThrow('Deserialization failed')

			mockFromBytesV3.mockRestore()
		})
	})

	describe('deserializePlutusData', () => {
		it('should deserialize valid PlutusData from CBOR hex', () => {
			const mockPlutusData = {
				/* mock plutus data */
			}
			const mockFromHex = vi.spyOn(CardanoWASM.PlutusData, 'from_hex').mockReturnValue(mockPlutusData as any)

			const result = deserializePlutusData(MOCK_PLUTUS_DATA_CBOR)

			expect(mockFromHex).toHaveBeenCalledWith(MOCK_PLUTUS_DATA_CBOR)
			expect(result).toBe(mockPlutusData)

			mockFromHex.mockRestore()
		})

		it('should throw error for invalid PlutusData CBOR', () => {
			const mockFromHex = vi.spyOn(CardanoWASM.PlutusData, 'from_hex').mockImplementation(() => {
				throw new Error('Invalid CBOR data')
			})

			expect(() => {
				deserializePlutusData('invalid_cbor')
			}).toThrow('Invalid PlutusData cbor')

			mockFromHex.mockRestore()
		})

		it('should handle empty PlutusData hex', () => {
			const mockPlutusData = {
				/* empty plutus data */
			}
			const mockFromHex = vi.spyOn(CardanoWASM.PlutusData, 'from_hex').mockReturnValue(mockPlutusData as any)

			const result = deserializePlutusData('')

			expect(result).toBe(mockPlutusData)

			mockFromHex.mockRestore()
		})
	})
})
