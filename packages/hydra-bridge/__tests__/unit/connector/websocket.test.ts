import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CHAIN_TIMEOUT_MS, WebsocketConnector } from '../../../src/connector/websocket'
import { HydraCommand, HydraHeadTag } from '../../../src/types/payload.type'
import { ErrorType } from '../../../src/utils/haskell-deserialize'
import { echoedNewTx, httpError, pp, snapshotConfirmed, tx, utxo, ADDR_A } from '../../helpers/fixtures'

class MockWebSocket {
	static OPEN = 1
	static CLOSED = 3
	static instances: MockWebSocket[] = []

	readyState = MockWebSocket.OPEN
	onopen: (() => void) | null = null
	onmessage: ((ev: { data: string }) => void) | null = null
	onerror: ((ev: unknown) => void) | null = null
	onclose: (() => void) | null = null
	send = vi.fn()
	close = vi.fn(() => {
		this.readyState = MockWebSocket.CLOSED
		this.onclose?.()
	})

	constructor(public url: string) {
		MockWebSocket.instances.push(this)
	}

	receive(data: unknown) {
		this.onmessage?.({ data: typeof data === 'string' ? data : JSON.stringify(data) })
	}
}

const http = () => ({
	get: vi.fn().mockResolvedValue({ status: 200, data: pp() }),
	post: vi.fn(),
	delete: vi.fn()
})

/** A connector with a live mock socket and a stubbed HTTP client. */
const connected = (url = 'ws://localhost:4001') => {
	const connector = new WebsocketConnector(url)
	const api = http()
	connector.apiFetch = api as never
	connector.connect()
	const ws = connector._websocket as unknown as MockWebSocket
	return { connector, ws, api }
}

const sent = (ws: MockWebSocket) => ws.send.mock.calls.map(([raw]) => JSON.parse(raw))

const originalWebSocket = globalThis.WebSocket
beforeEach(() => {
	MockWebSocket.instances = []
	;(globalThis as any).WebSocket = MockWebSocket
})
afterEach(() => {
	;(globalThis as any).WebSocket = originalWebSocket
	vi.useRealTimers()
	vi.restoreAllMocks()
})

