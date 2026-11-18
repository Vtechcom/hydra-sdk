import type { UTxO } from '@hydra-sdk/core'

/** A `PlutusData` WASM object, or a value that is already CBOR hex. */
type PlutusLike = { to_hex(): string } | string | null | undefined

export type SerializedUtxo = {
	input: { txHash: string; outputIndex: number }
	output: {
		address: string
		amount: { unit: string; quantity: string }[]
		datum?: string | null
		datumHash?: string | null
		inlineDatum?: string | null
		scriptRef?: { scriptCbor: string; version: 'V1' | 'V2' | 'V3' } | null
		scriptHash?: string | null
	}
}

/** WASM objects stringify to `{}`, so datums are written out as CBOR hex instead. */
const plutusToHex = (value: PlutusLike) => {
	if (value === undefined || value === null) return value
	return typeof value === 'string' ? value : value.to_hex()
}

/**
 * Turns an SDK `UTxO` into a plain object with the same shape, safe for `JSON.stringify`
 * and pasteable back as a `UTxO` once the datums are deserialized. Fields that are
 * `undefined` are left out.
 */
export const serializeUtxo = (utxo: UTxO): SerializedUtxo => {
	const { output } = utxo
	const fields: SerializedUtxo['output'] = {
		address: output.address,
		amount: output.amount.map(({ unit, quantity }) => ({ unit, quantity })),
		datum: plutusToHex(output.datum),
		datumHash: output.datumHash,
		inlineDatum: plutusToHex(output.inlineDatum),
		scriptRef: output.scriptRef
			? { scriptCbor: output.scriptRef.scriptCbor, version: output.scriptRef.version }
			: output.scriptRef,
		scriptHash: output.scriptHash
	}
	const definedFields = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined))

	return {
		input: { txHash: utxo.input.txHash, outputIndex: utxo.input.outputIndex },
		output: definedFields as SerializedUtxo['output']
	}
}
