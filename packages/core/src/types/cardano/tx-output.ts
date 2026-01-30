import type { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { type Asset } from './asset'

/**
 * Transaction output
 * @example 
 * ```ts
 * const utxo: UTxO = {
 *		"2c23d72602c1bf725ba3c3830a688900fceee4ea2cd03cb9d12e6174494eb16c#0": {
                "address": "addr_test1wpws0hrjsyykjtm0k5jlxrjh9hksh8hqkj46qtf56ew7c9cla8dn2",
                "datum": null,
                "inlineDatum": {
                    "constructor": 0,
                    "fields": [
                        {
                            "constructor": 0,
                            "fields": [
                                {
                                    "bytes": "3969ae4e255d5150f5c27d0251d8129241e1fdb28873cad1a229fcda"
                                },
                                {
                                    "bytes": "fc6beb57c9451fc1018755f470950eac27085ba9475cb08b5d314b5a"
                                }
                            ]
                        },
                        {
                            "bytes": "fc6beb57c9451fc1018755f470950eac27085ba9475cb08b5d314b5a"
                        }
                    ]
                },
                "inlineDatumRaw": "d8799fd8799f581c3969a...6626338303465343163ff",
                "inlineDatumhash": "edab11ad3834f7a1c782b3e90bb23374c8ae1989225dc4d68c57570c8df55b68",
                "referenceScript": null,
                "value": {
                    "lovelace": 2000000
                }
            }
 *		}
 *	}
 * ```
 */
export type TxOutput = {
	address: string
	amount: Asset[]

	/**
	 * Datum in PlutusData
	 */
	datum?: CardanoWASM.PlutusData | null
	datumHash?: string | null

	/**
	 * Inline datum in CardanoWASM.PlutusData format
	 * @example
	 * ```ts
	 * CardanoWASM.PlutusData.from_hex("d8799fd8799f581c3969a...6626338303465343163ff")
	 * ```
	 */
	inlineDatum?: CardanoWASM.PlutusData | null
	scriptRef?: {
		scriptCbor: string
		version: PlutusVersion
	} | null
	scriptHash?: string | null
}

type PlutusVersion = 'V1' | 'V2' | 'V3'
