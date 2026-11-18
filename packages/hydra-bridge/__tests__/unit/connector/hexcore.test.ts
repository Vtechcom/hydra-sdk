import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { io } from 'socket.io-client'
import { HexcoreConnector } from '../../../src/connector/hexcore'
import { CHAIN_TIMEOUT_MS } from '../../../src/connector/websocket'
import { HydraCommand, HydraHeadTag } from '../../../src/types/payload.type'
import { ADDR_A, httpError, pp, tx, utxo } from '../../helpers/fixtures'

const socket = vi.hoisted(() => ({
	handlers: new Map<string, (...args: unknown[]) => void>(),
	connected: false,
	emit: vi.fn(),
	connect: vi.fn(),
	disconnect: vi.fn()
}))

vi.mock('socket.io-client', () => ({
	io: vi.fn(() => ({
		on: (event: string, handler: (...args: unknown[]) => void) => socket.handlers.set(event, handler),
		emit: socket.emit,
		connect: socket.connect,
		disconnect: socket.disconnect,
		get connected() {
			return socket.connected
		}
	}))
}))

/** Fire a socket.io event; fails loudly when the connector never subscribed to it. */
const fire = (event: string, ...args: unknown[]) => {
	const handler = socket.handlers.get(event)
	if (!handler) throw new Error(`no handler registered for "${event}"`)
	handler(...args)
}

const setup = (url = 'https://api.hexcore.dev', namespace?: string) => {
	const connector = new HexcoreConnector(url, namespace ? { namespace } : undefined)
	const api = {
		get: vi.fn().mockResolvedValue({ data: { data: pp() } }),
		post: vi.fn(),
		delete: vi.fn()
	}
	connector.apiFetch = api as never
	return { connector, api, fetcher: connector.fetcher, submitter: connector.submitter }
}

beforeEach(() => {
	socket.handlers.clear()
	socket.connected = false
	vi.clearAllMocks()
})
afterEach(() => vi.restoreAllMocks())

