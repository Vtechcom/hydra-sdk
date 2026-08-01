<script lang="ts" setup>
	const txStore = useTxBuilderStore()
	const uiStore = useUiStore()
	const providerStore = useProviderStore()
	const { cborHex, signedCborHex, signError, submitError, submittedTxId, signing, submitting, partialSign, stage } = storeToRefs(txStore)

	// Each pane keeps a local buffer so a CBOR can be pasted in from elsewhere,
	// but a fresh build/sign upstream always flows straight through.
	const unsignedInput = ref(cborHex.value)
	watch(cborHex, value => {
		unsignedInput.value = value
		// A successful build is the hand-off point — reveal the next step.
		if (value) uiStore.dockOpen = true
	})

	const signedInput = ref(signedCborHex.value)
	watch(signedCborHex, value => (signedInput.value = value))

	const providerReady = computed(() => !!providerStore.blockfrostConfig.apiKey)
</script>

<template>
	<div class="flex min-h-0 flex-col border-t bg-card/40">
		<button
			type="button"
			class="flex shrink-0 items-center gap-2 px-3 py-1.5 text-left hover:cursor-pointer hover:bg-accent/40"
			@click="uiStore.dockOpen = !uiStore.dockOpen"
		>
			<Icon :name="uiStore.dockOpen ? 'lucide:chevron-down' : 'lucide:chevron-up'" size="14" class="text-muted-foreground" />
			<span class="eyebrow">Sign &amp; submit</span>
			<Badge v-if="stage === 'signed'" variant="success">signed</Badge>
			<Badge v-else-if="stage === 'submitted'" variant="success">submitted</Badge>
			<Badge v-else-if="stage === 'built'" variant="muted">ready to sign</Badge>
			<span v-if="submittedTxId" class="ml-2 truncate font-mono text-[11px] text-muted-foreground">{{ formatId(submittedTxId, 10, 8) }}</span>
		</button>

		<div v-if="uiStore.dockOpen" class="grid min-h-0 gap-3 overflow-y-auto scroll-bar-primary p-3 lg:grid-cols-2">
			<!-- Signer -->
			<section class="space-y-1.5">
				<div class="flex items-center gap-2">
					<Icon name="lucide:signature" size="14" class="text-primary" />
					<h3 class="text-sm font-semibold">Signer</h3>
					<Button
						v-if="cborHex && unsignedInput !== cborHex"
						variant="ghost"
						size="sm"
						class="ml-auto h-6 px-1.5 text-[11px]"
						@click="unsignedInput = cborHex"
					>
						Use built tx
					</Button>
				</div>
				<Textarea v-model="unsignedInput" rows="3" placeholder="84a400d90…" class="font-mono !text-[11px]" />
				<div class="flex items-center gap-2">
					<Checkbox id="dock-partial" v-model="partialSign" />
					<label for="dock-partial" class="text-xs hover:cursor-pointer">Partial sign</label>
					<Button
						variant="secondary"
						size="sm"
						class="ml-auto h-7 text-xs"
						:disabled="signing || !unsignedInput"
						@click="txStore.signTx(unsignedInput)"
					>
						<Icon v-if="signing" name="lucide:loader-circle" size="13" class="animate-spin" />
						Sign transaction
					</Button>
				</div>
				<p v-if="signError" class="text-[11px] text-destructive">{{ signError }}</p>
				<div v-if="signedCborHex" class="rounded-md bg-muted/50 p-2">
					<p class="eyebrow mb-1">Signed CBOR</p>
					<p class="font-mono text-[11px] break-all">{{ formatId(signedCborHex, 60, 20) }}</p>
					<Button variant="ghost" size="sm" class="mt-1 h-6 px-1.5 text-[11px]" @click="useCopy(signedCborHex)">
						<Icon name="lucide:copy" size="12" />
						Copy
					</Button>
				</div>
			</section>

			<!-- Submitter -->
			<section class="space-y-1.5">
				<div class="flex items-center gap-2">
					<Icon name="lucide:send" size="14" class="text-primary" />
					<h3 class="text-sm font-semibold">Submitter</h3>
					<Badge :variant="providerReady ? 'success' : 'muted'" class="ml-auto">
						{{ providerReady ? 'Blockfrost ready' : 'no provider' }}
					</Badge>
				</div>
				<Textarea v-model="signedInput" rows="3" placeholder="signed CBOR hex" class="font-mono !text-[11px]" />
				<div class="flex items-center gap-2">
					<span class="text-[11px] text-muted-foreground">Confirmation usually takes ~10–30s.</span>
					<Button
						variant="default"
						size="sm"
						class="ml-auto h-7 text-xs"
						:disabled="submitting || !signedInput || !providerReady"
						@click="txStore.submitTx(signedInput)"
					>
						<Icon v-if="submitting" name="lucide:loader-circle" size="13" class="animate-spin" />
						Submit
					</Button>
				</div>
				<p v-if="submitError" class="text-[11px] text-destructive">{{ submitError }}</p>
				<div v-if="submittedTxId" class="rounded-md border border-primary/40 bg-primary/5 p-2">
					<p class="eyebrow mb-1">Submitted</p>
					<p class="flex items-start gap-1 font-mono text-[11px] break-all">
						{{ submittedTxId }}
						<Icon name="lucide:copy" size="12" class="mt-0.5 shrink-0 hover:cursor-pointer hover:text-primary" @click="useCopy(submittedTxId)" />
					</p>
				</div>
			</section>
		</div>
	</div>
</template>
