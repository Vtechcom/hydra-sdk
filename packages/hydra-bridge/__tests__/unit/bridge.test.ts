import { describe, it, expect, beforeEach, vi, afterEach, Mock } from 'vitest'
import { HydraBridge } from '../../src/bridge'
import {
	DecommitApproved,
	HydraCommand,
	HydraHeadStatus,
	HydraHeadTag,
	HydraPayload,
	SnapshotConfirmed
} from '../../src/types/payload.type'
import { HydraConnector, HydraBridgeEvents } from '../../src/types/hydra-connector.type'
import { HydraBridgeFetcher } from '../../src/types/fetcher.type'
import { HydraBridgeSubmitter } from '../../src/types/submitter.type'
import mitt, { Emitter } from 'mitt'
import { Transaction } from '../../src/types/transaction.type'
import { UTxOObject } from '@hydra-sdk/core'

// Mock connector factory
const createMockConnector = (overrides?: Partial<HydraConnector>): HydraConnector => {
	const eventEmitter: Emitter<HydraBridgeEvents> = mitt<HydraBridgeEvents>()
	const mockFetcher: HydraBridgeFetcher = {
		queryRawProtocolParameters: vi.fn().mockResolvedValue({
			txFeeFixed: 155381,
			txFeePerByte: 44,
			maxTxSize: 16384,
			maxBlockBodySize: 90112,
			maxBlockHeaderSize: 1100,
			protocolVersion: { major: 8, minor: 0 },
			maxValueSize: 5000,
			collateralPercentage: 150,
			maxCollateralInputs: 3,
			utxoCostPerByte: 4310,
			stakeAddressDeposit: 2000000,
			stakePoolDeposit: 500000000,
			minPoolCost: 340000000,
			executionUnitPrices: {
				priceMemory: 0.0577,
				priceSteps: 0.0000721
			},
			maxTxExecutionUnits: {
				memory: 14000000,
				steps: 10000000000
			},
			maxBlockExecutionUnits: {
				memory: 62000000,
				steps: 20000000000
			},
			minFeeRefScriptCostPerByte: 15
		}),
		querySnapshotUtxo: vi.fn().mockResolvedValue({
			'txhash123#0': {
				address: 'addr_test1qz...',
				datum: null,
				datumhash: null,
				inlineDatum: null,
				referenceScript: null,
				value: { lovelace: 5000000 }
			}
		} as UTxOObject),
		queryHeadInfo: vi.fn().mockResolvedValue({
			headId: 'test-head-id',
			headStatus: HydraHeadStatus.Open
		})
	}

	const mockSubmitter: HydraBridgeSubmitter = {
		commit: vi.fn().mockResolvedValue({ txId: 'commit-tx-id' }),
		submitCardanoTx: vi.fn().mockResolvedValue({ txId: 'cardano-tx-id' }),
		submitTxSync: vi.fn().mockResolvedValue({
			txId: 'tx-id',
			isValid: true,
			isConfirmed: true,
			result: { tag: HydraHeadTag.SnapshotConfirmed } as SnapshotConfirmed
		})
	}

	return {
		conn: {
			ssl: false,
			host: 'localhost',
			port: 4001,
			path: '/'
		},
		fetcher: mockFetcher,
		submitter: mockSubmitter,
		apiFetch: {} as any,
		eventEmitter,
		connect: vi.fn(),
		disconnect: vi.fn(),
		connected: vi.fn().mockReturnValue(true),
		sendCommand: vi.fn(),
		...overrides
	}
}

