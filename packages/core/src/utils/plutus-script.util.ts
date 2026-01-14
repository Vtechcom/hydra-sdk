import { Application, encodeUPLC, parseUPLC, UPLCConst, UPLCProgram } from '@harmoniclabs/uplc'
import { applyDoubleCborEncoding } from './cbor'
import { dataFromCbor } from '@harmoniclabs/plutus-data'
import { decode } from 'cbor-x'
import { bytesToHex, hexToBytes } from './parser'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { MintingPolicy, SpendingValidator } from '../types/cardano/plutus-script'

export function applyParamsToScript(plutusScript: string, params: Uint8Array<ArrayBufferLike>[]): string {
	try {
		const program = parseUPLC(decode(decode(hexToBytes(applyDoubleCborEncoding(plutusScript)))), 'flat')
		const appliedProgram = params.reduce((body, currentParameter) => {
			const data = UPLCConst.data(dataFromCbor(currentParameter))
			const appliedParameter = new Application(body, data)
			return appliedParameter
		}, program.body)

		return applyDoubleCborEncoding(
			bytesToHex(encodeUPLC(new UPLCProgram(program.version, appliedProgram)).toBuffer().buffer)
		)
	} catch (e) {
		throw e
	}
}

/**
 * Returns the script hash of a minting policy script in `hex`
 */
export function mintingPolicyToId(mintingPolicy: MintingPolicy): string {
	return validatorToScriptHash(mintingPolicy)
}

/**
 * Returns the script hash of a validator script in hex
 */
export function validatorToScriptHash(validator: SpendingValidator): string {
	switch (validator.type) {
		case 'PlutusV1':
			return CardanoWASM.PlutusScript.from_bytes(hexToBytes(validator.scriptCborHex)).hash().to_hex()
		case 'PlutusV2':
			return CardanoWASM.PlutusScript.from_bytes_v2(hexToBytes(validator.scriptCborHex)).hash().to_hex()
		case 'PlutusV3':
			return CardanoWASM.PlutusScript.from_bytes_v3(hexToBytes(validator.scriptCborHex)).hash().to_hex()
		case 'Native':
			return CardanoWASM.NativeScript.from_hex(validator.scriptCborHex).hash().to_hex()
		default:
			throw new Error('No variant matched')
	}
}

/**
 * Returns the address of a validator script in `bech32`
 *
 * @param validator - The validator script
 * @param networkId - The network id
 * @param stakeCredential - The stake credential in `hex`
 */
export function validatorToAddress(validator: SpendingValidator, networkId: number, stakeCredential?: string): string {
	if (!stakeCredential) {
		const address = CardanoWASM.EnterpriseAddress.new(
			networkId,
			CardanoWASM.Credential.from_scripthash(CardanoWASM.ScriptHash.from_hex(validatorToScriptHash(validator)))
		)
		return address.to_address().to_bech32()
	} else {
		const address = CardanoWASM.BaseAddress.new(
			networkId,
			CardanoWASM.Credential.from_scripthash(CardanoWASM.ScriptHash.from_hex(validatorToScriptHash(validator))),
			CardanoWASM.Credential.from_hex(stakeCredential)
		)
		return address.to_address().to_bech32()
	}
}
