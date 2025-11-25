<script setup lang="ts">
	import type { TooltipContentEmits, TooltipContentProps } from 'reka-ui'
	import type { HTMLAttributes } from 'vue'
	import { reactiveOmit } from '@vueuse/core'
	import { TooltipContent, TooltipPortal, useForwardPropsEmits } from 'reka-ui'
	import { cn } from '~/lib/utils'

	defineOptions({
		inheritAttrs: false
	})

	const props = withDefaults(defineProps<TooltipContentProps & { class?: HTMLAttributes['class'] }>(), {
		sideOffset: 4
	})

	const emits = defineEmits<TooltipContentEmits>()

	const delegatedProps = reactiveOmit(props, 'class')

	const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
	<TooltipPortal>
		<TooltipContent
			v-bind="{ ...forwarded, ...$attrs }"
			:class="
				cn(
					// Z-index & Overflow
					'z-50 overflow-hidden',
					// Shape & Sizing
					'rounded-md px-3 py-1.5',
					// Typography
					'text-xs',
					// Colors
					'bg-primary text-primary-foreground',
					// Animations - Open
					'animate-in fade-in-0 zoom-in-95',
					// Animations - Close
					'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
					// Slide Animations by Side
					'data-[side=bottom]:slide-in-from-top-2',
					'data-[side=left]:slide-in-from-right-2',
					'data-[side=right]:slide-in-from-left-2',
					'data-[side=top]:slide-in-from-bottom-2',
					props.class
				)
			"
		>
			<slot />
		</TooltipContent>
	</TooltipPortal>
</template>