describe('HydraBridge', () => {
	let bridge: HydraBridge
	let mockConnector: HydraConnector

	beforeEach(() => {
		mockConnector = createMockConnector()
		bridge = new HydraBridge({
			connector: mockConnector,
			verbose: false
		})
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	describe('constructor', () => {
		it('should create HydraBridge with custom connector', () => {
			const customConnector = createMockConnector()
			const customBridge = new HydraBridge({
				connector: customConnector,
				verbose: true
			})
			expect(customBridge.connector).toBe(customConnector)
			expect(customBridge._verbose).toBe(true)
		})

		it('should create HydraBridge with websocket URL', () => {
			const urlBridge = new HydraBridge({
				url: 'ws://localhost:4001',
				verbose: false
			})
			expect(urlBridge.connector).toBeDefined()
			expect(urlBridge._verbose).toBe(false)
		})

		it('should create HydraBridge with verbose logging', () => {
			const verboseBridge = new HydraBridge({
				connector: mockConnector,
				verbose: true
			})
			expect(verboseBridge._verbose).toBe(true)
		})

		it('should set up onConnected event handler', () => {
			const connector = createMockConnector()
			const onSpy = vi.spyOn(connector.eventEmitter, 'on')

			new HydraBridge({
				connector,
				verbose: false
			})

			expect(onSpy).toHaveBeenCalledWith('onConnected', expect.any(Function))
		})

		it('should create HydraBridge with websocket URL and new options', () => {
			const urlBridge = new HydraBridge({
				url: 'ws://localhost:4001',
				history: true,
				noSnapshotUtxo: true,
				address: 'addr_test1...',
				verbose: false
			})

			expect(urlBridge.connector).toBeDefined()
			// Verify options are passed to connector
			const wsConnector = urlBridge.connector as any
			expect(wsConnector.conn.history).toBe(true)
			expect(wsConnector.conn.noSnapshotUtxo).toBe(true)
			expect(wsConnector.conn.address).toBe('addr_test1...')
		})

		it('should create HydraBridge with only xApiKey params', () => {
			const apiKey = 'my-secret-key'
			const bridge = new HydraBridge({
				url: `ws://localhost:4001?X-Api-Key=${apiKey}`,
				verbose: false
			})

			const wsConnector = bridge.connector as any
			expect(wsConnector.conn.params['X-Api-Key']).toBe(apiKey)
			expect(wsConnector.apiFetch.defaults.headers['X-Api-Key']).toBe(apiKey)
		})
	})

	describe('connected', () => {
		it('should return true when connector is connected', () => {
			;(mockConnector.connected as Mock).mockReturnValue(true)
			expect(bridge.connected()).toBe(true)
		})

		it('should return false when connector is not connected', () => {
			;(mockConnector.connected as Mock).mockReturnValue(false)
			expect(bridge.connected()).toBe(false)
		})
	})

	describe('connect', () => {
		it('should call connector.connect', async () => {
			const connectPromise = bridge.connect()

			// Emit connected event
			mockConnector.eventEmitter.emit('onConnected')

			const result = await connectPromise
			expect(mockConnector.connect).toHaveBeenCalled()
			expect(result).toBe(true)
		})

		it('should reject when disconnected event is received', async () => {
			const connectPromise = bridge.connect()

			// Emit disconnected event
			mockConnector.eventEmitter.emit('onDisconnected')

			await expect(connectPromise).rejects.toBe(false)
		})
	})

	describe('disconnect', () => {
		it('should call connector.disconnect', async () => {
			;(mockConnector.connected as Mock).mockReturnValue(false)
			const result = await bridge.disconnect()
			expect(mockConnector.disconnect).toHaveBeenCalled()
			expect(result).toBe(true)
		})

		it('should wait for disconnected event when still connected', async () => {
			;(mockConnector.connected as Mock).mockReturnValue(true)

			const disconnectPromise = bridge.disconnect()

			// Emit disconnected event
			mockConnector.eventEmitter.emit('onDisconnected')

			const result = await disconnectPromise
			expect(result).toBe(true)
		})
	})

	describe('headInfo', () => {
		it('should return default head info (not implemented)', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
			const info = await bridge.headInfo()

			expect(info).toEqual({
				headId: null,
				headStatus: HydraHeadStatus.Idle,
				vkey: null
			})
			consoleSpy.mockRestore()
		})
	})

	describe('sendCommand', () => {
		it('should call connector.sendCommand with correct data', () => {
			bridge.sendCommand({
				command: HydraCommand.Init,
				payload: { test: 'data' }
			})

			expect(mockConnector.sendCommand).toHaveBeenCalledWith({
				command: HydraCommand.Init,
				payload: { test: 'data' }
			})
		})

		it('should call afterSendCb if provided', () => {
			const afterSendCb = vi.fn()
			bridge.sendCommand({
				command: HydraCommand.Init,
				afterSendCb
			})

			expect(mockConnector.sendCommand).toHaveBeenCalledWith({
				command: HydraCommand.Init,
				afterSendCb
			})
		})
	})

	describe('commit', () => {
		it('should call connector.submitter.commit', async () => {
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
			await bridge.commit(commitData)

			expect(mockConnector.submitter.commit).toHaveBeenCalledWith(commitData)
		})
	})

	describe('submitCardanoTransaction', () => {
		it('should call connector.submitter.submitCardanoTx', async () => {
			const txData = {
				cborHex: 'abc123',
				description: 'Test tx',
				type: 'Witnessed Tx ConwayEra' as const
			}
			await bridge.submitCardanoTransaction(txData)

			expect(mockConnector.submitter.submitCardanoTx).toHaveBeenCalledWith(txData)
		})
	})

	describe('getProtocolParameters', () => {
		it('should fetch and convert protocol parameters', async () => {
			const params = await bridge.getProtocolParameters()

			expect(mockConnector.fetcher.queryRawProtocolParameters).toHaveBeenCalled()
			expect(params).toBeDefined()
		})

		it('should cache protocol parameters', async () => {
			await bridge.getProtocolParameters()
			await bridge.getProtocolParameters()

			// Should only call once due to caching
			expect(mockConnector.fetcher.queryRawProtocolParameters).toHaveBeenCalledTimes(1)
		})

		it('should throw error if fetching fails', async () => {
			;(mockConnector.fetcher.queryRawProtocolParameters as Mock).mockRejectedValue(new Error('Network error'))

			await expect(bridge.getProtocolParameters()).rejects.toThrow('Failed to query protocol parameters')
		})
	})

	describe('querySnapshotUtxo', () => {
		it('should fetch snapshot UTxO', async () => {
			const utxo = await bridge.querySnapshotUtxo()

			expect(mockConnector.fetcher.querySnapshotUtxo).toHaveBeenCalled()
			expect(utxo).toBeDefined()
		})

		it('should throw error if fetching fails', async () => {
			;(mockConnector.fetcher.querySnapshotUtxo as Mock).mockRejectedValue(new Error('Network error'))

			await expect(bridge.querySnapshotUtxo()).rejects.toThrow('Failed to query utxo')
		})
	})

	describe('snapshotUtxoArray', () => {
		it('should convert snapshot UTxO object to array', async () => {
			await bridge.querySnapshotUtxo()
			const utxos = bridge.snapshotUtxoArray()

			expect(Array.isArray(utxos)).toBe(true)
		})
	})

	describe('addressesInHead', () => {
		it('should return unique addresses from snapshot UTxO', async () => {
			;(mockConnector.fetcher.querySnapshotUtxo as Mock).mockResolvedValue({
				'txhash1#0': {
					address: 'addr_test1...',
					datum: null,
					datumhash: null,
					inlineDatum: null,
					referenceScript: null,
					value: { lovelace: 1000000 }
				},
				'txhash2#0': {
					address: 'addr_test1...',
					datum: null,
					datumhash: null,
					inlineDatum: null,
					referenceScript: null,
					value: { lovelace: 2000000 }
				},
				'txhash3#0': {
					address: 'addr_test2...',
					datum: null,
					datumhash: null,
					inlineDatum: null,
					referenceScript: null,
					value: { lovelace: 3000000 }
				}
			} as UTxOObject)

			const addresses = await bridge.addressesInHead()

			expect(addresses).toContain('addr_test1...')
			expect(addresses).toContain('addr_test2...')
			expect(addresses.length).toBe(2) // Should be unique
		})
	})

	describe('commands', () => {
		describe('newTx', () => {
			it('should send NewTx command', () => {
				bridge.commands.newTx('cborHex123', 'description')

				expect(mockConnector.sendCommand).toHaveBeenCalledWith({
					command: HydraCommand.NewTx,
					payload: {
						transaction: {
							cborHex: 'cborHex123',
							description: 'Ledger Cddl Format',
							type: 'Witnessed Tx ConwayEra'
						}
					},
					afterSendCb: undefined
				})
			})

			it('should call callback after sending', () => {
				const cb = vi.fn()
				bridge.commands.newTx('cborHex123', 'description', cb)

				expect(mockConnector.sendCommand).toHaveBeenCalledWith(
					expect.objectContaining({
						command: HydraCommand.NewTx,
						afterSendCb: cb
					})
				)
			})
		})

		describe('init', () => {
			it('should send Init command', () => {
				bridge.commands.init()

				expect(mockConnector.sendCommand).toHaveBeenCalledWith({
					command: HydraCommand.Init
				})
			})
		})

		describe('close', () => {
			it('should send Close command', () => {
				bridge.commands.close()

				expect(mockConnector.sendCommand).toHaveBeenCalledWith({
					command: HydraCommand.Close
				})
			})
		})

		describe('abort', () => {
			it('should send Abort command', () => {
				bridge.commands.abort()

				expect(mockConnector.sendCommand).toHaveBeenCalledWith({
					command: HydraCommand.Abort
				})
			})
		})

		describe('fanout', () => {
			it('should send Fanout command', () => {
				bridge.commands.fanout()

				expect(mockConnector.sendCommand).toHaveBeenCalledWith({
					command: HydraCommand.Fanout
				})
			})
		})

		describe('contest', () => {
			it('should send Contest command', () => {
				bridge.commands.contest()

				expect(mockConnector.sendCommand).toHaveBeenCalledWith({
					command: HydraCommand.Contest
				})
			})
		})

		describe('recover', () => {
			it('should send Recover command with recoverTxId', () => {
				bridge.commands.recover('recover-tx-id-123')

				expect(mockConnector.sendCommand).toHaveBeenCalledWith({
					command: HydraCommand.Recover,
					payload: {
						recoverTxId: 'recover-tx-id-123'
					}
				})
			})
		})

		describe('decommit', () => {
			it('should send Decommit command and wait for approval', async () => {
				const decommitPromise = bridge.commands.decommit({
					cborHex: 'decommit-cbor',
					txId: 'decommit-tx-id',
					timeout: 5000
				})

				// Emit DecommitApproved event
				setTimeout(() => {
					mockConnector.eventEmitter.emit('onMessage', {
						headId: 'head-123',
						decommitTxId: 'decommit-tx-id',
						utxoToDecommit: {
							'txhash#0': {
								address: 'addr_test1...',
								datum: null,
								datumhash: null,
								inlineDatum: null,
								referenceScript: null,
								value: { lovelace: 1000000 }
							}
						},
						seq: 1,
						tag: HydraHeadTag.DecommitApproved
					} as DecommitApproved)
				}, 10)

				const result = await decommitPromise
				expect(result).toBeDefined()
			})

			it('should timeout if DecommitApproved not received', async () => {
				const decommitPromise = bridge.commands.decommit({
					cborHex: 'decommit-cbor',
					txId: 'decommit-tx-id',
					timeout: 50
				})

				await expect(decommitPromise).rejects.toThrow('Decommit timeout')
			})
		})

		describe('initSync', () => {
			it('should send Init command and wait for HeadIsInitializing', async () => {
				const initPromise = bridge.commands.initSync!(1, 100)

				// Emit HeadIsInitializing event
				setTimeout(() => {
					mockConnector.eventEmitter.emit('onMessage', {
						tag: HydraHeadTag.HeadIsInitializing,
						headId: 'head-123',
						timestamp: new Date().toISOString()
					} as HydraPayload)
				}, 10)

				const result = await initPromise
				expect(result).toBe(true)
			})

			it('should retry init on timeout', async () => {
				const initPromise = bridge.commands.initSync!(0, 50)

				await expect(initPromise).rejects.toThrow('Init timeout')
			})
		})
	})

	describe('submitTxSync', () => {
		it('should submit transaction synchronously', async () => {
			const tx: Transaction = {
				txId: 'tx-123',
				cborHex: 'cbor-hex',
				description: 'test tx',
				type: 'Witnessed Tx ConwayEra'
			}

			const result = await bridge.submitTxSync(tx)

			expect(mockConnector.submitter.submitTxSync).toHaveBeenCalledWith(tx, { timeout: 30000 })
			expect(result.txId).toBe('tx-id')
		})

		it('should throw error when not connected', async () => {
			;(mockConnector.connected as Mock).mockReturnValue(false)

			const tx: Transaction = {
				txId: 'tx-123',
				cborHex: 'cbor-hex',
				description: 'test tx',
				type: 'Witnessed Tx ConwayEra'
			}

			await expect(bridge.submitTxSync(tx)).rejects.toThrow('Not connected to Hydra node')
		})

		it('should use custom timeout', async () => {
			const tx: Transaction = {
				txId: 'tx-123',
				cborHex: 'cbor-hex',
				description: 'test tx',
				type: 'Witnessed Tx ConwayEra'
			}

			await bridge.submitTxSync(tx, { timeout: 60000 })

			expect(mockConnector.submitter.submitTxSync).toHaveBeenCalledWith(tx, { timeout: 60000 })
		})
	})

	describe('events', () => {
		it('should return event emitter', () => {
			expect(bridge.events).toBe(mockConnector.eventEmitter)
		})
	})

	describe('queryAddressUTxO', () => {
		it('should filter UTxOs by address', async () => {
			const targetAddress = 'addr_test1target'
			;(mockConnector.fetcher.querySnapshotUtxo as Mock).mockResolvedValue({
				'txhash1#0': {
					address: targetAddress,
					datum: null,
					datumhash: null,
					inlineDatum: null,
					referenceScript: null,
					value: { lovelace: 1000000 }
				},
				'txhash2#0': {
					address: 'addr_test1other',
					datum: null,
					datumhash: null,
					inlineDatum: null,
					referenceScript: null,
					value: { lovelace: 2000000 }
				}
			} as UTxOObject)

			const utxos = await bridge.queryAddressUTxO(targetAddress)

			expect(utxos.length).toBe(1)
			expect(utxos[0].output.address).toBe(targetAddress)
		})

		it('should return empty array if no matching UTxOs', async () => {
			;(mockConnector.fetcher.querySnapshotUtxo as Mock).mockResolvedValue({
				'txhash1#0': {
					address: 'addr_test1other',
					datum: null,
					datumhash: null,
					inlineDatum: null,
					referenceScript: null,
					value: { lovelace: 1000000 }
				}
			} as UTxOObject)

			const utxos = await bridge.queryAddressUTxO('addr_test1nonexistent')

			expect(utxos.length).toBe(0)
		})
	})
})
