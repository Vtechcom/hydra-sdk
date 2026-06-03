import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

/**
 *
 * @param cborHex Transaction CBOR hex
 * @returns Transaction Hash in Hex
 */
export const resolveTxHash = (cborHex: string) => {
	const tx = CardanoWASM.FixedTransaction.from_hex(cborHex)
	const hash = tx.transaction_hash().to_hex()
	tx.free()
	return hash
}

export const resolveTxBodyHash = (txBody: CardanoWASM.TransactionBody) => {
	const tx = CardanoWASM.FixedTransaction.new_from_body_bytes(txBody.to_bytes())
	return tx.transaction_hash()
}
