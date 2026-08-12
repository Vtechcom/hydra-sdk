import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import type { UTxO } from '@hydra-sdk/core'

/**
 * Encode resolved UTxOs as the CBOR `Map[TransactionInput, TransactionOutput]`
 * the Scalus oracle expects. CSL has no direct UTxO-map serializer, but CBOR is
 * a concatenation of items after the map header, and `TransactionInput.to_bytes`
 * / `TransactionOutput.to_bytes` each emit a valid CBOR item — so a map header
 * followed by alternating key/value bytes is a valid CBOR map.
 *
 * Only covers simple (address + lovelace) outputs, which is all the differential
 * SPEND fixture needs. Datum/multi-asset outputs are out of scope for the V1
 * oracle fixture.
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
		const output = CardanoWASM.TransactionOutput.new(
			CardanoWASM.Address.from_bech32(utxo.output.address),
			CardanoWASM.Value.new(CardanoWASM.BigNum.from_str(lovelace))
		)
		parts.push(input.to_bytes(), output.to_bytes())
		input.free()
		output.free()
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
