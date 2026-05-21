<script lang="ts" setup>
	const props = defineProps<{
		containerClass?: string
	}>()

	const openDialogSearch = defineModel('openDialogSearch', { type: Boolean, required: false, default: false })
	const sidebarOpen = defineModel('sidebarOpen', { type: Boolean, required: false, default: false })
	const mobileMenuOpen = ref(false)

	const { t, locale } = useI18n()
	const localePath = useLocalePath()

	const navigation = computed(() => [
		{ label: t('nav.gettingStarted'), to: localePath('/getting-started') },
		{ label: t('nav.apiReference'), to: localePath('/api') },
		{ label: t('nav.examples'), to: localePath('/examples') },
		{ label: t('nav.guides'), to: localePath('/guides') },
		{ label: 'Playground', to: 'https://play.hydrasdk.com', target: '_blank', animation: true }
	])
</script>

<template>
	<header class="sticky top-0 z-50 border-b border-gray-200 backdrop-blur-sm bg-white-50 dark:border-gray-800 dark:bg-black-900 dark:bg-gray-900/80">
		<div class="px-4 mx-auto" :class="props.containerClass">
			<div class="flex justify-between items-center h-16">
				<!-- Logo and Title -->
				<div class="flex items-center space-x-4">
					<!-- Mobile Sidebar -->

					<NuxtLink :to="localePath('/')" class="flex items-center space-x-3 group">
						<img src="/logo.png" alt="SDK Logo" srcset="/logo.png" class="size-8" />
						<div class="hidden sm:block">
							<h1 class="text-lg font-semibold text-gray-600 transition-colors dark:text-white group-hover:text-blue-600 dark:text-gray-300 dark:group-hover:text-blue-400">Hydra SDK</h1>
							<p class="-mt-0.5 text-xs text-gray-600 dark:text-gray-300">Documentation</p>
						</div>
					</NuxtLink>
				</div>

				<!-- Navigation -->
				<nav class="hidden items-center space-x-6 lg:flex">
					<NuxtLink
						v-for="item in navigation"
						:key="item.to"
						:to="item.to"
						:target="item.target"
						:class="item.animation ? 'animate__animated animate__bounce_1 animate__infinite animate__slow animate__delay-3s' : ''"
						class="text-sm font-semibold text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
					>
						{{ item.label }}
					</NuxtLink>
				</nav>

				<!-- Right side actions -->
				<div class="flex items-center space-x-4">
					<!-- Search -->
					<UiDialogSearch v-model:open="openDialogSearch"> </UiDialogSearch>

					<!-- Language Switcher -->
					<UiLanguageSwitcher />

					<div>
						<!-- NPM Link -->
						<UButton icon="i-simple-icons-npm" variant="ghost" size="sm" target="_blank" color="secondary" to="https://www.npmjs.com/search?q=%40hydra-sdk" />

						<!-- Discord Link -->
						<UButton icon="i-simple-icons-discord" variant="ghost" size="sm" target="_blank" color="secondary" to="https://discord.com/invite/eZKRyQnbea" />

						<!-- GitHub Link -->
						<UButton icon="i-simple-icons-github" variant="ghost" size="sm" target="_blank" color="secondary" to="https://github.com/Vtechcom/hydra-sdk" />
					</div>

					<!-- Theme Toggle -->
					<UiColorModeButton />

					<!-- Mobile Menu -->
					<UButton icon="i-heroicons-bars-3" variant="ghost" size="sm" class="lg:hidden" color="secondary" @click="mobileMenuOpen = !mobileMenuOpen" />
				</div>
			</div>

			<!-- Mobile Navigation -->
			<transition name="slide-fade">
				<div v-if="mobileMenuOpen" class="py-4 border-t border-gray-200 lg:hidden dark:border-gray-700">
					<nav class="flex flex-col space-y-2">
						<NuxtLink
							v-for="item in navigation"
							:key="item.to"
							:to="item.to"
							class="px-3 py-2 text-sm font-medium text-gray-600 rounded-md transition-colors hover:bg-gray-100 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400"
							@click="mobileMenuOpen = false"
						>
							{{ item.label }}
						</NuxtLink>
					</nav>
				</div>
			</transition>
		</div>
	</header>
</template>

<style lang="scss" scoped>
	.slide-fade-enter-active {
		@apply transition-all duration-300 ease-out;
	}
	.slide-fade-leave-active {
		@apply transition-all duration-200 ease-in;
	}
	.slide-fade-enter-from {
		@apply -translate-y-2 opacity-0;
	}
	.slide-fade-enter-to {
		@apply translate-y-0 opacity-100;
	}
	.slide-fade-leave-from {
		@apply translate-y-0 opacity-100;
	}
	.slide-fade-leave-to {
		@apply -translate-y-2 opacity-0;
	}

	/* Bounce Animation */

	@keyframes bounce_1 {
		from,
		20%,
		53%,
		to {
			-webkit-animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
			animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
			-webkit-transform: translate3d(0, 0, 0);
			transform: translate3d(0, 0, 0);
		}

		40%,
		43% {
			-webkit-animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
			animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
			-webkit-transform: translate3d(0, -10px, 0) scaleY(1.1);
			transform: translate3d(0, -10px, 0) scaleY(1.1);
		}

		70% {
			-webkit-animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
			animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
			-webkit-transform: translate3d(0, -5px, 0) scaleY(1.05);
			transform: translate3d(0, -5px, 0) scaleY(1.05);
		}

		80% {
			-webkit-transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
			transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
			-webkit-transform: translate3d(0, 0, 0) scaleY(0.95);
			transform: translate3d(0, 0, 0) scaleY(0.95);
		}

		90% {
			-webkit-transform: translate3d(0, -2px, 0) scaleY(1.02);
			transform: translate3d(0, -2px, 0) scaleY(1.02);
		}
	}

	.animate__bounce_1 {
		-webkit-animation-name: bounce_1;
		animation-name: bounce_1;
	}
</style>
