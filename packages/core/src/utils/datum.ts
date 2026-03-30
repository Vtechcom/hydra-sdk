import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { hexToBytes } from './parser'

export const mkInt = (n: string | number | bigint) =>
	CardanoWASM.PlutusData.new_integer(
		typeof n === 'bigint'
			? CardanoWASM.BigInt.from_str(n.toString()) // bigint
			: CardanoWASM.BigInt.from_str(String(n)) // string | number
	)
/**
 * Create a PlutusData object from a hex string representing bytes
 * @param hex The hex string representing the bytes
 * @returns A PlutusData object
 * @example
 * ```
 * mkBytes(ParserUtils.stringToHex('Hello World!'))
 * => PlutusData object representing the bytes "Hello World!"
 * ```
 */
export const mkBytes = (hex: string) => CardanoWASM.PlutusData.new_bytes(hexToBytes(hex))

export const mkConstr = (alt: number, fields: CardanoWASM.PlutusData[]) => {
	const list = CardanoWASM.PlutusList.new()
	fields.forEach(f => list.add(f))
	const constr = CardanoWASM.ConstrPlutusData.new(CardanoWASM.BigNum.from_str(String(alt)), list)
	return CardanoWASM.PlutusData.new_constr_plutus_data(constr)
}

export const mkMap = (entries: Array<[CardanoWASM.PlutusData, CardanoWASM.PlutusMapValues]>) => {
	const m = CardanoWASM.PlutusMap.new()
	entries.forEach(([k, v]) => m.insert(k, v))
	return CardanoWASM.PlutusData.new_map(m)
}

export const mkList = (elements: CardanoWASM.PlutusData[]) => {
	const list = CardanoWASM.PlutusList.new()
	elements.forEach(e => list.add(e))
	return CardanoWASM.PlutusData.new_list(list)
}

export const DatumSchema = {
	/**
	 * ScriptDataJsonNoSchema in cardano-node.
	 *
	 * This is the format used by --script-data-value in cardano-cli
	 * This tries to accept most JSON but does not support the full spectrum of Plutus datums.
	 * From JSON:
	 * * null/true/false/floats NOT supported
	 * * strings starting with 0x are treated as hex bytes. All other strings are encoded as their utf8 bytes.
	 * To JSON:
	 * * ConstrPlutusData not supported in ANY FORM (neither keys nor values)
	 * * Lists not supported in keys
	 * * Maps not supported in keys
	 */
	Basic: CardanoWASM.PlutusDatumSchema.BasicConversions,
	/**
	 * ScriptDataJsonDetailedSchema in cardano-node.
	 *
	 * This is the format used by --script-data-file in cardano-cli
	 * This covers almost all (only minor exceptions) Plutus datums, but the JSON must conform to a strict schema.
	 * The schema specifies that ALL keys and ALL values must be contained in a JSON map with 2 cases:
	 * 1. For ConstrPlutusData there must be two fields "constructor" contianing a number and "fields" containing its fields
	 *    e.g. { "constructor": 2, "fields": [{"int": 2}, {"list": [{"bytes": "CAFEF00D"}]}]}
	 * 2. For all other cases there must be only one field named "int", "bytes", "list" or "map"
	 *    Integer's value is a JSON number e.g. {"int": 100}
	 *    Bytes' value is a hex string representing the bytes WITHOUT any prefix e.g. {"bytes": "CAFEF00D"}
	 *    Lists' value is a JSON list of its elements encoded via the same schema e.g. {"list": [{"bytes": "CAFEF00D"}]}
	 *    Maps' value is a JSON list of objects, one for each key-value pair in the map, with keys "k" and "v"
	 *          respectively with their values being the plutus datum encoded via this same schema
	 *          e.g. {"map": [
	 *              {"k": {"int": 2}, "v": {"int": 5}},
	 *              {"k": {"map": [{"k": {"list": [{"int": 1}]}, "v": {"bytes": "FF03"}}]}, "v": {"list": []}}
	 *          ]}
	 * From JSON:
	 * * null/true/false/floats NOT supported
	 * * the JSON must conform to a very specific schema
	 * To JSON:
	 * * all Plutus datums should be fully supported outside of the integer range limitations outlined above.
	 */
	Detailed: CardanoWASM.PlutusDatumSchema.DetailedSchema
}
