import { AppWallet, CardanoCliWallet, KeysUtils, NETWORK_ID } from '@hydra-sdk/core'
;(function () {
	const mnemonic =
		'cup hat pledge term tilt august fox bamboo wrist version recipe junior easy raise tower jump april reform episode pledge scare cradle million lonely'.split(
			' '
		)
	const wallet = new AppWallet({
		key: {
			words: mnemonic,
			type: 'mnemonic'
		},
		networkId: NETWORK_ID.PREPROD
	})

	console.log('Mnemonic:', mnemonic)

	const account = wallet.getAccount(0, 0)
	console.log('Account:', account)

	/**
	 * BIP32-Ed25519 keys in the cardano-cli envelope format: the signing key is the
	 * 128-byte xprv, the verification key the 64-byte xpub.
	 */
	const { sk: skey, vk: vkey } = KeysUtils.mnemonicToCliKey(mnemonic, 0, 0)
	console.log('skey:', skey)
	console.log('vkey:', vkey)

	const cliWallet = new CardanoCliWallet({
		skey: skey.cborHex,
		vkey: vkey.cborHex,
		networkId: NETWORK_ID.PREPROD
	})
	console.log('CLI Wallet Address:', cliWallet.getAddressBech32())

	// Both wallets are backed by the same derived key, so they resolve to the same address.
	console.log('Addresses match:', cliWallet.getAddressBech32() === account.enterpriseAddressBech32)
})()
