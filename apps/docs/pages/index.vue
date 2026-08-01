<template>
	<div>
		<!-- <div v-if="showSupportBanner" class="relative text-white bg-gradient-to-r from-blue-500 to-purple-500">
			<div class="container px-4 py-3 mx-auto">
				<div class="flex justify-center items-center text-center">
					<div class="flex items-center space-x-2">
						<UIcon name="i-heroicons-heart" class="w-4 h-4 text-pink-300" />
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
					class="flex absolute right-4 top-1/2 justify-center items-center transition-colors -translate-y-1/2 text-white/70 hover:text-white"
					aria-label="Close support banner"
				>
					<UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
				</button>
			</div>
		</div> -->

		<!-- Hero Section -->
		<section class="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
			<div class="container px-4 mx-auto text-center">
				<div class="mx-auto max-w-4xl">
					<!-- Logo and Title -->
					<div class="flex justify-center mb-8">
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
					<div class="flex flex-col gap-4 justify-center items-center mb-12 sm:flex-row">
						<UButton :to="localePath('/getting-started')" size="lg" icon="i-heroicons-rocket-launch" class="px-8"> {{ t('home.getStarted') }} </UButton>

						<UButton :to="localePath('/api')" variant="outline" size="lg" icon="i-heroicons-book-open" class="px-8"> {{ t('home.apiReference') }} </UButton>

						<!-- <UButton to="https://github.com/aniadev/hydra-sdk" target="_blank" variant="outline" size="lg" icon="i-simple-icons-github" class="px-8"> {{ t('home.viewGithub') }} </UButton> -->
					</div>

					<!-- Stats -->
					<div class="grid grid-cols-2 gap-6 mx-auto max-w-2xl md:flex md:items-center md:justify-center">
						<div v-for="stat in stats" :key="stat.label" class="text-center md:flex-1">
							<div class="text-2xl font-bold text-blue-600 whitespace-nowrap md:text-3xl dark:text-blue-400">{{ stat.value }}</div>
							<div class="text-sm text-gray-600 dark:text-gray-200">{{ stat.label }}</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Features Section -->
		<section class="py-20 bg-white dark:bg-gray-900">
			<div class="container px-4 mx-auto">
				<div class="mb-16 text-center">
					<h2 class="mb-4 text-3xl font-bold text-gray-600 md:text-4xl dark:text-gray-300">{{ t('home.features.title') }}</h2>
					<p class="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-200">{{ t('home.features.subtitle') }}</p>
				</div>

				<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
					<div v-for="feature in features" :key="feature.title" class="group">
						<UCard class="h-full transition-shadow duration-300 hover:shadow-lg">
							<template #header>
								<div class="flex items-center space-x-3">
									<div class="flex justify-center items-center w-10 h-10 bg-blue-100 rounded-lg transition-transform group-hover:scale-110 dark:bg-blue-900">
										<UIcon :name="feature.icon" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
		<section class="py-20 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
			<div class="container px-4 mx-auto">
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
										<!-- <UIcon :name="app.icon" class="w-8 h-8 text-white" /> -->
										<img :src="app.icon" alt="" width="60" height="60" class="text-white h-full w-full rounded-[14px] object-contain" />
									</div>
									<h3 class="text-xl font-bold text-gray-600 dark:text-gray-300">{{ app.name }}</h3>
									<p class="text-sm text-gray-600 dark:text-gray-200">{{ app.category }}</p>
								</div>
							</template>

							<div class="text-center">
								<p class="mb-6 text-gray-600 dark:text-gray-200">{{ app.description }}</p>

								<div class="flex flex-wrap gap-2 justify-center mb-6">
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
		<section class="py-16 bg-white-100 dark:bg-gray-900">
			<div class="container px-4 mx-auto">
				<div class="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 to-[#CDEECC] p-8 dark:border-gray-700 dark:from-gray-800 dark:to-[#2d3c2d]">
					<div class="text-center">
						<div class="mb-4">
							<span class="inline-block px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200"> {{ t('home.sponsor.badge') }} </span>
						</div>

						<div class="flex justify-center mb-6">
							<div class="flex justify-center items-center w-20 h-20 bg-white rounded-2xl shadow-lg dark:bg-gray-200">
								<!-- Vtechcom Logo placeholder - replace with actual logo -->
								<!-- <div class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">VTC</div> -->
								<img src="/images/vtechcom-logo.png" alt="Vtechcom Logo" class="object-contain w-16 h-16" />
							</div>
						</div>

						<h3 class="mb-3 text-2xl font-bold text-gray-600 md:text-3xl dark:text-gray-300">{{ t('home.sponsor.title') }}</h3>

						<p class="mx-auto mb-6 max-w-2xl text-gray-600 dark:text-gray-200">
							{{ t('home.sponsor.description') }}
						</p>

						<div class="flex flex-col gap-4 justify-center items-center sm:flex-row">
							<UButton to="https://vtechcom.org/" target="_blank" size="lg" icon="i-heroicons-globe-alt" class="px-6"> {{ t('home.sponsor.visitButton') }} </UButton>

							<UButton to="mailto:contact@vtechcom.org" variant="outline" size="lg" icon="i-heroicons-envelope" class="px-6"> {{ t('home.sponsor.partnershipButton') }} </UButton>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Architecture Section -->
		<section class="py-20 bg-gray-50 dark:bg-gray-800" v-if="false">
			<div class="container px-4 mx-auto">
				<div class="mb-16 text-center">
					<h2 class="mb-4 text-3xl font-bold text-gray-600 md:text-4xl dark:text-gray-200">Monorepo Architecture</h2>
					<p class="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-200">Built with Turborepo for optimal development experience and performance</p>
				</div>

				<div class="grid grid-cols-1 gap-12 items-center lg:grid-cols-2">
					<div class="order-2 lg:order-1">
						<UCard>
							<div class="p-6">
								<h3 class="mb-6 text-xl font-semibold text-gray-600 dark:text-gray-200">Package Structure</h3>
								<div class="space-y-4">
									<div v-for="pkg in packages" :key="pkg.name" class="flex justify-between items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700">
										<div class="flex items-center space-x-3">
											<div class="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
												<UIcon :name="pkg.icon" class="w-4 h-4 text-white" />
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
								<div class="flex flex-shrink-0 justify-center items-center mt-1 w-6 h-6 bg-green-100 rounded-full dark:bg-green-900">
									<UIcon name="i-heroicons-check" class="w-4 h-4 text-green-600 dark:text-green-400" />
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
		<section class="py-20 bg-gray-50 dark:bg-gray-800">
			<div class="container px-4 mx-auto">
				<div class="mb-16 text-center">
					<h2 class="mb-4 text-3xl font-bold text-gray-600 md:text-4xl dark:text-gray-200">{{ t('home.quickStart.title') }}</h2>
					<p class="text-lg text-gray-600 dark:text-gray-200">{{ t('home.quickStart.subtitle') }}</p>
				</div>

				<div class="grid grid-cols-1 gap-12 items-start lg:grid-cols-2">
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
									class="block p-4 rounded-lg border border-gray-200 transition-all duration-300 hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-600"
								>
									<div class="flex justify-between items-center">
										<div class="flex items-center space-x-3">
											<div class="flex justify-center items-center w-8 h-8 bg-blue-100 rounded-lg transition-transform group-hover:scale-110 dark:bg-blue-900">
												<UIcon :name="step.icon" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
											</div>
											<div>
												<h4 class="font-medium text-gray-600 transition-colors group-hover:text-blue-600 dark:text-gray-200 dark:group-hover:text-blue-400">{{ step.title }}</h4>
												<p class="text-sm text-gray-600 dark:text-gray-400">{{ step.description }}</p>
											</div>
										</div>
										<UIcon name="i-heroicons-arrow-right" class="w-4 h-4 text-gray-400 transition-colors group-hover:text-blue-500" />
									</div>
								</NuxtLink>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Community & Support Section -->
		<section class="py-20 bg-white-50 dark:bg-gray-900">
			<div class="container px-4 mx-auto">
				<div class="mb-16 text-center">
					<h2 class="mb-4 text-3xl font-bold text-gray-600 md:text-4xl dark:text-gray-200">{{ t('home.community.title') }}</h2>
					<p class="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-200">{{ t('home.community.subtitle') }}</p>
				</div>

				<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
					<div v-for="community in communityLinks" :key="community.name" class="group">
						<UCard class="h-full text-center transition-all duration-300 hover:scale-105 hover:shadow-lg">
							<div class="flex flex-col items-center p-6">
								<div class="flex justify-center items-center mb-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
									<UIcon :name="community.icon" class="w-8 h-8 text-gray-200" />
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
			name: t('home.showcase.apps.hydraHub.name'),
			category: t('home.showcase.apps.hydraHub.category'),
			description: t('home.showcase.apps.hydraHub.description'),
			icon: '/images/hydra-hub.png',
			features: ['Node Management', 'Head Connectivity', 'Layer-2 APIs', 'Infrastructure'],
			url: 'https://dev.hydrahub.io.vn',
			visitButton: t('home.showcase.apps.hydraHub.visitButton')
		},
		{
			name: t('home.showcase.apps.hydraPlayground.name'),
			category: t('home.showcase.apps.hydraPlayground.category'),
			description: t('home.showcase.apps.hydraPlayground.description'),
			icon: '/images/hydra-playground-logo-white.png',
			features: ['Interactive Playground', 'Hydra SDK', 'DApp Development', 'Testing'],
			url: 'https://playground.hydrasdk.com',
			visitButton: t('home.showcase.apps.hydraPlayground.visitButton')
		},
		{
			name: t('home.showcase.apps.hydraFly.name'),
			category: t('home.showcase.apps.hydraFly.category'),
			description: t('home.showcase.apps.hydraFly.description'),
			icon: '/images/fly.webp',
			features: ['GameFi', 'Leaderboard', 'Tournaments', 'Cardano Hydra'],
			url: 'https://alpha.hydraone.app/games/hydra-fly/play',
			visitButton: t('home.showcase.apps.hydraFly.visitButton')
		},
		{
			name: t('home.showcase.apps.riverCross.name'),
			category: t('home.showcase.apps.riverCross.category'),
			description: t('home.showcase.apps.riverCross.description'),
			icon: '/images/river-cross.webp',
			features: ['GameFi', 'Provably Fair', 'Multipliers', 'Survival Game'],
			url: 'https://alpha.hydraone.app/games/river-cross/play',
			visitButton: t('home.showcase.apps.riverCross.visitButton')
		},
		{
			name: t('home.showcase.apps.hydraGacha.name'),
			category: t('home.showcase.apps.hydraGacha.category'),
			description: t('home.showcase.apps.hydraGacha.description'),
			icon: '/images/gacha.webp',
			features: ['On-chain Lottery', 'NFT Tickets', 'Prize Pool', 'Layer 2'],
			url: 'https://alpha.hydraone.app/games/hydra-gacha',
			visitButton: t('home.showcase.apps.hydraGacha.visitButton')
		},
		{
			name: t('home.showcase.apps.knight.name'),
			category: t('home.showcase.apps.knight.category'),
			description: t('home.showcase.apps.knight.description'),
			icon: '/images/knight.webp',
			features: ['GameFi', 'Provably Fair', 'Multipliers', 'Dungeon Survival'],
			url: 'https://alpha.hydraone.app/games/knight/play',
			visitButton: t('home.showcase.apps.knight.visitButton')
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
