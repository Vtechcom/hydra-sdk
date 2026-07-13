import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

/**
 * Check whether a value is a valid (non-malformed) Cardano address.
 * @param address The address as a bech32 string, hex string, or raw bytes
 * @param type How to interpret a string `address` (default `bech32`)
 * @returns `true` if the address parses and is not malformed
 */
export const isValidAddress = (address: string | Uint8Array, type: 'bech32' | 'hex' | 'bytes' = 'bech32'): boolean => {
	try {
		let wasmAddr: CardanoWASM.Address | null = null
		if (typeof address === 'string') {
			if (address.length === 0) return false
			if (type === 'bech32') {
				wasmAddr = CardanoWASM.Address.from_bech32(address)
			} else if (type === 'hex') {
				wasmAddr = CardanoWASM.Address.from_hex(address)
			} else {
				return false
			}
		} else if (address instanceof Uint8Array) {
			if (address.length === 0) return false
			wasmAddr = CardanoWASM.Address.from_bytes(address)
		} else {
			return false
		}
		if (!wasmAddr) return false
		return wasmAddr.is_malformed() === false
	} catch (e) {
		return false
	}
}

/**
 * Get the public key hash from a bech32 Cardano address
 * @param address A bech32 Cardano address
 * @returns The public key hash or null if invalid address
 * @example
 * ```
 * getPubkeyHashFromAddress('addr_test1qqcyprz2ye759hhge045ypk9qu35hzuerud5p2thrsdrux7ujfyg24065w5mpq76n69gzaregcaydmd8dxuheyl0ja0s57crjx')
 * => '30408c4a267d42dee8cbeb4206c507234b8b991f1b40a9771c1a3e1b'
 * ```
 */
export function getPubkeyHashFromAddress(address: string): string | null {
	try {
		if (!isValidAddress(address)) {
			return null
		}
		const wasmAddr = CardanoWASM.Address.from_bech32(address)
		const paymentCred = wasmAddr.payment_cred()?.to_keyhash()?.to_hex()
		return paymentCred || null
	} catch {
		return null
	}
}
