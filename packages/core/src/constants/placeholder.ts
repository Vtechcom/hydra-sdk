import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

type NetworkId = number

export const PLACEHOLDER_ADDRESS: Record<NetworkId, string> = {
	[CardanoWASM.NetworkInfo.mainnet().network_id()]:
		'addr1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xspeqa7n',
	[CardanoWASM.NetworkInfo.testnet_preprod().network_id()]:
		'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3',
	[CardanoWASM.NetworkInfo.testnet_preview().network_id()]:
		'addr_test1qruhen60uwzpwnnr7gjs50z2v8u9zyfw6zunet4k42zrpr54mrlv55f93rs6j48wt29w90hlxt4rvpvshe55k5r9mpvqjv2wt4'
}
