import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { MetadataUtils, ParserUtils } from '@hydra-sdk/core'

const buildVkeyHash = (bech32: string) => {
	try {
		const vkeyHash = CardanoWASM.Address.from_bech32(bech32)?.payment_cred()?.to_keyhash()?.to_hex()
		if (!vkeyHash) throw new Error('Invalid vkeyhash')
		return vkeyHash
	} catch (e) {
		throw e
	}
}
describe('Metadata Utils', () => {
	const vkeyHash = buildVkeyHash(
		'addr_test1qq60xacqkyzcdsrx9ep0e00nxwwyc5k3pe938l00ytkdnvhpymfpqd6r8u22twfauqq0ux480ujn0ms2vel82rh9mzlslh5h2g'
	)

	test('metadataObjToMetadatum should convert object to metadatum', () => {
		const metadata = MetadataUtils.metadataObjToMetadatum({
			toHeadId: ParserUtils.toBytes('4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'),
			toAddress: ParserUtils.toBytes(vkeyHash)
		})
		expect(metadata).toBeDefined()
		expect(metadata.to_hex()).toBe(
			'a268746f48656164496458204f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d69746f41646472657373581c34f37700b10586c0662e42fcbdf3339c4c52d10e4b13fdef22ecd9b2'
		)
	})
	test('metadataObjToMetadatum throw error length', () => {
		try {
			const metadata = MetadataUtils.metadataObjToMetadatum({
				toHeadId: ParserUtils.toBytes('4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'),
				toAddress: ParserUtils.toBytes(
					'a268746f48656164496458204f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d69746f41646472657373581c34f37700b10586c0662e42fcbdf3339c4c52d10e4b13fdef22ecd9b2'
				)
			})
		} catch (e) {
			expect(e).toBeDefined()
			expect(e).toMatch('Max metadata bytes too long')
		}
	})
})
