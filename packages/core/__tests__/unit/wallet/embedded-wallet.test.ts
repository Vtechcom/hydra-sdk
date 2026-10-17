import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { EmbeddedWallet, WalletStaticMethods } from '../../../src/embedded'
import { NETWORK_ID } from '../../../src/constants'
import { TEST_MNEMONIC, TEST_WALLET, OTHER_ADDRESS } from '../../helpers/fixtures'
import { wasmScope } from '../../helpers/wasm'

// Shared signTx behaviour lives in contract.test.ts.

const mnemonicWallet = (networkId = NETWORK_ID.PREPROD) =>
	new EmbeddedWallet({ networkId, key: { type: 'mnemonic', words: TEST_MNEMONIC } })

describe('WalletStaticMethods', () => {
	const keep = wasmScope()

	it('derives the BIP32 root key from a mnemonic, salted by the password', () => {
		expect(WalletStaticMethods.mnemonicToPrivateKeyHex(TEST_MNEMONIC)).toBe(TEST_WALLET.rootKeyHex)
		// golden: CSL Bip32PrivateKey.from_bip39_entropy(entropy, utf8('pw'))
		expect(WalletStaticMethods.mnemonicToPrivateKeyHex(TEST_MNEMONIC, 'pw')).toBe(
			'e0fae5c1ea48c7d84cdf652099156099a6cfce8dd726d55d11173fdb70e9205253623a491c2a7bfd7aae3fe05fc7a13d0f6e1f0bcfa8a973851bda3c964c7fc6b62663e95431d20a661f46385bb39b17e7fa999d7d60369c3c86bb91b7adf817'
		)
	})

	it('round-trips the root key through xprv bech32 and raw bytes', () => {
		const bech32 = WalletStaticMethods.privateKeyHexToBech32(TEST_WALLET.rootKeyHex)

		expect(bech32).toMatch(/^xprv1/)
		expect(WalletStaticMethods.privateKeyBech32ToPrivateKeyHex(bech32)).toBe(TEST_WALLET.rootKeyHex)
		expect(WalletStaticMethods.bip32BytesToPrivateKeyHex(Buffer.from(TEST_WALLET.rootKeyHex, 'hex'))).toBe(
			TEST_WALLET.rootKeyHex
		)
	})

	it.each([
		['5820' + 'a'.repeat(64), '5820' + 'b'.repeat(64), 'a'.repeat(64), 'b'.repeat(64)],
		['a'.repeat(64), 'b'.repeat(64), 'a'.repeat(64), 'b'.repeat(64)],
		['5820' + 'a'.repeat(64), 'b'.repeat(64), 'a'.repeat(64), 'b'.repeat(64)]
	])('signingKeyToHexes strips only a leading 5820 (%#)', (payment, stake, expectedPayment, expectedStake) => {
		expect(WalletStaticMethods.signingKeyToHexes(payment, stake)).toEqual([expectedPayment, expectedStake])
	})

	it.each([
		[128, 12],
		[160, 15],
		[192, 18],
		[224, 21],
		[256, 24]
	])('generateMnemonic(%i) returns %i words', (strength, words) => {
		expect(WalletStaticMethods.generateMnemonic(strength)).toHaveLength(words)
	})

	it('getAddresses builds base/enterprise/reward addresses from the payment and stake keys', () => {
		const root = keep(CardanoWASM.Bip32PrivateKey.from_hex(TEST_WALLET.rootKeyHex))
		const account = keep(keep(keep(root.derive(0x80000000 + 1852)).derive(0x80000000 + 1815)).derive(0x80000000))
		const payment = keep(keep(account.derive(0)).derive(0))
		const stake = keep(keep(account.derive(2)).derive(0))

		const { baseAddress, enterpriseAddress, rewardAddress } = WalletStaticMethods.getAddresses(
			payment,
			stake,
			NETWORK_ID.PREPROD
		)

		expect(keep(baseAddress).to_bech32()).toBe(TEST_WALLET.baseAddressPreprod)
		expect(keep(enterpriseAddress).to_bech32()).toBe(TEST_WALLET.enterpriseAddressPreprod)
		expect(keep(rewardAddress).to_bech32()).toBe(TEST_WALLET.rewardAddressPreprod)
	})
})

