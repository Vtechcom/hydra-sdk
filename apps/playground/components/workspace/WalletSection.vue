<script lang="ts" setup>
	import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
	import { Textarea } from '@/components/ui/textarea'
	import { AppWallet, EmbeddedWallet, type AppWalletKeyType, type PaymentRole } from '@hydra-sdk/core'
	import { toast } from 'vue-sonner'
	import { cn } from '~/lib/utils'
	import { MAX_DERIVATION_INDEX } from '~/stores/main.store'

	const mainStore = useMainStore()
	const { networkInfo, walletPrvKeyHex, walletDerivation } = storeToRefs(mainStore)
	const txStore = useTxBuilderStore()

	const createType = ref<'mnemonic' | 'root'>('mnemonic')
	const secretInput = ref('')
	const baseAddressBech32 = ref('')
	const error = ref('')
	const open = ref(false)

	// Derivation path inputs, kept as text so an empty field can mean 0.
	const accountIndexInput = ref<string | number>('')
	const keyIndexInput = ref<string | number>('')
	const roleInput = ref<PaymentRole>(0)
	const roleOptions: { value: PaymentRole; label: string; hint: string }[] = [
		{ value: 0, label: 'External', hint: 'Receive addresses' },
		{ value: 1, label: 'Internal', hint: 'Change addresses' }
	]

	const parseIndex = (raw: string | number): { value: number; error: string } => {
		const text = String(raw ?? '').trim()
		if (!text) return { value: 0, error: '' }
		const value = Number(text)
		if (!/^\d+$/.test(text) || value > MAX_DERIVATION_INDEX) return { value: NaN, error: `Enter a whole number from 0 to ${MAX_DERIVATION_INDEX}` }
		return { value, error: '' }
	}
	const accountIndex = computed(() => parseIndex(accountIndexInput.value))
	const keyIndex = computed(() => parseIndex(keyIndexInput.value))
	const indexInvalid = computed(() => !!accountIndex.value.error || !!keyIndex.value.error)
	const formPath = computed(() => {
		const account = accountIndex.value.error ? '?' : accountIndex.value.value
		const key = keyIndex.value.error ? '?' : keyIndex.value.value
		return `m/1852'/1815'/${account}'/${roleInput.value}/${key}`
	})
	const currentPath = computed(() => {
		const { accountIndex, keyIndex, role } = walletDerivation.value
		return `${accountIndex}'/${role}/${keyIndex}`
	})

	// Opening the dialog shows the indexes currently in use.
	watch(open, isOpen => {
		if (!isOpen) return
		accountIndexInput.value = String(walletDerivation.value.accountIndex)
		keyIndexInput.value = String(walletDerivation.value.keyIndex)
		roleInput.value = walletDerivation.value.role
	})

	/** Apply needs a secret, unless a wallet exists and only the indexes change. */
	const canApply = computed(() => !indexInvalid.value && (!!secretInput.value.trim() || !!walletPrvKeyHex.value))

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
			const { accountIndex, keyIndex, role } = walletDerivation.value
			baseAddressBech32.value = wallet.getAccount(accountIndex, keyIndex, role).baseAddressBech32
		} catch (err) {
			console.error('Invalid wallet key in storage:', err)
			baseAddressBech32.value = ''
		}
	}

	const applyChanges = () => {
		if (!canApply.value) return
		const derivation = { accountIndex: accountIndex.value.value, keyIndex: keyIndex.value.value, role: roleInput.value }

		// Empty secret with an existing wallet: keep the root key, re-derive only.
		if (!secretInput.value.trim()) {
			walletDerivation.value = derivation
			resolveAddress()
			if (!baseAddressBech32.value) {
				toast.error('Failed to derive an address for this path.')
				return
			}
			error.value = ''
			open.value = false
			toast.success('Derivation path updated')
			return
		}

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
			baseAddressBech32.value = wallet.getAccount(derivation.accountIndex, derivation.keyIndex, derivation.role).baseAddressBech32
			walletDerivation.value = derivation
			// Don't keep the secret around: reopening "Change" then only edits the path.
			secretInput.value = ''
			error.value = ''
			open.value = false
			toast.success('Wallet configured')
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to configure wallet'
			walletPrvKeyHex.value = ''
			mainStore.resetWalletDerivation()
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
	watch([networkInfo, walletDerivation], resolveAddress, { deep: true })
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
				<span class="shrink-0 text-muted-foreground">Path</span>
				<span class="truncate font-mono" :title="`m/1852'/1815'/${currentPath}`">{{ currentPath }}</span>
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
							<div class="mt-3 space-y-2 rounded-md border p-2.5">
								<p class="eyebrow">Derivation path</p>
								<div class="grid grid-cols-2 gap-2">
									<div>
										<label class="mb-1 block text-xs text-muted-foreground" for="wallet-account-index">Account index</label>
										<Input
											id="wallet-account-index"
											v-model="accountIndexInput"
											inputmode="numeric"
											autocomplete="off"
											placeholder="0"
											class="h-8 font-mono text-xs"
											:class="accountIndex.error ? 'border-destructive' : ''"
										/>
										<p v-if="accountIndex.error" class="mt-0.5 text-[11px] text-destructive">{{ accountIndex.error }}</p>
									</div>
									<div>
										<label class="mb-1 block text-xs text-muted-foreground" for="wallet-key-index">Key index</label>
										<Input
											id="wallet-key-index"
											v-model="keyIndexInput"
											inputmode="numeric"
											autocomplete="off"
											placeholder="0"
											class="h-8 font-mono text-xs"
											:class="keyIndex.error ? 'border-destructive' : ''"
										/>
										<p v-if="keyIndex.error" class="mt-0.5 text-[11px] text-destructive">{{ keyIndex.error }}</p>
									</div>
								</div>
								<div role="radiogroup" aria-label="Chain (role)">
									<span class="mb-1 block text-xs text-muted-foreground">Chain (role)</span>
									<div class="grid grid-cols-2 gap-1.5">
										<button
											v-for="option in roleOptions"
											:key="option.value"
											type="button"
											role="radio"
											:aria-checked="roleInput === option.value"
											:class="
												cn(
													'rounded-md border px-2 py-1.5 text-left transition-colors hover:cursor-pointer hover:bg-accent',
													roleInput === option.value ? 'border-primary bg-accent' : ''
												)
											"
											@click="roleInput = option.value"
										>
											<span class="block text-xs font-medium">{{ option.value }} · {{ option.label }}</span>
											<span class="block text-[11px] text-muted-foreground">{{ option.hint }}</span>
										</button>
									</div>
								</div>
								<p class="flex items-center gap-1 text-xs">
									<span class="shrink-0 text-muted-foreground">Path</span>
									<span class="truncate font-mono">{{ formPath }}</span>
								</p>
								<p v-if="walletPrvKeyHex && !secretInput.trim()" class="text-[11px] text-muted-foreground">
									Leave the key field empty to keep the current wallet and only change the path.
								</p>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button :disabled="!canApply" @click="applyChanges()">Apply</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Button v-if="baseAddressBech32" variant="ghost" size="sm" class="h-7 text-xs" title="Use as change address" @click="useAsChangeAddress()">
				<Icon name="lucide:corner-down-left" size="14" />
			</Button>
		</div>
	</div>
</template>
