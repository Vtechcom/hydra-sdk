<script setup lang="ts">
	import type { DropdownMenuRadioItemEmits, DropdownMenuRadioItemProps } from 'reka-ui'
	import type { HTMLAttributes } from 'vue'
	import { reactiveOmit } from '@vueuse/core'
	import { Circle } from 'lucide-vue-next'
	import { DropdownMenuItemIndicator, DropdownMenuRadioItem, useForwardPropsEmits } from 'reka-ui'
	import { cn } from '~/lib/utils'

	const props = defineProps<
		DropdownMenuRadioItemProps & {
			class?: HTMLAttributes['class']
			size?: 'sm' | 'default'
		}
	>()

	const emits = defineEmits<DropdownMenuRadioItemEmits>()

	const delegatedProps = reactiveOmit(props, 'class')

	const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
	<DropdownMenuRadioItem
		v-bind="forwarded"
		:class="
			cn(
				// Layout & Positioning
				'relative flex items-center',
				// Spacing
				'py-1.5 pl-8 pr-2',
				// Appearance
				'rounded-sm text-sm',
				// Interaction
				'cursor-default select-none outline-none transition-colors',
				// Focus state
				'focus:bg-accent focus:text-accent-foreground',
				// Disabled state
				'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
				// Custom class
				// Size variants
				props.size === 'sm' ? 'text-xs py-1.5 pl-6 pr-2' : 'text-sm py-1.5 pl-8 pr-2',
				props.class
			)
		"
	>
		<span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
			<DropdownMenuItemIndicator>
				<Circle :class="cn('h-4 w-4 fill-current', props.size === 'sm' ? 'h-2 w-2' : 'h-4 w-4')" />
			</DropdownMenuItemIndicator>
		</span>
		<slot />
	</DropdownMenuRadioItem>
</template>
