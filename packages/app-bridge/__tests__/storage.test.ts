import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DualStorage } from '../src/storage'

describe('DualStorage', () => {
	let store: Map<string, string>

	beforeEach(() => {
		// Mock window and localStorage
		store = new Map<string, string>()
		vi.stubGlobal('window', {
			localStorage: {
				getItem: (key: string) => store.get(key) ?? null,
				setItem: (key: string, val: string) => {
					store.set(key, val)
				},
				removeItem: (key: string) => {
					store.delete(key)
				},
				clear: () => {
					store.clear()
				},
				get length() {
					return store.size
				},
				key: (i: number) => Array.from(store.keys())[i] ?? null
			}
		})
	})

	it('should save and retrieve items using localStorage when available', () => {
		const storage = new DualStorage(false)
		expect(storage.isUsingMemoryFallback()).toBe(false)

		storage.setItem('token', 'jwt-12345')
		expect(storage.getItem('token')).toBe('jwt-12345')

		storage.removeItem('token')
		expect(storage.getItem('token')).toBeNull()
	})

	it('should only clear items matching its prefix and preserve external game localStorage keys', () => {
		// Pre-populate external game keys in localStorage
		store.set('game_audio_volume', '0.8')
		store.set('high_score', '99999')

		const storage = new DualStorage({ prefix: 'hydra:', debug: false })
		storage.setItem('a', '1')
		storage.setItem('b', '2')
		expect(storage.getItem('a')).toBe('1')

		storage.clear()
		expect(storage.getItem('a')).toBeNull()
		expect(storage.getItem('b')).toBeNull()

		// External game keys must be preserved!
		expect(store.get('game_audio_volume')).toBe('0.8')
		expect(store.get('high_score')).toBe('99999')
	})

	it('should support hasItem, getJSON and setJSON', () => {
		const storage = new DualStorage(false)

		expect(storage.hasItem('user_profile')).toBe(false)
		storage.setJSON('user_profile', { id: 42, name: 'Alice' })

		expect(storage.hasItem('user_profile')).toBe(true)
		const profile = storage.getJSON<{ id: number; name: string }>('user_profile')
		expect(profile).toEqual({ id: 42, name: 'Alice' })

		expect(storage.getJSON('non_existing', { fallback: true })).toEqual({ fallback: true })
	})

	it('should fallback to in-memory store when localStorage throws (Safari ITP)', () => {
		vi.stubGlobal('window', {
			localStorage: {
				getItem: () => {
					throw new Error('SecurityError: The operation is insecure.')
				},
				setItem: () => {
					throw new Error('SecurityError: The operation is insecure.')
				},
				removeItem: () => {
					throw new Error('SecurityError')
				},
				clear: () => {
					throw new Error('SecurityError')
				}
			}
		})

		const storage = new DualStorage(false)
		expect(storage.isUsingMemoryFallback()).toBe(true)

		// Doesn't crash when setItem/getItem are called
		storage.setItem('session_key', 'in-memory-val')
		expect(storage.getItem('session_key')).toBe('in-memory-val')

		storage.removeItem('session_key')
		expect(storage.getItem('session_key')).toBeNull()
	})

	it('should handle SSR gracefully where window is undefined', () => {
		vi.stubGlobal('window', undefined)

		const storage = new DualStorage(false)
		expect(storage.isUsingMemoryFallback()).toBe(true)

		storage.setItem('ssr_key', 'ssr_val')
		expect(storage.getItem('ssr_key')).toBe('ssr_val')
	})

	it('should support async storage relay via Host when local storage is empty', async () => {
		const mockHostRelay = {
			hostStorageGet: vi.fn().mockResolvedValue('host_persisted_val'),
			hostStorageSet: vi.fn().mockResolvedValue(true),
			hostStorageRemove: vi.fn().mockResolvedValue(true)
		}

		const storage = new DualStorage({ hostRelay: mockHostRelay })

		// Local is empty initially
		expect(storage.getItem('remote_key')).toBeNull()

		// Async get queries Host
		const val = await storage.getItemAsync('remote_key')
		expect(val).toBe('host_persisted_val')
		expect(mockHostRelay.hostStorageGet).toHaveBeenCalledWith('hydra:remote_key')

		// Cached in local memory now
		expect(storage.getItem('remote_key')).toBe('host_persisted_val')

		// SetItemAsync delegates to Host
		await storage.setItemAsync('new_key', 'new_val')
		expect(mockHostRelay.hostStorageSet).toHaveBeenCalledWith('hydra:new_key', 'new_val')

		// RemoveItemAsync delegates to Host
		await storage.removeItemAsync('new_key')
		expect(mockHostRelay.hostStorageRemove).toHaveBeenCalledWith('hydra:new_key')
	})
})

