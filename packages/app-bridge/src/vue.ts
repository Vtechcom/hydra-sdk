import { ref, computed, readonly, onScopeDispose, getCurrentScope, type Ref, type DeepReadonly } from 'vue'
import { WalletBridgeClient } from './client'
import {
	formatShortAddress,
	parseUtxoAssets,
	lovelaceToAda,
	adaToLovelace,
	toHexPayload,
	fromHexPayload,
	type ParsedUtxoAssets,
	type WalletAssetItem
} from './utils'
import { GameAuthManager, type GameAuthEndpoints, type GameAuthConfig, type GameLoginResult } from './auth'
import type { WalletBridgeClientOptions, WalletRequestPayload, SendRequestOptions } from './types'

export * from './index'

let _sharedClientInstance: WalletBridgeClient | null = null

// Module-level shared reactive state
const isConnected: Ref<boolean> = ref(false)
const walletAddressBech32: Ref<string | null> = ref(null)
const networkId: Ref<number | null> = ref(null)
const isAudioMuted: Ref<boolean> = ref(false)
const theme: Ref<'dark' | 'light' | string> = ref('dark')
const supportedCapabilities: Ref<string[]> = ref([])

let _listenersInitialized = false

function initListeners(client: WalletBridgeClient) {
	if (_listenersInitialized) return
	_listenersInitialized = true

	// Sync initial state if client already has it
	if (client.isConnected) {
		isConnected.value = true
		walletAddressBech32.value = client.currentAddress
		networkId.value = client.currentNetworkId
	}

	const caps = client.getSupportedMethods()
	if (caps.length > 0) {
		supportedCapabilities.value = caps
	}

	client.on('connected', data => {
		isConnected.value = true
		walletAddressBech32.value = data.address
		networkId.value = data.networkId
	})

	client.on('accountChanged', address => {
		walletAddressBech32.value = address
	})

	client.on('networkChanged', newNetId => {
		networkId.value = newNetId
	})

	client.on('disconnected', () => {
		isConnected.value = false
		walletAddressBech32.value = null
	})

	client.on('audioMutedChanged', muted => {
		isAudioMuted.value = muted
	})

	client.on('themeChanged', newTheme => {
		theme.value = newTheme
	})

	client.on('capabilitiesUpdated', methods => {
		supportedCapabilities.value = methods
	})
}

/**
 * Xóa hoặc reset shared client instance (dùng cho testing hoặc tái khởi tạo session).
 */
export function resetSharedWalletBridgeClient(): void {
	if (_sharedClientInstance) {
		_sharedClientInstance.destroy()
		_sharedClientInstance = null
	}
	_listenersInitialized = false
	isConnected.value = false
	walletAddressBech32.value = null
	networkId.value = null
	isAudioMuted.value = false
	theme.value = 'dark'
	supportedCapabilities.value = []
}

/**
 * Vue 3 / Nuxt 3 Composable wrapper cho WalletBridgeClient.
 * Cung cấp reactive state và interface tương thích hoàn toàn (drop-in replacement)
 * với useWalletExtension trong các repo game.
 */
