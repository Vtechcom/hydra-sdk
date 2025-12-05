import { describe, it, expect, beforeEach, vi, afterEach, Mock } from 'vitest'
import {
	HexcoreConnector,
	HexcoreConnectorOptions,
	defaultHexcoreFetcher,
	defaultHexcoreSubmitter
} from '../../../src/connector/hexcore'
import { HydraCommand, HydraHeadTag, HydraPayload } from '../../../src/types/payload.type'
import { HydraBridgeFetcher } from '../../../src/types/fetcher.type'
import { HydraBridgeSubmitter } from '../../../src/types/submitter.type'
import { Transaction } from '../../../src/types/transaction.type'

// Mock socket.io-client
const mockSocketOn = vi.fn()
const mockSocketEmit = vi.fn()
const mockSocketConnect = vi.fn()
const mockSocketDisconnect = vi.fn()
let mockSocketConnected = false

vi.mock('socket.io-client', () => ({
	io: vi.fn(() => ({
		on: mockSocketOn,
		emit: mockSocketEmit,
		connect: mockSocketConnect,
		disconnect: mockSocketDisconnect,
		get connected() {
			return mockSocketConnected
		}
	}))
}))

// Mock axios
vi.mock('axios', () => ({
	default: {
		create: vi.fn(() => ({
			get: vi.fn().mockResolvedValue({ status: 200, data: { data: {} } }),
			post: vi.fn().mockResolvedValue({ status: 200, data: { data: {} } })
		}))
	}
}))

