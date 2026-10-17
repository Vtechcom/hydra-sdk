import { describe, it, expect, vi, afterEach } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { DEFAULT_PROTOCOL_PARAMETERS } from '@hydra-sdk/core'
import { TxBuilder } from '../../../src/tx-builder'
import {
	ADDRESS,
	ALWAYS_SUCCEEDS_V3,
	ALWAYS_SUCCEEDS_V3_HASH,
	OTHER_ADDRESS,
	REWARD_ADDRESS,
	SCRIPT_ADDRESS,
	TOKEN,
	POLICY_ID,
	fee,
	lovelace,
	minFee,
	outputAsset,
	recomputeScriptDataHashV3,
	ref,
	sumInputs,
	sumOutputs,
	txHash,
	utxo,
	withTx
} from '../../helpers/fixtures'

const FUND = utxo(txHash('a'), 0, lovelace(10_000_000))
const SMALL = utxo(txHash('b'), 0, lovelace(3_000_000))

/** A funded, balanced payment of 2 ADA to OTHER_ADDRESS with change back to ADDRESS. */
const payment = (builder = new TxBuilder()) =>
	builder.setInputs([FUND]).txOut(OTHER_ADDRESS, lovelace(2_000_000)).changeAddress(ADDRESS)

afterEach(() => {
	vi.restoreAllMocks()
})

describe('complete() — balanced payment', () => {
	it('conserves value, returns change to the change address and pays at least the min fee', async () => {
		await withTx(
			new TxBuilder().setInputs([SMALL, FUND]).txOut(OTHER_ADDRESS, lovelace(2_000_000)).changeAddress(ADDRESS),
			(tx, raw) => {
				// largest-first selection needs only the 10 ADA UTxO
				expect(tx.body.inputs.map(ref)).toEqual([`${txHash('a')}#0`])
				expect(sumInputs(tx, [SMALL, FUND])).toBe(sumOutputs(tx) + fee(tx))

				expect(tx.body.outputs).toHaveLength(2)
				expect(tx.body.outputs[0]).toMatchObject({ address: OTHER_ADDRESS, amount: { coin: '2000000' } })
				expect(tx.body.outputs[1].address).toBe(ADDRESS)
				expect(BigInt(tx.body.outputs[1].amount.coin)).toBe(10_000_000n - 2_000_000n - fee(tx))

				// fee covers one key witness, without overpaying by more than a few bytes
				const required = minFee(raw)
				expect(fee(tx)).toBeGreaterThanOrEqual(required)
				expect(fee(tx) - required).toBeLessThan(1_000n)
			}
		)
	})

	it('keeps the staged outputs in order ahead of the change output', async () => {
		const builder = payment().txOut(OTHER_ADDRESS, lovelace(3_000_000)).addLovelaceOutput(ADDRESS, '1500000')
		await withTx(builder, tx => {
			expect(tx.body.outputs.map(o => o.amount.coin).slice(0, 3)).toEqual(['2000000', '3000000', '1500000'])
			expect(sumInputs(tx, [FUND])).toBe(sumOutputs(tx) + fee(tx))
		})
	})

	it('conserves native assets: sent + change = held', async () => {
		const held = utxo(txHash('a'), 0, [...lovelace(10_000_000), { unit: TOKEN, quantity: '1000' }])
		const builder = new TxBuilder()
			.setInputs([held])
			.txOut(OTHER_ADDRESS, [...lovelace(2_000_000), { unit: TOKEN, quantity: '300' }, { unit: TOKEN, quantity: '200' }])
			.changeAddress(ADDRESS)

		await withTx(builder, tx => {
			// duplicate units in one output are aggregated
			expect(tx.body.outputs[0].amount.multiasset).toEqual({ [POLICY_ID]: { '746f6b656e': '500' } })
			expect(outputAsset(tx, POLICY_ID, '746f6b656e')).toBe(1000n)
			expect(sumInputs(tx, [held])).toBe(sumOutputs(tx) + fee(tx))
		})
	})

	it.fails('B2: coin selection uses the strategy given to setInputs()', async () => {
		const select = vi.spyOn(CardanoWASM.TransactionBuilder.prototype, 'add_inputs_from_and_change')
		const builder = new TxBuilder()
			.setInputs([FUND], { strategy: 'RandomImprove' })
			.txOut(OTHER_ADDRESS, lovelace(2_000_000))
			.changeAddress(ADDRESS)
		await withTx(builder, () => {
			expect(select.mock.calls[0][1]).toBe(CardanoWASM.CoinSelectionStrategyCIP2.RandomImprove)
		})
	})
})

