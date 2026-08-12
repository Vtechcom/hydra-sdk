<script lang="ts" setup>
	import { toast } from 'vue-sonner'
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
	import { Button } from '~/components/ui/button'
	import { Badge } from '~/components/ui/badge'
	import { Input } from '~/components/ui/input'
	import { buildDemoTx, priceDemoTx, feeParams, toAda, PLACEHOLDER_EXUNITS, type DemoTx } from '~/lib/fee-lab'

	const TITLE = 'Fee Lab — Hydra SDK Playground'
	const DESCRIPTION = 'See exactly how a Cardano script transaction fee is built — size, script execution, and reference-script components — computed offline with no provider.'
	useSeoMeta({
		title: TITLE,
		description: DESCRIPTION,
		ogTitle: TITLE,
		ogDescription: DESCRIPTION,
		ogUrl: 'https://playground.hydrasdk.com/fee-lab'
	})
	definePageMeta({ title: 'Fee Lab' })

	const params = feeParams()

	const demo = ref<DemoTx | null>(null)
	const building = ref(true)
	const buildError = ref<string | null>(null)

	// exUnits under the microscope. Defaults to the real always-succeed budget.
	const mem = ref(500)
	const steps = ref(64100)

	const presets = [
		{ id: 'real', label: 'Real (always-succeed)', mem: 500, steps: 64100 },
		{ id: 'placeholder', label: 'Placeholder', mem: PLACEHOLDER_EXUNITS.mem, steps: PLACEHOLDER_EXUNITS.steps },
		{ id: 'heavy', label: 'Heavy script', mem: 2_000_000, steps: 700_000_000 }
	]
	const applyPreset = (p: { mem: number; steps: number }) => {
		mem.value = p.mem
		steps.value = p.steps
	}

	const breakdown = computed(() => {
		if (!demo.value) return null
		try {
			return priceDemoTx(demo.value, { mem: Math.max(0, mem.value || 0), steps: Math.max(0, steps.value || 0) })
		} catch {
			return null
		}
	})

	// Stacked-bar segments — proportional to the base fee (pre-margin).
	const segments = computed(() => {
		const b = breakdown.value
		if (!b) return []
		const base = Number(b.baseFee) || 1
		return [
			{ key: 'size', label: 'Size', value: Number(b.sizeFee), cls: 'bg-emerald-500' },
			{ key: 'script', label: 'Script', value: Number(b.scriptFee), cls: 'bg-amber-500' },
			{ key: 'ref', label: 'Reference', value: Number(b.refScriptFee), cls: 'bg-sky-500' }
		].map(s => ({ ...s, pct: Math.max(0, (s.value / base) * 100) }))
	})

	const fmt = (n: string | number) => Number(n).toLocaleString('en-US')

	onMounted(async () => {
		try {
			demo.value = await buildDemoTx()
		} catch (error: any) {
			buildError.value = error?.message ?? String(error)
		} finally {
			building.value = false
		}
	})

	// The offline Plutus evaluator (@hydra-sdk/evaluator) runs its ~13MB Rust/WASM
	// engine in Node/CLI/backends — not in a browser bundle. These are the exact
	// exUnits it returns for this always-succeed V3 SPEND (locked by the package's
	// differential conformance test against both whisky and scalus). Applying them
	// here shows the offline-evaluated budget flowing into the fee, no provider.
	const OFFLINE_EVALUATED = { mem: 500, steps: 64100 }
	const applyOfflineEvaluated = () => {
		mem.value = OFFLINE_EVALUATED.mem
		steps.value = OFFLINE_EVALUATED.steps
		toast.success(`Offline evaluator budget: mem ${fmt(OFFLINE_EVALUATED.mem)}, steps ${fmt(OFFLINE_EVALUATED.steps)}`, {
			description: 'Produced by @hydra-sdk/evaluator with no provider — runs in Node/CLI.'
		})
	}

	const evaluatorSnippet = `import { createEvaluator, fromUtxos } from '@hydra-sdk/evaluator'

const evaluator = await createEvaluator({ source: fromUtxos(utxos) })
const [spend] = await evaluator.evaluateTx(txHex)
// → { tag: 'SPEND', index: 0, budget: { mem: 500, steps: 64100 } }`
</script>

