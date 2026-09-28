export interface WalletAssetItem {
	unit: string
	quantity: string
}

export interface ParsedUtxoAssets {
	assets: WalletAssetItem[]
	totalLovelace: bigint
	balanceADA: number
}

/**
 * Phân tích danh sách UTxOs thành số dư ADA và danh sách token native
 * Tương thích với các định dạng UTxO của App Center Host, Blockfrost, Lucid và Mesh.
 */
export function parseUtxoAssets(utxos: unknown[] | null | undefined): ParsedUtxoAssets {
	const map = new Map<string, bigint>()

	if (Array.isArray(utxos)) {
		for (const u of utxos) {
			if (!u || typeof u !== 'object') continue

			// Dạng 1: u.output.amount (Lucid / Hydra Host)
			const amounts = (u as any).output?.amount ?? (u as any).amount

			if (Array.isArray(amounts)) {
				for (const a of amounts) {
					if (!a || typeof a !== 'object') continue
					const unit = String(a.unit || 'lovelace')
					const qty = BigInt(a.quantity || '0')
					const prev = map.get(unit) || 0n
					map.set(unit, prev + qty)
				}
			} else if (amounts && typeof amounts === 'object') {
				// Dạng 2: map { lovelace: 1000000, "policy...": 1 }
				for (const [unit, qty] of Object.entries(amounts)) {
					const prev = map.get(unit) || 0n
					try {
						map.set(unit, prev + BigInt(qty as any))
					} catch {
						// Bỏ qua giá trị không hợp lệ
					}
				}
			}
		}
	}

	const list: WalletAssetItem[] = Array.from(map.entries()).map(([unit, quantity]) => ({
		unit,
		quantity: quantity.toString()
	}))

	const totalLovelace = map.get('lovelace') || 0n
	const balanceADA = Number(totalLovelace) / 1_000_000

	return {
		assets: list,
		totalLovelace,
		balanceADA
	}
}

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

function bech32Polymod(values: number[]): number {
	let chk = 1
	for (const val of values) {
		const top = chk >> 25
		chk = ((chk & 0x1ffffff) << 5) ^ val
		if (top & 1) chk ^= 0x3b6a57b2
		if (top & 2) chk ^= 0x26508e6d
		if (top & 4) chk ^= 0x1ea119fa
		if (top & 8) chk ^= 0x3d4233dd
		if (top & 16) chk ^= 0x2a1462b3
	}
	return chk
}

function bech32HrpExpand(hrp: string): number[] {
	const ret: number[] = []
	for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) >> 5)
	ret.push(0)
	for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) & 31)
	return ret
}

function convertBits(data: Uint8Array, fromBits: number, toBits: number, pad = true): number[] | null {
	let acc = 0
	let bits = 0
	const ret: number[] = []
	const maxv = (1 << toBits) - 1
	for (const value of data) {
		if (value < 0 || value >> fromBits !== 0) return null
		acc = (acc << fromBits) | value
		bits += fromBits
		while (bits >= toBits) {
			bits -= toBits
			ret.push((acc >> bits) & maxv)
		}
	}
	if (pad) {
		if (bits > 0) ret.push((acc << (toBits - bits)) & maxv)
	} else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
		return null
	}
	return ret
}

export function encodeBech32(hrp: string, data: Uint8Array): string {
	const words = convertBits(data, 8, 5, true)
	if (!words) return ''
	const prefix = bech32HrpExpand(hrp)
	const checksum = bech32Polymod(prefix.concat(words).concat([0, 0, 0, 0, 0, 0])) ^ 1
	const chkWords: number[] = []
	for (let p = 0; p < 6; p++) {
		chkWords.push((checksum >> (5 * (5 - p))) & 31)
	}
	let result = hrp + '1'
	for (const b of words.concat(chkWords)) {
		result += BECH32_CHARSET[b]
	}
	return result
}

/**
 * Chuyển đổi địa chỉ Cardano từ chuỗi Hex CBOR sang chuẩn Bech32 (addr1... / addr_test1... / stake1...)
 */
export function cardanoHexToBech32(hex: string): string {
	if (!hex || typeof hex !== 'string') return ''
	if (hex.startsWith('addr1') || hex.startsWith('addr_test1') || hex.startsWith('stake1') || hex.startsWith('stake_test1')) {
		return hex
	}
	if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) return hex
	const bytes = new Uint8Array(hex.length / 2)
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
	}
	if (bytes.length < 1) return hex
	const header = bytes[0]
	const isTestnet = (header & 0x0f) === 0
	const type = (header & 0xf0) >> 4
	const isStake = type === 0x0e || type === 0x0f
	const hrp = isStake ? (isTestnet ? 'stake_test' : 'stake') : (isTestnet ? 'addr_test' : 'addr')
	try {
		return encodeBech32(hrp, bytes)
	} catch {
		return hex
	}
}

