import { describe, it, expect, beforeEach, vi, afterEach, Mock } from 'vitest'
import { WebsocketConnector, WebsocketConnectorOptions, defaultWsFetcher } from '../../../src/connector/websocket'
import { HydraCommand, HydraHeadTag, HydraPayload } from '../../../src/types/payload.type'
import { HydraBridgeFetcher } from '../../../src/types/fetcher.type'
import { HydraBridgeSubmitter } from '../../../src/types/submitter.type'

// Mock WebSocket
class MockWebSocket {
	static CONNECTING = 0
	static OPEN = 1
	static CLOSING = 2
	static CLOSED = 3

	readyState = MockWebSocket.OPEN
	onopen: ((ev: Event) => any) | null = null
	onmessage: ((ev: MessageEvent) => any) | null = null
	onerror: ((ev: Event) => any) | null = null
	onclose: ((ev: CloseEvent) => any) | null = null

	send = vi.fn()
	close = vi.fn(() => {
		this.readyState = MockWebSocket.CLOSED
		if (this.onclose) {
			this.onclose({} as CloseEvent)
		}
	})

	// Helper to simulate connection
	simulateOpen() {
		this.readyState = MockWebSocket.OPEN
		if (this.onopen) {
			this.onopen({} as Event)
		}
	}

	// Helper to simulate message
	simulateMessage(data: any) {
		if (this.onmessage) {
			this.onmessage({ data: JSON.stringify(data) } as MessageEvent)
		}
	}

	// Helper to simulate error
	simulateError() {
		if (this.onerror) {
			this.onerror({} as Event)
		}
	}
}

// Mock global WebSocket
const originalWebSocket = global.WebSocket
beforeEach(() => {
	;(global as any).WebSocket = MockWebSocket
})

afterEach(() => {
	;(global as any).WebSocket = originalWebSocket
})

// Mock axios
vi.mock('axios', () => ({
	default: {
		create: vi.fn(() => ({
			get: vi.fn().mockResolvedValue({ status: 200, data: {} }),
			post: vi.fn().mockResolvedValue({ status: 200, data: {} })
		}))
	}
}))

