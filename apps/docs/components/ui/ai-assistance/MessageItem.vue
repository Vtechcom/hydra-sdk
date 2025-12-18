<script lang="ts" setup>
	// import type { MDCParserResult } from '@nuxtjs/mdc'
	// import useMarkdownParser from '~/composables/useMarkdownParser'

	const props = defineProps<{
		role: 'user' | 'assistant' | 'system'
		content: string
		createdAt?: string
		isDone?: boolean
	}>()

	const renderedHtml = computed(() => {
		return md.render(props.content || '')
	})
</script>

<template>
	<Suspense suspensible>
		<div :class="['max-w-[90%] rounded-md px-3 py-2', props.role === 'user' ? 'text-white bg-violet-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200']">
			<div class="text-sm">
				<div class="custom-msg prose" v-html="renderedHtml"></div>
				<!-- <MDCRenderer :body="ast.body" :data="ast.data" v-if="ast && props.isDone" /> -->
			</div>
			<p v-if="props.createdAt" class="mt-1 text-right text-[10px] opacity-60">{{ useDateFormat(props.createdAt, 'HH:mm:ss') }}</p>
		</div>
	</Suspense>
</template>

<style lang="scss">
	.custom-msg {
		line-height: 1.25;
		font-size: 14px;
		hr {
			margin: 8px 0 !important;
		}
		h1,
		h2,
		h3,
		h4,
		h5,
		h6 {
			margin: 0 0 8px 0 !important;
		}
		p {
			margin: 0 0 8px 0 !important;
		}
		pre {
			background-color: var(--shiki-bg) !important;
			border-radius: 0.375rem;
			padding: 1rem;
			overflow-x: auto;
		}
	}
</style>
