/**
 * HydraOne — Wallet Bridge Protocol & Game Lifecycle Types
 * Các kiểu dữ liệu giao tiếp RPC postMessage giữa Game Iframe (Client) và App Center (Host).
 */

// ─── Game Context (Ngữ cảnh truyền từ App Center xuống Game) ───────────────────

export interface GameContext {
	theme: 'dark' | 'light'
	locale: 'vi' | 'en' | string
	device: 'mobile' | 'desktop' | 'tablet'
	appCenterOrigin: string
	user?: {
		username?: string
		avatar?: string
	}
}

export const DEFAULT_TIMEOUTS: Record<string, number> = {
	WALLET_PING: 3000,
	GET_CONTEXT: 3000,
	GAME_READY: 3000,
	REQUEST_FULLSCREEN: 5000,
	EXIT_GAME: 5000,
	SET_ORIENTATION: 5000,
	TRIGGER_HAPTIC: 3000,
	HOST_STORAGE_GET: 5000,
	HOST_STORAGE_SET: 5000,
	HOST_STORAGE_REMOVE: 5000,
	WALLET_GET_ADDRESS: 5000,
	WALLET_GET_NETWORK: 5000,
	WALLET_GET_BALANCE: 10000,
	WALLET_GET_UTXOS: 15000,
	WALLET_GET_COLLATERAL: 15000,
	WALLET_GET_REWARD_ADDRESSES: 10000,
	WALLET_GET_USED_ADDRESSES: 10000,
	WALLET_BATCH_REQUEST: 15000,
	WALLET_CONNECT: 60000,
	WALLET_SIGN_DATA: 120000,
	WALLET_SIGN_TX: 120000,
	WALLET_SUBMIT_TX: 60000
}

export interface SendRequestOptions {
	timeoutMs?: number
}

// ─── Game → App Center (Requests) ───────────────────────────────────────────

export type WalletRequest =
	| {
			type: 'WALLET_GET_ADDRESS'
			requestId: string
	  }
	| {
			type: 'WALLET_SIGN_DATA'
			requestId: string
			address: string
			hexPayload: string
	  }
	| {
			type: 'WALLET_SIGN_TX'
			requestId: string
			txHex: string
			partialSign?: boolean
	  }
	| {
			type: 'WALLET_GET_UTXOS'
			requestId: string
			amount?: string
	  }
	| {
			type: 'WALLET_GET_NETWORK'
			requestId: string
	  }
	| {
			type: 'WALLET_SUBMIT_TX'
			requestId: string
			txHex: string
	  }
	| {
			type: 'WALLET_GET_BALANCE'
			requestId: string
	  }
	| {
			type: 'WALLET_GET_COLLATERAL'
			requestId: string
			amount?: string
	  }
	| {
			type: 'WALLET_GET_REWARD_ADDRESSES'
			requestId: string
	  }
	| {
			type: 'WALLET_GET_USED_ADDRESSES'
			requestId: string
	  }
	| {
			type: 'WALLET_CONNECT'
			requestId: string
	  }
	| {
			type: 'WALLET_PING'
			requestId: string
			version?: string
	  }
	| {
			type: 'WALLET_BATCH_REQUEST'
			requestId: string
			requests: WalletRequestPayload[]
	  }
	// ─── Host Storage Relay Requests (Safari ITP bypass) ───
	| {
			type: 'HOST_STORAGE_GET'
			requestId: string
			key: string
	  }
	| {
			type: 'HOST_STORAGE_SET'
			requestId: string
			key: string
			value: string
	  }
	| {
			type: 'HOST_STORAGE_REMOVE'
			requestId: string
			key: string
	  }
	// ─── Game Lifecycle Requests ───
	| {
			type: 'GAME_READY'
			requestId: string
			version?: string
			gameSlug?: string
	  }
	| {
			type: 'GET_CONTEXT'
			requestId: string
	  }
	| {
			type: 'REQUEST_FULLSCREEN'
			requestId: string
			enabled?: boolean
	  }
	| {
			type: 'EXIT_GAME'
			requestId: string
	  }
	| {
			type: 'SET_ORIENTATION'
			requestId: string
			orientation: 'portrait' | 'landscape' | 'any'
	  }
	| {
			type: 'TRIGGER_HAPTIC'
			requestId: string
			pattern?: string | number | number[]
	  }

export type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never
export type WalletRequestPayload = DistributiveOmit<WalletRequest, 'requestId'>

// ─── App Center → Game (Responses) ──────────────────────────────────────────

