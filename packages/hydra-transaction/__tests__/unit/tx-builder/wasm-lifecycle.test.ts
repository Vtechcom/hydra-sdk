import { describe, it, expect, vi, afterEach } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { TxBuilder } from '../../../src/tx-builder'
import {
	ADDRESS,
	ALWAYS_SUCCEEDS_V3,
	OTHER_ADDRESS,
	SCRIPT_ADDRESS,
	TOKEN,
	lovelace,
	mockEvaluator,
	txHash,
	txJson,
	utxo
} from '../../helpers/fixtures'

// CSL objects live in WASM memory; wasm-bindgen zeroes `__wbg_ptr` when an object is freed.
type Freeable = { free(): void }
const isFreed = (o: unknown) => (o as { __wbg_ptr: number }).__wbg_ptr === 0

type Internals = {
	_scratch: Freeable[]
	_txBuilder: Freeable
	_metadata: Freeable
	_changeConfig: Freeable | null
	_plutusScripts: Freeable | null
}
const internals = (b: TxBuilder) => b as unknown as Internals

const FUND = utxo(txHash('a'), 0, lovelace(10_000_000))
const payment = (builder = new TxBuilder()) =>
	builder.setInputs([FUND]).txOut(OTHER_ADDRESS, lovelace(2_000_000)).changeAddress(ADDRESS)
const scriptSpend = (builder: TxBuilder) =>
	builder
		.txIn(txHash('b'), 1, lovelace(5_000_000), SCRIPT_ADDRESS)
		.txInScript(ALWAYS_SUCCEEDS_V3)
		.txInEmptyRedeemer()
		.txInCollateral(txHash('c'), 0, lovelace(5_000_000), ADDRESS)
		.txOut(ADDRESS, lovelace(5_000_000))

afterEach(() => {
	vi.restoreAllMocks()
})

describe('transient objects (_scratch)', () => {
	it.each([
		['a plain payment', () => payment()],
		[
			'an evaluated script spend (rebuild pass)',
			() => payment(scriptSpend(new TxBuilder({ evaluator: mockEvaluator({ mem: 1, steps: 1 }).evaluator })))
		],
		[
			'an evaluation that changes nothing',
			() => payment(scriptSpend(new TxBuilder({ evaluator: mockEvaluator({ mem: 1, steps: 1 }, []).evaluator })))
		]
	])('frees every transient object after building %s', async (_name, stage) => {
		const builder = stage()
		const tx = await builder.complete()
		expect(internals(builder)._scratch).toEqual([])
		tx.free()
		builder.dispose()
	})

	it('frees them when build_tx throws', async () => {
		// non-Hydra script-only spend with no fee set: CSL refuses inside build_tx
		const builder = scriptSpend(new TxBuilder()).changeAddress(ADDRESS)
		await expect(builder.complete()).rejects.toThrow(/Fee is not set/)
		expect(internals(builder)._scratch).toEqual([])
		builder.dispose()
	})

	it.fails('frees them when assembly throws before build_tx', async () => {
		const builder = payment().txInCollateral(
			txHash('c'),
			0,
			[...lovelace(5_000_000), { unit: TOKEN, quantity: '1' }],
			ADDRESS
		)
		await expect(builder.complete()).rejects.toThrow(/Collateral UTxO must contain only lovelace/)
		expect(internals(builder)._scratch).toEqual([])
		builder.dispose()
	})

	it.fails('B4: frees the Mint built for the verbose log', async () => {
		const build = vi.spyOn(CardanoWASM.MintBuilder.prototype, 'build')
		const native = '8200581c' + 'b'.repeat(56)
		const script = CardanoWASM.NativeScript.from_hex(native)
		const hash = script.hash()
		const builder = payment().mint('1', hash.to_hex(), 'tok').mintingScript({ type: 'Native', scriptCborHex: native })
		hash.free()
		script.free()

		const tx = await builder.complete()
		tx.free()
		builder.dispose()
		expect(build).toHaveBeenCalled()
		for (const { value } of build.mock.results) expect(isFreed(value)).toBe(true)
	})
})

describe('builder-lifetime objects', () => {
	it('reset() frees the previous WASM state and starts from an empty staging', async () => {
		const builder = scriptSpend(new TxBuilder({ isHydra: true }))
			.metadataValue(1, 'x')
			.changeAddress(ADDRESS)
		const before = { ...internals(builder) }

		builder.reset()
		for (const key of ['_txBuilder', '_metadata', '_changeConfig', '_plutusScripts'] as const) {
			expect(isFreed(before[key]), key).toBe(true)
		}

		const tx = await payment(builder).complete()
		const json = txJson(tx)
		expect(json.body.inputs).toHaveLength(1)
		expect(json.body.outputs[0].address).toBe(OTHER_ADDRESS)
		expect(json.witness_set.redeemers).toBeNull()
		expect(json.body.collateral).toBeNull()
		tx.free()
		builder.dispose()
	})

	it('changeAddress() frees the replaced change config and uses the new address', async () => {
		const builder = payment()
		const first = internals(builder)._changeConfig
		builder.changeAddress(OTHER_ADDRESS)
		expect(isFreed(first)).toBe(true)

		const tx = await builder.complete()
		expect(txJson(tx).body.outputs.at(-1)!.address).toBe(OTHER_ADDRESS)
		tx.free()
		builder.dispose()
	})

	it('updateProtocolParams() frees the replaced TransactionBuilder', () => {
		const builder = new TxBuilder()
		const first = internals(builder)._txBuilder
		builder.updateProtocolParams({ minFeeA: 50 })
		expect(isFreed(first)).toBe(true)
		expect(isFreed(internals(builder)._txBuilder)).toBe(false)
		builder.dispose()
	})

	it('dispose() frees everything once, and Symbol.dispose delegates to it', () => {
		const builder = scriptSpend(new TxBuilder()).changeAddress(ADDRESS)
		const held = { ...internals(builder) }

		builder[Symbol.dispose]()
		for (const key of ['_txBuilder', '_metadata', '_changeConfig', '_plutusScripts'] as const) {
			expect(isFreed(held[key]), key).toBe(true)
		}
		expect(() => builder.dispose()).not.toThrow()
	})
})

describe('completeCbor()', () => {
	it('returns the tx CBOR and frees the Transaction it built', async () => {
		const builder = payment()
		const complete = vi.spyOn(builder, 'complete')

		const hex = await builder.completeCbor()
		const built = await complete.mock.results[0].value
		expect(isFreed(built)).toBe(true)

		const tx = CardanoWASM.Transaction.from_hex(hex)
		expect(txJson(tx).body.outputs[0]).toMatchObject({ address: OTHER_ADDRESS, amount: { coin: '2000000' } })
		tx.free()
		builder.dispose()
	})
})
