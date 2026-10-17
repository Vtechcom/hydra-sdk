import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { CardanoCliWallet } from '../../../src/cardanocli-wallet'
import { NETWORK_ID } from '../../../src/constants'
import { genVkey, mnemonicToCliKey } from '../../../src/utils/keys.util'
import { TEST_MNEMONIC, TEST_WALLET, UNSIGNED_TX } from '../../helpers/fixtures'
import { wasmScope } from '../../helpers/wasm'

// Shared behaviour (signTx, partialSign, submit/fetch) lives in contract.test.ts.

// A plain (non-extended) cardano-cli key pair with a fixed 32-byte seed.
const PLAIN_SKEY = `5820${'11'.repeat(32)}` as const
const PLAIN_VKEY = genVkey({ cborHex: PLAIN_SKEY }).cborHex

const extended = mnemonicToCliKey(TEST_MNEMONIC, 0, 0)

describe('CardanoCliWallet', () => {
	const keep = wasmScope()

	it('defaults to mainnet', () => {
		const wallet = new CardanoCliWallet({ skey: PLAIN_SKEY, vkey: PLAIN_VKEY })

		expect(wallet.getNetworkId()).toBe(NETWORK_ID.MAINNET)
		expect(wallet.getAddressBech32()).toMatch(/^addr1v/)
	})

	it('reads plain 5820 envelopes as raw ed25519 keys', () => {
		const wallet = new CardanoCliWallet({ skey: PLAIN_SKEY, vkey: PLAIN_VKEY })

		expect(keep(wallet.paymentSKey).to_hex()).toBe(PLAIN_SKEY.slice(4))
		expect(keep(wallet.paymentVKey).to_hex()).toBe(PLAIN_VKEY.slice(4))
		expect(keep(wallet.paymentSKey.to_public()).to_hex()).toBe(PLAIN_VKEY.slice(4))
	})

	it('resolves an extended key to the enterprise address of the mnemonic it came from', () => {
		const wallet = new CardanoCliWallet({
			networkId: NETWORK_ID.PREPROD,
			skey: extended.sk.cborHex,
			vkey: extended.vk.cborHex
		})

		expect(wallet.getAddressBech32()).toBe(TEST_WALLET.enterpriseAddressPreprod)
		expect(keep(wallet.paymentVKey).to_hex()).toBe(TEST_WALLET.paymentPubKeyHex)
	})

	it('signs with a plain key: the witness verifies against the vkey over the tx hash', async () => {
		const wallet = new CardanoCliWallet({ networkId: NETWORK_ID.PREPROD, skey: PLAIN_SKEY, vkey: PLAIN_VKEY })

		const tx = keep(CardanoWASM.Transaction.from_hex(await wallet.signTx(UNSIGNED_TX.cborHex)))
		const witness = keep(keep(keep(tx.witness_set()).vkeys())!.get(0))
		const publicKey = keep(keep(witness.vkey()).public_key())

		expect(publicKey.to_hex()).toBe(PLAIN_VKEY.slice(4))
		expect(publicKey.verify(Buffer.from(UNSIGNED_TX.hash, 'hex'), keep(witness.signature()))).toBe(true)
	})

	// B7 (spec §6): the signTx error is prefixed with `[AppWallet]` instead of the class name.
	it.fails('prefixes signTx errors with [CardanoCliWallet] [B7]', async () => {
		const wallet = new CardanoCliWallet({ skey: PLAIN_SKEY, vkey: PLAIN_VKEY })

		await expect(wallet.signTx('deadbeef')).rejects.toThrow(/^\[CardanoCliWallet\]/)
	})
})
