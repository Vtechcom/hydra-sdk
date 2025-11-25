<script lang="ts" setup>
	import { Deserializer, ParserUtils } from '@hydra-sdk/core'
	import type { TxOutputJson } from './interface'
	import { cn } from '~/lib/utils'

	const props = defineProps<{
		index: number
		output: TxOutputJson
	}>()

	const emits = defineEmits<{
		(e: 'remove', index: number): void
	}>()

	const output = toRef(props, 'output')
	const datumType = ref<'datumhash' | 'inlinedatum'>('datumhash')

	const advancedMode = computed({
		get: () => {
			return output.value.datum !== undefined || output.value.inlineDatum !== undefined
		},
		set: (val: boolean) => {
			if (!val) {
				output.value.datum = undefined
				output.value.inlineDatum = undefined
			} else {
				if (datumType.value === 'datumhash') {
					output.value.datum = ''
					output.value.inlineDatum = undefined
				} else {
					output.value.inlineDatum = ''
					output.value.datum = undefined
				}
			}
		}
	})

	const datumValue = computed<string | null>({
		get: () => {
			if (!advancedMode.value) return null
			if (datumType.value === 'datumhash') {
				return output.value.datum || ''
			} else {
				return output.value.inlineDatum || ''
			}
		},
		set: val => {
			if (!advancedMode.value) return
			if (val === null) {
				output.value.datum = undefined
				output.value.inlineDatum = undefined
				return
			} else {
				if (datumType.value === 'datumhash') {
					output.value.datum = val
					output.value.inlineDatum = undefined
				} else {
					output.value.inlineDatum = val
					output.value.datum = undefined
				}
			}
		}
	})
	watch(datumType, newType => {
		if (!advancedMode.value) return
		if (newType === 'datumhash') {
			datumValue.value = output.value.inlineDatum || ''
		} else {
			datumValue.value = output.value.datum || ''
		}
	})

	onMounted(() => {
		if (output.value.inlineDatum !== undefined) {
			datumType.value = 'inlinedatum'
			datumValue.value = output.value.inlineDatum
		} else if (output.value.datum !== undefined) {
			datumType.value = 'datumhash'
			datumValue.value = output.value.datum
		}
	})

	const invalidDatum = computed(() => {
		if (!advancedMode.value) return false
		try {
			if (!datumValue.value) return false
			Deserializer.deserializePlutusData(datumValue.value)
			return false
		} catch (e) {
			console.error('Invalid datum format:', e)
			return true
		}
	})

	const getAssetName = (unit: string) => {
		return ParserUtils.hexToString(Deserializer.deserializeAssetUnit(unit).assetName)
	}

	const toAda = (lovelace: string) => {
		if (!lovelace || isNaN(Number(lovelace))) return ''
		return (Number(lovelace) / 1_000_000).toString()
	}

	const toLovelace = (ada: string | number) => {
		if (!ada || isNaN(Number(ada))) return ''
		return Math.floor(Number(ada) * 1_000_000).toString()
	}

	const onChangeLovelace = (value: string) => {
		if (!value || isNaN(Number(value)) || BigInt(value) < 0n) {
			value = '0'
		}
	}
</script>

<template>
	<div class="p-1 border rounded-lg space-y-1 relative">
		<div class="absolute top-0 right-0 text-[10px] select-none">
			<button
				:class="
					cn(
						'flex items-center justify-center',
						'p-0.5',
						'border-b border-l',
						'rounded-bl-[6px] rounded-tr-[10px]',
						'bg-secondary-50',
						'transition-colors hover:cursor-pointer hover:text-error-400 hover:bg-secondary-100'
					)
				"
				@click="$emit('remove', props.index)"
			>
				<Icon name="mdi:close-box" size="12" class="" />
			</button>
		</div>
		<Input v-model="output.address" placeholder="addr..." type="text" class="" />
		<div class="flex justify-between items-center space-x-1">
			<Input
				class="ml-auto"
				:model-value="toAda(output.amount[0].quantity)"
				@update:model-value="
					value => {
						output.amount[0].quantity = toLovelace(value)
						onChangeLovelace(output.amount[0].quantity)
					}
				"
				type="text"
				placeholder="ADA"
			>
			</Input>

			<Button variant="outline" class="h-9" size="sm" @click="output.amount.push({ unit: '', quantity: '' })">
				<Icon name="mdi:plus" size="16" />
				<span class="text-xs">Assets</span>
			</Button>
		</div>
		<div class="flex flex-col space-y-1 pl-8">
			<div v-for="(amount, amtIndex) in output.amount.slice(1)" :key="`${index}-unit-${amount.unit}-${amtIndex}`" :data-slot="`${index}-unit-${amount.unit}-${amtIndex}`">
				<div class="flex items-center space-x-1 w-full">
					<div class="flex flex-col space-y-1 grow">
						<InputGroup class="h-6">
							<InputGroupInput v-model="amount.unit" placeholder="unit" type="text" class="h-6 !text-[10px] !leading-3" />
							<InputGroupAddon align="inline-end">
								<InputGroupText class="!text-[10px] !leading-3 p-0">{{ getAssetName(amount.unit) }}</InputGroupText>
							</InputGroupAddon>
						</InputGroup>
						<Input v-model="amount.quantity" placeholder="quantity" type="text" class="h-6 !text-[10px] leading-3" />
					</div>
					<Button variant="ghost" class="h-7 px-1 hover:text-error-400" size="sm" @click="output.amount.splice(amtIndex + 1, 1)">
						<Icon name="mdi:delete-circle" size="16" />
					</Button>
				</div>
			</div>
		</div>
		<div class="flex flex-col">
			<div class="flex items-center space-x-1">
				<Checkbox :id="`advancedMode-output-${index}`" class="size-3" v-model="advancedMode" />
				<label :for="`advancedMode-output-${index}`" class="text-xs leading-3 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"> datum mode </label>
				<TooltipProvider>
					<Tooltip :delay-duration="100">
						<TooltipTrigger class="flex">
							<Icon name="ic:baseline-info" size="14" class="inline-block text-primary-200 hover:cursor-help" />
						</TooltipTrigger>
						<TooltipContent class="bg-primary-100">
							<p>
								DatumHash: only the hash of the datum is stored on-chain, and the actual datum is stored off-chain.
								<br />
								InlineDatum: the actual datum is stored directly on-chain within the transaction output.
							</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
			<InputGroup class="mt-2" :class="cn('border', { '!border-error-400': invalidDatum })" v-show="advancedMode">
				<InputGroupTextarea
					v-model="datumValue"
					:placeholder="'Enter datum cbor hex string'"
					:class="cn('!text-xs placeholder:text-xs py-1 px-2', invalidDatum ? 'text-error-400 ' : '')"
				/>
				<InputGroupAddon align="block-start" class="p-0">
					<DropdownMenu>
						<DropdownMenuTrigger as-child>
							<InputGroupButton variant="ghost" class="!pr-1.5 text-xs rounded-md">
								{{ datumType }}
								<Icon name="mdi:chevron-down" size="16" />
							</InputGroupButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" side="right" class="p-0.5">
							<DropdownMenuRadioGroup v-model="datumType">
								<DropdownMenuRadioItem value="datumhash" size="sm"> DatumHash </DropdownMenuRadioItem>
								<DropdownMenuRadioItem value="inlinedatum" size="sm"> InlineDatum </DropdownMenuRadioItem>
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</InputGroupAddon>
			</InputGroup>
		</div>
	</div>
</template>

<style lang="scss" scoped></style>
