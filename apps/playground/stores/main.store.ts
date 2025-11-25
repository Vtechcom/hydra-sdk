import { NETWORK_ID, NETWORK_MAGIC, ProviderUtils, type UTxO } from '@hydra-sdk/core'
import { useForm } from 'vee-validate'
import { toast } from 'vue-sonner'

export const useMainStore = defineStore('main', () => {
	const networks = ref([
		{ name: 'MAINNET', label: 'Mainnet', networkId: NETWORK_ID.MAINNET, networkMagic: NETWORK_MAGIC.MAINNET },
		{ name: 'PREPROD', label: 'Preprod', networkId: NETWORK_ID.PREPROD, networkMagic: NETWORK_MAGIC.PREPROD },
		{ name: 'PREVIEW', label: 'Preview', networkId: NETWORK_ID.PREVIEW, networkMagic: NETWORK_MAGIC.PREVIEW }
	])
	const network = useLocalStorage<'MAINNET' | 'PREPROD' | 'PREVIEW'>('network', 'MAINNET')
	const networkInfo = computed(() => networks.value.find(n => n.name === network.value)!)
	// Wallet
	const walletPrvKeyHex = useSessionStorage<string>('rootKey', '')

	// Tx builder
	const inputUTxOs = shallowRef<UTxO[]>([])
	const addUTxOToInput = (utxo: UTxO) => {
		if (
			inputUTxOs.value.find(u => u.input.txHash === utxo.input.txHash && u.input.outputIndex === utxo.input.outputIndex)
		) {
			toast.warning('UTxO already exists in inputs.')
			return
		}
		inputUTxOs.value = [...inputUTxOs.value, utxo]
		triggerRef(inputUTxOs)
		toast.success('UTxO added to inputs.')
	}

	return {
		network,
		networkInfo,
		networks,

		// Wallet
		walletPrvKeyHex,

		// Tx builder
		inputUTxOs,
		addUTxOToInput
	}
})
