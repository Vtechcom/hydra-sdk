import { describe } from 'vitest'
import * as PlutusUtils from '../../../src/utils/plutus-script.util'
import * as DatumUtils from '../../../src/utils/datum'
import { SpendingValidator } from '../../../src/types/cardano/plutus-script'

describe('plutus script utilities', () => {
	const plutusScript =
		'5901a2010100229800aba2aba1aba0aab9faab9eaab9dab9a488888896600264653001300800198041804800cdc3a400130080024888966002600460106ea800e266446644b300130060018acc004c034dd5004400a2c80722b300130030018acc004c034dd5004400a2c80722c805900b099192cc004c04400626464b30013008300e3754015159800980418071baa32330010013758602600a44b30010018a6103d87a80008992cc004cdd7980a98091baa001018899ba548000cc0500052f5c113300300330160024040602800280922b30013371e6eb8c03800922010089802800c528201a8b201a899b870014800500d1bad300e00130100018b201c3259800980198061baa0018a5eb7bdb18226eacc040c034dd5000a016323300100137566020602260226022602200444b30010018a60103d87a8000899192cc004cdc8803800c56600266e3c01c006266e9520003301230100024bd7045300103d87a80004039133004004301400340386eb8c038004c04400500f18059baa003300a375400c6eb8c030c024dd50019b874800a2c8038601000260066ea802229344d95900101'
	const params = [
		DatumUtils.mkConstr(0, [
			DatumUtils.mkConstr(0, [DatumUtils.mkBytes('ad773d3065356ed8ffa006f9770b716f97c0f41a259be24672d089f292735126')]),
			DatumUtils.mkInt(2) //
		]).to_bytes()
	]
	const expectedAppliedScript =
		'5901d55901d20101003229800aba2aba1aba0aab9faab9eaab9dab9a488888896600264653001300800198041804800cdc3a400130080024888966002600460106ea800e266446644b300130060018acc004c034dd5004400a2c80722b300130030018acc004c034dd5004400a2c80722c805900b099192cc004c04400626464b30013008300e3754015159800980418071baa32330010013758602600a44b30010018a60103d87a80008992cc004cdd7980a98091baa001018899ba548000cc0500052f5c113300300330160024040602800280922b30013371e6eb8c03800922010089802800c528201a8b201a899b870014800500d1bad300e00130100018b201c3259800980198061baa0018a5eb7bdb18226eacc040c034dd5000a016323300100137566020602260226022602200444b30010018a60103d87a8000899192cc004cdc8803800c56600266e3c01c006266e9520003301230100024bd7045300103d87a80004039133004004301400340386eb8c038004c04400500f18059baa003300a375400c6eb8c030c024dd50019b874800a2c8038601000260066ea802229344d95900113012bd8799fd8799f5820ad773d3065356ed8ffa006f9770b716f97c0f41a259be24672d089f292735126ff02ff0001'
	const expectedScriptHash = 'aeeca3f0679f758248745affcd72d298294aa0488eb4f327d8f86028'
	const expectedAddress = 'addr_test1wzhweglsv70htqjgw3d0lntj62vzjj4qfz8tfue8mruxq2qds8h40'
	describe('Apply Params To Script', () => {
		it('should apply parameters to the plutus script correctly', () => {
			const appliedScript = PlutusUtils.applyParamsToScript(plutusScript, params)
			expect(appliedScript).toBe(expectedAppliedScript)
		})
	})

	describe('Minting Policy To Id', () => {
		it('should convert minting policy script to script hash correctly', () => {
			const mintingPolicy = {
				type: 'PlutusV3',
				scriptCborHex: expectedAppliedScript
			} as SpendingValidator
			const scriptHash = PlutusUtils.mintingPolicyToId(mintingPolicy)
			expect(scriptHash).toBe(expectedScriptHash)
		})
	})

	describe('Validator To Script Hash', () => {
		it('should convert validator script to script hash correctly', () => {
			const validator: SpendingValidator = {
				type: 'PlutusV3',
				scriptCborHex: expectedAppliedScript
			}
			const scriptHash = PlutusUtils.validatorToScriptHash(validator)
			expect(scriptHash).toBe(expectedScriptHash)
		})
	})

	describe('Validator To Address', () => {
		it('should convert validator script to address correctly', () => {
			const validator: SpendingValidator = {
				type: 'PlutusV3',
				scriptCborHex: expectedAppliedScript
			}
			const networkId = 0 // Testnet
			const address = PlutusUtils.validatorToAddress(validator, networkId)
			expect(address).toBe(expectedAddress)
		})
	})
})