describe('WebsocketConnector', () => {
	describe('urls', () => {
		it.each([
			['ws://localhost:4001', {}, 'ws://localhost:4001/', 'http://localhost:4001/'],
			['wss://gw.example.com/head/1', {}, 'wss://gw.example.com/head/1', 'https://gw.example.com/head/1'],
			[
				'ws://localhost:4001?X-Api-Key=k',
				{ history: true, noSnapshotUtxo: true, address: ADDR_A },
				`ws://localhost:4001/?X-Api-Key=k&history=yes&snapshot-utxo=no&address=${ADDR_A}`,
				'http://localhost:4001/'
			]
		])('%s with %j', (websocketUrl, options, socketUrl, httpUrl) => {
			const connector = new WebsocketConnector({ websocketUrl, ...options })
			expect(connector.networkInfo).toEqual({ socketUrl, httpUrl })
		})

		it('sends X-Api-Key from the url as an HTTP header', () => {
			const connector = new WebsocketConnector('wss://gw.example.com/head/1?X-Api-Key=secret')
			expect(connector.apiFetch.defaults.headers['X-Api-Key']).toBe('secret')
			expect(connector.apiFetch.defaults.baseURL).toBe('https://gw.example.com/head/1')
		})

		it('rejects an invalid url', () => {
			expect(() => new WebsocketConnector('http://invalid url')).toThrow(/Invalid websocket url/)
		})
	})

	describe('socket lifecycle', () => {
		it('opens the socket url and maps socket events onto the emitter', () => {
			const { connector, ws } = connected('ws://localhost:4001?X-Api-Key=k')
			const events: string[] = []
			connector.eventEmitter.on('*', type => events.push(type))

			ws.onopen!()
			ws.onerror!({})
			ws.close()

			expect(ws.url).toBe('ws://localhost:4001/?X-Api-Key=k')
			expect(events).toEqual(['onConnected', 'onConnectError', 'onDisconnected'])
		})

		it('connect() closes the previous socket first', () => {
			const { connector, ws } = connected()
			connector.connect()
			expect(ws.close).toHaveBeenCalledOnce()
			expect(MockWebSocket.instances).toHaveLength(2)
		})

		// BUG: onopen fires queryRawProtocolParameters() and drops the promise, so a
		// failing GET /protocol-parameters becomes an unhandled rejection (fatal
		// in Node by default) right after every connect.
		it.fails('handles a failing protocol-parameters query on open', () => {
			const { connector, ws } = connected()
			const failure = Promise.reject(new Error('503'))
			const then = vi.spyOn(failure, 'then')
			connector.fetcher.queryRawProtocolParameters = () => failure
			try {
				ws.onopen!()
				expect(then).toHaveBeenCalled()
			} finally {
				failure.catch(() => {})
			}
		})

		it('connected() follows the socket readyState', () => {
			const connector = new WebsocketConnector('ws://localhost:4001')
			expect(connector.connected()).toBe(false)
			connector.connect()
			expect(connector.connected()).toBe(true)
			;(connector._websocket as unknown as MockWebSocket).readyState = MockWebSocket.CLOSED
			expect(connector.connected()).toBe(false)
		})

		it('disconnect() closes the socket, and warns when there is none', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
			const { connector, ws } = connected()

			connector.disconnect()
			connector.disconnect()

			expect(ws.close).toHaveBeenCalledOnce()
			expect(connector._websocket).toBeNull()
			expect(warn).toHaveBeenCalledExactlyOnceWith('WebSocket connection is not established')
		})
	})

	describe('incoming messages', () => {
		it.each([
			[
				'tags an untagged InvalidInput',
				{ reason: 'bad json', input: '{' },
				{ tag: HydraHeadTag.InvalidInput, reason: 'bad json', input: '{' }
			],
			[
				'leaves a tagged message alone',
				{ tag: HydraHeadTag.TxValid, transactionId: 'x' },
				{ tag: HydraHeadTag.TxValid, transactionId: 'x' }
			],
			[
				'does not retag a tagged message with reason/input',
				{ tag: HydraHeadTag.CommandFailed, reason: 'r', input: 'i' },
				{ tag: HydraHeadTag.CommandFailed, reason: 'r', input: 'i' }
			]
		])('%s', (_, wire, emitted) => {
			const { connector, ws } = connected()
			const onMessage = vi.fn()
			connector.eventEmitter.on('onMessage', onMessage)

			ws.receive(wire)

			expect(onMessage).toHaveBeenCalledExactlyOnceWith(emitted)
		})

		it('logs and drops a frame that is not JSON', () => {
			const error = vi.spyOn(console, 'error').mockImplementation(() => {})
			const { connector, ws } = connected()
			const onMessage = vi.fn()
			connector.eventEmitter.on('onMessage', onMessage)

			ws.receive('not json')

			expect(onMessage).not.toHaveBeenCalled()
			expect(error).toHaveBeenCalledWith('[⚡ HydraBridge] error', expect.any(SyntaxError))
		})
	})

	describe('sendCommand', () => {
		it('serializes the command as the tag next to its payload, then runs afterSendCb', () => {
			const { connector, ws } = connected()
			const afterSendCb = vi.fn(() => expect(ws.send).toHaveBeenCalled())

			connector.sendCommand({ command: HydraCommand.Recover, payload: { recoverTxId: 'dep' }, afterSendCb })

			expect(sent(ws)).toEqual([{ tag: 'Recover', recoverTxId: 'dep' }])
			expect(afterSendCb).toHaveBeenCalledOnce()
		})

		it('throws before the socket exists', () => {
			const connector = new WebsocketConnector('ws://localhost:4001')
			expect(() => connector.sendCommand({ command: HydraCommand.Init })).toThrow(
				/WebSocket connection is not established/
			)
		})
	})

	describe('submitTxSync', () => {
		const mine = tx('aa'.repeat(32))
		const other = tx('bb'.repeat(32))

		it('sends NewTx and resolves on the snapshot confirming it, reporting TxValid', async () => {
			const { connector, ws } = connected()
			const p = connector.submitTxSync(mine)

			ws.receive({ tag: HydraHeadTag.TxValid, transactionId: mine.txId })
			const confirmed = snapshotConfirmed(3, {}, [other, mine])
			ws.receive(confirmed)

			await expect(p).resolves.toEqual({ txId: mine.txId, isValid: true, isConfirmed: true, result: confirmed })
			expect(sent(ws)).toEqual([
				{ tag: 'NewTx', transaction: { cborHex: mine.cborHex, description: mine.description, type: mine.type } }
			])
		})

		it('ignores messages about other transactions', async () => {
			const { connector, ws } = connected()
			const p = connector.submitTxSync(mine)

			ws.receive({ tag: HydraHeadTag.TxValid, transactionId: other.txId })
			ws.receive({ tag: HydraHeadTag.TxInvalid, transaction: other, validationError: { reason: 'x' } })
			ws.receive({ tag: HydraHeadTag.CommandFailed, clientInput: echoedNewTx(other), state: {} })
			ws.receive({ tag: HydraHeadTag.RejectedInputBecauseUnsynced, clientInput: echoedNewTx(other), drift: 1 })
			ws.receive({ tag: HydraHeadTag.CommandFailed, clientInput: { tag: HydraCommand.Close }, state: {} })
			ws.receive(snapshotConfirmed(1, {}, [other]))
			ws.receive(snapshotConfirmed(2, {}, [mine]))

			await expect(p).resolves.toMatchObject({ isValid: false, isConfirmed: true, result: { seq: 2 } })
		})

		it.each([
			[
				'TxInvalid',
				{ tag: HydraHeadTag.TxInvalid, transaction: mine, validationError: { reason: 'BadInputs' } },
				{ reason: 'BadInputs', tag: HydraHeadTag.TxInvalid }
			],
			[
				'RejectedInputBecauseUnsynced',
				{ tag: HydraHeadTag.RejectedInputBecauseUnsynced, clientInput: echoedNewTx(mine), drift: 7 },
				{ reason: 'Node is out of sync with the chain (drift 7s)', tag: HydraHeadTag.RejectedInputBecauseUnsynced }
			],
			[
				'CommandFailed',
				{ tag: HydraHeadTag.CommandFailed, clientInput: echoedNewTx(mine), state: {} },
				{ reason: 'Node rejected NewTx', tag: HydraHeadTag.CommandFailed }
			]
		])('rejects on %s for our tx', async (_, message, rejection) => {
			const { connector, ws } = connected()
			const p = connector.submitTxSync(mine)

			ws.receive(message)

			await expect(p).rejects.toEqual({ txId: mine.txId, ...rejection })
		})

		it('rejects with a Timeout error and stops listening', async () => {
			vi.useFakeTimers()
			const { connector } = connected()
			const p = connector.submitTxSync(mine, { timeout: 1000 })
			const assertion = expect(p).rejects.toEqual({ txId: mine.txId, reason: 'Timeout', tag: 'Timeout' })

			await vi.advanceTimersByTimeAsync(1000)

			await assertion
			expect(connector.eventEmitter.all.get('onMessage') ?? []).toHaveLength(0)
		})

		it('submitter.submitTx reports the outcome through the callback', async () => {
			const { connector, ws } = connected()
			const cb = vi.fn()

			connector.submitter.submitTx(mine, cb)
			ws.receive({ tag: HydraHeadTag.TxInvalid, transaction: mine, validationError: { reason: 'BadInputs' } })
			await vi.waitFor(() => expect(cb).toHaveBeenCalled())

			expect(cb).toHaveBeenCalledWith({ txId: mine.txId, reason: 'BadInputs', tag: HydraHeadTag.TxInvalid }, null)
		})
	})
})

