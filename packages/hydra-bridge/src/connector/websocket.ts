import mitt, { Emitter } from 'mitt'
import { HydraBridgeFetcher } from '../types/fetcher.type'
import { HydraBridgeEvents, HydraConnector, HydraConnectorEndpoint } from '../types/hydra-connector.type'
import { HydraBridgeSubmitter } from '../types/submitter.type'
import { HydraCommand, HydraHeadTag, HydraPayload, isInvalidInputPayload } from '../types/payload.type'
import { parseUrl } from '../utils/url-parser'
import axios, { AxiosInstance } from 'axios'
import { RawProtocolParameters } from '../types/protocol-parameters.type'
import { SubmitL2TxResponse, SubmitTxResponse } from '../types/submit-tx.type'
import { deserializeHaskellErrorToJson } from '../utils/haskell-deserialize'
import { CommitResponse, PendingDeposit } from '../types/commit.type'
import {
	ConfirmedSnapshotResponse,
	LastSeenSnapshotResponse,
	SideLoadSnapshotBody
} from '../types/hydra-head-info.type'
import { Transaction } from '../types/transaction.type'
import { buildUrl } from '../utils/url-builder'
import { awaitHydraMessage } from '../utils/await-hydra-message'
import { SubmitTxResult } from '../types/submitter.type'

/** Extract an HTTP status from an axios error across axios versions. */
const statusOf = (error: any): number | undefined => error?.response?.status ?? error?.status

/**
 * Default timeout for endpoints that block until the chain confirms.
 *
 * `DELETE /commits/{txId}`, `POST /decommit`, `POST /snapshot` and
 * `POST /transaction` do not answer until the node observes the result, which
 * on a public testnet routinely takes minutes. Matches hydra-node's own
 * `--api-transaction-timeout` default of 300s — a shorter client timeout just
 * abandons a request the node goes on to complete.
 */
export const CHAIN_TIMEOUT_MS = 300_000

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
			} catch (error: any) {
				if (statusOf(error) === 404) {
					console.warn('Snapshot Utxo not found, it might be because the head is not fully initialized yet.')
					return {}
				}
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
		},
		queryConfirmedSnapshot: async (): Promise<ConfirmedSnapshotResponse | null> => {
			try {
				const rs = await connector.apiFetch.get('/snapshot')
				return rs.data
			} catch (error: any) {
				// 404 simply means the head is Idle and has no confirmed snapshot.
				if (statusOf(error) === 404) return null
				throw new Error('[HydraBridgeFetcher][QueryConfirmedSnapshot]: ' + error)
			}
		},
		queryLastSeenSnapshot: async (): Promise<LastSeenSnapshotResponse> => {
			try {
				const rs = await connector.apiFetch.get('/snapshot/last-seen')
				return rs.data
			} catch (error) {
				throw new Error('[HydraBridgeFetcher][QueryLastSeenSnapshot]: ' + error)
			}
		},
		queryPendingDeposits: async (): Promise<PendingDeposit[]> => {
			try {
				const rs = await connector.apiFetch.get('/commits')
				return rs.data ?? []
			} catch (error) {
				throw new Error('[HydraBridgeFetcher][QueryPendingDeposits]: ' + error)
			}
		},
		queryNodeConfig: async (): Promise<Record<string, unknown>> => {
			try {
				const rs = await connector.apiFetch.get('/config')
				return rs.data
			} catch (error: any) {
				// `GET /config` only exists from hydra-node v2.3.0.
				if (statusOf(error) === 400 || statusOf(error) === 404) {
					throw new Error('[HydraBridgeFetcher][QueryNodeConfig]: endpoint requires hydra-node >= 2.3.0')
				}
				throw new Error('[HydraBridgeFetcher][QueryNodeConfig]: ' + error)
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
		},
		submitTx(tx, callback, options = { timeout: 30000 }) {
			connector
				.submitTxSync(tx, options)
				.then(result => callback(null, result))
				.catch(error => callback(error, null))
		},
		submitL2Tx: async (tx: Transaction, options = { timeout: CHAIN_TIMEOUT_MS }): Promise<SubmitL2TxResponse> => {
			try {
				// `SubmitL2TxRequest` is a newtype with `deriving newtype FromJSON`,
				// so the node expects the bare tx envelope — NOT `{ submitL2Tx: … }`.
				const rs = await connector.apiFetch.post(
					'/transaction',
					{ type: tx.type, description: tx.description, cborHex: tx.cborHex, txId: tx.txId },
					{ timeout: options.timeout }
				)
				return rs.data as SubmitL2TxResponse
			} catch (error: any) {
				// A rejected tx is a verdict, not a transport failure: the node
				// answers non-2xx with a tagged `SubmitL2TxResponse`. A malformed
				// body instead yields a bare JSON string, which is a real error.
				const body = error?.response?.data
				if (body && typeof body === 'object' && 'tag' in body) {
					return body as SubmitL2TxResponse
				}
				const detail = typeof body === 'string' ? body : error
				throw new Error('[HydraBridgeSubmitter][SubmitL2Tx]: ' + detail)
			}
		},
		recoverDeposit: async (depositTxId: string, options = { timeout: CHAIN_TIMEOUT_MS }): Promise<string> => {
			try {
				const rs = await connector.apiFetch.delete(`/commits/${encodeURIComponent(depositTxId)}`, {
					timeout: options.timeout
				})
				return rs.data
			} catch (error) {
				throw new Error('[HydraBridgeSubmitter][RecoverDeposit]: ' + error)
			}
		},
		decommit: async (tx: Transaction, options = { timeout: CHAIN_TIMEOUT_MS }) => {
			try {
				const rs = await connector.apiFetch.post(
					'/decommit',
					{ type: tx.type, description: tx.description, cborHex: tx.cborHex, txId: tx.txId },
					{ timeout: options.timeout }
				)
				return rs.data
			} catch (error) {
				throw new Error('[HydraBridgeSubmitter][Decommit]: ' + error)
			}
		},
		sideLoadSnapshot: async (body: SideLoadSnapshotBody, options = { timeout: CHAIN_TIMEOUT_MS }) => {
			try {
				const rs = await connector.apiFetch.post('/snapshot', body, { timeout: options.timeout })
				return rs.data
			} catch (error) {
				throw new Error('[HydraBridgeSubmitter][SideLoadSnapshot]: ' + error)
			}
		}
	}
}

