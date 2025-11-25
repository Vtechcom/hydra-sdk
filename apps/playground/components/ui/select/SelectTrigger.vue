<script setup lang="ts">
	import type { SelectTriggerProps } from 'reka-ui'
	import type { HTMLAttributes } from 'vue'
	import { reactiveOmit } from '@vueuse/core'
	import { ChevronDown } from 'lucide-vue-next'
	import { SelectIcon, SelectTrigger, useForwardProps } from 'reka-ui'
	import { cn } from '~/lib/utils'

	const props = defineProps<SelectTriggerProps & { class?: HTMLAttributes['class'] }>()

	const delegatedProps = reactiveOmit(props, 'class')

	const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
	<SelectTrigger
		v-bind="forwardedProps"
		:class="
			cn(
				// Layout & Alignment
				'flex items-center justify-between text-start',
				// Sizing
				'h-9 w-full px-3 py-2',
				// Typography
				'text-sm whitespace-nowrap',
				// Border & Background
				'rounded-md border border-input bg-transparent',
				// Shadow & Ring
				'shadow-sm ring-offset-background',
				// Focus State
				'focus:outline-none focus:ring-1 focus:ring-ring',
				// Disabled State
				'disabled:cursor-not-allowed disabled:opacity-50',
				// Data States
				'data-[placeholder]:text-muted-foreground',
				// Child Selectors
				'[&>span]:truncate',
				props.class
			)
		"
	>
		<slot />
		<slot name="icon">
			<SelectIcon as-child>
				<ChevronDown class="w-4 h-4 opacity-50 shrink-0" />
			</SelectIcon>
		</slot>
	</SelectTrigger>
</template>
