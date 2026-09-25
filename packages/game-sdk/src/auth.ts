import type { WalletBridgeClient } from './client'
import { WalletBridgeError } from './errors'

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

	constructor(config: GameAuthConfig<TUser>) {
		this.client = config.client
		this.endpoints = config.endpoints
		this.tokenStorageKey = config.tokenStorageKey ?? 'game_access_token'

		if (config.autoResetOnAccountChange !== false) {
			this.client.on('accountChanged', () => {
				this.logout()
			})
			this.client.on('disconnected', () => {
				this.logout()
			})
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

		// 3. Ký challenge qua Bridge Host
		const signResult = await this.client.signData(address, challenge)
		if (!signResult) {
			throw new WalletBridgeError('[GameAuth] Ký challenge thất bại hoặc bị người dùng từ chối.')
		}

		// 4. Verify chữ ký với Game Backend
		const verifyRes = await this.endpoints.verifySignature({
			address,
			signature: signResult.signature,
			key: signResult.key
		})

		if (!verifyRes?.token) {
			throw new WalletBridgeError('[GameAuth] Xác thực chữ ký với backend thất bại.')
		}

		// 5. Lưu token an toàn vào DualStorage (chống Safari ITP)
		this.client.storage.setItem(this.tokenStorageKey, verifyRes.token)

		return {
			token: verifyRes.token,
			user: verifyRes.user,
			address
		}
	}

	/**
	 * Lấy token hiện tại từ DualStorage
	 */
	public getToken(): string | null {
		return this.client.storage.getItem(this.tokenStorageKey)
	}

	/**
	 * Kiểm tra xem người dùng hiện tại đã có token đăng nhập hay chưa
	 */
	public isAuthenticated(): boolean {
		return Boolean(this.getToken())
	}

	/**
	 * Đăng xuất và xóa token khỏi DualStorage
	 */
	public logout(): void {
		this.client.storage.removeItem(this.tokenStorageKey)
	}
}

/**
 * Factory helper tạo nhanh instance GameAuthManager
 */
export function createGameAuth<TUser = any>(config: GameAuthConfig<TUser>): GameAuthManager<TUser> {
	return new GameAuthManager<TUser>(config)
}
