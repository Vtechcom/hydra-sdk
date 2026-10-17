import { describe, it, expect, vi, afterEach } from 'vitest'
import {
	buildHydraSlotConfig,
	resolveEpochNo,
	resolveSlotNo,
	slotToBeginUnixTime,
	unixTimeToEnclosingSlot
} from '../../../src/utils/time'
import { SLOT_CONFIG_NETWORK } from '../../../src/constants/time'
import type { Network } from '../../../src/constants'

/**
 * Epoch boundaries derived from each network's genesis, independent of SLOT_CONFIG_NETWORK:
 * - mainnet: Shelley hard fork at slot 4492800 = 2020-07-29T21:44:51Z (epoch 208), 432000 slots/epoch of 1 s
 * - preprod: Shelley starts at epoch 4 = slot 86400 = 2022-06-21T00:00:00Z, 432000 slots/epoch
 * - preview: genesis 2022-10-25T00:00:00Z = slot 0 (epoch 0), 86400 slots/epoch
 */
const EPOCH_STARTS: [Network, string, number, number][] = [
	['MAINNET', '2020-07-29T21:44:51Z', 4492800, 208],
	['MAINNET', '2024-07-28T21:44:51Z', 130636800, 500], // 208 + 292 epochs
	['PREPROD', '2022-06-21T00:00:00Z', 86400, 4],
	['PREPROD', '2023-10-14T00:00:00Z', 41558400, 100], // 4 + 96 epochs of 5 days
	['PREVIEW', '2022-10-25T00:00:00Z', 0, 0],
	['PREVIEW', '2023-02-02T00:00:00Z', 8640000, 100] // 100 epochs of 1 day
]

describe('TimeUtils', () => {
	afterEach(() => {
		vi.useRealTimers()
	})

	describe.each(EPOCH_STARTS)('%s at %s', (network, iso, slot, epoch) => {
		const ms = Date.parse(iso)
		const config = SLOT_CONFIG_NETWORK[network]

		it(`is slot ${slot}, epoch ${epoch}`, () => {
			expect(resolveSlotNo(network, ms)).toBe(String(slot))
			expect(resolveEpochNo(network, ms)).toBe(epoch)
			expect(slotToBeginUnixTime(slot, config)).toBe(ms)
		})

		it('keeps the slot for the rest of that second and the previous epoch 1 ms earlier', () => {
			expect(unixTimeToEnclosingSlot(ms + 999, config)).toBe(slot)
			expect(unixTimeToEnclosingSlot(ms + 1000, config)).toBe(slot + 1)
			if (epoch > config.startEpoch) expect(resolveEpochNo(network, ms - 1)).toBe(epoch - 1)
		})
	})

	it('resolves slot and epoch for Date.now() by default', () => {
		vi.useFakeTimers()
		vi.setSystemTime(Date.parse('2024-07-28T21:44:52Z'))

		expect(resolveSlotNo('MAINNET')).toBe('130636801')
		expect(resolveEpochNo('MAINNET')).toBe(500)
	})

	describe('buildHydraSlotConfig', () => {
		it('starts at slot 0 / epoch 0 with 1 s slots and 432000-slot epochs by default', () => {
			expect(buildHydraSlotConfig(1700000000000)).toEqual({
				zeroTime: 1700000000000,
				zeroSlot: 0,
				slotLength: 1000,
				startEpoch: 0,
				epochLength: 432000
			})
		})

		it('applies overrides and drives the slot conversions', () => {
			const config = buildHydraSlotConfig(1700000000000, {
				zeroSlot: 50,
				slotLength: 2000,
				startEpoch: 5,
				epochLength: 10
			})

			expect(config).toEqual({ zeroTime: 1700000000000, zeroSlot: 50, slotLength: 2000, startEpoch: 5, epochLength: 10 })
			expect(slotToBeginUnixTime(60, config)).toBe(1700000020000)
			expect(unixTimeToEnclosingSlot(1700000021999, config)).toBe(60)
			expect(unixTimeToEnclosingSlot(1699999998000, config)).toBe(49)
		})
	})
})
