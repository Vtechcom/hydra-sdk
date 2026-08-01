<script lang="ts" setup>
	import { cn } from '~/lib/utils'

	const props = withDefaults(
		defineProps<{
			title: string
			icon?: string
			/** Small muted string after the title — counts, totals, status. */
			meta?: string
			/** Body scrolls instead of growing (used by the tall workspace columns). */
			scroll?: boolean
			class?: string
			bodyClass?: string
		}>(),
		{ scroll: false }
	)
</script>

<template>
	<section :class="cn('flex min-h-0 flex-col rounded-lg border bg-card', props.class)">
		<header class="flex shrink-0 items-center gap-2 border-b px-3 py-2">
			<Icon v-if="props.icon" :name="props.icon" size="15" class="shrink-0 text-primary" />
			<h2 class="text-sm font-semibold">{{ props.title }}</h2>
			<span v-if="props.meta" class="truncate font-mono text-[11px] text-muted-foreground">{{ props.meta }}</span>
			<div class="ml-auto flex shrink-0 items-center gap-1">
				<slot name="actions" />
			</div>
		</header>
		<div :class="cn('min-h-0 flex-1 p-3', props.scroll && 'overflow-y-auto scroll-bar-primary', props.bodyClass)">
			<slot />
		</div>
	</section>
</template>
