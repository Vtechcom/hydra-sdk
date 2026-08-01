<script lang="ts" setup>
	import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
	import { TX_PRESETS } from '~/lib/tx-fixtures'
	import { encodeDraft } from '~/lib/share'
	import { cn } from '~/lib/utils'

	const txStore = useTxBuilderStore()
	const uiStore = useUiStore()
	const { stage, draft } = storeToRefs(txStore)

	const steps = [
		{ id: 'draft', label: 'Draft', icon: 'lucide:pencil-line' },
		{ id: 'built', label: 'Built', icon: 'lucide:hammer' },
		{ id: 'signed', label: 'Signed', icon: 'lucide:signature' },
		{ id: 'submitted', label: 'Sent', icon: 'lucide:send' }
	] as const

	const activeIndex = computed(() => steps.findIndex(step => step.id === stage.value))

	const copyShareLink = () => {
		const url = `${window.location.origin}${window.location.pathname}#draft=${encodeDraft(draft.value)}`
		useCopy(url)
	}
</script>

<template>
	<div class="flex shrink-0 flex-wrap items-center gap-3 border-b bg-card/40 px-3 py-1.5">
		<!-- Pipeline: where this transaction is, and what is left to do. -->
		<ol class="flex items-center gap-1">
			<li v-for="(step, index) in steps" :key="step.id" class="flex items-center gap-1">
				<span
					:class="
						cn(
							'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
							index < activeIndex && 'text-primary',
							index === activeIndex && 'bg-primary/10 text-primary',
							index > activeIndex && 'text-muted-foreground/60'
						)
					"
				>
					<Icon :name="index < activeIndex ? 'lucide:check' : step.icon" size="12" />
					{{ step.label }}
				</span>
				<Icon v-if="index < steps.length - 1" name="lucide:chevron-right" size="12" class="text-muted-foreground/40" />
			</li>
		</ol>

		<div class="ml-auto flex items-center gap-1">
			<DropdownMenu>
				<DropdownMenuTrigger as-child>
					<Button variant="outline" size="sm" class="h-7 text-xs">
						<Icon name="lucide:wand-sparkles" size="13" />
						Presets
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" class="w-72">
					<DropdownMenuItem v-for="preset in TX_PRESETS" :key="preset.id" class="flex-col items-start gap-0.5" @click="txStore.applyPreset(preset.id)">
						<span class="flex items-center gap-1.5 text-xs font-medium">
							<Icon :name="preset.icon" size="13" class="text-primary" />
							{{ preset.name }}
						</span>
						<span class="text-[11px] text-muted-foreground">{{ preset.description }}</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Button variant="ghost" size="sm" class="h-7 text-xs" title="Copy a link that restores this draft" @click="copyShareLink()">
				<Icon name="lucide:link" size="13" />
				Share
			</Button>

			<Button variant="ghost" size="sm" class="h-7 text-xs" @click="txStore.resetDraft()">
				<Icon name="lucide:rotate-ccw" size="13" />
				Reset draft
			</Button>

			<Button variant="ghost" size="sm" class="h-7 text-xs" title="Restore the default panel sizes" @click="uiStore.resetWorkspace()">
				<Icon name="lucide:layout-dashboard" size="13" />
				Reset layout
			</Button>
		</div>
	</div>
</template>
