<script setup lang="ts">
	import type { HTMLAttributes } from 'vue'
	import { cn } from '~/lib/utils'

	const props = defineProps<{
		class?: HTMLAttributes['class']
	}>()
</script>

<template>
	<div
		data-slot="input-group"
		role="group"
		:class="
			cn(
				// Layout
				'relative flex w-full items-center',
				// Sizing
				'h-9 min-w-0',
				// Border & Shape
				'rounded-md border border-input',
				// Background
				'dark:bg-input/30',
				// Shadow & Transitions
				'shadow-xs transition-[color,box-shadow]',
				// Outline
				'outline-none',
				// Group Identifier
				'group/input-group',
				// Textarea Height Adjustment
				'has-[>textarea]:h-auto',
				// Inline Alignment Variants
				'has-[>[data-align=inline-start]]:[&>input]:pl-2',
				'has-[>[data-align=inline-end]]:[&>input]:pr-2',
				// Block Alignment Variants
				'has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col',
				'has-[>[data-align=block-start]]:[&>input]:pb-3',
				'has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col',
				'has-[>[data-align=block-end]]:[&>input]:pt-3',
				// Focus State
				'has-[[data-slot=input-group-control]:focus-visible]:border-primary-200',
				// 'has-[[data-slot=input-group-control]:focus-visible]:ring-1',
				// Autofill Styles (Chrome, Safari, Edge)
				'[&>input]:autofill:!bg-transparent',
				'[&>input]:autofill:!text-foreground',
				props.class
			)
		"
	>
		<slot />
	</div>
</template>