describe('HexcoreConnector', () => {
	let connector: HexcoreConnector

	beforeEach(() => {
		vi.clearAllMocks()
		mockSocketConnected = false
		connector = new HexcoreConnector('https://api.hexcore.dev')
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	describe('constructor', () => {
		it('should create connector with socket.io URL', () => {
			const conn = new HexcoreConnector('https://api.hexcore.dev')

			expect(conn.conn.host).toBe('api.hexcore.dev')
			expect(conn.conn.ssl).toBe(true)
		})

		it('should create connector with custom namespace', () => {
			const conn = new HexcoreConnector('https://api.hexcore.dev', {
				namespace: 'custom-namespace'
			})

			expect(conn.namespace).toBe('custom-namespace')
		})

		it('should use default namespace "hydra"', () => {
			const conn = new HexcoreConnector('https://api.hexcore.dev')

			expect(conn.namespace).toBe('hydra')
		})

		it('should throw error for invalid URL', () => {
			expect(() => {
				new HexcoreConnector('http://invalid url with spaces')
			}).toThrow('Invalid socket io url')
		})

		it('should use custom fetcher if provided', () => {
			const customFetcher: HydraBridgeFetcher = {
				queryRawProtocolParameters: vi.fn(),
				querySnapshotUtxo: vi.fn(),
				queryHeadInfo: vi.fn()
			}

			const conn = new HexcoreConnector('https://api.hexcore.dev', {
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

			const conn = new HexcoreConnector('https://api.hexcore.dev', {
				submitter: customSubmitter
			})

			expect(conn.submitter).toBe(customSubmitter)
		})

		it('should set up socket.io event handlers', () => {
			new HexcoreConnector('https://api.hexcore.dev')

			expect(mockSocketOn).toHaveBeenCalledWith('connect', expect.any(Function))
			expect(mockSocketOn).toHaveBeenCalledWith('disconnect', expect.any(Function))
			expect(mockSocketOn).toHaveBeenCalledWith('message', expect.any(Function))
			expect(mockSocketOn).toHaveBeenCalledWith('hydra', expect.any(Function))
		})

		it('should handle http URL', () => {
			const conn = new HexcoreConnector('http://localhost:3000')

			expect(conn.conn.ssl).toBe(false)
			expect(conn.conn.host).toBe('localhost')
			expect(conn.conn.port).toBe('3000')
		})
	})

	describe('connect', () => {
		it('should call socketIoClient.connect', () => {
			connector.connect()

			expect(mockSocketConnect).toHaveBeenCalled()
		})

		it('should query protocol parameters on connect', () => {
			const querySpy = vi.spyOn(connector.fetcher, 'queryRawProtocolParameters')

			connector.connect()

			expect(querySpy).toHaveBeenCalled()
		})
	})

	describe('disconnect', () => {
		it('should call socketIoClient.disconnect', () => {
			connector.disconnect()

			expect(mockSocketDisconnect).toHaveBeenCalled()
		})
	})

	describe('connected', () => {
		it('should return socket.io connected state', () => {
			mockSocketConnected = true
			expect(connector.connected()).toBe(true)

			mockSocketConnected = false
			expect(connector.connected()).toBe(false)
		})
	})

	describe('sendCommand', () => {
		it('should emit command through socket.io', () => {
			mockSocketConnected = true

			connector.sendCommand({
				command: HydraCommand.Init
			})

			expect(mockSocketEmit).toHaveBeenCalledWith('hydra', {
				command: 'send_command',
				data: {
					tag: HydraCommand.Init
				}
			})
		})

		it('should include payload in command', () => {
			mockSocketConnected = true

			connector.sendCommand({
				command: HydraCommand.NewTx,
				payload: {
					transaction: { cborHex: 'abc123' }
				}
			})

			expect(mockSocketEmit).toHaveBeenCalledWith('hydra', {
				command: 'send_command',
				data: {
					tag: HydraCommand.NewTx,
					transaction: { cborHex: 'abc123' }
				}
			})
		})

		it('should call afterSendCb if provided', () => {
			mockSocketConnected = true

			const afterSendCb = vi.fn()
			connector.sendCommand({
				command: HydraCommand.Init,
				afterSendCb
			})

			expect(afterSendCb).toHaveBeenCalled()
		})

		it('should throw error if not connected', () => {
			mockSocketConnected = false

			expect(() => {
				connector.sendCommand({
					command: HydraCommand.Init
				})
			}).toThrow('Socket io is not connected')
		})
	})

	describe('event emitter', () => {
		it('should emit onConnected when socket connects', () => {
			const onConnected = vi.fn()
			connector.eventEmitter.on('onConnected', onConnected)

			// Find the connect handler and call it
			const connectCall = mockSocketOn.mock.calls.find(call => call[0] === 'connect')
			if (connectCall) {
				connectCall[1]()
			}

			expect(onConnected).toHaveBeenCalled()
		})

		it('should emit onDisconnected when socket disconnects', () => {
			const onDisconnected = vi.fn()
			connector.eventEmitter.on('onDisconnected', onDisconnected)

			// Find the disconnect handler and call it
			const disconnectCall = mockSocketOn.mock.calls.find(call => call[0] === 'disconnect')
			if (disconnectCall) {
				disconnectCall[1]()
			}

			expect(onDisconnected).toHaveBeenCalled()
		})

		it('should emit onMessage when hydra message received', () => {
			const onMessage = vi.fn()
			connector.eventEmitter.on('onMessage', onMessage)

			// Find the hydra handler and call it
			const hydraCall = mockSocketOn.mock.calls.find(call => call[0] === 'hydra')
			if (hydraCall) {
				hydraCall[1]({
					status: 'success',
					data: { tag: HydraHeadTag.Greetings }
				})
			}

			expect(onMessage).toHaveBeenCalledWith({ tag: HydraHeadTag.Greetings })
		})
	})
})

describe('defaultHexcoreFetcher', () => {
	let connector: HexcoreConnector
	let fetcher: HydraBridgeFetcher

	beforeEach(() => {
		vi.clearAllMocks()
		connector = new HexcoreConnector('https://api.hexcore.dev')
		fetcher = defaultHexcoreFetcher(connector)
	})

	describe('queryRawProtocolParameters', () => {
		it('should fetch protocol parameters', async () => {
			const mockData = {
				txFeeFixed: 155381,
				txFeePerByte: 44
			}
			;(connector.apiFetch.get as Mock).mockResolvedValue({ data: { data: mockData } })

			const result = await fetcher.queryRawProtocolParameters()

			expect(connector.apiFetch.get).toHaveBeenCalledWith('/hydra/protocol-parameters')
			expect(result).toEqual(mockData)
		})

		it('should throw error when no data returned', async () => {
			;(connector.apiFetch.get as Mock).mockResolvedValue({ data: {} })

			await expect(fetcher.queryRawProtocolParameters()).rejects.toThrow()
		})
	})

	describe('querySnapshotUtxo', () => {
		it('should fetch snapshot UTxO', async () => {
			const mockData = { 'txhash#0': { address: 'addr...' } }
			;(connector.apiFetch.get as Mock).mockResolvedValue({ data: { data: mockData } })

			const result = await fetcher.querySnapshotUtxo()

			expect(connector.apiFetch.get).toHaveBeenCalledWith('/hydra/snapshot/utxo')
			expect(result).toEqual(mockData)
		})

		it('should return empty object if no data', async () => {
			;(connector.apiFetch.get as Mock).mockResolvedValue({ data: {} })

			const result = await fetcher.querySnapshotUtxo()

			expect(result).toEqual({})
		})
	})

	describe('queryHeadInfo', () => {
		it('should fetch head info', async () => {
			const mockData = { headId: 'head-123', headStatus: 'Open' }
			;(connector.apiFetch.get as Mock).mockResolvedValue({ data: { data: mockData } })

			const result = await fetcher.queryHeadInfo()

			expect(connector.apiFetch.get).toHaveBeenCalledWith('/hydra/head')
			expect(result).toEqual(mockData)
		})

		it('should return empty object if no data', async () => {
			;(connector.apiFetch.get as Mock).mockResolvedValue({ data: {} })

			const result = await fetcher.queryHeadInfo()

			expect(result).toEqual({})
		})
	})
})

describe('defaultHexcoreSubmitter', () => {
	let connector: HexcoreConnector
	let submitter: HydraBridgeSubmitter

	beforeEach(() => {
		vi.clearAllMocks()
		connector = new HexcoreConnector('https://api.hexcore.dev')
		submitter = defaultHexcoreSubmitter(connector)
	})

	describe('commit', () => {
		it('should submit commit request', async () => {
			const commitData = {
				'txhash#0': {
					address: 'addr_test1...',
					datum: null,
					datumhash: null,
					inlineDatum: null,
					referenceScript: null,
					value: { lovelace: 1000000 }
				}
			}
			const mockResponse = { txId: 'commit-tx-id' }
			;(connector.apiFetch.post as Mock).mockResolvedValue({ data: mockResponse })

			const result = await submitter.commit(commitData)

			expect(connector.apiFetch.post).toHaveBeenCalledWith('/hydra/commit', {
				type: 'simple',
				data: {
					utxo: commitData
				}
			})
			expect(result).toEqual(mockResponse)
		})

		it('should throw error on failure', async () => {
			;(connector.apiFetch.post as Mock).mockRejectedValue(new Error('Network error'))

			await expect(submitter.commit({})).rejects.toThrow()
		})
	})

	describe('submitCardanoTx', () => {
		it('should submit Cardano transaction', async () => {
			const txData = {
				cborHex: 'abc123',
				description: 'test',
				type: 'Witnessed Tx ConwayEra' as const
			}
			const mockResponse = { txId: 'cardano-tx-id' }
			;(connector.apiFetch.post as Mock).mockResolvedValue({ data: { data: mockResponse } })

			const result = await submitter.submitCardanoTx(txData)

			expect(connector.apiFetch.post).toHaveBeenCalledWith('/hydra/cardano-transaction', txData)
			expect(result).toEqual(mockResponse)
		})
	})

	describe('submitTxSync', () => {
		it('should submit transaction synchronously', async () => {
			const tx: Transaction = {
				txId: 'tx-123',
				cborHex: 'cbor-hex',
				description: 'test',
				type: 'Witnessed Tx ConwayEra'
			}
			const mockResponse = { tag: HydraHeadTag.SnapshotConfirmed }
			;(connector.apiFetch.post as Mock).mockResolvedValue({ data: { data: mockResponse } })

			const result = await submitter.submitTxSync(tx)

			expect(connector.apiFetch.post).toHaveBeenCalledWith('/hydra/submit-tx', tx, { timeout: undefined })
			expect(result.txId).toBe('tx-123')
			expect(result.isValid).toBe(true)
			expect(result.isConfirmed).toBe(true)
		})

		it('should return invalid result when no data returned', async () => {
			const tx: Transaction = {
				txId: 'tx-123',
				cborHex: 'cbor-hex',
				description: 'test',
				type: 'Witnessed Tx ConwayEra'
			}
			;(connector.apiFetch.post as Mock).mockResolvedValue({ data: {} })

			const result = await submitter.submitTxSync(tx)

			expect(result.txId).toBe('tx-123')
			expect(result.isValid).toBe(false)
			expect(result.isConfirmed).toBe(false)
		})

		it('should use custom timeout', async () => {
			const tx: Transaction = {
				txId: 'tx-123',
				cborHex: 'cbor-hex',
				description: 'test',
				type: 'Witnessed Tx ConwayEra'
			}
			;(connector.apiFetch.post as Mock).mockResolvedValue({ data: { data: {} } })

			await submitter.submitTxSync(tx, { timeout: 60000 })

			expect(connector.apiFetch.post).toHaveBeenCalledWith('/hydra/submit-tx', tx, { timeout: 60000 })
		})

		it('should throw error on failure', async () => {
			const tx: Transaction = {
				txId: 'tx-123',
				cborHex: 'cbor-hex',
				description: 'test',
				type: 'Witnessed Tx ConwayEra'
			}
			;(connector.apiFetch.post as Mock).mockRejectedValue(new Error('Network error'))

			await expect(submitter.submitTxSync(tx)).rejects.toThrow()
		})
	})
})
