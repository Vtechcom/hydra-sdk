import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

/**
 * Converts various metadata types to a CardanoWASM.TransactionMetadatum.
 *
 * Note:
 * - Maximum metadata `bytes` size is `64`
 * - Maximum metadata `text` size is `64`
 *
 * @param metadata The metadata to convert.
 * @returns The converted TransactionMetadatum.
 */
export const metadataObjToMetadatum = (
	metadata: string | bigint | number | Uint8Array | Array<any> | Map<any, any> | Object
): CardanoWASM.TransactionMetadatum => {
	if (typeof metadata === 'bigint') {
		return CardanoWASM.TransactionMetadatum.new_int(CardanoWASM.Int.from_str(metadata.toString()))
	} else if (typeof metadata === 'string') {
		return CardanoWASM.TransactionMetadatum.new_text(metadata)
	} else if (typeof metadata === 'number') {
		return CardanoWASM.TransactionMetadatum.new_int(CardanoWASM.Int.from_str(metadata.toString()))
	} else if (metadata instanceof Uint8Array) {
		return CardanoWASM.TransactionMetadatum.new_bytes(metadata)
	} else if (Array.isArray(metadata)) {
		// Recursively process each element in the array
		const array = CardanoWASM.MetadataList.new()
		metadata.forEach(item => {
			array.add(metadataObjToMetadatum(item))
		})
		return CardanoWASM.TransactionMetadatum.new_list(array)
	} else if (metadata && typeof metadata === 'object') {
		// Convert to MetadatumMap recursively
		const map = CardanoWASM.MetadataMap.new()
		if (metadata instanceof Map) {
			// for Map
			metadata.forEach((value, key) => {
				map.insert(metadataObjToMetadatum(key), metadataObjToMetadatum(value))
			})
		} else {
			// for Object
			Object.entries(metadata).forEach(([key, value]) => {
				map.insert(metadataObjToMetadatum(key), metadataObjToMetadatum(value))
			})
		}
		return CardanoWASM.TransactionMetadatum.new_map(map)
	} else {
		throw new Error('Metadatum conversion: Unsupported metadata type')
	}
}
