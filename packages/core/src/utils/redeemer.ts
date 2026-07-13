import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

/**
 * Redeemer purpose (script tag). Accepts lower- or upper-case forms.
 */
export type RedeemerTagType = 'spend' | 'mint' | 'reward' | 'cert' | 'vote' | 'voting_proposal'
export type AnyRedeemerTag = RedeemerTagType | Uppercase<RedeemerTagType>

/**
 * Execution-unit budget for a redeemer. Values accept string/number/bigint.
 */
export type ExUnitsInput = {
	mem: string | number | bigint
	steps: string | number | bigint
}

export type BuildRedeemerOptions = {
	/** Script purpose, default `spend`. */
	tag?: AnyRedeemerTag
	/** Redeemer pointer index (input/mint index), default `0`. */
	index?: string | number | bigint
	/** Execution-unit budget, default {@link DEFAULT_EX_UNITS}. */
	exUnits?: ExUnitsInput
}

/**
 * Placeholder execution-unit budget used when none is supplied.
 *
 * These are NOT accurate for any particular script — for production transactions
 * you should evaluate the script (e.g. via Ogmios / the node) and pass real
 * `exUnits`. Plutus V3 per-tx maximums are ~14,000,000 mem and 10,000,000,000 steps.
 */
export const DEFAULT_EX_UNITS: ExUnitsInput = { mem: '5000000', steps: '2000000000' }

/**
 * Build a {@link CardanoWASM.ExUnits} from a plain `{ mem, steps }` object.
 */
export const mkExUnits = (exUnits: ExUnitsInput = DEFAULT_EX_UNITS): CardanoWASM.ExUnits =>
	CardanoWASM.ExUnits.new(
		CardanoWASM.BigNum.from_str(String(exUnits.mem)),
		CardanoWASM.BigNum.from_str(String(exUnits.steps))
	)

/**
 * Resolve a script-purpose string to a {@link CardanoWASM.RedeemerTag}.
 * Case-insensitive: both `'spend'` and `'SPEND'` are accepted.
 */
export const mkRedeemerTag = (tag: AnyRedeemerTag = 'spend'): CardanoWASM.RedeemerTag => {
	switch (tag.toLowerCase() as RedeemerTagType) {
		case 'spend':
			return CardanoWASM.RedeemerTag.new_spend()
		case 'mint':
			return CardanoWASM.RedeemerTag.new_mint()
		case 'reward':
			return CardanoWASM.RedeemerTag.new_reward()
		case 'cert':
			return CardanoWASM.RedeemerTag.new_cert()
		case 'vote':
			return CardanoWASM.RedeemerTag.new_vote()
		case 'voting_proposal':
			return CardanoWASM.RedeemerTag.new_voting_proposal()
		default:
			throw new Error(`mkRedeemerTag: unknown redeemer tag "${tag}"`)
	}
}

/**
 * Wrap an arbitrary {@link CardanoWASM.PlutusData} (e.g. built with `DatumUtils`)
 * into a {@link CardanoWASM.Redeemer} ready to attach to a `TxBuilder` input/mint.
 *
 * @example
 * const data = DatumUtils.mkConstr(1, []) // e.g. a `Cancel` redeemer
 * const redeemer = RedeemerUtils.mkRedeemer(data, { tag: 'spend', index: 0 })
 */
export const mkRedeemer = (data: CardanoWASM.PlutusData, options?: BuildRedeemerOptions): CardanoWASM.Redeemer =>
	CardanoWASM.Redeemer.new(
		mkRedeemerTag(options?.tag ?? 'spend'),
		CardanoWASM.BigNum.from_str(String(options?.index ?? 0)),
		data,
		mkExUnits(options?.exUnits ?? DEFAULT_EX_UNITS)
	)

/** Convenience for a `spend` redeemer. See {@link mkRedeemer}. */
export const mkSpendRedeemer = (
	data: CardanoWASM.PlutusData,
	options?: Omit<BuildRedeemerOptions, 'tag'>
): CardanoWASM.Redeemer => mkRedeemer(data, { ...options, tag: 'spend' })

/** Convenience for a `mint` redeemer. See {@link mkRedeemer}. */
export const mkMintRedeemer = (
	data: CardanoWASM.PlutusData,
	options?: Omit<BuildRedeemerOptions, 'tag'>
): CardanoWASM.Redeemer => mkRedeemer(data, { ...options, tag: 'mint' })

/**
 * Build a redeemer carrying the Unit value `Constr(0, [])` — the common
 * "no argument" redeemer for validators that ignore their redeemer.
 */
export const mkUnitRedeemer = (options?: BuildRedeemerOptions): CardanoWASM.Redeemer =>
	mkRedeemer(CardanoWASM.PlutusData.new_empty_constr_plutus_data(CardanoWASM.BigNum.zero()), options)
