import { Network } from './chain'

export type SlotConfig = {
	zeroTime: number
	zeroSlot: number
	slotLength: number // number of milliseconds.
	startEpoch: number
	epochLength: number
}

export const SLOT_CONFIG_NETWORK: Record<Network, SlotConfig> = {
	MAINNET: {
		zeroTime: 1596059091000,
		zeroSlot: 4492800,
		slotLength: 1000,
		startEpoch: 208,
		epochLength: 432000
	}, // Starting at Shelley era
	PREVIEW: {
		zeroTime: 1666656000000,
		zeroSlot: 0,
		slotLength: 1000,
		startEpoch: 0,
		epochLength: 86400
	}, // Starting at Shelley era
	PREPROD: {
		zeroTime: 1654041600000 + 1728000000,
		zeroSlot: 86400,
		slotLength: 1000,
		startEpoch: 4,
		epochLength: 432000
	} // Starting at Shelley era
	/** Customizable slot config (Initialized with 0 values). */
	// testnet: {
	// 	zeroTime: 0,
	// 	zeroSlot: 0,
	// 	slotLength: 0,
	// 	startEpoch: 0,
	// 	epochLength: 0
	// }
}
