import { ProviderUtils } from '@hydra-sdk/core'
import { StorageSerializers } from '@vueuse/core'
import {
	isProviderConfig,
	networkFromBlockfrostKey,
	rememberedConfigKey,
	type ProviderConfig,
	type ProviderKind,
	type ProviderNetwork
} from '~/lib/provider'

/** The session copy also records which network it was connected for, so it is never reused on another one. */
type SessionProviderConfig = ProviderConfig & { network: ProviderNetwork }

const SESSION_KEY = 'providerConfig'
const LEGACY_SESSION_KEY = 'blockfrostConfig'

const readJson = (storage: Storage, key: string): unknown => {
	try {
		const raw = storage.getItem(key)
		return raw ? JSON.parse(raw) : null
	} catch {
		return null
	}
}

/** One-time move of the 0.1.1 `blockfrostConfig` session entry to `providerConfig`. */
const migrateLegacySession = (fallbackNetwork: ProviderNetwork) => {
	if (typeof window === 'undefined') return
	const legacy = readJson(sessionStorage, LEGACY_SESSION_KEY) as { apiKey?: string; apiEndpoint?: string } | null
	if (!legacy) return
	sessionStorage.removeItem(LEGACY_SESSION_KEY)
	if (sessionStorage.getItem(SESSION_KEY) || !legacy.apiKey) return
	const migrated: SessionProviderConfig = {
		kind: 'blockfrost',
		apiKey: legacy.apiKey,
		apiEndpoint: legacy.apiEndpoint || `https://cardano-${fallbackNetwork}.blockfrost.io/api/v0`,
		network: networkFromBlockfrostKey(legacy.apiKey) ?? fallbackNetwork
	}
	sessionStorage.setItem(SESSION_KEY, JSON.stringify(migrated))
}

export const useProviderStore = defineStore('provider', () => {
	const mainStore = useMainStore()
	const { network } = storeToRefs(mainStore)

	const providerNetworkMap = {
		MAINNET: 'mainnet',
		PREVIEW: 'preview',
		PREPROD: 'preprod'
	} as const
	const providerNetwork = computed<ProviderNetwork>(() => providerNetworkMap[network.value])

	migrateLegacySession(providerNetwork.value)
	const sessionConfig = useSessionStorage<SessionProviderConfig | null>(SESSION_KEY, null, {
		serializer: StorageSerializers.object
	})

	/** The config usable on the current network, or `null` — a key never crosses networks. */
	const providerConfig = computed<ProviderConfig | null>(() => {
		const config = sessionConfig.value
		if (!config || config.network !== providerNetwork.value || !isProviderConfig(config)) return null
		return config
	})
	const providerReady = computed(() => !!providerConfig.value)
	const providerKind = computed<ProviderKind | null>(() => providerConfig.value?.kind ?? null)

	// ── Remember on this device (localStorage) ────────────────────────────────
	// Bumped on every write so computed reads of localStorage re-evaluate.
	const rememberedVersion = ref(0)

	const getRememberedConfig = (kind: ProviderKind, net: ProviderNetwork = providerNetwork.value) => {
		void rememberedVersion.value
		if (typeof window === 'undefined') return null
		const value = readJson(localStorage, rememberedConfigKey(kind, net))
		return isProviderConfig(value) && value.kind === kind ? value : null
	}

	const forgetConfig = (kind: ProviderKind, net: ProviderNetwork = providerNetwork.value) => {
		localStorage.removeItem(rememberedConfigKey(kind, net))
		rememberedVersion.value++
	}

	const setProviderConfig = (config: ProviderConfig, options: { remember: boolean }) => {
		const net = providerNetwork.value
		sessionConfig.value = { ...config, network: net }
		if (options.remember) {
			localStorage.setItem(rememberedConfigKey(config.kind, net), JSON.stringify(config))
			rememberedVersion.value++
		} else if (getRememberedConfig(config.kind, net)) {
			forgetConfig(config.kind, net)
		}
	}

	// On start-up and on every network switch: sessionStorage wins; otherwise fall back to a remembered config
	// for this network (the previously used provider kind first).
	watch(
		providerNetwork,
		net => {
			if (providerConfig.value) return
			const preferred: ProviderKind = sessionConfig.value?.kind ?? 'blockfrost'
			const order: ProviderKind[] = preferred === 'blockfrost' ? ['blockfrost', 'demeter'] : ['demeter', 'blockfrost']
			for (const kind of order) {
				const remembered = getRememberedConfig(kind, net)
				if (remembered) {
					sessionConfig.value = { ...remembered, network: net }
					return
				}
			}
		},
		{ immediate: true }
	)

	const getProvider = () => {
		const config = providerConfig.value
		if (!config) throw new Error('Provider is not configured for this network — open Provider › Configure.')

		// Demeter exposes a Blockfrost-compatible API, so both kinds go through `BlockfrostProvider` with the
		// resolved base URL. `ProviderUtils.DemeterProvider` is not used: its URL (demeter.run + /api/v0) no
		// longer matches Demeter's docs.
		const provider = new ProviderUtils.BlockfrostProvider({
			apiKey: config.apiKey,
			network: providerNetwork.value,
			baseURL: config.apiEndpoint.replace(/\/$/, '')
		})

		if (config.kind === 'demeter') {
			// `BlockfrostProvider` always sends `project_id`. Demeter does not need it (the key is in the host) and
			// its CORS preflight does not allow it, so the browser blocks every request that carries it. Core has
			// no option to leave it out, so it is removed from the provider's (private) axios instance.
			const axiosInstance = (provider as unknown as { _axiosInstance?: { defaults: { headers: Record<string, unknown> } } })
				._axiosInstance
			if (!axiosInstance) throw new Error('Cannot remove the project_id header from BlockfrostProvider')
			delete axiosInstance.defaults.headers.project_id
		}

		return provider
	}

	return {
		providerNetwork,
		providerNetworkMap,
		providerConfig,
		providerReady,
		providerKind,
		setProviderConfig,
		getRememberedConfig,
		forgetConfig,
		getProvider,
		/** @deprecated use `getProvider` — kept so callers can move over gradually. */
		getBlockfrostProvider: getProvider
	}
})
