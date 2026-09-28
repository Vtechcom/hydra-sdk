import { DualStorage, type StorageHostRelay } from './storage'
import { GameLifecycleManager } from './lifecycle'
import { cardanoHexToBech32 } from './utils'
import {
	WalletBridgeError,
	WalletBridgeTimeoutError,
	WalletBridgeUserRejectedError,
	WalletBridgeNotInIframeError,
	WalletBridgeRpcError
} from './errors'
import {
	DEFAULT_TIMEOUTS,
	type WalletRequest,
	type WalletRequestPayload,
	type WalletResponse,
	type WalletEvent,
	type WalletBridgeClientOptions,
	type WalletBridgeEventMap,
	type WalletBridgeMockConfig,
	type SendRequestOptions
} from './types'

interface PendingRequest {
	resolve: (val: any) => void
	reject: (err: Error) => void
	timer: ReturnType<typeof setTimeout>
	type: string
}

/**
 * Core Wallet Bridge & Game SDK Client dành cho Game dApp trong iframe.
 * Thuần TypeScript, độc lập framework (chạy tốt với Vanilla TS, React, Vue, Phaser, PixiJS...).
 */
export class WalletBridgeClient implements StorageHostRelay {
	private appCenterOrigin: string
	private timeoutMs: number
	private customTimeoutMs?: number
	private debug: boolean
	private autoProbe: boolean
	private mockConfig?: WalletBridgeMockConfig
	private fallbackToExtension: boolean
	private preferredWallet?: string
	public storage: DualStorage
	public lifecycle: GameLifecycleManager

	private pendingRequests = new Map<string, PendingRequest>()
	private eventListeners = new Map<keyof WalletBridgeEventMap, Set<Function>>()
	private supportedMethods = new Set<string>()
	private capabilitiesReceived = false
	private mockStorage = new Map<string, string>()

	public isConnected = false
	public currentAddress: string | null = null
	public currentNetworkId: number | null = null

	private isDestroyed = false

	constructor(options: WalletBridgeClientOptions = {}) {
		this.appCenterOrigin = options.appCenterOrigin ?? '*'
		this.customTimeoutMs = options.timeoutMs
		this.timeoutMs = options.timeoutMs ?? 60000
		this.debug = !!options.debug
		this.autoProbe = options.autoProbe ?? true
		this.mockConfig = options.mock
		this.fallbackToExtension = !!options.fallbackToExtension
		this.preferredWallet = options.preferredWallet

		this.storage = new DualStorage({
			prefix: options.storagePrefix ?? 'hydra:',
			debug: this.debug,
			hostRelay: this
		})
		this.lifecycle = new GameLifecycleManager(this)

		if (this.mockConfig?.supportedMethods) {
			this.supportedMethods = new Set(this.mockConfig.supportedMethods)
			this.capabilitiesReceived = true
		}

		this.init()
	}

	public setAppCenterOrigin(origin: string): void {
		this.appCenterOrigin = origin
	}

	public getAppCenterOrigin(): string {
		return this.appCenterOrigin
	}

	/**
	 * Kiểm tra xem một method cụ thể có được App Center Host hỗ trợ hay không.
	 * Trả về null nếu chưa thực hiện handshake Capability qua WALLET_PING.
	 */
	public isMethodSupported(type: string): boolean | null {
		if (!this.capabilitiesReceived) return null
		return this.supportedMethods.has(type)
	}

	/**
	 * Lấy danh sách các methods mà Host đã thông báo hỗ trợ
	 */
	public getSupportedMethods(): string[] {
		return Array.from(this.supportedMethods)
	}

	/**
	 * Kiểm tra xem ứng dụng có đang chạy bên trong một iframe hay không
	 */
	public isInIframe(): boolean {
		if (typeof window === 'undefined') return false
		try {
			return window.parent !== window
		} catch {
			// Nếu truy cập window.parent ném SecurityError thì chắc chắn đang ở cross-origin iframe
			return true
		}
	}

