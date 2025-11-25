<template>
	<template v-if="pageData">
		<ContentRenderer :value="pageData" v-if="pageData.body.value.length" class="" />
		<div class="py-16 text-center" v-else>
			<UIcon name="i-heroicons-document" class="mx-auto mb-4 h-16 w-16 text-gray-400" />
			<h1 class="mb-2 text-2xl font-bold text-gray-700 dark:text-gray-300">Content Coming Soon</h1>
			<p class="mb-6 text-gray-600 dark:text-gray-400">This documentation page is being written. Check back soon!</p>
			<div class="flex justify-center gap-4">
				<UButton to="/" variant="outline" icon="i-heroicons-arrow-left"> Back to Home </UButton>
				<UButton to="https://github.com/Vtechcom/hydra-sdk/issues" target="_blank" icon="i-simple-icons-github"> Request Documentation </UButton>
			</div>
		</div>
	</template>
	<!-- <div class="py-16 text-center" v-else-if="status === 'pending'">
		<UIcon name="i-heroicons-arrow-path" class="mx-auto mb-4 h-16 w-16 animate-spin text-gray-400" />
		<h1 class="mb-2 text-2xl font-bold text-gray-700 dark:text-gray-300">Loading...</h1>
	</div> -->
	<div class="py-16 text-center" v-else>
		<UIcon name="i-heroicons-document-magnifying-glass" class="mx-auto mb-4 h-16 w-16 text-gray-400" />
		<h1 class="mb-2 text-2xl font-bold text-gray-700 dark:text-gray-300">Page Not Found</h1>
		<p class="mb-6 text-gray-600 dark:text-gray-400">The documentation page you're looking for doesn't exist.</p>
		<UButton to="/" icon="i-heroicons-arrow-left"> Back to Home </UButton>
	</div>
</template>

<script setup lang="ts">
	definePageMeta({
		layout: 'docs'
	})

	const route = useRoute()
	const slug = route.params.slug as string[] | undefined
	const { data: pageData } = await useAsyncData(`docs-${slug}`, () => queryCollection('content').path(route.path).first())

	const { tableOfContents } = useToc()

	const { locale } = useI18n()

	watchEffect(() => {
		if (!pageData.value || !pageData.value.body.toc) {
			tableOfContents.value = []
			return
		}
		const links = pageData.value.body.toc.links
		const linkToToc = (link: Link) => {
			return {
				id: link.id,
				text: link.text,
				level: link.depth
			}
		}
		type Link = { id: string; text: string; depth: number; children?: Link[] }
		const flattenedLinks = links.reduce(
			(acc, link) => {
				acc.push(linkToToc(link))
				if (link.children) {
					acc.push(...link.children.map(linkToToc))
				}
				return acc
			},
			[] as Array<{ id: string; text: string; level: number }>
		)
		tableOfContents.value = flattenedLinks
		// tableOfContents.value =
		// 	pageData.value?.body.toc.links.map(link => ({
		// 		id: link.id,
		// 		text: link.text,
		// 		level: link.depth
		// 	})) || []
	})

	useSeoMeta({
		title: pageData.value?.title,
		description: pageData.value?.description
	})

	// Only define OG image on server-side to avoid client-only context error
	if (import.meta.server) {
		defineOgImageComponent('DocContent', {
			title: pageData.value?.title || 'Hydra SDK Documentation',
			description: pageData.value?.description || 'Hydra SDK Documentation',
			toc: tableOfContents.value || [],
			locale: locale.value || 'en'
		})
	}
</script>
