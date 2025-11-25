<template>
	<div class="container mx-auto px-4 py-10">
		<div class="mb-8 text-center">
			<h1 class="text-3xl font-bold text-gray-600 dark:text-gray-200">{{ t('glossary.title') }}</h1>
			<p class="mt-2 text-gray-600 dark:text-gray-400">{{ t('glossary.intro') }}</p>
		</div>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<UCard v-for="(item, key) in terms" :key="key">
				<template #header>
					<div class="flex items-center justify-between">
						<div class="text-lg font-semibold text-gray-600 dark:text-gray-200">{{ item.term?.body?.static }}</div>
						<UBadge variant="soft">{{ key }}</UBadge>
					</div>
				</template>
				<p class="text-gray-700 dark:text-gray-300">{{ item.desc?.body?.static }}</p>
			</UCard>
		</div>
	</div>
</template>

<script setup lang="ts">
	const { t, tm } = useI18n()

	// tm() returns messages in their type-agnostic form (object), useful for lists
	const terms = computed(() => tm('glossary.terms') as Record<string, { term?: { body: { static: string } }; desc?: { body: { static: string } } }>)

	useSeoMeta({
		title: `${t('glossary.title')} - Hydra SDK`,
		description: t('glossary.intro') as string
	})
</script>