export type WalletResponse =
	| {
			type: 'WALLET_ADDRESS_RESULT'
			requestId: string
			result: string | null
			error?: string
	  }
	| {
			type: 'WALLET_SIGN_DATA_RESULT'
			requestId: string
			result: { signature: string; key: string } | null
			error?: string
	  }
	| {
			type: 'WALLET_SIGN_TX_RESULT'
			requestId: string
			result: string | null
			error?: string
	  }
	| {
			type: 'WALLET_GET_UTXOS_RESULT'
			requestId: string
			result: unknown[] | null
			error?: string
	  }
	| {
			type: 'WALLET_NETWORK_RESULT'
			requestId: string
			result: number | null
			error?: string
	  }
	| {
			type: 'WALLET_SUBMIT_TX_RESULT'
			requestId: string
			result: string | null
			error?: string
	  }
	| {
			type: 'WALLET_GET_BALANCE_RESULT'
			requestId: string
			result: string | null
			error?: string
	  }
	| {
			type: 'WALLET_GET_COLLATERAL_RESULT'
			requestId: string
			result: unknown[] | null
			error?: string
	  }
	| {
			type: 'WALLET_GET_REWARD_ADDRESSES_RESULT'
			requestId: string
			result: string[] | null
			error?: string
	  }
	| {
			type: 'WALLET_GET_USED_ADDRESSES_RESULT'
			requestId: string
			result: string[] | null
			error?: string
	  }
	| {
			type: 'WALLET_CONNECT_RESULT'
			requestId: string
			result: { address: string; networkId: number } | null
			error?: string
	  }
	| {
			type: 'WALLET_PONG'
			requestId: string
			result: {
				version: string
				isConnected: boolean
				address?: string | null
				networkId?: number | null
				supportedMethods?: string[]
			}
			error?: string
	  }
	| {
			type: 'WALLET_BATCH_RESULT'
			requestId: string
			result: unknown[] | null
			error?: string
	  }
	// ─── Host Storage Relay Results ───
	| {
			type: 'HOST_STORAGE_GET_RESULT'
			requestId: string
			result: string | null
			error?: string
	  }
	| {
			type: 'HOST_STORAGE_SET_RESULT'
			requestId: string
			result: boolean
			error?: string
	  }
	| {
			type: 'HOST_STORAGE_REMOVE_RESULT'
			requestId: string
			result: boolean
			error?: string
	  }
	// ─── Game Lifecycle Results ───
	| {
			type: 'GAME_READY_RESULT'
			requestId: string
			result: boolean
			error?: string
	  }
	| {
			type: 'GET_CONTEXT_RESULT'
			requestId: string
			result: GameContext | null
			error?: string
	  }
	| {
			type: 'REQUEST_FULLSCREEN_RESULT'
			requestId: string
			result: boolean
			error?: string
	  }
	| {
			type: 'EXIT_GAME_RESULT'
			requestId: string
			result: boolean
			error?: string
	  }
	| {
			type: 'SET_ORIENTATION_RESULT'
			requestId: string
			result: boolean
			error?: string
	  }
	| {
			type: 'TRIGGER_HAPTIC_RESULT'
			requestId: string
			result: boolean
			error?: string
	  }
	| {
			type: string
			requestId: string
			result?: any
			error?: string
	  }

// ─── App Center → Game (Push Events — không có requestId) ───────────────────

export type WalletEvent =
	| {
			type: 'WALLET_CONNECTED'
			address: string
			networkId: number
	  }
	| {
			type: 'WALLET_ACCOUNT_CHANGED'
			address: string
	  }
	| {
			type: 'WALLET_NETWORK_CHANGED'
			networkId: number
	  }
	| {
			type: 'WALLET_DISCONNECTED'
	  }
	| {
			type: 'CONTEXT_CHANGED'
			context: Partial<GameContext>
	  }
	| {
			type: 'AUDIO_MUTED_CHANGED'
			muted: boolean
	  }
	| {
			type: 'THEME_CHANGED'
			theme: 'dark' | 'light'
	  }

// ─── Client Configuration & Events ───────────────────────────────────────────

export interface WalletBridgeMockConfig {
	address: string
	networkId: number
	utxos?: unknown[]
	balance?: string
	rewardAddresses?: string[]
	context?: Partial<GameContext>
	supportedMethods?: string[]
}

export interface WalletBridgeClientOptions {
	/**
	 * Origin của App Center cha (ví dụ: 'https://hydraone.io' hoặc 'http://localhost:3000').
	 * Mặc định '*' nếu cho phép linh hoạt trong môi trường test/dev.
	 */
	appCenterOrigin?: string
	/**
	 * Thời gian chờ tối đa (ms) mặc định cho request RPC nếu không có cấu hình cụ thể theo method.
	 * Mặc định: 60000ms.
	 */
	timeoutMs?: number
	/**
	 * Bật log debug chi tiết trong console.
	 */
	debug?: boolean
	/**
	 * Tự động gửi request thăm dò (probe) getAddress và getNetworkId khi khởi tạo nếu chạy trong iframe.
	 * Mặc định: true.
	 */
	autoProbe?: boolean
	/**
	 * Tiền tố cho key lưu trữ trong DualStorage (mặc định: 'hydra:').
	 */
	storagePrefix?: string
	/**
	 * Khi chạy standalone ngoài iframe (ví dụ localhost dev game độc lập):
	 * Cho phép fallback trực tiếp sang window.cardano (Eternl/Lace) nếu extension có sẵn.
	 */
	fallbackToExtension?: boolean
	/**
	 * Tên ví Cardano ưu tiên khi fallbackToExtension (ví dụ: 'eternl', 'lace', 'nami').
	 * Mặc định sẽ tự động chọn ví CIP-30 đầu tiên có sẵn trong window.cardano.
	 */
	preferredWallet?: string
	/**
	 * Mock data giả lập khi chạy dev standalone mà không có App Center Host.
	 */
	mock?: WalletBridgeMockConfig
}

export type WalletBridgeEventMap = {
	connected: (data: { address: string; networkId: number }) => void
	accountChanged: (address: string) => void
	networkChanged: (networkId: number) => void
	disconnected: () => void
	contextChanged: (context: Partial<GameContext>) => void
	audioMutedChanged: (muted: boolean) => void
	themeChanged: (theme: 'dark' | 'light') => void
	capabilitiesUpdated: (methods: string[]) => void
}

// ─── Host Protocol Types (Dành cho App Center Shell / Host) ──────────────────

export interface RegisteredGameIframe {
	window: Window
	origin: string
	gameSlug?: string
	registeredAt: number
}

export interface WalletBridgeHostOptions {
	allowedOrigins?: string[]
	debug?: boolean
}
