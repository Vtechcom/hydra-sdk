import { describe, it, expect, vi, afterEach, afterAll } from 'vitest'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { TxBuilder } from '../../../src/tx-builder'
import { emptyRedeemer } from '../../../src/utils/redeemer-builder'
import { ADDRESS, ALWAYS_SUCCEEDS_V3, lovelace, txHash } from '../../helpers/fixtures'

// Staging calls that attach to "the last input/output/mint" must refuse when there is none, and
// datum kinds are mutually exclusive. Everything else about staging is checked on the built tx.

// Caller-owned: the builder never frees it, so one instance serves every row.
const DATUM = CardanoWASM.PlutusData.new_integer(CardanoWASM.BigInt.from_str('42'))
const REDEEMER = emptyRedeemer()
const datum = () => DATUM
const builders: TxBuilder[] = []
const fresh = (options = {}) => {
	const builder = new TxBuilder(options)
	builders.push(builder)
	return builder
}
const withInput = () => fresh().txIn(txHash('a'), 0, lovelace(5_000_000), ADDRESS)
const withOutput = () => fresh().txOut(ADDRESS, lovelace(2_000_000))

afterEach(() => {
	vi.restoreAllMocks()
	builders.splice(0).forEach(b => b.dispose())
})

afterAll(() => {
	DATUM.free()
	REDEEMER.free()
})

describe('TxBuilder staging guards', () => {
	it.each([
		['txInInlineDatum without input', () => fresh().txInInlineDatum(datum()), /No input to attach inline datum to/],
		[
			'txInInlineDatum after txInDatumHash',
			() => withInput().txInDatumHash(datum()).txInInlineDatum(datum()),
			/Cannot use both inlineDatum and datumHash/
		],
		['txInDatumHash without input', () => fresh().txInDatumHash(datum()), /No input to attach datum hash to/],
		[
			'txInDatumHash after txInInlineDatum',
			() => withInput().txInInlineDatum(datum()).txInDatumHash(datum()),
			/Cannot use both inlineDatum and datumHash/
		],
		['txInRedeemerValue without input', () => fresh().txInRedeemerValue(REDEEMER), /No input to attach redeemer to/],
		['txInEmptyRedeemer without input', () => fresh().txInEmptyRedeemer(), /No input to attach redeemer to/],
		['txInScript without input', () => fresh().txInScript(ALWAYS_SUCCEEDS_V3), /No input to attach script to/],
		[
			'spendingPlutusScript without input',
			() => fresh().spendingPlutusScript('V3'),
			/No input to set script version for/
		],
		['spendingPlutusScript without script', () => withInput().spendingPlutusScript('V3'), /No script attached to input/],
		[
			'txOutInlineDatumValue without output',
			() => fresh().txOutInlineDatumValue(datum()),
			/No output to attach datum to/
		],
		[
			'txOutInlineDatumValue after txOutDatumHashValue',
			() => withOutput().txOutDatumHashValue(datum()).txOutInlineDatumValue(datum()),
			/datumHash already set/
		],
		['txOutDatumHashValue without output', () => fresh().txOutDatumHashValue(datum()), /No output to attach datum to/],
		[
			'txOutDatumHashValue after txOutInlineDatumValue',
			() => withOutput().txOutInlineDatumValue(datum()).txOutDatumHashValue(datum()),
			/inlineDatum already set/
		],
		[
			'txOutReferenceScript without output',
			() => fresh().txOutReferenceScript(ALWAYS_SUCCEEDS_V3),
			/No output to attach script to/
		],
		[
			'mintingScript without mint',
			() => fresh().mintingScript({ type: 'PlutusV3', scriptCborHex: ALWAYS_SUCCEEDS_V3 }),
			/No mint to attach script to/
		],
		['mintRedeemerValue without mint', () => fresh().mintRedeemerValue(REDEEMER), /No mint to attach redeemer to/],
		['metadataValue with a non-numeric label', () => fresh().metadataValue('label', 'x'), /Failed to add metadata/],
		[
			'metadataValue with a text over 64 bytes',
			() => fresh().metadataValue(674, 'x'.repeat(65)),
			/Failed to add metadata/
		],
		['txHex before complete()', () => fresh().txHex, /Call complete\(\) first/]
	])('rejects %s', (_name, stage, message) => {
		expect(stage).toThrow(message)
	})

	it('logs the metadata error when verbose is on', () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {})
		expect(() => fresh({ verbose: true }).metadataValue(674, 'x'.repeat(65))).toThrow(/Failed to add metadata/)
		expect(error).toHaveBeenCalledWith('[🛠️][TxBuilder] [metadataValue] Error: ', expect.stringMatching(/64/))
	})
})
