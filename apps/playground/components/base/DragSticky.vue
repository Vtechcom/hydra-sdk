<script lang="ts" setup>
	import { cn } from '~/lib/utils'

	const props = defineProps<{
		class?: string
	}>()
</script>

<template>
	<div :class="cn('absolute z-20 top-1 right-1 vue-draggable-handle', props.class)">
		<button class="p-0.5 shadow-md bg-white border flex items-center justify-center hover:border-primary hover:bg-secondary hover:cursor-move">
			<Icon name="mdi:cursor-move" size="12" class="text-primary" />
		</button>
	</div>
</template>

<style lang="scss" scoped></style>
