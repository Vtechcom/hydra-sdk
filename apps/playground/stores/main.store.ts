import { NETWORK_ID, NETWORK_MAGIC } from '@hydra-sdk/core'

export type WalletDerivation = { accountIndex: number; keyIndex: number }
export const DEFAULT_WALLET_DERIVATION: WalletDerivation = { accountIndex: 0, keyIndex: 0 }
/** Largest non-hardened BIP32 index (2^31 − 1). */
export const MAX_DERIVATION_INDEX = 2147483647

export const useMainStore = defineStore('main', () => {
	const networks = ref([
		{ name: 'MAINNET', label: 'Mainnet', networkId: NETWORK_ID.MAINNET, networkMagic: NETWORK_MAGIC.MAINNET },
		{ name: 'PREPROD', label: 'Preprod', networkId: NETWORK_ID.PREPROD, networkMagic: NETWORK_MAGIC.PREPROD },
		{ name: 'PREVIEW', label: 'Preview', networkId: NETWORK_ID.PREVIEW, networkMagic: NETWORK_MAGIC.PREVIEW }
	])
	const network = useLocalStorage<'MAINNET' | 'PREPROD' | 'PREVIEW'>('network', 'PREPROD')
	const networkInfo = computed(() => networks.value.find(n => n.name === network.value)!)

	// Session-scoped on purpose: a playground key should not outlive the tab.
	const walletPrvKeyHex = useSessionStorage<string>('rootKey', '')
	// Derivation path m/1852'/1815'/{accountIndex}'/0/{keyIndex} — same lifetime as the root key.
	const walletDerivation = useSessionStorage<WalletDerivation>('walletDerivation', { ...DEFAULT_WALLET_DERIVATION })
	const resetWalletDerivation = () => {
		walletDerivation.value = { ...DEFAULT_WALLET_DERIVATION }
	}

	return {
		network,
		networkInfo,
		networks,
		walletPrvKeyHex,
		walletDerivation,
		resetWalletDerivation
	}
})
