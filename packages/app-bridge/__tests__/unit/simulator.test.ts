import { describe, it, expect, afterEach, vi } from 'vitest'
import { MockBridgeHost } from '../../src/simulator/host'
import { mountGameDevtools, unmountGameDevtools } from '../../src/simulator/devtools'
import { connectMockHost, flushHost, installIframe } from '../helpers/fake-window'

afterEach(() => {
	unmountGameDevtools()
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

/** Send one request from the iframe side and return what the host posted back. */
const ask = async (pair: ReturnType<typeof connectMockHost>, request: Record<string, unknown>) => {
	const before = pair.toIframe.length
	pair.parentListeners.forEach(l =>
		l({ data: { requestId: `req_${before}`, ...request }, origin: 'https://game.example', source: window as any })
	)
	await flushHost()
	return pair.toIframe.slice(before)
}

describe('MockBridgeHost — RPC responses', () => {
	it.each([
		[{ type: 'WALLET_GET_ADDRESS' }, 'WALLET_ADDRESS_RESULT', 'addr_sim'],
		[{ type: 'WALLET_CONNECT' }, 'WALLET_CONNECT_RESULT', { address: 'addr_sim', networkId: 1 }],
		[{ type: 'WALLET_GET_NETWORK' }, 'WALLET_NETWORK_RESULT', 1],
		[{ type: 'WALLET_GET_BALANCE' }, 'WALLET_GET_BALANCE_RESULT', '42000000'],
		[{ type: 'WALLET_GET_USED_ADDRESSES' }, 'WALLET_GET_USED_ADDRESSES_RESULT', ['addr_sim']],
		[{ type: 'GAME_READY' }, 'GAME_READY_RESULT', true],
		[{ type: 'EXIT_GAME' }, 'EXIT_GAME_RESULT', true],
		[{ type: 'GET_CONTEXT' }, 'GET_CONTEXT_RESULT', expect.objectContaining({ theme: 'dark', locale: 'en' })],
		[
			{ type: 'WALLET_GET_UTXOS' },
			'WALLET_GET_UTXOS_RESULT',
			[
				expect.objectContaining({
					output: { amount: expect.arrayContaining([{ unit: 'lovelace', quantity: '42000000' }]) }
				})
			]
		]
	])('%o → %s', async (request, responseType, result) => {
		const pair = connectMockHost({ address: 'addr_sim', networkId: 1, balance: '42000000', context: { locale: 'en' } })
		expect(await ask(pair, request)).toEqual([
			{ data: { type: responseType, requestId: 'req_0', result }, targetOrigin: '*' }
		])
	})

	it('keeps host storage across requests and answers a batch in order', async () => {
		const pair = connectMockHost({ address: 'addr_sim', networkId: 0 })
		await ask(pair, { type: 'HOST_STORAGE_SET', key: 'jwt', value: 'v1' })
		expect((await ask(pair, { type: 'HOST_STORAGE_GET', key: 'jwt' }))[0].data.result).toBe('v1')
		const [batch] = await ask(pair, {
			type: 'WALLET_BATCH_REQUEST',
			requests: [
				{ type: 'WALLET_GET_NETWORK' },
				{ type: 'HOST_STORAGE_REMOVE', key: 'jwt' },
				{ type: 'HOST_STORAGE_GET', key: 'jwt' }
			]
		})
		expect(batch.data).toEqual({ type: 'WALLET_BATCH_RESULT', requestId: expect.any(String), result: [0, true, null] })
	})

	it.each(['WALLET_SIGN_DATA', 'WALLET_SIGN_TX'])('with autoApprove: false, %s is declined', async type => {
		const logs: { type: string; success: boolean }[] = []
		const pair = connectMockHost({ autoApprove: false, onRpcLog: log => logs.push(log) })
		expect(await ask(pair, { type })).toEqual([
			{
				data: {
					type: `${type}_RESULT`,
					requestId: 'req_0',
					result: null,
					error: 'User declined or cancelled the transaction'
				},
				targetOrigin: '*'
			}
		])
		expect(logs.map(l => [l.type, l.success])).toEqual([[type, false]])
	})

	it('answers an unknown request type with an error and logs it as failed', async () => {
		const logs: { type: string; success: boolean }[] = []
		const pair = connectMockHost({ onRpcLog: log => logs.push(log) })
		const [res] = await ask(pair, { type: 'WALLET_TELEPORT' })
		expect(res.data).toMatchObject({
			type: 'WALLET_TELEPORT_RESULT',
			error: 'Unsupported request type in mock host: WALLET_TELEPORT'
		})
		expect(logs.map(l => [l.type, l.success])).toEqual([['WALLET_TELEPORT', false]])
	})

	it('ignores push-shaped messages (no requestId) and stops answering after stop()', async () => {
		const pair = connectMockHost()
		pair.parentListeners.forEach(l => l({ data: { type: 'WALLET_GET_ADDRESS' }, origin: '', source: window }))
		await flushHost()
		expect(pair.toIframe).toEqual([])

		pair.stopHost()
		expect(pair.parentListeners).toHaveLength(0)
	})
})

describe('MockBridgeHost — push events', () => {
	it.each([
		[
			'connect',
			(h: MockBridgeHost) => h.connect('addr_new', 0),
			{ type: 'WALLET_CONNECTED', address: 'addr_new', networkId: 0 }
		],
		['disconnect', (h: MockBridgeHost) => h.disconnect(), { type: 'WALLET_DISCONNECTED' }],
		[
			'switchAccount',
			(h: MockBridgeHost) => h.switchAccount('addr_switched'),
			{ type: 'WALLET_ACCOUNT_CHANGED', address: 'addr_switched' }
		],
		['switchNetwork', (h: MockBridgeHost) => h.switchNetwork(1), { type: 'WALLET_NETWORK_CHANGED', networkId: 1 }],
		[
			'setContext',
			(h: MockBridgeHost) => h.setContext({ locale: 'en' }),
			{ type: 'CONTEXT_CHANGED', context: { locale: 'en' } }
		],
		['setAudioMuted', (h: MockBridgeHost) => h.setAudioMuted(true), { type: 'AUDIO_MUTED_CHANGED', muted: true }],
		['setTheme', (h: MockBridgeHost) => h.setTheme('light'), { type: 'THEME_CHANGED', theme: 'light' }]
	])('%s posts %o to the game window', (_name, act, event) => {
		const target = { postMessage: vi.fn() }
		act(new MockBridgeHost({ targetWindow: target as any }))
		expect(target.postMessage.mock.calls).toEqual([[event, '*']])
	})

	it('later RPC answers reflect what was pushed', async () => {
		const pair = connectMockHost({ address: 'addr_a', networkId: 0 })
		pair.host.switchAccount('addr_b')
		pair.host.switchNetwork(1)
		pair.host.setTheme('light')
		expect((await ask(pair, { type: 'WALLET_GET_ADDRESS' }))[0].data.result).toBe('addr_b')
		expect((await ask(pair, { type: 'WALLET_GET_NETWORK' }))[0].data.result).toBe(1)
		expect((await ask(pair, { type: 'GET_CONTEXT' }))[0].data.result.theme).toBe('light')
	})

	it('logs instead of throwing when the target window rejects the message', () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {})
		const target = {
			postMessage: () => {
				throw new Error('detached')
			}
		}
		expect(() => new MockBridgeHost({ targetWindow: target as any }).disconnect()).not.toThrow()
		expect(error).toHaveBeenCalledWith('[MockBridgeHost] Gửi push event thất bại:', expect.any(Error))
	})
})

