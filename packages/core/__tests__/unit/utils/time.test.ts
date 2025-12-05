import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
	slotToBeginUnixTime,
	unixTimeToEnclosingSlot,
	resolveSlotNo,
	resolveEpochNo,
	buildHydraSlotConfig
} from '../../../src/utils/time'
import { SLOT_CONFIG_NETWORK, SlotConfig } from '../../../src/constants/time'
import { Network } from '../../../src/constants'

describe('time utilities', () => {
	describe('slotToBeginUnixTime', () => {
		const testConfig: SlotConfig = {
			zeroTime: 1000000,
			zeroSlot: 100,
			slotLength: 1000,
			startEpoch: 0,
			epochLength: 432000
		}

		it('should calculate unix time for a slot', () => {
			const result = slotToBeginUnixTime(150, testConfig)

			// (150 - 100) * 1000 + 1000000 = 50000 + 1000000 = 1050000
			expect(result).toBe(1050000)
		})

		it('should return zeroTime for zeroSlot', () => {
			const result = slotToBeginUnixTime(100, testConfig)

			expect(result).toBe(1000000)
		})

		it('should handle slots before zeroSlot', () => {
			const result = slotToBeginUnixTime(50, testConfig)

			// (50 - 100) * 1000 + 1000000 = -50000 + 1000000 = 950000
			expect(result).toBe(950000)
		})

		it('should work with MAINNET config', () => {
			const mainnetConfig = SLOT_CONFIG_NETWORK.MAINNET
			const result = slotToBeginUnixTime(mainnetConfig.zeroSlot, mainnetConfig)

			expect(result).toBe(mainnetConfig.zeroTime)
		})

		it('should work with PREPROD config', () => {
			const preprodConfig = SLOT_CONFIG_NETWORK.PREPROD
			const slot = preprodConfig.zeroSlot + 1000
			const result = slotToBeginUnixTime(slot, preprodConfig)

			const expected = preprodConfig.zeroTime + 1000 * preprodConfig.slotLength
			expect(result).toBe(expected)
		})

		it('should work with PREVIEW config', () => {
			const previewConfig = SLOT_CONFIG_NETWORK.PREVIEW
			const result = slotToBeginUnixTime(1000, previewConfig)

			// (1000 - 0) * 1000 + zeroTime
			expect(result).toBe(previewConfig.zeroTime + 1000000)
		})

		it('should handle large slot numbers', () => {
			const result = slotToBeginUnixTime(1000000, testConfig)

			// (1000000 - 100) * 1000 + 1000000
			expect(result).toBe(999900 * 1000 + 1000000)
		})
	})

	describe('unixTimeToEnclosingSlot', () => {
		const testConfig: SlotConfig = {
			zeroTime: 1000000,
			zeroSlot: 100,
			slotLength: 1000,
			startEpoch: 0,
			epochLength: 432000
		}

		it('should calculate slot from unix time', () => {
			const result = unixTimeToEnclosingSlot(1050000, testConfig)

			// (1050000 - 1000000) / 1000 + 100 = 50 + 100 = 150
			expect(result).toBe(150)
		})

		it('should return zeroSlot for zeroTime', () => {
			const result = unixTimeToEnclosingSlot(1000000, testConfig)

			expect(result).toBe(100)
		})

		it('should handle times before zeroTime', () => {
			const result = unixTimeToEnclosingSlot(950000, testConfig)

			// (950000 - 1000000) / 1000 + 100 = -50 + 100 = 50
			expect(result).toBe(50)
		})

		it('should floor partial slots', () => {
			// Time is in the middle of a slot
			const result = unixTimeToEnclosingSlot(1050500, testConfig)

			// (1050500 - 1000000) / 1000 + 100 = floor(50.5) + 100 = 150
			expect(result).toBe(150)
		})

		it('should work with MAINNET config', () => {
			const mainnetConfig = SLOT_CONFIG_NETWORK.MAINNET
			const result = unixTimeToEnclosingSlot(mainnetConfig.zeroTime, mainnetConfig)

			expect(result).toBe(mainnetConfig.zeroSlot)
		})

		it('should work with PREVIEW config', () => {
			const previewConfig = SLOT_CONFIG_NETWORK.PREVIEW
			const result = unixTimeToEnclosingSlot(previewConfig.zeroTime + 1000000, previewConfig)

			expect(result).toBe(1000)
		})

		it('should be inverse of slotToBeginUnixTime', () => {
			const originalSlot = 500
			const unixTime = slotToBeginUnixTime(originalSlot, testConfig)
			const result = unixTimeToEnclosingSlot(unixTime, testConfig)

			expect(result).toBe(originalSlot)
		})
	})

	describe('resolveSlotNo', () => {
		beforeEach(() => {
			vi.useFakeTimers()
		})

		afterEach(() => {
			vi.useRealTimers()
		})

		it('should resolve slot for MAINNET', () => {
			const fixedTime = SLOT_CONFIG_NETWORK.MAINNET.zeroTime + 10000000
			vi.setSystemTime(fixedTime)

			const result = resolveSlotNo('MAINNET' as Network)

			const expected = unixTimeToEnclosingSlot(fixedTime, SLOT_CONFIG_NETWORK.MAINNET)
			expect(result).toBe(expected.toString())
		})

		it('should resolve slot for PREPROD', () => {
			const fixedTime = SLOT_CONFIG_NETWORK.PREPROD.zeroTime + 5000000
			vi.setSystemTime(fixedTime)

			const result = resolveSlotNo('PREPROD' as Network)

			const expected = unixTimeToEnclosingSlot(fixedTime, SLOT_CONFIG_NETWORK.PREPROD)
			expect(result).toBe(expected.toString())
		})

		it('should resolve slot for PREVIEW', () => {
			const fixedTime = SLOT_CONFIG_NETWORK.PREVIEW.zeroTime + 3000000
			vi.setSystemTime(fixedTime)

			const result = resolveSlotNo('PREVIEW' as Network)

			const expected = unixTimeToEnclosingSlot(fixedTime, SLOT_CONFIG_NETWORK.PREVIEW)
			expect(result).toBe(expected.toString())
		})

		it('should use provided timestamp instead of Date.now()', () => {
			const customTime = SLOT_CONFIG_NETWORK.MAINNET.zeroTime + 1000000000

			const result = resolveSlotNo('MAINNET' as Network, customTime)

			const expected = unixTimeToEnclosingSlot(customTime, SLOT_CONFIG_NETWORK.MAINNET)
			expect(result).toBe(expected.toString())
		})

		it('should return string type', () => {
			const result = resolveSlotNo('MAINNET' as Network, Date.now())

			expect(typeof result).toBe('string')
		})

		it('should produce consistent results for same timestamp', () => {
			const timestamp = Date.now()

			const result1 = resolveSlotNo('MAINNET' as Network, timestamp)
			const result2 = resolveSlotNo('MAINNET' as Network, timestamp)

			expect(result1).toBe(result2)
		})
	})

	describe('resolveEpochNo', () => {
		beforeEach(() => {
			vi.useFakeTimers()
		})

		afterEach(() => {
			vi.useRealTimers()
		})

		it('should resolve epoch for MAINNET', () => {
			const config = SLOT_CONFIG_NETWORK.MAINNET
			// Set time to be a few epochs after start
			const epochOffset = 10
			const msPerEpoch = config.epochLength * 1000
			const fixedTime = config.zeroTime + epochOffset * msPerEpoch
			vi.setSystemTime(fixedTime)

			const result = resolveEpochNo('MAINNET' as Network)

			// Expected: (fixedTime - zeroTime) / 1000 / epochLength + startEpoch
			expect(result).toBe(config.startEpoch + epochOffset)
		})

		it('should resolve epoch for PREPROD', () => {
			const config = SLOT_CONFIG_NETWORK.PREPROD
			const epochOffset = 5
			const msPerEpoch = config.epochLength * 1000
			const fixedTime = config.zeroTime + epochOffset * msPerEpoch

			const result = resolveEpochNo('PREPROD' as Network, fixedTime)

			expect(result).toBe(config.startEpoch + epochOffset)
		})

		it('should resolve epoch for PREVIEW', () => {
			const config = SLOT_CONFIG_NETWORK.PREVIEW
			const epochOffset = 3
			const msPerEpoch = config.epochLength * 1000
			const fixedTime = config.zeroTime + epochOffset * msPerEpoch

			const result = resolveEpochNo('PREVIEW' as Network, fixedTime)

			expect(result).toBe(config.startEpoch + epochOffset)
		})

		it('should return startEpoch at zeroTime', () => {
			const config = SLOT_CONFIG_NETWORK.MAINNET

			const result = resolveEpochNo('MAINNET' as Network, config.zeroTime)

			expect(result).toBe(config.startEpoch)
		})

		it('should use provided timestamp instead of Date.now()', () => {
			const config = SLOT_CONFIG_NETWORK.MAINNET
			const customTime = config.zeroTime + 100 * config.epochLength * 1000

			const result = resolveEpochNo('MAINNET' as Network, customTime)

			expect(result).toBe(config.startEpoch + 100)
		})

		it('should return number type', () => {
			const result = resolveEpochNo('MAINNET' as Network, Date.now())

			expect(typeof result).toBe('number')
		})

		it('should handle PREVIEW short epochs correctly', () => {
			const config = SLOT_CONFIG_NETWORK.PREVIEW
			// PREVIEW has shorter epochs (86400 seconds)
			const msPerEpoch = config.epochLength * 1000

			const result1 = resolveEpochNo('PREVIEW' as Network, config.zeroTime)
			const result2 = resolveEpochNo('PREVIEW' as Network, config.zeroTime + msPerEpoch)

			expect(result2 - result1).toBe(1)
		})
	})

	describe('buildHydraSlotConfig', () => {
		it('should build slot config with default options', () => {
			const startTimestamp = 1700000000000

			const result = buildHydraSlotConfig(startTimestamp)

			expect(result.zeroTime).toBe(startTimestamp)
			expect(result.zeroSlot).toBe(0)
			expect(result.slotLength).toBe(1000)
			expect(result.startEpoch).toBe(0)
			expect(result.epochLength).toBe(432000)
		})

		it('should allow overriding zeroSlot', () => {
			const startTimestamp = 1700000000000

			const result = buildHydraSlotConfig(startTimestamp, { zeroSlot: 100 })

			expect(result.zeroSlot).toBe(100)
			expect(result.zeroTime).toBe(startTimestamp)
		})

		it('should allow overriding slotLength', () => {
			const startTimestamp = 1700000000000

			const result = buildHydraSlotConfig(startTimestamp, { slotLength: 500 })

			expect(result.slotLength).toBe(500)
		})

		it('should allow overriding startEpoch', () => {
			const startTimestamp = 1700000000000

			const result = buildHydraSlotConfig(startTimestamp, { startEpoch: 10 })

			expect(result.startEpoch).toBe(10)
		})

		it('should allow overriding epochLength', () => {
			const startTimestamp = 1700000000000

			const result = buildHydraSlotConfig(startTimestamp, { epochLength: 100000 })

			expect(result.epochLength).toBe(100000)
		})

		it('should allow overriding multiple options', () => {
			const startTimestamp = 1700000000000

			const result = buildHydraSlotConfig(startTimestamp, {
				zeroSlot: 50,
				slotLength: 2000,
				startEpoch: 5,
				epochLength: 200000
			})

			expect(result.zeroTime).toBe(startTimestamp)
			expect(result.zeroSlot).toBe(50)
			expect(result.slotLength).toBe(2000)
			expect(result.startEpoch).toBe(5)
			expect(result.epochLength).toBe(200000)
		})

		it('should work with Date.now() as timestamp', () => {
			const now = Date.now()

			const result = buildHydraSlotConfig(now)

			expect(result.zeroTime).toBe(now)
		})

		it('should produce config usable with slot functions', () => {
			const startTimestamp = 1700000000000
			const config = buildHydraSlotConfig(startTimestamp)

			// Should be able to use this config with other time functions
			const unixTime = slotToBeginUnixTime(100, config)
			expect(unixTime).toBe(startTimestamp + 100 * 1000)

			const slot = unixTimeToEnclosingSlot(startTimestamp + 50000, config)
			expect(slot).toBe(50)
		})

		it('should handle zero timestamp', () => {
			const result = buildHydraSlotConfig(0)

			expect(result.zeroTime).toBe(0)
		})

		it('should use default 1 second slot length (1000ms)', () => {
			const result = buildHydraSlotConfig(0)

			expect(result.slotLength).toBe(1000)
		})

		it('should use short epoch length suitable for Hydra testing', () => {
			const result = buildHydraSlotConfig(0)

			// Default epoch length is 432000 (5 days worth of slots at 1 slot/second)
			expect(result.epochLength).toBe(432000)
		})
	})

	describe('integration tests', () => {
		it('should round-trip slot -> time -> slot', () => {
			const config = SLOT_CONFIG_NETWORK.MAINNET
			const originalSlot = 50000000

			const unixTime = slotToBeginUnixTime(originalSlot, config)
			const resultSlot = unixTimeToEnclosingSlot(unixTime, config)

			expect(resultSlot).toBe(originalSlot)
		})

		it('should calculate correct slot for known MAINNET timestamp', () => {
			const config = SLOT_CONFIG_NETWORK.MAINNET
			// Shelley start: slot 4492800 at timestamp 1596059091000

			const slot = unixTimeToEnclosingSlot(config.zeroTime, config)

			expect(slot).toBe(config.zeroSlot)
		})

		it('should calculate future slots correctly', () => {
			const config = SLOT_CONFIG_NETWORK.MAINNET
			// 1 day = 86400 seconds = 86400 slots (at 1 slot/second)
			const oneDayMs = 86400 * 1000
			const futureTime = config.zeroTime + oneDayMs

			const slot = unixTimeToEnclosingSlot(futureTime, config)

			expect(slot).toBe(config.zeroSlot + 86400)
		})

		it('should produce consistent results across all networks', () => {
			const networks: Network[] = ['MAINNET', 'PREPROD', 'PREVIEW']
			const fixedTimestamp = Date.now()

			networks.forEach(network => {
				const config = SLOT_CONFIG_NETWORK[network]
				const slot = unixTimeToEnclosingSlot(fixedTimestamp, config)
				const unixTime = slotToBeginUnixTime(slot, config)

				// The reconstructed time should be within one slot length of original
				expect(Math.abs(unixTime - fixedTimestamp)).toBeLessThan(config.slotLength)
			})
		})

		it('should work with custom Hydra config', () => {
			// Simulate a Hydra Head starting now
			const hydraStartTime = Date.now()
			const hydraConfig = buildHydraSlotConfig(hydraStartTime, {
				slotLength: 100, // 100ms slots for fast testing
				epochLength: 1000 // Short epochs
			})

			// After 10 seconds, we should be at slot 100
			const futureTime = hydraStartTime + 10000
			const slot = unixTimeToEnclosingSlot(futureTime, hydraConfig)

			expect(slot).toBe(100)
		})
	})
})
