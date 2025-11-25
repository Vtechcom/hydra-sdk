<template>
	<div class="relative mb-3 overflow-hidden font-tiemposText last:mb-0">
		<div class="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-gray-50 px-4 py-1 pr-1 dark:border-gray-700 dark:bg-gray-800">
			<span class="!font-mono text-xs font-medium text-gray-600 dark:text-gray-400">{{ language }}</span>
			<button
				@click="copyCode"
				class="flex items-center rounded p-1 transition-colors hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
				:class="{ 'text-green-600': isCopied }"
			>
				<UIcon v-if="!isCopied" name="ic:outline-copy-all" class="text-gray-600" mode="svg" />
				<UIcon v-else name="i-heroicons-check" mode="svg" />
			</button>
		</div>
		<!-- <Shiki :lang="language" :code="props.code" as="span" /> -->
		<client-only>
			<span v-html="html"></span>
			<template #fallback>
				<pre class="m-0 rounded-t-none border border-gray-200 px-4 py-2 dark:border-gray-700"><code>{{ props.code }}</code></pre>
			</template>
		</client-only>
		<template v-if="language === 'mermaid'">
			<client-only>
				<UiMermaidGraph class="flex justify-center" :graph="code.trim()"> </UiMermaidGraph>
			</client-only>
		</template>
	</div>
</template>

<script setup lang="ts">
	interface Props {
		code: string
		language?: string
		filename?: string
	}

	const props = withDefaults(defineProps<Props>(), {
		language: 'typescript',
		filename: ''
	})

	const { copy, copied } = useClipboard()
	const isCopied = ref(false)

	const language = computed<any>(() => {
		return props.language?.toLowerCase() || 'text'
	})
	const colorMode = useColorMode()

	const highlighter = await getShikiHighlighter()
	const html = ref(
		highlighter.highlight(props.code, {
			lang: language.value,
			theme: colorMode.value === 'dark' ? 'github-dark' : 'github-light'
		})
	)

	const updateHighlight = () => {
		if (!highlighter) return

		const theme = colorMode.value === 'dark' ? 'github-dark' : 'github-light'
		html.value = highlighter.highlight(props.code, {
			lang: language.value,
			theme
		})
	}

	// Chỉ chạy ở client-side
	onMounted(async () => {
		updateHighlight()
	})

	// Watch color mode thay đổi và update highlight
	watch(
		() => colorMode.value,
		() => {
			updateHighlight()
		}
	)

	const copyCode = async () => {
		await copy(props.code)
		isCopied.value = true
		setTimeout(() => {
			isCopied.value = false
		}, 2000)
	}
</script>
