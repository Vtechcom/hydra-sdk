import { ref, computed, readonly, type Ref } from 'vue'
import { WalletBridgeClient } from './client'
import { formatShortAddress, parseUtxoAssets, type ParsedUtxoAssets, type WalletAssetItem } from './utils'
import type { WalletBridgeClientOptions } from './types'

export * from './index'

let _sharedClientInstance: WalletBridgeClient | null = null

// Module-level shared reactive state
const isConnected: Ref<boolean> = ref(false)
const walletAddressBech32: Ref<string | null> = ref(null)
const networkId: Ref<number | null> = ref(null)
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

		// ─── Computed Helpers ────────────────────────────────────────────────
		/** Địa chỉ rút gọn hiển thị trên UI (vd: addr_test1...xyz123) */
		shortAddress,
		/** True nếu mạng là Cardano Mainnet (NetworkId = 1) */
		isMainnet,
		/** True nếu mạng là Cardano Testnet / Preprod / Preview (NetworkId = 0) */
		isTestnet,

		// ─── RPC Methods ─────────────────────────────────────────────────────
		/** Yêu cầu Host mở modal kết nối ví */
		requestConnect: () => client.requestConnect(),
		/** Lấy địa chỉ ví Bech32 */
		getChangeAddress: () => client.getChangeAddress(),
		/** Lấy danh sách địa chỉ đã dùng (CIP-30) */
		getUsedAddresses: () => client.getUsedAddresses(),
		/** Lấy danh sách địa chỉ stake/reward (Bech32 `stake1...`) */
		getRewardAddresses: () => client.getRewardAddresses(),
		/** Lấy tổng số dư tài khoản CBOR Value hex */
		getBalance: () => client.getBalance(),
		/** Lấy danh sách Collateral UTxOs */
		getCollateral: (amount?: string) => client.getCollateral(amount),
		/** Yêu cầu ký challenge hex (CIP-8/CIP-30) */
		signData: (address: string, hexPayload: string) => client.signData(address, hexPayload),
		/** Yêu cầu ký Cardano Transaction CBOR */
		signTx: (txHex: string, partialSign = false) => client.signTx(txHex, partialSign),
		/** Lấy danh sách UTxOs của ví */
		getUtxos: (amount?: string) => client.getUtxos(amount),
		/** Gửi (submit/broadcast) Cardano Transaction đã ký lên chain L1 */
		submitTx: (txHex: string) => client.submitTx(txHex),
		/** Lấy Network ID */
		getNetworkId: () => client.getNetworkId(),
		/** Ping kiểm tra Host bridge */
		ping: () => client.ping(),

		/** Kiểm tra dApp có đang chạy trong iframe hay không */
		isInIframe: () => client.isInIframe(),

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

		/** Utility phân tích danh sách UTxOs thành ADA và danh sách token native */
		parseUtxoAssets: (utxos: unknown[] | null | undefined): ParsedUtxoAssets => parseUtxoAssets(utxos),

		/** Trình quản lý DualStorage (chống Safari ITP storage partitioning) */
		storage: client.storage,
		/** Core client instance */
		rawClient: client
	}
}

export { useWalletBridgeClient as useGameBridge }
export type { ParsedUtxoAssets, WalletAssetItem }
