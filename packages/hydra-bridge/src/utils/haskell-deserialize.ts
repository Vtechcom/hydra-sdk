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
	// Hàm phụ để trích xuất giá trị trong dấu ngoặc kép
	const extractQuoted = (str: string, regex: RegExp) => {
		const match = str.match(regex)
		return match ? match[1] : null
	}

	// Hàm phụ để trích xuất số nguyên
	const extractInt = (str: string, regex: RegExp) => {
		// Hàm này giả định rằng số nguyên được bao quanh bởi dấu ngoặc đơn
		const match = str.match(regex)
		return match ? parseInt(match[1]) : null
	}

	// Xác định loại lỗi
	const errorTypeMatch = errorStr.match(/^([^{]+)/)
	const errorType = (errorTypeMatch ? errorTypeMatch[1].trim() : ErrorType.UnknownError) as ErrorType

	const jsonResult: JsonResult = { errorType }

	// Xử lý theo từng loại lỗi
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
			// Các lỗi này không có thêm trường, chỉ cần errorType
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
			// Các lỗi này không có failureReason
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

// // Ví dụ sử dụng với HTTP request
// async function handleApiRequest() {
// 	try {
// 		const response = await fetch('your-api-endpoint')
// 		if (!response.ok) {
// 			const errorStr = await response.text() // Giả sử API trả về chuỗi lỗi Haskell
// 			const jsonError = deserializeHaskellErrorToJson(errorStr)
// 			console.log('Parsed Error:', JSON.stringify(jsonError, null, 2))
// 			throw new Error(`API error: ${jsonError.errorType}`)
// 		}
// 		const data = await response.json()
// 		console.log('Success:', data)
// 	} catch (error) {
// 		console.error('Error:', error)
// 	}
// }

// // Test với chuỗi lỗi
// const errorStr = `ScriptFailedInWallet {redeemerPtr = "ConwaySpending (AsIx {unAsIx = 3})", failureReason = "MissingScript (ConwaySpending (AsIx {unAsIx = 3})) (fromList [(ConwaySpending (AsIx {unAsIx = 3}),(ConwaySpending (AsItem {unAsItem = TxIn (TxId {unTxId = SafeHash \\"7528a686c3d25ec82f6e7d233869916b5a98aa01a24636bc508b1b7384c4b4aa\\"}) (TxIx {unTxIx = 0})}),Nothing,ScriptHash \\"61458bc2f297fff3cc5df6ac7ab57cefd87763b0b7bd722146a1035c\\"))])"}`
// console.log(JSON.stringify(deserializeHaskellErrorToJson(errorStr), null, 2))

// // Test với lỗi khác
// const errorStr2 = `InternalWalletError {headUTxO = UTxO ..., reason = "some error", tx = Tx ...}`
// console.log(JSON.stringify(deserializeHaskellErrorToJson(errorStr2), null, 2))

// // Test với lỗi không có tham số
// const errorStr3 = `NoFuelUTXOFound`
// console.log(JSON.stringify(deserializeHaskellErrorToJson(errorStr3), null, 2))
