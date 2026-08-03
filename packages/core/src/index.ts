import type { CardanoWASM } from '@hydra-sdk/cardano-wasm'

export * from './embedded'
export * from './wallet'
export * from './cardanocli-wallet'
export * from './constants'

export * from './types/wallet'
export * from './types/wallet/fetcher'
export * from './types/wallet/submitter'
export * from './types/cardano'
export * from './types/protocol'

export * from './utils/parser'

// Export as Utilities
import * as Serializer from './utils/cardano-wasm/serializer'
import * as Deserializer from './utils/cardano-wasm/deserializer'
import * as Resolver from './utils/cardano-wasm/resolver'
import * as Converter from './utils/cardano-wasm/converter'
import * as BuildKeys from './utils/cardano-wasm/build-keys'
import * as CostModelsImpl from './utils/cost-models'
import * as TimeUtils from './utils/time'
import * as DatumUtils from './utils/datum'
import * as PolicyUtils from './utils/policy'
import * as ProviderUtils from './utils/providers'
import * as ParserUtils from './utils/parser'
import * as ValidationUtils from './utils/validation'
/** @deprecated Use `AddressUtils.isValidAddress` / `ValidationUtils.isValidTxOutput` instead. */
import * as ValidatorUtils from './utils/validator.util'
import * as MetadataUtils from './utils/metadata'
import * as KeysUtils from './utils/keys.util'
import * as PlutusUtils from './utils/plutus-script.util'
import * as AddressUtils from './utils/address'
import * as RedeemerUtils from './utils/redeemer'

/**
 * Mirrors the `cost-models` module, except that `defaultCostModels` is a getter
 * rather than a module-level constant: building it eagerly would run WASM while
 * `@hydra-sdk/core` is still being imported, which races the bundler's async
 * WASM instantiation. Consumers keep using `CostModels.defaultCostModels`.
 */
const CostModels: {
	buildCostModels: typeof CostModelsImpl.buildCostModels
	readonly defaultCostModels: CardanoWASM.Costmdls
} = {
	buildCostModels: CostModelsImpl.buildCostModels,
	get defaultCostModels() {
		return CostModelsImpl.getDefaultCostModels()
	}
}

export {
	// CardanoWASM Utilities
	Serializer,
	Deserializer,
	Resolver,
	Converter,
	BuildKeys,
	CostModels,
	// Utilities
	ParserUtils,
	TimeUtils,
	DatumUtils,
	PolicyUtils,
	ProviderUtils,
	ValidationUtils,
	// @deprecated kept for backward compatibility — prefer AddressUtils.isValidAddress / ValidationUtils.isValidTxOutput
	ValidatorUtils,
	MetadataUtils,
	KeysUtils,
	PlutusUtils,
	AddressUtils,
	RedeemerUtils
}
