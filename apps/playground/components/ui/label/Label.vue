<script setup lang="ts">
	import type { LabelProps } from 'reka-ui'
	import type { HTMLAttributes } from 'vue'
	import { reactiveOmit } from '@vueuse/core'
	import { Label } from 'reka-ui'
	import { cn } from '~/lib/utils'

	const props = defineProps<LabelProps & { class?: HTMLAttributes['class'] }>()

	const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
	<Label
		data-slot="label"
		v-bind="delegatedProps"
		:class="
			cn(
				// Layout & Alignment
				'flex items-center gap-2',
				// Typography
				'text-sm font-medium leading-none',
				// Interaction
				'select-none',
				// Group Disabled States
				'group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
				// Peer Disabled States
				'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
				props.class
			)
		"
	>
		<slot />
	</Label>
</template>
