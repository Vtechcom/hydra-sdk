<template>
	<div>
		<!-- <div v-if="showSupportBanner" class="relative bg-gradient-to-r from-blue-500 to-purple-500 text-white">
			<div class="container mx-auto px-4 py-3">
				<div class="flex items-center justify-center text-center">
					<div class="flex items-center space-x-2">
						<UIcon name="i-heroicons-heart" class="h-4 w-4 text-pink-300" />
						<span class="text-sm font-medium">
							{{ t('home.supportBanner.text') }}
							<a href="https://fund14.hydrawallet.app/" target="_blank" class="underline hover:text-blue-200">
								{{ t('home.supportBanner.linkText') }}
							</a>
						</span>
					</div>
				</div>
				<button
					@click="closeSupportBanner"
					class="absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center text-white/70 transition-colors hover:text-white"
					aria-label="Close support banner"
				>
					<UIcon name="i-heroicons-x-mark" class="h-5 w-5" />
				</button>
			</div>
		</div> -->

		<!-- Hero Section -->
		<section class="bg-gradient-to-br from-blue-50 to-purple-50 py-20 dark:from-gray-900 dark:to-gray-800">
			<div class="container mx-auto px-4 text-center">
				<div class="mx-auto max-w-4xl">
					<!-- Logo and Title -->
					<div class="mb-8 flex justify-center">
						<img src="/images/logo-1024x1024.png" alt="SDK Logo" srcset="/images/logo-1024x1024.png" class="size-20" width="80" height="80" />
					</div>

					<h1 class="mb-6 text-5xl font-bold text-gray-600 md:text-6xl dark:text-gray-300">
						{{ t('home.title') }}
					</h1>

					<p class="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-600 md:text-2xl dark:text-gray-300">
						{{ t('home.subtitle') }}
						<span class="font-semibold text-blue-600 dark:text-blue-400">{{ t('home.hydroLayer2') }}</span> {{ t('home.integration') }}
					</p>

					<!-- CTA Buttons -->
					<div class="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
						<UButton :to="localePath('/getting-started')" size="lg" icon="i-heroicons-rocket-launch" class="px-8"> {{ t('home.getStarted') }} </UButton>

						<UButton :to="localePath('/api')" variant="outline" size="lg" icon="i-heroicons-book-open" class="px-8"> {{ t('home.apiReference') }} </UButton>

						<!-- <UButton to="https://github.com/aniadev/hydra-sdk" target="_blank" variant="outline" size="lg" icon="i-simple-icons-github" class="px-8"> {{ t('home.viewGithub') }} </UButton> -->
					</div>

					<!-- Stats -->
					<div class="mx-auto grid max-w-2xl grid-cols-2 gap-6 md:flex md:items-center md:justify-center">
						<div v-for="stat in stats" :key="stat.label" class="text-center md:flex-1">
							<div class="whitespace-nowrap text-2xl font-bold text-blue-600 md:text-3xl dark:text-blue-400">{{ stat.value }}</div>
							<div class="text-sm text-gray-600 dark:text-gray-200">{{ stat.label }}</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Features Section -->
		<section class="bg-white py-20 dark:bg-gray-900">
			<div class="container mx-auto px-4">
				<div class="mb-16 text-center">
					<h2 class="mb-4 text-3xl font-bold text-gray-600 md:text-4xl dark:text-gray-300">{{ t('home.features.title') }}</h2>
					<p class="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-200">{{ t('home.features.subtitle') }}</p>
				</div>

				<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
					<div v-for="feature in features" :key="feature.title" class="group">
						<UCard class="h-full transition-shadow duration-300 hover:shadow-lg">
							<template #header>
								<div class="flex items-center space-x-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 transition-transform group-hover:scale-110 dark:bg-blue-900">
										<UIcon :name="feature.icon" class="h-5 w-5 text-blue-600 dark:text-blue-400" />
									</div>
									<h3 class="text-lg font-semibold text-gray-600 dark:text-gray-300">{{ feature.title }}</h3>
								</div>
							</template>

							<p class="mb-4 text-gray-600 dark:text-gray-200">{{ feature.description }}</p>

							<div class="flex flex-wrap gap-2">
								<UBadge v-for="tech in feature.technologies" :key="tech" variant="soft" size="sm">
									{{ tech }}
								</UBadge>
							</div>
						</UCard>
					</div>
				</div>
			</div>
		</section>

		<!-- Apps Showcase Section -->
		<section class="bg-gradient-to-br from-purple-50 to-blue-50 py-20 dark:from-gray-800 dark:to-gray-900">
			<div class="container mx-auto px-4">
				<div class="mb-16 text-center">
					<h2 class="mb-4 text-3xl font-bold text-gray-600 md:text-4xl dark:text-gray-300">{{ t('home.showcase.title') }}</h2>
					<p class="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-200">{{ t('home.showcase.subtitle') }}</p>
				</div>

				<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
					<div v-for="app in showcaseApps" :key="app.name" class="group">
						<UCard class="h-full transition-all duration-300 hover:scale-105 hover:shadow-xl">
							<template #header>
								<div class="text-center">
									<div
										class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-purple-500 p-[2px] shadow-sm dark:from-blue-500/80 dark:to-purple-600/80"
									>
										<!-- <UIcon :name="app.icon" class="h-8 w-8 text-white" /> -->
										<img :src="app.icon" alt="" width="60" height="60" class="text-white h-full w-full rounded-[14px] object-contain" />
									</div>
									<h3 class="text-xl font-bold text-gray-600 dark:text-gray-300">{{ app.name }}</h3>
									<p class="text-sm text-gray-600 dark:text-gray-200">{{ app.category }}</p>
								</div>
							</template>

							<div class="text-center">
								<p class="mb-6 text-gray-600 dark:text-gray-200">{{ app.description }}</p>

								<div class="mb-6 flex flex-wrap justify-center gap-2">
									<UBadge v-for="feature in app.features" :key="feature" variant="soft" size="sm">
										{{ feature }}
									</UBadge>
								</div>

								<UButton :to="app.url" target="_blank" variant="outline" size="sm" icon="i-heroicons-arrow-top-right-on-square" class=""> {{ app.visitButton }} </UButton>
							</div>
						</UCard>
					</div>
				</div>
			</div>
		</section>

		<!-- Sponsor Section -->
		<section class="bg-white-100 py-16 dark:bg-gray-900">
			<div class="container mx-auto px-4">
				<div class="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 to-[#CDEECC] p-8 dark:border-gray-700 dark:from-gray-800 dark:to-[#2d3c2d]">
					<div class="text-center">
						<div class="mb-4">
							<span class="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"> {{ t('home.sponsor.badge') }} </span>
						</div>

						<div class="mb-6 flex justify-center">
							<div class="bg-white flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg dark:bg-gray-200">
								<!-- Vtechcom Logo placeholder - replace with actual logo -->
								<!-- <div class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">VTC</div> -->
								<img src="/images/vtechcom-logo.png" alt="Vtechcom Logo" class="h-16 w-16 object-contain" />
							</div>
						</div>

						<h3 class="mb-3 text-2xl font-bold text-gray-600 md:text-3xl dark:text-gray-300">{{ t('home.sponsor.title') }}</h3>

						<p class="mx-auto mb-6 max-w-2xl text-gray-600 dark:text-gray-200">
							{{ t('home.sponsor.description') }}
						</p>

						<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
							<UButton to="https://vtechcom.org/" target="_blank" size="lg" icon="i-heroicons-globe-alt" class="px-6"> {{ t('home.sponsor.visitButton') }} </UButton>

							<UButton to="mailto:contact@vtechcom.org" variant="outline" size="lg" icon="i-heroicons-envelope" class="px-6"> {{ t('home.sponsor.partnershipButton') }} </UButton>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Architecture Section -->
		<section class="bg-gray-50 py-20 dark:bg-gray-800" v-if="false">
			<div class="container mx-auto px-4">
				<div class="mb-16 text-center">
					<h2 class="mb-4 text-3xl font-bold text-gray-600 md:text-4xl dark:text-gray-200">Monorepo Architecture</h2>
					<p class="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-200">Built with Turborepo for optimal development experience and performance</p>
				</div>

				<div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
					<div class="order-2 lg:order-1">
						<UCard>
							<div class="p-6">
								<h3 class="mb-6 text-xl font-semibold text-gray-600 dark:text-gray-200">Package Structure</h3>
								<div class="space-y-4">
									<div v-for="pkg in packages" :key="pkg.name" class="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
										<div class="flex items-center space-x-3">
											<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
												<UIcon :name="pkg.icon" class="text-white h-4 w-4" />
											</div>
											<div>
												<div class="font-medium text-gray-600 dark:text-gray-200">{{ pkg.name }}</div>
												<div class="text-sm text-gray-600 dark:text-gray-200">{{ pkg.description }}</div>
											</div>
										</div>
										<UBadge variant="soft" size="sm">
											{{ pkg.type }}
										</UBadge>
									</div>
								</div>
							</div>
						</UCard>
					</div>

					<div class="order-1 lg:order-2">
						<h3 class="mb-6 text-2xl font-semibold text-gray-600 dark:text-gray-200">Benefits</h3>
						<div class="space-y-4">
							<div v-for="benefit in benefits" :key="benefit.title" class="flex items-start space-x-3">
								<div class="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
									<UIcon name="i-heroicons-check" class="h-4 w-4 text-green-600 dark:text-green-400" />
								</div>
								<div>
									<h4 class="font-medium text-gray-600 dark:text-gray-200">{{ benefit.title }}</h4>
									<p class="text-gray-600 dark:text-gray-200">{{ benefit.description }}</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Quick Start Section -->
		<section class="bg-gray-50 py-20 dark:bg-gray-800">
			<div class="container mx-auto px-4">
				<div class="mb-16 text-center">
					<h2 class="mb-4 text-3xl font-bold text-gray-600 md:text-4xl dark:text-gray-200">{{ t('home.quickStart.title') }}</h2>
					<p class="text-lg text-gray-600 dark:text-gray-200">{{ t('home.quickStart.subtitle') }}</p>
				</div>

				<div class="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
					<!-- Installation -->
					<div>
						<h3 class="mb-4 text-xl font-semibold text-gray-600 dark:text-gray-200">{{ t('home.quickStart.installation') }}</h3>
						<!-- <UCard class="mb-8">
							<div class="font-mono text-sm">
								<div class="mb-2 text-gray-500 dark:text-gray-200"># Install core packages</div>
								<div class="text-blue-600 dark:text-blue-400">npm install @hydra-sdk/core @hydra-sdk/bridge</div>
							</div>
						</UCard> -->
						<ProsePre :code="installCode" language="bash" class="prose" />

						<h3 class="mb-4 text-xl font-semibold text-gray-600 dark:text-gray-200">{{ t('home.quickStart.basicUsage') }}</h3>
						<ProsePre :code="quickStartCode" language="typescript" class="prose" />
					</div>

					<!-- Next Steps -->
					<div>
						<h3 class="mb-6 text-xl font-semibold text-gray-600 dark:text-gray-200">{{ t('home.quickStart.nextSteps') }}</h3>
						<div class="space-y-4">
							<div v-for="step in nextSteps" :key="step.title" class="group">
								<NuxtLink
									:to="step.to"
									class="block rounded-lg border border-gray-200 p-4 transition-all duration-300 hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-600"
								>
									<div class="flex items-center justify-between">
										<div class="flex items-center space-x-3">
											<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 transition-transform group-hover:scale-110 dark:bg-blue-900">
												<UIcon :name="step.icon" class="h-4 w-4 text-blue-600 dark:text-blue-400" />
											</div>
											<div>
												<h4 class="font-medium text-gray-600 transition-colors group-hover:text-blue-600 dark:text-gray-200 dark:group-hover:text-blue-400">{{ step.title }}</h4>
												<p class="text-sm text-gray-600 dark:text-gray-400">{{ step.description }}</p>
											</div>
										</div>
										<UIcon name="i-heroicons-arrow-right" class="h-4 w-4 text-gray-400 transition-colors group-hover:text-blue-500" />
									</div>
								</NuxtLink>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Community & Support Section -->
		<section class="bg-white-50 py-20 dark:bg-gray-900">
			<div class="container mx-auto px-4">
				<div class="mb-16 text-center">
					<h2 class="mb-4 text-3xl font-bold text-gray-600 md:text-4xl dark:text-gray-200">{{ t('home.community.title') }}</h2>
					<p class="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-200">{{ t('home.community.subtitle') }}</p>
				</div>

				<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
					<div v-for="community in communityLinks" :key="community.name" class="group">
						<UCard class="h-full text-center transition-all duration-300 hover:scale-105 hover:shadow-lg">
							<div class="flex flex-col items-center p-6">
								<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
									<UIcon :name="community.icon" class="h-8 w-8 text-gray-200" />
								</div>
								<h3 class="mb-3 text-xl font-semibold text-gray-600 dark:text-gray-200">{{ community.name }}</h3>
								<p class="mb-6 max-w-xs text-gray-600 dark:text-gray-200">{{ community.description }}</p>
								<UButton :to="community.url" target="_blank" variant="outline" size="sm" :icon="community.buttonIcon" class="">
									{{ community.buttonText }}
								</UButton>
							</div>
						</UCard>
					</div>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
	// i18n
	const { t } = useI18n()
	const localePath = useLocalePath()

	// Banner state management
	const showSupportBanner = useSessionStorage<boolean>('showSupportBanner', true)

	const closeSupportBanner = () => {
		showSupportBanner.value = false
	}

	// SEO
	useSeoMeta({
		title: 'Hydra Wallet SDK - Cardano & Hydra Development Kit by Vtechcom',
		ogTitle: 'Hydra Wallet SDK - Build on Cardano & Hydra Layer 2',
		description:
			'Powerful TypeScript SDK for building Cardano and Hydra Layer 2 applications. Complete with wallet connections, transaction building, and Hydra Head management by Vtechcom.',
		ogDescription: 'Complete SDK for Cardano and Hydra development with TypeScript support, WASM bindings, and comprehensive tooling for DeFi and wallet applications.',
		ogImage: 'https://sdk.vtechcom.io/images/og-image.webp',
		ogUrl: 'https://sdk.vtechcom.io',
		twitterCard: 'summary_large_image',
		twitterTitle: 'Hydra Wallet SDK - Cardano & Hydra Development Kit',
		twitterDescription: 'Powerful TypeScript SDK for building Cardano and Hydra Layer 2 applications by Vtechcom.',
		twitterImage: 'https://sdk.vtechcom.io/images/twitter-card.webp',
		keywords: 'Cardano SDK, Hydra Layer 2, TypeScript, Blockchain Development, Vtechcom, Hydra Wallet, DeFi, NFT, WASM'
	})

	// Data
	const stats = computed(() => [
		{ value: '3', label: t('home.stats.corePackages') },
		{ value: '5+', label: t('home.stats.applications') },
		{ value: '100%', label: t('home.stats.typescript') },
		{ value: 'WASM', label: t('home.stats.superFast') },
		{ value: 'Apache-2.0', label: t('home.stats.license') }
	])

	const features = computed(() => [
		{
			title: t('home.features.cardanoWallet.title'),
			description: t('home.features.cardanoWallet.description'),
			icon: 'i-heroicons-wallet',
			technologies: ['TypeScript', 'WASM', 'Cardano']
		},
		{
			title: t('home.features.hydraIntegration.title'),
			description: t('home.features.hydraIntegration.description'),
			icon: 'i-heroicons-bolt',
			technologies: ['WebSocket', 'Socket.IO', 'Hydra']
		},
		{
			title: t('home.features.transactionBuilder.title'),
			description: t('home.features.transactionBuilder.description'),
			icon: 'i-heroicons-cog-6-tooth',
			technologies: ['CBOR', 'Plutus', 'Smart Contracts']
		},
		{
			title: t('home.features.wasmIntegration.title'),
			description: t('home.features.wasmIntegration.description'),
			icon: 'i-heroicons-cpu-chip',
			technologies: ['WASM', 'Rust', 'Browser']
		},
		{
			title: t('home.features.typescriptFirst.title'),
			description: t('home.features.typescriptFirst.description'),
			icon: 'i-heroicons-code-bracket',
			technologies: ['TypeScript', 'ESLint', 'Prettier']
		},
		{
			title: t('home.features.modularArchitecture.title'),
			description: t('home.features.modularArchitecture.description'),
			icon: 'i-heroicons-cube-transparent',
			technologies: ['Turborepo', 'PNPM', 'Monorepo']
		}
	])

	const showcaseApps = computed(() => [
		{
			name: t('home.showcase.apps.hydraWallet.name'),
			category: t('home.showcase.apps.hydraWallet.category'),
			description: t('home.showcase.apps.hydraWallet.description'),
			icon: '/images/hydra-wallet-logo.png',
			features: ['HD Wallet', 'Hydra Layer 2', 'DeFi', 'Staking', 'NFTs'],
			url: 'https://alpha.hydrawallet.app',
			visitButton: t('home.showcase.apps.hydraWallet.visitButton')
		},
		{
			name: t('home.showcase.apps.hydraPlayground.name'),
			category: t('home.showcase.apps.hydraPlayground.category'),
			description: t('home.showcase.apps.hydraPlayground.description'),
			icon: '/images/hydra-playground-logo-white.png',
			features: ['Interactive Playground', 'Hydra SDK', 'DApp Development', 'Testing'],
			url: 'https://play.hydrasdk.com',
			visitButton: t('home.showcase.apps.hydraPlayground.visitButton')
		},
		{
			name: t('home.showcase.apps.hydraFlappy.name'),
			category: t('home.showcase.apps.hydraFlappy.category'),
			description: t('home.showcase.apps.hydraFlappy.description'),
			icon: '/images/hydra-flappy-logo.png',
			features: ['GameFi', 'NFT Rewards', 'Leaderboard', 'Micro-payments'],
			url: 'https://play-flappy.hydrawallet.app',
			visitButton: t('home.showcase.apps.hydraFlappy.visitButton')
		},
		{
			name: t('home.showcase.apps.hydraFastpay.name'),
			category: t('home.showcase.apps.hydraFastpay.category'),
			description: t('home.showcase.apps.hydraFastpay.description'),
			icon: '/images/hydra-fastpay-logo.png',
			features: ['Instant Payments', 'Low Fees', 'QR Codes', 'Merchant Tools'],
			url: 'https://alpha.hydrawallet.app/dapps/hydra-fastpay',
			visitButton: t('home.showcase.apps.hydraFastpay.visitButton')
		},
		{
			name: t('home.showcase.apps.hydraRockPaperScissors.name'),
			category: t('home.showcase.apps.hydraRockPaperScissors.category'),
			description: t('home.showcase.apps.hydraRockPaperScissors.description'),
			icon: '/images/hydra-rock-paper-scissors-logo.png',
			features: ['GameFi', 'NFT Rewards', 'Hydra Layer 2', 'Low Fees'],
			url: 'https://alpha.hydrawallet.app/games/rock-paper-scissors',
			visitButton: t('home.showcase.apps.hydraRockPaperScissors.visitButton')
		}
	])

	const packages = [
		{
			name: '@hydra-sdk/core',
			description: 'Core Cardano wallet functionality',
			icon: 'i-heroicons-wallet',
			type: 'core'
		},
		{
			name: '@hydra-sdk/bridge',
			description: 'Hydra Layer 2 integration',
			icon: 'i-heroicons-bolt',
			type: 'core'
		},
		{
			name: '@hydra-sdk/transaction',
			description: 'Transaction building utilities',
			icon: 'i-heroicons-cog-6-tooth',
			type: 'core'
		},
		{
			name: '@hydra-sdk/cardano-wasm',
			description: 'Cardano WASM bindings',
			icon: 'i-heroicons-cpu-chip',
			type: 'core'
		}
	]

	const benefits = [
		{
			title: 'Shared Dependencies',
			description: 'Efficiently share dependencies across all packages in the monorepo.'
		},
		{
			title: 'Incremental Builds',
			description: 'Build only what changes with intelligent caching and dependency tracking.'
		},
		{
			title: 'Parallel Execution',
			description: 'Run tasks across packages in parallel for faster development cycles.'
		},
		{
			title: 'Remote Caching',
			description: 'Cache build artifacts in the cloud for team-wide performance benefits.'
		}
	]

	const nextSteps = computed(() => [
		{
			title: t('home.quickStart.steps.installationGuide.title'),
			description: t('home.quickStart.steps.installationGuide.description'),
			icon: 'i-heroicons-arrow-down-tray',
			to: localePath('/getting-started/installation')
		},
		{
			title: t('home.quickStart.steps.apiReference.title'),
			description: t('home.quickStart.steps.apiReference.description'),
			icon: 'i-heroicons-book-open',
			to: localePath('/api')
		},
		{
			title: t('home.quickStart.steps.codeExamples.title'),
			description: t('home.quickStart.steps.codeExamples.description'),
			icon: 'i-heroicons-code-bracket-square',
			to: localePath('/examples')
		},
		{
			title: t('home.quickStart.steps.guidesTutorials.title'),
			description: t('home.quickStart.steps.guidesTutorials.description'),
			icon: 'i-heroicons-academic-cap',
			to: localePath('/guides')
		}
	])

	const communityLinks = computed(() => [
		{
			name: t('home.community.links.github.name'),
			description: t('home.community.links.github.description'),
			icon: 'i-simple-icons-github',
			url: 'https://github.com/Vtechcom/hydra-sdk',
			buttonText: t('home.community.links.github.button'),
			buttonIcon: 'i-heroicons-code-bracket'
		},
		{
			name: t('home.community.links.discord.name'),
			description: t('home.community.links.discord.description'),
			icon: 'i-simple-icons-discord',
			url: 'https://discord.com/invite/eZKRyQnbea',
			buttonText: t('home.community.links.discord.button'),
			buttonIcon: 'i-heroicons-chat-bubble-left-right'
		},
		{
			name: t('home.community.links.telegram.name'),
			description: t('home.community.links.telegram.description'),
			icon: 'i-simple-icons-telegram',
			url: 'https://t.me/+DPJxXA5y9wgzZThl',
			buttonText: t('home.community.links.telegram.button'),
			buttonIcon: 'i-heroicons-paper-airplane'
		}
	])

	const installCode = `# Install core packages
npm install @hydra-sdk/core @hydra-sdk/bridge @hydra-sdk/transaction @hydra-sdk/cardano-wasm
	`.trim()

	const quickStartCode = `import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'
// Create new wallet
const wallet = new AppWallet({
networkId: NETWORK_ID.PREPROD,
key: {
	type: 'mnemonic',
	words: AppWallet.brew() // Generate new mnemonic
}
})
// Get account
const account = wallet.getAccount(0, 0)
console.log('Address:', account.baseAddressBech32)`
</script>
