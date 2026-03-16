import {
	DecommitApproved,
	HydraCommand,
	HydraHeadStatus,
	HydraHeadTag,
	type HydraPayload,
	type SnapshotConfirmed
} from './types/payload.type'
import type { SubmitTxBody } from './types/submit-tx.type'
import type { CommitBody } from './types/commit.type'
import { toProtocol, type RawProtocolParameters } from './types/protocol-parameters.type'
import { Converter, Protocol, TimeUtils, TxHash, UTxO, UTxOObject } from '@hydra-sdk/core'
import { Transaction } from './types/transaction.type'
import { HydraConnector } from './types/hydra-connector.type'
import { WebsocketConnector } from './connector/websocket'
import { type SubmitTxError, type SubmitTxResult } from './types/submitter.type'

type InitHydraBridgeOptions = {
	verbose?: boolean
} & (
	| {
			/**
			 * Websocket url of hydra node
			 * Using websocket connector
			 */
			url: string
			history?: boolean
			noSnapshotUtxo?: boolean
			address?: string
	  }
	| {
			/**
			 * Custom connector
			 */
			connector: HydraConnector
	  }
)

export type IHydraBridge = {
	connector: HydraConnector

	connect(): Promise<boolean>
	disconnect(): Promise<boolean>
	connected(): boolean

	/** Unix timestamp (ms) of slot 0, derived from the Greetings message. null until first Greetings is received. */
	slotZeroTimestamp: number | null

	events: HydraConnector['eventEmitter']
	headInfo: () => Promise<{
		headId: string | null
		headStatus: HydraHeadStatus
		vkey: string | null
	}>

	commands: {
		init: () => void
		close: () => void
		abort: () => void
		fanout: () => void
		contest: () => void
		recover: (recoverTxId: string) => void
		decommit: (payload: { cborHex: string; txId: string; timeout?: number }) => Promise<unknown>
		initSync?: (retry: number, interval: number) => Promise<unknown>
		newTx: (cborHex: string, description?: string, cb?: () => any) => void
	}

	submitTxSync: (
		tx: Transaction,
		options?: { timeout: number }
	) => Promise<{
		txId: string
		isValid: boolean
		isConfirmed: boolean
		result: Readonly<SnapshotConfirmed> | HydraHeadTag.SnapshotConfirmed | null
	}>

	submitTx: (
		tx: Transaction,
		callback: (error: SubmitTxError | null, result: SubmitTxResult | null) => void,
		options?: { timeout: number }
	) => void
}

export class HydraBridge implements IHydraBridge {
	connector: HydraConnector

	private rawProtocolParameters: RawProtocolParameters | null = null
	private snapshotUTxOObject: UTxOObject = {}
	private eventEmitter: HydraConnector['eventEmitter']

	verbose: boolean = false
	slotZeroTimestamp: number | null = null

	constructor(options: InitHydraBridgeOptions) {
		this.verbose = options.verbose || false
		if ('connector' in options) {
			this.connector = options.connector
		} else {
			this.connector = new WebsocketConnector({
				websocketUrl: options.url,
				history: options.history,
				noSnapshotUtxo: options.noSnapshotUtxo,
				address: options.address
			})
		}
		this.eventEmitter = this.connector.eventEmitter
		this.eventEmitter.on('onConnected', () => {
			this.querySnapshotUtxo()
		})
		this.eventEmitter.on('onMessage', (payload) => {
			if (payload.tag === HydraHeadTag.Greetings && payload.currentSlot !== undefined) {
				const receiveTime = Date.now()
				const slotConfig = TimeUtils.buildHydraSlotConfig(receiveTime, { zeroSlot: payload.currentSlot })
				this.slotZeroTimestamp = TimeUtils.slotToBeginUnixTime(0, slotConfig)
				this.verbose && console.log('[⚡ HydraBridge] slotZeroTimestamp set:', this.slotZeroTimestamp)
			}
		})
	}

	snapshotUtxoArray() {
		const utxos: UTxO[] = Converter.convertUTxOObjectToUTxO(this.snapshotUTxOObject)
		return utxos
	}

