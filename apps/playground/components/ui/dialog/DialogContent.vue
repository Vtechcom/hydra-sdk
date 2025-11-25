<script setup lang="ts">
	import type { DialogContentEmits, DialogContentProps } from 'reka-ui'
	import type { HTMLAttributes } from 'vue'
	import { reactiveOmit } from '@vueuse/core'
	import { X } from 'lucide-vue-next'
	import { DialogClose, DialogContent, DialogOverlay, DialogPortal, useForwardPropsEmits } from 'reka-ui'
	import { cn } from '~/lib/utils'

	const props = defineProps<DialogContentProps & { class?: HTMLAttributes['class'] }>()
	const emits = defineEmits<DialogContentEmits>()

	const delegatedProps = reactiveOmit(props, 'class')

	const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
	<DialogPortal>
		<DialogOverlay class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
		<DialogContent
			v-bind="forwarded"
			:class="
				cn(
					// Position & Layout
					'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
					'grid gap-4',
					// Z-index & Sizing
					'z-50 w-full max-w-lg',
					// Border & Background
					'border bg-background',
					// Spacing & Shadow
					'p-6 shadow-lg',
					// Duration
					'duration-200',
					// Animations - Open
					'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
					'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
					// Animations - Close
					'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
					'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
					// Responsive
					'sm:rounded-lg',
					props.class
				)
			"
		>
			<slot />

			<DialogClose
				class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
			>
				<X class="w-4 h-4" />
				<span class="sr-only">Close</span>
			</DialogClose>
		</DialogContent>
	</DialogPortal>
</template>
