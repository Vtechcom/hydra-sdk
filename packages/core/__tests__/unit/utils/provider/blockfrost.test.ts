import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BlockfrostProvider, BlockfrostProviderConfig } from '../../../../src/utils/providers/blockfrost.provider'

// Create mock functions using vi.hoisted so they're available before module load
const { mockGet, mockPost, mockCreate } = vi.hoisted(() => {
	const mockGet = vi.fn()
	const mockPost = vi.fn()
	const mockCreate = vi.fn(() => ({
		get: mockGet,
		post: mockPost
	}))
	return { mockGet, mockPost, mockCreate }
})

// Mock axios
vi.mock('axios', () => ({
	default: {
		create: mockCreate
	}
}))

const mockConfig: BlockfrostProviderConfig = {
	apiKey: 'test-api-key-12345',
	network: 'preprod'
}

const mockUtxoResponse = [
	{
		address:
			'addr_test1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz',
		tx_hash: '1d2e5b97f1cad7bea2b06144abc4974012fa786c9e7e5faddd03243b967a03f6',
		tx_index: 0,
		output_index: 0,
		amount: [{ unit: 'lovelace', quantity: '200000000' }],
		block: 'block123',
		data_hash: null,
		inline_datum: null,
		reference_script_hash: null
	}
]

