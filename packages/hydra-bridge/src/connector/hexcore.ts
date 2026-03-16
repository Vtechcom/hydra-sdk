import mitt, { Emitter } from 'mitt'
import { io, ManagerOptions, Socket, SocketOptions } from 'socket.io-client'

import { HydraBridgeEvents, HydraConnector, HydraConnectorEndpoint } from '../types/hydra-connector.type'
import { HydraBridgeFetcher } from '../types/fetcher.type'
import { HydraBridgeSubmitter } from '../types/submitter.type'
import { HydraCommand, HydraHeadTag, HydraPayload } from '../types/payload.type'
import { parseUrl } from '../utils/url-parser'
import axios, { AxiosInstance } from 'axios'
import { RawProtocolParameters } from '../types/protocol-parameters.type'
import { UTxOObject } from '@hydra-sdk/core'
import { CommitBody, CommitResponse } from '../types/commit.type'
import { SubmitTxBody } from '../types/submit-tx.type'
import { Transaction } from '../types/transaction.type'
import { buildUrl } from '../utils/url-builder'

export type HexcoreConnectorOptions = {
	// socketIoUrl: string
	socketIoOptions?: Partial<ManagerOptions & SocketOptions>
	/**
	 * Namespace for socket io. Default is 'hydra'
	 * @default 'hydra'
	 */
	namespace?: string

	fetcher?: HydraBridgeFetcher
	submitter?: HydraBridgeSubmitter
}

export const defaultHexcoreFetcher = (connector: HexcoreConnector): HydraBridgeFetcher => {
	return {
		queryRawProtocolParameters: async () => {
			try {
				const rs = await connector.apiFetch.get('/hydra/protocol-parameters')
				if (!rs.data?.data) {
					throw new Error('Failed to query protocol parameters')
				}
				return rs.data.data as RawProtocolParameters
			} catch (error) {
				throw new Error('[HexcoreConnector][QueryProtocolParameters]: ' + error)
			}
		},
		querySnapshotUtxo: async () => {
			try {
				const rs = await connector.apiFetch.get('/hydra/snapshot/utxo')
				return rs.data?.data || ({} as UTxOObject)
			} catch (error) {
				throw new Error('[HexcoreConnector][QueryProtocolParameters]: ' + error)
			}
		},
		queryHeadInfo: async () => {
			try {
				const rs = await connector.apiFetch.get('/hydra/head')
				return rs.data?.data || {}
			} catch (error) {
				throw new Error('[HexcoreConnector][QueryHeadInfo]: ' + error)
			}
		}
	}
}

export const defaultHexcoreSubmitter = (connector: HexcoreConnector): HydraBridgeSubmitter => {
	return {
		commit: async (data: CommitBody) => {
			try {
				// TODO: Update blueprint case
				const rs = await connector.apiFetch.post('/hydra/commit', {
					type: 'simple',
					data: {
						utxo: data
					}
				})
				return rs.data as CommitResponse
			} catch (error) {
				throw new Error('[HexcoreConnector][QueryProtocolParameters]: ' + error)
			}
		},
		submitCardanoTx: async (data: SubmitTxBody) => {
			try {
				const rs = await connector.apiFetch.post('/hydra/cardano-transaction', data)
				return rs.data.data
			} catch (error) {
				throw new Error('[HexcoreConnector][submitCardanoTx]: ' + error)
			}
		},
		submitTxSync: async (
			tx: Transaction,
			options?: {
				timeout: number
			}
		) => {
			try {
				const rs = await connector.apiFetch.post('/hydra/submit-tx', tx, {
					timeout: options?.timeout
				})
				if (!rs.data.data) {
					return {
						txId: tx.txId,
						isValid: false,
						isConfirmed: false,
						result: null
					}
				}
				return {
					txId: tx.txId,
					isValid: true,
					isConfirmed: true,
					result: rs.data.data as HydraHeadTag.SnapshotConfirmed
				}
			} catch (error) {
				throw new Error('[HexcoreConnector][submitTxSync]: ' + error)
			}
		},
		submitTx(tx, callback, options) {
			connector.apiFetch
				.post('/hydra/submit-tx', tx, { timeout: options?.timeout })
				.then(rs => {
					if (!rs.data.data) {
						callback(null, { txId: tx.txId, isValid: false, isConfirmed: false, result: null })
					} else {
						callback(null, { txId: tx.txId, isValid: true, isConfirmed: true, result: rs.data.data })
					}
				})
				.catch(error => {
					callback({ txId: tx.txId, reason: error.message, tag: 'Error' }, null)
				})
		}
	}
}


export class HexcoreConnector implements HydraConnector {
	conn: HydraConnectorEndpoint
	apiFetch: AxiosInstance

	fetcher: HydraBridgeFetcher
	submitter: HydraBridgeSubmitter

	eventEmitter: Emitter<HydraBridgeEvents> = mitt<HydraBridgeEvents>()
	socketIoClient: Socket
	namespace: string

	/**
	 *
	 * @param socketIoUrl Socket io url, e.g. https://api.hexcore.dev/hydra
	 * @param options
	 */
	constructor(socketIoUrl: string, options?: HexcoreConnectorOptions) {
		const option = parseUrl(socketIoUrl)
		if (!option.valid || !option.host) {
			throw new Error('Invalid socket io url')
		}
		this.conn = {
			ssl: option.ssl,
			host: option.host,
			port: option.port,
			path: option.path
		}

		const httpUrl = buildUrl({
			protocol: this.conn.ssl ? 'https' : 'http',
			host: this.conn.host,
			port: this.conn.port,
			path: this.conn.path
		})
		this.apiFetch = axios.create({
			baseURL: httpUrl,
			timeout: 10000
		})
		this.namespace = options?.namespace || 'hydra'

		this.fetcher = options?.fetcher || defaultHexcoreFetcher(this)
		this.submitter = options?.submitter || defaultHexcoreSubmitter(this)

		this.socketIoClient = io(httpUrl + this.namespace, {
			...options?.socketIoOptions,
			autoConnect: options?.socketIoOptions?.autoConnect || false,
			transports: ['websocket', 'polling']
		})

		this.socketIoClient.on('connect', () => {
			this.eventEmitter.emit('onConnected')
		})

		this.socketIoClient.on('disconnect', () => {
			this.eventEmitter.emit('onDisconnected')
		})

		this.socketIoClient.on('message', (message: any) => {
			console.log('[HexcoreConnector][message]:', message)
		})

		this.socketIoClient.on('hydra', (message: { status: 'success' | 'fail'; data: HydraPayload }) => {
			this.eventEmitter.emit('onMessage', message.data)
		})
	}

	connect(): void {
		this.socketIoClient.connect()
		this.fetcher.queryRawProtocolParameters()
	}

	disconnect(): void {
		this.socketIoClient.disconnect()
	}

	connected(): boolean {
		return this.socketIoClient.connected
	}

	sendCommand(data: {
		command: HydraCommand
		payload?: Record<string, any>
		afterSendCb?: <T>() => T | Promise<T>
	}): void {
		if (!this.connected()) {
			throw new Error('Socket io is not connected')
		}
		this.socketIoClient.emit(this.namespace, {
			command: 'send_command',
			data: {
				tag: data.command,
				...data.payload
			}
		})
		if (data.afterSendCb) {
			data.afterSendCb()
		}
	}
}
