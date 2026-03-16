import { UTxOObject } from '@hydra-sdk/core'
import { HydraHeadStatus } from './payload.type'
import { Transaction } from './transaction.type'

export type HydraHeadInfo = {
	/** Reflects the current head state (e.g. "Open", "Closed"). Maps to HydraHeadStatus. */
	tag: HydraHeadStatus
	contents: {
		headId: string
		headSeed: string
		parameters: {
			contestationPeriod: number
			parties: Array<{ vkey: string }>
		}
		chainState: {
			recordedAt: null | unknown
			spendableUTxO: UTxOObject
		}
		coordinatedHeadState: {
			allTxs: Record<string, unknown>
			confirmedSnapshot: {
				signatures: {
					multiSignature: string[]
				}
				snapshot: {
					confirmed: Transaction[]
					headId: string
					number: number
					utxo: UTxOObject
					utxoToCommit: UTxOObject | null
					utxoToDecommit: UTxOObject | null
					version: number
				}
				tag: 'ConfirmedSnapshot'
			} | null
			currentDepositTxId: string | null
			decommitTx: string | null
			localTxs: Transaction[]
			localUTxO: UTxOObject
			seenSnapshot: {
				lastSeen: number
				tag: 'LastSeenSnapshot'
			}
			version: number
		}
	}
}
