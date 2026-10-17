import { describe, it, expect } from 'vitest'
import { deserializeHaskellErrorToJson, ErrorType } from '../../../src/utils/haskell-deserialize'

const unknown = (raw: string, errorType: string) => ({ errorType, message: 'Unknown error format', rawError: raw })

describe('deserializeHaskellErrorToJson', () => {
	const scriptFailed =
		'ScriptFailedInWallet {redeemerPtr = "Spend:0", failureReason = "MissingScript (RdmrPtr Spend 0) (fromList [(RdmrPtr Spend 0,ScriptPurpose with SafeHash \\"abc123\\",TxIn {txId = \\"txhash\\", TxIx {unTxIx = 3}},ScriptHash \\"scripthash\\",Nothing)])"}'

	it('extracts redeemerPtr and the redeemer from ScriptFailedInWallet', () => {
		expect(deserializeHaskellErrorToJson(scriptFailed)).toMatchObject({
			errorType: ErrorType.ScriptFailedInWallet,
			redeemerPtr: 'Spend:0',
			failureReason: { type: 'MissingScript', redeemer: 'MissingScript (RdmrPtr Spend 0)' }
		})
	})

	// BUG: failureReason is captured with /"([^"]+)"/, which stops at the first
	// escaped quote (`SafeHash \"`), while the inner regexes only match escaped
	// quotes — so txIn and scriptHash can never be extracted and are always null.
	it.fails('extracts the tx input and script hash from ScriptFailedInWallet', () => {
		expect(deserializeHaskellErrorToJson(scriptFailed)).toEqual({
			errorType: ErrorType.ScriptFailedInWallet,
			redeemerPtr: 'Spend:0',
			failureReason: {
				type: 'MissingScript',
				redeemer: 'MissingScript (RdmrPtr Spend 0)',
				details: [
					{
						redeemer: 'MissingScript (RdmrPtr Spend 0)',
						txIn: { txId: 'abc123', txIx: 3 },
						scriptHash: 'scripthash',
						datum: null
					}
				]
			}
		})
	})

	it.each([
		['ScriptFailedInWallet {}', { errorType: ErrorType.ScriptFailedInWallet }],
		[
			'InternalWalletError {reason = "Failed to build", headUTxO = UTxO {a}, tx = Tx {b}}',
			{ errorType: ErrorType.InternalWalletError, reason: 'Failed to build', headUTxO: 'UTxO {a}', tx: 'Tx {b}' }
		],
		[
			'InternalWalletError {reason = "Multi\nline !@#"}',
			{ errorType: ErrorType.InternalWalletError, reason: 'Multi\nline !@#', headUTxO: 'UTxO {...}', tx: 'Tx {...}' }
		],
		['NoFuelUTXOFound', { errorType: ErrorType.NoFuelUTXOFound }],
		['  NoFuelUTXOFound  ', { errorType: ErrorType.NoFuelUTXOFound }],
		['NotEnoughFuel {}', { errorType: ErrorType.NotEnoughFuel }],
		['NoSeedInput', { errorType: ErrorType.NoSeedInput }],
		['InvalidSeed {headSeed = "abc123def456"}', { errorType: ErrorType.InvalidSeed, headSeed: 'abc123def456' }],
		['InvalidSeed {}', { errorType: ErrorType.InvalidSeed, headSeed: null }],
		['FailedToConstructCloseTx', { errorType: ErrorType.FailedToConstructCloseTx }],
		['FailedToConstructFanoutTx', { errorType: ErrorType.FailedToConstructFanoutTx }],
		[
			'FailedToConstructIncrementTx {failureReason = "Insufficient funds"}',
			{ errorType: ErrorType.FailedToConstructIncrementTx, failureReason: 'Insufficient funds' }
		],
		[
			'FailedToConstructRecoverTx {failureReason = "Too early"}',
			{ errorType: ErrorType.FailedToConstructRecoverTx, failureReason: 'Too early' }
		],
		[
			'FailedToConstructDecrementTx {failureReason = "Decrement failed"}',
			{ errorType: ErrorType.FailedToConstructDecrementTx, failureReason: 'Decrement failed' }
		],
		[
			'TimeConversionException {slotNo = SlotNo 12345, reason = "Slot too far"}',
			{ errorType: ErrorType.TimeConversionException, slotNo: 12345, reason: 'Slot too far' }
		],
		['TimeConversionException {}', { errorType: ErrorType.TimeConversionException, slotNo: null, reason: null }],
		['SomeUnknownError {field = "value"}', unknown('SomeUnknownError {field = "value"}', 'SomeUnknownError')],
		['', unknown('', ErrorType.UnknownError)],
		['{{{malformed', unknown('{{{malformed', ErrorType.UnknownError)]
	])('%j', (raw, expected) => {
		expect(deserializeHaskellErrorToJson(raw)).toEqual(expected)
	})

	// The enum predates hydra-node v2.3.0's PostTxError (see types/post-tx-error.type.ts):
	// these tags fall through to "Unknown error format". Fixing it means editing
	// ErrorType in src, which needs the owner's sign-off — the proposed diff is in
	// _bmad-output/implementation-artifacts/test-refactor-slice-4.md.
	describe('v2.3.0 PostTxError tags missing from ErrorType', () => {
		it.fails.each([
			'InvalidHeadId {headId = "cafe"}',
			'UnsupportedLegacyOutput {byronAddress = "Ae2"}',
			'DepositTooLow {providedValue = 1, minimumValue = 2}',
			'InvalidStateToPost {txTried = X, chainState = Y}',
			'FailedToConstructPartialFanoutTx',
			'StalePartialFanoutTx',
			'InvalidTokenRequest {contents = []}'
		])('recognises %j', raw => {
			expect(deserializeHaskellErrorToJson(raw).message).toBeUndefined()
		})

		it.fails.each([
			['FailedToPostTx {failureReason = "boom"}'],
			['FailedToConstructDepositTx {failureReason = "boom"}'],
			['ContestationDeadlineOutsideTimeHorizon {failureReason = "boom"}']
		])('extracts failureReason from %j', raw => {
			expect(deserializeHaskellErrorToJson(raw)).toMatchObject({ failureReason: 'boom' })
		})
	})
})
