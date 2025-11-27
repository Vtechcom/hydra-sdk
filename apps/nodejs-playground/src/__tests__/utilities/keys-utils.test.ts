import { KeysUtils } from '@hydra-sdk/core'

describe('KeysUtils', () => {
	it('KeysUtils: generate new key-pairs - cardano-funds-key', () => {
		const { sk, vk } = KeysUtils.cardanoCliKeygen()
		expect(sk.cborHex).toMatch(/^5820[0-9a-z]{64}$/)
		expect(vk.cborHex).toMatch(/^5820[0-9a-z]{64}$/)
	})

	it('KeysUtils: generate new key-pairs - hydra-keys', () => {
		const { sk, vk } = KeysUtils.hydraCliKeygen()
		expect(sk.cborHex).toMatch(/^5820[0-9a-z]{64}$/)
		expect(vk.cborHex).toMatch(/^5820[0-9a-z]{64}$/)
	})

	it('KeysUtils: gen vkey function: KeysUtils.genVkey(sk).cborHex).toBe(vk.cborHex)', () => {
		const { sk, vk } = KeysUtils.hydraCliKeygen()
		expect(KeysUtils.genVkey(sk).cborHex).toBe(vk.cborHex)
	})
})