describe('HexcoreConnector', () => {
	describe('constructor', () => {
		it('derives the HTTP base url and the socket.io namespace url', () => {
			const connector = new HexcoreConnector('https://api.hexcore.dev', { namespace: 'custom' })

			expect(connector.apiFetch.defaults.baseURL).toBe('https://api.hexcore.dev/')
			expect(io).toHaveBeenCalledWith('https://api.hexcore.dev/custom', {
				autoConnect: false,
				transports: ['websocket', 'polling']
			})
		})

		it('defaults the namespace to hydra and parses a plain http url', () => {
			const connector = new HexcoreConnector('http://localhost:3000')
			expect(connector.conn).toEqual({ ssl: false, host: 'localhost', port: '3000', path: '/', params: {} })
			expect(io).toHaveBeenCalledWith('http://localhost:3000/hydra', expect.anything())
		})

		// BUG: the namespace is appended to the base url with no separator, so any
		// url with a path yields `/apihydra` instead of `/api/hydra`.
		it.fails('joins the namespace onto a url that has a path', () => {
			new HexcoreConnector('https://gw.example.com/api')
			expect(io).toHaveBeenCalledWith('https://gw.example.com/api/hydra', expect.anything())
		})

		it('rejects an invalid url', () => {
			expect(() => new HexcoreConnector('http://invalid url')).toThrow(/Invalid socket io url/)
		})

		it('forwards X-Api-Key from the url to HTTP requests', () => {
			const connector = new HexcoreConnector('https://api.hexcore.dev?X-Api-Key=test-api-key-123')

			expect(connector.conn.params?.['X-Api-Key']).toBe('test-api-key-123')
			expect(connector.apiFetch.defaults.headers['X-Api-Key']).toBe('test-api-key-123')
		})

		it('sends no X-Api-Key when the url has none', () => {
			const connector = new HexcoreConnector('https://api.hexcore.dev')
			expect(connector.apiFetch.defaults.headers['X-Api-Key']).toBeUndefined()
		})
	})

	describe('socket', () => {
		it('maps socket.io events onto the emitter', () => {
			const { connector } = setup()
			const events: string[] = []
			connector.eventEmitter.on('*', type => events.push(type))

			fire('connect')
			fire('disconnect')

			expect(events).toEqual(['onConnected', 'onDisconnected'])
		})

		it.each([
			[
				'forwards a hydra message',
				{ tag: HydraHeadTag.TxValid, transactionId: 'x' },
				{ tag: HydraHeadTag.TxValid, transactionId: 'x' }
			],
			[
				'tags an untagged InvalidInput',
				{ reason: 'bad', input: '{' },
				{ tag: HydraHeadTag.InvalidInput, reason: 'bad', input: '{' }
			]
		])('%s', (_, data, emitted) => {
			const { connector } = setup()
			const onMessage = vi.fn()
			connector.eventEmitter.on('onMessage', onMessage)

			fire('hydra', { status: 'success', data })

			expect(onMessage).toHaveBeenCalledExactlyOnceWith(emitted)
		})

		it('logs plain socket.io messages', () => {
			const log = vi.spyOn(console, 'log').mockImplementation(() => {})
			setup()
			fire('message', 'hello')
			expect(log).toHaveBeenCalledWith('[HexcoreConnector][message]:', 'hello')
		})

		it('connect/disconnect drive the socket; connected() reads it', () => {
			const { connector } = setup()

			connector.connect()
			connector.disconnect()
			socket.connected = true

			expect(socket.connect).toHaveBeenCalledOnce()
			expect(socket.disconnect).toHaveBeenCalledOnce()
			expect(connector.connected()).toBe(true)
		})

		// BUG: same as the websocket connector — connect() drops the
		// protocol-parameters promise, so a failing query is an unhandled rejection.
		it.fails('handles a failing protocol-parameters query on connect', () => {
			const { connector } = setup()
			const failure = Promise.reject(new Error('503'))
			const then = vi.spyOn(failure, 'then')
			connector.fetcher.queryRawProtocolParameters = () => failure
			try {
				connector.connect()
				expect(then).toHaveBeenCalled()
			} finally {
				failure.catch(() => {})
			}
		})

		it('sendCommand emits send_command on the namespace, then runs afterSendCb', () => {
			const { connector } = setup('https://api.hexcore.dev', 'ns')
			socket.connected = true
			const afterSendCb = vi.fn()

			connector.sendCommand({ command: HydraCommand.Recover, payload: { recoverTxId: 'dep' }, afterSendCb })

			expect(socket.emit).toHaveBeenCalledExactlyOnceWith('ns', {
				command: 'send_command',
				data: { tag: 'Recover', recoverTxId: 'dep' }
			})
			expect(afterSendCb).toHaveBeenCalledOnce()
		})

		it('sendCommand throws while disconnected', () => {
			const { connector } = setup()
			expect(() => connector.sendCommand({ command: HydraCommand.Init })).toThrow(/Socket io is not connected/)
			expect(socket.emit).not.toHaveBeenCalled()
		})
	})
})

