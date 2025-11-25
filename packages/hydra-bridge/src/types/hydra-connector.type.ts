import { Emitter } from 'mitt'
import { HydraBridgeFetcher } from './fetcher.type'
import { HydraCommand, HydraPayload } from './payload.type'
import { HydraBridgeSubmitter } from './submitter.type'
import { AxiosInstance } from 'axios'

export type HydraBridgeEvents = {
	onMessage: HydraPayload

	onConnectError: any
	onConnected: void
	onDisconnected: void
}

export type HydraConnectorEndpoint = {
	ssl: boolean
	host: string
	path: string
	port?: number | string
}

export type HydraConnector = {
	conn: HydraConnectorEndpoint
	fetcher: HydraBridgeFetcher
	submitter: HydraBridgeSubmitter
	apiFetch: AxiosInstance

	eventEmitter: Emitter<HydraBridgeEvents>

	connect(): void
	disconnect(): void
	connected(): boolean

	sendCommand(data: {
		command: HydraCommand
		payload?: Record<string, any>
		afterSendCb?: <T>() => T | Promise<T>
	}): void
}