	private init() {
		// 1. Chế độ Mock cho môi trường Local Standalone Dev
		if (this.mockConfig && !this.isInIframe()) {
			if (this.debug) {
				console.log('[WalletBridgeClient] Đang chạy ở chế độ MOCK STANDALONE DEV:', this.mockConfig)
			}
			this.isConnected = true
			this.currentAddress = this.mockConfig.address
			this.currentNetworkId = this.mockConfig.networkId
			setTimeout(() => {
				this.emit('connected', {
					address: this.mockConfig!.address,
					networkId: this.mockConfig!.networkId
				})
			}, 0)
			return
		}

		if (typeof window === 'undefined') return
		window.addEventListener('message', this.handleWindowMessage)

		if (this.debug) {
			console.log('[WalletBridgeClient] Đã khởi tạo Bridge Client. Lắng nghe parent message...')
		}

		// Tự động gửi request thăm dò (probe) capabilities, getAddress & getNetwork ban đầu nếu chạy trong iframe
		if (this.autoProbe && this.isInIframe()) {
			this.ping().catch(() => {
				// Silent catch on initial probe
			})
			this.getChangeAddress().catch(() => {
				// Silent catch on initial probe
			})
			this.getNetworkId().catch(() => {
				// Silent catch on initial probe
			})
		}
	}

	private handleWindowMessage = (event: MessageEvent) => {
		if (this.isDestroyed) return

		// BẢO MẬT BẮT BUỘC: Chỉ nhận message gửi từ window.parent
		try {
			if (typeof window !== 'undefined' && event.source !== window.parent) {
				return
			}
		} catch {
			// Một số browser/WebView ném SecurityError khi so sánh cross-origin Window reference
			return
		}

		// Kiểm tra Origin nếu có cấu hình cụ thể
		if (this.appCenterOrigin !== '*' && event.origin !== this.appCenterOrigin) {
			if (this.debug) {
				console.warn('[WalletBridgeClient] Từ chối message từ origin không khớp:', event.origin)
			}
			return
		}

		const data = event.data
		if (!data || typeof data !== 'object') return

		// ─── 1. Xử lý Push Event từ App Center ──────────────────────────────
		if ('type' in data && !('requestId' in data)) {
			this.handlePushEvent(data as WalletEvent)
			return
		}

		// ─── 2. Xử lý RPC Response tương ứng với requestId ───────────────────
		if ('requestId' in data) {
			this.handleRpcResponse(data as WalletResponse)
		}
	}

	private handlePushEvent(event: WalletEvent) {
		if (this.debug) {
			console.log('[WalletBridgeClient] Nhận Push Event:', event)
		}

		switch (event.type) {
			case 'WALLET_CONNECTED':
				this.isConnected = true
				this.currentAddress = event.address
				this.currentNetworkId = event.networkId
				this.emit('connected', { address: event.address, networkId: event.networkId })
				break

			case 'WALLET_ACCOUNT_CHANGED':
				this.currentAddress = event.address
				this.emit('accountChanged', event.address)
				break

			case 'WALLET_NETWORK_CHANGED':
				this.currentNetworkId = event.networkId
				this.emit('networkChanged', event.networkId)
				break

			case 'WALLET_DISCONNECTED':
				this.isConnected = false
				this.currentAddress = null
				this.emit('disconnected')
				break

			case 'CONTEXT_CHANGED':
				this.emit('contextChanged', event.context)
				break

			case 'AUDIO_MUTED_CHANGED':
				this.emit('audioMutedChanged', event.muted)
				break

			case 'THEME_CHANGED':
				this.emit('themeChanged', event.theme)
				break
		}
	}

	private handleRpcResponse(response: WalletResponse) {
		const pending = this.pendingRequests.get(response.requestId)
		if (!pending) return

		clearTimeout(pending.timer)
		this.pendingRequests.delete(response.requestId)

		if (response.error) {
			const errLower = response.error.toLowerCase()
			if (
				errLower.includes('declined') ||
				errLower.includes('rejected') ||
				errLower.includes('cancel') ||
				errLower.includes('user cancel')
			) {
				pending.reject(new WalletBridgeUserRejectedError(response.error))
			} else {
				pending.reject(new WalletBridgeRpcError(pending.type, response.error))
			}
			return
		}

		// Cập nhật trạng thái local tương ứng
		if (response.type === 'WALLET_ADDRESS_RESULT') {
			if (response.result) {
				this.currentAddress = response.result
				this.isConnected = true
				this.emit('connected', { address: response.result, networkId: this.currentNetworkId ?? 0 })
			} else if (this.isConnected) {
				this.currentAddress = null
				this.isConnected = false
				this.emit('disconnected')
			}
			pending.resolve(response.result)
		} else if (response.type === 'WALLET_CONNECT_RESULT') {
			if (response.result) {
				this.currentAddress = response.result.address
				this.currentNetworkId = response.result.networkId
				this.isConnected = true
				this.emit('connected', response.result)
			}
			pending.resolve(response.result)
		} else if (response.type === 'WALLET_PONG') {
			if (response.result?.isConnected && response.result.address) {
				this.currentAddress = response.result.address
				this.currentNetworkId = response.result.networkId ?? this.currentNetworkId
				this.isConnected = true
			}
			if (Array.isArray(response.result?.supportedMethods)) {
				this.supportedMethods = new Set(response.result.supportedMethods)
				this.capabilitiesReceived = true
				this.emit('capabilitiesUpdated', response.result.supportedMethods)
			}
			pending.resolve(response.result)
		} else if (response.type === 'WALLET_NETWORK_RESULT') {
			if (response.result !== null) {
				this.currentNetworkId = response.result
			}
			pending.resolve(response.result)
		} else {
			pending.resolve((response as any).result)
		}
	}

