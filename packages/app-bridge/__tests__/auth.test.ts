import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createGameAuth } from '../src/auth'
import { DualStorage } from '../src/storage'
import { toHexPayload } from '../src/utils'

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

	it('should execute full 1-click login flow and save token in DualStorage with hex encoded challenge', async () => {
		const rawChallenge = 'challenge_nonce_plain_text_123'
		mockEndpoints.getChallenge.mockResolvedValue(rawChallenge)
		mockEndpoints.verifySignature.mockResolvedValue({
			token: 'jwt_mock_access_token_123',
			user: { id: 'user_1', name: 'HydraGamer' }
		})

		const auth = createGameAuth({
			client: mockClient,
			endpoints: mockEndpoints,
			tokenStorageKey: 'custom_game_token'
		})

		let authChangeReceived = false
		auth.onAuthChange((isAuth, token) => {
			authChangeReceived = isAuth
			if (isAuth) {
				expect(token).toBe('jwt_mock_access_token_123')
			} else {
				expect(token).toBeNull()
			}
		})

		expect(auth.isAuthenticated()).toBe(false)
		expect(auth.getToken()).toBeNull()

		const res = await auth.login()

		// Verify flow steps: challenge must be hex encoded for CIP-30 / CIP-8
		expect(mockEndpoints.getChallenge).toHaveBeenCalledWith('addr_test1qz2fxv2um5tjaq62synchronized')
		expect(mockClient.signData).toHaveBeenCalledWith(
			'addr_test1qz2fxv2um5tjaq62synchronized',
			toHexPayload(rawChallenge)
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
		expect(authChangeReceived).toBe(true)

		// Test logout
		auth.logout()
		expect(auth.isAuthenticated()).toBe(false)
		expect(auth.getToken()).toBeNull()
	})

	it('should preserve already valid hex challenges without double encoding', async () => {
		const validHexChallenge = '616263313233'
		mockEndpoints.getChallenge.mockResolvedValue(validHexChallenge)
		mockEndpoints.verifySignature.mockResolvedValue({
			token: 'jwt_mock_hex_token',
			user: { id: 'user_2' }
		})

		const auth = createGameAuth({
			client: mockClient,
			endpoints: mockEndpoints
		})

		await auth.login()
		expect(mockClient.signData).toHaveBeenCalledWith(
			'addr_test1qz2fxv2um5tjaq62synchronized',
			validHexChallenge
		)
	})
})