describe('default hexcore fetcher', () => {
	it.each([
		['queryRawProtocolParameters', '/hydra/protocol-parameters'],
		['querySnapshotUtxo', '/hydra/snapshot/utxo'],
		['queryHeadInfo', '/hydra/head'],
		['queryConfirmedSnapshot', '/hydra/snapshot'],
		['queryLastSeenSnapshot', '/hydra/snapshot/last-seen'],
		['queryPendingDeposits', '/hydra/commits'],
		['queryNodeConfig', '/hydra/config']
	] as const)('%s GETs %s and unwraps data.data', async (method, path) => {
		const { fetcher, api } = setup()
		api.get.mockResolvedValue({ data: { data: { from: path } } })

		await expect(fetcher[method]!()).resolves.toEqual({ from: path })
		expect(api.get).toHaveBeenCalledWith(path)
	})

	it.each([
		['querySnapshotUtxo', {}],
		['queryHeadInfo', {}],
		['queryConfirmedSnapshot', null],
		['queryPendingDeposits', []]
	] as const)('%s falls back to %j for an empty envelope', async (method, fallback) => {
		const { fetcher, api } = setup()
		api.get.mockResolvedValue({ data: {} })
		await expect(fetcher[method]!()).resolves.toEqual(fallback)
	})

	it('queryRawProtocolParameters rejects an empty envelope', async () => {
		const { fetcher, api } = setup()
		api.get.mockResolvedValue({ data: {} })
		await expect(fetcher.queryRawProtocolParameters()).rejects.toThrow(
			/\[QueryProtocolParameters\].*Failed to query protocol parameters/
		)
	})

	it.each([
		['queryHeadInfo', /\[HexcoreConnector\]\[QueryHeadInfo\]/],
		['queryConfirmedSnapshot', /\[QueryConfirmedSnapshot\]/],
		['queryLastSeenSnapshot', /\[QueryLastSeenSnapshot\]/],
		['queryPendingDeposits', /\[QueryPendingDeposits\]/],
		['queryNodeConfig', /\[QueryNodeConfig\]/]
	] as const)('%s labels a transport failure', async (method, message) => {
		const { fetcher, api } = setup()
		api.get.mockRejectedValue(httpError(502))
		await expect(fetcher[method]!()).rejects.toThrow(message)
	})

	// BUG: copy-pasted label — a snapshot failure reports [QueryProtocolParameters].
	it.fails('querySnapshotUtxo labels its own failure', async () => {
		const { fetcher, api } = setup()
		api.get.mockRejectedValue(httpError(502))
		await expect(fetcher.querySnapshotUtxo()).rejects.toThrow(/\[QuerySnapshotUtxo\]/)
	})
})

