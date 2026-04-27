# API Specification: hydra-bridge

## File: hydra-bridge\src\bridge.ts

### Class: `HydraBridge`
No description available.

**Visibility:** `public` | **Exported:** `true`

#### Constructors
- `constructor(options: InitHydraBridgeOptions) {
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
				// Derive slot-zero timestamp for in-head slot arithmetic
				if (payload.currentSlot !== undefined) {
					const receiveTime = Date.now()
					const slotConfig = TimeUtils.buildHydraSlotConfig(receiveTime, { zeroSlot: payload.currentSlot })
					this.slotZeroTimestamp = TimeUtils.slotToBeginUnixTime(0, slotConfig)
					this.verbose && log(chalk.gray('slotZeroTimestamp set:'), this.slotZeroTimestamp)
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
	}` 

#### Methods
##### `updateSnapshot`
Rebuild address UTxO index + balance cache from a snapshot.
O(n) — called once per snapshot event, not per read.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `snapshot`: `UTxOObject`

**Returns:** `void`

##### `snapshotUtxoArray`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `UTxO`

##### `getAddressBalance`
O(1) balance lookup. Returns null when the cache is not yet seeded
(cold start before first Greetings / SnapshotConfirmed).

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `address`: `string`

**Returns:** `Map<string, bigint>`

##### `connected`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `boolean`

##### `connect`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `Promise<boolean>`

##### `disconnect`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `Promise<boolean>`

##### `headInfo`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `HydraHeadStatus`

##### `sendCommand`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `data`: `HydraCommand`

**Returns:** `void`

##### `commit`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `data`: `CommitBody`

**Returns:** `CommitResponse`

##### `submitCardanoTransaction`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `data`: `SubmitTxBody`

**Returns:** `SubmitTxResponse`

##### `queryRawProtocolParameters`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `RawProtocolParameters`

##### `getProtocolParameters`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `Protocol`

##### `querySnapshotUtxo`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `UTxOObject`

##### `addressesInHead`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `Promise<string[]>`

##### `initHydraHead`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `retry`: `number`
- `interval`: `number`

**Returns:** `Promise<true>`

##### `submitTxSync`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `tx`: `Transaction`
- `options`: `{ timeout: number; }` (optional) - Default: `{ timeout: 30000 }`

**Returns:** `SnapshotConfirmed`

##### `submitTx`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `tx`: `Transaction`
- `callback`: `SubmitTxResult`
- `options`: `{ timeout: number; }` (optional) - Default: `{ timeout: 30000 }`

**Returns:** `void`

##### `decommit`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `{ cborHex, txId, timeout = 30000 }`: `{ cborHex: string; timeout?: number; txId: string; }`

**Returns:** `DecommitApproved`

##### `queryAddressUTxO`
Returns UTxOs for a specific address.
Uses pre-built address index (O(1) lookup) when available.
Falls back to an HTTP snapshot query only on cold start.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `address`: `string`

**Returns:** `UTxO`

---

## File: hydra-bridge\src\utils\url-parser.ts

### Function: `parseUrl`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `input`: `string`

**Returns:** `ParsedUrl`

---

## File: hydra-bridge\src\utils\url-builder.ts

### Function: `buildUrl`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `{
	protocol = 'https',
	host,
	port,
	path = '',
	queryParams = {}
}`: `{ protocol: "http" | "https" | "ws" | "wss"; host: string; port?: string | number; path?: string; queryParams?: Record<string, string>; }`

**Returns:** `string`

---

## File: hydra-bridge\src\utils\haskell-deserialize.ts

### Function: `deserializeHaskellErrorToJson`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `errorStr`: `string`

**Returns:** `JsonResult`

---

## File: hydra-bridge\src\utils\await-hydra-message.ts

### Function: `awaitHydraMessage`
Waits for a Hydra message that satisfies the predicate, then resolves or
rejects accordingly. Automatically unregisters the listener and clears the
timeout regardless of which outcome fires first — no manual cleanup needed.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `emitter`: `HydraBridgeEvents`
- `predicate`: `HydraPayload`
- `timeoutMs`: `number` (optional) - Default: `30_000`
- `timeoutError`: `unknown` (optional) - Default: `{ reason: 'Timeout', tag: 'Timeout' }`

**Returns:** `Promise<T>`

---

## File: hydra-bridge\src\types\protocol-parameters.type.ts

### Function: `toProtocol`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `pp`: `RawProtocolParameters`

**Returns:** `Protocol`

---

## File: hydra-bridge\src\constants\protocol-parameters.ts

### Function: `resolveTxFees`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `txSize`: `number`
- `txFeePerByte`: `number` (optional) - Default: `DEFAULT_RAW_PROTOCOL_PARAMETERS.txFeePerByte`
- `txFeeFixed`: `number` (optional) - Default: `DEFAULT_RAW_PROTOCOL_PARAMETERS.txFeeFixed`

**Returns:** `string`

---

## File: hydra-bridge\src\connector\websocket.ts

### Function: `defaultWsFetcher`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `connector`: `WebsocketConnector`

**Returns:** `HydraBridgeFetcher`

---

### Class: `WebsocketConnector`
No description available.

**Visibility:** `public` | **Exported:** `true`

#### Constructors
- `constructor(options: WebsocketConnectorOptions | string) {
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
	}` 

#### Methods
##### `connect`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `void`

##### `disconnect`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `void`

##### `connected`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `boolean`

##### `sendCommand`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `data`: `HydraCommand`

**Returns:** `void`

##### `rawMessageHandler`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `event`: `MessageEvent<any>`

**Returns:** `void`

##### `submitTxSync`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `tx`: `Transaction`
- `options`: `{ timeout: number; }` (optional) - Default: `{ timeout: 30000 }`

**Returns:** `SnapshotConfirmed`

---

## File: hydra-bridge\src\connector\hexcore.ts

### Function: `defaultHexcoreFetcher`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `connector`: `HexcoreConnector`

**Returns:** `HydraBridgeFetcher`

---

### Function: `defaultHexcoreSubmitter`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `connector`: `HexcoreConnector`

**Returns:** `HydraBridgeSubmitter`

---

### Class: `HexcoreConnector`
No description available.

**Visibility:** `public` | **Exported:** `true`

#### Constructors
- `constructor(socketIoUrl: string, options?: HexcoreConnectorOptions) {
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
	}` 

#### Methods
##### `connect`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `void`

##### `disconnect`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `void`

##### `connected`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `boolean`

##### `sendCommand`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `data`: `HydraCommand`

**Returns:** `void`

---

