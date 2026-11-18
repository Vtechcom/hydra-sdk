<script lang="ts" setup>
	import { toast } from 'vue-sonner'
	import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
	import { DEMETER_CONSOLE_URL, defaultBlockfrostEndpoint, resolveDemeterEndpoint, type DemeterAuthMode, type ProviderConfig, type ProviderKind } from '~/lib/provider'
	import { cn } from '~/lib/utils'

	const open = defineModel<boolean>('open', { default: false })

	const providerStore = useProviderStore()
	const { providerNetwork, providerConfig } = storeToRefs(providerStore)

	const tab = ref<ProviderKind>('blockfrost')

	// ── Blockfrost form ─────────────────────────────────────────────────────────
	const defaultEndpoint = computed(() => defaultBlockfrostEndpoint(providerNetwork.value))
	const bfEndpoint = ref('')
	const bfKey = ref('')

	// The endpoint follows the selected network unless the user has typed their own.
	watch(defaultEndpoint, (next, previous) => {
		if (!bfEndpoint.value || bfEndpoint.value === previous) bfEndpoint.value = next
	})

	const bfEndpointError = computed(() => {
		if (!bfEndpoint.value.trim()) return 'API URL is required'
		if (!/^https?:\/\//.test(bfEndpoint.value)) return 'Must be a valid URL'
		if (!bfEndpoint.value.includes(providerNetwork.value)) return `URL should target ${providerNetwork.value}`
		return ''
	})
	const bfKeyError = computed(() => {
		if (!bfKey.value.trim()) return 'API key is required'
		if (!bfKey.value.startsWith(providerNetwork.value)) return `Key should start with "${providerNetwork.value}"`
		return ''
	})

	// ── Demeter form ────────────────────────────────────────────────────────────
	const dmKey = ref('')
	const dmMode = ref<DemeterAuthMode>('subdomain')
	const dmEndpoint = computed(() => resolveDemeterEndpoint(providerNetwork.value, dmMode.value, dmKey.value))
	const dmKeyError = computed(() => {
		if (!dmKey.value.trim()) return 'API key is required'
		// In subdomain mode the key becomes a host label.
		if (dmMode.value === 'subdomain' && !/^[A-Za-z0-9_-]+$/.test(dmKey.value.trim())) {
			return 'Key can only contain letters, digits, "-" and "_" in subdomain mode'
		}
		return ''
	})
	const authModes: { value: DemeterAuthMode; label: string; hint: string }[] = [
		{ value: 'subdomain', label: 'Subdomain', hint: 'Key is the first host label' },
		{ value: 'header', label: 'Header', hint: 'Key is sent as dmtr-api-key' }
	]

	// ── Remember on this device ─────────────────────────────────────────────────
	const remember = ref(false)
	const rememberedExists = computed(() => !!providerStore.getRememberedConfig(tab.value))

	/** Fill the form from the active session config, else a remembered one, else defaults. */
	const loadForm = () => {
		const active = providerConfig.value
		tab.value = active?.kind ?? 'blockfrost'

		const bf = active?.kind === 'blockfrost' ? active : providerStore.getRememberedConfig('blockfrost')
		bfEndpoint.value = bf?.apiEndpoint || defaultEndpoint.value
		bfKey.value = bf?.apiKey ?? ''

		const dm = active?.kind === 'demeter' ? active : providerStore.getRememberedConfig('demeter')
		dmKey.value = dm?.apiKey ?? ''
		dmMode.value = dm?.demeterAuthMode ?? 'subdomain'

		remember.value = rememberedExists.value
	}
	watch(open, value => value && loadForm(), { immediate: true })
	watch(tab, () => (remember.value = rememberedExists.value))

	const forget = () => {
		providerStore.forgetConfig(tab.value)
		remember.value = false
		toast.success(`Forgot the saved ${tab.value === 'demeter' ? 'Demeter' : 'Blockfrost'} key for ${providerNetwork.value}`)
	}

	const connect = () => {
		let config: ProviderConfig
		if (tab.value === 'blockfrost') {
			const error = bfEndpointError.value || bfKeyError.value
			if (error) return toast.error(error)
			config = { kind: 'blockfrost', apiKey: bfKey.value.trim(), apiEndpoint: bfEndpoint.value.trim() }
		} else {
			if (dmKeyError.value) return toast.error(dmKeyError.value)
			config = {
				kind: 'demeter',
				apiKey: dmKey.value.trim(),
				apiEndpoint: dmEndpoint.value,
				demeterAuthMode: dmMode.value
			}
		}
		providerStore.setProviderConfig(config, { remember: remember.value })
		toast.success(`${config.kind === 'demeter' ? 'Demeter' : 'Blockfrost'} provider connected`)
		open.value = false
	}
</script>

<template>
	<Dialog v-model:open="open">
		<DialogContent class="sm:max-w-lg">
			<DialogHeader>
				<DialogTitle class="flex items-center gap-2">
					Provider
					<Badge variant="muted">{{ providerNetwork }}</Badge>
				</DialogTitle>
				<DialogDescription>Chain data for UTxO queries, exUnits evaluation and submit.</DialogDescription>
			</DialogHeader>

			<Tabs v-model="tab" class="w-full">
				<TabsList class="grid w-full grid-cols-2">
					<TabsTrigger value="blockfrost">Blockfrost</TabsTrigger>
					<TabsTrigger value="demeter">Demeter</TabsTrigger>
				</TabsList>

				<TabsContent value="blockfrost" class="space-y-2 pt-2">
					<div>
						<label class="eyebrow mb-1 block" for="bf-endpoint">API URL</label>
						<Input id="bf-endpoint" v-model="bfEndpoint" autocomplete="off" class="h-8 font-mono text-xs" :class="bfEndpointError ? 'border-destructive' : ''" />
						<p v-if="bfEndpointError" class="mt-0.5 text-[11px] text-destructive">{{ bfEndpointError }}</p>
					</div>
					<div>
						<label class="eyebrow mb-1 block" for="bf-key">API key</label>
						<Input
							id="bf-key"
							v-model="bfKey"
							type="password"
							autocomplete="off"
							:placeholder="`${providerNetwork}…`"
							class="h-8 font-mono text-xs"
							:class="bfKeyError && bfKey ? 'border-destructive' : ''"
						/>
						<p v-if="bfKeyError && bfKey" class="mt-0.5 text-[11px] text-destructive">{{ bfKeyError }}</p>
					</div>
				</TabsContent>

				<TabsContent value="demeter" class="space-y-2 pt-2">
					<div>
						<div class="mb-1 flex items-center">
							<label class="eyebrow block" for="dm-key">API key</label>
							<a :href="DEMETER_CONSOLE_URL" target="_blank" rel="noopener noreferrer" class="ml-auto inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
								Get a key
								<Icon name="lucide:external-link" size="11" />
							</a>
						</div>
						<Input
							id="dm-key"
							v-model="dmKey"
							type="password"
							autocomplete="off"
							placeholder="dmtr_blockfrost…"
							class="h-8 font-mono text-xs"
							:class="dmKeyError && dmKey ? 'border-destructive' : ''"
						/>
						<p v-if="dmKeyError && dmKey" class="mt-0.5 text-[11px] text-destructive">{{ dmKeyError }}</p>
						<p class="mt-0.5 text-[11px] text-muted-foreground">Each Demeter port serves one network, chosen when the port is created.</p>
					</div>

					<div role="radiogroup" aria-label="Auth mode">
						<span class="eyebrow mb-1 block">Auth mode</span>
						<div class="grid grid-cols-2 gap-1.5">
							<button
								v-for="mode in authModes"
								:key="mode.value"
								type="button"
								role="radio"
								:aria-checked="dmMode === mode.value"
								:class="cn('rounded-md border p-2 text-left transition-colors hover:cursor-pointer hover:bg-accent', dmMode === mode.value ? 'border-primary bg-accent' : '')"
								@click="dmMode = mode.value"
							>
								<span class="block text-xs font-medium">{{ mode.label }}</span>
								<span class="block text-[11px] text-muted-foreground">{{ mode.hint }}</span>
							</button>
						</div>
					</div>

					<div>
						<label class="eyebrow mb-1 block" for="dm-endpoint">API URL</label>
						<div class="flex gap-1">
							<Input id="dm-endpoint" :model-value="dmEndpoint" readonly class="h-8 flex-1 font-mono text-xs text-muted-foreground" />
							<Button variant="outline" size="icon" class="size-8" aria-label="Copy API URL" @click="useCopy(dmEndpoint)">
								<Icon name="lucide:copy" size="14" />
							</Button>
						</div>
					</div>
				</TabsContent>
			</Tabs>

			<div class="space-y-1 rounded-md border p-2">
				<div class="flex items-center gap-2">
					<Checkbox id="provider-remember" v-model="remember" />
					<label for="provider-remember" class="text-xs hover:cursor-pointer">Remember on this device</label>
					<Button v-if="rememberedExists" variant="ghost" size="sm" class="ml-auto h-6 px-1.5 text-[11px] text-destructive" aria-label="Forget saved key" @click="forget()">
						<Icon name="lucide:trash-2" size="13" />
						Forget
					</Button>
				</div>
				<p class="text-[11px] text-warning-600 dark:text-warning-400">Saved as plain text in this browser — don't use a mainnet key on a paid plan.</p>
			</div>

			<DialogFooter>
				<Button @click="connect()">Connect</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
