<script setup lang="ts">
	import MiniSearch from 'minisearch'

	const query = ref('')
	const { data } = await useAsyncData('search', () => queryCollectionSearchSections('content'))

	const miniSearch = new MiniSearch({
		fields: ['title', 'content'],
		storeFields: ['title', 'content'],
		searchOptions: {
			prefix: true,
			fuzzy: 0.2
		}
	})

	// Add data to the MiniSearch instance
	miniSearch.addAll(toValue(data.value || []))
	const result = computed(() => miniSearch.search(toValue(query)))

	const { t } = useI18n()
	const placeholder = computed(() => t('common.search') + '...')
</script>

<template>
	<UContainer class="w-full p-0">
		<UInput v-model="query" :placeholder="placeholder" />
		<ul class="mt-4 max-h-80 space-y-2 overflow-y-auto">
			<li v-for="link of result" :key="link.id" class="mt-2">
				<NuxtLink :to="link.id">{{ link.title }}</NuxtLink>
				<p class="line-clamp-3 text-xs text-gray-500">{{ link.content }}</p>
			</li>
		</ul>
	</UContainer>
</template>