export class WebsocketConnector implements HydraConnector {
	conn: HydraConnectorEndpoint & {
		/**
		 * Specify whether the client wants to receive the full node history. Default is yes.
		 */
		history?: boolean
		/**
		 * Specify whether the client wants see the snapshot utxo. Default is yes.
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
			const parsed = JSON.parse(data)
			// The node sends InvalidInput untagged. Stamp it so consumers can
			// discriminate the whole payload union on `tag`.
			const payload = (
				isInvalidInputPayload(parsed) ? { ...parsed, tag: HydraHeadTag.InvalidInput } : parsed
			) as HydraPayload
			// emit event
			this.eventEmitter.emit('onMessage', payload)
		} catch (error) {
			console.error('[⚡ HydraBridge] error', error)
		}
	}

	async submitTxSync(tx: Transaction, options = { timeout: 30000 }): Promise<SubmitTxResult> {
		this.sendCommand({
			command: HydraCommand.NewTx,
			payload: {
				transaction: {
					cborHex: tx.cborHex,
					description: tx.description,
					type: tx.type
				}
			}
		})

		// TxValid only sets the flag — we keep waiting for SnapshotConfirmed.
		// Closure captures isValid so the final result reflects it correctly.
		let isValid = false

		/**
		 * `CommandFailed` / `RejectedInputBecauseUnsynced` echo back the whole
		 * client input. Only treat them as ours when the echoed NewTx carries our
		 * txId, so a concurrent submit's rejection cannot fail this one.
		 */
		const echoesOurTx = (clientInput: { tag: HydraCommand } & Record<string, unknown>) => {
			if (clientInput?.tag !== HydraCommand.NewTx) return false
			const transaction = clientInput.transaction as { txId?: string } | undefined
			return transaction?.txId === tx.txId
		}

		return awaitHydraMessage<SubmitTxResult>(
			this.eventEmitter,
			payload => {
				if (payload.tag === HydraHeadTag.TxValid && payload.transactionId === tx.txId) {
					isValid = true
					return null
				}
				if (payload.tag === HydraHeadTag.TxInvalid && payload.transaction.txId === tx.txId) {
					return { reject: { txId: tx.txId, reason: payload.validationError.reason, tag: payload.tag } }
				}
				// The node refuses inputs while out of sync (hydra-node >= 1.3.0).
				// Without this the submit would silently hang until timeout.
				if (payload.tag === HydraHeadTag.RejectedInputBecauseUnsynced && echoesOurTx(payload.clientInput)) {
					return {
						reject: {
							txId: tx.txId,
							reason: `Node is out of sync with the chain (drift ${payload.drift}s)`,
							tag: payload.tag
						}
					}
				}
				if (payload.tag === HydraHeadTag.CommandFailed && echoesOurTx(payload.clientInput)) {
					return { reject: { txId: tx.txId, reason: 'Node rejected NewTx', tag: payload.tag } }
				}
				if (
					payload.tag === HydraHeadTag.SnapshotConfirmed &&
					payload.snapshot.confirmed.findIndex(confirmedTx => confirmedTx.txId === tx.txId) !== -1
				) {
					return { resolve: { txId: tx.txId, isValid, isConfirmed: true, result: payload } }
				}
				return null
			},
			options.timeout,
			{ txId: tx.txId, reason: 'Timeout', tag: 'Timeout' }
		)
	}
}
