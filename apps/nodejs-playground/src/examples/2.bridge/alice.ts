import { HydraBridge, HydraHeadTag, HydraPayload } from '@hydra-sdk/bridge'
import { AppWallet, Deserializer, NETWORK_ID, ProviderUtils, Resolver } from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'
import { BigNumber } from 'bignumber.js'
import * as readline from 'readline'
import { getEnvVar } from '../../env'
import { walletPrimary as testWallet } from '../../__tests__/__mocks__/wallet.json'

const ALICE_NODE_WS = 'wss://node-10022.hydranode.io.vn'

async function main() {
	try {
		console.log(`🔌 Connecting to Hydra Alice node at ${ALICE_NODE_WS}...`)

		// Initialize HydraBridge connection to Alice node
		const bridge = new HydraBridge({
			url: ALICE_NODE_WS
		})

		// Track connection status
		let isConnected = false
		let headStatus = 'Unknown'

		// Set up connection event listeners
		bridge.events.on('onConnected', () => {
			isConnected = true
			console.log('✅ Connected to Hydra Alice node')
		})

		bridge.events.on('onDisconnected', () => {
			isConnected = false
			console.log('❌ Disconnected from Hydra Alice node')
		})

		bridge.events.on('onConnectError', (error: Error) => {
			console.error('⚠️  Bridge error:', error.message)
		})

		bridge.events.on('onMessage', (message: HydraPayload) => {
			const msgStr = JSON.stringify(message)

			if (message.tag === HydraHeadTag.Greetings) {
				headStatus = message.headStatus
			} else if (message.tag === HydraHeadTag.HeadIsOpen) {
				headStatus = 'Open'
			} else if (message.tag === HydraHeadTag.HeadIsClosed) {
				headStatus = 'Closed'
			} else if (message.tag === HydraHeadTag.HeadIsFinalized) {
				headStatus = 'Finalized'
			} else if (message.tag === HydraHeadTag.HeadIsAborted) {
				headStatus = 'Aborted'
			} else if (message.tag === HydraHeadTag.HeadIsInitializing) {
				headStatus = 'Initializing'
			}

			console.log(
				'\n📩 Message from Hydra node:',
				msgStr.length > 30 ? msgStr.slice(0, 30) + '...' + msgStr.slice(-10) : msgStr
			)
		})

		// Connect to the bridge
		await bridge.connect()

		const buildHydraTx = async () => {
			console.log('\n🔨 Building and submitting a Hydra transaction...')
			const wallet = new AppWallet({
				networkId: NETWORK_ID.PREPROD,
				key: {
					type: 'mnemonic',
					words: testWallet.mnemonic.split(' ')
				}
			})
			const baseAddressBech32 = wallet.getAccount().baseAddressBech32
			console.log('\n🏦 Alice Base Address:', baseAddressBech32)
			const utxos = await bridge.queryAddressUTxO(baseAddressBech32)
			const totalLovelace = utxos
				.filter(utxo => utxo.output.amount.some(a => a.unit === 'lovelace'))
				.reduce((sum, utxo) => {
					const lovelaceAmount = utxo.output.amount.find(a => a.unit === 'lovelace')
					return sum + (lovelaceAmount ? parseInt(lovelaceAmount.quantity) : 0)
				}, 0)
			console.log('\n💰 Alice balance:', BigNumber(totalLovelace).dividedBy(1000000).toFormat(), 'tADA')

			const pparams = await bridge.getProtocolParameters()
			const txBuilder = new TxBuilder({
				isHydra: true,
				params: pparams
			})
			const tx = await txBuilder
				.setInputs(utxos)
				.addOutput({
					address: baseAddressBech32,
					amount: [{ unit: 'lovelace', quantity: '3000000' }]
				})
				.setChangeAddress(baseAddressBech32)
				.complete()
			console.log('\n📝 Built Hydra Tx CBOR:', tx.to_hex().slice(0, 50) + '...')
			const signedTx = await wallet.signTx(tx.to_hex())
			console.log('\n✍️  Signed Hydra Tx CBOR:', signedTx.slice(0, 50) + '...')
			const submitResult = await bridge.submitTxSync(
				{
					cborHex: signedTx,
					txId: Resolver.resolveTxHash(signedTx),
					description: 'Hydra Tx from Alice Node',
					type: 'Witnessed Tx ConwayEra'
				},
				{ timeout: 5000 }
			)
			console.log('\n🚀 Submitted Hydra Tx Result:', JSON.stringify(submitResult, null, 1))
		}

		// Create readline interface for console prompt
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		})

		const promptMenu = () => {
			console.log('----------------------------------------------------------------')
			console.log('\n📋 Menu:')
			console.log('1. Connection Status')
			console.log('2. Head Status')
			console.log('3. Build and Submit Transaction')
			console.log('0. Exit\n')

			rl.question('Choose option: ', async choice => {
				console.log('----------------------------------------------------------------')
				switch (choice.trim()) {
					case '1':
						console.log(`\n📊 Connection Status: ${isConnected ? '✅ Connected' : '❌ Disconnected'}`)
						promptMenu()
						break
					case '2':
						console.log(`\n🔄 Head Status: ${headStatus}`)
						promptMenu()
						break
					case '3':
						await buildHydraTx()
						promptMenu()
						break
					case '0':
						console.log('\n👋 Exiting...')
						await bridge.disconnect()
						rl.close()
						process.exit(0)
					default:
						console.log('\n❌ Invalid option. Please try again.')
						promptMenu()
						break
				}
			})
		}

		promptMenu()
	} catch (error) {
		console.error('Error initializing bridge:', error)
		process.exit(1)
	}
}

main()
