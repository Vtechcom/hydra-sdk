<script lang="ts" setup>
	import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'
	import { useCopy } from '~/composables/useCopy'
	import { formatId } from '~/composables/useFormat'

	const wallet = ref<AppWallet | null>(null)
	const walletAccount = ref({
		baseAddressBech32: '',
		paymentKeyHex: '',
		stakeKeyHex: ''
	}) // Updated to use an empty string
	const { walletConfig } = useWalletConfig()

	const configuration = useLocalStorage<{
		mnemonic: string
		network: number
	}>('walletConfig', {
		mnemonic: '',
		network: NETWORK_ID.PREPROD
	})

	const onAuth = () => {
		if (!configuration.value.mnemonic) {
			ElMessage.error('Please enter a mnemonic')
			return
		}
		if (wallet.value) {
			wallet.value = null
		}
		walletConfig.value.mnemonic = configuration.value.mnemonic
		walletConfig.value.network = configuration.value.network

		wallet.value = new AppWallet({
			key: {
				type: 'mnemonic',
				words: walletConfig.value.mnemonic.split(' ')
			},
			networkId: NETWORK_ID.PREPROD
		})
		const account = wallet.value.getAccount(0, 0)
		console.log('Account:', JSON.stringify(account, null, 2))
		walletAccount.value.baseAddressBech32 = account.baseAddressBech32
		walletAccount.value.paymentKeyHex = account.paymentKeyHex
		walletAccount.value.stakeKeyHex = account.stakeKeyHex
	}

	const logout = () => {
		wallet.value = null
		walletAccount.value = {
			baseAddressBech32: '',
			paymentKeyHex: '',
			stakeKeyHex: ''
		}
		walletConfig.value.mnemonic = ''
	}
</script>

<template>
	<el-card class="wallet-config-card w-[300px]">
		<el-form :model="configuration" class="wallet-config-form" size="small" label-position="top">
			<el-form-item label="Mnemonic">
				<el-input :disabled="!!wallet" v-model="configuration.mnemonic" type="textarea" placeholder="Enter mnemonic" resize="vertical" :rows="4"></el-input>
			</el-form-item>
			<!-- <el-form-item label="Network">
					<el-select v-model="configuration.network" placeholder="Select network">
						<el-option label="Preprod" value="preprod"></el-option>
						<el-option label="Mainnet" value="mainnet"></el-option>
					</el-select>
				</el-form-item> -->
			<el-form-item class="!mb-0">
				<div class="" v-if="walletAccount">
					<div class="flex">
						<span class="">Base Addr:</span>
						<span class="font-semibold font-mono ml-1" @click="useCopy(walletAccount.baseAddressBech32)">{{ formatId(walletAccount.baseAddressBech32, 8, 8) }}</span>
					</div>
					<div class="flex">
						<span class="">Payment Key:</span>
						<span class="font-semibold font-mono ml-1" @click="useCopy(walletAccount.paymentKeyHex)">{{ formatId(walletAccount.paymentKeyHex, 8, 8) }}</span>
					</div>
					<div class="flex">
						<span class="">Stake Key:</span>
						<span class="font-semibold font-mono ml-1" @click="useCopy(walletAccount.stakeKeyHex)">{{ formatId(walletAccount.stakeKeyHex, 8, 8) }}</span>
					</div>
				</div>
				<div class="flex justify-between items-center w-full">
					<el-button type="primary" @click="onAuth" v-if="!wallet">Auth</el-button>
					<el-button type="danger" @click="logout" v-else>Logout</el-button>
				</div>
			</el-form-item>
		</el-form>
	</el-card>
</template>

<style lang="scss" scoped></style>
