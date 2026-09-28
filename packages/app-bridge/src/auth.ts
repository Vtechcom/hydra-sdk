import type { WalletBridgeClient } from './client'
import { WalletBridgeError } from './errors'
import { toHexPayload, isJwtExpired, decodeJwtPayload } from './utils'

export interface GameAuthEndpoints<TUser = any> {
	/** Hàm gọi API backend của Game để lấy chuỗi nonce / challenge ngẫu nhiên */
	getChallenge: (address: string) => Promise<string>
	/** Hàm gọi API backend của Game để verify chữ ký và nhận JWT token */
	verifySignature: (params: { address: string; signature: string; key: string }) => Promise<{
		token: string
		user?: TUser
	}>
	/** Hàm kiểm tra tính hợp lệ của token hiện tại (tùy chọn) */
	getMe?: (token: string) => Promise<TUser | null>
}

export interface GameAuthConfig<TUser = any> {
	client: WalletBridgeClient
	endpoints: GameAuthEndpoints<TUser>
	/** Key lưu token trong DualStorage (mặc định: 'game_access_token') */
	tokenStorageKey?: string
	/** Tự động xóa token và re-auth khi người dùng đổi ví (mặc định: true) */
	autoResetOnAccountChange?: boolean
	/** Tự động kiểm tra thời hạn hết hạn của JWT token (mặc định: true) */
	checkJwtExpiry?: boolean
}

export interface GameLoginResult<TUser = any> {
	token: string
	user?: TUser
	address: string
}

/**
 * Trình hỗ trợ xác thực Web3 chuẩn hóa cho Game (1-Click Login Flow)
 * Tự động hóa quy trình: Lấy address -> Lấy challenge -> signData -> verify -> lưu token an toàn trong DualStorage.
 */
export class GameAuthManager<TUser = any> {
	private client: WalletBridgeClient
	private endpoints: GameAuthEndpoints<TUser>
	private tokenStorageKey: string
	private checkJwtExpiry: boolean
	private authListeners = new Set<(isAuthenticated: boolean, token: string | null) => void>()
	private clientUnsubscribers: (() => void)[] = []

	constructor(config: GameAuthConfig<TUser>) {
		this.client = config.client
		this.endpoints = config.endpoints
		this.tokenStorageKey = config.tokenStorageKey ?? 'game_access_token'
		this.checkJwtExpiry = config.checkJwtExpiry !== false

		if (config.autoResetOnAccountChange !== false) {
			const onAccountChange = () => {
				this.logout()
			}
			const onDisconnect = () => {
				this.logout()
			}
			this.client.on('accountChanged', onAccountChange)
			this.client.on('disconnected', onDisconnect)
			this.clientUnsubscribers.push(
				() => this.client.off('accountChanged', onAccountChange),
				() => this.client.off('disconnected', onDisconnect)
			)
		}
	}

	/**
	 * Thực hiện toàn bộ quy trình đăng nhập Web3 CIP-8 và lưu trữ JWT token
	 */
	public async login(): Promise<GameLoginResult<TUser>> {
		// 1. Lấy địa chỉ ví hiện tại
		let address = this.client.currentAddress
		if (!address) {
			address = await this.client.getChangeAddress()
		}
		if (!address) {
			// Thử kích hoạt modal kết nối ví
			const connectRes = await this.client.requestConnect()
			address = connectRes?.address ?? null
		}
		if (!address) {
			throw new WalletBridgeError('[GameAuth] Không tìm thấy địa chỉ ví đang kết nối để đăng nhập.')
		}

		// 2. Lấy challenge từ Game Backend
		const challenge = await this.endpoints.getChallenge(address)
		if (!challenge) {
			throw new WalletBridgeError('[GameAuth] Lấy challenge từ backend thất bại.')
		}

		// 3. Chuẩn hóa payload sang Hex chuẩn CIP-30 / CIP-8
		const hexPayload = toHexPayload(challenge)

		// 4. Ký challenge qua Bridge Host
		const signResult = await this.client.signData(address, hexPayload)
		if (!signResult) {
			throw new WalletBridgeError('[GameAuth] Ký challenge thất bại hoặc bị người dùng từ chối.')
		}

		// 5. Verify chữ ký với Game Backend
		const verifyRes = await this.endpoints.verifySignature({
			address,
			signature: signResult.signature,
			key: signResult.key
		})

		if (!verifyRes?.token) {
			throw new WalletBridgeError('[GameAuth] Xác thực chữ ký với backend thất bại.')
		}

		// 6. Lưu token an toàn vào DualStorage và đồng bộ Host Storage Relay (chống Safari ITP)
		await this.client.storage.setItemAsync(this.tokenStorageKey, verifyRes.token)

		this.notifyAuthChange(true, verifyRes.token)

		return {
			token: verifyRes.token,
			user: verifyRes.user,
			address
		}
	}

