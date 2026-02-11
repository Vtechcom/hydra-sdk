import { SLOT_CONFIG_NETWORK, TimeUtils } from '@hydra-sdk/core'
;(async () => {
	const headStartTime = '2026-01-09T08:21:09.146373919Z'
	console.log('> headStartTime:', headStartTime)

	const headStartTimestamp = new Date(headStartTime).getTime()
	console.log('> headStartTimestamp:', headStartTimestamp)

	const slotConfig = TimeUtils.buildHydraSlotConfig(headStartTimestamp)
	console.log('> slotConfig:', slotConfig)

	console.log('Date', new Date(TimeUtils.slotToBeginUnixTime(1874993, slotConfig)))
})()
