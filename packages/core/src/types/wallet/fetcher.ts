import type { UTxO } from '../cardano'

export interface IFetcher {
	/**
	 * Fetch UTxOs for a specific address.
	 * @param address The address to fetch UTxOs for.
	 * @param asset The asset to filter UTxOs by (optional).
	 * @returns A promise that resolves to an array of UTxOs.
	 * @example
	 * ```typescript
	 * const utxos = await fetcher.fetchAddressUTxOs('addr_test1...');
	 * console.log(utxos);
	 * ```
	 */
	fetchAddressUTxOs(address: string, asset?: string): Promise<UTxO[]>
}
