import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { hexToBytes } from '@hydra-sdk/core'

type RedeemerTagType = 'SPEND' | 'MINT' | 'REWARD' | 'CERT' | 'REWARD' | 'VOTE' | 'VOTING_PROPOSAL'

const getRedeemerTag = (type: RedeemerTagType): CardanoWASM.RedeemerTag => {
	switch (type) {
		case 'SPEND':
			return CardanoWASM.RedeemerTag.new_spend()
		case 'MINT':
			return CardanoWASM.RedeemerTag.new_mint()
		case 'REWARD':
			return CardanoWASM.RedeemerTag.new_reward()
		case 'CERT':
			return CardanoWASM.RedeemerTag.new_cert()
		case 'VOTE':
			return CardanoWASM.RedeemerTag.new_vote()
		case 'VOTING_PROPOSAL':
			return CardanoWASM.RedeemerTag.new_voting_proposal()
		default:
			throw new Error(`Unknown redeemer tag type: ${type}`)
	}
}
/**
 * Builds a redeemer for a Plutus script.
 * @param jsValue The JavaScript value to include in the redeemer.
 * @param options Optional parameters for the redeemer.
 *
 * @param options.tag The redeemer tag type (default is `SPEND`).
 * @param options.index The index of the redeemer (default is `0`).
 * @param options.exUnits The execution units for the redeemer (default is `{ mem: '100000', steps: '10000000' }`).
 * @description
 * Normally, exUnits should be calculated based on the actual script execution.
 * However, for simplicity, fixed values are used here.
 * The typical maximum values for Plutus V3 are 14,000,000 memory and 10,000,000,000 steps.
 * @returns The constructed redeemer.
 */
export function buildRedeemer(
	jsValue: Record<string, string>,
	options?: {
		tag?: RedeemerTagType
		index?: number | string
		exUnits?: {
			mem: string
			steps: string
		}
	}
): CardanoWASM.Redeemer {
	const redeemerTag = getRedeemerTag(options?.tag || 'SPEND')

	const fields = CardanoWASM.PlutusList.new()

	Object.entries(jsValue).forEach(([_key, value]) => {
		fields.add(CardanoWASM.PlutusData.new_bytes(Buffer.from(value)))
	})

	const constrFields = CardanoWASM.ConstrPlutusData.new(CardanoWASM.BigNum.zero(), fields)
	const plutusData = CardanoWASM.PlutusData.new_constr_plutus_data(constrFields)
	const index = CardanoWASM.BigNum.from_str(String(options?.index || 0))
	const redeemer = CardanoWASM.Redeemer.new(
		redeemerTag,
		index,
		plutusData,
		CardanoWASM.ExUnits.new(
			CardanoWASM.BigNum.from_str(options?.exUnits?.mem || '100000'), // Mem
			CardanoWASM.BigNum.from_str(options?.exUnits?.steps || '10000000') // Steps
		)
	)
	return redeemer
}
export function emptyRedeemer(options?: {
	tag?: RedeemerTagType
	index?: number | string
	type?: 'int' | 'bytes' | 'list' | 'map' | 'constr'
	exUnits?: {
		mem: string
		steps: string
	}
}): CardanoWASM.Redeemer {
	const redeemerTag = getRedeemerTag(options?.tag || 'SPEND')
	const index = CardanoWASM.BigNum.from_str(String(options?.index || 0))

	const type = options?.type || 'int'
	let plutusData: CardanoWASM.PlutusData
	switch (type) {
		case 'int':
			plutusData = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('0'))
			break
		case 'bytes':
			plutusData = CardanoWASM.PlutusData.new_bytes(Buffer.from(''))
			break
		case 'list':
			plutusData = CardanoWASM.PlutusData.new_list(CardanoWASM.PlutusList.new())
			break
		case 'map':
			plutusData = CardanoWASM.PlutusData.new_map(CardanoWASM.PlutusMap.new())
			break
		case 'constr':
			const fields = CardanoWASM.PlutusList.new()
			plutusData = CardanoWASM.PlutusData.new_empty_constr_plutus_data(index)
			break
		default:
			throw new Error(`Unknown plutus data type: ${type}`)
	}

	const redeemer = CardanoWASM.Redeemer.new(
		redeemerTag,
		index,
		plutusData,
		CardanoWASM.ExUnits.new(
			CardanoWASM.BigNum.from_str(options?.exUnits?.mem || '100000'), // Mem
			CardanoWASM.BigNum.from_str(options?.exUnits?.steps || '10000000') // Steps
		)
	)
	return redeemer
}
