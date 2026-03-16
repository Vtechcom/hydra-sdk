export enum ErrorType {
	ScriptFailedInWallet = 'ScriptFailedInWallet',
	InternalWalletError = 'InternalWalletError',
	NoFuelUTXOFound = 'NoFuelUTXOFound',
	NotEnoughFuel = 'NotEnoughFuel',
	NoSeedInput = 'NoSeedInput',
	InvalidSeed = 'InvalidSeed',
	FailedToConstructAbortTx = 'FailedToConstructAbortTx',
	FailedToConstructCollectTx = 'FailedToConstructCollectTx',
	FailedToConstructCloseTx = 'FailedToConstructCloseTx',
	FailedToConstructContestTx = 'FailedToConstructContestTx',
	FailedToConstructFanoutTx = 'FailedToConstructFanoutTx',
	FailedToConstructIncrementTx = 'FailedToConstructIncrementTx',
	FailedToConstructRecoverTx = 'FailedToConstructRecoverTx',
	FailedToConstructDecrementTx = 'FailedToConstructDecrementTx',
	TimeConversionException = 'TimeConversionException',
	UnknownError = 'UnknownError'
}

export type JsonResult = {
	errorType: ErrorType
	redeemerPtr?: string | null
	failureReason?: any
	reason?: string | null
	headUTxO?: string
	tx?: string
	headSeed?: string | null
	slotNo?: number | null
	message?: string
	rawError?: string
}

export function deserializeHaskellErrorToJson(errorStr: string) {
	// Helper to extract a quoted value using a regex capture group
	const extractQuoted = (str: string, regex: RegExp) => {
		const match = str.match(regex)
		return match ? match[1] : null
	}

	// Helper to extract an integer using a regex capture group
	const extractInt = (str: string, regex: RegExp) => {
		const match = str.match(regex)
		return match ? parseInt(match[1]) : null
	}

	// Determine error type from the leading identifier
	const errorTypeMatch = errorStr.match(/^([^{]+)/)
	const errorType = (errorTypeMatch ? errorTypeMatch[1].trim() : ErrorType.UnknownError) as ErrorType

	const jsonResult: JsonResult = { errorType }

	// Parse additional fields based on error type
	switch (errorType) {
		case ErrorType.ScriptFailedInWallet: {
			const redeemerPtr = extractQuoted(errorStr, /redeemerPtr = "([^"]+)"/)
			const failureReasonStr = extractQuoted(errorStr, /failureReason = "([^"]+)"/)

			if (failureReasonStr) {
				const redeemer = failureReasonStr.split(') (fromList')[0] + ')'
				const detailsMatch = failureReasonStr.match(/fromList \[([^\]]+)\]/)
				const detailsStr = detailsMatch ? detailsMatch[1] : ''

				const txId = extractQuoted(detailsStr, /SafeHash \\"([^\\"]+)\\"/)
				const txIx = extractInt(detailsStr, /TxIx \{unTxIx = (\d+)\}/)
				const scriptHash = extractQuoted(detailsStr, /ScriptHash \\"([^\\"]+)\\"/)
				const datum = detailsStr.includes('Nothing') ? null : extractQuoted(detailsStr, /Just \\"([^\\"]+)\\"/)

				jsonResult.redeemerPtr = redeemerPtr
				jsonResult.failureReason = {
					type: 'MissingScript',
					redeemer,
					details: [
						{
							redeemer,
							txIn: { txId, txIx },
							scriptHash,
							datum
						}
					]
				}
			}
			break
		}

		case ErrorType.InternalWalletError: {
			const reason = extractQuoted(errorStr, /reason = "([^"]+)"/)
			const headUTxO = extractQuoted(errorStr, /headUTxO = ([^{]+{[^}]+})/) || 'UTxO {...}'
			const tx = extractQuoted(errorStr, /tx = ([^{]+{[^}]+})/) || 'Tx {...}'
			jsonResult.reason = reason
			jsonResult.headUTxO = headUTxO
			jsonResult.tx = tx
			break
		}

		case ErrorType.NoFuelUTXOFound:
		case ErrorType.NotEnoughFuel:
		case ErrorType.NoSeedInput:
			// No additional fields for these error types
			break

		case ErrorType.InvalidSeed: {
			const headSeed = extractQuoted(errorStr, /headSeed = "([^"]+)"/)
			jsonResult.headSeed = headSeed
			break
		}

		case ErrorType.FailedToConstructAbortTx:
		case ErrorType.FailedToConstructCollectTx:
		case ErrorType.FailedToConstructCloseTx:
		case ErrorType.FailedToConstructContestTx:
		case ErrorType.FailedToConstructFanoutTx: {
			// No failureReason for these error types
			break
		}

		case ErrorType.FailedToConstructIncrementTx:
		case ErrorType.FailedToConstructRecoverTx:
		case ErrorType.FailedToConstructDecrementTx: {
			const failureReason = extractQuoted(errorStr, /failureReason = "([^"]+)"/)
			jsonResult.failureReason = failureReason
			break
		}

		case ErrorType.TimeConversionException: {
			const slotNo = extractInt(errorStr, /slotNo = SlotNo (\d+)/)
			const reason = extractQuoted(errorStr, /reason = "([^"]+)"/)
			jsonResult.slotNo = slotNo
			jsonResult.reason = reason
			break
		}

		default: {
			jsonResult.message = 'Unknown error format'
			jsonResult.rawError = errorStr
		}
	}

	return jsonResult
}


