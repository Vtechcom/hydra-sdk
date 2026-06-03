import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OgmiosProvider, OgmiosProviderConfig } from '../../../../src/utils/providers/ogmios.provider'

// Create mock functions using vi.hoisted so they're available before module load
const { mockPost, mockInterceptors, mockCreate } = vi.hoisted(() => {
	const mockPost = vi.fn()
	const mockInterceptors = {
		request: { use: vi.fn() },
		response: { use: vi.fn() }
	}
	const mockCreate = vi.fn(() => ({
		post: mockPost,
		interceptors: mockInterceptors
	}))
	return { mockPost, mockInterceptors, mockCreate }
})

// Mock axios
vi.mock('axios', () => ({
	default: {
		create: mockCreate
	}
}))

const mockConfig: OgmiosProviderConfig = {
	network: 'preprod',
	apiEndpoint: 'https://preprod.ogmios.example.com'
}

const mockUtxoResponse = {
	result: [
		{
			transaction: { id: '1d2e5b97f1cad7bea2b06144abc4974012fa786c9e7e5faddd03243b967a03f6' },
			index: 0,
			address:
				'addr_test1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz',
			value: {
				ada: { lovelace: 200000000 }
			}
		}
	]
}

describe('OgmiosProvider', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('constructor', () => {
		it('should create instance with valid config', () => {
			const provider = new OgmiosProvider(mockConfig)

			expect(provider).toBeDefined()
			expect(provider.fetcher).toBeDefined()
			expect(provider.submitter).toBeDefined()
		})

		it('should create axios instance with custom endpoint', () => {
			new OgmiosProvider(mockConfig)

			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					baseURL: 'https://preprod.ogmios.example.com'
				})
			)
		})

		it('should use default localhost endpoint when not provided', () => {
			new OgmiosProvider({ network: 'preprod' })

			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					baseURL: 'http://localhost:1337'
				})
			)
		})

		it('should set up request and response interceptors', () => {
			new OgmiosProvider(mockConfig)

			expect(mockInterceptors.request.use).toHaveBeenCalled()
			expect(mockInterceptors.response.use).toHaveBeenCalled()
		})

		it('should set Content-Type header to application/json', () => {
			new OgmiosProvider(mockConfig)

			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					headers: { 'Content-Type': 'application/json' }
				})
			)
		})
	})

	describe('fetcher.fetchAddressUTxOs', () => {
		it('should fetch UTxOs for a valid address', async () => {
			mockPost.mockResolvedValueOnce({
				data: mockUtxoResponse
			})

			const provider = new OgmiosProvider(mockConfig)
			const address =
				'addr_test1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz'

			const result = await provider.fetcher.fetchAddressUTxOs(address)

			expect(result).toHaveLength(1)
			expect(result[0].input.txHash).toBe('1d2e5b97f1cad7bea2b06144abc4974012fa786c9e7e5faddd03243b967a03f6')
			expect(result[0].input.outputIndex).toBe(0)
			expect(result[0].output.address).toBe(address)
		})

		it('should convert ada.lovelace to lovelace unit', async () => {
			mockPost.mockResolvedValueOnce({
				data: mockUtxoResponse
			})

			const provider = new OgmiosProvider(mockConfig)
			const result = await provider.fetcher.fetchAddressUTxOs('addr_test')

			expect(result[0].output.amount).toContainEqual({
				unit: 'lovelace',
				quantity: '200000000'
			})
		})

		it('should handle multi-asset UTxOs', async () => {
			const multiAssetResponse = {
				result: [
					{
						transaction: { id: 'txhash123' },
						index: 0,
						address: 'addr_test',
						value: {
							ada: { lovelace: 5000000 },
							'0836587ed7cee3c0790e24c930c67f31fc2511a3c25aa66ed205e05f': {
								'74525053': 10000
							}
						}
					}
				]
			}
			mockPost.mockResolvedValueOnce({
				data: multiAssetResponse
			})

			const provider = new OgmiosProvider(mockConfig)
			const result = await provider.fetcher.fetchAddressUTxOs('addr_test')

			expect(result[0].output.amount).toHaveLength(2)
			expect(result[0].output.amount).toContainEqual({
				unit: 'lovelace',
				quantity: '5000000'
			})
			expect(result[0].output.amount).toContainEqual({
				unit: '0836587ed7cee3c0790e24c930c67f31fc2511a3c25aa66ed205e05f74525053',
				quantity: '10000'
			})
		})

		it('should filter UTxOs by asset when provided', async () => {
			const multiUtxoResponse = {
				result: [
					{
						transaction: { id: 'tx1' },
						index: 0,
						address: 'addr_test',
						value: { ada: { lovelace: 1000000 } }
					},
					{
						transaction: { id: 'tx2' },
						index: 0,
						address: 'addr_test',
						value: {
							ada: { lovelace: 2000000 },
							policyId123: { asset456: 100 }
						}
					}
				]
			}
			mockPost.mockResolvedValueOnce({
				data: multiUtxoResponse
			})

			const provider = new OgmiosProvider(mockConfig)
			const result = await provider.fetcher.fetchAddressUTxOs('addr_test', 'policyId123asset456')

			expect(result).toHaveLength(1)
			expect(result[0].input.txHash).toBe('tx2')
		})

		it('should return empty array on error', async () => {
			mockPost.mockRejectedValueOnce(new Error('Network error'))

			const provider = new OgmiosProvider(mockConfig)
			const result = await provider.fetcher.fetchAddressUTxOs('addr_test')
			expect(result).toEqual([])
		})

		it('should send correct JSON-RPC request', async () => {
			mockPost.mockResolvedValueOnce({
				data: { result: [] }
			})

			const provider = new OgmiosProvider(mockConfig)
			await provider.fetcher.fetchAddressUTxOs('addr_test_abc')

			expect(mockPost).toHaveBeenCalledWith('/', expect.stringContaining('"method":"queryLedgerState/utxo"'))
			expect(mockPost).toHaveBeenCalledWith('/', expect.stringContaining('"addresses":["addr_test_abc"]'))
		})

		it('should handle UTxO with datumHash', async () => {
			const utxoWithDatum = {
				result: [
					{
						...mockUtxoResponse.result[0],
						datumHash: 'b2a341841d44a0d757a9f4a7c60da80e09e0764c00aec65b30cc1cfcbc130d59'
					}
				]
			}
			mockPost.mockResolvedValueOnce({
				data: utxoWithDatum
			})

			const provider = new OgmiosProvider(mockConfig)
			const result = await provider.fetcher.fetchAddressUTxOs('addr_test')

			expect(result[0].output.datumHash).toBe('b2a341841d44a0d757a9f4a7c60da80e09e0764c00aec65b30cc1cfcbc130d59')
		})

		it('should handle UTxO with inline datum', async () => {
			const utxoWithInlineDatum = {
				result: [
					{
						...mockUtxoResponse.result[0],
						datum: 'd87980' // CBOR for constructor 0 with empty fields
					}
				]
			}
			mockPost.mockResolvedValueOnce({
				data: utxoWithInlineDatum
			})

			const provider = new OgmiosProvider(mockConfig)
			const result = await provider.fetcher.fetchAddressUTxOs('addr_test')

			expect(result[0].output.inlineDatum).toBeDefined()
		})

		it('should handle UTxO with Plutus script reference', async () => {
			const utxoWithScript = {
				result: [
					{
						...mockUtxoResponse.result[0],
						script: {
							language: 'plutus:v2',
							cbor: 'abcd1234'
						}
					}
				]
			}
			mockPost.mockResolvedValueOnce({
				data: utxoWithScript
			})

			const provider = new OgmiosProvider(mockConfig)
			const result = await provider.fetcher.fetchAddressUTxOs('addr_test')

			expect(result[0].output.scriptRef).toEqual({ scriptCbor: 'abcd1234', version: 'V2' })
		})

		it('should handle UTxO with native script reference', async () => {
			const utxoWithNativeScript = {
				result: [
					{
						...mockUtxoResponse.result[0],
						script: {
							language: 'native',
							json: { clause: 'signature', from: 'keyhash123' },
							cbor: 'nativecbor'
						}
					}
				]
			}
			mockPost.mockResolvedValueOnce({
				data: utxoWithNativeScript
			})

			const provider = new OgmiosProvider(mockConfig)
			const result = await provider.fetcher.fetchAddressUTxOs('addr_test')

			expect(result[0].output.scriptRef).toBeNull()
		})
	})

	describe('submitter.submitTx', () => {
		it('should submit transaction successfully', async () => {
			const txHash = 'f7867871ba75ce5e3c513d1279812556938a281e6098bd1e848b61c31144be98'
			mockPost.mockResolvedValueOnce({
				data: {
					result: {
						transaction: { id: txHash }
					}
				}
			})

			const provider = new OgmiosProvider(mockConfig)
			const result = await provider.submitter.submitTx('84a400d9...')

			expect(result).toBe(txHash)
		})

		it('should throw error when no transaction ID returned', async () => {
			mockPost.mockResolvedValueOnce({
				data: { result: {} }
			})

			const provider = new OgmiosProvider(mockConfig)

			await expect(provider.submitter.submitTx('84a400d9...')).rejects.toThrow(
				'No transaction ID returned from submitTransaction'
			)
		})

		it('should throw error on submission failure', async () => {
			mockPost.mockRejectedValueOnce({
				response: { data: { error: 'Invalid transaction' } }
			})

			const provider = new OgmiosProvider(mockConfig)

			await expect(provider.submitter.submitTx('invalid_tx')).rejects.toBeDefined()
		})

		it('should send correct JSON-RPC request for submitTransaction', async () => {
			mockPost.mockResolvedValueOnce({
				data: { result: { transaction: { id: 'txHash' } } }
			})

			const provider = new OgmiosProvider(mockConfig)
			await provider.submitter.submitTx('84a400d9abc123')

			expect(mockPost).toHaveBeenCalledWith('/', expect.stringContaining('"method":"submitTransaction"'))
			expect(mockPost).toHaveBeenCalledWith('/', expect.stringContaining('"cbor":"84a400d9abc123"'))
		})
	})
})
