<script lang="ts" setup>
	import { AppWallet } from '@hydra-sdk/core'

	const { walletConfig } = useWalletConfig()
	const wallet = ref<AppWallet | null>(null)
	const walletAccount = ref({
		baseAddressBech32: '',
		paymentKeyHex: '',
		stakeKeyHex: ''
	})

	watch(
		walletConfig,
		newConfig => {
			if (newConfig.mnemonic) {
				wallet.value = new AppWallet({
					key: {
						type: 'mnemonic',
						words: newConfig.mnemonic.split(' ')
					},
					networkId: newConfig.network
				})
			} else {
				wallet.value = null
			}
		},
		{ deep: true, immediate: true }
	)

	watch(
		wallet,
		newWallet => {
			if (newWallet) {
				walletAccount.value = {
					baseAddressBech32: newWallet.getAccount(0, 0).baseAddressBech32,
					paymentKeyHex: newWallet.getAccount(0, 0).paymentKeyHex,
					stakeKeyHex: newWallet.getAccount(0, 0).stakeKeyHex
				}
				init()
			}
		},
		{ immediate: true }
	)

	const blockfrostApi = useBlockfrostApi()
	async function init() {
		if (walletAccount.value) {
			// Initialize your component or fetch data here
			const rs = await blockfrostApi.get(`/addresses/${walletAccount.value.baseAddressBech32}/utxos`)
			console.log('>>> / rs:', rs)
		}
	}
</script>

<template>
	<el-card class="w-[300px]">
		<p class="mb-4">Cardano mainchain</p>
		<div v-if="wallet">
			<p>Wallet Address: {{ wallet.getAccount(0, 0).baseAddressBech32 }}</p>
		</div>
		<div v-else>
			<p>No wallet connected</p>
		</div>
	</el-card>
</template>

<style lang="scss" scoped></style>
