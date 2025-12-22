import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { AppWallet, EmbeddedWallet, NETWORK_ID, ParserUtils } from '@hydra-sdk/core'
import { encrypt, decrypt } from './crypto-utils'
;(async function buildVotingKey() {
	//
	console.log('Building voting key...')
	const words = 'your mnemonic phrase goes here'.split(' ')
	const wallet = new EmbeddedWallet({
		key: {
			type: 'mnemonic',
			words
		},
		networkId: NETWORK_ID.MAINNET
	})

	const baseAddressBech32 = wallet.getAccount().baseAddressBech32
	console.log('>>> / build-voting-key.ts:16 / baseAddressBech32:', baseAddressBech32)

	const privateKeyHex = wallet.getPrivateKeyHex() as string
	console.log('>>> / build-voting-key.ts:22 / privateKeyHex:', privateKeyHex)

	const rootKey = CardanoWASM.Bip32PrivateKey.from_hex(privateKeyHex)

	// CIP-36 m/ 1694'/1815'/account'/chain/address_index
	const cip36RootKey = rootKey
		.derive(harden(1694)) //
		.derive(harden(1815))
		.derive(harden(0))
		.derive(0) // chain 0
		.derive(0) // address index 0

	const extendedPrvKey = cip36RootKey.to_raw_key()
	// CIP-36 voting key
	// const votingSkey = {
	//     type: 'CIP36VoteExtendedSigningKey_ed25519',
	//     description: 'Voting Signing Key',
	//     cborHex: votingSkCbor
	// } as const
	const votingSk = extendedPrvKey
	const votingVk = votingSk.to_public()

	console.log('Voting SKey:', votingSk.to_hex())
	console.log('Voting SK length:', votingSk.to_hex().length)
	console.log('Voting Vk:', votingVk.to_hex())

	const encryptedVotingSk = await encrypt(new Uint8Array([1, 2, 3, 4]), votingSk.as_bytes())
	console.log('Encrypted Voting SKey:', ParserUtils.bytesToHex(encryptedVotingSk))
	console.log('Encrypted Voting SKey length:', encryptedVotingSk.length) // 109 bytes => 218 hex chars

	// Giả sử lưu trữ và lấy lại khóa đã mã hóa
	const decryptedVotingSkBytes = await decrypt(new Uint8Array([1, 2, 3, 4]), encryptedVotingSk)
	console.log('Decrypted Voting SKey:', ParserUtils.bytesToHex(decryptedVotingSkBytes))
})()

function harden(num: number): number {
	return 0x80000000 + num
}
