import { describe, it, expect, vi, afterEach } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import {
	buildBaseAddress,
	buildDRepID,
	buildEnterpriseAddress,
	buildKeys,
	buildRewardAddress,
	clampScalar,
	stripExtendedKey
} from '../../../src/utils/cardano-wasm/build-keys'
import { NETWORK_ID } from '../../../src/constants/chain'
import { TEST_WALLET } from '../../helpers/fixtures'
import { wasmScope } from '../../helpers/wasm'

const harden = (n: number) => 0x80000000 + n

describe('BuildKeys', () => {
	const keep = wasmScope()
	const keyHash = (hex: string) => keep(CardanoWASM.Ed25519KeyHash.from_hex(hex))

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it.each([
		[
			NETWORK_ID.PREPROD,
			TEST_WALLET.baseAddressPreprod,
			TEST_WALLET.enterpriseAddressPreprod,
			TEST_WALLET.rewardAddressPreprod
		],
		[NETWORK_ID.MAINNET, TEST_WALLET.baseAddressMainnet, /^addr1v/, /^stake1u/]
	])('builds base/enterprise/reward addresses for network %i', (networkId, base, enterprise, reward) => {
		const payment = keyHash(TEST_WALLET.paymentKeyHash)
		const stake = keyHash(TEST_WALLET.stakeKeyHash)
		const bech32 = (addr: { to_address(): CardanoWASM.Address; free(): void }) =>
			keep(keep(addr).to_address()).to_bech32()

		expect(bech32(buildBaseAddress(networkId, payment, stake))).toBe(base)
		expect(bech32(buildEnterpriseAddress(networkId, payment))).toMatch(enterprise)
		expect(bech32(buildRewardAddress(networkId, stake))).toMatch(reward)
	})

	describe('buildKeys', () => {
		it("derives CIP-1852 keys m/1852'/1815'/account'/{0,2,3}/index from a root key", () => {
			const { accountKey, paymentKey, stakeKey, dRepKey } = buildKeys(TEST_WALLET.rootKeyHex, 0)
			const root = keep(CardanoWASM.Bip32PrivateKey.from_hex(TEST_WALLET.rootKeyHex))
			const expectedAccount = keep(keep(keep(root.derive(harden(1852))).derive(harden(1815))).derive(harden(0)))

			expect(keep(accountKey).to_hex()).toBe(expectedAccount.to_hex())
			expect(stripExtendedKey(keep(paymentKey).to_hex())).toBe(TEST_WALLET.paymentKeyHex)
			expect(stripExtendedKey(keep(stakeKey).to_hex())).toBe(TEST_WALLET.stakeKeyHex)
			expect(keep(dRepKey)!.to_hex()).toBe(keep(keep(expectedAccount.derive(3)).derive(0)).to_hex())
		})

		it('uses the account and key indices', () => {
			const hashOf = (key: CardanoWASM.Bip32PrivateKey) =>
				keep(keep(keep(keep(key).to_public()).to_raw_key()).hash()).to_hex()

			expect(hashOf(buildKeys(TEST_WALLET.rootKeyHex, 0, 0).paymentKey)).toBe(TEST_WALLET.paymentKeyHash)
			expect(hashOf(buildKeys(TEST_WALLET.rootKeyHex, 0, 1).paymentKey)).not.toBe(TEST_WALLET.paymentKeyHash)
			expect(hashOf(buildKeys(TEST_WALLET.rootKeyHex, 1, 0).paymentKey)).not.toBe(TEST_WALLET.paymentKeyHash)
		})

		it("derives the payment key on the internal chain m/1852'/1815'/account'/1/index for role 1", () => {
			const root = keep(CardanoWASM.Bip32PrivateKey.from_hex(TEST_WALLET.rootKeyHex))
			const account = keep(keep(keep(root.derive(harden(1852))).derive(harden(1815))).derive(harden(6158)))
			const expected = keep(keep(account.derive(1)).derive(0)).to_hex()

			const internal = buildKeys(TEST_WALLET.rootKeyHex, 6158, 0, 1)
			expect(keep(internal.paymentKey).to_hex()).toBe(expected)
			// Only the payment key moves to the internal chain; the stake key stays on role 2.
			expect(keep(internal.stakeKey).to_hex()).toBe(keep(buildKeys(TEST_WALLET.rootKeyHex, 6158, 0).stakeKey).to_hex())
			expect(keep(buildKeys(TEST_WALLET.rootKeyHex, 6158, 0, 0).paymentKey).to_hex()).not.toBe(expected)
		})

		it('rejects a payment role other than 0 or 1', () => {
			expect(() => buildKeys(TEST_WALLET.rootKeyHex, 0, 0, 2 as never)).toThrow(/role must be 0 \(external\) or 1 \(internal\)/)
		})

		it('takes a [payment, stake] pair of extended keys as-is', () => {
			const payment = keep(buildKeys(TEST_WALLET.rootKeyHex, 0).paymentKey).to_hex()
			const stake = keep(buildKeys(TEST_WALLET.rootKeyHex, 0).stakeKey).to_hex()

			const keys = buildKeys([payment, stake], 5, 5)

			expect(keep(keys.paymentKey).to_hex()).toBe(payment)
			expect(keep(keys.stakeKey).to_hex()).toBe(stake)
			expect(keys.dRepKey).toBeUndefined()
			keep(keys.accountKey)
		})
	})

	it.each([
		['all ones', 0xff, 0xff, 0xf8, 0x5f],
		['all zeros', 0x00, 0x00, 0x00, 0x40],
		['already clamped', 0x08, 0x40, 0x08, 0x40]
	])('clampScalar clears the low 3 bits and sets bit 254 only (%s)', (_name, first, last, clampedFirst, clampedLast) => {
		const scalar = Buffer.alloc(32, 0xaa)
		scalar[0] = first
		scalar[31] = last

		const clamped = clampScalar(scalar)

		expect(clamped[0]).toBe(clampedFirst)
		expect(clamped[31]).toBe(clampedLast)
		expect(clamped.subarray(1, 31).every(b => b === 0xaa)).toBe(true)
	})

	it('stripExtendedKey drops the trailing 32 bytes of a 96-byte key and rejects other lengths', () => {
		expect(stripExtendedKey('ab'.repeat(64) + 'cd'.repeat(32))).toBe('ab'.repeat(64))
		expect(() => stripExtendedKey('ab'.repeat(64))).toThrow(/Extended key must be 192 hex characters \(96 bytes\)/)
	})

	// buildDRepID is still a stub: it logs its input and returns null (see the slice report).
	it('buildDRepID currently logs the key hash and returns null', () => {
		const log = vi.spyOn(console, 'log').mockImplementation(() => {})

		expect(buildDRepID(keyHash(TEST_WALLET.paymentKeyHash))).toBeNull()
		expect(log).toHaveBeenCalledWith('buildDRepID', TEST_WALLET.paymentKeyHash, NETWORK_ID.MAINNET)
	})
})
