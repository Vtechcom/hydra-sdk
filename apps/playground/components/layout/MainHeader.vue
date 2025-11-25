<script lang="ts" setup>
	import { version } from '../../package.json'
	import { Button } from '../ui/button'

	const props = defineProps<{
		containerClass?: string
	}>()

	const uiStore = useUiStore()
</script>

<template>
	<header class="sticky top-0 z-50 border-b border-gray-200 bg-white-50 backdrop-blur-sm dark:border-gray-800 dark:bg-black-900 dark:bg-gray-900/80">
		<div class="mx-auto px-4" :class="props.containerClass">
			<div class="flex h-16 items-center justify-between">
				<!-- Logo and Title -->
				<div class="flex items-center space-x-4">
					<!-- Mobile Sidebar -->

					<NuxtLink :to="'/'" class="group flex items-center space-x-3">
						<img src="/logo-sdk.png" alt="SDK Logo" srcset="/logo-sdk.png" class="size-10" />
						<div class="hidden sm:block">
							<h1 class="text-lg font-semibold text-gray-600 transition-colors group-hover:text-blue-600 dark:text-gray-300 dark:group-hover:text-blue-400">Hydra SDK</h1>
							<p class="-mt-0.5 text-xs text-gray-600 dark:text-gray-300">Playground v{{ version }}</p>
						</div>
					</NuxtLink>
				</div>

				<!-- Navigation -->
				<!-- <nav class="hidden items-center space-x-6 md:flex">
					<NuxtLink
						v-for="item in navigation"
						:key="item.to"
						:to="item.to"
						class="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
					>
						{{ item.label }}
					</NuxtLink>
				</nav> -->

				<div class="">
					<!-- Network Switcher -->
					<BaseNetworkSwitch />
				</div>

				<!-- Right side actions -->
				<div class="flex items-center space-x-4">
					<!-- Search -->
					<!-- <UiDialogSearch v-model:open="openDialogSearch"> </UiDialogSearch> -->

					<Button @click="uiStore.resetLayout()" type="default" size="sm" variant="outline">
						<Icon name="mdi:card-remove-outline" size="16" class="mr-1" />
						Reset layout
					</Button>

					<!-- GitHub Link -->
					<NuxtLink class="flex" target="_blank" to="https://github.com/Vtechcom/hydra-sdk">
						<Icon name="mdi:github" size="24" />
					</NuxtLink>

					<!-- Theme Toggle -->
					<!-- <UiColorModeButton /> -->

					<!-- Mobile Menu -->
					<!-- <UButton icon="i-heroicons-bars-3" variant="ghost" size="sm" class="md:hidden" color="secondary" @click="mobileMenuOpen = !mobileMenuOpen" /> -->
				</div>
			</div>

			<!-- Mobile Navigation -->
			<!-- <transition name="slide-fade">
				<div v-if="mobileMenuOpen" class="animate__animated animate__slideInDown border-t border-gray-200 py-4 md:hidden dark:border-gray-700">
					<nav class="flex flex-col space-y-2">
						<NuxtLink
							v-for="item in navigation"
							:key="item.to"
							:to="item.to"
							class="rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400"
							@click="mobileMenuOpen = false"
						>
							{{ item.label }}
						</NuxtLink>
					</nav>
				</div>
			</transition> -->
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
</style>
