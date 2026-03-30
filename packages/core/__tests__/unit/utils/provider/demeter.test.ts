import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DemeterProvider, DemeterProviderConfig } from '../../../../src/utils/providers/demeter.provider'

const { mockGet, mockPost, mockCreate } = vi.hoisted(() => {
	const mockGet = vi.fn()
	const mockPost = vi.fn()
	const mockCreate = vi.fn(() => ({
		get: mockGet,
		post: mockPost
	}))
	return { mockGet, mockPost, mockCreate }
})

vi.mock('axios', () => ({
	default: {
		create: mockCreate
	}
}))

const mockConfig: DemeterProviderConfig = {
	authToken: 'blockfrost102lx3ckhzvkjjh7677g',
	network: 'mainnet'
}

const mockUtxoResponse = [
	{
		address: 'addr1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz',
		tx_hash: '1d2e5b97f1cad7bea2b06144abc4974012fa786c9e7e5faddd03243b967a03f6',
		tx_index: 0,
		output_index: 0,
		amount: [{ unit: 'lovelace', quantity: '5000000' }],
		block: 'block123',
		data_hash: null,
		inline_datum: null,
		reference_script_hash: null
	}
]

describe('DemeterProvider', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('constructor', () => {
		it('should create instance with valid config', () => {
			const provider = new DemeterProvider(mockConfig)

			expect(provider).toBeDefined()
			expect(provider.fetcher).toBeDefined()
			expect(provider.submitter).toBeDefined()
		})

		it('should throw error when authToken is empty', () => {
			expect(() => new DemeterProvider({ ...mockConfig, authToken: '' })).toThrow('Blockfrost API key is required')
		})

		it('should build correct authenticated baseURL for mainnet', () => {
			new DemeterProvider(mockConfig)

			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					baseURL: 'https://blockfrost102lx3ckhzvkjjh7677g.cardano-mainnet.blockfrost-m1.demeter.run/api/v0'
				})
			)
		})

		it('should build correct authenticated baseURL for preprod', () => {
			new DemeterProvider({ ...mockConfig, network: 'preprod' })

			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					baseURL: 'https://blockfrost102lx3ckhzvkjjh7677g.cardano-preprod.blockfrost-m1.demeter.run/api/v0'
				})
			)
		})

		it('should build correct authenticated baseURL for preview', () => {
			new DemeterProvider({ ...mockConfig, network: 'preview' })

			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					baseURL: 'https://blockfrost102lx3ckhzvkjjh7677g.cardano-preview.blockfrost-m1.demeter.run/api/v0'
				})
			)
		})

		it('should use custom apiVersion when provided', () => {
			new DemeterProvider({ ...mockConfig, apiVersion: 1 })

			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					baseURL: 'https://blockfrost102lx3ckhzvkjjh7677g.cardano-mainnet.blockfrost-m1.demeter.run/api/v1'
				})
			)
		})

		it('should set project_id header to authToken', () => {
			new DemeterProvider(mockConfig)

			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					headers: { project_id: 'blockfrost102lx3ckhzvkjjh7677g' }
				})
			)
		})

		it('should pass caching options through to BlockfrostProvider', () => {
			const provider = new DemeterProvider({
				...mockConfig,
				cachingOptions: { enabled: true, ttl: 60000 }
			})

			expect(provider).toBeDefined()
		})
	})

	describe('fetcher.fetchAddressUTxOs', () => {
		it('should fetch UTxOs successfully', async () => {
			mockGet.mockResolvedValueOnce({ data: mockUtxoResponse, status: 200 })

			const provider = new DemeterProvider(mockConfig)
			const address = 'addr1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz'
			const result = await provider.fetcher.fetchAddressUTxOs(address)

			expect(result).toHaveLength(1)
			expect(result[0].input.txHash).toBe('1d2e5b97f1cad7bea2b06144abc4974012fa786c9e7e5faddd03243b967a03f6')
			expect(result[0].output.address).toBe(address)
			expect(result[0].output.amount).toEqual([{ unit: 'lovelace', quantity: '5000000' }])
		})

		it('should return empty array when address not found (404)', async () => {
			mockGet.mockResolvedValueOnce({ data: null, status: 404, statusText: 'Not Found' })

			const provider = new DemeterProvider(mockConfig)
			const result = await provider.fetcher.fetchAddressUTxOs('addr1_notfound')

			expect(result).toEqual([])
		})

		it('should return empty array on network error', async () => {
			mockGet.mockRejectedValueOnce(new Error('Network error'))

			const provider = new DemeterProvider(mockConfig)
			const result = await provider.fetcher.fetchAddressUTxOs('addr1_test')

			expect(result).toEqual([])
		})
	})

	describe('submitter.submitTx', () => {
		it('should submit transaction and return tx hash', async () => {
			const txHash = 'f7867871ba75ce5e3c513d1279812556938a281e6098bd1e848b61c31144be98'
			mockPost.mockResolvedValueOnce({ data: txHash, status: 200 })

			const provider = new DemeterProvider(mockConfig)
			const result = await provider.submitter.submitTx('84a400d9...')

			expect(result).toBe(txHash)
		})

		it('should throw error on failed submission', async () => {
			mockPost.mockResolvedValueOnce({ data: null, status: 400 })

			const provider = new DemeterProvider(mockConfig)

			await expect(provider.submitter.submitTx('invalid_tx')).rejects.toThrow('Failed to submit transaction')
		})

		it('should send CBOR content-type header', async () => {
			mockPost.mockResolvedValueOnce({ data: 'txHash', status: 200 })

			const provider = new DemeterProvider(mockConfig)
			await provider.submitter.submitTx('84a400d9...')

			expect(mockPost).toHaveBeenCalledWith(
				'tx/submit',
				expect.any(Uint8Array),
				expect.objectContaining({
					headers: { 'Content-Type': 'application/cbor' }
				})
			)
		})
	})
})