describe('complete() — body fields', () => {
	it('sets validity interval, deduplicated required signers and metadata', async () => {
		const signer = 'd'.repeat(56)
		const builder = payment()
			.invalidBefore(1000)
			.invalidAfter(2000)
			.requiredSignerHash(signer)
			.requiredSignerHash(signer)
			.metadataValue(674, { msg: ['hi'] })

		await withTx(builder, (tx, raw) => {
			expect(tx.body.validity_start_interval).toBe('1000')
			expect(tx.body.ttl).toBe('2000')
			expect(tx.body.required_signers).toEqual([signer])
			expect(JSON.parse(tx.auxiliary_data!.metadata!['674'] as string)).toEqual({
				map: [{ k: { string: 'msg' }, v: { list: [{ string: 'hi' }] } }]
			})
			const aux = raw.auxiliary_data()!
			const hash = CardanoWASM.hash_auxiliary_data(aux)
			expect(tx.body.auxiliary_data_hash).toBe(hash.to_hex())
			hash.free()
			aux.free()
		})
	})

	it('omits optional fields that were not staged', async () => {
		await withTx(payment(), tx => {
			for (const field of [
				'ttl',
				'validity_start_interval',
				'certs',
				'withdrawals',
				'mint',
				'script_data_hash',
				'collateral',
				'total_collateral'
			] as const) {
				expect(tx.body[field], field).toBeNull()
			}
		})
	})

	it.fails('omits auxiliary data when no metadata was staged', async () => {
		await withTx(payment(), tx => {
			expect(tx.body.auxiliary_data_hash).toBeNull()
			expect(tx.auxiliary_data).toBeNull()
		})
	})

	it('writes inline datum, datum hash and reference script onto their outputs', async () => {
		const datum = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))
		const builder = payment()
			.txOut(OTHER_ADDRESS, lovelace(2_000_000))
			.txOutInlineDatumValue(datum)
			.txOut(OTHER_ADDRESS, lovelace(2_000_000))
			.txOutDatumHashValue(datum)
			.txOut(OTHER_ADDRESS, lovelace(3_000_000))
			.txOutReferenceScript(ALWAYS_SUCCEEDS_V3)

		await withTx(builder, tx => {
			const [, inline, hashed, withScript] = tx.body.outputs
			expect(inline.plutus_data).toEqual({ Data: '{"int":42}' })
			// blake2b-256 of the CBOR of integer 42 (CSL hash_plutus_data)
			expect(hashed.plutus_data).toEqual({ DataHash: '9e1199a988ba72ffd6e9c269cadb3b53b5f360ff99f112d9b2ee30c4d74ad88b' })
			expect(withScript.script_ref).toEqual({ PlutusScript: ALWAYS_SUCCEEDS_V3.slice(2) })
		})
		datum.free()
	})

	it.each([
		['registration', (b: TxBuilder) => b.registerStake(REWARD_ADDRESS), 'StakeRegistration', -2_000_000n],
		['deregistration', (b: TxBuilder) => b.deregisterStake(REWARD_ADDRESS), 'StakeDeregistration', 2_000_000n],
		['delegation', (b: TxBuilder) => b.delegateStake(REWARD_ADDRESS, 'f'.repeat(56)), 'StakeDelegation', 0n]
	])('attaches a stake %s certificate and balances its deposit', async (_name, stage, kind, depositDelta) => {
		await withTx(stage(payment()), tx => {
			expect(tx.body.certs).toHaveLength(1)
			expect(Object.keys(tx.body.certs![0] as object)).toEqual([kind])
			// inputs + refund (or − deposit) = outputs + fee
			expect(sumInputs(tx, [FUND]) + depositDelta).toBe(sumOutputs(tx) + fee(tx))
		})
	})

	it('counts a reward withdrawal as an input to the balance', async () => {
		await withTx(payment().withdrawal(REWARD_ADDRESS, '1000000'), tx => {
			expect(tx.body.withdrawals).toEqual({ [REWARD_ADDRESS]: '1000000' })
			expect(sumInputs(tx, [FUND]) + 1_000_000n).toBe(sumOutputs(tx) + fee(tx))
		})
	})

	it.fails('keeps every staged withdrawal, not only the last one', async () => {
		const other = 'stake_test1uzpq2pktpnj54e64kfgjkm8nrptdwfj7s7fvhp40e98qsusd9z7ek'
		await withTx(payment().withdrawal(REWARD_ADDRESS, '1000000').withdrawal(other, '2000000'), tx => {
			expect(tx.body.withdrawals).toEqual({ [REWARD_ADDRESS]: '1000000', [other]: '2000000' })
		})
	})

	it.fails('B6: auxiliaryData(hash) puts the given hash in the body', async () => {
		const hash = 'ab'.repeat(32)
		await withTx(payment().auxiliaryData(hash), tx => {
			expect(tx.body.auxiliary_data_hash).toBe(hash)
		})
	})
})