export function useWalletBridgeClient(options: WalletBridgeClientOptions = {}) {
	if (!_sharedClientInstance) {
		_sharedClientInstance = new WalletBridgeClient(options)
	} else if (options.appCenterOrigin) {
		_sharedClientInstance.setAppCenterOrigin(options.appCenterOrigin)
	}

	const client = _sharedClientInstance
	initListeners(client)

	// Computed helpers tiện lợi cho UI
	const shortAddress = computed(() => formatShortAddress(walletAddressBech32.value))
	const isMainnet = computed(() => networkId.value === 1)
	const isTestnet = computed(() => networkId.value === 0)

	return {
		/** Trạng thái kết nối ví của App Center */
		isConnected: readonly(isConnected),
		/** Địa chỉ ví Bech32 của user */
		walletAddressBech32: readonly(walletAddressBech32),
		/** Network ID (0 = Testnet/Preprod, 1 = Mainnet) */
		networkId: readonly(networkId),
		/** Trạng thái mute âm thanh từ App Center Shell */
		isAudioMuted: readonly(isAudioMuted),
		/** Theme hiện tại từ App Center Shell */
		theme: readonly(theme),
		/** Danh sách các methods mà Host Bridge hỗ trợ */
		supportedCapabilities: readonly(supportedCapabilities),

		// ─── Computed Helpers ────────────────────────────────────────────────
		/** Địa chỉ rút gọn hiển thị trên UI (vd: addr_test1...xyz123) */
		shortAddress,
		/** True nếu mạng là Cardano Mainnet (NetworkId = 1) */
		isMainnet,
		/** True nếu mạng là Cardano Testnet / Preprod / Preview (NetworkId = 0) */
		isTestnet,

		// ─── Capability Helper ───────────────────────────────────────────────
		isMethodSupported: (type: string) => client.isMethodSupported(type),

		// ─── RPC Methods ─────────────────────────────────────────────────────
		/** Yêu cầu Host mở modal kết nối ví */
		requestConnect: (opts?: SendRequestOptions) => client.requestConnect(opts),
		/** Lấy địa chỉ ví Bech32 */
		getChangeAddress: (opts?: SendRequestOptions) => client.getChangeAddress(opts),
		/** Lấy danh sách địa chỉ đã dùng (CIP-30) */
		getUsedAddresses: (opts?: SendRequestOptions) => client.getUsedAddresses(opts),
		/** Lấy danh sách địa chỉ stake/reward (Bech32 `stake1...`) */
		getRewardAddresses: (opts?: SendRequestOptions) => client.getRewardAddresses(opts),
		/** Lấy tổng số dư tài khoản CBOR Value hex */
		getBalance: (opts?: SendRequestOptions) => client.getBalance(opts),
		/** Lấy danh sách Collateral UTxOs */
		getCollateral: (amount?: string, opts?: SendRequestOptions) => client.getCollateral(amount, opts),
		/** Yêu cầu ký challenge hex (CIP-8/CIP-30) */
		signData: (address: string, hexPayload: string, opts?: SendRequestOptions) => client.signData(address, hexPayload, opts),
		/** Yêu cầu ký Cardano Transaction CBOR */
		signTx: (txHex: string, partialSign = false, opts?: SendRequestOptions) => client.signTx(txHex, partialSign, opts),
		/** Lấy danh sách UTxOs của ví */
		getUtxos: (amount?: string, opts?: SendRequestOptions) => client.getUtxos(amount, opts),
		/** Gửi (submit/broadcast) Cardano Transaction đã ký lên chain L1 */
		submitTx: (txHex: string, opts?: SendRequestOptions) => client.submitTx(txHex, opts),
		/** Lấy Network ID */
		getNetworkId: (opts?: SendRequestOptions) => client.getNetworkId(opts),
		/** Ping kiểm tra Host bridge & khám phá capabilities */
		ping: (opts?: SendRequestOptions) => client.ping(opts),
		/** Gửi batch nhiều requests trong 1 postMessage duy nhất */
		batch: (requests: WalletRequestPayload[], opts?: SendRequestOptions) => client.batch(requests, opts),

		/** Kiểm tra dApp có đang chạy trong iframe hay không */
		isInIframe: () => client.isInIframe(),

		// ─── Host Storage Relay (Safari ITP bypass) ──────────────────────────
		hostStorageGet: (key: string, opts?: SendRequestOptions) => client.hostStorageGet(key, opts),
		hostStorageSet: (key: string, value: string, opts?: SendRequestOptions) => client.hostStorageSet(key, value, opts),
		hostStorageRemove: (key: string, opts?: SendRequestOptions) => client.hostStorageRemove(key, opts),

		// ─── Game Lifecycle Methods ──────────────────────────────────────────
		/** Game Lifecycle Manager */
		lifecycle: client.lifecycle,
		/** Báo cho App Center biết Game đã tải xong tài nguyên */
		ready: (payload?: { version?: string; gameSlug?: string }) => client.lifecycle.ready(payload),
		/** Lấy ngữ cảnh hiện tại từ App Center (Theme, Locale, Device...) */
		getContext: () => client.lifecycle.getContext(),
		/** Yêu cầu App Center phóng to Game Canvas toàn màn hình */
		requestFullscreen: (enabled = true) => client.lifecycle.requestFullscreen(enabled),
		/** Yêu cầu App Center điều hướng thoát game về sảnh /games */
		exitGame: () => client.lifecycle.exitGame(),
		/** Yêu cầu khóa xoay màn hình */
		setOrientation: (orientation: 'portrait' | 'landscape' | 'any') => client.lifecycle.setOrientation(orientation),
		/** Yêu cầu rung cảm ứng */
		triggerHaptic: (pattern?: any) => client.lifecycle.triggerHaptic(pattern),

		// ─── Utilities ───────────────────────────────────────────────────────
		/** Utility phân tích danh sách UTxOs thành ADA và danh sách token native */
		parseUtxoAssets: (utxos: unknown[] | null | undefined): ParsedUtxoAssets => parseUtxoAssets(utxos),
		lovelaceToAda,
		adaToLovelace,
		toHexPayload,
		fromHexPayload,

		/** Trình quản lý DualStorage (chống Safari ITP storage partitioning) */
		storage: client.storage,
		/** Core client instance */
		rawClient: client
	}
}

export interface UseGameAuthReturn<TUser = any> {
	isAuthenticated: Readonly<Ref<boolean>>
	authToken: Readonly<Ref<string | null>>
	authUser: Readonly<Ref<TUser | null>>
	login: () => Promise<GameLoginResult<TUser>>
	logout: () => void
	authManager: GameAuthManager<TUser>
}

/**
 * Vue 3 Composable chuyên biệt cho luồng Web3 Auth của Game
 */
export function useGameAuth<TUser = any>(
	endpoints: GameAuthEndpoints<TUser>,
	config: Partial<GameAuthConfig<TUser>> = {}
): UseGameAuthReturn<TUser> {
	const bridge = useWalletBridgeClient()
	const authManager = new GameAuthManager<TUser>({
		client: bridge.rawClient,
		endpoints,
		...config
	})

	const isAuthenticated = ref(authManager.isAuthenticated())
	const authToken = ref<string | null>(authManager.getToken())
	const authUser = ref<TUser | null>(null)

	const unsubscribeAuth = authManager.onAuthChange((isAuth, token) => {
		isAuthenticated.value = isAuth
		authToken.value = token
		if (!isAuth) {
			authUser.value = null
		}
	})

	if (getCurrentScope()) {
		onScopeDispose(() => {
			unsubscribeAuth()
			authManager.destroy()
		})
	}

	async function login(): Promise<GameLoginResult<TUser>> {
		const res = await authManager.login()
		isAuthenticated.value = true
		authToken.value = res.token
		authUser.value = res.user ?? null
		return res
	}

	function logout(): void {
		authManager.logout()
		isAuthenticated.value = false
		authToken.value = null
		authUser.value = null
	}

	return {
		isAuthenticated: readonly(isAuthenticated) as Readonly<Ref<boolean>>,
		authToken: readonly(authToken) as Readonly<Ref<string | null>>,
		authUser: readonly(authUser) as unknown as Readonly<Ref<TUser | null>>,
		login,
		logout,
		authManager
	}
}

export { useWalletBridgeClient as useGameBridge }
export type { ParsedUtxoAssets, WalletAssetItem }
