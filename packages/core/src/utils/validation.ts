import { convertTxOutputToWasm } from './cardano-wasm/converter'
import { TxOutput } from '../types/cardano'

/**
 * Check whether a {@link TxOutput} can be converted into a valid on-chain output.
 * @param output The transaction output to validate
 * @returns `true` if the output serializes without error
 */
export const isValidTxOutput = (output: TxOutput): boolean => {
	try {
		const wasmOutput = convertTxOutputToWasm(output)
		return wasmOutput.to_hex() ? true : false
	} catch (e) {
		return false
	}
}
