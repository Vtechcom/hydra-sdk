<script lang="ts" setup>
	const txStore = useTxBuilderStore()
	const { canBuild, building, validationErrors, stage } = storeToRefs(txStore)
</script>

<template>
	<div class="shrink-0 space-y-1.5 border-t bg-card/60 p-3">
		<!-- Why the button is disabled, stated up front rather than after a click. -->
		<ul v-if="validationErrors.length" class="space-y-0.5">
			<li v-for="error in validationErrors.slice(0, 3)" :key="error" class="flex items-start gap-1 text-[11px] text-muted-foreground">
				<Icon name="lucide:circle-alert" size="12" class="mt-0.5 shrink-0 text-warning-500" />
				{{ error }}
			</li>
			<li v-if="validationErrors.length > 3" class="pl-4 text-[11px] text-muted-foreground">
				+{{ validationErrors.length - 3 }} more to resolve
			</li>
		</ul>

		<Button size="lg" class="h-11 w-full" :disabled="!canBuild || building" @click="txStore.build()">
			<Icon :name="building ? 'lucide:loader-circle' : 'lucide:zap'" size="18" :class="building ? 'animate-spin' : ''" />
			{{ building ? 'Building…' : stage === 'draft' ? 'Build transaction' : 'Rebuild transaction' }}
			<kbd class="ml-1 rounded border border-current/30 px-1 text-[10px] opacity-70">⌘B</kbd>
		</Button>
	</div>
</template>