describe('EmbeddedWallet', () => {
	it.each([
		['mnemonic', { type: 'mnemonic' as const, words: TEST_MNEMONIC }],
		['root', { type: 'root' as const, bech32: WalletStaticMethods.privateKeyHexToBech32(TEST_WALLET.rootKeyHex) }],
		['bip32Bytes', { type: 'bip32Bytes' as const, bip32Bytes: Buffer.from(TEST_WALLET.rootKeyHex, 'hex') }]
	])('loads the same root key from a %s key', (_name, key) => {
		const wallet = new EmbeddedWallet({ networkId: 2, key })

		expect(wallet.getPrivateKeyHex()).toBe(TEST_WALLET.rootKeyHex)
		expect(wallet.getNetworkId()).toBe(2)
	})

	it('stores cli keys as a [payment, stake] pair, defaulting the stake key', () => {
		const withStake = new EmbeddedWallet({
			networkId: 0,
			key: { type: 'cli', payment: '5820' + 'a'.repeat(64), stake: '5820' + 'b'.repeat(64) }
		})
		const withoutStake = new EmbeddedWallet({ networkId: 0, key: { type: 'cli', payment: '5820' + 'a'.repeat(64) } })

		expect(withStake.getPrivateKeyHex()).toEqual(['a'.repeat(64), 'b'.repeat(64)])
		expect(withoutStake.getPrivateKeyHex()).toEqual(['a'.repeat(64), 'f0'.repeat(32)])
	})

	it('getAccount returns the CIP-1852 account for the given indices', () => {
		const wallet = mnemonicWallet()
		const account = wallet.getAccount()

		expect(account.baseAddressBech32).toBe(TEST_WALLET.baseAddressPreprod)
		expect(account.enterpriseAddressBech32).toBe(TEST_WALLET.enterpriseAddressPreprod)
		expect(account.rewardAddressBech32).toBe(TEST_WALLET.rewardAddressPreprod)
		expect(account.paymentKeyHex).toBe(TEST_WALLET.paymentKeyHex)
		expect(account.stakeKeyHex).toBe(TEST_WALLET.stakeKeyHex)
		// the 64-byte key hex is the 96-byte extended key without its trailing 32 bytes
		expect(account.extendedPaymentKeyHex).toHaveLength(192)
		expect(account.extendedPaymentKeyHex.slice(0, 128)).toBe(TEST_WALLET.paymentKeyHex)

		expect(wallet.getAccount(0, 1).baseAddressBech32).toBe(TEST_WALLET.baseAddressPreprodKey1)
		expect(wallet.getAccount(1, 0).baseAddressBech32).toBe(TEST_WALLET.baseAddressPreprodAccount1)
		expect(mnemonicWallet(NETWORK_ID.MAINNET).getAccount().baseAddressBech32).toBe(TEST_WALLET.baseAddressMainnet)
	})

	describe('signData', () => {
		const keep = wasmScope()

		const verify = (sig: { signature: string; key: string }, message: Uint8Array) =>
			keep(CardanoWASM.PublicKey.from_hex(sig.key)).verify(
				message,
				keep(CardanoWASM.Ed25519Signature.from_hex(sig.signature))
			)

		it.each([
			['base', TEST_WALLET.baseAddressPreprod],
			['enterprise', TEST_WALLET.enterpriseAddressPreprod],
			['reward', TEST_WALLET.rewardAddressPreprod]
		])('signs with the payment key for the account %s address', (_kind, address) => {
			const sig = mnemonicWallet().signData(address, 'hello')

			expect(sig.key).toBe(TEST_WALLET.paymentPubKeyHex)
			expect(verify(sig, new TextEncoder().encode('hello'))).toBe(true)
		})

		it('treats an even-length hex payload as bytes', () => {
			const sig = mnemonicWallet().signData(TEST_WALLET.baseAddressPreprod, 'cafe')

			expect(verify(sig, Uint8Array.from([0xca, 0xfe]))).toBe(true)
			expect(verify(sig, new TextEncoder().encode('cafe'))).toBe(false)
		})

		it('rejects an address that does not belong to the account', () => {
			expect(() => mnemonicWallet().signData(OTHER_ADDRESS, 'hello')).toThrow(
				/\[EmbeddedWallet\] An error occurred during signData: .*doesn't belong to this account/
			)
		})

		// B7 (spec §6): the docstring promises CIP-8 message signing, but the result is a raw
		// ed25519 signature + raw public key instead of a COSE_Sign1 / COSE_Key pair.
		it.fails('returns a CIP-8 COSE_Sign1 signature and COSE_Key [B7]', () => {
			const sig = mnemonicWallet().signData(TEST_WALLET.baseAddressPreprod, 'hello')

			expect(sig.signature).toMatch(/^84/) // CBOR array(4): [protected, unprotected, payload, signature]
			expect(sig.key).toMatch(/^a[45]/) // CBOR map: COSE_Key
		})
	})
})
