import { describe, it, expect, afterEach, vi } from 'vitest'
import { WalletBridgeClient } from '../../src/client'
import type { GameLifecycleManager } from '../../src/lifecycle'
import { connectMockHost } from '../helpers/fake-window'

let client: WalletBridgeClient | undefined

afterEach(() => {
	client?.destroy()
	client = undefined
	vi.unstubAllGlobals()
})

describe('GameLifecycleManager — through a MockBridgeHost', () => {
	it.each<[string, (l: GameLifecycleManager) => Promise<unknown>, Record<string, unknown>]>([
		[
			'ready',
			l => l.ready({ version: '1.2.0', gameSlug: 'hydra-mines' }),
			{ type: 'GAME_READY', version: '1.2.0', gameSlug: 'hydra-mines' }
		],
		['ready (no payload)', l => l.ready(), { type: 'GAME_READY', version: undefined, gameSlug: undefined }],
		['requestFullscreen', l => l.requestFullscreen(false), { type: 'REQUEST_FULLSCREEN', enabled: false }],
		['requestFullscreen (default)', l => l.requestFullscreen(), { type: 'REQUEST_FULLSCREEN', enabled: true }],
		['exitGame', l => l.exitGame(), { type: 'EXIT_GAME' }],
		['setOrientation', l => l.setOrientation('landscape'), { type: 'SET_ORIENTATION', orientation: 'landscape' }],
		['triggerHaptic', l => l.triggerHaptic([10, 20]), { type: 'TRIGGER_HAPTIC', pattern: [10, 20] }],
		['triggerHaptic (default)', l => l.triggerHaptic(), { type: 'TRIGGER_HAPTIC', pattern: 'medium' }]
	])('%s posts its request and resolves with the host ack', async (_name, call, request) => {
		const { toParent } = connectMockHost()
		client = new WalletBridgeClient({ autoProbe: false })
		await expect(call(client.lifecycle)).resolves.toBe(true)
		expect(toParent.map(p => p.data)).toEqual([{ ...request, requestId: expect.any(String) }])
	})

	it('getContext resolves with the host context', async () => {
		connectMockHost({ context: { theme: 'light', locale: 'en', device: 'mobile' } })
		client = new WalletBridgeClient({ autoProbe: false })
		await expect(client.lifecycle.getContext()).resolves.toEqual({
			theme: 'light',
			locale: 'en',
			device: 'mobile',
			appCenterOrigin: 'http://localhost:3000',
			user: { username: 'HydraTester', avatar: '' }
		})
	})
})
