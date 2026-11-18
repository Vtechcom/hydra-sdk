import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

/**
 * A wallet imported from a single `ed25519e_sk1…` key: a 64-byte extended Ed25519 private key with no chain
 * code. Nothing can be derived from it, so it signs as-is and its address is an enterprise address (payment
 * credential only, no stake). `@hydra-sdk/core` has no key type for this, so the playground handles it here.
 */

export const ED25519E_PREFIX = 'ed25519e_sk1'

/** Throws a readable error for anything that is not a valid `ed25519e_sk1…` key. The caller frees the key. */
const parseKey = (bech32: string): CardanoWASM.PrivateKey => {
	const text = bech32.trim()
	if (!text.startsWith(ED25519E_PREFIX)) throw new Error(`Key must start with "${ED25519E_PREFIX}"`)
	try {
		return CardanoWASM.PrivateKey.from_bech32(text)
	} catch {
		throw new Error('Not a valid ed25519e_sk key (bad bech32 or length)')
	}
}

/** Validates the key; returns '' when it is usable, otherwise the error message. */
export const ed25519eKeyError = (bech32: string): string => {
	try {
		parseKey(bech32).free()
		return ''
	} catch (error) {
		return error instanceof Error ? error.message : String(error)
	}
}

/** Enterprise address (`addr…1v…`) of the key's payment credential. */
export const ed25519eAddress = (bech32: string, networkId: number): string => {
	const key = parseKey(bech32)
	const publicKey = key.to_public()
	const keyHash = publicKey.hash()
	const credential = CardanoWASM.Credential.from_keyhash(keyHash)
	const enterprise = CardanoWASM.EnterpriseAddress.new(networkId, credential)
	const address = enterprise.to_address()
	try {
		return address.to_bech32()
	} finally {
		;[address, enterprise, credential, keyHash, publicKey, key].forEach(object => object.free())
	}
}

/** Same contract as `AppWallet.signTx`: refuses a tx that already has signatures unless `partialSign`. */
export const signTxWithEd25519e = (txHex: string, bech32: string, partialSign = false): string => {
	// FixedTransaction keeps the original body bytes, so the tx hash (and other signers' witnesses) stay valid.
	const tx = CardanoWASM.FixedTransaction.from_hex(txHex)
	const witnessSet = tx.witness_set()
	const vkeys = witnessSet.vkeys()
	const signed = !!vkeys && vkeys.len() > 0
	vkeys?.free()
	witnessSet.free()
	try {
		if (!partialSign && signed) throw new Error('Signatures already exist in the transaction in a non partial sign call')
		const key = parseKey(bech32)
		try {
			tx.sign_and_add_vkey_signature(key)
		} finally {
			key.free()
		}
		return tx.to_hex()
	} finally {
		tx.free()
	}
}

/** A fresh key for the Generate button: the raw payment key at m/1852'/1815'/0'/0/0 of a new mnemonic. */
export const ed25519eKeyFromRootHex = (rootKeyHex: string): string => {
	const root = CardanoWASM.Bip32PrivateKey.from_hex(rootKeyHex)
	const harden = (n: number) => 0x80000000 + n
	const path = [harden(1852), harden(1815), harden(0), 0, 0]
	let current = root
	for (const index of path) {
		const next = current.derive(index)
		current.free()
		current = next
	}
	const raw = current.to_raw_key()
	try {
		return raw.to_bech32()
	} finally {
		raw.free()
		current.free()
	}
}