describe('complete() — mint', () => {
	const tok = Buffer.from('tok').toString('hex')

	it('mints with a Plutus V3 policy: mint field, MINT redeemer and script_data_hash', async () => {
		const builder = payment()
			.mint('5', ALWAYS_SUCCEEDS_V3_HASH, 'tok')
			.mintingScript({ type: 'PlutusV3', scriptCborHex: ALWAYS_SUCCEEDS_V3 })
			.txOut(OTHER_ADDRESS, [...lovelace(2_000_000), { unit: ALWAYS_SUCCEEDS_V3_HASH + tok, quantity: '5' }])
			.txInCollateral(txHash('c'), 0, lovelace(5_000_000), ADDRESS)

		await withTx(builder, (tx, raw) => {
			expect(tx.body.mint).toEqual([[ALWAYS_SUCCEEDS_V3_HASH, { [tok]: '5' }]])
			expect(tx.witness_set.redeemers?.map(r => r.tag)).toEqual(['Mint'])
			expect(tx.body.script_data_hash).toBe(recomputeScriptDataHashV3(raw))
			expect(outputAsset(tx, ALWAYS_SUCCEEDS_V3_HASH, tok)).toBe(5n)
		})
	})

	it('burns with a native policy (negative quantity)', async () => {
		const native = '8200581c' + 'b'.repeat(56) // ScriptPubkey
		const script = CardanoWASM.NativeScript.from_hex(native)
		const hash = script.hash()
		const policy = hash.to_hex()
		hash.free()
		script.free()
		const held = utxo(txHash('a'), 0, [...lovelace(10_000_000), { unit: policy + tok, quantity: '8' }])
		const builder = new TxBuilder()
			.setInputs([held])
			.mint('-5', policy, 'tok')
			.mintingScript({ type: 'Native', scriptCborHex: native })
			.txOut(OTHER_ADDRESS, lovelace(2_000_000))
			.changeAddress(ADDRESS)

		await withTx(builder, tx => {
			expect(tx.body.mint).toEqual([[policy, { [tok]: '-5' }]])
			expect(outputAsset(tx, policy, tok)).toBe(3n)
			expect(tx.body.script_data_hash).toBeNull()
		})
	})

	it.each([
		[
			'policy id differs from the script hash',
			'b'.repeat(56),
			{ type: 'PlutusV3' as const, scriptCborHex: ALWAYS_SUCCEEDS_V3 },
			/Mint policy ID does not match script hash/
		],
		['no policy script', ALWAYS_SUCCEEDS_V3_HASH, undefined, /Mint policy script is required/]
	])('rejects a mint whose %s', async (_name, policyId, script, message) => {
		const builder = payment().mint('5', policyId, 'tok')
		script && builder.mintingScript(script)
		await expect(builder.complete()).rejects.toThrow(message)
		builder.dispose()
	})
})