	/**
	 * Gửi request RPC lên App Center cha và trả về Promise với timeout phân tầng
	 */
	public sendRequest<T>(request: WalletRequestPayload, options?: SendRequestOptions): Promise<T> {
		if (this.isDestroyed) {
			return Promise.reject(new WalletBridgeError('[WalletBridgeClient] Client instance đã bị hủy.'))
		}

		// ─── Xử lý Mock Standalone Dev ───
		if (this.mockConfig && !this.isInIframe()) {
			return this.handleMockRequest<T>(request)
		}

		// ─── Xử lý Fallback to Extension khi chạy ngoài Iframe ───
		if (!this.isInIframe()) {
			if (this.fallbackToExtension && typeof window !== 'undefined' && (window as any).cardano) {
				return this.handleExtensionFallback<T>(request)
			}
			return Promise.reject(new WalletBridgeNotInIframeError())
		}

		// Phân tầng timeout theo loại request
		const requestTimeout = options?.timeoutMs ?? this.customTimeoutMs ?? DEFAULT_TIMEOUTS[request.type] ?? this.timeoutMs

		return new Promise<T>((resolve, reject) => {
			const requestId = this.generateUuid()

			const timer = setTimeout(() => {
				this.pendingRequests.delete(requestId)
				reject(new WalletBridgeTimeoutError(request.type, requestTimeout))
			}, requestTimeout)

			this.pendingRequests.set(requestId, {
				resolve,
				reject,
				timer,
				type: request.type
			})

			const fullRequest: WalletRequest = {
				...request,
				requestId
			} as WalletRequest

			try {
				window.parent.postMessage(fullRequest, this.appCenterOrigin)
			} catch (err) {
				clearTimeout(timer)
				this.pendingRequests.delete(requestId)
				reject(err instanceof Error ? err : new WalletBridgeError('Failed to postMessage to parent'))
			}
		})
	}

