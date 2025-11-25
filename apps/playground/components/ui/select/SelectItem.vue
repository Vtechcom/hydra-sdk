<script setup lang="ts">
	import type { SelectItemProps } from 'reka-ui'
	import type { HTMLAttributes } from 'vue'
	import { reactiveOmit } from '@vueuse/core'
	import { Check } from 'lucide-vue-next'
	import { SelectItem, SelectItemIndicator, SelectItemText, useForwardProps } from 'reka-ui'
	import { cn } from '~/lib/utils'

	const props = defineProps<SelectItemProps & { class?: HTMLAttributes['class'] }>()

	const delegatedProps = reactiveOmit(props, 'class')

	const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
	<SelectItem
		v-bind="forwardedProps"
		:class="
			cn(
				// Position & Layout
				'relative flex items-center',
				// Sizing & Spacing
				'w-full py-1.5 pl-2 pr-8',
				// Typography
				'text-sm',
				// Shape
				'rounded-sm',
				// Interaction
				'cursor-default select-none outline-none',
				// Focus States
				'focus:bg-accent focus:text-accent-foreground',
				// Disabled States
				'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
				props.class
			)
		"
	>
		<span class="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
			<SelectItemIndicator>
				<Check class="h-4 w-4" />
			</SelectItemIndicator>
		</span>

		<SelectItemText>
			<slot />
		</SelectItemText>
	</SelectItem>
</template>
