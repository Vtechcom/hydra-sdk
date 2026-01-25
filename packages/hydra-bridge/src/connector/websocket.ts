import mitt, { Emitter } from 'mitt'
import { HydraBridgeFetcher } from '../types/fetcher.type'
import { HydraBridgeEvents, HydraConnector, HydraConnectorEndpoint } from '../types/hydra-connector.type'
import { HydraBridgeSubmitter } from '../types/submitter.type'
import { HydraCommand, HydraHeadTag, HydraPayload, SnapshotConfirmed } from '../types/payload.type'
import { parseUrl } from '../utils/url-parser'
import axios, { AxiosInstance } from 'axios'
import { RawProtocolParameters } from '../types/protocol-parameters.type'
import { SubmitTxResponse } from '../types/submit-tx.type'
import { deserializeHaskellErrorToJson } from '../utils/haskell-deserialize'
import { CommitResponse } from '../types/commit.type'
import { Transaction } from '../types/transaction.type'
import { buildUrl } from '../utils/url-builder'

export type WebsocketConnectorOptions = {
	websocketUrl: string
	fetcher?: HydraBridgeFetcher
	submitter?: HydraBridgeSubmitter
	history?: boolean
	noSnapshotUtxo?: boolean
	address?: string
}

export const defaultWsFetcher = (connector: WebsocketConnector): HydraBridgeFetcher => {
	return {
		queryRawProtocolParameters: async () => {
			try {
				const rs = await connector.apiFetch.get('/protocol-parameters')
				if (rs.status !== 200) {
					throw new Error('Failed to query protocol parameters')
				}
				return rs.data as RawProtocolParameters
			} catch (error) {
				throw new Error('[HydraBridgeFetcher][QueryProtocolParameters]: ' + error)
			}
		},
		querySnapshotUtxo: async () => {
			try {
				const rs = await connector.apiFetch.get('/snapshot/utxo')
				if (rs.status !== 200) {
					throw new Error('Failed to query snapshot utxo')
				}
				return rs.data
			} catch (error) {
				throw new Error('[HydraBridgeFetcher][QuerySnapshotUtxo]: ' + error)
			}
		},
		queryHeadInfo: async () => {
			try {
				const rs = await connector.apiFetch.get('/head')
				if (rs.status !== 200) {
					throw new Error('Failed to query head info')
				}
				return rs.data
			} catch (error) {
				throw new Error('[HydraBridgeFetcher][QueryHeadInfo]: ' + error)
			}
		}
	}
}

const defaultWsSubmitter = (connector: WebsocketConnector): HydraBridgeSubmitter => {
	return {
		commit: async data => {
			try {
				const rs = await connector.apiFetch.post('/commit', data)
				if (rs.status !== 200) {
					throw new Error('Failed to commit utxo to hydra node')
				}
				return rs.data as CommitResponse
			} catch (error: any) {
				if (error.response?.data && typeof error.response.data === 'string') {
					// trying to deserialize haskell error
					try {
						const deserializedError = deserializeHaskellErrorToJson(error.response.data)
						throw deserializedError
					} catch (error) {
						console.error('[HydraBridgeSubmitter][Commit][deserializeHaskellErrorToJson]: ', error)
						throw error
					}
				}
				console.error('[HydraBridgeSubmitter][Commit]: ', error)
				throw error
			}
		},
		submitCardanoTx: async data => {
			try {
				const rs = await connector.apiFetch.post('/cardano-transaction', data)
				if (rs.status !== 200) {
					throw new Error('Failed to submit transaction')
				}
				return rs.data as SubmitTxResponse
			} catch (error) {
				console.error('[HydraBridgeSubmitter][SubmitCardanoTransaction]: ', error)
				return null
			}
		},
		async submitTxSync(tx, options = { timeout: 30000 }) {
			return connector.submitTxSync(tx, options)
		}
	}
}

export class WebsocketConnector implements HydraConnector {
	conn: HydraConnectorEndpoint & {
		/**
		 * Specify weather the client wants to receive the full node history. Default is yes.
		 */
		history?: boolean
		/**
		 * Specify weather the client wants see the snapshot utxo. Default is yes.
		 */
		noSnapshotUtxo?: boolean
		/**
		 * Specify whether the client wants see the transaction server outputs filtered by given address.
		 */
		address?: string
	}
	apiFetch: AxiosInstance
	fetcher: HydraBridgeFetcher
	submitter: HydraBridgeSubmitter

	eventEmitter: Emitter<HydraBridgeEvents> = mitt<HydraBridgeEvents>()
	_websocket: WebSocket | null = null

