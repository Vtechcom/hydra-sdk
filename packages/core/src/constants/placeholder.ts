import { NETWORK_ID } from './chain'

type NetworkId = number

/**
 * Keyed by network id, so both testnets share the single `0` slot — the preview
 * entry below is the one that survives, and it is a valid placeholder on either
 * testnet.
 *
 * The keys come from {@link NETWORK_ID} rather than `CardanoWASM.NetworkInfo`
 * because this module must not run WASM code while it is evaluating — see the
 * note in `./chain`.
 */
export const PLACEHOLDER_ADDRESS: Record<NetworkId, string> = {
	[NETWORK_ID.MAINNET]:
		'addr1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xspeqa7n',
	[NETWORK_ID.PREPROD]:
		'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3',
	[NETWORK_ID.PREVIEW]:
		'addr_test1qruhen60uwzpwnnr7gjs50z2v8u9zyfw6zunet4k42zrpr54mrlv55f93rs6j48wt29w90hlxt4rvpvshe55k5r9mpvqjv2wt4'
}