	private handleMockRequest<T>(request: WalletRequestPayload): Promise<T> {
		const m = this.mockConfig!
		switch (request.type) {
			case 'WALLET_GET_ADDRESS':
				return Promise.resolve(m.address as unknown as T)
			case 'WALLET_GET_NETWORK':
				return Promise.resolve(m.networkId as unknown as T)
			case 'WALLET_GET_BALANCE':
				return Promise.resolve((m.balance ?? '100000000') as unknown as T)
			case 'WALLET_GET_UTXOS':
			case 'WALLET_GET_COLLATERAL':
				return Promise.resolve((m.utxos ?? []) as unknown as T)
			case 'WALLET_GET_REWARD_ADDRESSES':
				return Promise.resolve((m.rewardAddresses ?? []) as unknown as T)
			case 'WALLET_GET_USED_ADDRESSES':
				return Promise.resolve([m.address] as unknown as T)
			case 'WALLET_SIGN_DATA':
				return Promise.resolve({
					signature: 'mock_signature_hex_data',
					key: 'mock_public_key_hex'
				} as unknown as T)
			case 'WALLET_SIGN_TX':
				return Promise.resolve('mock_signed_tx_cbor_hex' as unknown as T)
			case 'WALLET_SUBMIT_TX':
				return Promise.resolve(`mock_tx_hash_${Date.now()}` as unknown as T)
			case 'WALLET_CONNECT':
				return Promise.resolve({ address: m.address, networkId: m.networkId } as unknown as T)
			case 'WALLET_PING':
				return Promise.resolve({
					version: '0.1.0-mock',
					isConnected: true,
					address: m.address,
					networkId: m.networkId,
					supportedMethods: m.supportedMethods ?? [
						'WALLET_GET_ADDRESS',
						'WALLET_GET_NETWORK',
						'WALLET_GET_BALANCE',
						'WALLET_GET_UTXOS',
						'WALLET_GET_COLLATERAL',
						'WALLET_GET_REWARD_ADDRESSES',
						'WALLET_GET_USED_ADDRESSES',
						'WALLET_SIGN_DATA',
						'WALLET_SIGN_TX',
						'WALLET_SUBMIT_TX',
						'WALLET_CONNECT',
						'WALLET_PING',
						'WALLET_BATCH_REQUEST',
						'HOST_STORAGE_GET',
						'HOST_STORAGE_SET',
						'HOST_STORAGE_REMOVE',
						'GAME_READY',
						'GET_CONTEXT',
						'REQUEST_FULLSCREEN',
						'EXIT_GAME',
						'SET_ORIENTATION',
						'TRIGGER_HAPTIC'
					]
				} as unknown as T)
			case 'HOST_STORAGE_GET':
				return Promise.resolve((this.mockStorage.get((request as any).key) ?? null) as unknown as T)
			case 'HOST_STORAGE_SET':
				this.mockStorage.set((request as any).key, (request as any).value)
				return Promise.resolve(true as unknown as T)
			case 'HOST_STORAGE_REMOVE':
				this.mockStorage.delete((request as any).key)
				return Promise.resolve(true as unknown as T)
			case 'WALLET_BATCH_REQUEST': {
				const reqs = ((request as any).requests ?? []) as WalletRequestPayload[]
				return Promise.all(reqs.map(r => this.handleMockRequest(r))) as unknown as Promise<T>
			}
			case 'GAME_READY':
			case 'REQUEST_FULLSCREEN':
			case 'EXIT_GAME':
			case 'SET_ORIENTATION':
			case 'TRIGGER_HAPTIC':
				return Promise.resolve(true as unknown as T)
			case 'GET_CONTEXT':
				return Promise.resolve({
					theme: 'dark',
					locale: 'vi',
					device: 'desktop',
					appCenterOrigin: 'http://localhost:3000',
					...m.context
				} as unknown as T)
			default:
				return Promise.resolve(null as unknown as T)
		}
	}

	private async handleExtensionFallback<T>(request: WalletRequestPayload): Promise<T> {
		if (typeof window === 'undefined' || !(window as any).cardano) {
			throw new WalletBridgeNotInIframeError()
		}

		const cardano = (window as any).cardano
		const walletName =
			this.preferredWallet && cardano[this.preferredWallet]
				? this.preferredWallet
				: Object.keys(cardano).find(k => cardano[k] && typeof cardano[k].enable === 'function')

		if (!walletName) {
			throw new WalletBridgeError('[WalletBridgeClient] Không tìm thấy ví CIP-30 trong window.cardano.')
		}

		const api = await cardano[walletName].enable()
		if (!api) {
			throw new WalletBridgeError(`[WalletBridgeClient] Kích hoạt ví ${walletName} thất bại.`)
		}

		switch (request.type) {
			case 'WALLET_GET_ADDRESS': {
				const addrs = await api.getUsedAddresses()
				const changeAddr = await api.getChangeAddress()
				const rawAddr = changeAddr || addrs?.[0] || null
				const addr = rawAddr ? cardanoHexToBech32(rawAddr) : null
				if (addr) {
					this.currentAddress = addr
					this.isConnected = true
				}
				return addr as unknown as T
			}
			case 'WALLET_GET_NETWORK': {
				const net = await api.getNetworkId()
				this.currentNetworkId = net
				return net as unknown as T
			}
			case 'WALLET_GET_BALANCE': {
				return (await api.getBalance()) as unknown as T
			}
			case 'WALLET_GET_UTXOS': {
				return (await api.getUtxos((request as any).amount)) as unknown as T
			}
			case 'WALLET_GET_COLLATERAL': {
				return (await (api.getCollateral ? api.getCollateral((request as any).amount) : [])) as unknown as T
			}
			case 'WALLET_GET_REWARD_ADDRESSES': {
				const rawRewards = (await api.getRewardAddresses()) ?? []
				return rawRewards.map((a: string) => cardanoHexToBech32(a)) as unknown as T
			}
			case 'WALLET_GET_USED_ADDRESSES': {
				const rawAddrs = (await api.getUsedAddresses()) ?? []
				return rawAddrs.map((a: string) => cardanoHexToBech32(a)) as unknown as T
			}
			case 'WALLET_SIGN_DATA': {
				return (await api.signData((request as any).address, (request as any).hexPayload)) as unknown as T
			}
			case 'WALLET_SIGN_TX': {
				return (await api.signTx((request as any).txHex, (request as any).partialSign ?? false)) as unknown as T
			}
			case 'WALLET_SUBMIT_TX': {
				return (await api.submitTx((request as any).txHex)) as unknown as T
			}
			case 'WALLET_CONNECT': {
				const addrs = await api.getUsedAddresses()
				const changeAddr = await api.getChangeAddress()
				const rawAddr = changeAddr || addrs?.[0] || ''
				const addr = rawAddr ? cardanoHexToBech32(rawAddr) : ''
				const net = await api.getNetworkId()
				this.currentAddress = addr
				this.currentNetworkId = net
				this.isConnected = true
				this.emit('connected', { address: addr, networkId: net })
				return { address: addr, networkId: net } as unknown as T
			}
			case 'WALLET_PING': {
				return {
					version: '0.1.0-extension',
					isConnected: true,
					address: this.currentAddress,
					networkId: this.currentNetworkId
				} as unknown as T
			}
			case 'GAME_READY':
			case 'REQUEST_FULLSCREEN':
			case 'EXIT_GAME':
			case 'SET_ORIENTATION':
			case 'TRIGGER_HAPTIC':
				return true as unknown as T
			case 'WALLET_BATCH_REQUEST': {
				const reqs = ((request as any).requests ?? []) as WalletRequestPayload[]
				const results: unknown[] = []
				for (const req of reqs) {
					try {
						const res = await this.handleExtensionFallback(req)
						results.push(res)
					} catch {
						results.push(null)
					}
				}
				return results as unknown as T
			}
			case 'GET_CONTEXT':
				return {
					theme: 'dark',
					locale: 'vi',
					device: 'desktop',
					appCenterOrigin: window.location.origin
				} as unknown as T
			default:
				return null as unknown as T
		}
	}

