/**
 * Dual Storage Pattern — Khắc phục triệt để hiện tượng Safari ITP / Storage Partitioning
 * trong cross-origin iframes.
 *
 * - Tự động kiểm tra tính khả dụng của window.localStorage. Nếu trình duyệt chặn (như Safari trên iOS),
 *   sẽ tự động chuyển sang lưu trữ an toàn trong RAM (In-Memory Map) mà không ném lỗi hay làm crash dApp.
 * - Hỗ trợ Key Prefixing để cô lập dữ liệu, tránh xung đột và tuyệt đối KHÔNG xóa nhầm dữ liệu khác của Game
 *   khi gọi clear().
 */
export interface StorageHostRelay {
	hostStorageGet(key: string): Promise<string | null>
	hostStorageSet(key: string, value: string): Promise<boolean>
	hostStorageRemove(key: string): Promise<boolean>
}

export interface DualStorageOptions {
	prefix?: string
	debug?: boolean
	hostRelay?: StorageHostRelay
}

export class DualStorage {
	private inMemoryStore = new Map<string, string>()
	private knownKeys = new Set<string>()
	private isLocalStorageAvailable = false
	private prefix: string
	private debug = false
	private hostRelay?: StorageHostRelay

	constructor(options: DualStorageOptions | boolean = false) {
		if (typeof options === 'boolean') {
			this.debug = options
			this.prefix = 'hydra:'
		} else {
			this.debug = !!options.debug
			this.prefix = options.prefix ?? 'hydra:'
			this.hostRelay = options.hostRelay
		}
		this.isLocalStorageAvailable = this.checkStorageAvailability()
	}

	public setHostRelay(relay: StorageHostRelay): void {
		this.hostRelay = relay
	}

	private checkStorageAvailability(): boolean {
		if (typeof window === 'undefined') return false

		try {
			if (!window.localStorage) return false
			const testKey = `__${this.prefix}test__`
			window.localStorage.setItem(testKey, '1')
			window.localStorage.removeItem(testKey)
			return true
		} catch (err) {
			if (this.debug) {
				console.warn(
					'[DualStorage] localStorage bị chặn hoặc không khả dụng trong iframe (Safari ITP / Sandbox). Sử dụng In-Memory Fallback.',
					err
				)
			}
			return false
		}
	}

	private getStorageKey(key: string): string {
		return key.startsWith(this.prefix) ? key : `${this.prefix}${key}`
	}

	public getItem(key: string): string | null {
		// 1. Thử đọc từ localStorage nếu có
		if (this.isLocalStorageAvailable && typeof window !== 'undefined' && window.localStorage) {
			try {
				const val = window.localStorage.getItem(this.getStorageKey(key))
				if (val !== null) return val
			} catch {
				// Fallback to memory if unexpected read error
			}
		}
		// 2. Fallback sang In-Memory Store
		return this.inMemoryStore.get(key) ?? null
	}

	public setItem(key: string, value: string): void {
		// Luôn lưu bản sao vào memory để đảm bảo session không mất
		this.inMemoryStore.set(key, value)
		this.knownKeys.add(key)

		if (this.isLocalStorageAvailable && typeof window !== 'undefined' && window.localStorage) {
			try {
				window.localStorage.setItem(this.getStorageKey(key), value)
			} catch (err) {
				if (this.debug) {
					console.warn(`[DualStorage] Lỗi ghi localStorage cho key "${key}". Giữ giá trị an toàn trong RAM.`, err)
				}
			}
		}
	}

	public removeItem(key: string): void {
		this.inMemoryStore.delete(key)
		this.knownKeys.delete(key)
		if (this.isLocalStorageAvailable && typeof window !== 'undefined' && window.localStorage) {
			try {
				window.localStorage.removeItem(this.getStorageKey(key))
			} catch {
				// Ignore
			}
		}
	}

	public hasItem(key: string): boolean {
		return this.getItem(key) !== null
	}