	public connected() {
		return this.connector.connected()
	}

	async connect() {
		this.verbose && console.log('[⚡ HydraBridge] Create connection')
		this.connector.connect()
		return new Promise<boolean>((resolve, reject) => {
			const connectedHandler = () => {
				this.verbose && console.log('[⚡ HydraBridge] Connected to Hydra node')
				this.connector.eventEmitter.off('onConnected', connectedHandler)
				resolve(true)
			}
			const disconnectedHandler = () => {
				this.verbose && console.log('[⚡ HydraBridge] Disconnected from Hydra node')
				this.connector.eventEmitter.off('onDisconnected', disconnectedHandler)
				reject(false)
			}
			this.connector.eventEmitter.on('onConnected', connectedHandler)
			this.connector.eventEmitter.on('onDisconnected', disconnectedHandler)
		})
	}

	async disconnect() {
		this.verbose && console.log('[⚡ HydraBridge] disconnect')
		this.connector.disconnect()
		if (this.connector.connected() === false) {
			return Promise.resolve(true)
		}
		return new Promise<boolean>(resolve => {
			const disconnectedHandler = () => {
				this.verbose && console.log('[⚡ HydraBridge] Disconnected from Hydra node')
				resolve(true)
			}
			this.connector.eventEmitter.on('onDisconnected', disconnectedHandler)
		})
	}

	async headInfo() {
		const info = await this.connector.fetcher.queryHeadInfo()
		return {
			headId: info.contents?.headId ?? null,
			headStatus: info.tag as HydraHeadStatus,
			vkey: info.contents?.parameters?.parties[0]?.vkey ?? null
		}
	}

	sendCommand(data: { command: HydraCommand; payload?: Record<string, any>; afterSendCb?: <T>() => T | Promise<T> }) {
		this.connector.sendCommand(data)
	}

	async commit(data: CommitBody) {
		return this.connector.submitter.commit(data)
	}

	async submitCardanoTransaction(data: SubmitTxBody) {
		return this.connector.submitter.submitCardanoTx(data)
	}

	private async queryRawProtocolParameters() {
		try {
			this.rawProtocolParameters = await this.connector.fetcher.queryRawProtocolParameters()
			return this.rawProtocolParameters
		} catch (error) {
			console.error('HydraBridge::: queryRawProtocolParameters error', error)
			throw new Error('Failed to query protocol parameters')
		}
	}

	public async getProtocolParameters(): Promise<Protocol> {
		if (this.rawProtocolParameters) {
			return toProtocol(this.rawProtocolParameters)
		}
		const rawPP = await this.queryRawProtocolParameters()
		return toProtocol(rawPP)
	}

	async querySnapshotUtxo() {
		try {
			const utxo = await this.connector.fetcher.querySnapshotUtxo()
			this.snapshotUTxOObject = utxo
			return utxo
		} catch (error) {
			console.error('HydraBridge::: queryUtxo error', error)
			throw new Error('Failed to query utxo')
		}
	}

	async addressesInHead() {
		await this.querySnapshotUtxo()
		const addresses = this.snapshotUtxoArray().map(utxo => utxo.output.address)
		return Array.from(new Set(addresses))
	}

	get commands() {
		return {
			newTx: (cborHex: string, description = '', cb?: () => any) =>
				this.sendCommand({
					command: HydraCommand.NewTx,
					payload: {
						transaction: {
							cborHex: cborHex,
							description: description,
							type: 'Witnessed Tx ConwayEra'
						}
					},
					afterSendCb: cb
				}),
			init: () =>
				this.sendCommand({
					command: HydraCommand.Init
				}),
			close: () =>
				this.sendCommand({
					command: HydraCommand.Close
				}),
			abort: () =>
				this.sendCommand({
					command: HydraCommand.Abort
				}),
			fanout: () =>
				this.sendCommand({
					command: HydraCommand.Fanout
				}),
			contest: () =>
				this.sendCommand({
					command: HydraCommand.Contest
				}),
			recover: (recoverTxId: string) =>
				this.sendCommand({
					command: HydraCommand.Recover,
					payload: {
						recoverTxId
					}
				}),
			decommit: ({ cborHex, txId, timeout = 30000 }: { cborHex: string; txId: string; timeout?: number }) =>
				this.decommit({ cborHex, txId, timeout }),

			initSync: (retry = 3, interval = 20000) => this.initHydraHead(retry, interval)
		}
	}

