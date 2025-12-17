<script setup lang="ts">
	const props = withDefaults(
		defineProps<{
			variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
		}>(),
		{
			variant: 'primary'
		}
	)

	const variantClass = computed(() => {
		switch (props.variant) {
			case 'primary':
				return 'bg-blue-100 text-blue-700 dark:bg-blue-600 dark:text-white'
			case 'success':
				return 'bg-green-100 text-green-700 dark:bg-green-500 dark:text-green-950'
			case 'warning':
				return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-400 dark:text-yellow-950'
			case 'danger':
				return 'bg-red-100 text-red-700 dark:bg-red-500 dark:text-red-950'
			default:
				return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
		}
	})
</script>

<template>
	<span class="inline-flex h-6 translate-y-[-1px] items-center whitespace-nowrap rounded-md px-2 align-middle text-xs font-medium" :class="variantClass">
		<slot />
	</span>
</template>
