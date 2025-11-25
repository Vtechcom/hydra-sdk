import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { NETWORK_ID } from '../../constants/chain'

export const buildBaseAddress = (
	networkId: number,
	paymentKeyHash: CardanoWASM.Ed25519KeyHash,
	stakeKeyHash: CardanoWASM.Ed25519KeyHash
): CardanoWASM.BaseAddress => {
	const paymentCredential = CardanoWASM.Credential.from_keyhash(paymentKeyHash)
	const stakeCredential = CardanoWASM.Credential.from_keyhash(stakeKeyHash)
	return CardanoWASM.BaseAddress.new(networkId, paymentCredential, stakeCredential)
}

export const buildEnterpriseAddress = (
	networkId: number,
	paymentKeyHash: CardanoWASM.Ed25519KeyHash
): CardanoWASM.EnterpriseAddress => {
	//   return EnterpriseAddress.fromCredentials(networkId, {
	//     hash: paymentKeyHash,
	//     type: CredentialType.KeyHash
	//   })
	const paymentCredential = CardanoWASM.Credential.from_keyhash(paymentKeyHash)
	return CardanoWASM.EnterpriseAddress.new(networkId, paymentCredential)
}

export const buildRewardAddress = (
	networkId: number,
	stakeKeyHash: CardanoWASM.Ed25519KeyHash
): CardanoWASM.RewardAddress => {
	//   const cred = {
	//     type: CredentialType.KeyHash,
	//     hash: stakeKeyHash
	//   }
	//   return RewardAddress.fromCredentials(networkId, cred)
	const stakeCredential = CardanoWASM.Credential.from_keyhash(stakeKeyHash)
	return CardanoWASM.RewardAddress.new(networkId, stakeCredential)
}

export const buildDRepID = (
	dRepKey: CardanoWASM.Ed25519KeyHash,
	networkId: number = NETWORK_ID.MAINNET
	// addressType: AddressType = AddressType.EnterpriseKey
) => {
	// const dRepKeyBytes = Buffer.from(dRepKey, 'hex')
	// const dRepIdHex = blake2b(28).update(dRepKeyBytes).digest('hex')
	// const paymentAddress = EnterpriseAddress.packParts({
	//   networkId,
	//   paymentPart: {
	//     hash: Hash28ByteBase16(dRepIdHex),
	//     type: CredentialType.KeyHash
	//   },
	//   type: addressType
	// })
	// return HexBlob.toTypedBech32<DRepID>('drep', HexBlob.fromBytes(paymentAddress))

	// CardanoWASM.DRep.new_from_credential(CardanoWASM.Credential.from_hex(dRepKey.to_hex()))
	// const paymentAddress = CardanoWASM.EnterpriseAddress.new(networkId, CardanoWASM.Credential.from_hex(dRepKey.to_hex()))
	console.log('buildDRepID', dRepKey.to_hex(), networkId)
	return null
}

// Purpose derivation (See BIP43)
export enum Purpose {
	CIP1852 = 1852 // see CIP 1852
}

// Cardano coin type (SLIP 44)
export enum CoinTypes {
	CARDANO = 1815
}

export enum ChainDerivation {
	EXTERNAL = 0, // from BIP44
	INTERNAL = 1, // from BIP44
	CHIMERIC = 2, // from CIP1852
	DREP = 3
}

function harden(num: number): number {
	return 0x80000000 + num
}

export const buildKeys = (
	privateKeyHex: string | [string, string],
	accountIndex: number,
	keyIndex = 0
): {
	accountKey: CardanoWASM.Bip32PrivateKey
	paymentKey: CardanoWASM.Bip32PrivateKey
	stakeKey: CardanoWASM.Bip32PrivateKey
	dRepKey?: CardanoWASM.Bip32PrivateKey
} => {
	if (Array.isArray(privateKeyHex)) {
		return {
			// TODO: need to verify this
			accountKey: CardanoWASM.Bip32PrivateKey.from_hex(privateKeyHex[0]),

			paymentKey: CardanoWASM.Bip32PrivateKey.from_hex(privateKeyHex[0]),
			stakeKey: CardanoWASM.Bip32PrivateKey.from_hex(privateKeyHex[1])
		}
	}

	/**
	 * @description rootKey
	 */
	const privateKey = CardanoWASM.Bip32PrivateKey.from_hex(privateKeyHex)

	// hardened derivation
	const accountKey = privateKey
		.derive(harden(Purpose.CIP1852)) // 1852
		.derive(harden(CoinTypes.CARDANO)) // 1815
		.derive(harden(accountIndex)) // account #0

	const paymentKey = accountKey
		.derive(ChainDerivation.EXTERNAL) //  external chain (0)
		.derive(keyIndex) //                  external chain, payment key index
	const stakeKey = accountKey
		.derive(ChainDerivation.CHIMERIC) //  chimeric derivation (2)
		.derive(keyIndex) //                  staking key, index 0
	const dRepKey = accountKey
		.derive(ChainDerivation.DREP) //      dRep key, index 0
		.derive(keyIndex) //                  dRep Keys, index

	return { accountKey, paymentKey, stakeKey, dRepKey }
}

/**
 * 
 * @param scalar 
 * @returns 
 * @description
 * `clampScalar` làm nhiệm vụ clamp (chuẩn hóa) một scalar (32 byte private key) theo quy tắc Ed25519:
 * 
    Đảm bảo private scalar nằm trong một tập hợp giá trị hợp lệ theo quy chuẩn EdDSA (RFC 8032 / Ed25519).
    Vì Ed25519 yêu cầu scalar phải:
    - Có 3 bit thấp nhất của byte đầu tiên bằng 0
    - Có 2 bit cao nhất của byte cuối cùng là 01
 * 
    Việc này giúp khóa có tính chất cryptographically secure hơn và tránh scalar yếu.
 */
export const clampScalar = (scalar: Buffer): Buffer => {
	if (scalar[0] !== undefined) {
		scalar[0] &= 0b1111_1000
	}
	if (scalar[31] !== undefined) {
		scalar[31] &= 0b0001_1111
		scalar[31] |= 0b0100_0000
	}
	return scalar
}

/**
 *
 * @param extendedKeyHex
 * @returns
 * @description
 * `stripExtendedKey` remove public key (32 byte) of extended key (96 byte) to create private key (64 byte)
 */
export const stripExtendedKey = (extendedKeyHex: string): string => {
	if (extendedKeyHex.length !== 192) {
		throw new Error('Extended key must be 192 hex characters (96 bytes)')
	}
	//  private key (32 byte) + chain code (32 byte) = 64 byte = 128 hex
	const strippedKeyHex = extendedKeyHex.slice(0, 128)
	return strippedKeyHex
}
