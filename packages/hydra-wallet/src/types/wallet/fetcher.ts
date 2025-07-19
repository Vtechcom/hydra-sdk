import type { UTxO } from '../cardano'

export interface IFetcher {
	fetchAddressUTxOs(address: string, asset?: string): Promise<UTxO[]>
}
