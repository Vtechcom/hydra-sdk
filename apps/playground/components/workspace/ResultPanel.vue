<script lang="ts" setup>
	import BigNumber from 'bignumber.js'
	import { Deserializer, ParserUtils } from '@hydra-sdk/core'

	const txStore = useTxBuilderStore()
	const { draft, buildError, cborHex, txId, txJson, summary, building } = storeToRefs(txStore)

	const colorMode = useColorMode()
	const shikiTheme = computed(() => (colorMode.value === 'dark' ? 'github-dark' : 'github-light'))

	const tab = ref('summary')
	const snippetReturnsCbor = ref(false)

	const highlighter = await getShikiHighlighter()

	const highlightedJson = computed(() => {
		if (!txJson.value) return ''
		return highlighter.highlight(txJson.value, { lang: 'json', theme: shikiTheme.value })
	})

	/** Live view of the SDK calls the current draft maps to — no build required. */
	const snippet = computed(() => generateTxSnippet(draft.value, { returnCbor: snippetReturnsCbor.value }))
	const highlightedSnippet = computed(() => highlighter.highlight(snippet.value, { lang: 'typescript', theme: shikiTheme.value }))

	const ada = (lovelace?: string) => (lovelace ? BigNumber(lovelace).dividedBy(1_000_000).toFormat(6) : '—')

	const assetName = (unit: string) => {
		if (unit === 'lovelace') return 'lovelace'
		try {
			return ParserUtils.hexToString(Deserializer.deserializeAssetUnit(unit).assetName) || formatId(unit, 6, 4)
		} catch {
			return formatId(unit, 6, 4)
		}
	}

	const download = (content: string, filename: string) => {
		const blob = new Blob([content], { type: 'text/plain' })
		const url = URL.createObjectURL(blob)
		const anchor = document.createElement('a')
		anchor.href = url
		anchor.download = filename
		anchor.click()
		URL.revokeObjectURL(url)
	}
</script>

<template>
	<WorkspacePanel title="Result" icon="lucide:receipt" class="min-h-0" body-class="p-0 min-h-0 flex flex-col">
		<template #actions>
			<Badge v-if="txId" variant="success">built</Badge>
		</template>

		<Tabs v-model="tab" class="flex min-h-0 flex-1 flex-col gap-0">
			<TabsList class="mx-3 mt-3 w-[calc(100%-1.5rem)] shrink-0">
				<TabsTrigger value="summary" class="text-xs">Summary</TabsTrigger>
				<TabsTrigger value="cbor" class="text-xs">CBOR</TabsTrigger>
				<TabsTrigger value="json" class="text-xs">JSON</TabsTrigger>
				<TabsTrigger value="ts" class="text-xs">TS</TabsTrigger>
			</TabsList>

			<!-- Summary -->
			<TabsContent value="summary" class="min-h-0 overflow-y-auto scroll-bar-primary p-3">
				<Alert v-if="buildError" variant="destructive" class="mb-3">
					<AlertTitle class="flex items-center gap-1">
						<Icon name="lucide:circle-alert" size="14" />
						Build failed
					</AlertTitle>
					<AlertDescription class="text-xs break-words">{{ buildError }}</AlertDescription>
				</Alert>

				<div v-if="building" class="flex items-center gap-2 text-xs text-muted-foreground">
					<Icon name="lucide:loader-circle" size="14" class="animate-spin" />
					Building…
				</div>

				<div v-else-if="summary" class="space-y-3">
					<dl class="space-y-1.5">
						<div