describe('default websocket fetcher', () => {
	const setup = () => {
		const connector = new WebsocketConnector('ws://localhost:4001')
		const api = http()
		connector.apiFetch = api as never
		return { fetcher: connector.fetcher, api }
	}

	it.each([
		['queryRawProtocolParameters', '/protocol-parameters'],
		['querySnapshotUtxo', '/snapshot/utxo'],
		['queryHeadInfo', '/head'],
		['queryConfirmedSnapshot', '/snapshot'],
		['queryLastSeenSnapshot', '/snapshot/last-seen'],
		['queryPendingDeposits', '/commits'],
		['queryNodeConfig', '/config']
	] as const)('%s GETs %s and returns the body', async (method, path) => {
		const { fetcher, api } = setup()
		const body = { from: path }
		api.get.mockResolvedValue({ status: 200, data: body })

		await expect(fetcher[method]!()).resolves.toEqual(body)
		expect(api.get).toHaveBeenCalledWith(path)
	})

	it.each([
		['queryRawProtocolParameters', /\[QueryProtocolParameters\]/],
		['querySnapshotUtxo', /\[QuerySnapshotUtxo\]/],
		['queryHeadInfo', /\[QueryHeadInfo\]/],
		['queryConfirmedSnapshot', /\[QueryConfirmedSnapshot\]/],
		['queryLastSeenSnapshot', /\[QueryLastSeenSnapshot\]/],
		['queryPendingDeposits', /\[QueryPendingDeposits\]/],
		['queryNodeConfig', /\[QueryNodeConfig\].*status code 500/]
	] as const)('%s wraps a 500', async (method, message) => {
		const { fetcher, api } = setup()
		api.get.mockRejectedValue(httpError(500))
		await expect(fetcher[method]!()).rejects.toThrow(message)
	})

	it('querySnapshotUtxo treats a 404 as an empty head and warns', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const { fetcher, api } = setup()
		api.get.mockRejectedValue(httpError(404))

		await expect(fetcher.querySnapshotUtxo()).resolves.toEqual({})
		expect(warn).toHaveBeenCalledWith(expect.stringMatching(/Snapshot Utxo not found/))
	})

	it('queryConfirmedSnapshot treats a 404 as no snapshot (Idle head)', async () => {
		const { fetcher, api } = setup()
		api.get.mockRejectedValue(Object.assign(new Error('x'), { status: 404 }))
		await expect(fetcher.queryConfirmedSnapshot!()).resolves.toBeNull()
	})

	it.each([400, 404])('queryNodeConfig explains a %i as a pre-2.3.0 node', async status => {
		const { fetcher, api } = setup()
		api.get.mockRejectedValue(httpError(status))
		await expect(fetcher.queryNodeConfig!()).rejects.toThrow(/endpoint requires hydra-node >= 2\.3\.0/)
	})

	it('queryPendingDeposits returns [] for an empty body', async () => {
		const { fetcher, api } = setup()
		api.get.mockResolvedValue({ status: 200, data: null })
		await expect(fetcher.queryPendingDeposits!()).resolves.toEqual([])
	})
})

