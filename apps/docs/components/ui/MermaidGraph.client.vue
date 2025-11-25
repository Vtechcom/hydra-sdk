<script setup lang="ts">
	const props = defineProps<{ graph: string }>()

	const graphEl = ref<HTMLDivElement | null>(null)
	const svg = ref('')
	const renderError = ref('')

	onMounted(async () => {
		const { $mermaid } = useNuxtApp()
		try {
			const { svg: renderedSvg } = await ($mermaid as any).render('graph-' + Math.random().toString(36).substring(2, 9), props.graph.trim())
			svg.value = renderedSvg
		} catch (err: any) {
			console.error('Mermaid render error:', err)
			renderError.value = err.message || 'Unknown error'
		}
	})
</script>

<template>
	<div class="mermaid-graph" ref="graphEl" v-html="svg" v-if="!renderError && svg"></div>
	<div v-else class="flex flex-col rounded border border-red-200 bg-red-50 p-4 text-red-700">
		<p class="mb-2 font-semibold">
			Error rendering Mermaid diagram:
			<span class="font-normal">{{ renderError }}</span>
		</p>
		<p class="mt-2 text-xs text-gray-500">Please check the Mermaid syntax.</p>
	</div>
</template>

<style scoped>
	.mermaid-graph {
		overflow-x: auto;
	}
	:deep(.mermaid-graph > svg) {
		margin: 0 auto;
	}
</style>
