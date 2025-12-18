<script lang="ts" setup>
	import MarkdownIt from 'markdown-it'

	const props = defineProps<{
		role: 'user' | 'assistant' | 'system'
		content: string
		createdAt?: string
		isDone?: boolean
	}>()

	const colorMode = useColorMode()
	const highlighter = await getShikiHighlighter()

	onMounted(async () => {
		// Chỉ chạy ở client-side
	})

	const markdown = new MarkdownIt({
		html: true,
		breaks: true,
		typographer: true,

		highlight(str, lang, attrs) {
			try {
				return highlighter.highlight(str, {
					lang: lang || 'markdown',
					theme: colorMode.value === 'dark' ? 'github-dark' : 'github-light'
				})
			} catch (err) {
				console.log('>>> / markdown.ts:23 / err:', err)

				return str
			}
		}
	})

	const renderedHtml = computed(() => {
		return markdown.render(props.content || '')
	})
</script>

<template>
	<Suspense suspensible>
		<div :class="['max-w-[90%] rounded-md px-3 py-2', props.role === 'user' ? 'text-white bg-violet-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200']">
			<div class="text-sm">
				<div class="custom-msg prose text-gray-800 dark:text-gray-200" v-html="renderedHtml"></div>
				<!-- <MDCRenderer :body="ast.body" :data="ast.data" v-if="ast && props.isDone" /> -->
			</div>
			<p v-if="props.createdAt" class="mt-1 text-right text-[10px] opacity-60">{{ useDateFormat(props.createdAt, 'HH:mm:ss') }}</p>
		</div>
	</Suspense>
</template>

<style lang="scss">
	.custom-msg {
		overflow-x: auto;
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
			font-size: 16px;
			color: inherit;
		}
		p {
			margin: 0 0 8px 0 !important;
		}
		pre {
			background-color: var(--shiki-bg) !important;
			border-radius: 0.375rem;
			padding: 1rem;
			overflow-x: auto;
			margin: 2px 0 8px 0 !important;
			code {
				background: none !important;
				padding: 0 !important;
				font-size: 14px !important;
			}
		}
		strong {
			color: inherit;
			font-weight: 700;
			line-height: 1.5;
		}

		code {
			font-size: 12px;
			padding-bottom: 0px;
		}
		code:is(.dark *) {
			@apply border-gray-700 bg-gray-800 text-gray-300;
		}

		ul {
			margin: 4px 0;
			padding-left: 12px;
			li {
				padding-left: 0;
			}
		}
	}
</style>
