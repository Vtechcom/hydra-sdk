import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { getPubkeyHashFromAddress, isValidAddress } from '../../../src/utils/address'
import {
	OTHER_ADDRESS,
	OTHER_ADDRESS_KEY_HASH,
	POINTER_ADDRESS,
	POINTER_ADDRESS_KEY_HASH,
	SCRIPT_ADDRESS,
	TEST_WALLET
} from '../../helpers/fixtures'

const addressBytes = (bech32: string) => {
	const address = CardanoWASM.Address.from_bech32(bech32)
	const bytes = address.to_bytes()
	address.free()
	return bytes
}

describe('AddressUtils', () => {
	it.each([
		['base testnet', OTHER_ADDRESS, OTHER_ADDRESS_KEY_HASH],
		['base testnet (wallet)', TEST_WALLET.baseAddressPreprod, TEST_WALLET.paymentKeyHash],
		['base mainnet', TEST_WALLET.baseAddressMainnet, TEST_WALLET.paymentKeyHash],
		['enterprise', TEST_WALLET.enterpriseAddressPreprod, TEST_WALLET.paymentKeyHash],
		['pointer', POINTER_ADDRESS, POINTER_ADDRESS_KEY_HASH],
		['script (no key hash)', SCRIPT_ADDRESS, null],
		['invalid', 'invalid_address_string', null],
		['empty', '', null]
	])('getPubkeyHashFromAddress: %s address', (_kind, address, expected) => {
		expect(getPubkeyHashFromAddress(address)).toBe(expected)
	})

	it.each([
		['base bech32', OTHER_ADDRESS, 'bech32', true],
		['enterprise bech32', TEST_WALLET.enterpriseAddressPreprod, 'bech32', true],
		['reward bech32', TEST_WALLET.rewardAddressPreprod, 'bech32', true],
		['script bech32', SCRIPT_ADDRESS, 'bech32', true],
		['mainnet bech32', TEST_WALLET.baseAddressMainnet, undefined, true],
		['bad checksum', 'addr_test1invalidchecksum', 'bech32', false],
		['free text', 'hello world', 'bech32', false],
		['empty string', '', 'bech32', false],
		['very long string', 'a'.repeat(10000), 'bech32', false],
		['hex given as bech32', Buffer.from(addressBytes(OTHER_ADDRESS)).toString('hex'), 'bech32', false],
		['hex', Buffer.from(addressBytes(OTHER_ADDRESS)).toString('hex'), 'hex', true],
		['short hex', 'abcd', 'hex', false],
		['non-hex', 'not-valid-hex', 'hex', false],
		['bech32 given as hex', OTHER_ADDRESS, 'hex', false],
		['raw bytes', addressBytes(OTHER_ADDRESS), 'bytes', true],
		['empty bytes', new Uint8Array(0), 'bytes', false],
		['random bytes', Uint8Array.from([1, 2, 3, 4, 5]), 'bytes', false],
		['0xff × 57', new Uint8Array(57).fill(0xff), 'bytes', false],
		['unknown type', OTHER_ADDRESS, 'unknown', false],
		['null', null, undefined, false],
		['undefined', undefined, undefined, false],
		['number', 12345, undefined, false],
		['object', { address: OTHER_ADDRESS }, undefined, false]
	])('isValidAddress: %s', (_name, input, type, expected) => {
		expect(isValidAddress(input as string, type as 'bech32')).toBe(expected)
	})
})
