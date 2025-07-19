<script setup lang="ts">
	import type { HTMLAttributes } from 'vue'
	import { cn } from '@/lib/utils'

	interface SkeletonProps {
		class?: HTMLAttributes['class']
	}

	const props = defineProps<SkeletonProps>()
</script>

<template>
	<div data-slot="skeleton" :class="cn('bg-primary/10 animate-skeleton-pulse rounded-md', props.class)" />
</template>

<style scoped lang="scss">
	@keyframes skeleton-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}

	.animate-skeleton-pulse {
		animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>
