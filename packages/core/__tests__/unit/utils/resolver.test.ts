import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { resolveTxHash, resolveTxBodyHash } from '../../../src/utils/cardano-wasm/resolver'
import { UNSIGNED_TX } from '../../helpers/fixtures'
import { wasmScope } from '../../helpers/wasm'

describe('Resolver', () => {
	const keep = wasmScope()

	it('resolveTxHash hashes the tx body', () => {
		expect(resolveTxHash(UNSIGNED_TX.cborHex)).toBe(UNSIGNED_TX.hash)
	})

	it('resolveTxBodyHash returns the same hash from a TransactionBody', () => {
		const body = keep(keep(CardanoWASM.FixedTransaction.from_hex(UNSIGNED_TX.cborHex)).body())

		expect(keep(resolveTxBodyHash(body)).to_hex()).toBe(UNSIGNED_TX.hash)
	})

	it.each([
		['non-hex', 'invalid_cbor', /Invalid character/],
		['empty', '', /Deserialization failed in Transaction/],
		['non-transaction CBOR', 'd87980', /Deserialization failed in Transaction/]
	])('resolveTxHash rejects %s input', (_name, input, error) => {
		expect(() => resolveTxHash(input)).toThrow(error)
	})
})
