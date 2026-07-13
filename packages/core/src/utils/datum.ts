import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { bytesToHex, hexToBytes } from './parser'
import { NETWORK_ID } from '../constants/chain'

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

/**
 * Encode an Aiken/Plutus `Bool` as PlutusData.
 *
 * `False = Constr(0, [])`, `True = Constr(1, [])`.
 * @example mkBool(true) // => Constr(1, [])
 */
export const mkBool = (value: boolean) => mkConstr(value ? 1 : 0, [])

/**
 * Encode an `Option<a>` (a.k.a. `Maybe`) as PlutusData.
 *
 * `Some(value) = Constr(0, [value])`, `None = Constr(1, [])`.
 * @param value The wrapped PlutusData, or `null`/`undefined` for `None`
 * @example mkOption(mkInt(42)) // => Constr(0, [Int(42)])
 * @example mkOption(null) // => Constr(1, []) i.e. None
 */
export const mkOption = (value?: CardanoWASM.PlutusData | null) => (value ? mkConstr(0, [value]) : mkConstr(1, []))

/**
 * Encode a `List<ByteArray>` as a Plutus list.
 *
 * Each item may be a hex string or raw bytes.
 * @example mkBytesList(['deadbeef', new Uint8Array([1, 2])])
 */
export const mkBytesList = (items: Array<string | Uint8Array>) =>
	mkList(items.map(item => mkBytes(typeof item === 'string' ? item : bytesToHex(item))))

/**
 * Encode a `List<Int>` as a Plutus list.
 * @example mkIntList([1, 2, 3])
 */
export const mkIntList = (items: Array<string | number | bigint>) => mkList(items.map(item => mkInt(item)))

/**
 * Encode a Plutus `OutputReference` = `Constr(0, [Bytes(txHash), Int(index)])`.
 * @param ref The output reference: `txHash` (hex string) + output `index`
 * @example mkOutputRef({ txHash: 'ab12..', index: 0 })
 */
export const mkOutputRef = (ref: { txHash: string; index: number | bigint }) =>
	mkConstr(0, [mkBytes(ref.txHash), mkInt(ref.index)])

/**
 * Convert a WASM `Credential` to Plutus `Credential` data.
 *
 * `VerificationKey(hash) = Constr(0, [Bytes])`, `Script(hash) = Constr(1, [Bytes])`.
 */
const credentialToPlutusData = (cred: CardanoWASM.Credential): CardanoWASM.PlutusData =>
	cred.kind() === CardanoWASM.CredKind.Key
		? mkConstr(0, [mkBytes(cred.to_keyhash()!.to_hex())])
		: mkConstr(1, [mkBytes(cred.to_scripthash()!.to_hex())])

/**
 * Convert a Plutus `Credential` back to a WASM `Credential`.
 */
const plutusDataToCredential = (data: CardanoWASM.PlutusData): CardanoWASM.Credential => {
	const constr = data.as_constr_plutus_data()
	if (!constr) throw new Error('parseAddress: expected a Constr for Credential')
	const hashBytes = constr.data().get(0).as_bytes()
	if (!hashBytes) throw new Error('parseAddress: expected Bytes for the credential hash')
	const hashHex = bytesToHex(hashBytes)
	return constr.alternative().to_str() === '0'
		? CardanoWASM.Credential.from_keyhash(CardanoWASM.Ed25519KeyHash.from_hex(hashHex)) // VerificationKey
		: CardanoWASM.Credential.from_scripthash(CardanoWASM.ScriptHash.from_hex(hashHex)) // Script
}

/**
 * Encode a bech32 Cardano address as Plutus `Address` data:
 * `Constr(0, [payment_credential, Option<Inline<StakeCredential>>])`.
 *
 * Handles both key and script credentials, and enterprise (no stake) addresses.
 * Pointer stake credentials are not supported.
 *
 * @param bech32 A bech32 address (`addr...` / `addr_test...`)
 * @example mkAddress('addr_test1qq..') // => Constr(0, [Constr(0, [Bytes]), Constr(1, [])])
 */
export const mkAddress = (bech32: string): CardanoWASM.PlutusData => {
	const address = CardanoWASM.Address.from_bech32(bech32)

	const paymentCred = address.payment_cred()
	if (!paymentCred) throw new Error(`mkAddress: address has no payment credential: ${bech32}`)

	// Stake credential is only present on base addresses.
	const baseAddress = CardanoWASM.BaseAddress.from_address(address)
	const stakeCred = baseAddress?.stake_cred()

	return mkConstr(0, [
		credentialToPlutusData(paymentCred),
		stakeCred
			? mkConstr(0, [mkConstr(0, [credentialToPlutusData(stakeCred)])]) // Some(Inline(cred))
			: mkConstr(1, []) // None
	])
}

/**
 * Decode Plutus `Address` data back into a bech32 address.
 *
 * The Plutus `Address` type carries no network tag, so `networkId` must match the
 * target network (mainnet = 1, testnets = 0). Handles key/script credentials and
 * enterprise (None stake) addresses; pointer stake credentials are not supported.
 *
 * @param data The Plutus `Address` PlutusData (e.g. produced by {@link mkAddress})
 * @param networkId Target network id (defaults to mainnet)
 * @example parseAddress(mkAddress(addr), NETWORK_ID.PREPROD) // => 'addr_test1..'
 */
export const parseAddress = (data: CardanoWASM.PlutusData, networkId: number = NETWORK_ID.MAINNET): string => {
	const addrConstr = data.as_constr_plutus_data()
	if (!addrConstr) throw new Error('parseAddress: expected a Constr for Address')
	const fields = addrConstr.data()
	if (fields.len() < 2) throw new Error('parseAddress: Address must have 2 fields')

	const paymentCred = plutusDataToCredential(fields.get(0))

	const stakeOpt = fields.get(1).as_constr_plutus_data()
	if (!stakeOpt) throw new Error('parseAddress: expected an Option Constr for the stake credential')

	// None => enterprise address
	if (stakeOpt.alternative().to_str() === '1') {
		return CardanoWASM.EnterpriseAddress.new(networkId, paymentCred).to_address().to_bech32()
	}

	// Some(Inline(cred)) => base address
	const inline = stakeOpt.data().get(0).as_constr_plutus_data()
	if (!inline) throw new Error('parseAddress: expected an Inline Constr for the stake credential')
	if (inline.alternative().to_str() !== '0') {
		throw new Error('parseAddress: pointer stake credentials are not supported')
	}
	const stakeCred = plutusDataToCredential(inline.data().get(0))
	return CardanoWASM.BaseAddress.new(networkId, paymentCred, stakeCred).to_address().to_bech32()
}
