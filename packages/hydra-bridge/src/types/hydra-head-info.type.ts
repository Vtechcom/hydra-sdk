import { UTxOObject } from '@hydra-sdk/core'
import { HydraHeadTag } from './payload.type'

export type HydraHeadInfo = {
	tag: HydraHeadTag
	contents: {
		headId: string
		headSeed: string
		parameters: {
			contestationPeriod: number
			parties: Array<{
				vkey: string
			}>
		}
		chainState: {
			recordedAt: null | unknown
			spendableUTxO: UTxOObject
		}
		coordinatedHeadState: {
			allTxs: Record<string, unknown>
			confirmedSnapshot: {
				signatures: any
				snapshot: any
				tag: 'ConfirmedSnapshot'
			} | null
		}
		currentDepositTxId: string | null
		decommitTx: string | null
		localTxs: any[]
		localUTxO: UTxOObject
		seenSnapshot: {
			lastSeen: number
			tag: 'LastSeenSnapshot'
		}
		version: number
	}
}
