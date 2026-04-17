import { TxBuilder } from '@hydra-sdk/transaction'
import {
	AppWallet,
	DatumUtils,
	Deserializer,
	NETWORK_ID,
	ParserUtils,
	PlutusUtils,
	Resolver,
	SLOT_CONFIG_NETWORK,
	TimeUtils
} from '@hydra-sdk/core'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { getEnvVar } from '../../env'
import { HydraBridge } from '@hydra-sdk/bridge'
import { VALIDATORS } from '../../utils/getValidators'

const WALLET_MNEMONIC = getEnvVar('HYDRA_WALLET_MNEMONIC')
const HYDRA_NODE_URL = getEnvVar('HYDRA_NODE_URL')

const lock = async () => {
	// txlock
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

		console.log('>>> Create txLock')

		const { compiledCode, hash } = VALIDATORS.timeValidator()
		const scriptCborHex = PlutusUtils.applyParamsToScript(compiledCode, [])
		const validatorAddress = PlutusUtils.validatorToAddress(
			{
				scriptCborHex: scriptCborHex,
				type: 'PlutusV3'
			},
			NETWORK_ID.PREPROD
		)
		// Build datum
		const deadline_timestamp = String(Date.now() + 3 * 60 * 1000) // now + 3 minutes

		const datum = DatumUtils.mkConstr(0, [DatumUtils.mkInt(deadline_timestamp)])
		console.log('>>> / datum hex:', datum.to_hex())
		console.log('>>> / datum obj:', datum.to_json(DatumUtils.DatumSchema.Basic))
		// return
		const txBuilder = new TxBuilder()
		const txLock = await txBuilder
			.setInputs(addressUTxO)
			.addOutput({
				address: validatorAddress,
				amount: [{ unit: 'lovelace', quantity: String(5_000_000) }]
			})
			.txOutInlineDatumValue(datum)
			.changeAddress(walletAddress)
			.complete()

		console.log('>>> txLock:', txLock.to_hex())

		const signedCbor = await wallet.signTx(txLock.to_hex())
		console.log('>>> txLock:signed:', signedCbor)

		const rs = await bridge.submitTxSync({
			cborHex: signedCbor,
			description: 'txLock',
			txId: Resolver.resolveTxHash(signedCbor),
			type: 'Witnessed Tx ConwayEra'
		})
		if (rs.isConfirmed) {
			console.log('>>> txLock:confirmed:', rs.txId)
		} else {
			throw new Error(`txLock submission failed: ${rs.txId}`)
		}

		bridge.disconnect()
		process.exit(0)
	} catch (error) {
		console.error('Error creating txLock:', error)
		process.exit(1)
	}
}

lock()
