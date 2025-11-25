import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { isValidAddress } from './validator.util'

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
