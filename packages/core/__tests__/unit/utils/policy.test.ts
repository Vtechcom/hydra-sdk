import { describe, it, expect } from 'vitest'
import {
	buildMintingPolicyScriptFromAddress,
	buildMintingPolicyScriptFromKeyHash,
	buildPolicyScriptFromPubkey,
	policyIdFromNativeScript
} from '../../../src/utils/policy'
import {
	NATIVE_SIG_SCRIPT,
	OTHER_ADDRESS,
	OTHER_ADDRESS_KEY_HASH,
	SCRIPT_ADDRESS,
	TEST_WALLET
} from '../../helpers/fixtures'

// Policy IDs are blake2b-224(0x00 || native script CBOR), cross-checked with @noble/hashes.
const OTHER_ADDRESS_POLICY_ID = '45957e9e75a3614218038586100dc2144c0893c323fa99ba1799fddd'

describe('PolicyUtils', () => {
	it.each([
		[
			'buildPolicyScriptFromPubkey',
			() => buildPolicyScriptFromPubkey({ type: 'sig', keyHash: NATIVE_SIG_SCRIPT.keyHash })
		],
		['buildMintingPolicyScriptFromKeyHash', () => buildMintingPolicyScriptFromKeyHash(NATIVE_SIG_SCRIPT.keyHash)],
		[
			'buildMintingPolicyScriptFromKeyHash (upper-case hex)',
			() => buildMintingPolicyScriptFromKeyHash(NATIVE_SIG_SCRIPT.keyHash.toUpperCase())
		]
	])('%s encodes sig(keyHash) as CBOR [0, keyHash]', (_name, build) => {
		expect(build()).toBe(NATIVE_SIG_SCRIPT.cborHex)
	})

	it('buildMintingPolicyScriptFromAddress uses the payment key hash of the address', () => {
		expect(buildMintingPolicyScriptFromAddress(OTHER_ADDRESS)).toBe(`8200581c${OTHER_ADDRESS_KEY_HASH}`)
		expect(buildMintingPolicyScriptFromAddress(TEST_WALLET.enterpriseAddressPreprod)).toBe(
			`8200581c${TEST_WALLET.paymentKeyHash}`
		)
	})

	it('policyIdFromNativeScript hashes the script', () => {
		expect(policyIdFromNativeScript(NATIVE_SIG_SCRIPT.cborHex)).toBe(NATIVE_SIG_SCRIPT.policyId)
		expect(policyIdFromNativeScript(buildMintingPolicyScriptFromAddress(OTHER_ADDRESS))).toBe(OTHER_ADDRESS_POLICY_ID)
	})

	it.each([
		['a non-hex key hash', () => buildMintingPolicyScriptFromKeyHash('not-hex'), /hex decode failed/],
		[
			'a short key hash',
			() => buildPolicyScriptFromPubkey({ type: 'sig', keyHash: 'c10e19cf' }),
			/Deserialization failed in Ed25519KeyHash/
		],
		['a non-bech32 address', () => buildMintingPolicyScriptFromAddress('invalid-address'), /missing human-readable/],
		['CBOR that is not a native script', () => policyIdFromNativeScript('00'), /Deserialization failed in NativeScript/]
	])('throws for %s', (_name, build, error) => {
		expect(build).toThrow(error)
	})

	it('rejects an address whose payment credential is a script', () => {
		expect(() => buildMintingPolicyScriptFromAddress(SCRIPT_ADDRESS)).toThrow(/Error when parsing addrKeyHash/)
	})
})
