import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import {
	buildPolicyScriptFromPubkey,
	buildMintingPolicyScriptFromAddress,
	buildMintingPolicyScriptFromKeyHash,
	policyIdFromNativeScript
} from '../../../src/utils/policy'

describe('policy utilities', () => {
	// Valid test data - using known valid addresses from other tests
	const validKeyHash = 'c10e19cfae1283949ec4b98a8e8ed9dbedafc00e419c8dc82d61fe82'
	const testnetAddress =
		'addr_test1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz'
	const testnetAddress2 =
		'addr_test1qzya97j3gg2lkp360m7238lfe46y0jzhl6wgsz6xysz3d5peqew2j40a7ryqyku9re6znz26uan26shczed77p9n6uwq68d0h9'

	describe('buildPolicyScriptFromPubkey', () => {
		it('should build policy script from valid pubkey script', () => {
			const pubkeyScript = { type: 'sig' as const, keyHash: validKeyHash }
			const result = buildPolicyScriptFromPubkey(pubkeyScript)

			expect(result).toBeDefined()
			expect(typeof result).toBe('string')
			// ScriptPubkey hex should include the key hash
			expect(result.length).toBeGreaterThan(0)
		})

		it('should return hex-encoded script', () => {
			const pubkeyScript = { type: 'sig' as const, keyHash: validKeyHash }
			const result = buildPolicyScriptFromPubkey(pubkeyScript)

			// Should be valid hex
			expect(/^[0-9a-fA-F]*$/.test(result)).toBe(true)
		})

		it('should produce different scripts for different key hashes', () => {
			const keyHash1 = 'c10e19cfae1283949ec4b98a8e8ed9dbedafc00e419c8dc82d61fe82'
			const keyHash2 = 'a10e19cfae1283949ec4b98a8e8ed9dbedafc00e419c8dc82d61fe00'

			const result1 = buildPolicyScriptFromPubkey({ type: 'sig', keyHash: keyHash1 })
			const result2 = buildPolicyScriptFromPubkey({ type: 'sig', keyHash: keyHash2 })

			expect(result1).not.toBe(result2)
		})

		it('should throw for invalid key hash', () => {
			const invalidScript = { type: 'sig' as const, keyHash: 'invalid' }

			expect(() => buildPolicyScriptFromPubkey(invalidScript)).toThrow()
		})

		it('should throw for empty key hash', () => {
			const emptyScript = { type: 'sig' as const, keyHash: '' }

			expect(() => buildPolicyScriptFromPubkey(emptyScript)).toThrow()
		})

		it('should handle key hash with mixed case', () => {
			const mixedCaseKeyHash = 'C10E19CFAE1283949EC4B98A8E8ED9DBEDAFC00E419C8DC82D61FE82'
			const pubkeyScript = { type: 'sig' as const, keyHash: mixedCaseKeyHash }

			const result = buildPolicyScriptFromPubkey(pubkeyScript)
			expect(result).toBeDefined()
		})
	})

	describe('buildMintingPolicyScriptFromKeyHash', () => {
		it('should build minting policy from key hash', () => {
			const result = buildMintingPolicyScriptFromKeyHash(validKeyHash)

			expect(result).toBeDefined()
			expect(typeof result).toBe('string')
			expect(result.length).toBeGreaterThan(0)
		})

		it('should return hex-encoded script', () => {
			const result = buildMintingPolicyScriptFromKeyHash(validKeyHash)

			expect(/^[0-9a-fA-F]*$/.test(result)).toBe(true)
		})

		it('should produce same result as buildPolicyScriptFromPubkey', () => {
			const fromKeyHash = buildMintingPolicyScriptFromKeyHash(validKeyHash)
			const fromPubkey = buildPolicyScriptFromPubkey({ type: 'sig', keyHash: validKeyHash })

			expect(fromKeyHash).toBe(fromPubkey)
		})

		it('should throw for invalid key hash format', () => {
			expect(() => buildMintingPolicyScriptFromKeyHash('not-hex')).toThrow()
		})

		it('should throw for wrong length key hash', () => {
			const shortKeyHash = 'c10e19cf'
			expect(() => buildMintingPolicyScriptFromKeyHash(shortKeyHash)).toThrow()
		})
	})

	describe('buildMintingPolicyScriptFromAddress', () => {
		it('should build minting policy from testnet address', () => {
			const result = buildMintingPolicyScriptFromAddress(testnetAddress)

			expect(result).toBeDefined()
			expect(typeof result).toBe('string')
			expect(result.length).toBeGreaterThan(0)
		})

		it('should build minting policy from another testnet address', () => {
			const result = buildMintingPolicyScriptFromAddress(testnetAddress2)

			expect(result).toBeDefined()
			expect(result.length).toBeGreaterThan(0)
		})

		it('should return hex-encoded script', () => {
			const result = buildMintingPolicyScriptFromAddress(testnetAddress)

			expect(/^[0-9a-fA-F]*$/.test(result)).toBe(true)
		})

		it('should throw for invalid address format', () => {
			expect(() => buildMintingPolicyScriptFromAddress('invalid-address')).toThrow()
		})

		it('should throw for empty address', () => {
			expect(() => buildMintingPolicyScriptFromAddress('')).toThrow()
		})

		it('should produce consistent results for same address', () => {
			const result1 = buildMintingPolicyScriptFromAddress(testnetAddress)
			const result2 = buildMintingPolicyScriptFromAddress(testnetAddress)

			expect(result1).toBe(result2)
		})

		it('should produce different scripts for different addresses', () => {
			// Using two different valid testnet addresses
			const result1 = buildMintingPolicyScriptFromAddress(testnetAddress)
			const result2 = buildMintingPolicyScriptFromAddress(testnetAddress2)

			expect(result1).not.toBe(result2)
		})
	})

	describe('policyIdFromNativeScript', () => {
		it('should extract policy ID from native script', () => {
			// First build a script, then get its policy ID
			const script = buildMintingPolicyScriptFromKeyHash(validKeyHash)

			// Build full native script for testing
			const keyHash = CardanoWASM.Ed25519KeyHash.from_hex(validKeyHash)
			const scriptPubKey = CardanoWASM.ScriptPubkey.new(keyHash)
			const nativeScript = CardanoWASM.NativeScript.new_script_pubkey(scriptPubKey)
			const scriptHex = nativeScript.to_hex()

			const result = policyIdFromNativeScript(scriptHex)

			expect(result).toBeDefined()
			expect(typeof result).toBe('string')
			// Policy ID is 28 bytes = 56 hex chars
			expect(result.length).toBe(56)
		})

		it('should return hex-encoded policy ID', () => {
			const keyHash = CardanoWASM.Ed25519KeyHash.from_hex(validKeyHash)
			const scriptPubKey = CardanoWASM.ScriptPubkey.new(keyHash)
			const nativeScript = CardanoWASM.NativeScript.new_script_pubkey(scriptPubKey)
			const scriptHex = nativeScript.to_hex()

			const result = policyIdFromNativeScript(scriptHex)

			expect(/^[0-9a-fA-F]+$/.test(result)).toBe(true)
		})

		it('should produce consistent policy ID for same script', () => {
			const keyHash = CardanoWASM.Ed25519KeyHash.from_hex(validKeyHash)
			const scriptPubKey = CardanoWASM.ScriptPubkey.new(keyHash)
			const nativeScript = CardanoWASM.NativeScript.new_script_pubkey(scriptPubKey)
			const scriptHex = nativeScript.to_hex()

			const result1 = policyIdFromNativeScript(scriptHex)
			const result2 = policyIdFromNativeScript(scriptHex)

			expect(result1).toBe(result2)
		})

		it('should produce different policy IDs for different scripts', () => {
			const keyHash1 = CardanoWASM.Ed25519KeyHash.from_hex(validKeyHash)
			const keyHash2 = CardanoWASM.Ed25519KeyHash.from_hex('a10e19cfae1283949ec4b98a8e8ed9dbedafc00e419c8dc82d61fe00')

			const script1 = CardanoWASM.NativeScript.new_script_pubkey(CardanoWASM.ScriptPubkey.new(keyHash1))
			const script2 = CardanoWASM.NativeScript.new_script_pubkey(CardanoWASM.ScriptPubkey.new(keyHash2))

			const result1 = policyIdFromNativeScript(script1.to_hex())
			const result2 = policyIdFromNativeScript(script2.to_hex())

			expect(result1).not.toBe(result2)
		})

		it('should throw for invalid script hex', () => {
			expect(() => policyIdFromNativeScript('invalid')).toThrow()
		})

		it('should throw for empty script', () => {
			expect(() => policyIdFromNativeScript('')).toThrow()
		})
	})

	describe('integration tests', () => {
		it('should create a complete minting workflow from address', () => {
			// 1. Build script from address
			const script = buildMintingPolicyScriptFromAddress(testnetAddress)
			expect(script).toBeDefined()

			// 2. Get full native script
			const keyHash = CardanoWASM.Address.from_bech32(testnetAddress).payment_cred()?.to_keyhash()
			expect(keyHash).toBeDefined()

			const nativeScript = CardanoWASM.NativeScript.new_script_pubkey(CardanoWASM.ScriptPubkey.new(keyHash!))

			// 3. Get policy ID
			const policyId = policyIdFromNativeScript(nativeScript.to_hex())
			expect(policyId).toBeDefined()
			expect(policyId.length).toBe(56)
		})

		it('should create a complete minting workflow from key hash', () => {
			// 1. Build script from key hash
			const script = buildMintingPolicyScriptFromKeyHash(validKeyHash)
			expect(script).toBeDefined()

			// 2. Build full native script
			const keyHash = CardanoWASM.Ed25519KeyHash.from_hex(validKeyHash)
			const nativeScript = CardanoWASM.NativeScript.new_script_pubkey(CardanoWASM.ScriptPubkey.new(keyHash))

			// 3. Get policy ID
			const policyId = policyIdFromNativeScript(nativeScript.to_hex())
			expect(policyId).toBeDefined()
			expect(policyId.length).toBe(56)
		})

		it('should produce same policy ID from address and extracted key hash', () => {
			// Extract key hash from address
			const addr = CardanoWASM.Address.from_bech32(testnetAddress)
			const extractedKeyHash = addr.payment_cred()?.to_keyhash()?.to_hex()
			expect(extractedKeyHash).toBeDefined()

			// Build scripts both ways
			const scriptFromAddress = buildMintingPolicyScriptFromAddress(testnetAddress)
			const scriptFromKeyHash = buildMintingPolicyScriptFromKeyHash(extractedKeyHash!)

			// They should be identical
			expect(scriptFromAddress).toBe(scriptFromKeyHash)
		})
	})
})
