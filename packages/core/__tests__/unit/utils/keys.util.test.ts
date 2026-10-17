import { describe, it, expect } from 'vitest'
import { cardanoCliKeygen, hydraCliKeygen, genVkey, mnemonicToCliKey } from '../../../src/utils/keys.util'
import { AppWallet } from '../../../src/wallet'
import { CardanoCliWallet } from '../../../src/cardanocli-wallet'
import { NETWORK_ID } from '../../../src/constants'
import { UNSIGNED_TX } from '../../helpers/fixtures'

const MNEMONIC = (
	'error wrong law finger into pear half wish assume east still script promote tribe remind feel faith say ' +
	'universe garbage roast curtain dance rug'
).split(' ')

// Golden: 128-byte xprv (prv | pub | chaincode) and 64-byte xpub (pub | chaincode) at m/1852'/1815'/0'/0/0.
const EXPECTED_SK =
	'5880007561c83a67fd860c5ec3c93544171597ad0fc239b929740aad0636d6f0c151f03645ceae6e15c0c3f7c726b40a55999922c5e10830af09b991da72e02ea48401df411c33ee3c03ff24b0b2851c855b078d9371c5c89ec6e9a43df2b179030a8ec959c1316f8a5386468a47010cb059ce7dd009441bd1808e1a835ae37e84c6'
const EXPECTED_VK =
	'584001df411c33ee3c03ff24b0b2851c855b078d9371c5c89ec6e9a43df2b179030a8ec959c1316f8a5386468a47010cb059ce7dd009441bd1808e1a835ae37e84c6'

describe('KeysUtils', () => {
	describe.each([
		['cardanoCliKeygen', cardanoCliKeygen, 'PaymentSigningKeyShelley_ed25519', 'PaymentVerificationKeyShelley_ed25519'],
		['hydraCliKeygen', hydraCliKeygen, 'HydraSigningKey_ed25519', 'HydraVerificationKey_ed25519']
	])('%s', (_name, keygen, skType, vkType) => {
		it('returns a fresh plain ed25519 pair in the cardano-cli envelope', () => {
			const { sk, vk } = keygen()

			expect(sk.type).toBe(skType)
			expect(vk.type).toBe(vkType)
			expect(sk.cborHex).toMatch(/^5820[0-9a-f]{64}$/)
			expect(vk.cborHex).toMatch(/^5820[0-9a-f]{64}$/)
			expect(keygen().sk.cborHex).not.toBe(sk.cborHex)
		})

		it('pairs the verification key with the signing key', () => {
			const { sk, vk } = keygen()

			expect(genVkey(sk)).toEqual({
				type: 'PaymentVerificationKeyShelley_ed25519',
				description: 'Payment Verification Key',
				cborHex: vk.cborHex
			})
		})
	})

	describe('genVkey', () => {
		it.each([
			['128-byte xprv (5880)', EXPECTED_SK],
			[
				'96-byte xprv (5860), i.e. without the embedded public key',
				'5860' + EXPECTED_SK.slice(4, 4 + 128) + EXPECTED_SK.slice(-64)
			]
		])('derives an extended verification key from a %s', (_name, cborHex) => {
			expect(genVkey({ cborHex })).toEqual({
				type: 'PaymentExtendedVerificationKeyShelley_ed25519_bip32',
				description: 'Payment Verification Key',
				cborHex: EXPECTED_VK
			})
		})
	})

	describe('mnemonicToCliKey', () => {
		it('derives the golden extended key pair for account 0 / key 0 by default', () => {
			expect(mnemonicToCliKey(MNEMONIC)).toEqual({
				sk: {
					type: 'PaymentExtendedSigningKeyShelley_ed25519_bip32',
					description: 'Payment Signing Key',
					cborHex: EXPECTED_SK
				},
				vk: {
					type: 'PaymentExtendedVerificationKeyShelley_ed25519_bip32',
					description: 'Payment Verification Key',
					cborHex: EXPECTED_VK
				}
			})
		})

		it('embeds the xpub inside the xprv', () => {
			const { sk, vk } = mnemonicToCliKey(MNEMONIC)

			expect(sk.cborHex.slice(4 + 128)).toBe(vk.cborHex.slice(4))
		})

		it.each([
			[1, 0],
			[0, 1]
		])('uses account %i / key %i', (account, key) => {
			expect(mnemonicToCliKey(MNEMONIC, account, key).vk.cborHex).not.toBe(EXPECTED_VK)
		})

		it('matches the AppWallet key at the same path: same address, same signature', async () => {
			const { sk, vk } = mnemonicToCliKey(MNEMONIC, 0, 3)
			const wallet = new AppWallet({ key: { type: 'mnemonic', words: MNEMONIC }, networkId: NETWORK_ID.PREPROD })
			const cliWallet = new CardanoCliWallet({ skey: sk.cborHex, vkey: vk.cborHex, networkId: NETWORK_ID.PREPROD })

			expect(cliWallet.getAddressBech32()).toBe(wallet.getAccount(0, 3).enterpriseAddressBech32)
			expect(await cliWallet.signTx(UNSIGNED_TX.cborHex)).toBe(await wallet.signTx(UNSIGNED_TX.cborHex, false, 0, 3))
		})
	})
})
