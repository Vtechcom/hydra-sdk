import { describe, it, expect, beforeEach } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { TxBuilder } from '../../../src/tx-builder'
import type { UTxO } from '@hydra-sdk/core'

const testAddress =
	'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
const testRewardAddress = 'stake_test1uqfu74w3wh4gfzu8m6e7j987h4lq9r3t7ef5gaw497uu85qsqfy27'
const testPoolKeyHash = 'a'.repeat(56)
const testTxHash = 'a'.repeat(64)

const createTestUtxo = (lovelace: string): UTxO => ({
	input: { txHash: testTxHash, outputIndex: 0 },
	output: { address: testAddress, amount: [{ unit: 'lovelace', quantity: lovelace }] }
})

const baseBuild = (builder: TxBuilder) =>
	builder
		.setInputs([createTestUtxo('10000000')])
		.txOut(testAddress, [{ unit: 'lovelace', quantity: '1000000' }])
		.changeAddress(testAddress)

describe('TxBuilder - Certificates (applied to tx body)', () => {
	let builder: TxBuilder

	beforeEach(() => {
		builder = new TxBuilder({ isHydra: true })
	})

	it('should attach a stake registration certificate to the built tx', async () => {
		baseBuild(builder).registerStake(testRewardAddress)
		const tx = await builder.complete()

		const certs = tx.body().certs()
		expect(certs).toBeDefined()
		expect(certs!.len()).toBe(1)
	})

	it('should attach a stake deregistration certificate', async () => {
		baseBuild(builder).deregisterStake(testRewardAddress)
		const tx = await builder.complete()

		expect(tx.body().certs()?.len()).toBe(1)
	})

	it('should attach a stake delegation certificate', async () => {
		baseBuild(builder).delegateStake(testRewardAddress, testPoolKeyHash)
		const tx = await builder.complete()

		expect(tx.body().certs()?.len()).toBe(1)
	})

	it('should attach register + delegate as two certificates in one tx', async () => {
		baseBuild(builder).registerStake(testRewardAddress).delegateStake(testRewardAddress, testPoolKeyHash)
		const tx = await builder.complete()

		expect(tx.body().certs()?.len()).toBe(2)
	})

	it('should not attach a certs entry when none are staged', async () => {
		baseBuild(builder)
		const tx = await builder.complete()

		expect(tx.body().certs()).toBeUndefined()
	})

	it('should reject a certificate built from a non-reward (payment) address', async () => {
		// A payment address is not a valid reward address for a stake certificate.
		baseBuild(builder).registerStake(testAddress)
		await expect(builder.complete()).rejects.toThrow('Invalid reward address')
	})
})

describe('TxBuilder - totalCollateral (applied to tx body)', () => {
	let builder: TxBuilder

	beforeEach(() => {
		builder = new TxBuilder({ isHydra: true })
	})

	it('should set total_collateral on the built tx', async () => {
		baseBuild(builder)
			.txInCollateral('b'.repeat(64), 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)
			.totalCollateral('5000000')

		const tx = await builder.complete()
		expect(tx.body().total_collateral()?.to_str()).toBe('5000000')
	})

	it('should leave total_collateral unset when not provided', async () => {
		baseBuild(builder).txInCollateral('b'.repeat(64), 0, [{ unit: 'lovelace', quantity: '5000000' }], testAddress)

		const tx = await builder.complete()
		expect(tx.body().total_collateral()).toBeUndefined()
	})
})

describe('TxBuilder - dispose / completeCbor', () => {
	it('completeCbor should return a deserializable hex string', async () => {
		const builder = new TxBuilder({ isHydra: true })
		baseBuild(builder)

		const hex = await builder.completeCbor()
		expect(typeof hex).toBe('string')
		expect(CardanoWASM.Transaction.from_hex(hex)).toBeDefined()

		builder.dispose()
	})

	it('dispose should be idempotent', () => {
		const builder = new TxBuilder({ isHydra: true })
		builder.dispose()
		expect(() => builder.dispose()).not.toThrow()
	})
})
