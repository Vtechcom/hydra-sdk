import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createGameAuth } from '../src/auth'
import { DualStorage } from '../src/storage'

describe('GameAuthManager', () => {
	let mockClient: any
	let mockStorage: DualStorage
	let mockEndpoints: {
		getChallenge: ReturnType<typeof vi.fn>
		verifySignature: ReturnType<typeof vi.fn>
	}

	beforeEach(() => {
		mockStorage = new DualStorage(false)
		mockEndpoints = {
			getChallenge: vi.fn(),
			verifySignature: vi.fn()
		}

		mockClient = {
			currentAddress: 'addr_test1qz2fxv2um5tjaq62synchronized',
			storage: mockStorage,
			getChangeAddress: vi.fn().mockResolvedValue('addr_test1qz2fxv2um5tjaq62synchronized'),
			requestConnect: vi.fn(),
			signData: vi.fn().mockResolvedValue({
				signature: 'sig_12345',
				key: 'key_12345'
			}),
			on: vi.fn()
		}
	})

	it('should execute full 1-click login flow and save token in DualStorage', async () => {
		mockEndpoints.getChallenge.mockResolvedValue('0xchallenge_nonce_hex')
		mockEndpoints.verifySignature.mockResolvedValue({
			token: 'jwt_mock_access_token_123',
			user: { id: 'user_1', name: 'HydraGamer' }
		})

		const auth = createGameAuth({
			client: mockClient,
			endpoints: mockEndpoints,
			tokenStorageKey: 'custom_game_token'
		})

		expect(auth.isAuthenticated()).toBe(false)
		expect(auth.getToken()).toBeNull()

		const res = await auth.login()

		// Verify flow steps
		expect(mockEndpoints.getChallenge).toHaveBeenCalledWith('addr_test1qz2fxv2um5tjaq62synchronized')
		expect(mockClient.signData).toHaveBeenCalledWith(
			'addr_test1qz2fxv2um5tjaq62synchronized',
			'0xchallenge_nonce_hex'
		)
		expect(mockEndpoints.verifySignature).toHaveBeenCalledWith({
			address: 'addr_test1qz2fxv2um5tjaq62synchronized',
			signature: 'sig_12345',
			key: 'key_12345'
		})

		expect(res.token).toBe('jwt_mock_access_token_123')
		expect(res.user?.name).toBe('HydraGamer')
		expect(auth.isAuthenticated()).toBe(true)
		expect(auth.getToken()).toBe('jwt_mock_access_token_123')

		// Test logout
		auth.logout()
		expect(auth.isAuthenticated()).toBe(false)
		expect(auth.getToken()).toBeNull()
	})
})
