import chalk from 'chalk'
import {
	DecommitApproved,
	HydraCommand,
	HydraHeadStatus,
	HydraHeadTag,
	type SyncedStatus
} from './types/payload.type'
import type { SubmitL2TxResponse, SubmitTxBody } from './types/submit-tx.type'
import type { CommitBody, PendingDeposit } from './types/commit.type'
import { toProtocol, type RawProtocolParameters } from './types/protocol-parameters.type'
import { Converter, Protocol, TimeUtils, TxHash, UTxO, UTxOObject } from '@hydra-sdk/core'
import { Transaction } from './types/transaction.type'
import { HydraConnector } from './types/hydra-connector.type'
import { CHAIN_TIMEOUT_MS, WebsocketConnector } from './connector/websocket'
import { type SubmitTxError, type SubmitTxResult } from './types/submitter.type'
import { awaitHydraMessage } from './utils/await-hydra-message'

const TAG = chalk.cyan.bold('[⚡ HydraBridge]')
const log = (...args: unknown[]) => console.log(TAG, ...args)
const warn = (...args: unknown[]) => console.warn(chalk.yellow(TAG), ...args)
const err = (...args: unknown[]) => console.error(chalk.red(TAG), ...args)

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
	/** `hydraNodeVersion` reported in the last Greetings. null before the first Greetings. */
	nodeVersion: string | null
	/** Whether the node considers itself synced with the chain. null before the first report. */
	syncedStatus: SyncedStatus | null

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
		safeClose: () => void
		fanout: () => void
		contest: () => void
		recover: (recoverTxId: string) => void
		decommit: (payload: { cborHex: string; txId: string; timeout?: number }) => Promise<unknown>
		sideLoadSnapshot: (snapshot: unknown) => void
		partialFanout: (utxoToFanout: UTxOObject) => void
		initSync?: (retry: number, interval: number) => Promise<unknown>
		newTx: (cborHex: string, description?: string, cb?: () => any) => void
	}

	submitTxSync: (tx: Transaction, options?: { timeout: number }) => Promise<SubmitTxResult>

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
	nodeVersion: string | null = null
	syncedStatus: SyncedStatus | null = null

	/**
	 * True once {@link slotZeroTimestamp} was derived from a node-supplied
	 * `chainTime`, which is exact. A value derived from `Greetings.currentSlot`
	 * uses local `Date.now()` and carries the network round-trip as error, so it
	 * is allowed to be overwritten; an exact one is not.
	 */
	private slotZeroIsExact = false

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

		this.eventEmitter.on('onMessage', payload => {
			if (payload.tag === HydraHeadTag.Greetings) {
				this.nodeVersion = payload.hydraNodeVersion ?? null
				this.syncedStatus = payload.chainSyncedStatus ?? null

				// Approximate slot zero so in-head slot arithmetic works right away.
				// Superseded by any chainSlot/chainTime pair the node sends later.
				if (payload.currentSlot !== undefined && !this.slotZeroIsExact) {
					this.setSlotZeroFrom(payload.currentSlot, Date.now(), false)
				}
				// Greetings carries snapshotUtxo for free — use it to seed the cache
				// without making an extra HTTP round-trip
				if (this.lastSnapshotNumber === -1 && payload.snapshotUtxo != null) {
					this.updateSnapshot(payload.snapshotUtxo)
					this.verbose && log(chalk.green('snapshot cache seeded from Greetings'))
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
					this.verbose && log(chalk.yellow(`Skipping out-of-order snapshot #${snapNum} (last=${this.lastSnapshotNumber})`))
				}
			} else if (payload.tag === HydraHeadTag.HeadIsOpen) {
				// hydra-node v2 dropped `utxo` from HeadIsOpen, so there is nothing to
				// seed from here — pull the opening snapshot over HTTP instead.
				if (this.lastSnapshotNumber === -1) {
					this.querySnapshotUtxo().catch(() => {})
				}
			} else if (payload.tag === HydraHeadTag.NodeSynced || payload.tag === HydraHeadTag.NodeUnsynced) {
				this.syncedStatus = payload.tag === HydraHeadTag.NodeSynced ? 'InSync' : 'CatchingUp'
				// chainTime is the node's own UTC time for chainSlot — exact, unlike
				// pairing currentSlot with local Date.now().
				this.setSlotZeroFrom(payload.chainSlot, Date.parse(payload.chainTime), true)
				payload.tag === HydraHeadTag.NodeUnsynced &&
					warn(chalk.yellow(`Node is out of sync (drift ${payload.drift}s) — it will reject client inputs`))
			} else if (payload.tag === HydraHeadTag.SyncedStatusReport) {
				this.syncedStatus = payload.synced
				this.setSlotZeroFrom(payload.chainSlot, Date.parse(payload.chainTime), true)
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
					this.verbose && log(chalk.yellow('Max reconnect attempts reached'))
					return
				}
				this.reconnectAttempts++
				this.verbose && log(chalk.yellow(`Reconnect attempt ${this.reconnectAttempts} in ${interval}ms`))
				this.reconnectTimer = setTimeout(() => {
					this.reconnectTimer = null
					this.connector.connect()
				}, interval)
			})
		}
	}

	// ---------------------------------------------------------------------------
	// Slot arithmetic
	// ---------------------------------------------------------------------------

	/**
	 * Anchor slot 0 from a (slot, unix-ms) pair.
	 *
	 * @param exact whether `atUnixMs` came from the node (`chainTime`) rather than
	 * from local wall-clock. An exact anchor is never overwritten by an
	 * approximate one.
	 */
	private setSlotZeroFrom(slot: number, atUnixMs: number, exact: boolean): void {
		if (!Number.isFinite(slot) || !Number.isFinite(atUnixMs)) return
		if (this.slotZeroIsExact && !exact) return

		const slotConfig = TimeUtils.buildHydraSlotConfig(atUnixMs, { zeroSlot: slot })
		this.slotZeroTimestamp = TimeUtils.slotToBeginUnixTime(0, slotConfig)
		this.slotZeroIsExact = exact
		this.verbose &&
			log(chalk.gray(`slotZeroTimestamp set (${exact ? 'exact' : 'approx'}):`), this.slotZeroTimestamp)
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
		this.verbose && log('Create connection')
		this.connector.connect()
		return new Promise<boolean>((resolve, reject) => {
			const connectedHandler = () => {
				this.verbose && log(chalk.green('Connected to Hydra node'))
				this.connector.eventEmitter.off('onConnected', connectedHandler)
				resolve(true)
			}
			const disconnectedHandler = () => {
				this.verbose && log(chalk.red('Connection failed / disconnected'))
				this.connector.eventEmitter.off('onDisconnected', disconnectedHandler)
				reject(false)
			}
			this.connector.eventEmitter.on('onConnected', connectedHandler)
			this.connector.eventEmitter.on('onDisconnected', disconnectedHandler)
		})
	}

	async disconnect() {
		this.verbose && log('Disconnecting')
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
				this.verbose && log(chalk.red('Disconnected'))
				resolve(true)
			}
			this.connector.eventEmitter.on('onDisconnected', disconnectedHandler)
		})
	}

	/**
	 * Head summary from `GET /head`.
	 *
	 * NOTE: `headStatus` here is a `HeadState` tag (`Idle` | `Open` | `Closed`),
	 * which is a narrower set than {@link HydraHeadStatus} — `FanoutPossible` is
	 * only ever reported through `Greetings.headStatus`.
	 *
	 * `vkey` is the FIRST party of the head, not necessarily this node. Use
	 * `Greetings.me.vkey` for that.
	 */
	async headInfo() {
		const info = await this.connector.fetcher.queryHeadInfo()
		const contents = info.tag === 'Idle' ? null : info.contents
		return {
			headId: contents && 'headId' in contents ? contents.headId : null,
			headStatus: info.tag as unknown as HydraHeadStatus,
			vkey: (contents && 'parameters' in contents ? contents.parameters?.parties?.[0]?.vkey : null) ?? null
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
			err('queryRawProtocolParameters error', error)
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

	/**
	 * The node's protocol parameters, unmodified.
	 *
	 * {@link getProtocolParameters} narrows them to the `Protocol` shape used by
	 * `@hydra-sdk/core`, which drops `costModels` and `protocolVersion`. Use this
	 * when you need those — e.g. budgeting Plutus ExUnits, where the cost model
	 * changed with the van Rossem hard fork (PV11).
	 */
	public async getRawProtocolParameters(): Promise<RawProtocolParameters> {
		if (this.rawProtocolParameters) {
			return this.rawProtocolParameters
		}
		return this.queryRawProtocolParameters()
	}

	// ---------------------------------------------------------------------------
	// Incremental commits (deposits)
	// ---------------------------------------------------------------------------

	/**
	 * TxIds of deposits observed on chain but not yet included in a snapshot
	 * (`GET /commits`).
	 *
	 * Deposits stay recoverable here after a head closes, so this is also the way
	 * to find funds to reclaim from a previous head.
	 */
	public async pendingDeposits(): Promise<PendingDeposit[]> {
		const query = this.connector.fetcher.queryPendingDeposits
		if (!query) {
			throw new Error('Connector does not implement queryPendingDeposits (GET /commits)')
		}
		return query()
	}

	/**
	 * Recover a pending deposit back to L1 (`DELETE /commits/{txId}`).
	 *
	 * Falls back to the WebSocket `Recover` command when the connector has no
	 * HTTP implementation. Unlike the command, the HTTP form reports the outcome.
	 */
	public async recoverDeposit(depositTxId: string, options = { timeout: CHAIN_TIMEOUT_MS }): Promise<string | void> {
		const recover = this.connector.submitter.recoverDeposit
		if (recover) {
			return recover(depositTxId, options)
		}
		this.commands.recover(depositTxId)
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
			err('querySnapshotUtxo error', error)
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
			/**
			 * Close the head only if it holds no non-ADA assets. The node answers
			 * with an `InvalidInput` message when assets are present.
			 */
			safeClose: () =>
				this.sendCommand({
					command: HydraCommand.SafeClose
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
			sideLoadSnapshot: (snapshot: unknown) =>
				this.sendCommand({
					command: HydraCommand.SideLoadSnapshot,
					payload: { snapshot }
				}),
			/**
			 * @experimental Requires a hydra-node newer than v2.3.0 (selective
			 * partial fanout, #2750). Older nodes reply with `InvalidInput`.
			 */
			partialFanout: (utxoToFanout: UTxOObject) =>
				this.sendCommand({
					command: HydraCommand.PartialFanout,
					payload: { utxoToFanout }
				}),

			initSync: (retry = 3, interval = 20000) => this.initHydraHead(retry, interval)
		}
	}

	/**
	 * Send `Init` and wait for the head to come up.
	 *
	 * NOTE: hydra-node v2 removed the commit phase (ADR-33) — there is no
	 * `HeadIsInitializing` any more and the head opens directly, so this resolves
	 * on `HeadIsOpen`.
	 */
	async initHydraHead(retry: number, interval: number) {
		this.commands.init()
		this.verbose && log('Waiting for head to open')

		// Retry sender — runs independently of the message wait
		let attemptsLeft = retry
		const retryTimer = setInterval(() => {
			if (attemptsLeft > 0) {
				this.commands.init()
				attemptsLeft--
				this.verbose && log(chalk.yellow(`Retry init — attempts remaining: ${attemptsLeft}`))
			}
		}, interval)

		try {
			return await awaitHydraMessage<true>(
				this.eventEmitter,
				payload => {
					if (payload.tag === HydraHeadTag.HeadIsOpen) return { resolve: true }
					// The node refuses Init while out of sync — fail fast rather than
					// burning every retry against a node that cannot accept it.
					if (
						payload.tag === HydraHeadTag.RejectedInputBecauseUnsynced &&
						payload.clientInput?.tag === HydraCommand.Init
					) {
						return {
							reject: new Error(`Init rejected: node is out of sync with the chain (drift ${payload.drift}s)`)
						}
					}
					return null
				},
				(retry + 1) * interval,
				new Error('Init timeout')
			)
		} finally {
			clearInterval(retryTimer)
		}
	}

	async submitTxSync(tx: Transaction, options = { timeout: 30000 }): Promise<SubmitTxResult> {
		this.verbose && log('submitTxSync', chalk.gray(tx.txId))
		if (!this.connected()) {
			warn('Not connected, cannot submit transaction')
			throw new Error('Not connected to Hydra node')
		}
		return this.connector.submitter.submitTxSync(tx, options)
	}

	/**
	 * Submit an L2 transaction through `POST /transaction` and let the node
	 * report the verdict.
	 *
	 * Prefer this over {@link submitTxSync} when the connector speaks HTTP: the
	 * node decides confirmed/invalid/rejected itself instead of the client racing
	 * WebSocket messages against a timeout.
	 */
	async submitL2Tx(tx: Transaction, options = { timeout: CHAIN_TIMEOUT_MS }): Promise<SubmitL2TxResponse> {
		const submit = this.connector.submitter.submitL2Tx
		if (!submit) {
			throw new Error('Connector does not implement submitL2Tx (POST /transaction)')
		}
		this.verbose && log('submitL2Tx', chalk.gray(tx.txId))
		return submit(tx, options)
	}

	submitTx(
		tx: Transaction,
		callback: (error: SubmitTxError | null, result: SubmitTxResult | null) => void,
		options = { timeout: 30000 }
	): void {
		this.verbose && log('submitTx', chalk.gray(tx.txId))
		if (!this.connected()) {
			warn('Not connected, cannot submit transaction')
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
		this.verbose && log('Waiting for decommit to finalize')

		return awaitHydraMessage<Readonly<DecommitApproved>>(
			this.eventEmitter,
			payload => {
				if (payload.tag === HydraHeadTag.DecommitApproved && payload.decommitTxId === txId) return { resolve: payload }
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
