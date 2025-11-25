import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

const ALL_NETWORKS = ['MAINNET', 'PREPROD', 'PREVIEW'] as const

export type Network = (typeof ALL_NETWORKS)[number]

export const NETWORK_ID: Record<Network, number> = {
	MAINNET: CardanoWASM.NetworkInfo.mainnet().network_id(),
	PREPROD: CardanoWASM.NetworkInfo.testnet_preprod().network_id(),
	PREVIEW: CardanoWASM.NetworkInfo.testnet_preview().network_id()
}
export const NETWORK_MAGIC: Record<Network, number> = {
	MAINNET: CardanoWASM.NetworkInfo.mainnet().protocol_magic(),
	PREPROD: CardanoWASM.NetworkInfo.testnet_preprod().protocol_magic(),
	PREVIEW: CardanoWASM.NetworkInfo.testnet_preview().protocol_magic()
}
