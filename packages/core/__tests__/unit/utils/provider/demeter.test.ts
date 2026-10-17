import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DemeterProvider, DemeterProviderConfig } from '../../../../src/utils/providers/demeter.provider'

// DemeterProvider only differs from BlockfrostProvider in how it builds the endpoint and auth;
// fetch/submit behaviour is covered by blockfrost.test.ts.

const { mockCreate } = vi.hoisted(() => ({
	mockCreate: vi.fn(() => ({ get: vi.fn(), post: vi.fn() }))
}))

vi.mock('axios', () => ({
	default: {
		create: mockCreate
	}
}))

const config: DemeterProviderConfig = {
	authToken: 'blockfrost102lx3ckhzvkjjh7677g',
	network: 'mainnet'
}

describe('DemeterProvider', () => {
	beforeEach(() => {
		mockCreate.mockClear()
	})

	it.each([
		[{ network: 'mainnet' }, 'https://blockfrost102lx3ckhzvkjjh7677g.cardano-mainnet.blockfrost-m1.demeter.run/api/v0'],
		[{ network: 'preprod' }, 'https://blockfrost102lx3ckhzvkjjh7677g.cardano-preprod.blockfrost-m1.demeter.run/api/v0'],
		[{ network: 'preview' }, 'https://blockfrost102lx3ckhzvkjjh7677g.cardano-preview.blockfrost-m1.demeter.run/api/v0'],
		[{ apiVersion: 1 }, 'https://blockfrost102lx3ckhzvkjjh7677g.cardano-mainnet.blockfrost-m1.demeter.run/api/v1']
	] as const)('puts the auth token in the subdomain for %o', (overrides, baseURL) => {
		new DemeterProvider({ ...config, ...overrides })

		expect(mockCreate).toHaveBeenCalledWith({
			baseURL,
			headers: { project_id: config.authToken },
			timeout: 10000
		})
	})

	it('requires an auth token', () => {
		expect(() => new DemeterProvider({ ...config, authToken: '' })).toThrow(/Blockfrost API key is required/)
	})
})
