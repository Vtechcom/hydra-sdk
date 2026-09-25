import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MockBridgeHost } from '../src/simulator/host'
import { mountGameDevtools, unmountGameDevtools } from '../src/simulator/devtools'

describe('Simulator & DevTools', () => {
	let messageListeners: Array<(event: any) => void>

	beforeEach(() => {
		messageListeners = []
		vi.stubGlobal('window', {
			addEventListener: (event: string, handler: any) => {
				if (event === 'message') messageListeners.push(handler)
			},
			removeEventListener: (event: string, handler: any) => {
				if (event === 'message') {
					messageListeners = messageListeners.filter(h => h !== handler)
				}
			},
			postMessage: vi.fn()
		})
	})

	afterEach(() => {
		unmountGameDevtools()
		vi.unstubAllGlobals()
	})

	it('MockBridgeHost should handle RPC requests correctly', async () => {
		vi.useFakeTimers()
		const rpcLogs: any[] = []
		const host = new MockBridgeHost({
			address: 'addr_sim_test',
			networkId: 1,
			latencyMs: 10,
			onRpcLog: log => rpcLogs.push(log)
		})
		host.start()

		const mockSource = { postMessage: vi.fn() } as any

		// Simulate client sending WALLET_GET_ADDRESS
		for (const listener of messageListeners) {
			listener({
				data: {
					type: 'WALLET_GET_ADDRESS',
					requestId: 'req_1'
				},
				source: mockSource
			})
		}

		vi.advanceTimersByTime(15)

		expect(mockSource.postMessage).toHaveBeenCalledWith(
			{
				type: 'WALLET_ADDRESS_RESULT',
				requestId: 'req_1',
				result: 'addr_sim_test'
			},
			'*'
		)
		expect(rpcLogs.length).toBe(1)
		expect(rpcLogs[0].type).toBe('WALLET_GET_ADDRESS')

		host.stop()
		vi.useRealTimers()
	})

	it('MockBridgeHost should send push events for connect, disconnect, switchAccount, switchNetwork', () => {
		const mockTarget = { postMessage: vi.fn() } as any
		const host = new MockBridgeHost({ targetWindow: mockTarget })

		host.connect('addr_new', 0)
		expect(mockTarget.postMessage).toHaveBeenCalledWith(
			{
				type: 'WALLET_CONNECTED',
				address: 'addr_new',
				networkId: 0
			},
			'*'
		)

		host.switchAccount('addr_switched')
		expect(mockTarget.postMessage).toHaveBeenCalledWith(
			{
				type: 'WALLET_ACCOUNT_CHANGED',
				address: 'addr_switched'
			},
			'*'
		)

		host.switchNetwork(1)
		expect(mockTarget.postMessage).toHaveBeenCalledWith(
			{
				type: 'WALLET_NETWORK_CHANGED',
				networkId: 1
			},
			'*'
		)

		host.disconnect()
		expect(mockTarget.postMessage).toHaveBeenCalledWith(
			{
				type: 'WALLET_DISCONNECTED'
			},
			'*'
		)
	})

	it('mountGameDevtools and unmountGameDevtools should manage lifecycle safely', () => {
		const docMock = {
			createElement: vi.fn().mockReturnValue({
				id: '',
				style: {},
				innerHTML: '',
				querySelector: vi.fn().mockReturnValue(null),
				parentNode: { removeChild: vi.fn() }
			}),
			body: {
				appendChild: vi.fn()
			}
		}
		vi.stubGlobal('document', docMock)

		const { host, unmount } = mountGameDevtools({ address: 'addr_dev' })
		expect(host).toBeDefined()
		expect(docMock.body.appendChild).toHaveBeenCalled()

		unmount()
	})
})
