import {
	DecommitApproved,
	HydraCommand,
	HydraHeadStatus,
	HydraHeadTag,
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
import { awaitHydraMessage } from './utils/await-hydra-message'

type InitHydraBridgeOptions = {
	verbose?: boolean
	/**
	 * Automatically reconnect when the WebSocket connection drops.
	 * @default false
	 */
	autoReconnect?: boolean
	/**
	 * Milliseconds to wait between reconnect attempts.
	 * @default 3000
	 */
	reconnectInterval?: number
	/**
	 * Maximum number of reconnect attempts. 0 = unlimited.
	 * @default 0
	 */
	maxReconnectAttempts?: number
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
	/** Highest snapshot number applied to the cache. -1 until the first snapshot is received. */
	lastSnapshotNumber: number

	events: HydraConnector['eventEmitter']
	headInfo: () => Promise<{
		headId: string | null
		headStatus: HydraHeadStatus
		vkey: string | null
	}>

	/**
	 * O(1) balance lookup from the pre-computed in-memory cache.
	 * Returns null on cold start (cache not yet seeded) — caller should fall back to DB.
	 * Returns an empty Map when the address exists in the head but has no UTxOs.
	 */
	getAddressBalance(address: string): Map<string, bigint> | null

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

	/**
	 * address → TxHash → UTxOValue index.
	 * Rebuilt O(n) once per snapshot — enables O(1) queryAddressUTxO.
	 */
	private readonly addressUtxoIndex = new Map<string, UTxOObject>()

	/**
	 * address → assetUnit → balance (bigint).
	 * Rebuilt alongside addressUtxoIndex. Enables O(1) getAddressBalance.
	 */
	private readonly balanceCache = new Map<string, Map<string, bigint>>()

	/** Highest snapshot number applied to the in-memory cache. -1 = not seeded yet. */
	lastSnapshotNumber = -1

	verbose = false
	slotZeroTimestamp: number | null = null

	private autoReconnectEnabled = false
	private reconnectAttempts = 0
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null

	constructor(options: InitHydraBridgeOptions) {
		this.verbose = options.verbose ?? false
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

		// Seed from onConnected: reset snapshot counter and kick off HTTP fallback
		// (non-blocking; will be skipped if Greetings or SnapshotConfirmed arrives first)
		this.eventEmitter.on('onConnected', () => {
			this.lastSnapshotNumber = -1
			this.reconnectAttempts = 0
			this.querySnapshotUtxo().catch(() => {})
		})

		this.eventEmitter.on('onMessage', (payload) => {
			if (payload.tag === HydraHeadTag.Greetings) {
				// Derive slot-zero timestamp for in-head slot arithmetic
				if (payload.currentSlot !== undefined) {
					const receiveTime = Date.now()
					const slotConfig = TimeUtils.buildHydraSlotConfig(receiveTime, { zeroSlot: payload.currentSlot })
					this.slotZeroTimestamp = TimeUtils.slotToBeginUnixTime(0, slotConfig)
					this.verbose && console.log('[⚡ HydraBridge] slotZeroTimestamp set:', this.slotZeroTimestamp)
				}
				// Greetings carries snapshotUtxo for free — use it to seed the cache
				// without making an extra HTTP round-trip
				if (this.lastSnapshotNumber === -1) {
					this.updateSnapshot(payload.snapshotUtxo)
					this.verbose && console.log('[⚡ HydraBridge] snapshot cache seeded from Greetings')
				}
			} else if (payload.tag === HydraHeadTag.SnapshotConfirmed) {
				// Guard: only advance the cache — never regress on reconnect / out-of-order delivery
				const snapNum = payload.snapshot?.number ?? -1
				if (snapNum > this.lastSnapshotNumber) {
					this.lastSnapshotNumber = snapNum
					if (payload.snapshot?.utxo) {
						this.updateSnapshot(payload.snapshot.utxo)
					}
				} else {
					this.verbose &&
						console.log(
							`[⚡ HydraBridge] Skipping out-of-order snapshot #${snapNum} (last=${this.lastSnapshotNumber})`
						)
				}
			}
		})

		// Auto-reconnect
		if (options.autoReconnect) {
			this.autoReconnectEnabled = true
			const interval = options.reconnectInterval ?? 3000
			const maxAttempts = options.maxReconnectAttempts ?? 0
			this.eventEmitter.on('onDisconnected', () => {
				if (!this.autoReconnectEnabled) return
				if (maxAttempts > 0 && this.reconnectAttempts >= maxAttempts) {
					this.verbose && console.log('[⚡ HydraBridge] Max reconnect attempts reached')
					return
				}
				this.reconnectAttempts++
				this.verbose &&
					console.log(
						`[⚡ HydraBridge] Reconnect attempt ${this.reconnectAttempts} in ${interval}ms`
					)
				this.reconnectTimer = setTimeout(() => {
					this.reconnectTimer = null
					this.connector.connect()
				}, interval)
			})
		}
	}

	// ---------------------------------------------------------------------------
	// Snapshot management
	// ---------------------------------------------------------------------------

	/**
	 * Rebuild address UTxO index + balance cache from a snapshot.
	 * O(n) — called once per snapshot event, not per read.
	 */
	private updateSnapshot(snapshot: UTxOObject): void {
		this.snapshotUTxOObject = snapshot
		this.addressUtxoIndex.clear()
		this.balanceCache.clear()

		// Build address → UTxO sub-object index
		for (const [txHash, utxoValue] of Object.entries(snapshot)) {
			const addr = utxoValue.address
			if (!this.addressUtxoIndex.has(addr)) {
				this.addressUtxoIndex.set(addr, {})
			}
			this.addressUtxoIndex.get(addr)![txHash as TxHash] = utxoValue
		}

		// Build address → asset → balance cache (one conversion pass)
		const utxos = Converter.convertUTxOObjectToUTxO(snapshot)
		for (const utxo of utxos) {
			const addr = utxo.output.address
			let addrMap = this.balanceCache.get(addr)
			if (!addrMap) {
				addrMap = new Map<string, bigint>()
				this.balanceCache.set(addr, addrMap)
			}
			for (const asset of utxo.output.amount) {
				const prev = addrMap.get(asset.unit) ?? 0n
				addrMap.set(asset.unit, prev + BigInt(asset.quantity))
			}
		}
	}

	// ---------------------------------------------------------------------------
	// Public API
	// ---------------------------------------------------------------------------

	snapshotUtxoArray(): UTxO[] {
		return Converter.convertUTxOObjectToUTxO(this.snapshotUTxOObject)
	}

	/**
	 * O(1) balance lookup. Returns null when the cache is not yet seeded
	 * (cold start before first Greetings / SnapshotConfirmed).
	 */
	getAddressBalance(address: string): Map<string, bigint> | null {
		if (this.balanceCache.size === 0) return null
		return this.balanceCache.get(address) ?? new Map()
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
		// Prevent auto-reconnect loop when disconnecting intentionally
		this.autoReconnectEnabled = false
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = null
		}
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
			// Guard: skip HTTP result if a WS snapshot has already been applied.
			// Prevents a slow HTTP response from overwriting fresher WebSocket data.
			if (this.lastSnapshotNumber === -1) {
				this.updateSnapshot(utxo)
			}
			return utxo
		} catch (error) {
			console.error('HydraBridge::: queryUtxo error', error)
			throw new Error('Failed to query utxo')
		}
	}

	async addressesInHead(): Promise<string[]> {
		// Use the pre-built index when available (no HTTP call needed)
		if (this.addressUtxoIndex.size > 0) {
			return Array.from(this.addressUtxoIndex.keys())
		}
		await this.querySnapshotUtxo()
		return Array.from(this.addressUtxoIndex.keys())
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
		this.commands.init()
		this.verbose && console.log('[⚡ HydraBridge] Waiting for head is initializing')

		// Retry sender — runs independently of the message wait
		let attemptsLeft = retry
		const retryTimer = setInterval(() => {
			if (attemptsLeft > 0) {
				this.commands.init()
				attemptsLeft--
				this.verbose && console.log('[⚡ HydraBridge] Retry init remaining: ', attemptsLeft)
			}
		}, interval)

		try {
			return await awaitHydraMessage<true>(
				this.eventEmitter,
				(payload) => {
					if (payload.tag === HydraHeadTag.HeadIsInitializing) return { resolve: true }
					return null
				},
				(retry + 1) * interval,
				new Error('Init timeout')
			)
		} finally {
			clearInterval(retryTimer)
		}
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

		return awaitHydraMessage<Readonly<DecommitApproved>>(
			this.eventEmitter,
			(payload) => {
				if (payload.tag === HydraHeadTag.DecommitApproved && payload.decommitTxId === txId)
					return { resolve: payload }
				return null
			},
			timeout,
			new Error('Decommit timeout')
		)
	}

	public get events() {
		return this.eventEmitter
	}

	/**
	 * Returns UTxOs for a specific address.
	 * Uses pre-built address index (O(1) lookup) when available.
	 * Falls back to an HTTP snapshot query only on cold start.
	 */
	public async queryAddressUTxO(address: string): Promise<UTxO[]> {
		if (this.addressUtxoIndex.size > 0) {
			const utxoObj = this.addressUtxoIndex.get(address) ?? {}
			return Converter.convertUTxOObjectToUTxO(utxoObj)
		}
		// Cold start: fetch from HTTP once to seed the index
		await this.querySnapshotUtxo()
		const utxoObj = this.addressUtxoIndex.get(address) ?? {}
		return Converter.convertUTxOObjectToUTxO(utxoObj)
	}
}
