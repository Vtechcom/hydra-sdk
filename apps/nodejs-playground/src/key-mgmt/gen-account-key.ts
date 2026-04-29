import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { AppWallet, CardanoCliWallet, EmbeddedWallet, KeysUtils, NETWORK_ID, ParserUtils } from '@hydra-sdk/core'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
	const words = (process.env.HYDRA_WALLET_MNEMONIC as string).split(' ')
	console.log('Mnemonic:', words)

	const wallet = new AppWallet({
		key: {
			words,
			type: 'mnemonic'
		},
		networkId: NETWORK_ID.PREPROD
	})

	const account = wallet.getAccount(0, 0)
	const address = await account.baseAddressBech32
	console.log('Address:', address)

	const paymentKey = account.paymentKey.to_hex()
	const stakeKey = account.stakeKey.to_hex()
	console.log('Payment Key HEX :', paymentKey)
	console.log('Stake Key HEX   :', stakeKey)

	const rootkey = EmbeddedWallet.mnemonicToPrivateKeyHex(words)
	console.log('Root Key HEX   :', rootkey)
	console.log('Root Key BECH32 :', EmbeddedWallet.privateKeyHexToBech32(rootkey))

	//
	const _paymentKey = CardanoWASM.Bip32PrivateKey.from_hex(paymentKey)
	const _stakeKey = CardanoWASM.Bip32PrivateKey.from_hex(stakeKey)
	const { baseAddress, enterpriseAddress, rewardAddress } = EmbeddedWallet.getAddresses(
		_paymentKey,
		_stakeKey,
		NETWORK_ID.PREPROD
	)
	console.log('Base Address:', baseAddress.to_bech32())
	console.log('Enterprise Address:', enterpriseAddress.to_bech32())
	console.log('Reward Address:', rewardAddress.to_bech32())
}

main().catch(error => {
	console.error(error)
	process.exit(1)
})
