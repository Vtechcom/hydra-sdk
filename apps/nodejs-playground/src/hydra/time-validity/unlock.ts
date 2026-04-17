import { buildRedeemer, emptyRedeemer, TxBuilder } from '@hydra-sdk/transaction'
import {
	AppWallet,
	Deserializer,
	ParserUtils,
	NETWORK_ID,
	SLOT_CONFIG_NETWORK,
	TimeUtils,
	ProviderUtils,
	PlutusUtils,
	Resolver,
	DatumUtils
} from '@hydra-sdk/core'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { getEnvVar } from '../../env'
import { HydraBridge } from '@hydra-sdk/bridge'
import { VALIDATORS } from '../../utils/getValidators'

const WALLET_MNEMONIC = getEnvVar('HYDRA_WALLET_MNEMONIC')
const HYDRA_NODE_URL = getEnvVar('HYDRA_NODE_URL')

export const unlock = async (txHash: `${string}#${number}`) => {
	console.log('>>> Create txUnlock: ', txHash)
	try {
		const wallet = new AppWallet({
			networkId: NETWORK_ID.PREPROD,
			key: {
				type: 'mnemonic',
				words: WALLET_MNEMONIC.split(' ')
			}
		})
		const walletAddress = await wallet.getPaymentAddress()
		const account = wallet.getAccount()
		console.log('>>> account.signer_hash:', CardanoWASM.Ed25519Signature.from_hex(account.paymentKeyHex).to_hex())

		console.log('>>> Query UTxO: ', walletAddress)
		const bridge = new HydraBridge({ url: HYDRA_NODE_URL })
		await bridge.connect()
		const addressUTxO = await bridge.queryAddressUTxO(walletAddress)
		console.log('>>> Query UTxO: ', walletAddress, addressUTxO.length, 'UTxOs found')

		// get collateral utxo of address
		const collateral = addressUTxO.find(
			u =>
				u.output.amount.length === 1 &&
				u.output.amount[0].unit === 'lovelace' &&
				Number(u.output.amount[0].quantity) === 5_000_000
		)

		if (!collateral) {
			throw new Error('No collateral UTxO found')
		}

		const { compiledCode, hash } = VALIDATORS.timeValidator()
		const scriptCborHex = PlutusUtils.applyParamsToScript(compiledCode, [])
		const validatorAddress = PlutusUtils.validatorToAddress(
			{
				scriptCborHex: scriptCborHex,
				type: 'PlutusV3'
			},
			NETWORK_ID.PREPROD
		)
		console.log('>>> Query UTxO: ', validatorAddress)
		const contractUTxO = await bridge.queryAddressUTxO(validatorAddress)
		const scriptUTxO = contractUTxO.find(u => `${u.input.txHash}#${u.input.outputIndex}` === txHash)
		if (!scriptUTxO) {
			throw new Error('No script UTxO found for txHash')
		} else {
			console.log('>>> Script UTxO found: ', scriptUTxO.input, scriptUTxO.output.amount)
			console.log('>>> Script UTxO datum: ', scriptUTxO.output.inlineDatum?.to_json(DatumUtils.DatumSchema.Basic))
		}

		// Timing
		const slotZeroTimestamp = bridge.slotZeroTimestamp || 0
		console.log('>>> slotZeroTimestamp:', slotZeroTimestamp, new Date(slotZeroTimestamp).toISOString())
		const slotConfig = TimeUtils.buildHydraSlotConfig(slotZeroTimestamp)

		const currentSlot = TimeUtils.unixTimeToEnclosingSlot(Date.now(), slotConfig)
		console.log('>>> currentSlot:', currentSlot)

		// Build txUnlock
		const txBuilder = new TxBuilder({
			// verbose: true,
			isHydra: true,
			errorLogger: true,
			params: {
				minFeeA: 0,
				minFeeB: 0
			}
		})
		const txUnlock = await txBuilder
			.setInputs(
				addressUTxO.filter(
					u => `${u.input.txHash}#${u.input.outputIndex}` !== `${collateral.input.txHash}#${collateral.input.outputIndex}`
				) // exclude collateralUTxO
			)
			.txIn(
				scriptUTxO.input.txHash,
				scriptUTxO.input.outputIndex, //
				scriptUTxO.output.amount,
				scriptUTxO.output.address
			)
			.txInScript(scriptCborHex, 'V3')
			.txInInlineDatum(scriptUTxO.output.inlineDatum!)
			.txInRedeemerValue(emptyRedeemer({ type: 'int', exUnits: { mem: '100000', steps: '25000000' } }))
			.txInCollateral(
				collateral.input.txHash,
				collateral.input.outputIndex,
				collateral.output.amount, //
				collateral.output.address
			)
			.addOutput({
				address: walletAddress,
				amount: scriptUTxO.output.amount // send all assets back to myself
			})
			.changeAddress(walletAddress)
			.invalidBefore(TimeUtils.unixTimeToEnclosingSlot(Date.now(), slotConfig)) // must be after current slot
			.invalidAfter(TimeUtils.unixTimeToEnclosingSlot(Date.now() + 1 * 60 * 1000, slotConfig)) // must be within 3 minutes

		const tx = await txUnlock.complete()

		console.log('>>> txUnlock:', tx.to_hex())

		const signedCbor = await wallet.signTx(tx.to_hex())
		console.log('>>> txUnlock:signed:', signedCbor)

		const rs = await bridge.submitTxSync({
			cborHex: signedCbor,
			description: 'txUnlock',
			txId: Resolver.resolveTxHash(signedCbor),
			type: 'Witnessed Tx ConwayEra'
		})
		if (rs.isConfirmed) {
			console.log('>>> txUnlock:confirmed:', rs.txId)
		} else {
			throw new Error(`txUnlock submission failed: ${rs.txId}`)
		}

		bridge.disconnect()
		process.exit(0)
	} catch (error) {
		console.error('Error creating txUnlock:', error)
		process.exit(1)
	}
}

// unlock
// run command: npx tsx src/hydra/time-validity/unlock.ts <txHash#index>
// example: npx tsx src/hydra/time-validity/unlock.ts c0fd0d0f09ab82f1617a859274e05d83bfe88cbc41da1e436ac780f394fc98d8#0

if (process.argv[2] && process.argv[2].includes('#')) {
	unlock(process.argv[2] as `${string}#${number}`)
}
