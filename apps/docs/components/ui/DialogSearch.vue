<template>
	<slot>
		<UButton icon="i-heroicons-magnifying-glass" variant="ghost" size="sm" color="secondary" @click="isOpen = true" class="dark:hover:bg-gray-700">
			<span class="hidden sm:inline">
				{{ $t('common.search') }}
			</span>
		</UButton>
	</slot>
	<UModal v-model="isOpen">
		<UCommandPalette
			ref="commandPaletteRef"
			:groups="groups"
			:autoselect="false"
			:ui="ui"
			command-attribute="title"
			@update:model-value="onSelect"
			:placeholder="`${$t('common.search')}...`"
		/>
	</UModal>
</template>

<script setup lang="ts">
	const isOpen = defineModel('open', { type: Boolean, default: false })

	import type { UCommandPalette } from '#components'
	import MiniSearch from 'minisearch'

	const query = ref('')
	const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('content'))
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

	const commandPaletteRef = ref<InstanceType<typeof UCommandPalette> | null>()

	watch(
		() => commandPaletteRef.value?.query,
		q => {
			query.value = q || ''
		}
	)
	const router = useRouter()

	const groups = computed(() => {
		if (!query.value) {
			const navigationRs = toValue(navigation.value || []).map(item => ({
				key: item.stem || item.title,
				label: item.title,
				commands: (item.children || []).map(child => ({
					title: child.title,
					id: child.path,
					icon: 'i-heroicons-document-text',
					to: child.path
				}))
			}))
			return navigationRs
		} else {
			if (result.value.length) {
				// return result.value.map(
				return [
					{
						key: 'query_result',
						label: `Search Result for “${query.value}”`,
						commands: result.value.map(item => ({
							title: item.title,
							id: item.id,
							icon: 'i-heroicons-document-text',
							suffix: item.content,
							to: item.id
						}))
					}
				]
			} else {
				return []
			}
		}
	})

	function onSelect(option: any) {
		if (option.click) {
			option.click()
		} else if (option.to) {
			router.push(option.to)
		} else if (option.href) {
			window.open(option.href, '_blank')
		}
		isOpen.value = false
	}

	const ui = {
		wrapper: 'flex flex-col flex-1 min-h-0 bg-gray-50 dark:bg-gray-800',
		container: 'overflow-y-auto min-h-40 max-h-80',
		input: {
			wrapper: 'relative flex items-center mx-3 py-3',
			base:
				'w-full rounded border-2 border-primary-500 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-0 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300',
			padding: 'px-4',
			height: 'h-14',
			size: 'text-lg',
			icon: {
				base: 'pointer-events-none absolute left-3 text-primary-500 dark:text-primary-400',
				size: 'h-6 w-6'
			}
		},
		group: {
			wrapper: 'p-3 relative ',
			label: '-mx-3 px-3 -mt-4 mb-2 py-1 text-sm font-semibold text-primary-500 dark:text-primary-400 font-semibold sticky top-0 bg-gray-50 dark:bg-gray-800 z-10',
			container: 'space-y-1',
			command: {
				base: 'flex justify-between select-none items-center rounded px-2 py-4 gap-2 relative font-medium text-sm group shadow',
				active: 'bg-primary-500/80 dark:bg-primary-400 text-white',
				inactive: 'bg-white dark:bg-gray-800',
				label: 'flex flex-col min-w-0 items-start font-semibold',
				suffix: 'text-xs inline-block w-full text-inherit opacity-80',
				icon: {
					base: 'flex-shrink-0 w-6 h-6',
					active: 'text-white',
					inactive: 'text-gray-400 dark:text-gray-500'
				}
			}
		},
		emptyState: {
			wrapper: 'flex flex-col items-center justify-center flex-1 py-9',
			label: 'text-sm text-center text-gray-600 dark:text-gray-300',
			queryLabel: 'text-lg text-center text-gray-600 dark:text-gray-300',
			icon: 'w-12 h-12 mx-auto text-gray-400 dark:text-gray-300 mb-4'
		}
	}
</script>
