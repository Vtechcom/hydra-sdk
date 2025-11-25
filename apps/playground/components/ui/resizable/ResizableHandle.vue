<script setup lang="ts">
	import type { SplitterResizeHandleEmits, SplitterResizeHandleProps } from 'reka-ui'
	import type { HTMLAttributes } from 'vue'
	import { reactiveOmit } from '@vueuse/core'
	import { GripVertical } from 'lucide-vue-next'
	import { SplitterResizeHandle, useForwardPropsEmits } from 'reka-ui'
	import { cn } from '~/lib/utils'

	const props = defineProps<SplitterResizeHandleProps & { class?: HTMLAttributes['class']; withHandle?: boolean }>()
	const emits = defineEmits<SplitterResizeHandleEmits>()

	const delegatedProps = reactiveOmit(props, 'class')

	const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
	<SplitterResizeHandle
		v-bind="forwarded"
		:class="
			cn(
				// Position & Layout
				'relative flex items-center justify-center',
				// Sizing
				'w-px',
				// Background
				'bg-border',
				// After Pseudo Element
				'after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2',
				// Focus States
				'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1',
				// Vertical Orientation
				'[&[data-orientation=vertical]]:h-px [&[data-orientation=vertical]]:w-full',
				'[&[data-orientation=vertical]]:after:left-0 [&[data-orientation=vertical]]:after:h-1',
				'[&[data-orientation=vertical]]:after:w-full [&[data-orientation=vertical]]:after:-translate-y-1/2',
				'[&[data-orientation=vertical]]:after:translate-x-0',
				// Rotate Handle Icon for Vertical
				'[&[data-orientation=vertical]>div]:rotate-90',
				props.class
			)
		"
	>
		<template v-if="props.withHandle">
			<div class="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
				<GripVertical class="h-2.5 w-2.5" />
			</div>
		</template>
	</SplitterResizeHandle>
</template>
