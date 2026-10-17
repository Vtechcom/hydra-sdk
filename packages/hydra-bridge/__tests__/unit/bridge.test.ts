import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DEFAULT_PROTOCOL_PARAMETERS } from '@hydra-sdk/core'
import { HydraBridge } from '../../src/bridge'
import { CHAIN_TIMEOUT_MS, WebsocketConnector } from '../../src/connector/websocket'
import { HydraCommand, HydraHeadStatus, HydraHeadTag } from '../../src/types/payload.type'
import {
	ADDR_A,
	ADDR_B,
	HEAD_ID,
	POLICY,
	deferred,
	greetings,
	headState,
	mockConnector,
	pp,
	snapshotConfirmed,
	tx,
	utxo,
	utxoSet,
	type MockConnector
} from '../helpers/fixtures'

const NOW = Date.parse('2026-10-17T00:00:00Z')
const flush = () => vi.advanceTimersByTimeAsync(0)

describe('HydraBridge', () => {
	let connector: MockConnector
	let bridge: HydraBridge

	beforeEach(() => {
		vi.useFakeTimers({ now: NOW })
		connector = mockConnector()
		bridge = new HydraBridge({ connector })
	})

	afterEach(() => {
		vi.useRealTimers()
		vi.restoreAllMocks()
	})

	describe('constructor with url', () => {
		it('builds a websocket connector carrying history, snapshot-utxo, address and api key', () => {
			const urlBridge = new HydraBridge({
				url: 'ws://localhost:4001?X-Api-Key=secret',
				history: true,
				noSnapshotUtxo: true,
				address: ADDR_A
			})

			const ws = urlBridge.connector as WebsocketConnector
			expect(ws).toBeInstanceOf(WebsocketConnector)
			expect(ws.networkInfo.socketUrl).toBe(
				`ws://localhost:4001/?X-Api-Key=secret&history=yes&snapshot-utxo=no&address=${ADDR_A}`
			)
			expect(ws.apiFetch.defaults.headers['X-Api-Key']).toBe('secret')
		})
	})

	describe('connect / disconnect', () => {
		it('connect resolves true on onConnected', async () => {
			const p = bridge.connect()
			connector.eventEmitter.emit('onConnected')
			await expect(p).resolves.toBe(true)
		})

		it('connect rejects with false on onDisconnected', async () => {
			const p = bridge.connect()
			connector.eventEmitter.emit('onDisconnected')
			await expect(p).rejects.toBe(false)
		})

		// BUG: connect() only removes the handler that fired; the other one stays
		// registered forever, so every connect() leaks a listener.
		it.fails('connect leaves no handler of its own behind once settled', async () => {
			const before = connector.eventEmitter.all.get('onDisconnected')?.length ?? 0
			const p = bridge.connect()
			connector.eventEmitter.emit('onConnected')
			await p
			expect(connector.eventEmitter.all.get('onDisconnected')?.length ?? 0).toBe(before)
		})

		it('disconnect resolves at once when the connector is already down', async () => {
			connector.connected.mockReturnValue(false)
			await expect(bridge.disconnect()).resolves.toBe(true)
			expect(connector.disconnect).toHaveBeenCalledOnce()
		})

		it('disconnect waits for onDisconnected while the socket is still open', async () => {
			let settled = false
			const p = bridge.disconnect().then(v => (settled = v))
			await flush()
			expect(settled).toBe(false)

			connector.eventEmitter.emit('onDisconnected')
			await p
			expect(settled).toBe(true)
		})
	})

	describe('headInfo', () => {
		it('reports Idle with no head id or vkey', async () => {
			connector.fetcher.queryHeadInfo.mockResolvedValue(headState.idle())
			await expect(bridge.headInfo()).resolves.toEqual({ headId: null, headStatus: HydraHeadStatus.Idle, vkey: null })
		})

		it('reports Open with the head id and the first party vkey', async () => {
			connector.fetcher.queryHeadInfo.mockResolvedValue(headState.open(['alice', 'bob']))
			await expect(bridge.headInfo()).resolves.toEqual({
				headId: HEAD_ID,
				headStatus: HydraHeadStatus.Open,
				vkey: 'alice'
			})
		})
	})

	describe('protocol parameters', () => {
		it('maps node fields onto core Protocol and keeps an in-head zero utxoCostPerByte', async () => {
			connector.fetcher.queryRawProtocolParameters.mockResolvedValue(pp({ txFeePerByte: 44, txFeeFixed: 155381 }))

			const params = await bridge.getProtocolParameters()

			expect(params).toMatchObject({ minFeeA: 44, minFeeB: 155381, maxTxSize: 16384, coinsPerUtxoSize: 0 })
		})

		it('falls back to core defaults for fields the node omits', async () => {
			connector.fetcher.queryRawProtocolParameters.mockResolvedValue({ txFeeFixed: 1, txFeePerByte: 2 })

			const params = await bridge.getProtocolParameters()

			expect(params.maxTxSize).toBe(DEFAULT_PROTOCOL_PARAMETERS.maxTxSize)
			expect(params.minPoolCost).toBe(DEFAULT_PROTOCOL_PARAMETERS.minPoolCost)
		})

		it('queries the node once and serves both shapes from the cache', async () => {
			await bridge.getProtocolParameters()
			const raw = await bridge.getRawProtocolParameters()

			expect(raw.costModels).toEqual(pp().costModels)
			expect(raw.protocolVersion).toEqual({ major: 11, minor: 0 })
			expect(connector.fetcher.queryRawProtocolParameters).toHaveBeenCalledOnce()
		})

		it('wraps a fetch failure and logs it', async () => {
			const error = vi.spyOn(console, 'error').mockImplementation(() => {})
			connector.fetcher.queryRawProtocolParameters.mockRejectedValue(new Error('ECONNREFUSED'))

			await expect(bridge.getProtocolParameters()).rejects.toThrow(/Failed to query protocol parameters/)
			expect(error).toHaveBeenCalledWith(expect.anything(), 'queryRawProtocolParameters error', expect.any(Error))
		})
	})

	describe('snapshot cache', () => {
		const assetUnit = POLICY + '74657374'
		const snapshot = utxoSet(
			utxo(1, ADDR_A, 2_000_000),
			utxo(2, ADDR_A, { lovelace: 3_000_000, [POLICY]: { '74657374': 7 } } as never),
			utxo(3, ADDR_B, 5_000_000)
		)

		it('is cold before any snapshot', () => {
			expect(bridge.getAddressBalance(ADDR_A)).toBeNull()
			expect(bridge.lastSnapshotNumber).toBe(-1)
		})

		it('seeds per-address balances from Greetings without an HTTP call', async () => {
			connector.emit(greetings({ snapshotUtxo: snapshot }))

			expect(bridge.getAddressBalance(ADDR_A)).toEqual(
				new Map([
					['lovelace', 5_000_000n],
					[assetUnit, 7n]
				])
			)
			expect(bridge.getAddressBalance('addr_unknown')).toEqual(new Map())
			expect((await bridge.queryAddressUTxO(ADDR_B)).map(u => u.output.amount)).toEqual([
				[{ unit: 'lovelace', quantity: '5000000' }]
			])
			expect((await bridge.addressesInHead()).sort()).toEqual([ADDR_A, ADDR_B].sort())
			expect(connector.fetcher.querySnapshotUtxo).not.toHaveBeenCalled()
		})

		it('seeds from HTTP on a cold queryAddressUTxO', async () => {
			connector.fetcher.querySnapshotUtxo.mockResolvedValue(snapshot)

			const utxos = await bridge.queryAddressUTxO(ADDR_A)

			expect(utxos.map(u => u.output.amount[0].quantity)).toEqual(['2000000', '3000000'])
			expect(bridge.snapshotUtxoArray()).toHaveLength(3)
		})

		it('replaces the cache on a newer SnapshotConfirmed and ignores an older one', () => {
			connector.emit(snapshotConfirmed(10, utxo(1, ADDR_A, 1_000_000)))
			connector.emit(snapshotConfirmed(5, utxo(9, ADDR_B, 9_000_000)))

			expect(bridge.lastSnapshotNumber).toBe(10)
			expect(bridge.getAddressBalance(ADDR_A)).toEqual(new Map([['lovelace', 1_000_000n]]))
			expect(bridge.getAddressBalance(ADDR_B)).toEqual(new Map())
		})

		it('pulls the opening snapshot over HTTP on HeadIsOpen when not yet seeded', async () => {
			connector.emit({ tag: HydraHeadTag.HeadIsOpen, headId: HEAD_ID, seq: 1, timestamp: '' })
			await flush()

			expect(bridge.getAddressBalance(ADDR_A)).toEqual(new Map([['lovelace', 1_000_000n]]))
		})

		it('does not query HTTP on HeadIsOpen once a snapshot is applied', () => {
			connector.emit(snapshotConfirmed(1, utxo(1, ADDR_A)))
			connector.emit({ tag: HydraHeadTag.HeadIsOpen, headId: HEAD_ID, seq: 2, timestamp: '' })

			expect(connector.fetcher.querySnapshotUtxo).not.toHaveBeenCalled()
		})

		it('wraps an HTTP failure and logs it', async () => {
			const error = vi.spyOn(console, 'error').mockImplementation(() => {})
			connector.fetcher.querySnapshotUtxo.mockRejectedValue(new Error('503'))

			await expect(bridge.querySnapshotUtxo()).rejects.toThrow(/Failed to query utxo/)
			expect(error).toHaveBeenCalledWith(expect.anything(), 'querySnapshotUtxo error', expect.any(Error))
		})
	})

	describe('reconnect and HTTP/WS ordering', () => {
		it('resets the counter on reconnect and re-seeds the cache from HTTP', async () => {
			connector.emit(snapshotConfirmed(10, utxo(1, ADDR_A, 1_000_000)))
			connector.fetcher.querySnapshotUtxo.mockResolvedValue(utxo(2, ADDR_B, 4_000_000))

			connector.eventEmitter.emit('onConnected')
			await flush()

			expect(bridge.lastSnapshotNumber).toBe(-1)
			expect(bridge.getAddressBalance(ADDR_B)).toEqual(new Map([['lovelace', 4_000_000n]]))
			expect(bridge.getAddressBalance(ADDR_A)).toEqual(new Map())
		})

		it('a slow HTTP re-seed does not overwrite or regress a WS snapshot that arrived first', async () => {
			const http = deferred<ReturnType<typeof utxo>>()
			connector.fetcher.querySnapshotUtxo.mockReturnValue(http.promise)

			connector.eventEmitter.emit('onConnected')
			connector.emit(snapshotConfirmed(11, utxo(1, ADDR_A, 1_100_000)))
			http.resolve(utxo(2, ADDR_B, 1))
			await flush()

			expect(bridge.lastSnapshotNumber).toBe(11)
			expect(bridge.getAddressBalance(ADDR_A)).toEqual(new Map([['lovelace', 1_100_000n]]))
			expect(bridge.getAddressBalance(ADDR_B)).toEqual(new Map())
		})

		// BUG: the onConnected comment says the HTTP fallback "will be skipped if
		// Greetings ... arrives first", but seeding from Greetings leaves
		// lastSnapshotNumber at -1, so a late HTTP response still overwrites it.
		it.fails('a slow HTTP re-seed does not overwrite a cache seeded from Greetings', async () => {
			const http = deferred<ReturnType<typeof utxo>>()
			connector.fetcher.querySnapshotUtxo.mockReturnValue(http.promise)

			connector.eventEmitter.emit('onConnected')
			connector.emit(greetings({ snapshotUtxo: utxo(1, ADDR_A, 1_000_000) }))
			http.resolve(utxo(2, ADDR_B, 1))
			await flush()

			expect(bridge.getAddressBalance(ADDR_A)).toEqual(new Map([['lovelace', 1_000_000n]]))
		})
	})

	describe('sync status and slot zero', () => {
		it('takes node version, sync status and an approximate slot zero from Greetings', () => {
			connector.emit(greetings({ currentSlot: 1000, hydraNodeVersion: '2.3.0', chainSyncedStatus: 'CatchingUp' }))

			expect(bridge.nodeVersion).toBe('2.3.0')
			expect(bridge.syncedStatus).toBe('CatchingUp')
			expect(bridge.slotZeroTimestamp).toBe(NOW - 1000 * 1000)
		})

		it('NodeSynced sets InSync and an exact slot zero from chainTime', () => {
			connector.emit({
				tag: HydraHeadTag.NodeSynced,
				chainSlot: 500,
				chainTime: '2026-10-16T00:00:00Z',
				drift: 0,
				seq: 1,
				timestamp: ''
			})

			expect(bridge.syncedStatus).toBe('InSync')
			expect(bridge.slotZeroTimestamp).toBe(Date.parse('2026-10-16T00:00:00Z') - 500 * 1000)
		})

		it('NodeUnsynced sets CatchingUp and warns with the drift', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

			connector.emit({
				tag: HydraHeadTag.NodeUnsynced,
				chainSlot: 500,
				chainTime: '2026-10-16T00:00:00Z',
				drift: 42,
				seq: 1,
				timestamp: ''
			})

			expect(bridge.syncedStatus).toBe('CatchingUp')
			expect(warn).toHaveBeenCalledWith(expect.anything(), expect.stringMatching(/out of sync \(drift 42s\)/))
		})

		it('SyncedStatusReport sets the reported status', () => {
			connector.emit({
				tag: HydraHeadTag.SyncedStatusReport,
				chainSlot: 10,
				chainTime: '2026-10-16T00:00:00Z',
				drift: 3,
				synced: 'CatchingUp'
			})

			expect(bridge.syncedStatus).toBe('CatchingUp')
			expect(bridge.slotZeroTimestamp).toBe(Date.parse('2026-10-16T00:00:00Z') - 10 * 1000)
		})

		it('an exact slot zero is not overwritten by a later Greetings approximation', () => {
			const exact = Date.parse('2026-10-16T00:00:00Z') - 500 * 1000
			connector.emit({
				tag: HydraHeadTag.SyncedStatusReport,
				chainSlot: 500,
				chainTime: '2026-10-16T00:00:00Z',
				drift: 0,
				synced: 'InSync'
			})
			connector.emit(greetings({ currentSlot: 1 }))

			expect(bridge.slotZeroTimestamp).toBe(exact)
		})

		it('an approximate slot zero is replaced by an exact one', () => {
			connector.emit(greetings({ currentSlot: 1 }))
			connector.emit({
				tag: HydraHeadTag.SyncedStatusReport,
				chainSlot: 500,
				chainTime: '2026-10-16T00:00:00Z',
				drift: 0,
				synced: 'InSync'
			})

			expect(bridge.slotZeroTimestamp).toBe(Date.parse('2026-10-16T00:00:00Z') - 500 * 1000)
		})

		it('ignores an unparseable chainTime', () => {
			connector.emit(greetings({ currentSlot: 1000 }))
			connector.emit({
				tag: HydraHeadTag.SyncedStatusReport,
				chainSlot: 5,
				chainTime: 'not-a-date',
				drift: 0,
				synced: 'InSync'
			})

			expect(bridge.slotZeroTimestamp).toBe(NOW - 1000 * 1000)
		})
	})

	describe('commands', () => {
		it.each([
			['init', () => bridge.commands.init(), { command: HydraCommand.Init }],
			['close', () => bridge.commands.close(), { command: HydraCommand.Close }],
			['safeClose', () => bridge.commands.safeClose(), { command: HydraCommand.SafeClose }],
			['fanout', () => bridge.commands.fanout(), { command: HydraCommand.Fanout }],
			['contest', () => bridge.commands.contest(), { command: HydraCommand.Contest }],
			[
				'recover',
				() => bridge.commands.recover('dep'),
				{ command: HydraCommand.Recover, payload: { recoverTxId: 'dep' } }
			],
			[
				'sideLoadSnapshot',
				() => bridge.commands.sideLoadSnapshot({ tag: 'ConfirmedSnapshot' }),
				{ command: HydraCommand.SideLoadSnapshot, payload: { snapshot: { tag: 'ConfirmedSnapshot' } } }
			],
			[
				'partialFanout',
				() => bridge.commands.partialFanout(utxo(1, ADDR_A)),
				{ command: HydraCommand.PartialFanout, payload: { utxoToFanout: utxo(1, ADDR_A) } }
			],
			[
				'newTx',
				() => bridge.commands.newTx('84a4', 'memo'),
				{
					command: HydraCommand.NewTx,
					payload: { transaction: { cborHex: '84a4', description: 'memo', type: 'Witnessed Tx ConwayEra' } }
				}
			]
		])('%s sends the node input', (_, send, expected) => {
			send()
			expect(connector.sendCommand).toHaveBeenCalledWith(expect.objectContaining(expected))
		})

		describe('decommit', () => {
			it('sends the decommit tx and resolves on DecommitApproved for that txId only', async () => {
				const p = bridge.commands.decommit({ cborHex: '84a4', txId: 'mine' })
				expect(connector.sendCommand).toHaveBeenCalledWith({
					command: HydraCommand.Decommit,
					payload: { decommitTx: { cborHex: '84a4', description: 'Ledger Cddl Format', type: 'Witnessed Tx ConwayEra' } }
				})

				const approved = {
					tag: HydraHeadTag.DecommitApproved,
					headId: HEAD_ID,
					decommitTxId: 'mine',
					utxoToDecommit: {},
					seq: 2,
					timestamp: ''
				}
				connector.emit({ ...approved, decommitTxId: 'other' })
				connector.emit(approved)

				await expect(p).resolves.toEqual(approved)
			})

			it('rejects after the timeout', async () => {
				const p = bridge.commands.decommit({ cborHex: '84a4', txId: 'mine', timeout: 5000 })
				const assertion = expect(p).rejects.toThrow(/Decommit timeout/)
				await vi.advanceTimersByTimeAsync(5000)
				await assertion
			})
		})

		describe('initSync', () => {
			it('resolves on HeadIsOpen', async () => {
				const p = bridge.commands.initSync!(3, 1000)
				connector.emit({ tag: HydraHeadTag.HeadIsOpen, headId: HEAD_ID, seq: 1, timestamp: '' })
				await expect(p).resolves.toBe(true)
			})

			it('re-sends Init `retry` times, then times out', async () => {
				const p = bridge.commands.initSync!(2, 1000)
				let error: unknown
				p.catch(e => (error = e))

				await vi.advanceTimersByTimeAsync(2999)
				expect(error).toBeUndefined()
				await vi.advanceTimersByTimeAsync(1)
				expect(error).toEqual(new Error('Init timeout'))
				const inits = connector.sendCommand.mock.calls.filter(([c]) => c.command === HydraCommand.Init)
				expect(inits).toHaveLength(3)
				expect(vi.getTimerCount()).toBe(0)
			})

			it('fails fast when the node rejects Init because it is unsynced, ignoring other rejections', async () => {
				const p = bridge.commands.initSync!(3, 10_000)
				connector.emit({
					tag: HydraHeadTag.RejectedInputBecauseUnsynced,
					clientInput: { tag: HydraCommand.NewTx },
					drift: 1
				})
				connector.emit({
					tag: HydraHeadTag.RejectedInputBecauseUnsynced,
					clientInput: { tag: HydraCommand.Init },
					drift: 42
				})

				await expect(p).rejects.toThrow(/out of sync with the chain \(drift 42s\)/)
				expect(vi.getTimerCount()).toBe(0)
			})
		})
	})

	describe('submission', () => {
		it('submitTxSync delegates to the submitter with the default timeout', async () => {
			const result = { txId: tx().txId, isValid: true, isConfirmed: true, result: null }
			connector.submitter.submitTxSync.mockResolvedValue(result)

			await expect(bridge.submitTxSync(tx())).resolves.toBe(result)
			expect(connector.submitter.submitTxSync).toHaveBeenCalledWith(tx(), { timeout: 30000 })
		})

		it('submitTxSync rejects and warns when not connected', async () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
			connector.connected.mockReturnValue(false)

			await expect(bridge.submitTxSync(tx())).rejects.toThrow(/Not connected to Hydra node/)
			expect(warn).toHaveBeenCalledWith(expect.anything(), 'Not connected, cannot submit transaction')
			expect(connector.submitter.submitTxSync).not.toHaveBeenCalled()
		})

		it('submitTx reports a not-connected error through the callback', () => {
			vi.spyOn(console, 'warn').mockImplementation(() => {})
			connector.connected.mockReturnValue(false)
			const cb = vi.fn()

			bridge.submitTx(tx(), cb)

			expect(cb).toHaveBeenCalledWith({ txId: tx().txId, reason: 'Not connected to Hydra node', tag: 'Error' }, null)
		})

		it('submitL2Tx returns the node verdict, defaulting to the chain timeout', async () => {
			connector.submitter.submitL2Tx.mockResolvedValue({ tag: 'SubmitTxInvalid', validationError: 'bad' })

			await expect(bridge.submitL2Tx(tx())).resolves.toEqual({ tag: 'SubmitTxInvalid', validationError: 'bad' })
			expect(connector.submitter.submitL2Tx).toHaveBeenCalledWith(tx(), { timeout: CHAIN_TIMEOUT_MS })
		})

		it('submitL2Tx rejects when the connector has no HTTP submit', async () => {
			delete (connector.submitter as Partial<typeof connector.submitter>).submitL2Tx
			await expect(bridge.submitL2Tx(tx())).rejects.toThrow(/does not implement submitL2Tx/)
		})

		it('commit and submitCardanoTransaction return the submitter response', async () => {
			connector.submitter.commit.mockResolvedValue({ type: 'Tx ConwayEra', description: '', cborHex: '84' })

			await expect(bridge.commit({})).resolves.toEqual({ type: 'Tx ConwayEra', description: '', cborHex: '84' })
			await expect(bridge.submitCardanoTransaction(tx())).resolves.toEqual({ tag: 'TransactionSubmitted' })
		})
	})

	describe('deposits', () => {
		it('pendingDeposits returns the node list', async () => {
			connector.fetcher.queryPendingDeposits.mockResolvedValue(['dep1', 'dep2'])
			await expect(bridge.pendingDeposits()).resolves.toEqual(['dep1', 'dep2'])
		})

		it('pendingDeposits rejects when the connector has no GET /commits', async () => {
			delete (connector.fetcher as Partial<typeof connector.fetcher>).queryPendingDeposits
			await expect(bridge.pendingDeposits()).rejects.toThrow(/does not implement queryPendingDeposits/)
		})

		it('recoverDeposit uses HTTP and reports its outcome', async () => {
			await expect(bridge.recoverDeposit('dep1')).resolves.toBe('OK')
			expect(connector.submitter.recoverDeposit).toHaveBeenCalledWith('dep1', { timeout: CHAIN_TIMEOUT_MS })
			expect(connector.sendCommand).not.toHaveBeenCalled()
		})

		it('recoverDeposit falls back to the Recover command without HTTP', async () => {
			delete (connector.submitter as Partial<typeof connector.submitter>).recoverDeposit

			await expect(bridge.recoverDeposit('dep1')).resolves.toBeUndefined()
			expect(connector.sendCommand).toHaveBeenCalledWith({
				command: HydraCommand.Recover,
				payload: { recoverTxId: 'dep1' }
			})
		})
	})

	describe('autoReconnect', () => {
		it('is off by default', () => {
			connector.eventEmitter.emit('onDisconnected')
			vi.advanceTimersByTime(60_000)
			expect(connector.connect).not.toHaveBeenCalled()
		})

		it('reconnects after the interval and stops at maxReconnectAttempts', () => {
			const c = mockConnector()
			new HydraBridge({ connector: c, autoReconnect: true, reconnectInterval: 500, maxReconnectAttempts: 2 })

			for (let i = 0; i < 3; i++) {
				c.eventEmitter.emit('onDisconnected')
				vi.advanceTimersByTime(499)
				expect(c.connect).toHaveBeenCalledTimes(i)
				vi.advanceTimersByTime(1)
			}
			expect(c.connect).toHaveBeenCalledTimes(2)
		})

		it('a successful reconnect resets the attempt budget', () => {
			const c = mockConnector()
			new HydraBridge({ connector: c, autoReconnect: true, reconnectInterval: 100, maxReconnectAttempts: 1 })
			c.fetcher.querySnapshotUtxo.mockReturnValue(new Promise(() => {}))

			c.eventEmitter.emit('onDisconnected')
			vi.advanceTimersByTime(100)
			c.eventEmitter.emit('onConnected')
			c.eventEmitter.emit('onDisconnected')
			vi.advanceTimersByTime(100)

			expect(c.connect).toHaveBeenCalledTimes(2)
		})

		it('disconnect() cancels a pending reconnect', async () => {
			const c = mockConnector()
			c.connected.mockReturnValue(false)
			const b = new HydraBridge({ connector: c, autoReconnect: true, reconnectInterval: 1000 })

			c.eventEmitter.emit('onDisconnected')
			await b.disconnect()
			vi.advanceTimersByTime(1000)

			expect(c.connect).not.toHaveBeenCalled()
			expect(vi.getTimerCount()).toBe(0)
		})
	})
})
