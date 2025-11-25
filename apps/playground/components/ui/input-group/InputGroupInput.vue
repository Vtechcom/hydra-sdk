<script setup lang="ts">
	import type { HTMLAttributes } from 'vue'
	import { cn } from '~/lib/utils'
	import { Input } from '~/components/ui/input'

	const props = defineProps<{
		class?: HTMLAttributes['class']
	}>()
</script>

<template>
	<Input
		data-slot="input-group-control"
		:class="
			cn(
				// Layout
				'flex-1',
				// Shape & Border
				'rounded-none border-0',
				// Background
				'bg-transparent dark:bg-transparent',
				// Focus States
				'focus-visible:ring-0 focus-visible:ring-transparent',
				// Ring Offset
				'ring-offset-transparent',
				props.class
			)
		"
	/>
</template>
