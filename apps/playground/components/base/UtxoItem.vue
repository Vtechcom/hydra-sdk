<script lang="ts" setup>
	import { Deserializer, ParserUtils, type UTxO } from '@hydra-sdk/core'
	import BigNumber from 'bignumber.js'
	import { cn } from '~/lib/utils'

	const props = withDefaults(
		defineProps<{
			utxo: UTxO
			hideAmount?: boolean
			txIdFormatter?: (txId: string) => string

			showAddButton?: boolean
		}>(),
		{
			hideAmount: false,

			showAddButton: true
		}
	)

	const emits = defineEmits<{
		add: [utxo: UTxO]
	}>()

	const getAssetName = (unit: string) => {
		return ParserUtils.hexToString(Deserializer.deserializeAssetUnit(unit).assetName)
	}

	const isCollapsedAssets = ref(true)
	const displayedAssets = computed(() => {
		if (isCollapsedAssets.value) {
			return props.utxo.output.amount.slice(1, 3)
		}
		return props.utxo.output.amount.slice(1)
	})

	const txIdFormatted = computed(() => {
		const txId = `${props.utxo.input.txHash}#${props.utxo.input.outputIndex}`
		if (props.txIdFormatter) {
			return props.txIdFormatter(txId)
		}
		return txId
	})
</script>

<template>
	<Card :class="cn('rounded-none border-transparent')">
		<CardContent class="w-full h-full flex items-center uxo-item p-0">
			<div
				v-if="props.showAddButton"
				class="add-btn cursor-pointer transition-all duration-200 ease-in-out shrink-0 w-0 overflow-hidden hover:!border-primary-300 border-r-none h-full flex items-center justify-center"
				@click="$emit('add', props.utxo)"
			>
				<Icon name="tabler:plus" size="16" class="" />
			</div>
			<div class="flex flex-col items-center space-y-1 grow border hover:border-primary-300 p-1">
				<div class="flex justify-between items-center w-full space-x-2">
					<span class="text-sm font-medium">{{ txIdFormatted }}</span>
					<span v-if="!props.hideAmount" class="text-xs text-primary-500 p-1.5 px-2.5 bg-primary-50 rounded">
						{{ BigNumber(Number(utxo.output.amount.at(0)?.quantity) / 1_000_000).toFormat() }} ADA
					</span>
				</div>
				<div class="flex justify-end w-full space-x-1 flex-wrap" v-if="utxo.output.amount.length > 1 && !props.hideAmount">
					<TooltipProvider>
						<Tooltip v-for="(amount, idx) in displayedAssets" :key="amount.unit">
							<TooltipTrigger>
								<span class="text-xs text-primary-500 p-1.5 px-2.5 bg-primary-50 rounded hover:cursor-pointer hover:bg-primary-50/30">
									{{ getAssetName(amount.unit) }} | +{{ BigNumber(amount.quantity).toFormat() }}
								</span>
							</TooltipTrigger>
							<TooltipContent>
								<p>{{ amount.unit }}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>

					<div
						class="text-xs text-primary-500 p-1.5 px-2.5 bg-primary-50 rounded hover:cursor-pointer hover:bg-primary-50/30"
						@click="isCollapsedAssets = !isCollapsedAssets"
						v-if="utxo.output.amount.length > 3"
					>
						<span v-if="isCollapsedAssets">+{{ utxo.output.amount.length - 3 }} more</span>
						<span v-else>Hide</span>
					</div>
				</div>
			</div>
		</CardContent>
	</Card>
</template>

<style lang="scss" scoped>
	.uxo-item {
		&:hover {
			.add-btn {
				border: 1px solid var(--color-border);
				width: 40px;
			}
		}
	}
</style>
