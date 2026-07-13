/**
 * @deprecated This module is retained only for backward compatibility and to avoid
 * confusion with Plutus **validator scripts** (see `plutus-script.util`). The functions
 * have moved to their related utilities:
 * - `isValidAddress` → `AddressUtils` (`utils/address`)
 * - `isValidTxOutput` → `ValidationUtils` (`utils/validation`)
 */

/** @deprecated Use `AddressUtils.isValidAddress` (`utils/address`) instead. */
export { isValidAddress } from './address'

/** @deprecated Use `ValidationUtils.isValidTxOutput` (`utils/validation`) instead. */
export { isValidTxOutput } from './validation'
