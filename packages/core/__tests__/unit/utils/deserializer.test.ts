import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import {
	deserializeAddress,
	deserializeAmountsFromTx,
	deserializeAssetUnit,
	deserializePlutusData,
	deserializePlutusScript,
	deserializePlutusScriptHash,
	deserializeTx
} from '../../../src/utils/cardano-wasm/deserializer'
import { serializeAssetUnit } from '../../../src/utils/cardano-wasm/serializer'
import {
	BASE_SCRIPT_ADDRESS,
	PLUTUS_SCRIPT,
	POINTER_ADDRESS,
	POINTER_ADDRESS_KEY_HASH,
	SCRIPT_ADDRESS,
	SCRIPT_ADDRESS_HASH,
	TEST_WALLET,
	UNSIGNED_TX
} from '../../helpers/fixtures'
import { wasmScope } from '../../helpers/wasm'

const { AddressKind, CredKind } = CardanoWASM

describe('Serializer / Deserializer', () => {
	const keep = wasmScope()

	describe('asset units', () => {
		it.each([
			[UNSIGNED_TX.policyId, UNSIGNED_TX.assetNameHex],
			[UNSIGNED_TX.policyId, ''],
			['a'.repeat(56), 'ff'.repeat(32)]
		])('serializeAssetUnit / deserializeAssetUnit round-trip (%#)', (policyId, assetName) => {
			const unit = serializeAssetUnit(policyId, assetName)

			expect(unit).toBe(policyId + assetName)
			expect(deserializeAssetUnit(unit)).toEqual({ policyId, assetName })
		})
	})

	describe('deserializeTx', () => {
		it('decodes a transaction from CBOR hex', () => {
			const tx = keep(deserializeTx(UNSIGNED_TX.cborHex))
			const body = keep(tx.body())

			expect(keep(tx.transaction_hash()).to_hex()).toBe(UNSIGNED_TX.hash)
			expect(keep(body.inputs()).len()).toBe(1)
			expect(keep(body.outputs()).len()).toBe(2)
			expect(keep(body.fee()).to_str()).toBe('171661') // 0x029e8d
		})

		it('rejects CBOR that is not a transaction', () => {
			expect(() => deserializeTx('d87980')).toThrow(/Deserialization failed in Transaction/)
		})
	})

	describe('deserializeAddress', () => {
		it.each([
			[
				'base key/key',
				TEST_WALLET.baseAddressPreprod,
				{
					kind: AddressKind.Base,
					credentialKind: CredKind.Key,
					paymentCredentialHash: TEST_WALLET.paymentKeyHash,
					stakeCredentialHash: TEST_WALLET.stakeKeyHash,
					scriptHash: undefined
				}
			],
			[
				'base script/key',
				BASE_SCRIPT_ADDRESS,
				{
					kind: AddressKind.Base,
					credentialKind: CredKind.Script,
					paymentCredentialHash: '',
					stakeCredentialHash: TEST_WALLET.stakeKeyHash,
					scriptHash: PLUTUS_SCRIPT.hashV2
				}
			],
			[
				'enterprise key',
				TEST_WALLET.enterpriseAddressPreprod,
				{
					kind: AddressKind.Enterprise,
					credentialKind: CredKind.Key,
					paymentCredentialHash: TEST_WALLET.paymentKeyHash,
					scriptHash: undefined
				}
			],
			[
				'enterprise script',
				SCRIPT_ADDRESS,
				{
					kind: AddressKind.Enterprise,
					credentialKind: CredKind.Script,
					paymentCredentialHash: undefined,
					scriptHash: SCRIPT_ADDRESS_HASH
				}
			],
			[
				'pointer (CIP-19 vector)',
				POINTER_ADDRESS,
				{
					kind: AddressKind.Pointer,
					credentialKind: CredKind.Key,
					paymentCredentialHash: POINTER_ADDRESS_KEY_HASH,
					scriptHash: undefined
				}
			],
			[
				'reward',
				TEST_WALLET.rewardAddressPreprod,
				{ kind: AddressKind.Reward, credentialKind: CredKind.Key, stakeCredentialHash: TEST_WALLET.stakeKeyHash }
			]
		])('decodes a %s address', (_kind, bech32, expected) => {
			expect(deserializeAddress(bech32)).toStrictEqual(expected)
		})

		it('rejects a string that is not bech32', () => {
			expect(() => deserializeAddress('not-an-address')).toThrow(/missing human-readable separator/)
		})
	})

	describe('Plutus scripts', () => {
		it.each([
			['V1', PLUTUS_SCRIPT.hashV1],
			['V2', PLUTUS_SCRIPT.hashV2],
			['V3', PLUTUS_SCRIPT.hashV3]
		] as const)('hashes the script with the %s language tag', (version, hash) => {
			expect(deserializePlutusScriptHash(PLUTUS_SCRIPT.cborHex, version)).toBe(hash)
			expect(keep(keep(deserializePlutusScript(PLUTUS_SCRIPT.cborHex, version)).hash()).to_hex()).toBe(hash)
		})

		it('defaults to V3', () => {
			expect(deserializePlutusScriptHash(PLUTUS_SCRIPT.cborHex)).toBe(PLUTUS_SCRIPT.hashV3)
		})

		it('rejects an unknown language version and a non-hex script', () => {
			expect(() => deserializePlutusScript(PLUTUS_SCRIPT.cborHex, 'V4' as 'V3')).toThrow(/Unsupported script version/)
			expect(() => deserializePlutusScriptHash('zz', 'V2')).toThrow(/hex string expected/)
		})
	})

	describe('deserializePlutusData', () => {
		it('decodes PlutusData from CBOR hex', () => {
			const data = keep(deserializePlutusData('d8799f0102ff'))

			expect(JSON.parse(data.to_json(CardanoWASM.PlutusDatumSchema.DetailedSchema))).toEqual({
				constructor: 0,
				fields: [{ int: 1 }, { int: 2 }]
			})
		})

		it.each(['', 'zz', 'ff'])('wraps decoding failures for %j', cbor => {
			expect(() => deserializePlutusData(cbor)).toThrow(/^Invalid PlutusData cbor$/)
		})
	})

	describe('deserializeAmountsFromTx', () => {
		it('sums lovelace over all outputs', () => {
			const amounts = deserializeAmountsFromTx(UNSIGNED_TX.cborHex)

			expect(amounts).toHaveLength(2)
			expect(amounts[0]).toEqual({ unit: 'lovelace', quantity: UNSIGNED_TX.totalLovelace })
			expect(amounts[1].quantity).toBe(UNSIGNED_TX.tokenQuantity)
		})

		// B1 (spec §6): the unit is built from `assetName.to_hex()`, i.e. the CBOR-encoded asset name
		// (`44` length prefix + `74525053`), instead of the raw name bytes.
		it.fails('builds native token units as policyId + raw asset name hex [B1]', () => {
			expect(deserializeAmountsFromTx(UNSIGNED_TX.cborHex)).toEqual([
				{ unit: 'lovelace', quantity: UNSIGNED_TX.totalLovelace },
				{ unit: UNSIGNED_TX.policyId + UNSIGNED_TX.assetNameHex, quantity: UNSIGNED_TX.tokenQuantity }
			])
		})
	})
})
