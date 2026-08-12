import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import type { UTxO } from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'

/** Always-succeeds Plutus V3 validator. */
export const scriptCbor = '46450101002499'
export const testAddress =
	'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
export const fundTxHash = 'a'.repeat(64)
export const scriptTxHash = 'b'.repeat(64)
export const collateralTxHash = 'c'.repeat(64)

/** emptyRedeemer placeholder exUnits, before real evaluation. */
export const PLACEHOLDER_EXUNITS = { mem: '100000', steps: '10000000' }

/**
 * Enterprise address of the always-succeed script, derived the SAME way
 * TxBuilder.txInScript hashes the script (from_hex_with_version), so the script
 * input resolves to the validator during evaluation.
 */
export const scriptAddress = (() => {
	const script = CardanoWASM.PlutusScript.from_hex_with_version(scriptCbor, CardanoWASM.Language.new_plutus_v3())
	const addr = CardanoWASM.EnterpriseAddress.new(0, CardanoWASM.Credential.from_scripthash(script.hash()))
	return addr.to_address().to_bech32()
})()

/** The UTxOs a V3 SPEND references: funding input, script input, collateral. */
export const resolvedUtxos = (): UTxO[] => [
	{
		input: { txHash: fundTxHash, outputIndex: 0 },
		output: { address: testAddress, amount: [{ unit: 'lovelace', quantity: '10000000' }] }
	},
	{
		input: { txHash: scriptTxHash, outputIndex: 1 },
		output: { address: scriptAddress, amount: [{ unit: 'lovelace', quantity: '5000000' }] }
	},
	{
		input: { txHash: collateralTxHash, outputIndex: 0 },
		output: { address: testAddress, amount: [{ unit: 'lovelace', quantity: '5000000' }] }
	}
]

/** Stage an always-succeed V3 SPEND on the given builder (does not call complete). */
export const stageSpendTx = (builder: TxBuilder): TxBuilder =>
	builder
		.txIn(fundTxHash, 0, [{ unit: 'lovelace', quantity: '10000000' }], testAddress)
		.txIn(scriptTxHash, 1, [{ unit: 'lovelace', quantity: '5000000' }], scriptAddress)
		.txInScript(scriptCbor, 'V3')
		.txInEmptyRedeemer()
		.txInCollateral(collateralTxHash, 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
		.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
		.changeAddress(testAddress)

/** Read the first redeemer's exUnits from a built transaction. */
export const firstRedeemerExUnits = (tx: CardanoWASM.Transaction): { mem: string; steps: string } => {
	const redeemers = tx.witness_set().redeemers()
	if (!redeemers) throw new Error('no redeemers in witness set')
	const r = redeemers.get(0)
	return { mem: r.ex_units().mem().to_str(), steps: r.ex_units().steps().to_str() }
}
