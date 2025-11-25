<script lang="ts" setup>
	import { cn } from '~/lib/utils'
	import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
	import { Textarea } from '@/components/ui/textarea'

	import { AppWallet, EmbeddedWallet, type AppWalletKeyType } from '@hydra-sdk/core'
	import { toast } from 'vue-sonner'

	const mainStore = useMainStore()
	const { networkInfo, walletPrvKeyHex } = storeToRefs(mainStore)

	const createType = ref<'mnemonic' | 'root'>('mnemonic')
	const secretInput = ref('')

	const baseAddressBech32 = ref('')

	function generateKey() {
		const words = AppWallet.brew()
		if (createType.value === 'mnemonic') {
			secretInput.value = words.join(' ')
		} else {
			const prvKeyHex = EmbeddedWallet.mnemonicToPrivateKeyHex(words)
			secretInput.value = EmbeddedWallet.privateKeyHexToBech32(prvKeyHex)
		}
	}

	watch(createType, () => {
		secretInput.value = ''
	})

	const error = ref<string | null>(null)
	function applyChanges() {
		if (!networkInfo.value) return

		try {
			const config: AppWalletKeyType =
				createType.value === 'mnemonic' ? { type: 'mnemonic', words: secretInput.value.trim().split(/\s+/) } : { type: 'root', bech32: secretInput.value.trim() }

			const wallet = new AppWallet({
				networkId: networkInfo.value.networkId,
				key: config
			})
			if (createType.value === 'mnemonic') {
				walletPrvKeyHex.value = EmbeddedWallet.mnemonicToPrivateKeyHex(secretInput.value.trim().split(/\s+/))
			} else {
				walletPrvKeyHex.value = EmbeddedWallet.privateKeyBech32ToPrivateKeyHex(secretInput.value.trim())
			}
			baseAddressBech32.value = wallet.getAccount().baseAddressBech32
			toast.success('Wallet configured successfully!')
			error.value = null
		} catch (err: any) {
			console.error(err)
			error.value = err?.message
			walletPrvKeyHex.value = ''
			baseAddressBech32.value = ''
			toast.error('Failed to configure wallet. Please check your input.')
		}
	}

	onMounted(() => {
		if (mainStore.walletPrvKeyHex) {
			try {
				const prvKeyBech32 = EmbeddedWallet.privateKeyHexToBech32(mainStore.walletPrvKeyHex)
				const wallet = new AppWallet({
					networkId: networkInfo.value.networkId,
					key: { type: 'root', bech32: prvKeyBech32 }
				})
				baseAddressBech32.value = wallet.getAccount().baseAddressBech32
			} catch (error) {
				console.error('>>> / Invalid walletPrvKey in store:', error)
			}
		}
	})
</script>

<template>
	<BaseResizableCard :class="cn('shrink-0 w-full h-full')" name="BaseWalletConfig">
		<template #collapsed>
			<div class="flex items-center h-full">
				<Icon name="mdi:wallet-outline" size="32" class="mr-1" />
				<span class="text-lg font-semibold">Wallet</span>
			</div>
		</template>
		<div class="mb-2">
			<div class="text-lg font-semibold flex items-center">
				<Icon name="mdi:wallet-outline" size="20" class="mr-1" />
				Wallet Configuration
			</div>
			<div class="w-full wrap-anywhere mt-2">
				<p class="text-sm">
					<span class="text-primary font-medium text-nowrap">Root Key: </span>
					<span class="text-muted-foreground">{{ formatId(walletPrvKeyHex, 8, 12) || '---' }}</span>
					<Icon name="mdi:content-copy" v-if="walletPrvKeyHex" class="inline-block ml-1 -mb-0.5 hover:cursor-pointer hover:text-primary" size="12" @click="useCopy(walletPrvKeyHex)" />
				</p>
				<p class="text-sm">
					<span class="text-primary font-medium text-nowrap">Base Addr: </span>
					<span class="text-muted-foreground">{{ formatId(baseAddressBech32, 8, 12) || '---' }}</span>
					<Icon
						name="mdi:content-copy"
						v-if="baseAddressBech32"
						class="inline-block ml-1 -mb-0.5 hover:cursor-pointer hover:text-primary"
						size="12"
						@click="useCopy(baseAddressBech32)"
					/>
				</p>
			</div>
		</div>

		<Dialog>
			<DialogTrigger class="w-full">
				<div v-if="!walletPrvKeyHex" class="flex w-full items-center text-left space-x-4 rounded-md border p-3 hover:border-primary-300 hover:cursor-pointer">
					<Icon name="mdi:wallet-bifold" size="24" />
					<div class="flex-1 space-y-1">
						<p class="text-sm font-medium leading-none">Setup wallet</p>
						<p class="text-sm text-muted-foreground">Configure your wallet settings.</p>
					</div>
				</div>
				<div v-else>
					<div class="flex w-fit items-center text-left space-x-1 rounded-md border p-2 hover:border-primary-300 hover:cursor-pointer">
						<Icon name="mdi:cog-outline" size="20" />
						<div class="flex-1">
							<p class="text-sm font-medium leading-none">Configs</p>
						</div>
					</div>
				</div>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Setup Wallet</DialogTitle>
					<DialogDescription></DialogDescription>
				</DialogHeader>
				<div class="">
					<div class="flex w-full gap-3">
						<div class="space-y-1">
							<div
								class="flex items-center hover:cursor-pointer hover:bg-primary-100 space-x-2 border p-1 rounded-sm"
								@click="createType = 'mnemonic'"
								:class="createType === 'mnemonic' ? 'bg-primary-100 border-primary-300' : ''"
							>
								<Icon name="mdi:wallet-bifold" size="12" />
								<span class="text-sm font-semibold">Seed phrase</span>
							</div>
							<div
								class="flex items-center hover:cursor-pointer hover:bg-primary-100 space-x-2 border p-1 rounded-sm"
								@click="createType = 'root'"
								:class="createType === 'root' ? 'bg-primary-100 border-primary-300' : ''"
							>
								<Icon name="mdi:key" size="12" />
								<span class="text-sm font-semibold">xprv Key</span>
							</div>
						</div>
						<div class="flex-1">
							<Textarea
								v-model="secretInput"
								class="break-words"
								:class="
									cn(
										error ? 'border-red-500' : '', //
										createType === 'mnemonic' ? 'break-words' : 'break-all'
									)
								"
								:placeholder="createType === 'mnemonic' ? 'Enter your seed phrase...' : 'Enter your root key bech32...'"
								rows="4"
							/>
							<div class="flex justify-end mt-3">
								<Button @click="generateKey()" variant="secondary" size="sm">Generate <Icon name="mdi:refresh" class="size-4" /></Button>
							</div>
						</div>
					</div>
					<div class="w-full wrap-anywhere mt-3">
						<p class="text-sm">
							<span class="text-primary font-medium text-nowrap">Root Key: </span>
							<span class="text-muted-foreground font-mono">{{ walletPrvKeyHex || '---' }}</span>
						</p>
						<p class="text-sm">
							<span class="text-primary font-medium text-nowrap">Base Addr: </span>
							<span class="text-muted-foreground font-mono">{{ baseAddressBech32 || '---' }}</span>
						</p>
					</div>
				</div>
				<DialogFooter> <Button @click="applyChanges">Apply</Button> </DialogFooter>
			</DialogContent>
		</Dialog>
	</BaseResizableCard>
</template>

<style lang="scss" scoped></style>
