<script setup lang="ts">
	import type { HTMLAttributes } from 'vue'
	import { Primitive, type PrimitiveProps } from 'reka-ui'
	import { cn } from '@/lib/utils'
	import { type ButtonVariants, buttonVariants } from '.'

	interface Props extends PrimitiveProps {
		variant?: ButtonVariants['variant']
		size?: ButtonVariants['size']
		class?: HTMLAttributes['class']
		loading?: boolean
	}

	const props = withDefaults(defineProps<Props>(), {
		as: 'button'
	})
</script>

<template>
	<Primitive data-slot="button" :as="as" :as-child="asChild" :class="cn(buttonVariants({ variant, size }), props.class)" :disabled="loading">
		<transition name="fade">
			<span v-show="loading" class="inline-block">
				<span class="block h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"></span>
			</span>
		</transition>
		<slot />
	</Primitive>
</template>
