<script lang="ts" setup>
	import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'
	import { HydraBridge, HexcoreConnector } from '@hydra-sdk/bridge'
	import { TxBuilder } from '@hydra-sdk/transaction'
	import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

	const hydraBridge = ref<HydraBridge | null>(null)
	const { walletConfig } = useWalletConfig()

	onMounted(async () => {
		hydraBridge.value = new HydraBridge({
			connector: new HexcoreConnector('https://game-flappybird-api.hydrawallet.app', {
				socketIoOptions: {}
			})
		})
		hydraBridge.value.connect()
		// hydraBridge.value.events.on('onConnected', () => {
		// 	console.log('Hydra Bridge connected')
		// })
	})

	onBeforeUnmount(() => {})

	async function sendTx() {
		if (!walletConfig.value.mnemonic) {
			console.error('wallet configuration is not set.')
			return
		}

		const wallet = new AppWallet({
			key: {
				type: 'mnemonic',
				words: walletConfig.value.mnemonic.split(' ')
			},
			networkId: walletConfig.value.network
		})
		const account = wallet.getAccount(0, 0)

		const utxos = await hydraBridge.value!.queryAddressUTxO('addr_test1qqgagp6hm64jsxphelk494rpwysrkk8gzlhn8cnaueqqsqmfksxjux7q5ulgtfe9f40zt2sz0w4rw9t06kft8qa0w2cqxzut0c')
		utxos.forEach(utxo => {
			console.log('UTxO:', utxo)
			if (utxo.output.inlineDatum) {
				console.log('Inline Datum:', utxo.output.inlineDatum.to_json(CardanoWASM.PlutusDatumSchema.BasicConversions))
				console.log('Inline Datum:', utxo.output.inlineDatum.to_json(CardanoWASM.PlutusDatumSchema.DetailedSchema))
			}
		})
	}
</script>

<template>
	<el-card>
		<p class="">Hydra Bridge</p>
		<el-button @click="sendTx">SEND TX</el-button>
	</el-card>
</template>

<style lang="scss" scoped></style>
