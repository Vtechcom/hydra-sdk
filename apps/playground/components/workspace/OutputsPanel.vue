<script lang="ts" setup>
	import BigNumber from 'bignumber.js'
	import type { TxOutputDraft } from '~/lib/tx-draft'
	import { cn } from '~/lib/utils'

	const txStore = useTxBuilderStore()
	const { draft, totalOutputLovelace } = storeToRefs(txStore)

	const jsonMode = ref(false)
	const jsonText = ref('')
	const jsonError = ref('')

	const jsonPlaceholder = `[
  {
    "address": "addr_test1…",
    "amount": [
      { "unit": "lovelace", "quantity": "1000000" }
    ],
    "inlineDatum": "d87980"
  }
]`

	// Form → JSON stays live; JSON → form only on Apply, so typing never fights
	// the form state underneath.
	watch(
		[() => draft.value.outputs, jsonMode],
		() => {
			if (!jsonMode.value) jsonText.value = JSON.stringify(draft.value.outputs, null, 2)
		},
		{ deep: true, immediate: true }
	)

	const validate = useDebounceFn((text: string) => {
		if (!text.trim()) {
			jsonError.value = ''
			return
		}
		try {
			const parsed = JSON.parse(text)
			if (!Array.isArray(parsed)) throw new Error('Outputs must be a JSON array')
			parsed.forEach((output: TxOutputDraft, index: number) => {
				if (typeof output?.address !== 'string') throw new Error(`Output #${index + 1}: "address" must be a string`)
				if (!Array.isArray(output?.amount)) throw new Error(`Output #${index + 1}: "amount" must be an array`)
			})
			jsonError.value = ''
		} catch (error) {
			jsonError.value = error instanceof Error ? error.message : 'Invalid JSON'
		}
	}, 400)

	watch(jsonText, text => validate(text))

	const applyJson = () => {
		try {
			const parsed = JSON.parse(jsonText.value) as TxOutputDraft[]
			if (!Array.isArray(parsed)) throw new Error('Outputs must be a JSON array')
			draft.value.outputs = parsed
			jsonError.value = ''
			jsonMode.value = false
		} catch (error) {
			jsonError.value = error instanceof Error ? error.message : 'Invalid JSON'
		}
	}
</script>

<template>
	<WorkspacePanel
		title="Outputs"
		icon="lucide:log-out"
		:meta="`${draft.outputs.length} output · ${BigNumber(totalOutputLovelace.toString()).dividedBy(1_000_000).toFormat()} ADA`"
	>
		<template #actions>
			<Button
				variant="ghost"
				size="sm"
				:class="cn('h-6 px-1.5 text-[11px]', jsonMode && 'bg-accent text-accent-foreground')"
				@click="jsonMode = !jsonMode"
			>
				<Icon name="lucide:braces" size="13" />
				JSON
			</Button>
			<Button variant="ghost" size="sm" class="h-6 px-1.5 text-[11px]" :disabled="!draft.outputs.length" @click="txStore.clearOutputs()">Clear</Button>
		</template>

		<div v-if="!jsonMode" class="space-y-2">
			<WorkspaceOutputRow
				v-for="(output, index) in draft.outputs"
				:key="`output-${index}`"
				:output="output"
				:index="index"
				@remove="txStore.removeOutput(index)"
			/>
			<Button variant="outline" size="sm" class="h-8 w-full border-dashed text-xs" @click="txStore.addOutput()">
				<Icon name="lucide:plus" size="14" />
				Add recipient
			</Button>
		</div>

		<div v-else class="space-y-1.5">
			<Textarea v-model="jsonText" rows="12" :placeholder="jsonPlaceholder" class="font-mono !text-[11px]" :class="jsonError ? 'border-destructive' : ''" />
			<p v-if="jsonError" class="text-[11px] text-destructive">{{ jsonError }}</p>
			<div class="flex justify-end gap-1">
				<Button variant="ghost" size="sm" class="h-7 text-xs" @click="jsonMode = false">Cancel</Button>
				<Button variant="secondary" size="sm" class="h-7 text-xs" :disabled="!!jsonError || !jsonText.trim()" @click="applyJson()">Apply JSON</Button>
			</div>
		</div>
	</WorkspacePanel>
</template>
