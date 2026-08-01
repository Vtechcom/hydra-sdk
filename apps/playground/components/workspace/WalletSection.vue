<script lang="ts" setup>
	import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
	import { Textarea } from '@/components/ui/textarea'
	import { AppWallet, EmbeddedWallet, type AppWalletKeyType } from '@hydra-sdk/core'
	import { toast } from 'vue-sonner'
	import { cn } from '~/lib/utils'

	const mainStore = useMainStore()
	const { networkInfo, walletPrvKeyHex } = storeToRefs(mainStore)
	const txStore = useTxBuilderStore()

	const createType = ref<'mnemonic' | 'root'>('mnemonic')
	const secretInput = ref('')
	const baseAddressBech32 = ref('')
	const error = ref('')
	const open = ref(false)

	const generateKey = () => {
		const words = AppWallet.brew()
		if (createType.value === 'mnemonic') {
			secretInput.value = words.join(' ')
		} else {
			secretInput.value = EmbeddedWallet.privateKeyHexToBech32(EmbeddedWallet.mnemonicToPrivateKeyHex(words))
		}
	}

	watch(createType, () => (secretInput.value = ''))

	const resolveAddress = () => {
		if (!walletPrvKeyHex.value) {
			baseAddressBech32.value = ''
			return
		}
		try {
			const wallet = new AppWallet({
				networkId: networkInfo.value.networkId,
				key: { type: 'root', bech32: EmbeddedWallet.privateKeyHexToBech32(walletPrvKeyHex.value) }
			})
			baseAddressBech32.value = wallet.getAccount().baseAddressBech32
		} catch (err) {
			console.error('Invalid wallet key in storage:', err)
			baseAddressBech32.value = ''
		}
	}

	const applyChanges = () => {
		try {
			const config: AppWalletKeyType =
				createType.value === 'mnemonic'
					? { type: 'mnemonic', words: secretInput.value.trim().split(/\s+/) }
					: { type: 'root', bech32: secretInput.value.trim() }

			const wallet = new AppWallet({ networkId: networkInfo.value.networkId, key: config })
			walletPrvKeyHex.value =
				createType.value === 'mnemonic'
					? EmbeddedWallet.mnemonicToPrivateKeyHex(secretInput.value.trim().split(/\s+/))
					: EmbeddedWallet.privateKeyBech32ToPrivateKeyHex(secretInput.value.trim())
			baseAddressBech32.value = wallet.getAccount().baseAddressBech32
			error.value = ''
			open.value = false
			toast.success('Wallet configured')
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to configure wallet'
			walletPrvKeyHex.value = ''
			baseAddressBech32.value = ''
			toast.error('Failed to configure wallet. Check your input.')
		}
	}

	/** Sending change back to yourself is the common case — offer it in one click. */
	const useAsChangeAddress = () => {
		txStore.draft.changeAddress = baseAddressBech32.value
		txStore.draft.withChangeAddress = true
		toast.success('Change address set to this wallet')
	}

	onMounted(resolveAddress)
	watch(networkInfo, resolveAddress)
</script>

<template>
	<div class="space-y-2">
		<div v-if="walletPrvKeyHex" class="space-y-1">
			<p class="flex items-center gap-1 text-xs">
				<span class="shrink-0 text-muted-foreground">Root key</span>
				<span class="truncate font-mono">{{ formatId(walletPrvKeyHex, 6, 6) }}</span>
				<Icon name="lucide:copy" size="12" class="shrink-0 hover:cursor-pointer hover:text-primary" @click="useCopy(walletPrvKeyHex)" />
			</p>
			<p class="flex items-center gap-1 text-xs">
				<span class="shrink-0 text-muted-foreground">Address</span>
				<span class="truncate font-mono">{{ formatId(baseAddressBech32, 10, 6) }}</span>
				<Icon name="lucide:copy" size="12" class="shrink-0 hover:cursor-pointer hover:text-primary" @click="useCopy(baseAddressBech32)" />
			</p>
		</div>

		<div v-else class="rounded-md border border-dashed p-2.5 text-center">
			<Icon name="lucide:wallet" size="18" class="mx-auto mb-1 text-muted-foreground" />
			<p class="text-xs text-muted-foreground">No wallet yet — needed to sign transactions.</p>
		</div>

		<div class="flex gap-1">
			<Dialog v-model:open="open">
				<DialogTrigger as-child>
					<Button variant="outline" size="sm" class="h-7 flex-1 text-xs">
						<Icon name="lucide:settings-2" size="14" />
						{{ walletPrvKeyHex ? 'Change' : 'Set up wallet' }}
					</Button>
				</DialogTrigger>
				<DialogContent class="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Set up wallet</DialogTitle>
						<DialogDescription>Keys stay in this browser session — never use a mainnet wallet here.</DialogDescription>
					</DialogHeader>
					<div class="flex gap-3">
						<div class="space-y-1">
							<button
								v-for="option in [
									{ value: 'mnemonic', label: 'Seed phrase', icon: 'lucide:list-ordered' },
									{ value: 'root', label: 'xprv key', icon: 'lucide:key-round' }
								]"
								:key="option.value"
								type="button"
								:class="
									cn(
										'flex w-full items-center gap-2 rounded-md border p-2 text-left transition-colors hover:cursor-pointer hover:bg-accent',
										createType === option.value ? 'border-primary bg-accent' : ''
									)
								"
								@click="createType = option.value as 'mnemonic' | 'root'"
							>
								<Icon :name="option.icon" size="14" />
								<span class="text-sm font-medium">{{ option.label }}</span>
							</button>
						</div>
						<div class="flex-1">
							<Textarea
								v-model="secretInput"
								:class="cn(error ? 'border-destructive' : '', createType === 'mnemonic' ? 'break-words' : 'break-all')"
								:placeholder="createType === 'mnemonic' ? 'Enter your seed phrase…' : 'Enter your root key (bech32)…'"
								rows="4"
							/>
							<p v-if="error" class="mt-1 text-xs text-destructive">{{ error }}</p>
							<div class="mt-2 flex justify-end">
								<Button variant="secondary" size="sm" @click="generateKey()">
									<Icon name="lucide:refresh-cw" size="14" />
									Generate
								</Button>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button :disabled="!secretInput.trim()" @click="applyChanges()">Apply</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Button v-if="baseAddressBech32" variant="ghost" size="sm" class="h-7 text-xs" title="Use as change address" @click="useAsChangeAddress()">
				<Icon name="lucide:corner-down-left" size="14" />
			</Button>
		</div>
	</div>
</template>
