<template>
	<div :class="['my-4 rounded-lg border p-4', alertClasses]">
		<div class="flex items-start">
			<UIcon :name="alertIcon" :class="['mr-3 mt-0.5 h-5 w-5 flex-shrink-0', iconClasses]" />
			<div class="flex-1">
				<slot />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	interface Props {
		type?: 'info' | 'warning' | 'error' | 'success'
	}

	const props = withDefaults(defineProps<Props>(), {
		type: 'info'
	})

	const alertClasses = computed(() => {
		switch (props.type) {
			case 'warning':
				return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
			case 'error':
				return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
			case 'success':
				return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
			default: // info
				return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
		}
	})

	const iconClasses = computed(() => {
		switch (props.type) {
			case 'warning':
				return 'text-yellow-600 dark:text-yellow-400'
			case 'error':
				return 'text-red-600 dark:text-red-400'
			case 'success':
				return 'text-green-600 dark:text-green-400'
			default: // info
				return 'text-blue-600 dark:text-blue-400'
		}
	})

	const alertIcon = computed(() => {
		switch (props.type) {
			case 'warning':
				return 'i-heroicons-exclamation-triangle'
			case 'error':
				return 'i-heroicons-x-circle'
			case 'success':
				return 'i-heroicons-check-circle'
			default: // info
				return 'i-heroicons-information-circle'
		}
	})
</script>
