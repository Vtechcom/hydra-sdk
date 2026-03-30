import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { stringToHex } from './parser'

const METADATA_MAX_BYTES = 64
const METADATA_MAX_TEXT_BYTES = 64

const utf8ByteLength = (str: string): number => stringToHex(str).length / 2

/**
 * Converts various metadata types to a CardanoWASM.TransactionMetadatum.
 *
 * Cardano metadata constraints:
 * - `text` fields must be ≤ 64 bytes (UTF-8 encoded)
 * - `bytes` fields must be ≤ 64 bytes
 * - `number` must be an integer (no floats)
 *
 * @param metadata The metadata value to convert.
 * @returns The converted TransactionMetadatum.
 * @throws {Error} If a string/bytes field exceeds the maximum length, or if an unsupported type is provided.
 */
export const metadataObjToMetadatum = (
	metadata: string | bigint | number | Uint8Array | Array<any> | Map<any, any> | Object
): CardanoWASM.TransactionMetadatum => {
	if (typeof metadata === 'bigint') {
		return CardanoWASM.TransactionMetadatum.new_int(CardanoWASM.Int.from_str(metadata.toString()))
	} else if (typeof metadata === 'string') {
		const byteLen = utf8ByteLength(metadata)
		if (byteLen > METADATA_MAX_TEXT_BYTES) {
			throw new Error(
				`Metadatum conversion: string exceeds maximum length of ${METADATA_MAX_TEXT_BYTES} bytes (got ${byteLen} bytes): "${metadata.slice(0, 20)}${metadata.length > 20 ? '...' : ''}"`
			)
		}
		return CardanoWASM.TransactionMetadatum.new_text(metadata)
	} else if (typeof metadata === 'number') {
		if (!Number.isInteger(metadata)) {
			throw new Error(
				`Metadatum conversion: number must be an integer, got ${metadata}`
			)
		}
		return CardanoWASM.TransactionMetadatum.new_int(CardanoWASM.Int.from_str(metadata.toString()))
	} else if (metadata instanceof Uint8Array) {
		if (metadata.byteLength > METADATA_MAX_BYTES) {
			throw new Error(
				`Metadatum conversion: bytes exceeds maximum length of ${METADATA_MAX_BYTES} bytes (got ${metadata.byteLength} bytes)`
			)
		}
		return CardanoWASM.TransactionMetadatum.new_bytes(metadata)
	} else if (Array.isArray(metadata)) {
		const array = CardanoWASM.MetadataList.new()
		metadata.forEach(item => {
			array.add(metadataObjToMetadatum(item))
		})
		return CardanoWASM.TransactionMetadatum.new_list(array)
	} else if (metadata instanceof Map) {
		const map = CardanoWASM.MetadataMap.new()
		metadata.forEach((value, key) => {
			map.insert(metadataObjToMetadatum(key), metadataObjToMetadatum(value))
		})
		return CardanoWASM.TransactionMetadatum.new_map(map)
	} else if (metadata !== null && typeof metadata === 'object') {
		const map = CardanoWASM.MetadataMap.new()
		Object.entries(metadata).forEach(([key, value]) => {
			map.insert(metadataObjToMetadatum(key), metadataObjToMetadatum(value))
		})
		return CardanoWASM.TransactionMetadatum.new_map(map)
	} else {
		throw new Error(`Metadatum conversion: Unsupported metadata type "${typeof metadata}"`)
	}
}
