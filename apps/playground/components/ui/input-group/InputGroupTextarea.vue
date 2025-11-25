<script setup lang="ts">
	import type { HTMLAttributes } from 'vue'
	import { cn } from '~/lib/utils'
	import { Textarea } from '~/components/ui/textarea'

	const props = defineProps<{
		class?: HTMLAttributes['class']
	}>()
</script>

<template>
	<Textarea
		data-slot="input-group-control"
		:class="
			cn(
				// Layout
				'flex-1',
				// Resize & Shape
				'resize-none rounded-none',
				// Border
				'border-0',
				// Background
				'bg-transparent dark:bg-transparent',
				// Spacing
				'py-3',
				// Shadow
				'shadow-none',
				// Focus States
				'focus-visible:ring-0',
				props.class
			)
		"
	/>
</template>
