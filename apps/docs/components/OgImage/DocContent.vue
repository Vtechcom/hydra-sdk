<script setup lang="ts">
	const props = withDefaults(
		defineProps<{
			title?: string
			description?: string
			toc?: Array<{ id: string; text: string; level: number }>
			locale?: string
		}>(),
		{
			title: 'Hydra SDK Documentation',
			description: 'Build powerful decentralized applications on Cardano',
			toc: () => [],
			locale: 'en'
		}
	)

	// Create gradient background based on content type
	const getGradientClasses = computed(() => {
		const title = props.title.toLowerCase()
		if (title.includes('guide') || title.includes('hướng dẫn')) {
			return 'from-emerald-400 via-cyan-400 to-blue-500'
		} else if (title.includes('api') || title.includes('reference')) {
			return 'from-purple-400 via-pink-400 to-red-500'
		} else if (title.includes('config') || title.includes('cấu hình')) {
			return 'from-orange-400 via-amber-400 to-yellow-500'
		} else if (title.includes('change') || title.includes('nhật ký')) {
			return 'from-indigo-400 via-blue-400 to-cyan-500'
		}
		return 'from-blue-400 via-purple-400 to-indigo-600'
	})

	const tocText = computed(() => props.toc.filter(item => item.level == 2).map(item => item.text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')))
	const headerImg = computed(() => {
		if (props.locale === 'vi') {
			return '/images/og-header-vi.png'
		}
		return '/images/og-header.png'
	})
</script>

<template>
	<div class="relative flex h-full w-full flex-col justify-between overflow-hidden bg-gray-100 dark:bg-gray-600" :style="{ padding: '30px 45px' }">
		<img :src="headerImg" alt="Header" srcset="/images/og-header.png" class="w-full object-contain" />

		<!-- <div class="absolute inset-0 -z-10 bg-gradient-to-tr opacity-30 blur-lg" :class="getGradientClasses" /> -->
		<div class="absolute bottom-4 right-4 flex items-center">
			<div style="display: flex; align-items: center; justify-content: center">
				<img src="/logo.png" alt="SDK Logo" srcset="/logo.png" width="32" height="32" :style="{ borderRadius: '8px', overflow: 'hidden' }" />
				<div class="block">
					<p class="text-lg font-semibold text-gray-700 dark:text-gray-300">Hydra SDK</p>
				</div>
			</div>
		</div>
		<div class="m-auto bg-gray-100 px-8 text-left dark:bg-gray-600">
			<h2 class="text-black mb-4 text-4xl font-bold text-gray-800 dark:text-gray-100">{{ props.title }}</h2>
			<p class="text-black text-lg text-gray-800 dark:text-gray-200" v-if="props.description">{{ props.description }}</p>
			<div class="pl-8">
				<div class="text-black mt-2 flex text-sm text-gray-800 dark:text-gray-100" v-for="item in tocText.slice(0, 8)">
					<svg class="-mb-1 mr-2 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
					</svg>
					{{ item }}
				</div>
				<div class="text-black mt-2 flex text-sm text-gray-800 dark:text-gray-100" v-if="tocText.length > 8">
					<svg class="-mb-1 mr-2 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
					</svg>
					...
				</div>
			</div>
		</div>
		<!-- <div class="bg-gray-100 absolute -right-32 -top-32 h-96 w-96 rounded-full" />
		<div class="bg-gray-100 absolute -bottom-24 -left-24 h-64 w-64 rounded-full" /> -->
		<img src="/images/og-footer.png" alt="footer" srcset="/images/og-footer.png" class="w-full object-contain" />
	</div>
</template>
