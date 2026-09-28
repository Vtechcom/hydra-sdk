import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GameLifecycleManager } from '../src/lifecycle'

describe('GameLifecycleManager', () => {
	let mockClient: { sendRequest: ReturnType<typeof vi.fn> }
	let manager: GameLifecycleManager

	beforeEach(() => {
		mockClient = {
			sendRequest: vi.fn()
		}
		manager = new GameLifecycleManager(mockClient)
	})

	it('should send GAME_READY request', async () => {
		mockClient.sendRequest.mockResolvedValue(true)
		const res = await manager.ready({ version: '1.2.0', gameSlug: 'hydra-mines' })

		expect(mockClient.sendRequest).toHaveBeenCalledWith({
			type: 'GAME_READY',
			version: '1.2.0',
			gameSlug: 'hydra-mines'
		})
		expect(res).toBe(true)
	})

	it('should send GET_CONTEXT request and receive context object', async () => {
		const mockContext = {
			theme: 'dark' as const,
			locale: 'vi',
			device: 'mobile' as const,
			appCenterOrigin: 'https://hydraone.io'
		}
		mockClient.sendRequest.mockResolvedValue(mockContext)

		const context = await manager.getContext()
		expect(mockClient.sendRequest).toHaveBeenCalledWith({ type: 'GET_CONTEXT' })
		expect(context).toEqual(mockContext)
	})

	it('should send REQUEST_FULLSCREEN request', async () => {
		mockClient.sendRequest.mockResolvedValue(true)
		const res = await manager.requestFullscreen(true)

		expect(mockClient.sendRequest).toHaveBeenCalledWith({
			type: 'REQUEST_FULLSCREEN',
			enabled: true
		})
		expect(res).toBe(true)
	})

	it('should send EXIT_GAME request', async () => {
		mockClient.sendRequest.mockResolvedValue(true)
		const res = await manager.exitGame()

		expect(mockClient.sendRequest).toHaveBeenCalledWith({ type: 'EXIT_GAME' })
		expect(res).toBe(true)
	})

	it('should send SET_ORIENTATION and TRIGGER_HAPTIC requests', async () => {
		mockClient.sendRequest.mockResolvedValue(true)

		const resOrientation = await manager.setOrientation('landscape')
		expect(mockClient.sendRequest).toHaveBeenCalledWith({
			type: 'SET_ORIENTATION',
			orientation: 'landscape'
		})
		expect(resOrientation).toBe(true)

		const resHaptic = await manager.triggerHaptic('success')
		expect(mockClient.sendRequest).toHaveBeenCalledWith({
			type: 'TRIGGER_HAPTIC',
			pattern: 'success'
		})
		expect(resHaptic).toBe(true)
	})
})

