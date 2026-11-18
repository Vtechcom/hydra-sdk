<script lang="ts" setup>
	import { cn } from '~/lib/utils'

	const providerStore = useProviderStore()
	const { providerNetwork, providerReady, providerKind } = storeToRefs(providerStore)

	const open = ref(false)

	const label = computed(() => {
		if (!providerReady.value) return 'Provider not configured'
		return providerKind.value === 'demeter' ? 'Demeter connected' : 'Blockfrost connected'
	})
</script>

<template>
	<div class="space-y-2">
		<div class="flex items-center gap-1.5">
			<span :class="cn('size-1.5 shrink-0 rounded-full', providerReady ? 'bg-primary' : 'bg-muted-foreground/40')" />
			<span class="text-xs">{{ label }}</span>
			<Badge variant="muted" class="ml-auto">{{ providerNetwork }}</Badge>
		</div>

		<Button size="sm" variant="outline" class="h-7 w-full text-xs" @click="open = true">
			<Icon name="lucide:settings-2" size="14" />
			Configure
		</Button>

		<WorkspaceProviderDialog v-model:open="open" />
	</div>
</template>
