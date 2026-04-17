import plutus from '../../plutus.json'

type ValidatorType = 'spend' | 'mint' | 'else'

/**
 * Look up a compiled validator from onchain/plutus.json.
 *
 * Title format: "<module>.<validator>.<type>"
 * Examples:
 *   getValidator('pool_validator', 'pool_validator', 'spend')
 *   getValidator('pool_nft_policy', 'pool_nft_policy', 'mint')
 */
export function getValidator(
	module: string,
	validator: string,
	type: ValidatorType = 'spend'
): { compiledCode: string; hash: string } {
	const title = `${module}.${validator}.${type}`
	const entry = (plutus.validators as { title: string; compiledCode: string; hash: string }[]).find(
		v => v.title === title
	)
	if (!entry) throw new Error(`Validator not found in plutus.json: ${title}`)
	return { compiledCode: entry.compiledCode, hash: entry.hash }
}

/** Convenience: all compiled codes keyed by short name */
export const VALIDATORS = {
	timeValidator: () => getValidator('time_valid', 'time_validator', 'spend')
}
