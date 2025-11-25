import { Network } from '../constants'
import { SLOT_CONFIG_NETWORK, SlotConfig } from '../constants/time'

export const slotToBeginUnixTime = (slot: number, slotConfig: SlotConfig): number => {
	const msAfterBegin = (slot - slotConfig.zeroSlot) * slotConfig.slotLength
	return slotConfig.zeroTime + msAfterBegin
}

/**
 * Eqivalent to `slotToBeginUnixTime` but option to provide optional config
 * @param unixTime Timestamp in milliseconds
 * @param slotConfig Slot configuration for calculation
 * @returns Slot number
 */
export const unixTimeToEnclosingSlot = (unixTime: number, slotConfig: SlotConfig): number => {
	const timePassed = unixTime - slotConfig.zeroTime
	const slotsPassed = Math.floor(timePassed / slotConfig.slotLength)
	return slotsPassed + slotConfig.zeroSlot
}

/**
 * Resolve slot number based on timestamp in milliseconds.
 * @param network Network: mainnet | preprod | preview.
 * @param milliseconds Timestamp in milliseconds
 * @returns Slot number
 */
export const resolveSlotNo = (network: Network, milliseconds = Date.now()): string => {
	return unixTimeToEnclosingSlot(milliseconds, SLOT_CONFIG_NETWORK[network]).toString()
}

/**
 * Resolve epoch number based on timestamp in  milliseconds.
 * @param network Network: mainnet | preprod | preview.
 * @param milliseconds Timestamp in milliseconds
 * @returns Epoch number
 */
export const resolveEpochNo = (network: Network, milliseconds = Date.now()): number => {
	const config = SLOT_CONFIG_NETWORK[network]

	const msBigInt = BigInt(milliseconds)
	const epoch = (msBigInt - BigInt(config.zeroTime)) / 1000n / BigInt(config.epochLength) + BigInt(config.startEpoch)

	return Number(epoch)
}

/**
 * Build Hydra slot configuration for a specific timestamp.
 * @param startTimestamp
 * @param options
 * @returns SlotConfig
 * @description Normally, Hydra uses short epochs (e.g., 432,000 slots) for testing purposes.
 * This function allows you to create a slot configuration starting from a specific timestamp,
 * with customizable options for zeroSlot, slotLength, startEpoch, and epochLength.
 */
export const buildHydraSlotConfig = (
	startTimestamp: number,
	options?: Partial<Omit<SlotConfig, 'zeroTime'>>
): SlotConfig => {
	return {
		zeroTime: startTimestamp,
		zeroSlot: options?.zeroSlot ?? 0,
		slotLength: options?.slotLength ?? 1000,
		startEpoch: options?.startEpoch ?? 0,
		epochLength: options?.epochLength ?? 432000 // Short epochs for Hydra
	}
}
