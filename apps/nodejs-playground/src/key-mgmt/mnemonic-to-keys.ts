import { AppWallet, CardanoCliWallet, KeysUtils, NETWORK_ID, ParserUtils } from '@hydra-sdk/core'
;(function () {
	const mnemonic = AppWallet.brew()
	const wallet = new AppWallet({
		key: {
			words: mnemonic,
			type: 'mnemonic'
		},
		networkId: NETWORK_ID.PREPROD
	})

	console.log('Mnemonic:', mnemonic)

	const account = wallet.getAccount(0, 0)

	/**
	 * 64 bytes extended key
	 */
	const extendedPrvKey = account.paymentKey.to_raw_key().to_hex().slice(4, 68)
	const skey = {
		type: 'PaymentSigningKeyShelley_ed25519',
		description: 'Payment Signing Key',
		cborHex: `5820${extendedPrvKey}`
	} as const
	console.log('skey:', skey)

	const vkey = KeysUtils.genVkey(skey)
	console.log('vkey:', vkey)

	const cliWallet = new CardanoCliWallet({
		skey: skey.cborHex,
		vkey: vkey.cborHex,
		networkId: NETWORK_ID.PREPROD
	})
	console.log('CLI Wallet Address:', cliWallet.getAddressBech32())
})()
