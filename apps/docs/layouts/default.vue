<template>
	<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
		<!-- Header -->
		<UiHeader container-class="container" />

		<!-- Main Content -->
		<div class="flex">
			<main class="flex-1">
				<slot />
			</main>
			<client-only>
				<UiAiAssistanceSidePanel />
				<UiAiAssistanceToggleBtn class="z-1000 fixed bottom-3 right-3" />
			</client-only>
		</div>

		<!-- Footer -->
		<footer class="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
			<div class="container mx-auto px-4 py-12">
				<div class="grid grid-cols-1 gap-8 md:grid-cols-4">
					<!-- About -->
					<div class="md:col-span-2">
						<div class="mb-4 flex items-center space-x-3">
							<img src="/logo.png" alt="SDK Logo" srcset="/logo.png" class="size-8" />
							<h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">Hydra SDK</h3>
						</div>
						<p class="mb-4 max-w-md text-gray-600 dark:text-gray-400">
							A comprehensive software development kit for building Cardano wallet applications with Hydra Layer 2 integration.
						</p>
						<div class="flex items-center space-x-4">
							<UButton icon="i-simple-icons-github" variant="outline" color="purple" size="sm" target="_blank" to="https://github.com/Vtechcom/hydra-sdk"> GitHub </UButton>
							<UButton icon="i-simple-icons-npm" variant="outline" color="purple" size="sm" target="_blank" to="https://www.npmjs.com/package/@hydra-sdk/core"> NPM </UButton>
						</div>
					</div>

					<!-- Quick Links -->
					<div>
						<h4 class="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{{ t('footer.quickLinks') }}</h4>
						<ul class="space-y-2">
							<li v-for="item in quickLinks" :key="item.to">
								<NuxtLink :to="item.to" class="text-sm text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
									{{ item.label }}
								</NuxtLink>
							</li>
						</ul>
					</div>

					<!-- Resources -->
					<div>
						<h4 class="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{{ t('footer.resources') }}</h4>
						<ul class="space-y-2">
							<li v-for="item in resources" :key="item.href">
								<a :href="item.href" target="_blank" class="text-sm text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
									{{ item.label }}
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div class="mt-8 border-t border-gray-200 pt-8 text-center dark:border-gray-700">
					<p class="text-sm text-gray-500 dark:text-gray-400">© {{ new Date().getFullYear() }} Hydra SDK. {{ t('footer.copyright') }}</p>
				</div>
			</div>
		</footer>
	</div>
</template>

<script setup lang="ts">
	const mobileMenuOpen = ref(false)

	const { t } = useI18n()
	const localePath = useLocalePath()

	const quickLinks = computed(() => [
		{ label: t('footer.installation'), to: localePath('/getting-started/installation') },
		{ label: t('home.quickStart.title'), to: localePath('/getting-started/quick-start') },
		{ label: t('nav.apiReference'), to: localePath('/api/core') },
		{ label: t('nav.hydraBridge'), to: localePath('/api/bridge') },
		{ label: t('nav.examples'), to: localePath('/examples') },
		{ label: t('nav.glossary'), to: localePath('/glossary') }
	])

	const resources = [
		{ label: 'Cardano Developer Portal', href: 'https://developers.cardano.org/' },
		{ label: 'Hydra Head Protocol', href: 'https://hydra.family/head-protocol/' },
		{ label: 'Turborepo', href: 'https://turbo.build/repo' },
		{ label: 'Nuxt.js', href: 'https://nuxt.com/' },
		{ label: 'Vue.js', href: 'https://vuejs.org/' }
	]

	// Close mobile menu when route changes
	const route = useRoute()
	watch(
		() => route.path,
		() => {
			mobileMenuOpen.value = false
		}
	)
</script>
