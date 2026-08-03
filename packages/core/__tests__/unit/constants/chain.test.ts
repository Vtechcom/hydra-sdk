import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { NETWORK_ID, NETWORK_MAGIC } from '../../../src/constants/chain'
import { PLACEHOLDER_ADDRESS } from '../../../src/constants/placeholder'

/**
 * `chain.ts` hardcodes what `CardanoWASM.NetworkInfo` reports so that importing
 * `@hydra-sdk/core` never runs WASM code at module-evaluation time. These tests
 * are the guard on that duplication.
 */
describe('chain constants', () => {
	it('matches CardanoWASM.NetworkInfo network ids', () => {
		expect(NETWORK_ID.MAINNET).toBe(CardanoWASM.NetworkInfo.mainnet().network_id())
		expect(NETWORK_ID.PREPROD).toBe(CardanoWASM.NetworkInfo.testnet_preprod().network_id())
		expect(NETWORK_ID.PREVIEW).toBe(CardanoWASM.NetworkInfo.testnet_preview().network_id())
	})

	it('matches CardanoWASM.NetworkInfo protocol magics', () => {
		expect(NETWORK_MAGIC.MAINNET).toBe(CardanoWASM.NetworkInfo.mainnet().protocol_magic())
		expect(NETWORK_MAGIC.PREPROD).toBe(CardanoWASM.NetworkInfo.testnet_preprod().protocol_magic())
		expect(NETWORK_MAGIC.PREVIEW).toBe(CardanoWASM.NetworkInfo.testnet_preview().protocol_magic())
	})

	it('keeps a parseable placeholder address for mainnet and for the testnets', () => {
		// Both testnets share network id 0, so the map has exactly two entries.
		expect(Object.keys(PLACEHOLDER_ADDRESS).map(Number).sort()).toEqual([NETWORK_ID.MAINNET, NETWORK_ID.PREVIEW].sort())

		for (const bech32 of Object.values(PLACEHOLDER_ADDRESS)) {
			expect(() => CardanoWASM.Address.from_bech32(bech32)).not.toThrow()
		}
	})
})
