<script lang="ts" setup>
	import { ResizablePanel } from '~/components/ui/resizable'
	import { decodeDraft } from '~/lib/share'
	import { toast } from 'vue-sonner'

	const TITLE = 'Transaction Builder — Hydra SDK Playground'
	const DESCRIPTION =
		'Build, inspect and submit Cardano and Hydra transactions with the Hydra SDK TxBuilder — with the matching TypeScript generated as you go.'

	// Shared links to this route should carry its own copy; the card image and the
	// rest of the social tags come from app.vue.
	useSeoMeta({
		title: TITLE,
		description: DESCRIPTION,
		ogTitle: TITLE,
		ogDescription: DESCRIPTION,
		ogUrl: 'https://playground.hydrasdk.com/transaction-builder',
		twitterTitle: TITLE,
		twitterDescription: DESCRIPTION
	})

	const uiStore = useUiStore()
	const txStore = useTxBuilderStore()
	const { draft, canBuild, building } = storeToRefs(txStore)

	// A shared draft arrives in the URL fragment, so it never touches a server.
	onMounted(() => {
		const match = window.location.hash.match(/draft=([^&]+)/)
		if (!match) return
		const shared = decodeDraft(match[1])
		if (!shared) {
			toast.error('That share link could not be decoded.')
			return
		}
		draft.value = shared
		txStore.clearResults()
		history.replaceState(null, '', window.location.pathname)
		toast.success('Loaded the shared draft')
	})

	const onBuildShortcut = (event: KeyboardEvent) => {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
			event.preventDefault()
			if (canBuild.value && !building.value) txStore.build()
		}
	}
	onMounted(() => window.addEventListener('keydown', onBuildShortcut))
	onBeforeUnmount(() => window.removeEventListener('keydown', onBuildShortcut))

	const mobileTab = ref('build')
</script>

<template>
	<div class="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
		<WorkspaceStatusBar />

		<!-- Desktop: context · builder · result, each column independently resizable -->
		<div class="hidden min-h-0 flex-1 lg:flex">
			<WorkspaceContextRail v-if="uiStore.contextCollapsed" />

			<ResizablePanelGroup
				id="tx-workspace"
				direction="horizontal"
				class="min-h-0 flex-1"
				@layout="uiStore.setColumns"
			>
				<ResizablePanel v-if="!uiStore.contextCollapsed" id="context" :default-size="uiStore.layout.columns[0]" :min-size="16" :max-size="34">
					<WorkspaceContextRail />
				</ResizablePanel>
				<ResizableHandle v-if="!uiStore.contextCollapsed" with-handle />

				<ResizablePanel id="builder" :default-size="uiStore.layout.columns[1]" :min-size="28">
					<div class="flex h-full min-h-0 flex-col">
						<div class="min-h-0 flex-1 space-y-3 overflow-y-auto scroll-bar-primary p-3">
							<WorkspaceInputsPanel />
							<WorkspaceOutputsPanel />
							<WorkspaceOptionsPanel />
						</div>
						<WorkspaceBuildBar />
					</div>
				</ResizablePanel>
				<ResizableHandle with-handle />

				<ResizablePanel id="result" :default-size="uiStore.layout.columns[2]" :min-size="22">
					<div class="h-full min-h-0 p-3">
						<WorkspaceResultPanel class="h-full" />
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>

		<!-- Below lg the same panels stack behind tabs instead of columns. -->
		<div class="flex min-h-0 flex-1 flex-col lg:hidden">
			<Tabs v-model="mobileTab" class="flex min-h-0 flex-1 flex-col gap-0">
				<TabsList class="m-2 shrink-0">
					<TabsTrigger value="context" class="text-xs">Context</TabsTrigger>
					<TabsTrigger value="build" class="text-xs">Build</TabsTrigger>
					<TabsTrigger value="result" class="text-xs">Result</TabsTrigger>
				</TabsList>
				<TabsContent value="context" class="min-h-0 overflow-y-auto scroll-bar-primary">
					<WorkspaceContextRail />
				</TabsContent>
				<TabsContent value="build" class="flex min-h-0 flex-col">
					<div class="min-h-0 flex-1 space-y-3 overflow-y-auto scroll-bar-primary p-2">
						<WorkspaceInputsPanel />
						<WorkspaceOutputsPanel />
						<WorkspaceOptionsPanel />
					</div>
					<WorkspaceBuildBar />
				</TabsContent>
				<TabsContent value="result" class="min-h-0 p-2">
					<WorkspaceResultPanel class="h-full" />
				</TabsContent>
			</Tabs>
		</div>

		<WorkspaceBottomDock />
	</div>
</template>
