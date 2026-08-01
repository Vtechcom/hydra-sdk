<script lang="ts" setup>
	import type { CoinSelectionStrategy } from '@hydra-sdk/transaction'
	import BigNumber from 'bignumber.js'

	const txStore = useTxBuilderStore()
	const { draft, totalInputLovelace } = storeToRefs(txStore)

	const strategies: CoinSelectionStrategy[] = ['LargestFirstMultiAsset', 'LargestFirst', 'RandomImproveMultiAsset', 'RandomImprove']

	const assetCount = computed(() =>
		draft.value.inputs.reduce((acc, utxo) => acc + utxo.output.amount.filter(a => a.unit !== 'lovelace').length, 0)
	)
</script>

<template>
	<WorkspacePanel
		title="Inputs"
		icon="lucide:log-in"
		:meta="`${draft.inputs.length} UTxO · ${BigNumber(totalInputLovelace.toString()).dividedBy(1_000_000).toFormat()} ADA · ${assetCount} assets`"
	>
		<template #actions>
			<Button variant="ghost" size="sm" class="h-6 px-1.5 text-[11px]" :disabled="!draft.inputs.length" @click="txStore.clearInputs()">Clear</Button>
		</template>

		<div class="space-y-2">
			<div class="flex items-center gap-2">
				<label class="eyebrow shrink-0" for="strategy">Coin selection</label>
				<Select v-model="draft.strategy">
					<SelectTrigger id="strategy" class="h-7 flex-1 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem v-for="strategy in strategies" :key="strategy" :value="strategy" class="text-xs">{{ strategy }}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div v-if="draft.inputs.length" class="space-y-1">
				<WorkspaceUtxoRow
					v-for="(utxo, index) in draft.inputs"
					:key="`${utxo.input.txHash}#${utxo.input.outputIndex}`"
					:utxo="utxo"
					removable
					@remove="txStore.removeInput(index)"
				/>
			</div>

			<div v-else class="rounded-md border border-dashed px-3 py-4 text-center">
				<Icon name="lucide:inbox" size="18" class="mx-auto mb-1 text-muted-foreground" />
				<p class="text-xs text-muted-foreground">No inputs yet.</p>
				<p class="text-[11px] text-muted-foreground">Pick UTxOs in the Context panel, or load sample data.</p>
			</div>
		</div>
	</WorkspacePanel>
</template>
