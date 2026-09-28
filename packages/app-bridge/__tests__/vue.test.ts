import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useWalletBridgeClient, resetSharedWalletBridgeClient } from '../src/vue'

describe('useWalletBridgeClient', () => {
	let mockParent: { postMessage: ReturnType<typeof vi.fn> }
	let messageListeners: Array<(event: any) => void>

	beforeEach(() => {
		resetSharedWalletBridgeClient()
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
		resetSharedWalletBridgeClient()
		vi.unstubAllGlobals()
	})

	it('should provide reactive wallet state and computed helpers (shortAddress, isTestnet, isMainnet)', () => {
		const bridge = useWalletBridgeClient({ appCenterOrigin: '*' })

		expect(bridge.isConnected.value).toBe(false)
		expect(bridge.walletAddressBech32.value).toBeNull()
		expect(bridge.networkId.value).toBeNull()
		expect(bridge.shortAddress.value).toBe('')
		expect(bridge.isMainnet.value).toBe(false)
		expect(bridge.isTestnet.value).toBe(false)

		// Simulate WALLET_CONNECTED push event from parent on Testnet
		for (const listener of messageListeners) {
			listener({
				source: mockParent,
				origin: '*',
				data: {
					type: 'WALLET_CONNECTED',
					address: 'addr_test1qz2fxv2um5tjaq62synchronizedaddress123',
					networkId: 0
				}
			})
		}

		expect(bridge.isConnected.value).toBe(true)
		expect(bridge.walletAddressBech32.value).toBe('addr_test1qz2fxv2um5tjaq62synchronizedaddress123')
		expect(bridge.networkId.value).toBe(0)
		expect(bridge.isTestnet.value).toBe(true)
		expect(bridge.isMainnet.value).toBe(false)
		expect(bridge.shortAddress.value).toBe('addr_tes...ess123')

		// Simulate WALLET_NETWORK_CHANGED to Mainnet
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
		expect(bridge.isMainnet.value).toBe(true)
		expect(bridge.isTestnet.value).toBe(false)

		// Simulate WALLET_DISCONNECTED
		for (const listener of messageListeners) {
			listener({
				source: mockParent,
				origin: '*',
				data: {
					type: 'WALLET_DISCONNECTED'
				}
			})
		}

		expect(bridge.isConnected.value).toBe(false)
		expect(bridge.walletAddressBech32.value).toBeNull()
		expect(bridge.shortAddress.value).toBe('')
	})

	it('should share reactive state across multiple composable calls', () => {
		const bridge1 = useWalletBridgeClient()
		const bridge2 = useWalletBridgeClient()

		for (const listener of messageListeners) {
			listener({
				source: mockParent,
				origin: '*',
				data: {
					type: 'WALLET_CONNECTED',
					address: 'addr_shared_address',
					networkId: 1
				}
			})
		}

		expect(bridge1.walletAddressBech32.value).toBe('addr_shared_address')
		expect(bridge2.walletAddressBech32.value).toBe('addr_shared_address')
		expect(bridge1.networkId.value).toBe(1)
		expect(bridge2.networkId.value).toBe(1)
	})

	it('should support parseUtxoAssets utility method', () => {
		const bridge = useWalletBridgeClient()
		const sampleUtxos = [
			{
				output: {
					amount: [
						{ unit: 'lovelace', quantity: '5000000' },
						{ unit: 'assetPolicyId1234567890', quantity: '10' }
					]
				}
			},
			{
				output: {
					amount: [
						{ unit: 'lovelace', quantity: '3500000' },
						{ unit: 'assetPolicyId1234567890', quantity: '5' }
					]
				}
			}
		]

		const result = bridge.parseUtxoAssets(sampleUtxos)
		expect(result.totalLovelace).toBe(8500000n)
		expect(result.balanceADA).toBe(8.5)
		expect(result.assets).toEqual([
			{ unit: 'lovelace', quantity: '8500000' },
			{ unit: 'assetPolicyId1234567890', quantity: '15' }
		])
	})

	it('should reactively reflect audioMuted, theme and capabilities push events', () => {
		const bridge = useWalletBridgeClient()

		expect(bridge.isAudioMuted.value).toBe(false)
		expect(bridge.theme.value).toBe('dark')
		expect(bridge.supportedCapabilities.value).toEqual([])

		// Simulate AUDIO_MUTED_CHANGED
		for (const listener of messageListeners) {
			listener({
				source: mockParent,
				origin: '*',
				data: {
					type: 'AUDIO_MUTED_CHANGED',
					muted: true
				}
			})
		}
		expect(bridge.isAudioMuted.value).toBe(true)

		// Simulate THEME_CHANGED
		for (const listener of messageListeners) {
			listener({
				source: mockParent,
				origin: '*',
				data: {
					type: 'THEME_CHANGED',
					theme: 'light'
				}
			})
		}
		expect(bridge.theme.value).toBe('light')
	})
})

