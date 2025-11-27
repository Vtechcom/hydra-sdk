import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { CardanoCliWallet, KeysUtils, NETWORK_ID, ParserUtils } from '@hydra-sdk/core'

async function main() {
	const { sk, vk } = KeysUtils.cardanoCliKeygen()
	console.log({ sk, vk })

	const wallet = new CardanoCliWallet({
		skey: sk.cborHex,
		vkey: vk.cborHex,
		networkId: NETWORK_ID.PREPROD
	})
	const address = await wallet.getAddressBech32()
	console.log({ address })

	const hydraWallet = new CardanoCliWallet({
		skey: `582083139d5660a51960770abd900669899e42c07994925d09ad7e881341ef852392`,
		vkey: `58204a3fd9c3c461c04bf5b8f83ade43ec89a8dbee1ee261015d564a32fc8595024d`,
		networkId: NETWORK_ID.PREPROD
	})

	console.log('Vkey 1:', KeysUtils.genVkey(sk))
}

main().catch(error => {
	console.error(error)
	process.exit(1)
})
