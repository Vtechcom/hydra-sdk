<script lang="ts" setup>
	import { AppWallet, NETWORK_ID } from '@hydrawallet/core'

	onMounted(() => {
		const wallet = new AppWallet({
			networkId: NETWORK_ID.PREPROD,
			key: {
				type: 'mnemonic',
				words: AppWallet.brew()
			}
		})
		const account = wallet.getAccount(0, 0)
		console.log('>>> / onMounted / account:', account)
	})
</script>

<template>
	<div class="">dasdas</div>
</template>

<style lang="scss" scoped></style>
