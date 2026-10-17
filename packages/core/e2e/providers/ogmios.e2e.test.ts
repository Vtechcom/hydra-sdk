/**
 * E2E: OgmiosProvider against a live preprod Ogmios HTTP endpoint.
 *
 *   OGMIOS_PROVIDER_HTTP_URL=https://<ogmios host> pnpm test:e2e packages/core/e2e/providers
 *
 * Skipped when the URL is not set. ADDRESS must hold at least one UTxO with ASSET on
 * preprod (fund it from https://docs.cardano.org/cardano-testnets/tools/faucet).
 */
import { ProviderUtils } from '@hydra-sdk/core'

const ENV_KEY = 'OGMIOS_PROVIDER_HTTP_URL'
/** Base address of the nodejs-playground `walletPrimary` mnemonic. */
const ADDRESS =
	'addr_test1qzya97j3gg2lkp360m7238lfe46y0jzhl6wgsz6xysz3d5peqew2j40a7ryqyku9re6znz26uan26shczed77p9n6uwq68d0h9'
const ASSET = 'fef67460342d081cb7881318b1f33b87626d1a1042b4c2acbbc0725d7441424f'

describe('[e2e][providers] Ogmios (preprod)', () => {
	let provider: ProviderUtils.OgmiosProvider

	beforeEach(({ skip }) => {
		const apiEndpoint = process.env[ENV_KEY]
		if (!apiEndpoint) skip(`${ENV_KEY} is not set`)
		provider ??= new ProviderUtils.OgmiosProvider({ apiEndpoint, network: 'preprod' })
	})

	it('fetches the UTxOs sitting at the address', async () => {
		const utxos = await provider.fetcher.fetchAddressUTxOs(ADDRESS)

		expect(utxos.length).toBeGreaterThan(0)
		expect(utxos.every(u => u.output.address === ADDRESS)).toBe(true)
	}, 60_000)

	it('narrows the UTxOs to those holding the asset', async () => {
		const utxos = await provider.fetcher.fetchAddressUTxOs(ADDRESS, ASSET)

		expect(utxos.length).toBeGreaterThan(0)
		expect(utxos.every(u => u.output.amount.some(a => a.unit === ASSET && BigInt(a.quantity) > 0n))).toBe(true)
	}, 60_000)
})
