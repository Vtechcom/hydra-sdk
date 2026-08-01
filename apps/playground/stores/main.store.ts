import { NETWORK_ID, NETWORK_MAGIC } from '@hydra-sdk/core'

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

	return {
		network,
		networkInfo,
		networks,
		walletPrvKeyHex
	}
})