describe('WebsocketConnector', () => {
	let connector: WebsocketConnector

	beforeEach(() => {
		connector = new WebsocketConnector({
			websocketUrl: 'ws://localhost:4001'
		})
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	describe('constructor', () => {
		it('should create connector with websocket URL', () => {
			const conn = new WebsocketConnector({
				websocketUrl: 'ws://localhost:4001'
			})

			expect(conn.conn.host).toBe('localhost')
			expect(conn.conn.port).toBe('4001')
			expect(conn.conn.ssl).toBe(false)
		})

		it('should create connector with string URL', () => {
			const conn = new WebsocketConnector('ws://localhost:4001')

			expect(conn.conn.host).toBe('localhost')
		})

		it('should handle wss protocol (SSL)', () => {
			const conn = new WebsocketConnector({
				websocketUrl: 'wss://secure.example.com:443'
			})

			expect(conn.conn.ssl).toBe(true)
			expect(conn.conn.host).toBe('secure.example.com')
		})

		it('should throw error for invalid URL', () => {
			expect(() => {
				new WebsocketConnector({
					websocketUrl: 'http://invalid url with spaces'
				})
			}).toThrow('Invalid websocket url')
		})

		it('should use custom fetcher if provided', () => {
			const customFetcher: HydraBridgeFetcher = {
				queryRawProtocolParameters: vi.fn(),
				querySnapshotUtxo: vi.fn(),
				queryHeadInfo: vi.fn()
			}

			const conn = new WebsocketConnector({
				websocketUrl: 'ws://localhost:4001',
				fetcher: customFetcher
			})

			expect(conn.fetcher).toBe(customFetcher)
		})

		it('should use custom submitter if provided', () => {
			const customSubmitter: HydraBridgeSubmitter = {
				commit: vi.fn(),
				submitCardanoTx: vi.fn(),
				submitTxSync: vi.fn()
			}

			const conn = new WebsocketConnector({
				websocketUrl: 'ws://localhost:4001',
				submitter: customSubmitter
			})

			expect(conn.submitter).toBe(customSubmitter)
		})

		it('should use default fetcher and submitter when not provided', () => {
			const conn = new WebsocketConnector({
				websocketUrl: 'ws://localhost:4001'
			})

			expect(conn.fetcher).toBeDefined()
			expect(conn.submitter).toBeDefined()
		})
	})

	describe('networkInfo', () => {
		it('should return correct socket and http URLs', () => {
			const info = connector.networkInfo

			expect(info.socketUrl).toContain('ws://')
			expect(info.socketUrl).toContain('localhost')
			expect(info.httpUrl).toContain('http://')
			expect(info.httpUrl).toContain('localhost')
		})

		it('should include query params when configured', () => {
			const connWithParams = new WebsocketConnector({
				websocketUrl: 'ws://localhost:4001'
			})
			// Manually set conn options
			connWithParams.conn.noHistory = true
			connWithParams.conn.noSnapshotUtxo = true
			connWithParams.conn.address = 'addr_test1...'

			const info = connWithParams.networkInfo

			expect(info.socketUrl).toContain('history=no')
			expect(info.socketUrl).toContain('snapshot-utxo=no')
			expect(info.socketUrl).toContain('address=addr_test1')
		})
	})

	describe('connect', () => {
		it('should create WebSocket connection', () => {
			connector.connect()

			expect(connector._websocket).toBeDefined()
		})

		it('should close existing connection before creating new one', () => {
			// First connection
			connector.connect()
			const firstWs = connector._websocket as unknown as MockWebSocket

			// Second connection
			connector.connect()

			expect(firstWs.close).toHaveBeenCalled()
		})

		it('should emit onConnected when websocket opens', () => {
			const onConnected = vi.fn()
			connector.eventEmitter.on('onConnected', onConnected)

			connector.connect()
			;(connector._websocket as unknown as MockWebSocket).simulateOpen()

			expect(onConnected).toHaveBeenCalled()
		})

		it('should emit onMessage when message received', () => {
			const onMessage = vi.fn()
			connector.eventEmitter.on('onMessage', onMessage)

			connector.connect()
			;(connector._websocket as unknown as MockWebSocket).simulateOpen()
			;(connector._websocket as unknown as MockWebSocket).simulateMessage({
				tag: HydraHeadTag.Greetings,
				timestamp: new Date().toISOString()
			})

			expect(onMessage).toHaveBeenCalled()
		})

		it('should emit onConnectError on error', () => {
			const onError = vi.fn()
			connector.eventEmitter.on('onConnectError', onError)

			connector.connect()
			;(connector._websocket as unknown as MockWebSocket).simulateError()

			expect(onError).toHaveBeenCalled()
		})

		it('should emit onDisconnected when connection closes', () => {
			const onDisconnected = vi.fn()
			connector.eventEmitter.on('onDisconnected', onDisconnected)

			connector.connect()
			;(connector._websocket as unknown as MockWebSocket).close()

			expect(onDisconnected).toHaveBeenCalled()
		})
	})

	describe('disconnect', () => {
		it('should close WebSocket connection', () => {
			connector.connect()
			const ws = connector._websocket as unknown as MockWebSocket

			connector.disconnect()

			expect(ws.close).toHaveBeenCalled()
			expect(connector._websocket).toBeNull()
		})

		it('should handle disconnect when not connected', () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

			connector.disconnect()

			expect(consoleSpy).toHaveBeenCalledWith('WebSocket connection is not established')
			consoleSpy.mockRestore()
		})
	})

	describe('connected', () => {
		it('should return false when no WebSocket', () => {
			expect(connector.connected()).toBe(false)
		})

		it('should return true when WebSocket is open', () => {
			connector.connect()
			;(connector._websocket as unknown as MockWebSocket).readyState = MockWebSocket.OPEN

			expect(connector.connected()).toBe(true)
		})

		it('should return false when WebSocket is not open', () => {
			connector.connect()
			;(connector._websocket as unknown as MockWebSocket).readyState = MockWebSocket.CLOSED

			expect(connector.connected()).toBe(false)
		})
	})

	describe('sendCommand', () => {
		it('should send command through WebSocket', () => {
			connector.connect()
			;(connector._websocket as unknown as MockWebSocket).readyState = MockWebSocket.OPEN

			connector.sendCommand({
				command: HydraCommand.Init
			})

			expect((connector._websocket as unknown as MockWebSocket).send).toHaveBeenCalledWith(
				JSON.stringify({ tag: HydraCommand.Init })
			)
		})

		it('should include payload in command', () => {
			connector.connect()
			;(connector._websocket as unknown as MockWebSocket).readyState = MockWebSocket.OPEN

			connector.sendCommand({
				command: HydraCommand.NewTx,
				payload: {
					transaction: {
						cborHex: 'abc123',
						description: 'test',
						type: 'Witnessed Tx ConwayEra'
					}
				}
			})

			const expectedPayload = {
				tag: HydraCommand.NewTx,
				transaction: {
					cborHex: 'abc123',
					description: 'test',
					type: 'Witnessed Tx ConwayEra'
				}
			}
			expect((connector._websocket as unknown as MockWebSocket).send).toHaveBeenCalledWith(JSON.stringify(expectedPayload))
		})

		it('should call afterSendCb if provided', () => {
			connector.connect()
			;(connector._websocket as unknown as MockWebSocket).readyState = MockWebSocket.OPEN

			const afterSendCb = vi.fn()
			connector.sendCommand({
				command: HydraCommand.Init,
				afterSendCb
			})

			expect(afterSendCb).toHaveBeenCalled()
		})

		it('should throw error if WebSocket not connected', () => {
			expect(() => {
				connector.sendCommand({
					command: HydraCommand.Init
				})
			}).toThrow('WebSocket connection is not established')
		})
	})

	describe('submitTxSync', () => {
		it('should submit transaction and wait for confirmation', async () => {
			connector.connect()
			;(connector._websocket as unknown as MockWebSocket).readyState = MockWebSocket.OPEN

			const tx = {
				txId: 'tx-123',
				cborHex: 'cbor-hex',
				description: 'test',
				type: 'Witnessed Tx ConwayEra' as const
			}

			const submitPromise = connector.submitTxSync(tx)

			// Simulate TxValid
			;(connector._websocket as unknown as MockWebSocket).simulateMessage({
				tag: HydraHeadTag.TxValid,
				transactionId: 'tx-123'
			})

			// Simulate SnapshotConfirmed
			;(connector._websocket as unknown as MockWebSocket).simulateMessage({
				tag: HydraHeadTag.SnapshotConfirmed,
				snapshot: {
					confirmed: [{ txId: 'tx-123' }]
				}
			})

			const result = await submitPromise

			expect(result.txId).toBe('tx-123')
			expect(result.isValid).toBe(true)
			expect(result.isConfirmed).toBe(true)
		})

		it('should reject on TxInvalid', async () => {
			connector.connect()
			;(connector._websocket as unknown as MockWebSocket).readyState = MockWebSocket.OPEN

			const tx = {
				txId: 'tx-123',
				cborHex: 'cbor-hex',
				description: 'test',
				type: 'Witnessed Tx ConwayEra' as const
			}

			const submitPromise = connector.submitTxSync(tx)

			// Simulate TxInvalid
			;(connector._websocket as unknown as MockWebSocket).simulateMessage({
				tag: HydraHeadTag.TxInvalid,
				transaction: { txId: 'tx-123' },
				validationError: { reason: 'Invalid transaction' }
			})

			await expect(submitPromise).rejects.toMatchObject({
				txId: 'tx-123',
				reason: 'Invalid transaction',
				tag: HydraHeadTag.TxInvalid
			})
		})

		it('should reject on timeout', async () => {
			connector.connect()
			;(connector._websocket as unknown as MockWebSocket).readyState = MockWebSocket.OPEN

			const tx = {
				txId: 'tx-123',
				cborHex: 'cbor-hex',
				description: 'test',
				type: 'Witnessed Tx ConwayEra' as const
			}

			const submitPromise = connector.submitTxSync(tx, { timeout: 50 })

			await expect(submitPromise).rejects.toMatchObject({
				txId: 'tx-123',
				reason: 'Timeout',
				tag: 'Timeout'
			})
		})
	})
})

describe('defaultWsFetcher', () => {
	let connector: WebsocketConnector
	let fetcher: HydraBridgeFetcher

	beforeEach(() => {
		connector = new WebsocketConnector({
			websocketUrl: 'ws://localhost:4001'
		})
		fetcher = defaultWsFetcher(connector)
	})

	describe('queryRawProtocolParameters', () => {
		it('should fetch protocol parameters', async () => {
			const mockData = {
				txFeeFixed: 155381,
				txFeePerByte: 44
			}
			;(connector.apiFetch.get as Mock).mockResolvedValue({ status: 200, data: mockData })

			const result = await fetcher.queryRawProtocolParameters()

			expect(connector.apiFetch.get).toHaveBeenCalledWith('/protocol-parameters')
			expect(result).toEqual(mockData)
		})

		it('should throw error on non-200 status', async () => {
			;(connector.apiFetch.get as Mock).mockResolvedValue({ status: 500, data: null })

			await expect(fetcher.queryRawProtocolParameters()).rejects.toThrow()
		})
	})

	describe('querySnapshotUtxo', () => {
		it('should fetch snapshot UTxO', async () => {
			const mockData = { 'txhash#0': { address: 'addr...' } }
			;(connector.apiFetch.get as Mock).mockResolvedValue({ status: 200, data: mockData })

			const result = await fetcher.querySnapshotUtxo()

			expect(connector.apiFetch.get).toHaveBeenCalledWith('/snapshot/utxo')
			expect(result).toEqual(mockData)
		})
	})

	describe('queryHeadInfo', () => {
		it('should fetch head info', async () => {
			const mockData = { headId: 'head-123', headStatus: 'Open' }
			;(connector.apiFetch.get as Mock).mockResolvedValue({ status: 200, data: mockData })

			const result = await fetcher.queryHeadInfo()

			expect(connector.apiFetch.get).toHaveBeenCalledWith('/head')
			expect(result).toEqual(mockData)
		})
	})
})