	/**
	 * Chỉ xóa sạch các key thuộc về tiền tố (prefix) của package,
	 * tuyệt đối không xóa dữ liệu khác trong localStorage của Game origin.
	 */
	public clear(): void {
		this.inMemoryStore.clear()

		if (this.isLocalStorageAvailable && typeof window !== 'undefined' && window.localStorage) {
			try {
				const keysToRemove = new Set<string>()

				// 1. Thêm các key đã set qua instance
				for (const k of this.knownKeys) {
					keysToRemove.add(this.getStorageKey(k))
				}
				this.knownKeys.clear()

				// 2. Quét qua toàn bộ localStorage qua length/key(i) hoặc Object.keys
				if (typeof window.localStorage.length === 'number') {
					for (let i = 0; i < window.localStorage.length; i++) {
						const k = window.localStorage.key?.(i)
						if (k && k.startsWith(this.prefix)) {
							keysToRemove.add(k)
						}
					}
				}

				const objKeys = Object.keys(window.localStorage)
				for (const k of objKeys) {
					if (k && k.startsWith(this.prefix)) {
						keysToRemove.add(k)
					}
				}

				// 3. Tiến hành xóa an toàn
				for (const k of keysToRemove) {
					window.localStorage.removeItem(k)
				}
			} catch {
				// Ignore
			}
		}
	}

	/**
	 * Đọc giá trị JSON đã parse, trả về defaultValue nếu không có hoặc parse lỗi
	 */
	public getJSON<T>(key: string, defaultValue?: T): T | null {
		const raw = this.getItem(key)
		if (raw === null) return defaultValue ?? null
		try {
			return JSON.parse(raw) as T
		} catch {
			return defaultValue ?? null
		}
	}

	/**
	 * Lưu object dưới dạng JSON string
	 */
	public setJSON(key: string, value: any): void {
		try {
			this.setItem(key, JSON.stringify(value))
		} catch (err) {
			if (this.debug) {
				console.warn(`[DualStorage] Lỗi JSON.stringify cho key "${key}":`, err)
			}
		}
	}

	public isUsingMemoryFallback(): boolean {
		return !this.isLocalStorageAvailable
	}

	/**
	 * Đọc giá trị với cơ chế Host Storage Relay:
	 * Nếu local/in-memory không có và môi trường bị chặn do Safari ITP,
	 * sẽ truy vấn lên App Center Host để lấy dữ liệu đã lưu hộ.
	 */
	public async getItemAsync(key: string): Promise<string | null> {
		const localVal = this.getItem(key)
		if (localVal !== null) return localVal

		if (this.hostRelay) {
			try {
				const remoteVal = await this.hostRelay.hostStorageGet(this.getStorageKey(key))
				if (remoteVal !== null) {
					this.inMemoryStore.set(key, remoteVal)
					this.knownKeys.add(key)
					return remoteVal
				}
			} catch (err) {
				if (this.debug) {
					console.warn(`[DualStorage] Lỗi getItemAsync từ Host cho key "${key}":`, err)
				}
			}
		}

		return null
	}

	/**
	 * Ghi giá trị đồng bộ và đồng thời đồng bộ bất đồng bộ lên Host nếu có Host Relay
	 */
	public async setItemAsync(key: string, value: string, options?: { throwOnError?: boolean }): Promise<void> {
		this.setItem(key, value)
		if (this.hostRelay) {
			try {
				await this.hostRelay.hostStorageSet(this.getStorageKey(key), value)
			} catch (err) {
				console.warn(`[DualStorage] Lỗi setItemAsync lên Host cho key "${key}":`, err)
				if (options?.throwOnError) {
					throw err
				}
			}
		}
	}

	/**
	 * Xóa giá trị đồng bộ và đồng thời xóa trên Host nếu có Host Relay
	 */
	public async removeItemAsync(key: string, options?: { throwOnError?: boolean }): Promise<void> {
		this.removeItem(key)
		if (this.hostRelay) {
			try {
				await this.hostRelay.hostStorageRemove(this.getStorageKey(key))
			} catch (err) {
				console.warn(`[DualStorage] Lỗi removeItemAsync trên Host cho key "${key}":`, err)
				if (options?.throwOnError) {
					throw err
				}
			}
		}
	}
}
