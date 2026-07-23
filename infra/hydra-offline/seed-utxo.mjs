/**
 * Regenerate initial-utxo.json so the offline head is seeded to an address we
 * hold the key for — otherwise the e2e suite could read the head but never
 * spend inside it.
 *
 * The mnemonic is a fixed, throwaway test vector. The head is offline and the
 * lovelace is fabricated by --initial-utxo, so it controls nothing real.
 *
 *   node e2e/infra/seed-utxo.mjs
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'

export const E2E_MNEMONIC =
	'test test test test test test test test test test test test test test test test test test test test test test test sauce'

export const e2eWalletAddress = () =>
	new AppWallet({
		networkId: NETWORK_ID.PREPROD,
		key: { type: 'mnemonic', words: E2E_MNEMONIC.split(' ') }
	}).getAccount().baseAddressBech32

// Only write when invoked directly — the test suite imports E2E_MNEMONIC from
// here and must not rewrite the seed as a side effect.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const address = e2eWalletAddress()

	// One fat UTxO — enough headroom to chain several spends without juggling change.
	const utxo = {
		'0000000000000000000000000000000000000000000000000000000000000000#0': {
			address,
			value: { lovelace: 100_000_000_000_000 }
		}
	}

	const here = dirname(fileURLToPath(import.meta.url))
	writeFileSync(join(here, 'initial-utxo.json'), JSON.stringify(utxo, null, '\t') + '\n')

	console.log('seeded initial-utxo.json ->', address)
}
