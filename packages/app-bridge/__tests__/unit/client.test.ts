import { describe, it, expect, afterEach, vi } from 'vitest'
import { WalletBridgeClient } from '../../src/client'
import {
	WalletBridgeError,
	WalletBridgeNotInIframeError,
	WalletBridgeRpcError,
	WalletBridgeTimeoutError,
	WalletBridgeUserRejectedError
} from '../../src/errors'
import { DEFAULT_TIMEOUTS } from '../../src/types'
import { GAME_ORIGIN, HOST_ORIGIN, connectMockHost, installIframe, installTopWindow } from '../helpers/fake-window'

let client: WalletBridgeClient | undefined
const track = (c: WalletBridgeClient) => (client = c)

afterEach(() => {
	client?.destroy()
	client = undefined
	vi.useRealTimers()
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

describe('WalletBridgeClient — environment detection', () => {
	it('detects an iframe and auto-probes ping, address and network', () => {
		const frame = installIframe()
		const c = track(new WalletBridgeClient())
		expect(c.isInIframe()).toBe(true)
		expect(frame.toParent.map(p => p.data.type)).toEqual(['WALLET_PING', 'WALLET_GET_ADDRESS', 'WALLET_GET_NETWORK'])
	})

	it('treats a throwing window.parent (cross-origin SecurityError) as an iframe', () => {
		const frame = installIframe()
		Object.defineProperty(frame.window, 'parent', {
			get: () => {
				throw new Error('SecurityError')
			}
		})
		expect(track(new WalletBridgeClient({ autoProbe: false })).isInIframe()).toBe(true)
	})

	it('outside an iframe without mock/fallback, every request rejects with WalletBridgeNotInIframeError', async () => {
		installTopWindow()
		const c = track(new WalletBridgeClient())
		expect(c.isInIframe()).toBe(false)
		const pending = c.getChangeAddress()
		await expect(pending).rejects.toBeInstanceOf(WalletBridgeNotInIframeError)
		await expect(pending).rejects.toThrow(/không chạy bên trong iframe hợp lệ/)
	})
})

// The default origin is '*': requests (including sign payloads) are posted to
// whatever origin the parent has, and replies are accepted from any origin as
// long as they come from window.parent. These tests pin that contract so a
// change to the default is a deliberate, visible decision.
describe("WalletBridgeClient — appCenterOrigin defaults to '*'", () => {
	it("posts every request with targetOrigin '*'", () => {
		const frame = installIframe()
		const c = track(new WalletBridgeClient({ autoProbe: false }))
		expect(c.getAppCenterOrigin()).toBe('*')
		c.signTx('84a400', true).catch(() => {}) // rejected by destroy() in afterEach
		expect(frame.toParent).toEqual([
			{
				data: { type: 'WALLET_SIGN_TX', txHex: '84a400', partialSign: true, requestId: expect.any(String) },
				targetOrigin: '*'
			}
		])
	})

	it('accepts a reply and a push event from any origin, if the source is window.parent', async () => {
		const frame = installIframe()
		const c = track(new WalletBridgeClient({ autoProbe: false }))
		const accountChanged = vi.fn()
		c.on('accountChanged', accountChanged)

		const pending = c.getChangeAddress()
		frame.reply('WALLET_GET_ADDRESS', { type: 'WALLET_ADDRESS_RESULT', result: 'addr_test1_any' }, 'https://evil.example')
		frame.deliver({ type: 'WALLET_ACCOUNT_CHANGED', address: 'addr_test1_evil' }, { origin: 'https://evil.example' })

		await expect(pending).resolves.toBe('addr_test1_any')
		expect(accountChanged).toHaveBeenCalledWith('addr_test1_evil')
	})

	it('still ignores messages whose source is not window.parent', async () => {
		const frame = installIframe()
		const c = track(new WalletBridgeClient({ autoProbe: false }))
		const connected = vi.fn()
		c.on('connected', connected)
		frame.deliver({ type: 'WALLET_CONNECTED', address: 'addr_fake', networkId: 1 }, { source: {} })
		expect(connected).not.toHaveBeenCalled()
		expect(c.isConnected).toBe(false)
	})
})

describe('WalletBridgeClient — pinned appCenterOrigin', () => {
	it('posts to the configured origin and drops messages from any other origin', async () => {
		const frame = installIframe()
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		vi.spyOn(console, 'log').mockImplementation(() => {})
		const c = track(new WalletBridgeClient({ appCenterOrigin: HOST_ORIGIN, autoProbe: false, debug: true }))

		const pending = c.getNetworkId({ timeoutMs: 50 })
		expect(frame.toParent[0].targetOrigin).toBe(HOST_ORIGIN)
		frame.reply('WALLET_GET_NETWORK', { type: 'WALLET_NETWORK_RESULT', result: 1 }, 'https://evil.example')
		expect(warn).toHaveBeenCalledWith(
			'[WalletBridgeClient] Từ chối message từ origin không khớp:',
			'https://evil.example'
		)

		frame.reply('WALLET_GET_NETWORK', { type: 'WALLET_NETWORK_RESULT', result: 0 }, HOST_ORIGIN)
		await expect(pending).resolves.toBe(0)
		expect(c.currentNetworkId).toBe(0)
	})

	it('setAppCenterOrigin retargets subsequent requests', () => {
		const frame = installIframe()
		const c = track(new WalletBridgeClient({ autoProbe: false }))
		c.setAppCenterOrigin(HOST_ORIGIN)
		c.ping().catch(() => {})
		expect(frame.toParent.map(p => p.targetOrigin)).toEqual([HOST_ORIGIN])
	})
})

describe('WalletBridgeClient — RPC methods', () => {
	type Case = {
		name: string
		call: (c: WalletBridgeClient) => Promise<unknown>
		request: Record<string, unknown>
		responseType: string
		result: unknown
	}
	it.each<Case>([
		{
			name: 'submitTx',
			call: c => c.submitTx('84a5'),
			request: { type: 'WALLET_SUBMIT_TX', txHex: '84a5' },
			responseType: 'WALLET_SUBMIT_TX_RESULT',
			result: 'ab'.repeat(32)
		},
		{
			name: 'signTx',
			call: c => c.signTx('84a5'),
			request: { type: 'WALLET_SIGN_TX', txHex: '84a5', partialSign: false },
			responseType: 'WALLET_SIGN_TX_RESULT',
			result: 'a100'
		},
		{
			name: 'signData',
			call: c => c.signData('addr_test1x', '6869'),
			request: { type: 'WALLET_SIGN_DATA', address: 'addr_test1x', hexPayload: '6869' },
			responseType: 'WALLET_SIGN_DATA_RESULT',
			result: { signature: '84', key: 'a4' }
		},
		{
			name: 'getBalance',
			call: c => c.getBalance(),
			request: { type: 'WALLET_GET_BALANCE' },
			responseType: 'WALLET_GET_BALANCE_RESULT',
			result: '1a000f4240'
		},
		{
			name: 'getUtxos',
			call: c => c.getUtxos('2000000'),
			request: { type: 'WALLET_GET_UTXOS', amount: '2000000' },
			responseType: 'WALLET_GET_UTXOS_RESULT',
			result: ['82825820']
		},
		{
			name: 'getCollateral',
			call: c => c.getCollateral('5000000'),
			request: { type: 'WALLET_GET_COLLATERAL', amount: '5000000' },
			responseType: 'WALLET_GET_COLLATERAL_RESULT',
			result: [{ txHash: 'abc', index: 0 }]
		},
		{
			name: 'getRewardAddresses',
			call: c => c.getRewardAddresses(),
			request: { type: 'WALLET_GET_REWARD_ADDRESSES' },
			responseType: 'WALLET_GET_REWARD_ADDRESSES_RESULT',
			result: ['stake_test1u']
		},
		{
			name: 'getUsedAddresses',
			call: c => c.getUsedAddresses(),
			request: { type: 'WALLET_GET_USED_ADDRESSES' },
			responseType: 'WALLET_GET_USED_ADDRESSES_RESULT',
			result: ['addr_test1q']
		},
		{
			name: 'batch',
			call: c => c.batch([{ type: 'WALLET_GET_NETWORK' }]),
			request: { type: 'WALLET_BATCH_REQUEST', requests: [{ type: 'WALLET_GET_NETWORK' }] },
			responseType: 'WALLET_BATCH_RESULT',
			result: [0]
		},
		{
			name: 'hostStorageGet',
			call: c => c.hostStorageGet('k'),
			request: { type: 'HOST_STORAGE_GET', key: 'k' },
			responseType: 'HOST_STORAGE_GET_RESULT',
			result: 'v'
		},
		{
			name: 'hostStorageSet',
			call: c => c.hostStorageSet('k', 'v'),
			request: { type: 'HOST_STORAGE_SET', key: 'k', value: 'v' },
			responseType: 'HOST_STORAGE_SET_RESULT',
			result: true
		},
		{
			name: 'hostStorageRemove',
			call: c => c.hostStorageRemove('k'),
			request: { type: 'HOST_STORAGE_REMOVE', key: 'k' },
			responseType: 'HOST_STORAGE_REMOVE_RESULT',
			result: true
		}
	])(
		'$name posts its request and resolves with the matching result',
		async ({ call, request, responseType, result }) => {
			const frame = installIframe()
			const c = track(new WalletBridgeClient({ autoProbe: false }))
			const pending = call(c)
			expect(frame.toParent).toEqual([{ data: { ...request, requestId: expect.any(String) }, targetOrigin: '*' }])
			frame.reply(request.type as string, { type: responseType, result })
			await expect(pending).resolves.toEqual(result)
		}
	)

	it('matches replies by requestId, so out-of-order replies resolve the right call', async () => {
		const frame = installIframe()
		const c = track(new WalletBridgeClient({ autoProbe: false }))
		const balance = c.getBalance()
		const tx = c.submitTx('84')
		frame.reply('WALLET_SUBMIT_TX', { type: 'WALLET_SUBMIT_TX_RESULT', result: 'txid' })
		frame.reply('WALLET_GET_BALANCE', { type: 'WALLET_GET_BALANCE_RESULT', result: '00' })
		await expect(tx).resolves.toBe('txid')
		await expect(balance).resolves.toBe('00')
	})

	it('ignores a reply with an unknown requestId', () => {
		const frame = installIframe()
		const c = track(new WalletBridgeClient({ autoProbe: false }))
		frame.deliver({ type: 'WALLET_ADDRESS_RESULT', requestId: 'not-ours', result: 'addr_x' })
		expect(c.currentAddress).toBeNull()
	})
})

describe('WalletBridgeClient — state-carrying replies', () => {
	it('WALLET_ADDRESS_RESULT connects, and a later null result disconnects', async () => {
		const frame = installIframe()
		const c = track(new WalletBridgeClient({ autoProbe: false }))
		const events: unknown[] = []
		c.on('connected', e => events.push(['connected', e]))
		c.on('disconnected', () => events.push(['disconnected']))

		const first = c.getChangeAddress()
		frame.reply('WALLET_GET_ADDRESS', { type: 'WALLET_ADDRESS_RESULT', result: 'addr_test1a' })
		await first
		expect([c.isConnected, c.currentAddress]).toEqual([true, 'addr_test1a'])

		const second = c.getChangeAddress()
		frame.reply('WALLET_GET_ADDRESS', { type: 'WALLET_ADDRESS_RESULT', result: null })
		await expect(second).resolves.toBeNull()
		expect([c.isConnected, c.currentAddress]).toEqual([false, null])
		expect(events).toEqual([['connected', { address: 'addr_test1a', networkId: 0 }], ['disconnected']])
	})

	it('WALLET_CONNECT_RESULT sets address and network and emits connected', async () => {
		const frame = installIframe()
		const c = track(new WalletBridgeClient({ autoProbe: false }))
		const connected = vi.fn()
		c.on('connected', connected)
		const pending = c.requestConnect()
		frame.reply('WALLET_CONNECT', { type: 'WALLET_CONNECT_RESULT', result: { address: 'addr1q', networkId: 1 } })
		await expect(pending).resolves.toEqual({ address: 'addr1q', networkId: 1 })
		expect([c.currentAddress, c.currentNetworkId, c.isConnected]).toEqual(['addr1q', 1, true])
		expect(connected).toHaveBeenCalledWith({ address: 'addr1q', networkId: 1 })
	})

	it('WALLET_PONG records capabilities; isMethodSupported is null until then', async () => {
		const frame = installIframe()
		const c = track(new WalletBridgeClient({ autoProbe: false }))
		const caps = vi.fn()
		c.on('capabilitiesUpdated', caps)
		expect(c.isMethodSupported('WALLET_SIGN_TX')).toBeNull()

		const pending = c.ping()
		frame.reply('WALLET_PING', {
			type: 'WALLET_PONG',
			result: {
				version: '1.0.0',
				isConnected: true,
				address: 'addr1p',
				networkId: 1,
				supportedMethods: ['WALLET_SIGN_TX']
			}
		})
		await pending
		expect(c.isMethodSupported('WALLET_SIGN_TX')).toBe(true)
		expect(c.isMethodSupported('WALLET_SUBMIT_TX')).toBe(false)
		expect(c.getSupportedMethods()).toEqual(['WALLET_SIGN_TX'])
		expect(caps).toHaveBeenCalledWith(['WALLET_SIGN_TX'])
		expect([c.currentAddress, c.currentNetworkId, c.isConnected]).toEqual(['addr1p', 1, true])
	})
})

describe('WalletBridgeClient — push events', () => {
	it.each([
		{
			push: { type: 'WALLET_CONNECTED', address: 'addr_1', networkId: 0 },
			event: 'connected',
			args: [{ address: 'addr_1', networkId: 0 }],
			state: { isConnected: true, currentAddress: 'addr_1', currentNetworkId: 0 }
		},
		{
			push: { type: 'WALLET_ACCOUNT_CHANGED', address: 'addr_2' },
			event: 'accountChanged',
			args: ['addr_2'],
			state: { currentAddress: 'addr_2' }
		},
		{
			push: { type: 'WALLET_NETWORK_CHANGED', networkId: 1 },
			event: 'networkChanged',
			args: [1],
			state: { currentNetworkId: 1 }
		},
		{
			push: { type: 'WALLET_DISCONNECTED' },
			event: 'disconnected',
			args: [],
			state: { isConnected: false, currentAddress: null }
		},
		{
			push: { type: 'CONTEXT_CHANGED', context: { locale: 'en' } },
			event: 'contextChanged',
			args: [{ locale: 'en' }],
			state: {}
		},
		{ push: { type: 'AUDIO_MUTED_CHANGED', muted: true }, event: 'audioMutedChanged', args: [true], state: {} },
		{ push: { type: 'THEME_CHANGED', theme: 'light' }, event: 'themeChanged', args: ['light'], state: {} }
	] as const)('$push.type emits $event and updates state', ({ push, event, args, state }) => {
		const frame = installIframe()
		const c = track(new WalletBridgeClient({ autoProbe: false }))
		const handler = vi.fn()
		c.on(event, handler)
		frame.deliver(push)
		expect(handler).toHaveBeenCalledWith(...args)
		expect(c).toMatchObject(state)
	})

	it('off() unsubscribes, and a throwing handler is logged without breaking the others', () => {
		const frame = installIframe()
		const error = vi.spyOn(console, 'error').mockImplementation(() => {})
		const c = track(new WalletBridgeClient({ autoProbe: false }))
		const removed = vi.fn()
		const after = vi.fn()
		c.on('networkChanged', () => {
			throw new Error('boom')
		})
		c.on('networkChanged', removed)
		c.on('networkChanged', after)
		c.off('networkChanged', removed)

		frame.deliver({ type: 'WALLET_NETWORK_CHANGED', networkId: 1 })
		expect(removed).not.toHaveBeenCalled()
		expect(after).toHaveBeenCalledWith(1)
		expect(error).toHaveBeenCalledWith(
			'[WalletBridgeClient] Lỗi thực thi event handler "networkChanged":',
			expect.any(Error)
		)
	})
})

describe('WalletBridgeClient — failures', () => {
	it.each(['User declined signing', 'Request rejected', 'Signing cancelled by wallet'])(
		'a host error containing a rejection word ("%s") rejects with WalletBridgeUserRejectedError',
		async hostError => {
			const frame = installIframe()
			const c = track(new WalletBridgeClient({ autoProbe: false }))
			const pending = c.signTx('84')
			frame.reply('WALLET_SIGN_TX', { type: 'WALLET_SIGN_TX_RESULT', error: hostError })
			await expect(pending).rejects.toBeInstanceOf(WalletBridgeUserRejectedError)
			await expect(pending).rejects.toThrow(new RegExp(`Người dùng đã từ chối thao tác ví: ${hostError}`))
		}
	)

	it('any other host error rejects with WalletBridgeRpcError naming the request type', async () => {
		const frame = installIframe()
		const c = track(new WalletBridgeClient({ autoProbe: false }))
		const pending = c.submitTx('84')
		frame.reply('WALLET_SUBMIT_TX', { type: 'WALLET_SUBMIT_TX_RESULT', error: 'BadInputsUTxO' })
		await expect(pending).rejects.toBeInstanceOf(WalletBridgeRpcError)
		await expect(pending).rejects.toThrow(/RPC Error trên Host \(WALLET_SUBMIT_TX\): BadInputsUTxO/)
	})

	it.each(['WALLET_PING', 'WALLET_GET_UTXOS', 'WALLET_SIGN_TX'] as const)(
		'%s times out after its tier in DEFAULT_TIMEOUTS',
		async type => {
			vi.useFakeTimers()
			installIframe()
			const c = track(new WalletBridgeClient({ autoProbe: false }))
			const pending = c.sendRequest({ type } as any)
			const assertion = expect(pending).rejects.toThrow(
				new RegExp(`Request ${type} timeout sau ${DEFAULT_TIMEOUTS[type]}ms`)
			)
			vi.advanceTimersByTime(DEFAULT_TIMEOUTS[type] - 1)
			let settled = false
			pending.catch(() => (settled = true))
			await Promise.resolve()
			expect(settled).toBe(false)
			vi.advanceTimersByTime(1)
			await assertion
		}
	)

	it('a per-call timeoutMs overrides both the client timeout and the tier', async () => {
		vi.useFakeTimers()
		installIframe()
		const c = track(new WalletBridgeClient({ autoProbe: false, timeoutMs: 10_000 }))
		const pending = c.signTx('84', false, { timeoutMs: 20 })
		vi.advanceTimersByTime(20)
		await expect(pending).rejects.toBeInstanceOf(WalletBridgeTimeoutError)
		await expect(pending).rejects.toThrow(/timeout sau 20ms/)
	})

	it('rejects with the postMessage error when posting to the parent throws', async () => {
		const frame = installIframe()
		frame.parent.postMessage = () => {
			throw new Error('DataCloneError')
		}
		const c = track(new WalletBridgeClient({ autoProbe: false }))
		await expect(c.getBalance()).rejects.toThrow(/DataCloneError/)
	})

	it('destroy() rejects pending requests, and later requests fail fast', async () => {
		installIframe()
		const c = track(new WalletBridgeClient({ autoProbe: false }))
		const pending = c.signTx('84')
		c.destroy()
		await expect(pending).rejects.toThrow(/Client instance đã bị hủy/)
		await expect(c.getBalance()).rejects.toBeInstanceOf(WalletBridgeError)
		await expect(c.getBalance()).rejects.toThrow(/Client instance đã bị hủy/)
	})
})

describe('WalletBridgeClient — against a real MockBridgeHost', () => {
	it('round-trips address, network and capabilities through postMessage', async () => {
		const { host } = connectMockHost({ address: 'addr_test1_host', networkId: 0 })
		const c = track(new WalletBridgeClient({ autoProbe: false }))
		await expect(c.getChangeAddress()).resolves.toBe('addr_test1_host')
		await expect(c.getNetworkId()).resolves.toBe(0)
		await c.ping()
		expect(c.isMethodSupported('WALLET_SIGN_TX')).toBe(true)
		host.switchAccount('addr_test1_next')
		expect(c.currentAddress).toBe('addr_test1_next')
	})

	it('a host that does not auto-approve makes signTx reject as user-rejected', async () => {
		connectMockHost({ autoApprove: false })
		const c = track(new WalletBridgeClient({ autoProbe: false }))
		const pending = c.signTx('84')
		await expect(pending).rejects.toBeInstanceOf(WalletBridgeUserRejectedError)
		await expect(pending).rejects.toThrow(/User declined or cancelled the transaction/)
	})
})

describe('WalletBridgeClient — standalone mock mode', () => {
	it('is connected synchronously and emits connected on the next tick', async () => {
		installTopWindow()
		const c = track(new WalletBridgeClient({ mock: { address: 'addr_test_mock', networkId: 0 } }))
		expect([c.isConnected, c.currentAddress, c.currentNetworkId]).toEqual([true, 'addr_test_mock', 0])
		const connected = await new Promise(resolve => c.on('connected', resolve))
		expect(connected).toEqual({ address: 'addr_test_mock', networkId: 0 })
	})

	it('answers wallet calls from the mock config and keeps a host-storage relay in memory', async () => {
		installTopWindow()
		const c = track(
			new WalletBridgeClient({
				mock: { address: 'addr_test_mock', networkId: 0, balance: '50000000', rewardAddresses: ['stake_test_mock'] }
			})
		)
		await expect(c.getBalance()).resolves.toBe('50000000')
		await expect(c.getRewardAddresses()).resolves.toEqual(['stake_test_mock'])
		await expect(c.getUsedAddresses()).resolves.toEqual(['addr_test_mock'])
		await expect(c.signData('addr', '00')).resolves.toEqual({
			signature: 'mock_signature_hex_data',
			key: 'mock_public_key_hex'
		})
		await c.hostStorageSet('k', 'v')
		await expect(c.hostStorageGet('k')).resolves.toBe('v')
		await c.hostStorageRemove('k')
		await expect(c.hostStorageGet('k')).resolves.toBeNull()
		await expect(c.batch([{ type: 'WALLET_GET_ADDRESS' }, { type: 'WALLET_GET_NETWORK' }])).resolves.toEqual([
			'addr_test_mock',
			0
		])
	})
})

describe('WalletBridgeClient — CIP-30 extension fallback', () => {
	// Enterprise testnet address, header 0x60 + 28 zero bytes. Bech32 from CSL:
	// Address.from_hex(ENTERPRISE_HEX).to_bech32() (cardano-serialization-lib-nodejs).
	const ENTERPRISE_HEX = '60' + '00'.repeat(28)
	const ENTERPRISE_BECH32 = 'addr_test1vqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqd9tg5t'

	const cip30 = (overrides: Record<string, unknown> = {}) => ({
		getChangeAddress: vi.fn().mockResolvedValue(ENTERPRISE_HEX),
		getUsedAddresses: vi.fn().mockResolvedValue([ENTERPRISE_HEX]),
		getNetworkId: vi.fn().mockResolvedValue(0),
		signTx: vi.fn().mockResolvedValue('a100'),
		...overrides
	})

	it('uses the preferred wallet and returns bech32 addresses from its hex', async () => {
		const nami = cip30()
		const lace = cip30({ getChangeAddress: vi.fn().mockResolvedValue('61' + '00'.repeat(28)) })
		installTopWindow({ cardano: { nami: { enable: async () => nami }, lace: { enable: async () => lace } } })
		const c = track(new WalletBridgeClient({ fallbackToExtension: true, preferredWallet: 'nami' }))

		await expect(c.getChangeAddress()).resolves.toBe(ENTERPRISE_BECH32)
		expect([c.currentAddress, c.isConnected]).toEqual([ENTERPRISE_BECH32, true])
		await expect(c.getUsedAddresses()).resolves.toEqual([ENTERPRISE_BECH32])
		await expect(c.signTx('84', true)).resolves.toBe('a100')
		expect(nami.signTx).toHaveBeenCalledWith('84', true)
		expect(lace.getChangeAddress).not.toHaveBeenCalled()
	})

	it('requestConnect reads address and network and emits connected', async () => {
		installTopWindow({ cardano: { nami: { enable: async () => cip30() } } })
		const c = track(new WalletBridgeClient({ fallbackToExtension: true }))
		const connected = vi.fn()
		c.on('connected', connected)
		await expect(c.requestConnect()).resolves.toEqual({ address: ENTERPRISE_BECH32, networkId: 0 })
		expect(connected).toHaveBeenCalledWith({ address: ENTERPRISE_BECH32, networkId: 0 })
	})

	it('rejects when window.cardano has no CIP-30 wallet', async () => {
		installTopWindow({ cardano: { notAWallet: {} } })
		const c = track(new WalletBridgeClient({ fallbackToExtension: true }))
		await expect(c.getBalance()).rejects.toThrow(/Không tìm thấy ví CIP-30 trong window.cardano/)
	})

	it('rejects when enable() returns no API', async () => {
		installTopWindow({ cardano: { nami: { enable: async () => null } } })
		const c = track(new WalletBridgeClient({ fallbackToExtension: true }))
		await expect(c.getBalance()).rejects.toThrow(/Kích hoạt ví nami thất bại/)
	})

	it('a batch maps a failing sub-request to null instead of rejecting', async () => {
		installTopWindow({
			cardano: { nami: { enable: async () => cip30({ getNetworkId: vi.fn().mockRejectedValue(new Error('locked')) }) } }
		})
		const c = track(new WalletBridgeClient({ fallbackToExtension: true }))
		await expect(c.batch([{ type: 'WALLET_GET_NETWORK' }, { type: 'WALLET_GET_ADDRESS' }])).resolves.toEqual([
			null,
			ENTERPRISE_BECH32
		])
	})

	it('GET_CONTEXT reports the game page origin', async () => {
		installTopWindow({ cardano: { nami: { enable: async () => cip30() } } })
		const c = track(new WalletBridgeClient({ fallbackToExtension: true }))
		await expect(c.lifecycle.getContext()).resolves.toMatchObject({ appCenterOrigin: GAME_ORIGIN })
	})
})