v-for="row in [
							{ label: 'Fee', value: `${ada(summary.fee)} ADA` },
							{ label: 'Total in', value: `${ada(summary.totalIn)} ADA` },
							{ label: 'Total out', value: `${ada(summary.totalOut)} ADA` },
							{ label: 'Change', value: `${ada(summary.change)} ADA` },
							{ label: 'Size', value: `${summary.size} bytes` },
							{ label: 'Inputs / outputs', value: `${summary.inputCount} / ${summary.outputCount}` }
						]" :key="row.label" class="flex items-baseline justify-between gap-2 text-xs">
							<dt class="text-muted-foreground">{{ row.label }}</dt>
							<dd class="font-mono tabular-nums">{{ row.value }}</dd>
						</div>
					</dl>

					<div>
						<p class="eyebrow mb-1">Transaction id</p>
						<p class="flex items-start gap-1 font-mono text-[11px] break-all">
							{{ txId }}
							<Icon name="lucide:copy" size="12" class="mt-0.5 shrink-0 hover:cursor-pointer hover:text-primary" @click="useCopy(txId)" />
						</p>
					</div>

					<div v-if="summary.outputAmounts.length">
						<p class="eyebrow mb-1">Output amounts</p>
						<div class="space-y-1">
							<div v-for="asset in summary.outputAmounts" :key="asset.unit" class="flex items-baseline justify-between gap-2 rounded bg-muted/50 px-1.5 py-1">
								<span class="min-w-0 truncate text-[11px]">{{ assetName(asset.unit) }}</span>
								<span class="shrink-0 font-mono text-[11px] tabular-nums">{{ BigNumber(asset.quantity).toFormat() }}</span>
							</div>
						</div>
					</div>

					<Alert v-if="draft.isHydra" class="border-primary/40 bg-primary/5">
						<AlertDescription class="text-[11px]">
							Hydra mode: the transaction may be unbalanced and fee-less — valid inside a head, rejected on L1.
						</AlertDescription>
					</Alert>
				</div>

				<div v-else class="py-6 text-center">
					<Icon name="lucide:hammer" size="20" class="mx-auto mb-1 text-muted-foreground" />
					<p class="text-xs text-muted-foreground">Nothing built yet.</p>
					<p class="text-[11px] text-muted-foreground">Pick inputs and outputs, then hit Build.</p>
				</div>
			</TabsContent>

			<!-- CBOR -->
			<TabsContent value="cbor" class="min-h-0 overflow-y-auto scroll-bar-primary p-3">
				<div v-if="cborHex" class="space-y-2">
					<div class="flex gap-1">
						<Button variant="outline" size="sm" class="h-7 text-xs" @click="useCopy(cborHex)">
							<Icon name="lucide:copy" size="13" />
							Copy
						</Button>
						<Button variant="outline" size="sm" class="h-7 text-xs" @click="download(cborHex, `${txId.slice(0, 12)}.cbor.txt`)">
							<Icon name="lucide:download" size="13" />
							Download
						</Button>
					</div>
					<p class="rounded-md bg-muted/50 p-2 font-mono text-[11px] break-all">{{ cborHex }}</p>
				</div>
				<p v-else class="py-6 text-center text-xs text-muted-foreground">Build a transaction to see its CBOR.</p>
			</TabsContent>

			<!-- Decoded JSON -->
			<TabsContent value="json" class="min-h-0 overflow-auto scroll-bar-primary p-3">
				<div v-if="txJson" class="space-y-2">
					<Button variant="outline" size="sm" class="h-7 text-xs" @click="useCopy(txJson)">
						<Icon name="lucide:copy" size="13" />
						Copy
					</Button>
					<!-- eslint-disable-next-line vue/no-v-html -->
					<div class="overflow-x-auto scroll-bar-primary text-[11px] [&_pre]:!bg-transparent" v-html="highlightedJson" />
				</div>
				<p v-else class="py-6 text-center text-xs text-muted-foreground">Build a transaction to inspect its decoded body.</p>
			</TabsContent>

			<!-- Generated TypeScript -->
			<TabsContent value="ts" class="min-h-0 overflow-auto scroll-bar-primary p-3">
				<div class="space-y-2">
					<div class="flex flex-wrap items-center gap-1">
						<Button variant="outline" size="sm" class="h-7 text-xs" @click="useCopy(snippet)">
							<Icon name="lucide:copy" size="13" />
							Copy
						</Button>
						<Button variant="outline" size="sm" class="h-7 text-xs" @click="download(snippet, 'build-tx.ts')">
							<Icon name="lucide:download" size="13" />
							Download
						</Button>
						<Button
							variant="ghost"
							size="sm"
							class="h-7 text-xs"
							:class="snippetReturnsCbor ? 'bg-accent text-accent-foreground' : ''"
							@click="snippetReturnsCbor = !snippetReturnsCbor"
						>
							completeCbor()
						</Button>
					</div>
					<p class="text-[11px] text-muted-foreground">Live — mirrors the draft as you edit it, no build needed.</p>
					<!-- eslint-disable-next-line vue/no-v-html -->
					<div class="overflow-x-auto scroll-bar-primary text-[11px] [&_pre]:!bg-transparent" v-html="highlightedSnippet" />
				</div>
			</TabsContent>
		</Tabs>
	</WorkspacePanel>
</template>