describe('complete() — script spend with collateral', () => {
	const SCRIPT_UTXO = utxo(txHash('b'), 1, lovelace(5_000_000), SCRIPT_ADDRESS)
	const COLLATERAL = lovelace(5_000_000)

	const scriptSpend = () =>
		new TxBuilder()
			.txIn(FUND.input.txHash, 0, FUND.output.amount, ADDRESS)
			.txIn(SCRIPT_UTXO.input.txHash, 1, SCRIPT_UTXO.output.amount, SCRIPT_ADDRESS)
			.txInScript(ALWAYS_SUCCEEDS_V3)
			.txInEmptyRedeemer()
			.txInCollateral(txHash('c'), 0, COLLATERAL, ADDRESS)
			.collateralReturn(ADDRESS, COLLATERAL)
			.txOut(OTHER_ADDRESS, lovelace(6_000_000)) // more than the script input alone holds
			.changeAddress(ADDRESS)

	it('balances script + funding inputs, adds the witness and a matching script_data_hash', async () => {
		await withTx(scriptSpend(), (tx, raw) => {
			expect(tx.body.inputs.map(ref).sort()).toEqual([`${txHash('a')}#0`, `${txHash('b')}#1`])
			expect(sumInputs(tx, [FUND, SCRIPT_UTXO])).toBe(sumOutputs(tx) + fee(tx))
			expect(tx.body.outputs.at(-1)!.address).toBe(ADDRESS)
			// size fee + priceMem/priceStep × placeholder exUnits
			expect(fee(tx)).toBeGreaterThanOrEqual(minFee(raw))
			expect(fee(tx) - minFee(raw)).toBeLessThan(1_000n)

			expect(tx.witness_set.plutus_scripts).toEqual([ALWAYS_SUCCEEDS_V3.slice(2)])
			expect(tx.witness_set.redeemers).toHaveLength(1)
			expect(tx.body.script_data_hash).toBe(recomputeScriptDataHashV3(raw))
		})
	})

	it('puts collateral, total_collateral (≥ fee × collateralPercent) and the collateral return in the body', async () => {
		await withTx(scriptSpend(), tx => {
			expect(tx.body.collateral?.map(ref)).toEqual([`${txHash('c')}#0`])
			expect(tx.body.collateral_return?.address).toBe(ADDRESS)
			const total = BigInt(tx.body.total_collateral!)
			expect(total * 100n).toBeGreaterThanOrEqual(fee(tx) * BigInt(DEFAULT_PROTOCOL_PARAMETERS.collateralPercent))
			expect(BigInt(tx.body.collateral_return!.amount.coin) + total).toBe(5_000_000n)
		})
	})

	it('sets an explicit totalCollateral as given', async () => {
		const builder = payment(new TxBuilder({ isHydra: true }))
			.txInCollateral(txHash('c'), 0, COLLATERAL, ADDRESS)
			.totalCollateral('4000000')
		await withTx(builder, tx => {
			expect(tx.body.total_collateral).toBe('4000000')
		})
	})
})

describe('complete() — errors', () => {
	it.each([
		[
			'no change address outside Hydra',
			() => new TxBuilder().setInputs([FUND]).txOut(OTHER_ADDRESS, lovelace(2_000_000)),
			/Change address is required/
		],
		[
			'inputs cannot cover the outputs',
			() => new TxBuilder().setInputs([SMALL]).txOut(OTHER_ADDRESS, lovelace(5_000_000)).changeAddress(ADDRESS),
			/UTxO Balance Insufficient/
		],
		[
			'collateral holds native assets',
			() => payment().txInCollateral(txHash('c'), 0, [...lovelace(5_000_000), { unit: TOKEN, quantity: '1' }], ADDRESS),
			/Collateral UTxO must contain only lovelace/
		],
		[
			'reference script has an unknown version',
			() => payment().txOutReferenceScript(ALWAYS_SUCCEEDS_V3, 'V4' as never),
			/Unsupported Plutus version: V4/
		],
		[
			'stake certificate uses a payment address',
			() => payment().registerStake(ADDRESS),
			/Invalid reward address for StakeRegistration/
		]
	])('rejects when %s', async (_name, stage, message) => {
		const builder = stage()
		await expect(builder.complete()).rejects.toThrow(message)
		builder.dispose()
	})

	it('logs coin-selection failures when errorLogger is on', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {})
		const builder = new TxBuilder({ errorLogger: true })
			.setInputs([SMALL])
			.txOut(OTHER_ADDRESS, lovelace(5_000_000))
			.changeAddress(ADDRESS)
		await expect(builder.complete()).rejects.toThrow(/UTxO Balance Insufficient/)
		expect(error).toHaveBeenCalledWith('[error][selectUtxosFrom]: ', expect.stringMatching(/UTxO Balance Insufficient/))
		builder.dispose()
	})
})

describe('complete() — fee overrides and logging', () => {
	it('treats setMinFee() as a floor for the balanced fee', async () => {
		await withTx(payment().setMinFee('400000'), tx => {
			expect(fee(tx)).toBe(400_000n)
			expect(sumInputs(tx, [FUND])).toBe(sumOutputs(tx) + fee(tx))
		})
	})

	it('logs the built body when verbose is on', async () => {
		const log = vi.spyOn(console, 'log').mockImplementation(() => {})
		await withTx(payment(new TxBuilder({ verbose: true })), () => {})
		expect(log).toHaveBeenCalledWith('[🛠️][TxBuilder] [Tx]: ', expect.stringContaining('"fee"'))
	})
})

describe('complete() — Hydra mode', () => {
	it('builds an unbalanced blueprint without a change address', async () => {
		const builder = new TxBuilder({ isHydra: true })
			.setInputs([FUND])
			.txOut(OTHER_ADDRESS, lovelace(2_000_000))
			.setFee('0')
		await withTx(builder, tx => {
			expect(tx.body.inputs.map(ref)).toEqual([`${txHash('a')}#0`])
			expect(tx.body.outputs).toHaveLength(1)
			expect(tx.body.fee).toBe('0')
		})
	})
})
