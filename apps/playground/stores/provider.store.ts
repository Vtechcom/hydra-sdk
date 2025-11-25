import { ProviderUtils } from '@hydra-sdk/core'

export const useProviderStore = defineStore('provider', () => {
	const mainStore = useMainStore()
	const { network } = storeToRefs(mainStore)

	// Blockfrost config
	const blockfrostNetworkMap = {
		MAINNET: 'mainnet',
		PREVIEW: 'preview',
		PREPROD: 'preprod'
	} as const

	const blockfrostConfig = useSessionStorage<{
		apiKey: string
		apiEndpoint: string
	}>('blockfrostConfig', {
		apiKey: '',
		apiEndpoint: ''
	})
	const setBlockfrostConfig = (config: { apiKey: string; apiEndpoint: string }) => {
		blockfrostConfig.value = config
	}

	const blockfrostNetwork = computed(() => blockfrostNetworkMap[network.value])
	const blockfrostFormError = ref<{ [key: string]: string }>({})

	const getBlockfrostProvider = () => {
		if (!blockfrostConfig.value.apiKey) {
			blockfrostFormError.value.blockfrostApiKey = 'Blockfrost API Key is not set'
			throw new Error('Blockfrost API Key is not set')
		}
		if (!blockfrostConfig.value.apiEndpoint) {
			blockfrostFormError.value.blockfrostApiEndpoint = 'Blockfrost API Endpoint is not set'
			throw new Error('Blockfrost API Endpoint is not set')
		}

		return new ProviderUtils.BlockfrostProvider({
			apiKey: blockfrostConfig.value.apiKey,
			network: blockfrostNetworkMap[network.value]
		})
	}
	const blockfrostConfigInvalid = computed(
		() => !!blockfrostFormError.value.blockfrostApiKey || !!blockfrostFormError.value.blockfrostApiEndpoint
	)

	return {
		// Blockfrost
		blockfrostFormError,
		blockfrostNetwork,
		blockfrostNetworkMap,
		setBlockfrostConfig,
		blockfrostConfig,
		blockfrostConfigInvalid,
		getBlockfrostProvider
	}
})