/**
 * Format rút gọn địa chỉ Bech32 hiển thị trên giao diện Game (ví dụ: addr_test1...xyz123)
 */
export function formatShortAddress(address: string | null | undefined, lead = 8, tail = 6): string {
	if (!address) return ''
	if (address.length <= lead + tail + 3) return address
	return `${address.slice(0, lead)}...${address.slice(-tail)}`
}

/**
 * Đảm bảo payload ký CIP-8/CIP-30 luôn ở dạng Hex UTF-8 hợp lệ.
 * Nếu payload đã là chuỗi hex (hỗ trợ prefix 0x) thì chuẩn hóa và giữ nguyên,
 * nếu là chuỗi văn bản thường thì tự động encode sang hex.
 */
export function toHexPayload(str: string, forceEncode = false): string {
	if (!str) return ''
	if (!forceEncode) {
		const clean = str.startsWith('0x') || str.startsWith('0X') ? str.slice(2) : str
		if (/^[0-9a-fA-F]+$/.test(clean) && clean.length % 2 === 0) {
			return clean
		}
	}
	if (typeof TextEncoder !== 'undefined') {
		const bytes = new TextEncoder().encode(str)
		return Array.from(bytes)
			.map(b => b.toString(16).padStart(2, '0'))
			.join('')
	}
	return typeof Buffer !== 'undefined' ? Buffer.from(str, 'utf-8').toString('hex') : str
}

/**
 * Giải mã chuỗi Hex payload thành chuỗi ký tự UTF-8 thông thường
 */
export function fromHexPayload(hex: string): string {
	if (!hex || hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) return hex
	try {
		const bytes = new Uint8Array(hex.length / 2)
		for (let i = 0; i < hex.length; i += 2) {
			bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
		}
		if (typeof TextDecoder !== 'undefined') {
			return new TextDecoder().decode(bytes)
		}
		return typeof Buffer !== 'undefined' ? Buffer.from(bytes).toString('utf-8') : hex
	} catch {
		return hex
	}
}

/**
 * Chuyển đổi số lượng Lovelace sang đơn vị ADA (1 ADA = 1,000,000 Lovelace)
 */
export function lovelaceToAda(lovelace: bigint | string | number): number {
	try {
		return Number(BigInt(lovelace)) / 1_000_000
	} catch {
		return 0
	}
}

/**
 * Chuyển đổi số lượng ADA sang đơn vị Lovelace dạng BigInt
 */
export function adaToLovelace(ada: number | string): bigint {
	const num = typeof ada === 'string' ? parseFloat(ada) : ada
	if (isNaN(num)) return 0n
	return BigInt(Math.round(num * 1_000_000))
}

/**
 * Giải mã Payload của JWT Token mà không cần thư viện ngoài
 */
export function decodeJwtPayload<T = any>(token: string): T | null {
	if (!token || typeof token !== 'string') return null
	try {
		const parts = token.split('.')
		if (parts.length < 2) return null
		const base64Url = parts[1]
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
		const pad = (4 - (base64.length % 4)) % 4
		const padded = base64 + '='.repeat(pad)
		const jsonPayload =
			typeof atob !== 'undefined'
				? decodeURIComponent(
						atob(padded)
							.split('')
							.map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
							.join('')
				  )
				: typeof Buffer !== 'undefined'
				? Buffer.from(padded, 'base64').toString('utf-8')
				: ''
		return JSON.parse(jsonPayload) as T
	} catch {
		return null
	}
}

/**
 * Kiểm tra xem JWT token đã hết hạn hay chưa (hỗ trợ độ trễ đồng hồ skewSeconds).
 * Trả về true nếu token có trường exp hợp lệ và thời gian hiện tại đã vượt quá exp.
 */
export function isJwtExpired(token: string, skewSeconds = 10): boolean {
	const payload = decodeJwtPayload<{ exp?: number }>(token)
	if (!payload || typeof payload.exp !== 'number') return false
	const nowSec = Math.floor(Date.now() / 1000)
	return payload.exp <= nowSec + skewSeconds
}
