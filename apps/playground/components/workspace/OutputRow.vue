<script lang="ts" setup>
	import { Deserializer, ParserUtils } from '@hydra-sdk/core'
	import BigNumber from 'bignumber.js'
	import type { TxOutputDraft } from '~/lib/tx-draft'
	import { estimateMinAdaLovelace } from '~/lib/min-ada'
	import { cn } from '~/lib/utils'

	const props = defineProps<{ output: TxOutputDraft; index: number }>()
	const emit = defineEmits<{ remove: [index: number] }>()

	const txStore = useTxBuilderStore()
	const { draft, availableAssets } = storeToRefs(txStore)

	const output = toRef(props, 'output')

	const lovelace = computed({
		get: () => output.value.amount.find(a => a.unit === 'lovelace')?.quantity ?? '',
		set: (value: string) => {
			const entry = output.value.amount.find(a => a.unit === 'lovelace')
			if (entry) entry.quantity = value
			else output.value.amount.unshift({ unit: 'lovelace', quantity: value })
		}
	})

	/** The field is in ADA; the draft always stores lovelace. */
	const ada = computed({
		get: () => (lovelace.value && !isNaN(Number(lovelace.value)) ? BigNumber(lovelace.value).dividedBy(1_000_000).toString() : ''),
		set: (value: string) => {
			if (!value || isNaN(Number(value))) {
				lovelace.value = ''
				return
			}
			lovelace.value = BigNumber(value).multipliedBy(1_000_000).integerValue(BigNumber.ROUND_FLOOR).toString()
		}
	})

	const extraAssets = computed(() => output.value.amount.filter(a => a.unit !== 'lovelace'))

	const minAda = computed(() => estimateMinAdaLovelace(output.value, draft.value.customPParams.coinsPerUtxoSize))
	const belowMinAda = computed(() => {
		if (!lovelace.value || isNaN(Number(lovelace.value))) return false
		return BigInt(lovelace.value || 0) < minAda.value
	})

	const addAsset = (unit = '') => output.value.amount.push({ unit, quantity: '' })
	const removeAsset = (unit: string) => {
		const index = output.value.amount.findIndex(a => a.unit === unit && a.unit !== 'lovelace')
		if (index >= 0) output.value.amount.splice(index, 1)
	}

	const assetLabel = (unit: string) => {
		if (!unit) return 'unit'
		try {
			return ParserUtils.hexToString(Deserializer.deserializeAssetUnit(unit).assetName) || formatId(unit, 6, 4)
		} catch {
			return formatId(unit, 6, 4)
		}
	}

	// ── Datum ────────────────────────────────────────────────────────────────
	const datumMode = computed({
		get: () => (output.value.inlineDatum !== undefined ? 'inlinedatum' : output.value.datum !== undefined ? 'datumhash' : 'none'),
		set: (mode: 'none' | 'datumhash' | 'inlinedatum') => {
			const current = output.value.inlineDatum ?? output.value.datum ?? ''
			if (mode === 'none') {
				output.value.datum = undefined
				output.value.inlineDatum = undefined
			} else if (mode === 'datumhash') {
				output.value.datum = current
				output.value.inlineDatum = undefined
			} else {
				output.value.inlineDatum = current
				output.value.datum = undefined
			}
		}
	})

	const datumValue = computed({
		get: () => output.value.inlineDatum ?? output.value.datum ?? '',
		set: (value: string) => {
			if (datumMode.value === 'inlinedatum') output.value.inlineDatum = value
			else if (datumMode.value === 'datumhash') output.value.datum = value
		}
	})

	const datumInvalid = computed(() => {
		if (datumMode.value === 'none' || !datumValue.value) return false
		let data: { free: () => void } | undefined
		try {
			data = Deserializer.deserializePlutusData(datumValue.value)
			return false
		} catch {
			return true
		} finally {
			try {
				data?.free()
			} catch {
				/* already freed */
			}
		}
	})
</script>

