<script lang="ts" setup>
	import { version } from '../../package.json'
	import { Button } from '../ui/button'

	const props = defineProps<{
		containerClass?: string
	}>()

	// Same set of destinations as the docs header (apps/docs-v2/app/app.config.ts)
	// so the two properties feel like one product.
	const socialLinks = [
		{ icon: 'simple-icons:github', to: 'https://github.com/Vtechcom/hydra-sdk', label: 'Hydra SDK on GitHub' },
		{ icon: 'simple-icons:discord', to: 'https://discord.com/invite/eZKRyQnbea', label: 'Hydra SDK on Discord' },
		{ icon: 'simple-icons:x', to: 'https://x.com/VtechcomLabs', label: 'Vtechcom Labs on X' }
	]
</script>

<template>
	<header class="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
		<div class="mx-auto px-4" :class="props.containerClass">
			<div class="flex h-14 items-center gap-4">
				<!-- Brand -->
				<NuxtLink :to="'/'" class="group/brand flex shrink-0 items-center gap-2.5">
					<img src="/logo-sdk.png" alt="Hydra SDK" class="size-8 shrink-0 transition-transform duration-300 ease-out group-hover/brand:scale-110" >
					<span class="hidden flex-col gap-0.5 sm:flex">
						<span class="font-display text-base font-bold leading-none tracking-tight">Hydra SDK</span>
						<span class="text-[10px] font-medium uppercase leading-none tracking-[0.14em] text-muted-foreground">Playground v{{ version }}</span>
					</span>
				</NuxtLink>

				<div class="flex-1" />

				<BaseNetworkSwitch class="w-[150px]" />

				<Separator orientation="vertical" class="h-6" />

				<div class="flex items-center gap-1">
					<Button as-child variant="ghost" size="sm" class="hidden h-8 md:inline-flex">
						<NuxtLink to="https://hydrasdk.com" target="_blank">
							<Icon name="lucide:book-open" size="16" />
							<span>Docs</span>
						</NuxtLink>
					</Button>

					<BaseColorModeToggle />

					<Button
						v-for="link in socialLinks"
						:key="link.to"
						as-child
						variant="ghost"
						size="sm"
						class="size-8 p-0"
					>
						<NuxtLink :to="link.to" target="_blank" :aria-label="link.label">
							<Icon :name="link.icon" size="17" />
						</NuxtLink>
					</Button>
				</div>
			</div>
		</div>
	</header>
</template>