	async initHydraHead(retry: number, interval: number) {
		return new Promise((resolve, reject) => {
			this.commands.init()
			this.verbose && console.log('[⚡ HydraBridge] Waiting for head is initializing')

			const handler = (payload: HydraPayload) => {
				if (payload.tag === HydraHeadTag.HeadIsInitializing) {
					this.eventEmitter.off('onMessage', handler)
					clearInterval(retryInterval)
					resolve(true)
				}
			}
			const retryInterval = setInterval(() => {
				if (retry > 0) {
					this.commands.init()
					retry--
					this.verbose && console.log('[⚡ HydraBridge] Retry init remaining: ', retry)
				} else {
					clearInterval(retryInterval)
					this.eventEmitter.off('onMessage', handler)
					reject(new Error('Init timeout'))
				}
			}, interval)
			this.eventEmitter.on('onMessage', handler)
		})
	}

	async submitTxSync(
		tx: Transaction,
		options = { timeout: 30000 }
	): Promise<{
		txId: string
		isValid: boolean
		isConfirmed: boolean
		result: Readonly<SnapshotConfirmed> | HydraHeadTag.SnapshotConfirmed | null
	}> {
		this.verbose && console.log('[⚡ HydraBridge] submitTxSync', tx.txId)
		// Wait for the transaction to be confirmed
		if (!this.connected()) {
			console.warn('[⚡ HydraBridge] Not connected, cannot submit transaction')
			throw new Error('Not connected to Hydra node')
		}
		return this.connector.submitter.submitTxSync(tx, options)
	}

	submitTx(
		tx: Transaction,
		callback: (error: SubmitTxError | null, result: SubmitTxResult | null) => void,
		options = { timeout: 30000 }
	): void {
		this.verbose && console.log('[⚡ HydraBridge] submitTx', tx.txId)
		if (!this.connected()) {
			console.warn('[⚡ HydraBridge] Not connected, cannot submit transaction')
			callback({ txId: tx.txId, reason: 'Not connected to Hydra node', tag: 'Error' }, null)
			return
		}
		this.connector.submitter.submitTx(tx, callback, options)
	}

	async decommit({ cborHex, txId, timeout = 30000 }: { cborHex: string; timeout?: number; txId: string }) {
		return new Promise<Readonly<DecommitApproved>>((resolve, reject) => {
			this.sendCommand({
				command: HydraCommand.Decommit,
				payload: {
					decommitTx: {
						cborHex,
						description: 'Ledger Cddl Format',
						type: 'Witnessed Tx ConwayEra'
					}
				}
			})
			this.verbose && console.log('[⚡ HydraBridge] Waiting for decommit is finalized')
			const handler = (payload: HydraPayload) => {
				if (payload.tag === HydraHeadTag.DecommitApproved && payload.decommitTxId === txId) {
					this.eventEmitter.off('onMessage', handler)
					clearTimeout(txTimeout)
					resolve(payload)
				}
			}
			const txTimeout = setTimeout(() => {
				this.eventEmitter.off('onMessage', handler)
				reject(new Error('Decommit timeout'))
			}, timeout)
			this.eventEmitter.on('onMessage', handler)
		})
	}

	public get events() {
		return this.eventEmitter
	}

	public async queryAddressUTxO(address: string): Promise<UTxO[]> {
		const utxoObj = await this.querySnapshotUtxo()
		const rs = Object.entries(utxoObj)
			.filter(([_txHash, utxo]) => utxo.address === address)
			.reduce((acc, [txHash, utxo]) => {
				acc[txHash as TxHash] = utxo
				return acc
			}, {} as UTxOObject)
		return Converter.convertUTxOObjectToUTxO(rs)
	}
}
