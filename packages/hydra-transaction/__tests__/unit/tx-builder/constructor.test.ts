import { describe, it, expect } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { DEFAULT_PROTOCOL_PARAMETERS, type Asset } from '@hydra-sdk/core'
import { TxBuilder } from '../../../src/tx-builder'
import {
	ADDRESS,
	ALWAYS_SUCCEEDS_V3,
	OTHER_ADDRESS,
	POLICY_ID,
	SCRIPT_ADDRESS,
	TOKEN,
	fee,
	lovelace,
	txHash,
	utxo,
	withTx
} from '../../helpers/fixtures'

const FUND = utxo(txHash('a'), 0, lovelace(10_000_000))
const payment = (builder: TxBuilder) =>
	builder.setInputs([FUND]).txOut(OTHER_ADDRESS, lovelace(2_000_000)).changeAddress(ADDRESS)
const scriptSpend = (builder: TxBuilder) =>
	payment(builder)
		.txIn(txHash('b'), 1, lovelace(5_000_000), SCRIPT_ADDRESS)
		.txInScript(ALWAYS_SUCCEEDS_V3)
		.txInEmptyRedeemer()
		.txInCollateral(txHash('c'), 0, lovelace(5_000_000), ADDRESS)
const feeOf = (builder: TxBuilder) => withTx(builder, tx => fee(tx))

describe('protocol parameters', () => {
	const bump = { minFeeB: DEFAULT_PROTOCOL_PARAMETERS.minFeeB + 100_000 }

	it.each([
		['constructor params', () => new TxBuilder({ params: bump })],
		['updateProtocolParams()', () => new TxBuilder().updateProtocolParams(bump)]
	])('merges %s over the defaults and prices the fee with them', async (_name, make) => {
		const base = await feeOf(payment(new TxBuilder()))
		expect((await feeOf(payment(make()))) - base).toBe(100_000n)
	})

	it('charges script execution at priceMem/priceStep', async () => {
		const priced = await feeOf(scriptSpend(new TxBuilder()))
		const free = await feeOf(scriptSpend(new TxBuilder({ params: { priceMem: 0, priceStep: 0 } })))
		// placeholder exUnits 100000 mem / 10000000 steps: 100000·0.0577 + 10000000·0.0000721 = 5770 + 721
		expect(priced - free).toBe(6491n)
	})

	it('calculateFee() is a zero placeholder', () => {
		const builder = new TxBuilder()
		const zero = builder.calculateFee()
		expect(zero.to_str()).toBe('0')
		zero.free()
		builder.dispose()
	})
})

describe('minAda / minAdaForAssets', () => {
	const minAdaOf = (assets: Asset[]) => {
		const value = TxBuilder.minAdaForAssets(assets)
		try {
			return BigInt(value.to_str())
		} finally {
			value.free()
		}
	}

	it('follows the Babbage rule (160 + output bytes) × coinsPerUtxoSize', () => {
		const address = CardanoWASM.Address.from_bech32(ADDRESS)
		const coin = CardanoWASM.BigNum.from_str('1000000')
		const value = CardanoWASM.Value.new(coin)
		const output = CardanoWASM.TransactionOutput.new(address, value)
		const size = BigInt(output.to_bytes().length)

		for (const coinsPerUtxoSize of [DEFAULT_PROTOCOL_PARAMETERS.coinsPerUtxoSize, 5000]) {
			const min = TxBuilder.minAda(output, { ...DEFAULT_PROTOCOL_PARAMETERS, coinsPerUtxoSize })
			expect(BigInt(min.to_str())).toBe((160n + size) * BigInt(coinsPerUtxoSize))
			min.free()
		}
		;[output, value, coin, address].forEach(o => o.free())
	})

	it('aggregates repeated units before sizing the output', () => {
		expect(
			minAdaOf([
				{ unit: TOKEN, quantity: '1000' },
				{ unit: TOKEN, quantity: '500' }
			])
		).toBe(minAdaOf([{ unit: TOKEN, quantity: '1500' }]))
	})

	it('grows with every extra asset', () => {
		const one = minAdaOf([{ unit: TOKEN, quantity: '1' }])
		const samePolicy = minAdaOf([
			{ unit: TOKEN, quantity: '1' },
			{ unit: `${POLICY_ID}746f6b656e32`, quantity: '1' }
		])
		const twoPolicies = minAdaOf([
			{ unit: TOKEN, quantity: '1' },
			{ unit: `${'b'.repeat(56)}746f6b656e32`, quantity: '1' }
		])
		expect(one).toBeGreaterThan(0n)
		expect(samePolicy).toBeGreaterThan(one)
		expect(twoPolicies).toBeGreaterThan(samePolicy)
	})
})
