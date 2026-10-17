import { describe, it, expect, vi } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { AppWallet } from '../../../src/wallet'
import { EmbeddedWallet } from '../../../src/embedded'
import { CardanoCliWallet } from '../../../src/cardanocli-wallet'
import { NETWORK_ID } from '../../../src/constants'
import { mnemonicToCliKey } from '../../../src/utils/keys.util'
import type { UTxO } from '../../../src/types/cardano'
import { TEST_MNEMONIC, TEST_WALLET, UNSIGNED_TX } from '../../helpers/fixtures'
import { wasmScope } from '../../helpers/wasm'

// All three wallets are built from the same payment key (m/1852'/1815'/0'/0/0 of TEST_MNEMONIC),
// so they must produce the same vkey witness for the same transaction.
const cliKey = mnemonicToCliKey(TEST_MNEMONIC, 0, 0)

const vkeysOf = (signedTxHex: string): string[] => {
	const tx = CardanoWASM.Transaction.from_hex(signedTxHex)
	const vkeys = tx.witness_set().vkeys()
	const out: string[] = []
	for (let i = 0; i < (vkeys?.len() ?? 0); i++) out.push(vkeys!.get(i).to_hex())
	tx.free()
	return out
}

type SigningCase = {
	name: string
	/** Returns the vkey witnesses (hex) the wallet attaches for `txHex`. */
	sign: (txHex: string) => Promise<string[]>
}

const signingCases: SigningCase[] = [
	{
		name: 'AppWallet',
		sign: async tx => {
			const wallet = new AppWallet({ networkId: NETWORK_ID.PREPROD, key: { type: 'mnemonic', words: TEST_MNEMONIC } })
			return vkeysOf(await wallet.signTx(tx))
		}
	},
	{
		name: 'EmbeddedWallet',
		sign: async tx => {
			const wallet = new EmbeddedWallet({ networkId: NETWORK_ID.PREPROD, key: { type: 'mnemonic', words: TEST_MNEMONIC } })
			const witness = wallet.signTx(tx)
			const hex = witness.to_hex()
			witness.free()
			return [hex]
		}
	},
	{
		name: 'CardanoCliWallet',
		sign: async tx => {
			const wallet = new CardanoCliWallet({
				networkId: NETWORK_ID.PREPROD,
				skey: cliKey.sk.cborHex,
				vkey: cliKey.vk.cborHex
			})
			return vkeysOf(await wallet.signTx(tx))
		}
	}
]

describe.each(signingCases)('wallet signing contract: $name', ({ sign }) => {
	const keep = wasmScope()

	it('attaches exactly one witness, made by the payment key over the tx hash', async () => {
		const [witnessHex, ...rest] = await sign(UNSIGNED_TX.cborHex)

		expect(rest).toHaveLength(0)
		expect(witnessHex).toBe(UNSIGNED_TX.paymentWitnessHex)

		const witness = keep(CardanoWASM.Vkeywitness.from_hex(witnessHex))
		const publicKey = keep(keep(witness.vkey()).public_key())
		expect(publicKey.to_hex()).toBe(TEST_WALLET.paymentPubKeyHex)
		expect(publicKey.verify(Buffer.from(UNSIGNED_TX.hash, 'hex'), keep(witness.signature()))).toBe(true)
	})

	it('rejects a payload that is not a transaction', async () => {
		await expect(sign('deadbeef')).rejects.toThrow(/An error occurred during signTx/)
	})
})

type SubmittingCase = {
	name: string
	address: string
	create: (deps: { fetcher?: { fetchAddressUTxOs: any }; submitter?: { submitTx: any } }) => {
		signTx: (tx: string, partialSign?: boolean) => Promise<string>
		submitTx: (tx: string) => Promise<string>
		queryUTxOs: (address: string) => Promise<UTxO[]>
	}
	/** A second signer of the same wallet type, with a different key. */
	createOther: () => { signTx: (tx: string, partialSign?: boolean) => Promise<string> }
}

const submittingCases: SubmittingCase[] = [
	{
		name: 'AppWallet',
		address: TEST_WALLET.baseAddressPreprod,
		create: deps =>
			new AppWallet({ networkId: NETWORK_ID.PREPROD, key: { type: 'mnemonic', words: TEST_MNEMONIC }, ...deps }),
		createOther: () => {
			const wallet = new AppWallet({ networkId: NETWORK_ID.PREPROD, key: { type: 'mnemonic', words: TEST_MNEMONIC } })
			return { signTx: (tx, partial) => wallet.signTx(tx, partial, 0, 1) }
		}
	},
	{
		name: 'CardanoCliWallet',
		address: TEST_WALLET.enterpriseAddressPreprod,
		create: deps =>
			new CardanoCliWallet({ networkId: NETWORK_ID.PREPROD, skey: cliKey.sk.cborHex, vkey: cliKey.vk.cborHex, ...deps }),
		createOther: () => {
			const other = mnemonicToCliKey(TEST_MNEMONIC, 0, 1)
			return new CardanoCliWallet({ networkId: NETWORK_ID.PREPROD, skey: other.sk.cborHex, vkey: other.vk.cborHex })
		}
	}
]

describe.each(submittingCases)(
	'wallet partialSign + submit/fetch contract: $name',
	({ address, create, createOther }) => {
		const utxos: UTxO[] = [
			{
				input: { txHash: 'a'.repeat(64), outputIndex: 0 },
				output: { address, amount: [{ unit: 'lovelace', quantity: '5000000' }] }
			}
		]

		it('refuses to sign an already-signed tx unless partialSign is set', async () => {
			const signedOnce = await create({}).signTx(UNSIGNED_TX.cborHex)

			await expect(createOther().signTx(signedOnce)).rejects.toThrow(/Signatures already exist/)
		})

		it('adds a second witness when partialSign is set', async () => {
			const signedOnce = await create({}).signTx(UNSIGNED_TX.cborHex)
			const signedTwice = await createOther().signTx(signedOnce, true)

			const vkeys = vkeysOf(signedTwice)
			expect(vkeys).toHaveLength(2)
			expect(vkeys).toContain(UNSIGNED_TX.paymentWitnessHex)
		})

		it('forwards submitTx to the submitter and returns its tx id', async () => {
			const submitter = { submitTx: vi.fn().mockResolvedValue('txid') }

			await expect(create({ submitter }).submitTx('84a4')).resolves.toBe('txid')
			expect(submitter.submitTx).toHaveBeenCalledWith('84a4')
		})

		it('forwards queryUTxOs to the fetcher', async () => {
			const fetcher = { fetchAddressUTxOs: vi.fn().mockResolvedValue(utxos) }

			await expect(create({ fetcher }).queryUTxOs(address)).resolves.toEqual(utxos)
			expect(fetcher.fetchAddressUTxOs).toHaveBeenCalledWith(address)
		})

		it('propagates submitter and fetcher failures', async () => {
			const wallet = create({
				submitter: { submitTx: vi.fn().mockRejectedValue(new Error('submit down')) },
				fetcher: { fetchAddressUTxOs: vi.fn().mockRejectedValue(new Error('fetch down')) }
			})

			await expect(wallet.submitTx('84a4')).rejects.toThrow(/submit down/)
			await expect(wallet.queryUTxOs(address)).rejects.toThrow(/fetch down/)
		})

		it('throws synchronously when no submitter or fetcher is configured', () => {
			const wallet = create({})

			expect(() => wallet.submitTx('84a4')).toThrow(/No submitter provided/)
			expect(() => wallet.queryUTxOs(address)).toThrow(/No fetcher provided/)
		})
	}
)
