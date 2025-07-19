import { CardanoWASM } from '@hydrawallet/cardano-wasm'

export const NETWORK_ID = {
	MAINNET: CardanoWASM.NetworkInfo.mainnet().network_id(),
	PREPROD: CardanoWASM.NetworkInfo.testnet_preprod().network_id(),
	PREVIEW: CardanoWASM.NetworkInfo.testnet_preview().network_id()
}
export const NETWORK_MAGIC = {
	MAINNET: CardanoWASM.NetworkInfo.mainnet().protocol_magic(),
	PREPROD: CardanoWASM.NetworkInfo.testnet_preprod().protocol_magic(),
	PREVIEW: CardanoWASM.NetworkInfo.testnet_preview().protocol_magic()
}
