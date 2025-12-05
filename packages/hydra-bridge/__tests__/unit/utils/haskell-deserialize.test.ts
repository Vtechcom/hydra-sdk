import { describe, it, expect } from 'vitest'
import { deserializeHaskellErrorToJson, ErrorType, JsonResult } from '../../../src/utils/haskell-deserialize'

describe('deserializeHaskellErrorToJson', () => {
	describe('ErrorType.ScriptFailedInWallet', () => {
		it('should parse ScriptFailedInWallet error with redeemer and failure reason', () => {
			const errorStr = `ScriptFailedInWallet {redeemerPtr = "Spend:0", failureReason = "MissingScript (RdmrPtr Spend 0) (fromList [(RdmrPtr Spend 0,ScriptPurpose with SafeHash \\"abc123\\",TxIn {txId = \\"txhash\\", TxIx {unTxIx = 0}},ScriptHash \\"scripthash\\",Nothing)])"}`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.ScriptFailedInWallet)
			expect(result.redeemerPtr).toBe('Spend:0')
			expect(result.failureReason).toBeDefined()
		})

		it('should handle ScriptFailedInWallet with missing fields', () => {
			const errorStr = `ScriptFailedInWallet {}`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.ScriptFailedInWallet)
		})
	})

	describe('ErrorType.InternalWalletError', () => {
		it('should parse InternalWalletError with reason', () => {
			const errorStr = `InternalWalletError {reason = "Failed to build transaction", headUTxO = UTxO {...}, tx = Tx {...}}`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.InternalWalletError)
			expect(result.reason).toBe('Failed to build transaction')
		})

		it('should handle InternalWalletError with default headUTxO and tx', () => {
			const errorStr = `InternalWalletError {reason = "Some error"}`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.InternalWalletError)
			expect(result.reason).toBe('Some error')
			expect(result.headUTxO).toBe('UTxO {...}')
			expect(result.tx).toBe('Tx {...}')
		})
	})

	describe('ErrorType.NoFuelUTXOFound', () => {
		it('should parse NoFuelUTXOFound error', () => {
			const errorStr = `NoFuelUTXOFound`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.NoFuelUTXOFound)
		})

		it('should parse NoFuelUTXOFound with extra content', () => {
			const errorStr = `NoFuelUTXOFound {}`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.NoFuelUTXOFound)
		})
	})

	describe('ErrorType.NotEnoughFuel', () => {
		it('should parse NotEnoughFuel error', () => {
			const errorStr = `NotEnoughFuel`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.NotEnoughFuel)
		})
	})

	describe('ErrorType.NoSeedInput', () => {
		it('should parse NoSeedInput error', () => {
			const errorStr = `NoSeedInput`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.NoSeedInput)
		})
	})

	describe('ErrorType.InvalidSeed', () => {
		it('should parse InvalidSeed error with headSeed', () => {
			const errorStr = `InvalidSeed {headSeed = "abc123def456"}`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.InvalidSeed)
			expect(result.headSeed).toBe('abc123def456')
		})

		it('should handle InvalidSeed without headSeed', () => {
			const errorStr = `InvalidSeed {}`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.InvalidSeed)
			expect(result.headSeed).toBeNull()
		})
	})

	describe('ErrorType.FailedToConstruct*Tx errors', () => {
		it('should parse FailedToConstructAbortTx', () => {
			const errorStr = `FailedToConstructAbortTx`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.FailedToConstructAbortTx)
		})

		it('should parse FailedToConstructCollectTx', () => {
			const errorStr = `FailedToConstructCollectTx`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.FailedToConstructCollectTx)
		})

		it('should parse FailedToConstructCloseTx', () => {
			const errorStr = `FailedToConstructCloseTx`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.FailedToConstructCloseTx)
		})

		it('should parse FailedToConstructContestTx', () => {
			const errorStr = `FailedToConstructContestTx`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.FailedToConstructContestTx)
		})

		it('should parse FailedToConstructFanoutTx', () => {
			const errorStr = `FailedToConstructFanoutTx`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.FailedToConstructFanoutTx)
		})

		it('should parse FailedToConstructIncrementTx with failureReason', () => {
			const errorStr = `FailedToConstructIncrementTx {failureReason = "Insufficient funds"}`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.FailedToConstructIncrementTx)
			expect(result.failureReason).toBe('Insufficient funds')
		})

		it('should parse FailedToConstructRecoverTx with failureReason', () => {
			const errorStr = `FailedToConstructRecoverTx {failureReason = "Recovery not possible"}`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.FailedToConstructRecoverTx)
			expect(result.failureReason).toBe('Recovery not possible')
		})

		it('should parse FailedToConstructDecrementTx with failureReason', () => {
			const errorStr = `FailedToConstructDecrementTx {failureReason = "Decrement failed"}`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.FailedToConstructDecrementTx)
			expect(result.failureReason).toBe('Decrement failed')
		})
	})

	describe('ErrorType.TimeConversionException', () => {
		it('should parse TimeConversionException with slotNo and reason', () => {
			const errorStr = `TimeConversionException {slotNo = SlotNo 12345, reason = "Slot too far in the future"}`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.TimeConversionException)
			expect(result.slotNo).toBe(12345)
			expect(result.reason).toBe('Slot too far in the future')
		})

		it('should handle TimeConversionException with missing fields', () => {
			const errorStr = `TimeConversionException {}`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.TimeConversionException)
			expect(result.slotNo).toBeNull()
			expect(result.reason).toBeNull()
		})
	})

	describe('Unknown errors', () => {
		it('should handle completely unknown error type', () => {
			const errorStr = `SomeUnknownError {field = "value"}`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe('SomeUnknownError')
			expect(result.message).toBe('Unknown error format')
			expect(result.rawError).toBe(errorStr)
		})

		it('should handle empty string', () => {
			const errorStr = ``

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.message).toBe('Unknown error format')
			expect(result.rawError).toBe('')
		})

		it('should handle malformed error string', () => {
			const errorStr = `{{{malformed`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.message).toBe('Unknown error format')
			expect(result.rawError).toBe(errorStr)
		})
	})

	describe('ErrorType enum', () => {
		it('should have all expected error types', () => {
			expect(ErrorType.ScriptFailedInWallet).toBe('ScriptFailedInWallet')
			expect(ErrorType.InternalWalletError).toBe('InternalWalletError')
			expect(ErrorType.NoFuelUTXOFound).toBe('NoFuelUTXOFound')
			expect(ErrorType.NotEnoughFuel).toBe('NotEnoughFuel')
			expect(ErrorType.NoSeedInput).toBe('NoSeedInput')
			expect(ErrorType.InvalidSeed).toBe('InvalidSeed')
			expect(ErrorType.FailedToConstructAbortTx).toBe('FailedToConstructAbortTx')
			expect(ErrorType.FailedToConstructCollectTx).toBe('FailedToConstructCollectTx')
			expect(ErrorType.FailedToConstructCloseTx).toBe('FailedToConstructCloseTx')
			expect(ErrorType.FailedToConstructContestTx).toBe('FailedToConstructContestTx')
			expect(ErrorType.FailedToConstructFanoutTx).toBe('FailedToConstructFanoutTx')
			expect(ErrorType.FailedToConstructIncrementTx).toBe('FailedToConstructIncrementTx')
			expect(ErrorType.FailedToConstructRecoverTx).toBe('FailedToConstructRecoverTx')
			expect(ErrorType.FailedToConstructDecrementTx).toBe('FailedToConstructDecrementTx')
			expect(ErrorType.TimeConversionException).toBe('TimeConversionException')
			expect(ErrorType.UnknownError).toBe('UnknownError')
		})
	})

	describe('JsonResult structure', () => {
		it('should always return errorType', () => {
			const result1 = deserializeHaskellErrorToJson('NoFuelUTXOFound')
			const result2 = deserializeHaskellErrorToJson('UnknownError')

			expect(result1.errorType).toBeDefined()
			expect(result2.errorType).toBeDefined()
		})

		it('should have correct optional field types', () => {
			const result = deserializeHaskellErrorToJson('TimeConversionException {slotNo = SlotNo 100, reason = "test"}')

			expect(typeof result.slotNo).toBe('number')
			expect(typeof result.reason).toBe('string')
		})
	})

	describe('edge cases', () => {
		it('should handle error with special characters', () => {
			const errorStr = `InternalWalletError {reason = "Error with special chars: !@#$%^&*()"}`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.InternalWalletError)
		})

		it('should handle error with newlines', () => {
			const errorStr = `InternalWalletError {reason = "Multi\nline\nerror"}`

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.InternalWalletError)
		})

		it('should handle error type with whitespace', () => {
			const errorStr = `  NoFuelUTXOFound  `

			const result = deserializeHaskellErrorToJson(errorStr)

			expect(result.errorType).toBe(ErrorType.NoFuelUTXOFound)
		})
	})
})
