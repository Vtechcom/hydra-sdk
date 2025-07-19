<script setup lang="ts">
	import type { NumberFieldIncrementProps } from 'reka-ui'
	import type { HTMLAttributes } from 'vue'
	import { reactiveOmit } from '@vueuse/core'
	import { Plus } from 'lucide-vue-next'
	import { NumberFieldIncrement, useForwardProps } from 'reka-ui'
	import { cn } from '@/lib/utils'

	const props = defineProps<NumberFieldIncrementProps & { class?: HTMLAttributes['class'] }>()

	const delegatedProps = reactiveOmit(props, 'class')

	const forwarded = useForwardProps(delegatedProps)
</script>

<template>
	<NumberFieldIncrement
		data-slot="increment"
		v-bind="forwarded"
		:class="cn('absolute top-1/2 right-0 -translate-y-1/2 p-2 disabled:cursor-not-allowed disabled:opacity-20', props.class)"
	>
		<slot>
			<Plus class="h-3 w-3" />
		</slot>
	</NumberFieldIncrement>
</template>
