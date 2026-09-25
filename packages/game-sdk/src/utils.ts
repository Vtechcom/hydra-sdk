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

/**
 * Format rút gọn địa chỉ Bech32 hiển thị trên giao diện Game (ví dụ: addr_test1...xyz123)
 */
export function formatShortAddress(address: string | null | undefined, lead = 8, tail = 6): string {
	if (!address) return ''
	if (address.length <= lead + tail + 3) return address
	return `${address.slice(0, lead)}...${address.slice(-tail)}`
}
