import { describe, it, expect, vi, afterEach } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { AppWallet } from '../../../src/wallet'
import { EmbeddedWallet } from '../../../src/embedded'
import { NETWORK_ID } from '../../../src/constants'
import { TEST_MNEMONIC, TEST_WALLET, UNSIGNED_TX } from '../../helpers/fixtures'

// Shared behaviour (signTx, partialSign, submit/fetch) lives in contract.test.ts.

const mnemonicWallet = (networkId = NETWORK_ID.PREPROD) =>
	new AppWallet({ networkId, key: { type: 'mnemonic', words: TEST_MNEMONIC } })

describe('AppWallet', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('derives the same addresses from a mnemonic and from its bech32 root key', () => {
		const rootBech32 = EmbeddedWallet.privateKeyHexToBech32(TEST_WALLET.rootKeyHex)
		const fromRoot = new AppWallet({ networkId: NETWORK_ID.PREPROD, key: { type: 'root', bech32: rootBech32 } })

		for (const wallet of [mnemonicWallet(), fromRoot]) {
			expect(wallet.getPaymentAddress()).toBe(TEST_WALLET.baseAddressPreprod)
			expect(wallet.getEnterpriseAddress()).toBe(TEST_WALLET.enterpriseAddressPreprod)
			expect(wallet.getRewardAddress()).toBe(TEST_WALLET.rewardAddressPreprod)
			expect(wallet.getNetworkId()).toBe(NETWORK_ID.PREPROD)
		}
	})

	it('passes account/key indices through to derivation', () => {
		const wallet = mnemonicWallet()

		expect(wallet.getPaymentAddress(0, 1)).toBe(TEST_WALLET.baseAddressPreprodKey1)
		expect(wallet.getPaymentAddress(1, 0)).toBe(TEST_WALLET.baseAddressPreprodAccount1)
		expect(wallet.getAccount().paymentKeyHex).toBe(TEST_WALLET.paymentKeyHex)
	})

	it('encodes addresses for the configured network', () => {
		const wallet = mnemonicWallet(NETWORK_ID.MAINNET)

		expect(wallet.getPaymentAddress()).toBe(TEST_WALLET.baseAddressMainnet)
		expect(wallet.getEnterpriseAddress()).toMatch(/^addr1v/)
		expect(wallet.getRewardAddress()).toMatch(/^stake1u/)
	})

	it('exposes the fetcher and submitter it was given', () => {
		const fetcher = { fetchAddressUTxOs: vi.fn() }
		const submitter = { submitTx: vi.fn() }
		const wallet = new AppWallet({
			networkId: NETWORK_ID.PREPROD,
			key: { type: 'mnemonic', words: TEST_MNEMONIC },
			fetcher,
			submitter
		})

		expect(wallet.getFetcher()).toBe(fetcher)
		expect(wallet.getSubmitter()).toBe(submitter)
		expect(mnemonicWallet().getSubmitter()).toBeUndefined()
	})

	it('signs with the key at the requested account/key index', async () => {
		const wallet = mnemonicWallet()
		const keyHash = (signedTxHex: string) => {
			const tx = CardanoWASM.Transaction.from_hex(signedTxHex)
			const hash = tx.witness_set().vkeys()!.get(0).vkey().public_key().hash().to_hex()
			tx.free()
			return hash
		}

		expect(keyHash(await wallet.signTx(UNSIGNED_TX.cborHex))).toBe(TEST_WALLET.paymentKeyHash)
		expect(keyHash(await wallet.signTx(UNSIGNED_TX.cborHex, false, 0, 1))).not.toBe(TEST_WALLET.paymentKeyHash)
	})

	it('signTxs signs every tx with the default key', async () => {
		const signed = await mnemonicWallet().signTxs([UNSIGNED_TX.cborHex, UNSIGNED_TX.cborHex])
		const expected = await mnemonicWallet().signTx(UNSIGNED_TX.cborHex)

		expect(signed).toEqual([expected, expected])
	})

	it.each([
		[128, 12],
		[256, 24]
	])('brew(%i) returns a fresh %i-word mnemonic that builds a wallet', (strength, words) => {
		const mnemonic = AppWallet.brew(strength)

		expect(mnemonic).toHaveLength(words)
		expect(AppWallet.brew(strength)).not.toEqual(mnemonic)
		expect(new AppWallet({ networkId: 0, key: { type: 'mnemonic', words: mnemonic } }).getPaymentAddress()).toMatch(
			/^addr_test1q/
		)
	})

	// B7 (spec §6): signData is a stub that logs its arguments and never delegates to EmbeddedWallet.
	it.fails('signData delegates to EmbeddedWallet.signData [B7]', async () => {
		vi.spyOn(console, 'log').mockImplementation(() => {})
		const embedded = new EmbeddedWallet({ networkId: 0, key: { type: 'mnemonic', words: TEST_MNEMONIC } })

		await expect(mnemonicWallet().signData(TEST_WALLET.baseAddressPreprod, 'hello')).resolves.toEqual(
			embedded.signData(TEST_WALLET.baseAddressPreprod, 'hello')
		)
	})

	it('signData currently rejects as not implemented and logs its arguments', async () => {
		const log = vi.spyOn(console, 'log').mockImplementation(() => {})

		await expect(mnemonicWallet().signData(TEST_WALLET.baseAddressPreprod, 'hello')).rejects.toThrow(
			/signData\(\) is not implemented/
		)
		expect(log).toHaveBeenCalledWith('>>> signData', TEST_WALLET.baseAddressPreprod, 'hello', 0, 0)
	})
})