	// ─── API Methods (CIP-30 & Extension Compatible) ─────────────────────────

	/**
	 * Yêu cầu Host mở modal kết nối ví (dành cho nút "Connect Wallet" trong Game UI)
	 */
	public async requestConnect(options?: SendRequestOptions): Promise<{ address: string; networkId: number } | null> {
		return this.sendRequest<{ address: string; networkId: number } | null>({
			type: 'WALLET_CONNECT'
		}, options)
	}

	/**
	 * Gửi ping kiểm tra trạng thái, phiên bản và các methods mà Host Bridge hỗ trợ
	 */
	public async ping(options?: SendRequestOptions): Promise<{
		version: string
		isConnected: boolean
		address?: string | null
		networkId?: number | null
		supportedMethods?: string[]
	} | null> {
		return this.sendRequest({ type: 'WALLET_PING' }, options)
	}

	/**
	 * Lấy địa chỉ ví Bech32 đang kết nối từ App Center
	 */
	public async getChangeAddress(options?: SendRequestOptions): Promise<string | null> {
		return this.sendRequest<string | null>({ type: 'WALLET_GET_ADDRESS' }, options)
	}

	/**
	 * Lấy danh sách địa chỉ đã sử dụng (CIP-30)
	 */
	public async getUsedAddresses(options?: SendRequestOptions): Promise<string[] | null> {
		return this.sendRequest<string[] | null>({ type: 'WALLET_GET_USED_ADDRESSES' }, options)
	}

	/**
	 * Lấy danh sách địa chỉ stake/reward (Bech32 `stake1...`) dùng để định danh tài khoản game
	 */
	public async getRewardAddresses(options?: SendRequestOptions): Promise<string[] | null> {
		return this.sendRequest<string[] | null>({ type: 'WALLET_GET_REWARD_ADDRESSES' }, options)
	}

	/**
	 * Lấy tổng số dư tài khoản dưới dạng CBOR hex của Value (Lovelace + Token native)
	 */
	public async getBalance(options?: SendRequestOptions): Promise<string | null> {
		return this.sendRequest<string | null>({ type: 'WALLET_GET_BALANCE' }, options)
	}

	/**
	 * Lấy danh sách Collateral UTxOs (bắt buộc khi tương tác Plutus contracts & Hydra Head)
	 */
	public async getCollateral(amount?: string, options?: SendRequestOptions): Promise<unknown[] | null> {
		return this.sendRequest<unknown[] | null>({
			type: 'WALLET_GET_COLLATERAL',
			amount
		}, options)
	}