	constructor(options: WebsocketConnectorOptions | string) {
		if (typeof options === 'string') {
			options = {
				websocketUrl: options
			}
		}

		const option = parseUrl(options.websocketUrl)

		if (!option.valid || !option.host) {
			throw new Error('Invalid websocket url')
		}
		this.conn = {
			ssl: option.ssl,
			host: option.host,
			port: option.port,
			path: option.path,
			params: option.params,
			history: options.history,
			noSnapshotUtxo: options.noSnapshotUtxo,
			address: options.address
		}

		const headers = this.conn?.params?.['X-Api-Key']
			? {
					'X-Api-Key': this.conn.params['X-Api-Key']
				}
			: undefined

		this.apiFetch = axios.create({
			baseURL: this.networkInfo.httpUrl,
			timeout: 10000,
			headers
		})

		this.fetcher = options?.fetcher || defaultWsFetcher(this)
		this.submitter = options?.submitter || defaultWsSubmitter(this)
	}

	get networkInfo() {
		const queryParams = {
			...(this.conn?.history ? { history: 'yes' } : {}), //default history=no
			...(this.conn?.noSnapshotUtxo && { 'snapshot-utxo': 'no' }), //default snapshot-utxo=yes
			...(this.conn?.address ? { address: this.conn.address } : {})
		}
		const httpUrl = buildUrl({
			protocol: this.conn.ssl ? 'https' : 'http',
			host: this.conn.host,
			port: this.conn.port,
			path: this.conn.path
		})
		const socketUrl = buildUrl({
			protocol: this.conn.ssl ? 'wss' : 'ws',
			host: this.conn.host,
			port: this.conn.port,
			path: this.conn.path,
			queryParams: Object.assign({}, this.conn.params, queryParams)
		})
		return { socketUrl, httpUrl }
	}

	connect(): void {
		if (this._websocket) {
			this._websocket.close()
			this._websocket = null
		}
		this._websocket = new WebSocket(this.networkInfo.socketUrl)
		this._websocket.onopen = () => {
			this.eventEmitter.emit('onConnected')
			this.fetcher.queryRawProtocolParameters()
		}
		this._websocket.onmessage = (ev: MessageEvent) => {
			this.rawMessageHandler(ev)
		}
		this._websocket.onerror = (ev: Event) => {
			this.eventEmitter.emit('onConnectError', ev)
		}
		this._websocket.onclose = () => {
			this.eventEmitter.emit('onDisconnected')
		}
	}
	disconnect(): void {
		if (this._websocket) {
			this._websocket.close()
			this._websocket = null
		} else {
			console.warn('WebSocket connection is not established')
		}
	}
	connected(): boolean {
		if (!this._websocket) {
			return false
		}
		return this._websocket?.readyState === WebSocket.OPEN
	}
	sendCommand(data: {
		command: HydraCommand
		payload?: Record<string, any>
		afterSendCb?: <T>() => T | Promise<T>
	}): void {
		if (!this._websocket) {
			throw new Error('WebSocket connection is not established')
		}
		const { command, payload, afterSendCb } = data
		const _payload = { tag: command, ...payload }
		this._websocket.send(JSON.stringify(_payload))
		if (afterSendCb) {
			afterSendCb()
		}
	}

	private rawMessageHandler(event: MessageEvent) {
		try {
			const data = event.data
			const payload = JSON.parse(data) as HydraPayload
			// emit event
			this.eventEmitter.emit('onMessage', payload)
		} catch (error) {
			console.error('[⚡ HydraBridge] error', error)
		}
	}

	async submitTxSync(
		tx: Transaction,
		options = { timeout: 30000 }
	): Promise<{
		txId: string
		isValid: boolean
		isConfirmed: boolean
		result: Readonly<SnapshotConfirmed> | null | HydraHeadTag.SnapshotConfirmed
	}> {
		return new Promise((resolve, reject) => {
			const data = {
				txId: tx.txId,
				isValid: false,
				isConfirmed: false,
				result: null as Readonly<SnapshotConfirmed> | null
			}
			const payload = {
				transaction: {
					cborHex: tx.cborHex,
					description: tx.description,
					type: tx.type
				}
			}
			this.sendCommand({
				command: HydraCommand.NewTx,
				payload
			})
			const handler = (payload: HydraPayload) => {
				if (payload.tag === HydraHeadTag.TxValid && payload.transactionId === tx.txId) {
					data.isValid = true
				} else if (payload.tag === HydraHeadTag.TxInvalid && payload.transaction.txId === tx.txId) {
					clearTimeout(txTimeout)
					this.eventEmitter.off('onMessage', handler)
					reject({
						txId: tx.txId,
						reason: payload.validationError.reason,
						tag: payload.tag
					})
				} else if (
					payload.tag === HydraHeadTag.SnapshotConfirmed &&
					payload.snapshot.confirmed.findIndex(tx => tx.txId === tx.txId) !== -1
				) {
					clearTimeout(txTimeout)
					this.eventEmitter.off('onMessage', handler)
					data.isConfirmed = true
					data.result = payload
					resolve(data)
				}
			}
			const txTimeout = setTimeout(() => {
				this.eventEmitter.off('onMessage', handler)
				reject({
					txId: tx.txId,
					reason: 'Timeout',
					tag: 'Timeout'
				})
			}, options.timeout)

			this.eventEmitter.on('onMessage', handler)
		})
	}
}
