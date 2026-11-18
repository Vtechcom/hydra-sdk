import { NETWORK_ID, NETWORK_MAGIC } from '@hydra-sdk/core'

import type { PaymentRole } from '@hydra-sdk/core'

/** `m/1852'/1815'/{accountIndex}'/{role}/{keyIndex}` — role 0 external (receive), 1 internal (change). */
export type WalletDerivation = { accountIndex: number; keyIndex: number; role: PaymentRole }
export const DEFAULT_WALLET_DERIVATION: WalletDerivation = { accountIndex: 0, keyIndex: 0, role: 0 }
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
	// Derivation path — same lifetime as the root key. mergeDefaults fills `role` into sessions saved before it existed.
	const walletDerivation = useSessionStorage<WalletDerivation>(
		'walletDerivation',
		{ ...DEFAULT_WALLET_DERIVATION },
		{ mergeDefaults: true }
	)
	// A wallet imported from a single `ed25519e_sk1…` key (no chain code, no derivation). Only one of rootKey and
	// ed25519eKey is set at a time.
	const walletEd25519eKey = useSessionStorage<string>('ed25519eKey', '')
	const walletReady = computed(() => !!walletPrvKeyHex.value || !!walletEd25519eKey.value)

	const resetWalletDerivation = () => {
		walletDerivation.value = { ...DEFAULT_WALLET_DERIVATION }
	}

	return {
		network,
		networkInfo,
		networks,
		walletPrvKeyHex,
		walletDerivation,
		walletEd25519eKey,
		walletReady,
		resetWalletDerivation
	}
})
