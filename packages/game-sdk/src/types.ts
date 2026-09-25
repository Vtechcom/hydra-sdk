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
			}
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

// ─── Client Configuration & Events ───────────────────────────────────────────

export interface WalletBridgeMockConfig {
	address: string
	networkId: number
	utxos?: unknown[]
	balance?: string
	rewardAddresses?: string[]
	context?: Partial<GameContext>
}

export interface WalletBridgeClientOptions {
	/**
	 * Origin của App Center cha (ví dụ: 'https://hydraone.io' hoặc 'http://localhost:3000').
	 * Mặc định '*' nếu cho phép linh hoạt trong môi trường test/dev.
	 */
	appCenterOrigin?: string
	/**
	 * Thời gian chờ tối đa (ms) cho một request RPC trước khi throw timeout.
	 * Mặc định: 60000ms (60 giây để kịp thời gian user mở popup ví ký).
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
