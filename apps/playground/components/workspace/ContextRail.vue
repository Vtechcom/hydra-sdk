<script lang="ts" setup>
	import { DEFAULT_PROTOCOL_PARAMETERS } from '@hydra-sdk/core'

	const mainStore = useMainStore()
	const { networkInfo } = storeToRefs(mainStore)
	const providerStore = useProviderStore()
	const txStore = useTxBuilderStore()
	const uiStore = useUiStore()

	const openSections = useLocalStorage<string[]>('hydra-playground.context-sections', ['wallet', 'provider', 'utxo'])
</script>

<template>
	<!-- Collapsed: an icon strip that still says which context is configured. -->
	<div v-if="uiStore.contextCollapsed" class="flex h-full w-12 shrink-0 flex-col items-center gap-3 border-r py-3">
		<button
			type="button"
			class="rounded p-1 text-muted-foreground hover:cursor-pointer hover:text-foreground"
			aria-label="Expand context panel"
			@click="uiStore.contextCollapsed = false"
		>
			<Icon name="lucide:panel-left-open" size="18" />
		</button>
		<Separator />
		<Icon name="lucide:wallet" size="16" :class="mainStore.walletPrvKeyHex ? 'text-primary' : 'text-muted-foreground/50'" />
		<Icon name="lucide:cloud" size="16" :class="providerStore.blockfrostConfig.apiKey ? 'text-primary' : 'text-muted-foreground/50'" />
		<Icon name="lucide:list-checks" size="16" class="text-muted-foreground/50" />
	</div>

	<div v-else class="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2">
		<div class="flex shrink-0 items-center gap-1">
			<span class="eyebrow">Context</span>
			<button
				type="button"
				class="ml-auto rounded p-1 text-muted-foreground hover:cursor-pointer hover:text-foreground"
				aria-label="Collapse context panel"
				@click="uiStore.contextCollapsed = true"
			>
				<Icon name="lucide:panel-left-close" size="16" />
			</button>
		</div>

		<Accordion v-model="openSections" type="multiple" class="min-h-0 flex-1 overflow-y-auto scroll-bar-primary pr-1">
			<AccordionItem value="wallet">
				<AccordionTrigger class="px-1">
					<span class="flex items-center gap-2">
						<Icon name="lucide:wallet" size="14" class="text-primary" />
						Wallet
						<Badge v-if="mainStore.walletPrvKeyHex" variant="muted">ready</Badge>
					</span>
				</AccordionTrigger>
				<AccordionContent class="px-1">
					<WorkspaceWalletSection />
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="provider">
				<AccordionTrigger class="px-1">
					<span class="flex items-center gap-2">
						<Icon name="lucide:cloud" size="14" class="text-primary" />
						Provider
					</span>
				</AccordionTrigger>
				<AccordionContent class="px-1">
					<WorkspaceProviderSection />
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="protocol">
				<AccordionTrigger class="px-1">
					<span class="flex items-center gap-2">
						<Icon name="lucide:sliders-horizontal" size="14" class="text-primary" />
						Protocol
						<Badge variant="muted">{{ txStore.draft.useCustomPParams ? 'custom' : 'PV11 defaults' }}</Badge>
					</span>
				</AccordionTrigger>
				<AccordionContent class="space-y-1 px-1">
					<div class="flex items-center gap-2 text-xs">
						<span class="text-muted-foreground">Network</span>
						<span class="ml-auto font-mono">{{ networkInfo.label }} · id {{ networkInfo.networkId }}</span>
					</div>
					<div class="flex items-center gap-2 text-xs">
						<span class="text-muted-foreground">minFeeA / B</span>
						<span class="ml-auto font-mono">{{ DEFAULT_PROTOCOL_PARAMETERS.minFeeA }} / {{ DEFAULT_PROTOCOL_PARAMETERS.minFeeB }}</span>
					</div>
					<div class="flex items-center gap-2 text-xs">
						<span class="text-muted-foreground">coinsPerUtxoSize</span>
						<span class="ml-auto font-mono">{{ DEFAULT_PROTOCOL_PARAMETERS.coinsPerUtxoSize }}</span>
					</div>
					<p class="pt-1 text-[11px] text-muted-foreground">Override these under Options → Protocol parameters.</p>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="utxo">
				<AccordionTrigger class="px-1">
					<span class="flex items-center gap-2">
						<Icon name="lucide:list-checks" size="14" class="text-primary" />
						UTxO manager
					</span>
				</AccordionTrigger>
				<AccordionContent class="px-1">
					<WorkspaceUtxoQuerySection />
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	</div>
</template>
