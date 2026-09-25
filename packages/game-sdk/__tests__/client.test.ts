import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { WalletBridgeClient } from '../src/client'
import {
	WalletBridgeUserRejectedError,
	WalletBridgeNotInIframeError,
	WalletBridgeTimeoutError
} from '../src/errors'

describe('WalletBridgeClient', () => {
	let mockParent: { postMessage: ReturnType<typeof vi.fn> }
	let messageListeners: Array<(event: any) => void>

	beforeEach(() => {
		messageListeners = []
		mockParent = {
			postMessage: vi.fn()
		}

		vi.stubGlobal('window', {
			parent: mockParent,
			addEventListener: (event: string, handler: any) => {
				if (event === 'message') {
					messageListeners.push(handler)
				}
			},
			removeEventListener: (event: string, handler: any) => {
				if (event === 'message') {
					messageListeners = messageListeners.filter(h => h !== handler)
				}
			},
			localStorage: {
				getItem: vi.fn(),
				setItem: vi.fn(),
				removeItem: vi.fn(),
				clear: vi.fn()
			}
		})
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('should initialize and detect iframe correctly', () => {
		const client = new WalletBridgeClient({ debug: false, autoProbe: false })
		expect(client.isInIframe()).toBe(true)
		client.destroy()
	})

	it('should return false for isInIframe and throw WalletBridgeNotInIframeError when window.parent === window', async () => {
		const selfWin = {} as any
		selfWin.parent = selfWin
		selfWin.addEventListener = vi.fn()
		selfWin.removeEventListener = vi.fn()
		vi.stubGlobal('window', selfWin)

		const client = new WalletBridgeClient({ autoProbe: false })
		expect(client.isInIframe()).toBe(false)
		await expect(client.getChangeAddress()).rejects.toBeInstanceOf(WalletBridgeNotInIframeError)
		client.destroy()
	})

	it('should support standalone mock mode without iframe', async () => {
		const selfWin = {} as any
		selfWin.parent = selfWin
		selfWin.addEventListener = vi.fn()
		selfWin.removeEventListener = vi.fn()
		vi.stubGlobal('window', selfWin)

		const client = new WalletBridgeClient({
			autoProbe: false,
			mock: {
				address: 'addr_test_mock_123',
				networkId: 0,
				balance: '50000000',
				rewardAddresses: ['stake_test_mock_123']
			}
		})

		expect(client.isConnected).toBe(true)
		expect(client.currentAddress).toBe('addr_test_mock_123')
		expect(client.currentNetworkId).toBe(0)

		const addr = await client.getChangeAddress()
		expect(addr).toBe('addr_test_mock_123')

		const balance = await client.getBalance()
		expect(balance).toBe('50000000')

		const rewards = await client.getRewardAddresses()
		expect(rewards).toEqual(['stake_test_mock_123'])

		const signData = await client.signData('addr', 'payload')
		expect(signData?.signature).toBe('mock_signature_hex_data')

		client.destroy()
	})

	it('should auto-probe address and network on mount when autoProbe is true', () => {
		const client = new WalletBridgeClient({ autoProbe: true })
		expect(mockParent.postMessage).toHaveBeenCalledTimes(2)
		const calls = mockParent.postMessage.mock.calls
		expect(calls[0][0].type).toBe('WALLET_GET_ADDRESS')
		expect(calls[1][0].type).toBe('WALLET_GET_NETWORK')
		client.destroy()
	})

	it('should send RPC request and resolve upon valid response', async () => {
		const client = new WalletBridgeClient({ appCenterOrigin: 'https://hydraone.io', autoProbe: false })

		const promise = client.getChangeAddress()

		expect(mockParent.postMessage).toHaveBeenCalledTimes(1)
		const [req, origin] = mockParent.postMessage.mock.calls[0]
		expect(origin).toBe('https://hydraone.io')
		expect(req.type).toBe('WALLET_GET_ADDRESS')
		expect(req.requestId).toBeDefined()

		// Simulate response from parent
		const responseEvent = {
			source: mockParent,
			origin: 'https://hydraone.io',
			data: {
				type: 'WALLET_ADDRESS_RESULT',
				requestId: req.requestId,
				result: 'addr_test1qz2fxv2um5tjaq62synchronized'
			}
		}

		for (const listener of messageListeners) {
			listener(responseEvent)
		}

		const address = await promise
		expect(address).toBe('addr_test1qz2fxv2um5tjaq62synchronized')
		expect(client.isConnected).toBe(true)
		expect(client.currentAddress).toBe('addr_test1qz2fxv2um5tjaq62synchronized')

		client.destroy()
	})

	it('should reject RPC request with WalletBridgeUserRejectedError upon user decline', async () => {
		const client = new WalletBridgeClient({ timeoutMs: 1000, autoProbe: false })

		const promise = client.signTx('tx-hex-data')
		const [req] = mockParent.postMessage.mock.calls[0]

		const errorEvent = {
			source: mockParent,
			origin: '*',
			data: {
				type: 'WALLET_SIGN_TX_RESULT',
				requestId: req.requestId,
				result: null,
				error: 'User declined transaction signing'
			}
		}

		for (const listener of messageListeners) {
			listener(errorEvent)
		}

		await expect(promise).rejects.toBeInstanceOf(WalletBridgeUserRejectedError)
		client.destroy()
	})

	it('should reject RPC request with WalletBridgeTimeoutError on timeout', async () => {
		vi.useFakeTimers()
		const client = new WalletBridgeClient({ timeoutMs: 500, autoProbe: false })

		const promise = client.signTx('tx-hex-data')
		vi.advanceTimersByTime(501)

		await expect(promise).rejects.toBeInstanceOf(WalletBridgeTimeoutError)
		client.destroy()
		vi.useRealTimers()
	})

	it('should ignore message from invalid origin or unknown source', async () => {
		const client = new WalletBridgeClient({ appCenterOrigin: 'https://hydraone.io', autoProbe: false })

		let pushReceived = false
		client.on('connected', () => {
			pushReceived = true
		})

		// Message from untrusted origin
		for (const listener of messageListeners) {
			listener({
				source: mockParent,
				origin: 'https://attacker.com',
				data: {
					type: 'WALLET_CONNECTED',
					address: 'addr_fake',
					networkId: 1
				}
			})
		}
		expect(pushReceived).toBe(false)

		// Message not from window.parent
		for (const listener of messageListeners) {
			listener({
				source: {} as any, // not parent
				origin: 'https://hydraone.io',
				data: {
					type: 'WALLET_CONNECTED',
					address: 'addr_fake',
					networkId: 1
				}
			})
		}
		expect(pushReceived).toBe(false)

		client.destroy()
	})

	it('should handle push events (connected, accountChanged, networkChanged, disconnected)', () => {
		const client = new WalletBridgeClient({ autoProbe: false })

		const connectedSpy = vi.fn()
		const accountSpy = vi.fn()
		const networkSpy = vi.fn()
		const disconnectedSpy = vi.fn()

		client.on('connected', connectedSpy)
		client.on('accountChanged', accountSpy)
		client.on('networkChanged', networkSpy)
		client.on('disconnected', disconnectedSpy)

		// 1. WALLET_CONNECTED
		for (const listener of messageListeners) {
			listener({
				source: mockParent,
				origin: '*',
				data: {
					type: 'WALLET_CONNECTED',
					address: 'addr_1',
					networkId: 0
				}
			})
		}
		expect(connectedSpy).toHaveBeenCalledWith({ address: 'addr_1', networkId: 0 })
		expect(client.isConnected).toBe(true)
		expect(client.currentAddress).toBe('addr_1')
		expect(client.currentNetworkId).toBe(0)

		// 2. WALLET_ACCOUNT_CHANGED
		for (const listener of messageListeners) {
			listener({
				source: mockParent,
				origin: '*',
				data: {
					type: 'WALLET_ACCOUNT_CHANGED',
					address: 'addr_2'
				}
			})
		}
		expect(accountSpy).toHaveBeenCalledWith('addr_2')
		expect(client.currentAddress).toBe('addr_2')

		// 3. WALLET_NETWORK_CHANGED
		for (const listener of messageListeners) {
			listener({
				source: mockParent,
				origin: '*',
				data: {
					type: 'WALLET_NETWORK_CHANGED',
					networkId: 1
				}
			})
		}
		expect(networkSpy).toHaveBeenCalledWith(1)
		expect(client.currentNetworkId).toBe(1)

		// 4. WALLET_DISCONNECTED
		for (const listener of messageListeners) {
			listener({
				source: mockParent,
				origin: '*',
				data: {
					type: 'WALLET_DISCONNECTED'
				}
			})
		}
		expect(disconnectedSpy).toHaveBeenCalled()
		expect(client.isConnected).toBe(false)
		expect(client.currentAddress).toBeNull()

		client.destroy()
	})

	it('should support submitTx, getBalance, getCollateral, getRewardAddresses, requestConnect, and ping', async () => {
		const client = new WalletBridgeClient({ autoProbe: false })

		// 1. submitTx
		const submitPromise = client.submitTx('signed-tx-hex')
		const [req1] = mockParent.postMessage.mock.calls[0]
		expect(req1.type).toBe('WALLET_SUBMIT_TX')
		for (const listener of messageListeners) {
			listener({
				source: mockParent,
				origin: '*',
				data: {
					type: 'WALLET_SUBMIT_TX_RESULT',
					requestId: req1.requestId,
					result: 'tx-hash-0123456789'
				}
			})
		}
		expect(await submitPromise).toBe('tx-hash-0123456789')

		// 2. getBalance
		const balancePromise = client.getBalance()
		const [req2] = mockParent.postMessage.mock.calls[1]
		expect(req2.type).toBe('WALLET_GET_BALANCE')
		for (const listener of messageListeners) {
			listener({
				source: mockParent,
				origin: '*',
				data: {
					type: 'WALLET_GET_BALANCE_RESULT',
					requestId: req2.requestId,
					result: '1a000f4240'
				}
			})
		}
		expect(await balancePromise).toBe('1a000f4240')

		// 3. getCollateral
		const collateralPromise = client.getCollateral('5000000')
		const [req3] = mockParent.postMessage.mock.calls[2]
		expect(req3.type).toBe('WALLET_GET_COLLATERAL')
		for (const listener of messageListeners) {
			listener({
				source: mockParent,
				origin: '*',
				data: {
					type: 'WALLET_GET_COLLATERAL_RESULT',
					requestId: req3.requestId,
					result: [{ txHash: 'abc', index: 0 }]
				}
			})
		}
		expect(await collateralPromise).toEqual([{ txHash: 'abc', index: 0 }])

		// 4. getRewardAddresses
		const rewardPromise = client.getRewardAddresses()
		const [req4] = mockParent.postMessage.mock.calls[3]
		expect(req4.type).toBe('WALLET_GET_REWARD_ADDRESSES')
		for (const listener of messageListeners) {
			listener({
				source: mockParent,
				origin: '*',
				data: {
					type: 'WALLET_GET_REWARD_ADDRESSES_RESULT',
					requestId: req4.requestId,
					result: ['stake_test12345']
				}
			})
		}
		expect(await rewardPromise).toEqual(['stake_test12345'])

		// 5. requestConnect
		const connectPromise = client.requestConnect()
		const [req5] = mockParent.postMessage.mock.calls[4]
		expect(req5.type).toBe('WALLET_CONNECT')
		for (const listener of messageListeners) {
			listener({
				source: mockParent,
				origin: '*',
				data: {
					type: 'WALLET_CONNECT_RESULT',
					requestId: req5.requestId,
					result: { address: 'addr_new_connect', networkId: 1 }
				}
			})
		}
		const connectRes = await connectPromise
		expect(connectRes).toEqual({ address: 'addr_new_connect', networkId: 1 })
		expect(client.currentAddress).toBe('addr_new_connect')
		expect(client.currentNetworkId).toBe(1)

		// 6. ping
		const pingPromise = client.ping()
		const [req6] = mockParent.postMessage.mock.calls[5]
		expect(req6.type).toBe('WALLET_PING')
		for (const listener of messageListeners) {
			listener({
				source: mockParent,
				origin: '*',
				data: {
					type: 'WALLET_PONG',
					requestId: req6.requestId,
					result: { version: '1.0.0', isConnected: true, address: 'addr_new_connect', networkId: 1 }
				}
			})
		}
		const pongRes = await pingPromise
		expect(pongRes?.version).toBe('1.0.0')

		client.destroy()
	})
})
