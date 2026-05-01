import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { LANGUAGE_VERSIONS } from '../../constants'
import { LanguageVersion } from '../../types/cardano/plutus-script'
import { hexToBytes } from '../parser'
import { Asset } from '../../types/cardano'

export const deserializeTx = (txCborHex: string): CardanoWASM.FixedTransaction => {
	return CardanoWASM.FixedTransaction.from_bytes(Buffer.from(txCborHex, 'hex'))
}

export const deserializeAssetUnit = (assetUnit: string): { policyId: string; assetName: string } => {
	const policyId = assetUnit.substring(0, 56)
	const assetName = assetUnit.substring(56)
	return { policyId, assetName }
}

export type DeserializerAddress = {
	kind: CardanoWASM.AddressKind
	/**
	 * Credential kind (Key or Script)
	 */
	credentialKind: CardanoWASM.CredKind
	/**
	 * Payment key hash (if credentialKind is Key)
	 *
	 * as `pubKeyHash`
	 *
	 */
	paymentCredentialHash?: string // payment key hash
	stakeCredentialHash?: string // stake key hash
	scriptHash?: string // payment script hash (if credentialKind is Script)
}
export const deserializeAddress = (bech32: string): DeserializerAddress => {
	try {
		const address = CardanoWASM.Address.from_bech32(bech32)

		let scriptHash = undefined
		let credKind = CardanoWASM.CredKind.Key
		const paymentCred = address.payment_cred()
		if (paymentCred && paymentCred.kind() === CardanoWASM.CredKind.Key) {
			// Payment key hash
			credKind = CardanoWASM.CredKind.Key
		} else if (paymentCred && paymentCred.kind() === CardanoWASM.CredKind.Script) {
			// Payment script hash
			scriptHash = paymentCred.has_script_hash() ? (paymentCred.to_scripthash()?.to_hex() ?? '') : ''
			credKind = CardanoWASM.CredKind.Script
		}
		if (address.kind() === CardanoWASM.AddressKind.Base) {
			const baseAddress = CardanoWASM.BaseAddress.from_address(address)
			const stakeCred = baseAddress?.stake_cred()
			const stakeCredentialHash = stakeCred && stakeCred.to_keyhash() ? stakeCred.to_keyhash()?.to_hex() || '' : ''
			const paymentCred = baseAddress?.payment_cred()
			const paymentCredentialHash = paymentCred && paymentCred.to_keyhash() ? paymentCred.to_keyhash()?.to_hex() || '' : ''

			return {
				kind: CardanoWASM.AddressKind.Base,
				credentialKind: credKind,
				paymentCredentialHash,
				stakeCredentialHash,
				scriptHash
			}
		} else if (address.kind() === CardanoWASM.AddressKind.Enterprise) {
			// Enterprise address
			const enterpriseAddress = CardanoWASM.EnterpriseAddress.from_address(address)
			const paymentCred = enterpriseAddress?.payment_cred()
			const paymentCredentialHash =
				paymentCred && paymentCred.to_keyhash() ? paymentCred.to_keyhash()?.to_hex() : undefined

			return {
				kind: CardanoWASM.AddressKind.Enterprise,
				credentialKind: credKind,
				paymentCredentialHash,
				scriptHash
			}
		} else if (address.kind() === CardanoWASM.AddressKind.Pointer) {
			// Pointer address
			const pointerAddress = CardanoWASM.PointerAddress.from_address(address)
			const paymentCred = pointerAddress?.payment_cred()
			const paymentCredentialHash =
				paymentCred && paymentCred.to_keyhash() ? paymentCred.to_keyhash()?.to_hex() : undefined

			return {
				kind: CardanoWASM.AddressKind.Pointer,
				credentialKind: credKind,
				paymentCredentialHash,
				scriptHash
			}
		} else if (address.kind() === CardanoWASM.AddressKind.Reward) {
			// Reward address
			const rewardAddress = CardanoWASM.RewardAddress.from_address(address)
			const stakeCred = rewardAddress?.payment_cred()
			const stakeCredentialHash =
				stakeCred && stakeCred.to_keyhash() ? Buffer.from(stakeCred.to_keyhash()!.to_bytes()).toString('hex') : ''
			return {
				kind: CardanoWASM.AddressKind.Reward,
				credentialKind: credKind,
				stakeCredentialHash
			}
		} else if (address.kind() === CardanoWASM.AddressKind.Malformed) {
			throw new Error('Malformed address')
		}

		return {
			kind: CardanoWASM.AddressKind.Malformed,
			credentialKind: credKind
		}
	} catch (error) {
		throw error
	}
}

/**
 *
 * @param scriptCbor Script cbor hex
 * @param version Default V3
 */
export const deserializePlutusScript = (scriptCbor: string, version: LanguageVersion = 'V3') => {
	let plutusScript: CardanoWASM.PlutusScript
	if (version === 'V1') {
		plutusScript = CardanoWASM.PlutusScript.from_bytes(hexToBytes(scriptCbor))
	} else if (version === 'V2') {
		plutusScript = CardanoWASM.PlutusScript.from_bytes_v2(hexToBytes(scriptCbor))
	} else if (version === 'V3') {
		plutusScript = CardanoWASM.PlutusScript.from_bytes_v3(hexToBytes(scriptCbor))
	} else {
		throw new Error('Unsupported script version: ', version)
	}
	return plutusScript
}

export const deserializePlutusScriptHash = (scriptCbor: string, version: LanguageVersion = 'V3') => {
	try {
		const plutusScript = deserializePlutusScript(scriptCbor, version)
		return plutusScript.hash().to_hex()
	} catch (error) {
		throw error
	}
}

/**
 * Deserialize PlutusData from cbor hex
 * Used to convert inlineDatum from string to PlutusData
 * @param dataCbor PlutusData cbor hex
 * @returns
 */
export const deserializePlutusData = (dataCbor: string): CardanoWASM.PlutusData => {
	try {
		const plutusData = CardanoWASM.PlutusData.from_hex(dataCbor)
		return plutusData
	} catch (error) {
		throw new Error('Invalid PlutusData cbor')
	}
}

/**
 * Returns all amounts (lovelace + native tokens) across all outputs, merged by unit.
 * Quantities for the same unit appearing in multiple outputs are summed.
 * 'lovelace' is always present unless the tx has zero outputs.
 */
export function deserializeAmountsFromTx(cborHex: string): Asset[] {
	const outputs = deserializeTx(cborHex).body().outputs()
	const unitMap = new Map<string, bigint>()

	for (let i = 0; i < outputs.len(); i++) {
		const output = outputs.get(i)

		// Accumulate lovelace
		const coin = BigInt(output.amount().coin().to_str())
		unitMap.set('lovelace', (unitMap.get('lovelace') ?? 0n) + coin)

		// Accumulate native tokens
		const ma = output.amount().multiasset()
		if (ma && ma.len() > 0) {
			const policyIds = ma.keys()
			for (let j = 0; j < policyIds.len(); j++) {
				const policyId = policyIds.get(j)
				const assets = ma.get(policyId)
				for (let k = 0; k < assets!.len(); k++) {
					const assetName = assets!.keys().get(k)
					const unit = `${policyId.to_hex()}${assetName.to_hex()}`
					const qty = BigInt(assets!.get(assetName)!.to_str())
					unitMap.set(unit, (unitMap.get(unit) ?? 0n) + qty)
				}
			}
		}
	}

	return Array.from(unitMap.entries()).map(([unit, quantity]) => ({
		unit,
		quantity: quantity.toString()
	}))
}
