import CardanoWASM from '.'

export const deserializeTx = (txCborHex: string): CardanoWASM.FixedTransaction => {
	return CardanoWASM.FixedTransaction.from_bytes(Buffer.from(txCborHex, 'hex'))
}

export const deserializeAssetUnit = (assetUnit: string): { policyId: string; assetName: string } => {
	const policyId = assetUnit.substring(0, 56)
	const assetName = assetUnit.substring(56)
	return { policyId, assetName }
}
