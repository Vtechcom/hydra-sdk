<script setup lang="ts">
	import type { HTMLAttributes } from 'vue'
	import { useVModel } from '@vueuse/core'
	import { cn } from '~/lib/utils'

	const props = defineProps<{
		defaultValue?: string | number
		modelValue?: string | number
		class?: HTMLAttributes['class']
	}>()

	const emits = defineEmits<{
		(e: 'update:modelValue', payload: string | number): void
	}>()

	const modelValue = useVModel(props, 'modelValue', emits, {
		passive: true,
		defaultValue: props.defaultValue
	})
</script>

<template>
	<input
		v-model="modelValue"
		data-slot="input"
		:class="
			cn(
				// Layout & Sizing
				'flex h-9 w-full min-w-0',
				// Border & Shape
				'rounded-md border border-input',
				// Background & Colors
				'bg-transparent dark:bg-input/30',
				// Spacing
				'px-3 py-1',
				// Typography
				'text-base md:text-sm',
				// Shadow & Transitions
				'shadow-xs transition-[color,box-shadow]',
				// Outline
				'outline-none',
				// Selection Colors
				'selection:bg-primary selection:text-primary-foreground',
				// Placeholder
				'placeholder:text-muted-foreground',
				// Focus States
				'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
				// ARIA Invalid States
				'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
				'dark:aria-invalid:ring-destructive/40',
				// File Input Styling
				'file:inline-flex file:h-7 file:border-0 file:bg-transparent',
				'file:text-sm file:font-medium file:text-foreground',
				// Disabled States
				'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
				props.class
			)
		"
	/>
</template>
