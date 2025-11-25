<script lang="ts" setup>
	import { cn } from '~/lib/utils'

	const props = withDefaults(
		defineProps<{
			name: string
			class?: string
		}>(),
		{
			name: 'resizable-card',
			class: ''
		}
	)
	// const isCollapsed = useSessionStorage(`resizable-card-collapsed.${props.name}`, false)

	const uiStore = useUiStore()

	const isCollapsed = computed({
		get: () => {
			const item = uiStore.getLayoutConfig(props.name)
			if (item) return item.w === item.minW && item.h === item.minH
			return false
		},
		set: (value: boolean) => {
			uiStore.setMinimized(props.name, value)
		}
	})
</script>

<template>
	<Card :class="cn('relative shadow-lg rounded-none', props.class)" data-slot="resizable-card">
		<div class="absolute z-10 top-0.5 right-0.5">
			<div class="flex justify-center items-center space-x-2">
				<button
					class="p-0.5 shadow-md bg-white border flex items-center justify-center hover:border-primary hover:bg-secondary hover:cursor-pointer"
					@click="isCollapsed = !isCollapsed"
				>
					<Icon name="mdi:arrow-collapse" size="12" class="text-primary" v-if="!isCollapsed" />
					<Icon name="mdi:arrow-expand" size="12" class="text-primary" v-if="isCollapsed" />
				</button>
			</div>
		</div>
		<CardContent class="transition-all duration-100 w-full h-full" :class="isCollapsed ? 'p-1' : 'p-4'">
			<transition-group name="resize">
				<div v-show="!isCollapsed" key="expanded">
					<slot />
				</div>
				<div class="w-full h-full" key="collapsed" v-show="isCollapsed">
					<slot name="collapsed"></slot>
				</div>
			</transition-group>
		</CardContent>
	</Card>
</template>

<style lang="scss" scoped>
	.resize-enter-active {
		transition: all 0.1s ease;
	}
	.resize-enter-from,
	.resize-leave-to {
		opacity: 0;
		transform: scale(0.95);
	}
	.resize-enter-to,
	.resize-leave-from {
		opacity: 1;
		transform: scale(1);
	}
</style>