<template>
	<div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
		<!-- Hero -->
		<header class="mb-8">
			<div class="mb-2 flex items-center gap-2">
				<span class="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Offline · No provider</span>
			</div>
			<h1 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">Fee Lab</h1>
			<p class="mt-2 max-w-2xl text-sm text-muted-foreground">
				Watch a Cardano script transaction's fee assemble from its parts. The script execution budget (exUnits) is the knob — drag it and see the fee move. Everything here is computed
				offline with
				<code class="rounded bg-muted px-1 py-0.5 text-xs">FeeUtils.calculateTxFee</code>, no API key or network.
			</p>
		</header>

		<div v-if="building" class="flex items-center gap-3 text-sm text-muted-foreground">
			<Icon name="lucide:loader-circle" class="size-4 animate-spin" />
			Building the demo transaction…
		</div>
		<div v-else-if="buildError" class="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
			Could not build the demo transaction: {{ buildError }}
		</div>

		<div v-else class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
			<!-- Controls -->
			<Card class="h-fit">
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-base">
						<Icon name="lucide:sliders-horizontal" class="size-4 text-primary" />
						Script execution units
					</CardTitle>
					<CardDescription>The exUnits an evaluator returns for the script. This is what a provider would charge you an API call to learn.</CardDescription>
				</CardHeader>
				<CardContent class="space-y-5">
					<div class="grid grid-cols-2 gap-3">
						<label class="space-y-1.5">
							<span class="text-xs font-medium text-muted-foreground">Memory (mem)</span>
							<Input v-model.number="mem" type="number" min="0" />
						</label>
						<label class="space-y-1.5">
							<span class="text-xs font-medium text-muted-foreground">CPU (steps)</span>
							<Input v-model.number="steps" type="number" min="0" />
						</label>
					</div>

					<div class="flex flex-wrap gap-2">
						<Button v-for="p in presets" :key="p.id" variant="outline" size="sm" class="h-7 text-xs" @click="applyPreset(p)">
							{{ p.label }}
						</Button>
					</div>

					<div class="rounded-lg border border-dashed border-border p-3">
						<div class="mb-2 flex items-center justify-between">
							<span class="text-xs font-medium text-muted-foreground">Real exUnits, no provider</span>
							<Badge variant="secondary" class="text-[10px]">@hydra-sdk/evaluator</Badge>
						</div>
						<p class="mb-2 text-xs text-muted-foreground">The offline Plutus evaluator produces exUnits with no API key — its engine runs in Node/CLI/backends:</p>
						<pre class="mb-3 overflow-x-auto rounded bg-muted p-2 text-[10px] leading-relaxed"><code>{{ evaluatorSnippet }}</code></pre>
						<Button size="sm" variant="outline" class="h-8 w-full" @click="applyOfflineEvaluated">
							<Icon name="lucide:cpu" class="size-4" />
							Use the evaluated budget
						</Button>
					</div>

					<!-- Protocol params -->
					<div class="space-y-1 border-t border-border pt-4 text-xs">
						<div class="mb-1 font-medium text-muted-foreground">Protocol parameters (fee formula)</div>
						<div class="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px]">
							<span class="text-muted-foreground">minFeeA</span><span class="text-right">{{ params.minFeeA }}</span> <span class="text-muted-foreground">minFeeB</span
							><span class="text-right">{{ fmt(params.minFeeB) }}</span> <span class="text-muted-foreground">priceMem</span><span class="text-right">{{ params.priceMem }}</span>
							<span class="text-muted-foreground">priceStep</span><span class="text-right">{{ params.priceStep }}</span> <span class="text-muted-foreground">refScript/byte</span
							><span class="text-right">{{ params.minFeeRefScriptCostPerByte }}</span>
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Visualisation -->
			<div class="space-y-6">
				<Card>
					<CardContent class="pt-6">
						<div v-if="breakdown" class="space-y-5">
							<!-- Total -->
							<div class="flex items-end justify-between">
								<div>
									<div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total fee</div>
									<div class="mt-1 flex items-baseline gap-2">
										<span class="font-display text-4xl font-bold tabular-nums">₳{{ toAda(breakdown.fee) }}</span>
										<span class="text-sm text-muted-foreground">{{ fmt(breakdown.fee) }} lovelace</span>
									</div>
								</div>
								<div class="text-right text-xs text-muted-foreground">
									<div>{{ breakdown.txBytes }} bytes</div>
									<div>{{ breakdown.signerCount }} signer{{ breakdown.signerCount === 1 ? '' : 's' }}</div>
								</div>
							</div>

							<!-- Stacked bar -->
							<div>
								<div class="flex h-6 w-full overflow-hidden rounded-md border border-border">
									<div
										v-for="s in segments"
										:key="s.key"
										class="h-full transition-[width] duration-300"
										:class="s.cls"
										:style="{ width: s.pct + '%' }"
										:title="`${s.label}: ${fmt(s.value)} lovelace`"
									/>
								</div>
								<div class="mt-3 flex flex-wrap gap-4">
									<div v-for="s in segments" :key="s.key" class="flex items-center gap-2">
										<span class="size-2.5 rounded-sm" :class="s.cls" />
										<span class="text-xs text-muted-foreground">{{ s.label }}</span>
										<span class="text-xs font-medium tabular-nums">{{ fmt(s.value) }}</span>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<!-- Formula breakdown -->
				<div class="grid gap-3 sm:grid-cols-3">
					<Card>
						<CardContent class="space-y-2 p-4">
							<div class="flex items-center gap-2">
								<span class="size-2.5 rounded-sm bg-emerald-500" />
								<span class="text-sm font-semibold">Size fee</span>
							</div>
							<div class="font-mono text-[11px] leading-relaxed text-muted-foreground">minFeeA × bytes + minFeeB</div>
							<div class="font-mono text-[11px] text-muted-foreground">{{ params.minFeeA }} × {{ breakdown?.txBytes }} + {{ fmt(params.minFeeB) }}</div>
							<div class="tabular-nums text-lg font-bold">{{ fmt(breakdown?.sizeFee ?? 0) }}</div>
							<p class="text-[10px] text-muted-foreground">incl. {{ breakdown?.signerCount }} mock witness + fee-field headroom</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent class="space-y-2 p-4">
							<div class="flex items-center gap-2">
								<span class="size-2.5 rounded-sm bg-amber-500" />
								<span class="text-sm font-semibold">Script fee</span>
							</div>
							<div class="font-mono text-[11px] leading-relaxed text-muted-foreground">⌈priceMem × mem + priceStep × steps⌉</div>
							<div class="font-mono text-[11px] text-muted-foreground">{{ params.priceMem }}×{{ fmt(mem) }} + {{ params.priceStep }}×{{ fmt(steps) }}</div>
							<div class="tabular-nums text-lg font-bold">{{ fmt(breakdown?.scriptFee ?? 0) }}</div>
							<p class="text-[10px] text-muted-foreground">this is what evaluation buys you</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent class="space-y-2 p-4">
							<div class="flex items-center gap-2">
								<span class="size-2.5 rounded-sm bg-sky-500" />
								<span class="text-sm font-semibold">Reference fee</span>
							</div>
							<div class="font-mono text-[11px] leading-relaxed text-muted-foreground">refScriptCost/byte × refBytes</div>
							<div class="font-mono text-[11px] text-muted-foreground">{{ params.minFeeRefScriptCostPerByte }} × {{ breakdown?.refScriptBytes ?? 0 }}</div>
							<div class="tabular-nums text-lg font-bold">{{ fmt(breakdown?.refScriptFee ?? 0) }}</div>
							<p class="text-[10px] text-muted-foreground">0 — the script is in the witness set, not a reference input</p>
						</CardContent>
					</Card>
				</div>

				<!-- Fast rebalance explainer -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2 text-base">
							<Icon name="lucide:scale" class="size-4 text-primary" />
							Rebalancing after evaluation
						</CardTitle>
						<CardDescription>
							Real exUnits change the fee, so the transaction must be rebalanced. Coin selection is the expensive part —
							<code class="rounded bg-muted px-1 py-0.5 text-xs">fastRebalance</code> runs it only once.
						</CardDescription>
					</CardHeader>
					<CardContent class="grid gap-3 sm:grid-cols-2">
						<div class="rounded-lg border border-border p-3">
							<div class="mb-1 text-xs font-semibold text-muted-foreground">complete()</div>
							<div class="flex items-center gap-1.5 text-xs">
								<Badge variant="outline" class="text-[10px]">select</Badge>
								<Icon name="lucide:arrow-right" class="size-3 text-muted-foreground" />
								<Badge variant="outline" class="text-[10px]">evaluate</Badge>
								<Icon name="lucide:arrow-right" class="size-3 text-muted-foreground" />
								<Badge variant="outline" class="text-[10px]">select again</Badge>
							</div>
						</div>
						<div class="rounded-lg border border-primary/40 bg-primary/5 p-3">
							<div class="mb-1 text-xs font-semibold text-primary">complete(&#123; fastRebalance: true &#125;)</div>
							<div class="flex items-center gap-1.5 text-xs">
								<Badge variant="outline" class="text-[10px]">select</Badge>
								<Icon name="lucide:arrow-right" class="size-3 text-muted-foreground" />
								<Badge variant="outline" class="text-[10px]">evaluate</Badge>
								<Icon name="lucide:arrow-right" class="size-3 text-muted-foreground" />
								<Badge variant="secondary" class="text-[10px]">reuse inputs + rebalance</Badge>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	</div>
</template>