	/**
	 * Lấy token hiện tại từ DualStorage (đồng bộ)
	 */
	public getToken(): string | null {
		const token = this.client.storage.getItem(this.tokenStorageKey)
		if (token && this.checkJwtExpiry && isJwtExpired(token)) {
			queueMicrotask(() => {
				if (this.client.storage.getItem(this.tokenStorageKey) === token) {
					this.logout()
				}
			})
			return null
		}
		return token
	}

	/**
	 * Lấy token hiện tại có hỗ trợ Host Storage Relay nếu Safari ITP chặn localStorage
	 */
	public async getTokenAsync(): Promise<string | null> {
		let token = this.getToken()
		if (!token) {
			token = await this.client.storage.getItemAsync(this.tokenStorageKey)
			if (token && this.checkJwtExpiry && isJwtExpired(token)) {
				this.logout()
				return null
			}
		}
		return token
	}

	/**
	 * Lấy dữ liệu payload decode từ JWT token hiện tại
	 */
	public getJwtPayload<TPayload = any>(): TPayload | null {
		const token = this.getToken()
		if (!token) return null
		return decodeJwtPayload<TPayload>(token)
	}

	/**
	 * Kiểm tra xem người dùng hiện tại đã có token đăng nhập hợp lệ hay chưa
	 */
	public isAuthenticated(checkExpiry = true): boolean {
		const token = this.client.storage.getItem(this.tokenStorageKey)
		if (!token) return false
		if (checkExpiry && this.checkJwtExpiry && isJwtExpired(token)) {
			queueMicrotask(() => {
				if (this.client.storage.getItem(this.tokenStorageKey) === token) {
					this.logout()
				}
			})
			return false
		}
		return true
	}

	/**
	 * Đăng xuất và xóa token khỏi DualStorage
	 */
	public logout(): void {
		const hadToken = Boolean(this.client.storage.getItem(this.tokenStorageKey))
		this.client.storage.removeItem(this.tokenStorageKey)
		this.client.storage.removeItemAsync(this.tokenStorageKey).catch(() => {})
		if (hadToken) {
			this.notifyAuthChange(false, null)
		}
	}

	/**
	 * Đăng ký lắng nghe sự kiện thay đổi trạng thái đăng nhập
	 */
	public onAuthChange(callback: (isAuthenticated: boolean, token: string | null) => void): () => void {
		this.authListeners.add(callback)
		return () => {
			this.authListeners.delete(callback)
		}
	}

	private notifyAuthChange(isAuthenticated: boolean, token: string | null) {
		for (const listener of this.authListeners) {
			try {
				listener(isAuthenticated, token)
			} catch (err) {
				console.error('[GameAuth] Lỗi trong auth listener:', err)
			}
		}
	}

	/**
	 * Hủy đăng ký toàn bộ listeners đã gắn vào Client và xóa danh sách callback
	 */
	public destroy(): void {
		for (const unsub of this.clientUnsubscribers) {
			unsub()
		}
		this.clientUnsubscribers = []
		this.authListeners.clear()
	}
}

/**
 * Factory helper tạo nhanh instance GameAuthManager
 */
export function createGameAuth<TUser = any>(config: GameAuthConfig<TUser>): GameAuthManager<TUser> {
	return new GameAuthManager<TUser>(config)
}

