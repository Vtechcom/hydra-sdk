<script lang="ts" setup>
	import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
	import { cn } from '~/lib/utils'

	const mainStore = useMainStore()
	const { network, networkInfo, networks } = storeToRefs(mainStore)
</script>

<template>
	<Select v-model="network">
		<SelectTrigger class="h-7">
			<SelectValue />
			<template #icon>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger class="inline-flex items-center justify-center">
							<Icon name="mdi:information" class="size-5 text-primary-300 ml-2 hover:cursor-help" />
						</TooltipTrigger>
						<TooltipContent align="end" :align-offset="-24" class="bg-white p-0">
							<Card :class="cn('bg-white p-3')">
								<p class="text-sm font-semibold">{{ networkInfo.label }}</p>
								<p class="text-sm">Network ID: {{ networkInfo.networkId }}</p>
								<p class="text-sm">Network Magic: {{ networkInfo.networkMagic }}</p>
							</Card>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</template>
		</SelectTrigger>
		<SelectContent class="bg-white">
			<SelectItem v-for="item in networks" :key="item.networkId" :value="item.name"> {{ item.label }} </SelectItem>
		</SelectContent>
	</Select>
</template>

<style lang="scss" scoped></style>
