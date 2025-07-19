import CardanoWASM from '.'

/**
 *
 * @param cborHex Transaction CBOR hex
 * @returns Transaction Hash in Hex
 */
export const resolveTxHash = (cborHex: string) => {
  return CardanoWASM.FixedTransaction.from_hex(cborHex).transaction_hash().to_hex()
}

export const resolveTxBodyHash = (txBody: CardanoWASM.TransactionBody) => {
  const tx = CardanoWASM.FixedTransaction.new_from_body_bytes(txBody.to_bytes())
  return tx.transaction_hash()
}
