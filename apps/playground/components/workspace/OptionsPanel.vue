<script lang="ts" setup>
	const txStore = useTxBuilderStore()
	const { draft } = storeToRefs(txStore)

	const openSections = useLocalStorage<string[]>('hydra-playground.option-sections', [])

	const advancedCount = computed(
		() =>
			draft.value.metadata.length +
			draft.value.mints.length +
			draft.value.collateral.length +
			draft.value.requiredSigners.filter(Boolean).length +
			(draft.value.withValidity ? 1 : 0) +
			(draft.value.useCustomPParams ? 1 : 0)
	)

	const expertCount = computed(
		() =>
			draft.value.scriptInputs.length +
			draft.value.referenceInputs.length +
			draft.value.certificates.length +
			draft.value.withdrawals.length +
			(draft.value.useEvaluator ? 1 : 0) +
			(draft.value.verbose ? 1 : 0)
	)
</script>

<template>
	<WorkspacePanel title="Options" icon="lucide:settings-2">
		<div class="space-y-2.5">
			<!-- Tier 1 — the switches almost every transaction touches. -->
			<div class="flex items-start gap-2">
				<Checkbox id="opt-hydra" v-model="draft.isHydra" class="mt-0.5" />
				<label for="opt-hydra" class="flex items-center gap-1.5 text-xs font-medium hover:cursor-pointer">
					<img src="/images/hydra-protocol.png" alt="" class="size-3.5" >
					Hydra mode
					<TooltipProvider>
						<Tooltip :delay-duration="150">
							<TooltipTrigger class="flex">
								<Icon name="lucide:info" size="13" class="text-muted-foreground hover:cursor-help" />
							</TooltipTrigger>
							<TooltipContent class="max-w-xs">
								<p class="text-xs">Allows unbalanced, fee-less transactions — how transactions inside a Hydra head work.</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</label>
			</div>

			<div>
				<div class="flex items-center gap-2">
					<Checkbox id="opt-change" v-model="draft.withChangeAddress" />
					<label for="opt-change" class="text-xs font-medium hover:cursor-pointer">Change address</label>
				</div>
				<Input
					v-if="draft.withChangeAddress"
					v-model="draft.changeAddress"
					placeholder="addr…"
					autocomplete="off"
					class="mt-1 ml-6 h-7 w-[calc(100%-1.5rem)] font-mono text-xs"
				/>
			</div>

			<div>
				<div class="flex items-center gap-2">
					<Checkbox id="opt-fee" v-model="draft.withCustomFee" />
					<label for="opt-fee" class="text-xs font-medium hover:cursor-pointer">Custom fee</label>
				</div>
				<Input
					v-if="draft.withCustomFee"
					v-model="draft.customFee"
					placeholder="lovelace"
					inputmode="numeric"
					class="mt-1 ml-6 h-7 w-[calc(100%-1.5rem)] font-mono text-xs"
				/>
			</div>

			<div>
				<div class="flex items-center gap-2">
					<Checkbox id="opt-minfee" v-model="draft.withMinFee" />
					<label for="opt-minfee" class="text-xs font-medium hover:cursor-pointer">Minimum fee floor</label>
				</div>
				<Input
					v-if="draft.withMinFee"
					v-model="draft.minFee"
					placeholder="lovelace"
					inputmode="numeric"
					class="mt-1 ml-6 h-7 w-[calc(100%-1.5rem)] font-mono text-xs"
				/>
			</div>

			<!-- Tier 2 / 3 — everything else the SDK can do, kept out of the way. -->
			<Accordion v-model="openSections" type="multiple" class="border-t">
				<AccordionItem value="advanced">
					<AccordionTrigger>
						<span class="flex items-center gap-2">
							Advanced
							<Badge v-if="advancedCount" variant="muted">{{ advancedCount }}</Badge>
						</span>
					</AccordionTrigger>
					<AccordionContent>
						<WorkspaceOptionsAdvanced />
					</AccordionContent>
				</AccordionItem>

				<AccordionItem value="expert">
					<AccordionTrigger>
						<span class="flex items-center gap-2">
							Expert
							<Badge v-if="expertCount" variant="muted">{{ expertCount }}</Badge>
							<span class="text-[11px] font-normal text-muted-foreground">scripts · certs · evaluator</span>
						</span>
					</AccordionTrigger>
					<AccordionContent>
						<WorkspaceOptionsExpert />
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	</WorkspacePanel>
</template>