describe('default hexcore submitter', () => {
	const envelope = { type: tx().type, description: tx().description, cborHex: tx().cborHex, txId: tx().txId }

	it('commit wraps the UTxO in a simple commit request', async () => {
		const { submitter, api } = setup()
		api.post.mockResolvedValue({ data: { cborHex: '84' } })

		await expect(submitter.commit(utxo(1, ADDR_A))).resolves.toEqual({ cborHex: '84' })
		expect(api.post).toHaveBeenCalledWith('/hydra/commit', { type: 'simple', data: { utxo: utxo(1, ADDR_A) } })
	})

	// BUG: copy-pasted label — a commit failure reports [QueryProtocolParameters].
	it.fails('commit labels its own failure', async () => {
		const { submitter, api } = setup()
		api.post.mockRejectedValue(httpError(400))
		await expect(submitter.commit({})).rejects.toThrow(/\[HexcoreConnector\]\[Commit\]/)
	})

	it('submitCardanoTx unwraps data.data and labels failures', async () => {
		const { submitter, api } = setup()
		api.post.mockResolvedValueOnce({ data: { data: { tag: 'TransactionSubmitted' } } })
		api.post.mockRejectedValueOnce(httpError(400))

		await expect(submitter.submitCardanoTx(tx())).resolves.toEqual({ tag: 'TransactionSubmitted' })
		expect(api.post).toHaveBeenCalledWith('/hydra/cardano-transaction', tx())
		await expect(submitter.submitCardanoTx(tx())).rejects.toThrow(/\[submitCardanoTx\]/)
	})

	describe('submitTxSync / submitTx', () => {
		const confirmed = { tag: HydraHeadTag.SnapshotConfirmed }

		it.each([
			['a snapshot', { data: confirmed }, { isValid: true, isConfirmed: true, result: confirmed }],
			['an empty envelope', {}, { isValid: false, isConfirmed: false, result: null }]
		])('submitTxSync maps %s', async (_, data, expected) => {
			const { submitter, api } = setup()
			api.post.mockResolvedValue({ data })

			await expect(submitter.submitTxSync(tx(), { timeout: 9 })).resolves.toEqual({ txId: tx().txId, ...expected })
			expect(api.post).toHaveBeenCalledWith('/hydra/submit-tx', tx(), { timeout: 9 })
		})

		it('submitTxSync labels a failure', async () => {
			const { submitter, api } = setup()
			api.post.mockRejectedValue(httpError(500))
			await expect(submitter.submitTxSync(tx())).rejects.toThrow(/\[submitTxSync\].*500/)
		})

		it.each([
			[
				'a snapshot',
				() => ({ data: { data: confirmed } }),
				null,
				{ txId: tx().txId, isValid: true, isConfirmed: true, result: confirmed }
			],
			[
				'an empty envelope',
				() => ({ data: {} }),
				null,
				{ txId: tx().txId, isValid: false, isConfirmed: false, result: null }
			]
		])('submitTx calls back with %s', async (_, response, error, result) => {
			const { submitter, api } = setup()
			api.post.mockResolvedValue(response())
			const cb = vi.fn()

			submitter.submitTx(tx(), cb)

			await vi.waitFor(() => expect(cb).toHaveBeenCalledExactlyOnceWith(error, result))
		})

		it('submitTx calls back with the transport error', async () => {
			const { submitter, api } = setup()
			api.post.mockRejectedValue(new Error('socket hang up'))
			const cb = vi.fn()

			submitter.submitTx(tx(), cb)

			await vi.waitFor(() =>
				expect(cb).toHaveBeenCalledExactlyOnceWith({ txId: tx().txId, reason: 'socket hang up', tag: 'Error' }, null)
			)
		})
	})

	describe('submitL2Tx', () => {
		it('POSTs the wrapped envelope with the chain timeout and unwraps the verdict', async () => {
			const { submitter, api } = setup()
			api.post.mockResolvedValue({ data: { data: { tag: 'SubmitTxConfirmed', snapshotNumber: 2 } } })

			await expect(submitter.submitL2Tx!(tx())).resolves.toEqual({ tag: 'SubmitTxConfirmed', snapshotNumber: 2 })
			expect(api.post).toHaveBeenCalledWith('/hydra/transaction', { submitL2Tx: envelope }, { timeout: CHAIN_TIMEOUT_MS })
		})

		it.each([
			['data.data', { data: { tag: 'SubmitTxRejected', reason: 'unsynced' } }],
			['data', { tag: 'SubmitTxRejected', reason: 'unsynced' }]
		])('returns a tagged error body found in %s as the verdict', async (_, body) => {
			const { submitter, api } = setup()
			api.post.mockRejectedValue(httpError(400, body))
			await expect(submitter.submitL2Tx!(tx())).resolves.toEqual({ tag: 'SubmitTxRejected', reason: 'unsynced' })
		})

		it('throws for an untagged error body', async () => {
			const { submitter, api } = setup()
			api.post.mockRejectedValue(httpError(400, 'garbage'))
			await expect(submitter.submitL2Tx!(tx())).rejects.toThrow(/\[SubmitL2Tx\].*400/)
		})
	})

	it('recoverDeposit DELETEs the url-encoded deposit and unwraps the answer', async () => {
		const { submitter, api } = setup()
		api.delete.mockResolvedValueOnce({ data: { data: 'OK' } })
		api.delete.mockRejectedValueOnce(httpError(404))

		await expect(submitter.recoverDeposit!('a/b#0', { timeout: 7 })).resolves.toBe('OK')
		expect(api.delete).toHaveBeenCalledWith('/hydra/commits/a%2Fb%230', { timeout: 7 })
		await expect(submitter.recoverDeposit!('dep')).rejects.toThrow(/\[RecoverDeposit\].*404/)
	})

	it.each([
		['decommit', '/hydra/decommit', () => tx(), envelope, /\[Decommit\]/],
		[
			'sideLoadSnapshot',
			'/hydra/snapshot',
			() => ({ snapshot: { tag: 'InitialSnapshot' } }),
			{ snapshot: { tag: 'InitialSnapshot' } },
			/\[SideLoadSnapshot\]/
		]
	] as const)(
		'%s POSTs %s with the chain timeout, unwraps, and labels failures',
		async (method, path, arg, body, message) => {
			const { submitter, api } = setup()
			api.post.mockResolvedValueOnce({ data: { data: 'OK' } })
			api.post.mockResolvedValueOnce({ data: 'raw' })
			api.post.mockRejectedValueOnce(httpError(400))
			const call = submitter[method] as (a: unknown) => Promise<unknown>

			await expect(call(arg())).resolves.toBe('OK')
			expect(api.post).toHaveBeenCalledWith(path, body, { timeout: CHAIN_TIMEOUT_MS })
			await expect(call(arg())).resolves.toBe('raw')
			await expect(call(arg())).rejects.toThrow(message)
		}
	)
})