describe('BlockfrostProvider', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('constructor', () => {
		it('should create instance with valid config', () => {
			const provider = new BlockfrostProvider(mockConfig)

			expect(provider).toBeDefined()
			expect(provider.fetcher).toBeDefined()
			expect(provider.submitter).toBeDefined()
		})

		it('should throw error when API key is empty', () => {
			const invalidConfig: BlockfrostProviderConfig = {
				apiKey: '',
				network: 'preprod'
			}

			expect(() => new BlockfrostProvider(invalidConfig)).toThrow('Blockfrost API key is required')
		})

		it('should create axios instance with correct baseURL for preprod', () => {
			new BlockfrostProvider(mockConfig)

			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					baseURL: 'https://cardano-preprod.blockfrost.io/api/v0'
				})
			)
		})

		it('should create axios instance with correct baseURL for mainnet', () => {
			new BlockfrostProvider({ ...mockConfig, network: 'mainnet' })

			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					baseURL: 'https://cardano-mainnet.blockfrost.io/api/v0'
				})
			)
		})

		it('should use custom API version when provided', () => {
			new BlockfrostProvider({ ...mockConfig, apiVersion: 1 })

			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					baseURL: 'https://cardano-preprod.blockfrost.io/api/v1'
				})
			)
		})

		it('should set project_id header', () => {
			new BlockfrostProvider(mockConfig)

			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					headers: { project_id: 'test-api-key-12345' }
				})
			)
		})
	})

	describe('fetcher.fetchAddressUTxOs', () => {
		it('should fetch UTxOs for a valid address', async () => {
			mockGet.mockResolvedValueOnce({
				data: mockUtxoResponse,
				status: 200
			})

			const provider = new BlockfrostProvider(mockConfig)
			const address =
				'addr_test1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz'

			const result = await provider.fetcher.fetchAddressUTxOs(address)

			expect(result).toHaveLength(1)
			expect(result[0].input.txHash).toBe('1d2e5b97f1cad7bea2b06144abc4974012fa786c9e7e5faddd03243b967a03f6')
			expect(result[0].input.outputIndex).toBe(0)
			expect(result[0].output.address).toBe(address)
			expect(result[0].output.amount).toEqual([{ unit: 'lovelace', quantity: '200000000' }])
		})

		it('should return empty array when address not found (404)', async () => {
			mockGet.mockResolvedValueOnce({
				data: null,
				status: 404,
				statusText: 'Not Found'
			})

			const provider = new BlockfrostProvider(mockConfig)
			const result = await provider.fetcher.fetchAddressUTxOs('addr_test_notfound')

			expect(result).toEqual([])
		})

		it('should return empty array when no UTxOs found', async () => {
			mockGet.mockResolvedValueOnce({
				data: [],
				status: 200
			})

			const provider = new BlockfrostProvider(mockConfig)
			const result = await provider.fetcher.fetchAddressUTxOs('addr_test_empty')

			expect(result).toEqual([])
		})

		it('should handle pagination when 100 UTxOs returned', async () => {
			const page1Response = Array(100).fill(mockUtxoResponse[0])
			const page2Response = [mockUtxoResponse[0]]

			mockGet
				.mockResolvedValueOnce({ data: page1Response, status: 200 })
				.mockResolvedValueOnce({ data: page2Response, status: 200 })

			const provider = new BlockfrostProvider(mockConfig)
			const result = await provider.fetcher.fetchAddressUTxOs('addr_test_many')

			expect(result).toHaveLength(101)
			expect(mockGet).toHaveBeenCalledTimes(2)
		})

		it('should fetch UTxOs filtered by asset', async () => {
			mockGet.mockResolvedValueOnce({
				data: mockUtxoResponse,
				status: 200
			})

			const provider = new BlockfrostProvider(mockConfig)
			const asset = 'policyId123assetName456'

			await provider.fetcher.fetchAddressUTxOs('addr_test', asset)

			expect(mockGet).toHaveBeenCalledWith(expect.stringContaining(`/${asset}`), expect.any(Object))
		})

		it('should return empty array on error', async () => {
			mockGet.mockRejectedValueOnce(new Error('Network error'))

			const provider = new BlockfrostProvider(mockConfig)
			const result = await provider.fetcher.fetchAddressUTxOs('addr_test')

			expect(result).toEqual([])
		})

		it('should handle UTxO with datumHash', async () => {
			const utxoWithDatum = [
				{
					...mockUtxoResponse[0],
					data_hash: 'b2a341841d44a0d757a9f4a7c60da80e09e0764c00aec65b30cc1cfcbc130d59'
				}
			]
			mockGet.mockResolvedValueOnce({
				data: utxoWithDatum,
				status: 200
			})

			const provider = new BlockfrostProvider(mockConfig)
			const result = await provider.fetcher.fetchAddressUTxOs('addr_test')

			expect(result[0].output.datumHash).toBe('b2a341841d44a0d757a9f4a7c60da80e09e0764c00aec65b30cc1cfcbc130d59')
		})

		it('should handle UTxO with inline datum', async () => {
			const utxoWithInlineDatum = [
				{
					...mockUtxoResponse[0],
					inline_datum: '40' // CBOR for empty bytes
				}
			]
			mockGet.mockResolvedValueOnce({
				data: utxoWithInlineDatum,
				status: 200
			})

			const provider = new BlockfrostProvider(mockConfig)
			const result = await provider.fetcher.fetchAddressUTxOs('addr_test')

			expect(result[0].output.inlineDatum).toBeDefined()
		})
	})

	describe('submitter.submitTx', () => {
		it('should submit transaction successfully (200)', async () => {
			const txHash = 'f7867871ba75ce5e3c513d1279812556938a281e6098bd1e848b61c31144be98'
			mockPost.mockResolvedValueOnce({
				data: txHash,
				status: 200
			})

			const provider = new BlockfrostProvider(mockConfig)
			const result = await provider.submitter.submitTx('84a400d9...')

			expect(result).toBe(txHash)
		})

		it('should submit transaction successfully (202)', async () => {
			const txHash = 'f7867871ba75ce5e3c513d1279812556938a281e6098bd1e848b61c31144be98'
			mockPost.mockResolvedValueOnce({
				data: txHash,
				status: 202
			})

			const provider = new BlockfrostProvider(mockConfig)
			const result = await provider.submitter.submitTx('84a400d9...')

			expect(result).toBe(txHash)
		})

		it('should throw error on failed submission', async () => {
			mockPost.mockResolvedValueOnce({
				data: null,
				status: 400
			})

			const provider = new BlockfrostProvider(mockConfig)

			await expect(provider.submitter.submitTx('invalid_tx')).rejects.toThrow('Failed to submit transaction')
		})

		it('should throw error on network error', async () => {
			mockPost.mockRejectedValueOnce(new Error('Network error'))

			const provider = new BlockfrostProvider(mockConfig)

			await expect(provider.submitter.submitTx('84a400d9...')).rejects.toThrow('Failed to submit transaction')
		})

		it('should send correct headers for CBOR content', async () => {
			mockPost.mockResolvedValueOnce({
				data: 'txHash',
				status: 200
			})

			const provider = new BlockfrostProvider(mockConfig)
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

	describe('caching options', () => {
		it('should use default caching options when not provided', () => {
			const provider = new BlockfrostProvider(mockConfig)

			// Provider should be created without errors
			expect(provider).toBeDefined()
		})

		it('should merge custom caching options with defaults', () => {
			const configWithCache: BlockfrostProviderConfig = {
				...mockConfig,
				cachingOptions: {
					enabled: true,
					ttl: 60000
				}
			}

			const provider = new BlockfrostProvider(configWithCache)

			expect(provider).toBeDefined()
		})
	})
})
