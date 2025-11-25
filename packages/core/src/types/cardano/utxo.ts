import type { TxOutput } from './tx-output'

export type UTxO = {
	input: {
		outputIndex: number
		txHash: string
	}
	output: TxOutput
}

export type ReferenceScript = {
	scriptLanguage: string
	script: {
		type: 'SimpleScript' | 'PlutusScriptV1' | 'PlutusScriptV2' | 'PlutusScriptV3'
		description: string
		cborHex: string
	}
}
export type TxId = string
export type TxIndex = number
export type TxHash = `${TxId}#${TxIndex}`
/**
 * UTxO Object (when query UTxO by CLI / Hydra-snapshot UTxO)
 * @example
 * ```ts
 * const utxo: UTxOObject = {
 *	'16d2f05ec61ad60089e7cc7bc8fef45c4285f4c0911e774fe87197fcfce166d6#0': {
 *		address: 'addr_test1wr7yyuz26f9mty4z9s9p3x2k3u6ffjq6ffrrexanr6y3ewg4rlw85',
 *		datum: null,
 *		datumhash: 'c900e01e64757aa083257826c48277e048633dafcee46a325d65c16d0d9b4ea4',
 *		inlineDatum: null,
 *		inlineDatumRaw: null,
 *		referenceScript: {
 *			script: {
 *				cborHex: '590ec10101003232323232323...ad30063015375400e6600297ae1101200081010',
 *				description: '',
 *				type: 'PlutusScriptV3'
 *			},
 *			scriptLanguage: 'PlutusScriptLanguage PlutusScriptV3'
 *		},
 *		value: {
 *			lovelace: 20000000
 *		}
 *	}
 * }
 * ```
 */
export type UTxOObject = Record<TxHash, UTxOObjectValue>
export type UTxOObjectValue = {
	address: string
	/**
	 * Don't use string for datum when it's inline datum
	 */
	datum: string | Record<string, any> | null
	/**
	 * Datum hash (if output has datum hash only, no inline datum)
	 */
	datumhash: string | null

	/**
	 * Inline datum (if output has inline datum)
	 */
	inlineDatum: string | Record<string, any> | null
	inlineDatumhash?: string | null
	inlineDatumRaw?: string | null
	referenceScript: null | ReferenceScript
	value:
		| {
				lovelace: number
		  }
		| {
				[policyId: string]: {
					[assetNameHex: string]: number
				}
		  }
}
