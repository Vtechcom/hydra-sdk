<template>
	<UDropdown :items="languageItems" :ui="{ container: '!w-32 bg-white-100' }" :popper="{ placement: 'bottom-start' }">
		<UButton color="white" variant="ghost" size="sm" class="min-w-0">
			<!-- <template #trailing>
				<Icon :name="currentLocaleIcon" class="h-4 w-4" />
			</template> -->
			<div class="flex items-center space-x-2">
				<span class="hidden text-gray-600 md:inline-block dark:text-gray-300">{{ currentLanguage.label }}</span>
				<span class="text-gray-600 md:hidden dark:text-gray-300">{{ currentLanguage.shortLabel }}</span>
				<Icon :name="currentLanguage.icon" class="size-4" />
			</div>
		</UButton>

		<template #item="{ item }">
			<div class="flex items-center space-x-2">
				<Icon :name="item.icon" class="size-4" />
				<span class="text-gray-600 dark:text-gray-300">{{ item.label }}</span>
			</div>
		</template>
	</UDropdown>
</template>

<script setup lang="ts">
	const { locale, locales } = useI18n()
	const switchLocalePath = useSwitchLocalePath()

	const currentLocale = computed(() => {
		return locales.value.find(l => l.code === locale.value) || locales.value[0]
	})

	const currentLanguage = computed(() => languageItems.value.flat().find(l => l.value === locale.value) || languageItems.value[0][0])

	const languageItems = computed(() => [
		[
			{
				value: 'en',
				label: 'English',
				shortLabel: 'EN',
				icon: 'i-twemoji-flag-united-states',
				click: () => navigateTo(switchLocalePath('en'))
			},
			{
				value: 'vi',
				label: 'Tiếng Việt',
				shortLabel: 'VI',
				icon: 'i-twemoji-flag-vietnam',
				click: () => navigateTo(switchLocalePath('vi'))
			}
		]
	])
</script>
