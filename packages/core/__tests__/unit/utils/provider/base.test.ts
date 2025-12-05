import { describe, it, expect } from 'vitest'
import { BaseWalletProvider } from '../../../../src/utils/providers/base'
import { IFetcher } from '../../../../src/types/wallet/fetcher'
import { ISubmitter } from '../../../../src/types/wallet/submitter'

// Concrete implementation for testing
class TestWalletProvider extends BaseWalletProvider {
	public fetcher: IFetcher
	public submitter: ISubmitter

	constructor() {
		super()
		this.fetcher = {
			fetchAddressUTxOs: async () => []
		}
		this.submitter = {
			submitTx: async (tx: string) => 'mockTxHash'
		}
	}
}

describe('BaseWalletProvider', () => {
	describe('abstract class', () => {
		it('should be extendable', () => {
			const provider = new TestWalletProvider()

			expect(provider).toBeInstanceOf(BaseWalletProvider)
		})

		it('should require fetcher property', () => {
			const provider = new TestWalletProvider()

			expect(provider.fetcher).toBeDefined()
			expect(provider.fetcher.fetchAddressUTxOs).toBeDefined()
		})

		it('should require submitter property', () => {
			const provider = new TestWalletProvider()

			expect(provider.submitter).toBeDefined()
			expect(provider.submitter.submitTx).toBeDefined()
		})

		it('fetcher.fetchAddressUTxOs should be callable', async () => {
			const provider = new TestWalletProvider()

			const result = await provider.fetcher.fetchAddressUTxOs('addr_test')

			expect(result).toEqual([])
		})

		it('submitter.submitTx should be callable', async () => {
			const provider = new TestWalletProvider()

			const result = await provider.submitter.submitTx('txHex')

			expect(result).toBe('mockTxHash')
		})
	})
})