describe('default websocket submitter', () => {
	const setup = () => {
		const connector = new WebsocketConnector('ws://localhost:4001')
		const api = http()
		connector.apiFetch = api as never
		return { submitter: connector.submitter, api }
	}
	const envelope = { type: tx().type, description: tx().description, cborHex: tx().cborHex, txId: tx().txId }

	it('commit POSTs the body and returns the drafted tx', async () => {
		const { submitter, api } = setup()
		api.post.mockResolvedValue({ status: 200, data: { cborHex: '84' } })

		await expect(submitter.commit(utxo(1, ADDR_A))).resolves.toEqual({ cborHex: '84' })
		expect(api.post).toHaveBeenCalledWith('/commit', utxo(1, ADDR_A))
	})

	it('commit turns a Haskell error string into a structured error', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {})
		const { submitter, api } = setup()
		api.post.mockRejectedValue(httpError(400, 'InvalidSeed {headSeed = "abc"}'))

		await expect(submitter.commit({})).rejects.toEqual({ errorType: ErrorType.InvalidSeed, headSeed: 'abc' })
		expect(error).toHaveBeenCalledWith('[HydraBridgeSubmitter][Commit][deserializeHaskellErrorToJson]: ', {
			errorType: ErrorType.InvalidSeed,
			headSeed: 'abc'
		})
	})

	it('commit rethrows a transport error and logs it', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {})
		const { submitter, api } = setup()
		api.post.mockRejectedValue(new Error('ECONNRESET'))

		await expect(submitter.commit({})).rejects.toThrow(/ECONNRESET/)
		expect(error).toHaveBeenCalledWith('[HydraBridgeSubmitter][Commit]: ', expect.any(Error))
	})

	it('submitCardanoTx returns the node response, and null after logging a failure', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {})
		const { submitter, api } = setup()
		api.post.mockResolvedValueOnce({ status: 200, data: { tag: 'TransactionSubmitted' } })
		api.post.mockRejectedValueOnce(httpError(400))

		await expect(submitter.submitCardanoTx(tx())).resolves.toEqual({ tag: 'TransactionSubmitted' })
		await expect(submitter.submitCardanoTx(tx())).resolves.toBeNull()
		expect(api.post).toHaveBeenCalledWith('/cardano-transaction', tx())
		expect(error).toHaveBeenCalledWith('[HydraBridgeSubmitter][SubmitCardanoTransaction]: ', expect.any(Error))
	})

	describe('submitL2Tx', () => {
		it('POSTs the bare tx envelope with the chain timeout', async () => {
			const { submitter, api } = setup()
			api.post.mockResolvedValue({ status: 200, data: { tag: 'SubmitTxConfirmed', snapshotNumber: 4 } })

			await expect(submitter.submitL2Tx!(tx())).resolves.toEqual({ tag: 'SubmitTxConfirmed', snapshotNumber: 4 })
			expect(api.post).toHaveBeenCalledWith('/transaction', envelope, { timeout: CHAIN_TIMEOUT_MS })
		})

		it('returns a tagged non-2xx body as the verdict', async () => {
			const { submitter, api } = setup()
			api.post.mockRejectedValue(httpError(400, { tag: 'SubmitTxInvalid', validationError: 'BadInputs' }))

			await expect(submitter.submitL2Tx!(tx(), { timeout: 5 })).resolves.toEqual({
				tag: 'SubmitTxInvalid',
				validationError: 'BadInputs'
			})
		})

		it('throws with the body for an untagged error', async () => {
			const { submitter, api } = setup()
			api.post.mockRejectedValue(httpError(400, 'Error in $: key "cborHex" not found'))

			await expect(submitter.submitL2Tx!(tx())).rejects.toThrow(/\[SubmitL2Tx\]: Error in \$: key "cborHex" not found/)
		})
	})

	it('recoverDeposit DELETEs the url-encoded deposit with the chain timeout', async () => {
		const { submitter, api } = setup()
		api.delete.mockResolvedValue({ status: 200, data: 'OK' })

		await expect(submitter.recoverDeposit!('a/b#0')).resolves.toBe('OK')
		expect(api.delete).toHaveBeenCalledWith('/commits/a%2Fb%230', { timeout: CHAIN_TIMEOUT_MS })
	})

	it('recoverDeposit wraps a failure', async () => {
		const { submitter, api } = setup()
		api.delete.mockRejectedValue(httpError(404))
		await expect(submitter.recoverDeposit!('dep')).rejects.toThrow(/\[RecoverDeposit\].*404/)
	})

	it.each([
		['decommit', '/decommit', () => tx(), envelope, /\[Decommit\]/],
		[
			'sideLoadSnapshot',
			'/snapshot',
			() => ({ snapshot: { tag: 'InitialSnapshot' } }),
			{ snapshot: { tag: 'InitialSnapshot' } },
			/\[SideLoadSnapshot\]/
		]
	] as const)('%s POSTs %s with the chain timeout and wraps failures', async (method, path, arg, body, message) => {
		const { submitter, api } = setup()
		api.post.mockResolvedValueOnce({ status: 200, data: 'OK' })
		api.post.mockRejectedValueOnce(httpError(400))
		const call = submitter[method] as (a: unknown) => Promise<unknown>

		await expect(call(arg())).resolves.toBe('OK')
		expect(api.post).toHaveBeenCalledWith(path, body, { timeout: CHAIN_TIMEOUT_MS })
		await expect(call(arg())).rejects.toThrow(message)
	})
})