<template>
	<div class="relative rounded-md border bg-card/60 p-2">
		<div class="mb-1.5 flex items-center gap-2">
			<Badge variant="muted">#{{ props.index + 1 }}</Badge>
			<button
				type="button"
				class="ml-auto rounded p-0.5 text-muted-foreground transition-colors hover:cursor-pointer hover:text-destructive"
				:aria-label="`Remove output ${props.index + 1}`"
				@click="emit('remove', props.index)"
			>
				<Icon name="lucide:x" size="14" />
			</button>
		</div>

		<Input v-model="output.address" placeholder="addr…" class="h-8 font-mono text-xs" autocomplete="off" />

		<div class="mt-1.5 flex items-start gap-1.5">
			<div class="flex-1">
				<InputGroup>
					<InputGroupInput v-model="ada" placeholder="0.000000" inputmode="decimal" class="h-8 font-mono text-xs" />
					<InputGroupAddon align="inline-end">
						<InputGroupText class="text-[11px]">ADA</InputGroupText>
					</InputGroupAddon>
				</InputGroup>
				<p v-if="belowMinAda" class="mt-0.5 text-[11px] text-warning-600 dark:text-warning-400">
					Below est. min-ADA ({{ BigNumber(minAda.toString()).dividedBy(1_000_000).toFormat(6) }})
				</p>
			</div>

			<Popover>
				<PopoverTrigger as-child>
					<Button variant="outline" size="sm" class="h-8 shrink-0 text-xs">
						<Icon name="lucide:plus" size="14" />
						Asset
					</Button>
				</PopoverTrigger>
				<PopoverContent align="end" class="w-72 p-2">
					<p class="eyebrow mb-1.5">From selected inputs</p>
					<div v-if="availableAssets.length" class="max-h-48 space-y-1 overflow-y-auto scroll-bar-primary">
						<button
							v-for="asset in availableAssets"
							:key="asset.unit"
							type="button"
							class="flex w-full items-baseline justify-between gap-2 rounded px-1.5 py-1 text-left hover:cursor-pointer hover:bg-accent"
							@click="addAsset(asset.unit)"
						>
							<span class="min-w-0">
								<span class="block text-xs font-medium">{{ assetLabel(asset.unit) }}</span>
								<span class="block truncate font-mono text-[10px] text-muted-foreground">{{ asset.unit }}</span>
							</span>
							<span class="shrink-0 font-mono text-[11px] text-muted-foreground">{{ BigNumber(asset.quantity).toFormat() }}</span>
						</button>
					</div>
					<p v-else class="text-[11px] text-muted-foreground">No native assets in the selected inputs.</p>
					<Separator class="my-2" />
					<Button variant="ghost" size="sm" class="h-7 w-full text-xs" @click="addAsset()">
						<Icon name="lucide:pencil" size="13" />
						Enter unit manually
					</Button>
				</PopoverContent>
			</Popover>
		</div>

		<div v-if="extraAssets.length" class="mt-1.5 space-y-1 pl-3">
			<div v-for="asset in extraAssets" :key="asset.unit || Math.random()" class="flex items-center gap-1">
				<div class="flex-1 space-y-1">
					<InputGroup>
						<InputGroupInput v-model="asset.unit" placeholder="policyId + assetName (hex)" class="h-7 font-mono !text-[11px]" />
						<InputGroupAddon align="inline-end">
							<InputGroupText class="!text-[11px]">{{ assetLabel(asset.unit) }}</InputGroupText>
						</InputGroupAddon>
					</InputGroup>
					<Input v-model="asset.quantity" placeholder="quantity" inputmode="numeric" class="h-7 font-mono !text-[11px]" />
				</div>
				<button
					type="button"
					class="shrink-0 rounded p-1 text-muted-foreground hover:cursor-pointer hover:text-destructive"
					aria-label="Remove asset"
					@click="removeAsset(asset.unit)"
				>
					<Icon name="lucide:trash-2" size="13" />
				</button>
			</div>
		</div>

		<div class="mt-2 flex items-center gap-1.5">
			<span class="eyebrow">Datum</span>
			<Select v-model="datumMode">
				<SelectTrigger class="h-6 w-[130px] text-[11px]">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="none" class="text-xs">none</SelectItem>
					<SelectItem value="datumhash" class="text-xs">datum hash</SelectItem>
					<SelectItem value="inlinedatum" class="text-xs">inline datum</SelectItem>
				</SelectContent>
			</Select>
			<TooltipProvider>
				<Tooltip :delay-duration="150">
					<TooltipTrigger class="flex">
						<Icon name="lucide:info" size="13" class="text-muted-foreground hover:cursor-help" />
					</TooltipTrigger>
					<TooltipContent class="max-w-xs">
						<p class="text-xs">
							<b>Datum hash</b> stores only the hash on chain (cheaper, the datum lives off chain).<br >
							<b>Inline datum</b> stores the datum itself inside the output.
						</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>

		<Textarea
			v-if="datumMode !== 'none'"
			v-model="datumValue"
			rows="2"
			placeholder="Datum CBOR hex, e.g. d87980"
			:class="cn('mt-1 font-mono !text-[11px]', datumInvalid ? 'border-destructive' : '')"
		/>
		<p v-if="datumInvalid" class="mt-0.5 text-[11px] text-destructive">Not valid Plutus data CBOR.</p>
	</div>
</template>
