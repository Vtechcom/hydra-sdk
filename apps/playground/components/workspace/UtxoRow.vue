<script lang="ts" setup>
	import { Deserializer, ParserUtils, type Asset, type UTxO } from '@hydra-sdk/core'
	import BigNumber from 'bignumber.js'
	import { cn } from '~/lib/utils'

	const props = withDefaults(
		defineProps<{
			utxo: UTxO
			/** Renders a checkbox and reports clicks as a selection toggle. */
			selectable?: boolean
			selected?: boolean
			/** Renders a remove button instead of a checkbox. */
			removable?: boolean
			class?: string
		}>(),
		{ selectable: false, selected: false, removable: false }
	)

	const emit = defineEmits<{ toggle: [utxo: UTxO]; remove: [utxo: UTxO] }>()

	const expanded = ref(false)

	const ref_ = computed(() => `${props.utxo.input.txHash}#${props.utxo.input.outputIndex}`)
	const shortRef = computed(() => `${formatId(props.utxo.input.txHash, 8, 4)}#${props.utxo.input.outputIndex}`)

	const lovelace = computed(() => props.utxo.output.amount.find(a => a.unit === 'lovelace')?.quantity ?? '0')
	const ada = computed(() => BigNumber(lovelace.value).dividedBy(1_000_000).toFormat())
	const assets = computed<Asset[]>(() => props.utxo.output.amount.filter(a => a.unit !== 'lovelace'))

	/** Asset units are `<policyId><assetNameHex>`; show the readable name when there is one. */
	const assetName = (unit: string) => {
		try {
			const name = ParserUtils.hexToString(Deserializer.deserializeAssetUnit(unit).assetName)
			return name || formatId(unit, 6, 4)
		} catch {
			return formatId(unit, 6, 4)
		}
	}

	const onActivate = () => {
		if (props.selectable) emit('toggle', props.utxo)
		else expanded.value = !expanded.value
	}
</script>

<template>
	<div
		:class="
			cn(
				'group rounded-md border bg-card/60 transition-colors',
				props.selected ? 'border-primary/60 bg-primary/5' : 'hover:border-primary/40',
				props.class
			)
		"
	>
		<!-- Compact row: everything you need to pick a UTxO, nothing you don't. -->
		<div class="flex items-center gap-2 px-2 py-1.5">
			<Checkbox v-if="props.selectable" :model-value="props.selected" class="size-3.5 shrink-0" @update:model-value="emit('toggle', props.utxo)" />

			<button type="button" class="flex min-w-0 flex-1 items-center gap-2 text-left hover:cursor-pointer" @click="onActivate()">
				<span class="truncate font-mono text-xs text-foreground">{{ shortRef }}</span>
			</button>

			<TooltipProvider>
				<Tooltip :delay-duration="150">
					<TooltipTrigger as-child>
						<span class="shrink-0 font-mono text-xs font-medium tabular-nums">{{ ada }} <span class="text-muted-foreground">ADA</span></span>
					</TooltipTrigger>
					<TooltipContent side="left" class="max-w-xs">
						<p class="font-mono text-[11px]">{{ lovelace }} lovelace</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<!-- Hover surfaces the units without leaving the row; click expands them. -->
			<TooltipProvider v-if="assets.length">
				<Tooltip :delay-duration="150">
					<TooltipTrigger as-child>
						<Badge variant="asset" class="shrink-0 hover:cursor-help">+{{ assets.length }}</Badge>
					</TooltipTrigger>
					<TooltipContent side="left" class="max-w-sm space-y-1">
						<p v-for="asset in assets.slice(0, 6)" :key="asset.unit" class="font-mono text-[11px]">
							<span class="text-primary">{{ assetName(asset.unit) }}</span>
							· {{ BigNumber(asset.quantity).toFormat() }}
						</p>
						<p v-if="assets.length > 6" class="text-[11px] text-muted-foreground">+{{ assets.length - 6 }} more…</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<button
				type="button"
				class="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:cursor-pointer hover:text-foreground"
				:aria-label="expanded ? 'Collapse UTxO details' : 'Expand UTxO details'"
				@click="expanded = !expanded"
			>
				<Icon :name="expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'" size="14" />
			</button>

			<button
				v-if="props.removable"
				type="button"
				class="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:cursor-pointer hover:text-destructive"
				aria-label="Remove input"
				@click="emit('remove', props.utxo)"
			>
				<Icon name="lucide:x" size="14" />
			</button>
		</div>

		<!-- Expanded detail: full reference, address and every unit. -->
		<div v-if="expanded" class="space-y-2 border-t px-2 py-2">
			<div>
				<p class="eyebrow mb-0.5">Reference</p>
				<p class="flex items-start gap-1 font-mono text-[11px] break-all">
					{{ ref_ }}
					<Icon name="lucide:copy" size="12" class="mt-0.5 shrink-0 hover:cursor-pointer hover:text-primary" @click="useCopy(ref_)" />
				</p>
			</div>
			<div>
				<p class="eyebrow mb-0.5">Address</p>
				<p class="flex items-start gap-1 font-mono text-[11px] break-all">
					{{ props.utxo.output.address }}
					<Icon name="lucide:copy" size="12" class="mt-0.5 shrink-0 hover:cursor-pointer hover:text-primary" @click="useCopy(props.utxo.output.address)" />
				</p>
			</div>
			<div v-if="assets.length">
				<p class="eyebrow mb-1">Units ({{ assets.length }})</p>
				<div class="space-y-1">
					<div v-for="asset in assets" :key="asset.unit" class="flex items-baseline justify-between gap-2 rounded bg-muted/50 px-1.5 py-1">
						<span class="min-w-0 flex-1">
							<span class="block text-[11px] font-medium">{{ assetName(asset.unit) }}</span>
							<span class="block truncate font-mono text-[10px] text-muted-foreground">{{ asset.unit }}</span>
						</span>
						<span class="shrink-0 font-mono text-[11px] tabular-nums">{{ BigNumber(asset.quantity).toFormat() }}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
