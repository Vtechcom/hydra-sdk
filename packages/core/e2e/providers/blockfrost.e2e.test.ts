/**
 * E2E: BlockfrostProvider against the live preprod API.
 *
 *   BLOCKFROST_PROVIDER_API_KEY=<preprod project id> pnpm test:e2e packages/core/e2e/providers
 *
 * Skipped when the key is not set. ADDRESS must hold at least one UTxO with ASSET on
 * preprod (fund it from https://docs.cardano.org/cardano-testnets/tools/faucet).
 * The free Blockfrost tier is rate limited to 10 req/s.
 */
import { ProviderUtils } from '@hydra-sdk/core'

const ENV_KEY = 'BLOCKFROST_PROVIDER_API_KEY'
/** Base address of the nodejs-playground `walletPrimary` mnemonic. */
const ADDRESS =
	'addr_test1qzya97j3gg2lkp360m7238lfe46y0jzhl6wgsz6xysz3d5peqew2j40a7ryqyku9re6znz26uan26shczed77p9n6uwq68d0h9'
const ASSET = 'fef67460342d081cb7881318b1f33b87626d1a1042b4c2acbbc0725d7441424f'

describe('[e2e][providers] Blockfrost (preprod)', () => {
	let provider: ProviderUtils.BlockfrostProvider

	beforeEach(({ skip }) => {
		const apiKey = process.env[ENV_KEY]
		if (!apiKey) skip(`${ENV_KEY} is not set`)
		provider ??= new ProviderUtils.BlockfrostProvider({ apiKey: apiKey!, network: 'preprod' })
	})

	it('fetches the UTxOs sitting at the address', async () => {
		const utxos = await provider.fetcher.fetchAddressUTxOs(ADDRESS)

		expect(utxos.length).toBeGreaterThan(0)
		expect(utxos.every(u => u.output.address === ADDRESS)).toBe(true)
	})

	it('narrows the UTxOs to those holding the asset', async () => {
		const utxos = await provider.fetcher.fetchAddressUTxOs(ADDRESS, ASSET)

		expect(utxos.length).toBeGreaterThan(0)
		expect(utxos.every(u => u.output.amount.some(a => a.unit === ASSET && BigInt(a.quantity) > 0n))).toBe(true)
	})
})
