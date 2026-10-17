/**
 * Transactions for the always-true golden, shared by always-true.test.ts (asserts
 * the goldens) and regenerate-always-true.ts (prints them). Keep the two in sync by
 * building every transaction here only.
 */
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { Converter, UTxOObject } from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'

/** Aiken always-true spend validator, Plutus V3 (apps/nodejs-playground/src/contract/always-true.json). */
export const SCRIPT_CBOR =
	'585e585c01010029800aba2aba1aab9eaab9dab9a4888896600264653001300600198031803800cc0180092225980099b8748008c01cdd500144c8cc892898050009805180580098041baa0028b200c180300098019baa0068a4d13656400401'
export const SCRIPT_ADDRESS = 'addr_test1wrf8enqnl26m0q5cfg73lxf4xxtu5x5phcrfjs0lcqp7uagh2hm3k'

/** Base address of the playground `walletPrimary` mnemonic on preprod. */
export const WALLET_ADDRESS =
	'addr_test1qzya97j3gg2lkp360m7238lfe46y0jzhl6wgsz6xysz3d5peqew2j40a7ryqyku9re6znz26uan26shczed77p9n6uwq68d0h9'

export const WALLET_UTXO_REF = '3dfb4f1bb56b8ae025ca3003e5b99cae4cfe396012be60c17876e10972b681f1#1'
export const WALLET_LOVELACE = 148328779n
export const COLLATERAL = { txHash: 'b38512039aa59e10961ff05338ddc0ec719fc6d28bcffe43d735fa75a437edb4', index: 0 }
export const LOCKED = { txHash: '25cef2b003bb9c86cdb61610fb56deac3aa89d6cceb2d71bcfbf8d2b9bc53fec', index: 0 }
export const LOCKED_LOVELACE = 2000000n

const walletUtxos: UTxOObject = {
	[WALLET_UTXO_REF]: {
		address: WALLET_ADDRESS,
		value: { lovelace: Number(WALLET_LOVELACE) },
		datum: null,
		datumhash: null,
		inlineDatumhash: null,
		inlineDatumRaw: null,
		inlineDatum: null,
		referenceScript: null
	},
	'4163280d8a0482018a761088fbf32018390f36a89423a09662b463d541612576#0': {
		address: WALLET_ADDRESS,
		value: {
			lovelace: 1193870,
			'9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4': { '446f6e67': 10, '546f6b656e31': 10, '55444f': 10 }
		},
		datum: null,
		datumhash: null,
		inlineDatumhash: null,
		inlineDatumRaw: null,
		inlineDatum: null,
		referenceScript: null
	}
}

/** Constr 0 [owner pkh]. Caller frees. */
export const buildDatum = () =>
	CardanoWASM.PlutusData.from_json(
		JSON.stringify({ constructor: 0, fields: [{ bytes: '4d04bcc73103cb8296abce92daefde484d498af9900729394b25f5e5' }] }),
		CardanoWASM.PlutusDatumSchema.DetailedSchema
	)

export type DatumMode = 'inline' | 'hash'

/** Lock 3 ADA at the script address. The datum is consumed by the builder. */
export const buildLockTx = (mode: DatumMode) => {
	const builder = new TxBuilder({})
		.setInputs(Converter.convertUTxOObjectToUTxO(walletUtxos))
		.addOutput({ address: SCRIPT_ADDRESS, amount: [{ unit: 'lovelace', quantity: '3000000' }] })
	const datum = buildDatum()
	if (mode === 'inline') builder.txOutInlineDatumValue(datum)
	else builder.txOutDatumHashValue(datum)
	return builder.changeAddress(WALLET_ADDRESS).complete()
}

/** Spend the locked UTxO with an empty redeemer, paying 2 ADA back to the wallet. */
export const buildUnlockTx = (mode: DatumMode) => {
	const datum = buildDatum()
	const builder = new TxBuilder({})
		.setInputs(Converter.convertUTxOObjectToUTxO(walletUtxos))
		.txInCollateral(COLLATERAL.txHash, COLLATERAL.index, [{ unit: 'lovelace', quantity: '5000000' }], WALLET_ADDRESS)
		.txIn(LOCKED.txHash, LOCKED.index, [{ unit: 'lovelace', quantity: LOCKED_LOVELACE.toString() }], SCRIPT_ADDRESS)
		.txInScript(SCRIPT_CBOR)
	if (mode === 'inline') builder.txInInlineDatum(datum)
	else builder.txInDatumHash(datum)
	return builder
		.txInEmptyRedeemer()
		.addOutput({ address: WALLET_ADDRESS, amount: [{ unit: 'lovelace', quantity: '2000000' }] })
		.changeAddress(WALLET_ADDRESS)
		.complete()
}
