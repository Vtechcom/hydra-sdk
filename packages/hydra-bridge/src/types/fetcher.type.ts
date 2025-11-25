import { UTxOObject } from '@hydra-sdk/core'
import type { RawProtocolParameters } from './protocol-parameters.type'
import { HydraHeadInfo } from './hydra-head-info.type'

export type HydraBridgeFetcher = {
	queryRawProtocolParameters: () => Promise<RawProtocolParameters>
	querySnapshotUtxo: () => Promise<UTxOObject>
	queryHeadInfo: () => Promise<HydraHeadInfo>
}
