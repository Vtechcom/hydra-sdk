import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import type { UTxO } from '@hydra-sdk/core'

/**
 * Encode resolved UTxOs as the CBOR `Map[TransactionInput, TransactionOutput]`
 * the Scalus oracle expects. CSL has no direct UTxO-map serializer, but CBOR is
 * a concatenation of items after the map header, and `TransactionInput.to_bytes`
 * / `TransactionOutput.to_bytes` each emit a valid CBOR item — so a map header
 * followed by alternating key/value bytes is a valid CBOR map.
 *
 * Covers address + lovelace outputs, plus a datum hash (V1/V2 script outputs).
 * Inline datum, multi-asset and reference-script outputs are out of scope.
 */
export const utxosToCborMap = (utxos: UTxO[]): Uint8Array => {
	if (utxos.length >= 24) throw new Error('utxosToCborMap: only <24 entries supported (fixture helper)')
	const parts: Uint8Array[] = [Uint8Array.of(0xa0 | utxos.length)]

	for (const utxo of utxos) {
		const input = CardanoWASM.TransactionInput.new(
			CardanoWASM.TransactionHash.from_hex(utxo.input.txHash),
			utxo.input.outputIndex
		)
		const lovelace = utxo.output.amount.find(a => a.unit === 'lovelace')?.quantity ?? '0'
		const address = CardanoWASM.Address.from_bech32(utxo.output.address)
		const coin = CardanoWASM.BigNum.from_str(lovelace)
		const value = CardanoWASM.Value.new(coin)
		const output = CardanoWASM.TransactionOutput.new(address, value)
		if (utxo.output.datumHash) {
			const dataHash = CardanoWASM.DataHash.from_hex(utxo.output.datumHash)
			output.set_data_hash(dataHash)
			dataHash.free()
		}
		parts.push(input.to_bytes(), output.to_bytes())
		for (const o of [input, output, value, coin, address]) o.free()
	}

	const total = parts.reduce((n, p) => n + p.length, 0)
	const out = new Uint8Array(total)
	let offset = 0
	for (const p of parts) {
		out.set(p, offset)
		offset += p.length
	}
	return out
}