	/**
	 * Yêu cầu ký challenge qua CIP-30 / CIP-8 để lấy JWT Token
	 */
	public async signData(address: string, hexPayload: string, options?: SendRequestOptions): Promise<{ signature: string; key: string } | null> {
		return this.sendRequest<{ signature: string; key: string } | null>({
			type: 'WALLET_SIGN_DATA',
			address,
			hexPayload
		}, options)
	}

	/**
	 * Yêu cầu ký Cardano Transaction (on-chain tx / nạp rút / Hydra commit)
	 */
	public async signTx(txHex: string, partialSign = false, options?: SendRequestOptions): Promise<string | null> {
		return this.sendRequest<string | null>({
			type: 'WALLET_SIGN_TX',
			txHex,
			partialSign
		}, options)
	}

	/**
	 * Lấy danh sách UTxOs của ví
	 */
	public async getUtxos(amount?: string, options?: SendRequestOptions): Promise<unknown[] | null> {
		return this.sendRequest<unknown[] | null>({
			type: 'WALLET_GET_UTXOS',
			amount
		}, options)
	}

	/**
	 * Lấy Network ID hiện tại (0 = Preprod/Preview, 1 = Mainnet)
	 */
	public async getNetworkId(options?: SendRequestOptions): Promise<number | null> {
		return this.sendRequest<number | null>({ type: 'WALLET_GET_NETWORK' }, options)
	}

	/**
	 * Gửi (submit/broadcast) Cardano Transaction đã ký lên chain L1
	 */
	public async submitTx(txHex: string, options?: SendRequestOptions): Promise<string | null> {
		return this.sendRequest<string | null>({
			type: 'WALLET_SUBMIT_TX',
			txHex
		}, options)
	}

	/**
	 * Gửi một mảng batch nhiều requests RPC trong 1 postMessage duy nhất
	 */
	public async batch(requests: WalletRequestPayload[], options?: SendRequestOptions): Promise<unknown[]> {
		return this.sendRequest<unknown[]>({
			type: 'WALLET_BATCH_REQUEST',
			requests
		}, options)
	}

	// ─── Host Storage Relay Methods ──────────────────────────────────────────

	public async hostStorageGet(key: string, options?: SendRequestOptions): Promise<string | null> {
		return this.sendRequest<string | null>({
			type: 'HOST_STORAGE_GET',
			key
		}, options)
	}

	public async hostStorageSet(key: string, value: string, options?: SendRequestOptions): Promise<boolean> {
		return this.sendRequest<boolean>({
			type: 'HOST_STORAGE_SET',
			key,
			value
		}, options)
	}

	public async hostStorageRemove(key: string, options?: SendRequestOptions): Promise<boolean> {
		return this.sendRequest<boolean>({
			type: 'HOST_STORAGE_REMOVE',
			key
		}, options)
	}

	// ─── Event Emitter Helper ────────────────────────────────────────────────

	public on<K extends keyof WalletBridgeEventMap>(event: K, handler: WalletBridgeEventMap[K]): void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, new Set())
		}
		this.eventListeners.get(event)!.add(handler)
	}

	public off<K extends keyof WalletBridgeEventMap>(event: K, handler: WalletBridgeEventMap[K]): void {
		const handlers = this.eventListeners.get(event)
		if (handlers) {
			handlers.delete(handler)
		}
	}

	private emit<K extends keyof WalletBridgeEventMap>(event: K, ...args: Parameters<WalletBridgeEventMap[K]>): void {
		const handlers = this.eventListeners.get(event)
		if (handlers) {
			for (const handler of handlers) {
				try {
					;(handler as any)(...args)
				} catch (err) {
					console.error(`[WalletBridgeClient] Lỗi thực thi event handler "${event}":`, err)
				}
			}
		}
	}

	private generateUuid(): string {
		if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
			return crypto.randomUUID()
		}
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
			const r = (Math.random() * 16) | 0
			const v = c === 'x' ? r : (r & 0x3) | 0x8
			return v.toString(16)
		})
	}

	public destroy(): void {
		this.isDestroyed = true
		if (typeof window !== 'undefined') {
			window.removeEventListener('message', this.handleWindowMessage)
		}
		for (const pending of this.pendingRequests.values()) {
			clearTimeout(pending.timer)
			pending.reject(new WalletBridgeError('[WalletBridgeClient] Client instance đã bị hủy.'))
		}
		this.pendingRequests.clear()
		this.eventListeners.clear()
	}
}

export { WalletBridgeClient as GameBridgeClient }
