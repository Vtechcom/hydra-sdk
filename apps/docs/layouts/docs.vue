<template>
	<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
		<!-- Header (same as default layout) -->
		<UiHeader v-model:openDialogSearch="openDialogSearch" v-model:sidebarOpen="sidebarOpen" />

		<div class="relative flex">
			<!-- Sidebar -->
			<aside
				:class="[
					'w-68 fixed top-16 z-40 h-[calc(100vh-4rem)] shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50 transition-transform duration-300 xl:sticky dark:border-gray-800 dark:bg-gray-900',
					sidebarOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'
				]"
			>
				<nav class="space-y-8 p-6">
					<!-- Search -->
					<div>
						<UInput icon="i-heroicons-magnifying-glass" :placeholder="t('search.placeholder')" class="mb-4" v-model="searchQuery" @click="openDialogSearch = true" />
					</div>

					<!-- Navigation Sections -->
					<div v-for="section in sidebarNavigation" :key="section.title" class="space-y-3">
						<h3 class="text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
							{{ section.title }}
						</h3>
						<ul class="space-y-2">
							<li v-for="item in section.items" :key="item.to">
								<NuxtLink
									:to="item.to"
									class="group flex items-center space-x-2 rounded-md px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-blue-400"
									active-class="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
									@click="sidebarOpen = false"
								>
									<UIcon :name="item.icon" class="h-4 w-4" />
									<span>{{ item.label }}</span>
									<UBadge v-if="item.badge" variant="soft" size="xs" :color="item.badge.color">
										{{ item.badge.text }}
									</UBadge>
								</NuxtLink>
							</li>
						</ul>
					</div>
				</nav>
			</aside>
			<div v-if="sidebarOpen" class="absolute inset-0 z-30 bg-gray-600/50 xl:hidden" @click="sidebarOpen = false"></div>

			<!-- Overlay for mobile -->
			<div class="fixed right-4 top-[108px] z-30">
				<UButton icon="ic:round-layers" variant="soft" square size="md" class="rounded-full shadow-lg xl:hidden" color="green" @click="sidebarOpen = !sidebarOpen" />
			</div>

			<!-- Main Content -->
			<main class="grow overflow-x-hidden lg:ml-0">
				<div class="mx-auto max-w-4xl px-4 py-8">
					<!-- Breadcrumbs -->
					<nav v-if="breadcrumbs.length > 1" class="mb-8">
						<ol class="flex items-center space-x-2 font-sans text-sm">
							<li v-for="(item, index) in breadcrumbs" :key="item.to" class="flex items-center">
								<NuxtLink v-if="index < breadcrumbs.length - 1" :to="item.to" class="text-gray-500 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
									{{ item.label }}
								</NuxtLink>
								<span v-else class="font-medium text-gray-700 dark:text-gray-300">
									{{ item.label }}
								</span>
								<UIcon v-if="index < breadcrumbs.length - 1" name="i-heroicons-chevron-right" class="mx-2 h-4 w-4 text-gray-400" />
							</li>
						</ol>
					</nav>

					<!-- Content -->
					<article class="main-content prose prose-gray max-w-[100svw] font-sans dark:prose-invert">
						<slot />
					</article>

					<!-- Page Navigation -->
					<div class="mt-12 flex items-center justify-between border-t border-gray-200 pt-8 dark:border-gray-700">
						<div>
							<NuxtLink
								v-if="prevPage"
								:to="prevPage.to"
								class="group flex items-center space-x-3 rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-600"
							>
								<UIcon name="i-heroicons-arrow-left" class="h-5 w-5 text-gray-400 transition-colors group-hover:text-blue-500" />
								<div>
									<div class="text-sm text-gray-500 dark:text-gray-400">{{ t('common.previous') }}</div>
									<div class="font-medium text-gray-700 transition-colors group-hover:text-blue-600 dark:text-gray-300 dark:group-hover:text-blue-400">
										{{ prevPage.label }}
									</div>
								</div>
							</NuxtLink>
						</div>

						<div>
							<NuxtLink
								v-if="nextPage"
								:to="nextPage.to"
								class="group flex items-center space-x-3 rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-600"
							>
								<div class="text-right">
									<div class="text-sm text-gray-500 dark:text-gray-400">{{ t('common.next') }}</div>
									<div class="font-medium text-gray-700 transition-colors group-hover:text-blue-600 dark:text-gray-300 dark:group-hover:text-blue-400">
										{{ nextPage.label }}
									</div>
								</div>
								<UIcon name="i-heroicons-arrow-right" class="h-5 w-5 text-gray-400 transition-colors group-hover:text-blue-500" />
							</NuxtLink>
						</div>
					</div>
				</div>
			</main>

			<!-- Table of Contents -->
			<aside class="hidden w-72 flex-shrink-0 bg-gray-25 xl:block dark:bg-gray-900">
				<div class="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto font-sans">
					<div class="p-6">
						<h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-200">{{ t('common.onThisPage') }}</h3>
						<client-only>
							<nav class="w-full space-y-2" :class="[$route.params?.slug?.includes('api') ? 'font-mono' : 'font-sans']">
								<UTooltip
									:popper="{ placement: 'top-start' }"
									:ui="{
										base: '!break-word !h-auto !text-wrap !text-gray-600 dark:!text-gray-200 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md'
									}"
									:text="`${heading.text}`"
									v-for="heading in tableOfContents"
									:key="heading.id"
									class="block"
								>
									<a
										:href="`#${heading.id}`"
										:class="[
											'block overflow-x-hidden text-ellipsis text-nowrap border-l-2 py-1 text-sm transition-colors',
											heading.level === 2 ? 'pl-3 font-semibold text-gray-600 dark:text-gray-200' : 'pl-6',
											'border-transparent text-gray-600 hover:border-blue-300 hover:text-blue-600 dark:text-gray-400 dark:hover:border-blue-600 dark:hover:text-blue-400',
											isActive(heading.id) ? '!border-blue-300 font-medium !text-blue-600 dark:!text-blue-400' : '',
											$route.params?.slug?.includes('api') && heading.text?.includes('#') ? 'font-semibold italic text-gray-600 dark:text-gray-200' : 'font-normal'
										]"
									>
										{{ heading.text }}
									</a>
								</UTooltip>
							</nav>
						</client-only>
					</div>
				</div>
			</aside>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { version as coreVersion } from '../../../packages/core/package.json'
	import { version as bridgeVersion } from '../../../packages/hydra-bridge/package.json'
	import { version as transactionVersion } from '../../../packages/hydra-transaction/package.json'

	const sidebarOpen = ref(false)
	const searchQuery = ref('')
	const openDialogSearch = ref(false)

	const { t, locale } = useI18n()
	const localePath = useLocalePath()

	const sidebarNavigation = computed(() => [
		{
			title: t('nav.gettingStarted'),
			items: [
				{ label: t('common.overview'), to: localePath('/getting-started'), icon: 'i-heroicons-home' },
				{ label: t('common.installation'), to: localePath('/getting-started/installation'), icon: 'i-heroicons-arrow-down-tray' },
				{ label: t('common.quickStart'), to: localePath('/getting-started/quick-start'), icon: 'i-heroicons-rocket-launch' },
				{ label: t('common.configuration'), to: localePath('/getting-started/configuration'), icon: 'i-heroicons-cog-6-tooth' },
				{ label: t('common.performance'), to: localePath('/getting-started/performance'), icon: 'i-heroicons-sparkles', badge: { text: t('common.new'), color: 'green' as any } },
				{ label: t('common.changeLogs'), to: localePath('/getting-started/change-logs'), icon: 'i-heroicons-clock' },
				{ label: t('common.migration'), to: localePath('/getting-started/migration-v1.1.0'), icon: 'i-heroicons-arrow-up-circle', badge: { text: 'v1.1.x', color: 'gray' as any } }
			]
		},
		{
			title: t('common.packages'),
			items: [
				{ label: t('common.corePackage'), to: localePath('/packages/core'), icon: 'i-heroicons-wallet', badge: { text: `v${coreVersion}`, color: 'fuchsia' as any } },
				{ label: t('common.hydraBridge'), to: localePath('/packages/bridge'), icon: 'i-heroicons-bolt', badge: { text: `v${bridgeVersion}`, color: 'fuchsia' as any } },
				{
					label: t('common.transactionBuilder'),
					to: localePath('/packages/transaction'),
					icon: 'i-heroicons-cog-6-tooth',
					badge: { text: `v${transactionVersion}`, color: 'fuchsia' as any }
				}
			]
		},
		{
			title: t('nav.apiReference'),
			items: [
				{ label: t('common.overview'), to: localePath('/api'), icon: 'i-heroicons-book-open' },
				{ label: t('common.corePackage'), to: localePath('/api/core'), icon: 'i-heroicons-wallet' },
				{ label: t('common.hydraBridge'), to: localePath('/api/bridge'), icon: 'i-heroicons-bolt' },
				{ label: t('common.transactionBuilder'), to: localePath('/api/transaction'), icon: 'i-heroicons-cog-6-tooth' },
				{ label: t('common.cardanoWasm'), to: localePath('/api/cardano-wasm'), icon: 'i-heroicons-cpu-chip' },
				{ label: t('common.utilities'), to: localePath('/api/utilities'), icon: 'i-heroicons-wrench-screwdriver', badge: { text: t('common.new'), color: 'green' as any } }
			]
		},
		{
			title: t('nav.examples'),
			items: [
				{ label: t('common.overview'), to: localePath('/examples'), icon: 'i-heroicons-code-bracket-square' },
				{ label: t('common.walletCreation'), to: localePath('/examples/wallet-creation'), icon: 'i-heroicons-wallet' },
				{ label: t('common.hydraIntegration'), to: localePath('/examples/hydra-integration'), icon: 'i-heroicons-bolt' },
				{ label: t('common.transactionBuilding'), to: localePath('/examples/transaction-building'), icon: 'i-heroicons-arrows-right-left' },
				{
					label: t('common.transactionSigning'),
					to: localePath('/examples/transaction-signing'),
					icon: 'i-heroicons-pencil-square',
					badge: { text: t('common.new'), color: 'green' as any }
				},
				{ label: t('common.fullReactApp'), to: localePath('/examples/full-react-app'), icon: 'lucide:atom' },
				{ label: t('common.fullVueApp'), to: localePath('/examples/full-vuejs-app'), icon: 'mdi:vuejs' },
				{ label: t('common.utilityExamples'), to: localePath('/examples/utilities-examples'), icon: 'i-heroicons-beaker', badge: { text: t('common.updated'), color: 'green' as any } }
			]
		},
		{
			title: t('nav.hydraConcept'),
			items: [
				{ label: t('common.overview'), to: localePath('/hydra-concept'), icon: 'i-heroicons-book-open', badge: { text: t('common.new'), color: 'green' as any } },
				{
					label: t('common.hydraConcept.whyHydra'),
					to: localePath('/hydra-concept/why-hydra'),
					icon: 'i-heroicons-question-mark-circle'
					// badge: { text: t('common.new'), color: 'green' as any }
				},
				{
					label: t('common.hydraConcept.commitToHydra'),
					to: localePath('/hydra-concept/commit-to-hydra'),
					icon: 'i-heroicons-arrow-down-tray'
					// badge: { text: t('common.new'), color: 'green' as any }
				},
				{
					label: t('common.hydraConcept.decommitFromHydra'),
					to: localePath('/hydra-concept/decommit-from-hydra'),
					icon: 'i-heroicons-arrow-up-tray',
					badge: { text: t('common.new'), color: 'green' as any }
				},
				{
					label: t('common.hydraConcept.transactionInHydra'),
					to: localePath('/hydra-concept/transactions-in-hydra'),
					icon: 'i-heroicons-arrows-right-left',
					badge: { text: t('common.new'), color: 'green' as any }
				},
				{
					label: t('common.hydraConcept.smartContractsInHydra'),
					to: localePath('/hydra-concept/smart-contracts-in-hydra'),
					icon: 'i-heroicons-cube-transparent',
					badge: { text: t('common.new'), color: 'green' as any }
				}
			]
		},
		{
			title: t('nav.guides'),
			items: [
				{ label: t('common.overview'), to: localePath('/guides'), icon: 'i-heroicons-academic-cap' },
				{ label: t('common.buildingWalletApps'), to: localePath('/guides/building-wallet-app'), icon: 'i-heroicons-wrench-screwdriver' },
				{
					label: t('common.workingWithUtilities'),
					to: localePath('/guides/working-with-utilities'),
					icon: 'i-heroicons-cog-8-tooth',
					badge: { text: t('common.new'), color: 'green' as any }
				},
				{ label: t('common.guides.mintBurnTokens'), to: localePath('/guides/mint-burn-tokens'), icon: 'ic:outline-generating-tokens' },
				{ label: t('common.hydraHeadManagement'), to: localePath('/guides/hydra-head-management'), icon: 'i-heroicons-server-stack' },
				{ label: t('common.testingStrategies'), to: localePath('/guides/testing-strategies'), icon: 'i-heroicons-beaker' },
				{ label: t('common.deployment'), to: localePath('/guides/deployment'), icon: 'i-heroicons-cloud-arrow-up' }
			]
		}
	])

	// Computed properties for navigation
	const route = useRoute()

	const breadcrumbs = computed(() => {
		const path = route.path
		const segments = path
			.split('/')
			.filter(s => s !== locale.value)
			.filter(Boolean)

		const crumbs = [{ label: t('common.home'), to: localePath('/') }]

		let currentPath = ''
		segments.forEach(segment => {
			currentPath += `/${segment}`
			const label = segment
				.split('-')
				.map(word => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ')
			crumbs.push({ label, to: currentPath })
		})

		return crumbs
	})

	// Mock data - in real implementation, this would be generated from content
	const prevPage = computed(() => {
		const currentPath = route.path
		const currentSidebar = sidebarNavigation.value.find(section => {
			return section.items.some(item => item.to === currentPath)
		})
		if (!currentSidebar) return null
		const currentIndex = currentSidebar.items.findIndex(item => item.to === currentPath)
		if (currentIndex === 0) return null
		return currentSidebar.items[currentIndex - 1]
	})

	const nextPage = computed(() => {
		const currentPath = route.path
		const currentSidebar = sidebarNavigation.value.find(section => {
			return section.items.some(item => item.to === currentPath)
		})
		if (!currentSidebar) return null
		const currentIndex = currentSidebar.items.findIndex(item => item.to === currentPath)
		if (currentIndex === currentSidebar.items.length - 1) return null
		return currentSidebar.items[currentIndex + 1]
	})

	const { tableOfContents } = useToc()
	const isActive = (id: string) => {
		return route.hash === `#${id}`
	}

	// Close sidebar when route changes
	watch(
		() => route.path,
		() => {
			sidebarOpen.value = false
		}
	)
</script>

<style scoped lang="scss">
	.main-content {
		:deep(alert) > {
			p {
				color: inherit;
				background-color: inherit;
				border-color: inherit;
				@apply rounded-sm border border-solid p-2;
				strong {
					color: inherit;
					@apply font-semibold;
				}
			}
		}
		:deep(alert[type='error']) {
			@apply bg-error-200/20 text-error-400 *:border-error-300;
		}
		:deep(alert[type='warning']) {
			@apply bg-warning-200/20 text-warning-400 *:border-warning-300;
		}
		:deep(alert[type='info']) {
			@apply bg-gray-200/20 text-gray-400 *:border-gray-300;
		}
		:deep(alert[type='success']) {
			@apply bg-success-200/20 text-success-400 *:border-success-300;
		}
	}
</style>
