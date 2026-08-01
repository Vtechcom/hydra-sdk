<script lang="ts" setup>
	import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
	import { cn } from '~/lib/utils'

	const props = defineProps<{ class?: string }>()

	const mainStore = useMainStore()
	const { network, networkInfo, networks } = storeToRefs(mainStore)
</script>

<template>
	<!-- SelectRoot renders no element of its own, so the class goes on a wrapper. -->
	<div :class="cn('flex items-center gap-1', props.class)">
		<Select v-model="network">
			<SelectTrigger class="h-8 flex-1 text-xs">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem v-for="item in networks" :key="item.networkId" :value="item.name" class="text-xs">{{ item.label }}</SelectItem>
			</SelectContent>
		</Select>

		<TooltipProvider>
			<Tooltip :delay-duration="150">
				<TooltipTrigger class="inline-flex items-center justify-center text-muted-foreground hover:cursor-help hover:text-foreground">
					<Icon name="lucide:info" size="15" />
				</TooltipTrigger>
				<TooltipContent align="end" class="space-y-0.5">
					<p class="text-xs font-semibold">{{ networkInfo.label }}</p>
					<p class="font-mono text-[11px]">network id: {{ networkInfo.networkId }}</p>
					<p class="font-mono text-[11px]">magic: {{ networkInfo.networkMagic }}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	</div>
</template>
