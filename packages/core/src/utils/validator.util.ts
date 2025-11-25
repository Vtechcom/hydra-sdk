import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { Converter, TxOutput } from '..'

export const isValidAddress = (address: string | Uint8Array, type: 'bech32' | 'hex' | 'bytes' = 'bech32'): boolean => {
	// Further validation can be added here based on specific address formats
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

export const isValidTxOutput = (output: TxOutput): boolean => {
	try {
		const wasmOutput = Converter.convertTxOutputToWasm(output)
		return wasmOutput.to_hex() ? true : false
	} catch (e) {
		return false
	}
}