describe('Game DevTools widget', () => {
	const stubDocument = () => {
		const container: any = {
			id: '',
			style: {},
			innerHTML: '',
			querySelector: () => null,
			parentNode: null
		}
		const body = {
			appendChild: vi.fn((el: any) => (el.parentNode = body)),
			removeChild: vi.fn((el: any) => (el.parentNode = null))
		}
		vi.stubGlobal('document', { createElement: () => ({ ...container }), body })
		return body
	}

	it('mount starts a host that answers requests and attaches the widget; unmount detaches both', async () => {
		const page = installIframe() // any window with a message bus
		const body = stubDocument()

		const { unmount } = mountGameDevtools({ address: 'addr_dev', latencyMs: 0 })
		const [widget] = body.appendChild.mock.calls[0]
		expect(widget.id).toBe('hydra-game-devtools-root')
		expect(widget.innerHTML).toMatch(/Hydra Game DevTools/)

		const game = { postMessage: vi.fn() }
		page.deliver({ type: 'WALLET_GET_ADDRESS', requestId: 'r1' }, { source: game })
		await flushHost()
		expect(game.postMessage).toHaveBeenCalledWith(
			{ type: 'WALLET_ADDRESS_RESULT', requestId: 'r1', result: 'addr_dev' },
			'*'
		)

		unmount()
		expect(body.removeChild).toHaveBeenCalledWith(widget)
		expect(page.listeners).toHaveLength(0)
	})

	it('mounting twice replaces the previous widget and host', () => {
		const page = installIframe()
		const body = stubDocument()
		mountGameDevtools()
		const [first] = body.appendChild.mock.calls[0]
		mountGameDevtools()
		expect(body.removeChild).toHaveBeenCalledWith(first)
		expect(body.appendChild).toHaveBeenCalledTimes(2)
		expect(page.listeners).toHaveLength(1)
	})

	it('without a DOM, returns an unstarted host and a no-op unmount', () => {
		vi.stubGlobal('document', undefined)
		const { host, unmount } = mountGameDevtools({ address: 'addr_ssr' })
		expect(host.address).toBe('addr_ssr')
		expect(() => unmount()).not.toThrow()
	})
})
