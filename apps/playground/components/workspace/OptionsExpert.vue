<script lang="ts" setup>
	const txStore = useTxBuilderStore()
	const { draft } = storeToRefs(txStore)
	const providerStore = useProviderStore()

	const evaluatorUnavailable = computed(() => !providerStore.blockfrostConfig.apiKey)
</script>

<template>
	<div class="space-y-4">
		<!-- Script inputs -->
		<section>
			<div class="mb-1.5 flex items-center gap-2">
				<span class="eyebrow">Script inputs</span>
				<Button variant="ghost" size="sm" class="ml-auto h-6 px-1.5 text-[11px]" @click="txStore.addScriptInput()">
					<Icon name="lucide:plus" size="13" />
					Script input
				</Button>
			</div>
			<div v-for="script in draft.scriptInputs" :key="script.id" class="mb-2 space-y-1 rounded-md border p-2">
				<div class="flex items-center gap-1.5">
					<Input v-model="script.txHash" placeholder="txHash" class="h-6 flex-1 font-mono !text-[11px]" />
					<Input v-model.number="script.outputIndex" placeholder="idx" inputmode="numeric" class="h-6 w-14 font-mono !text-[11px]" />
					<Select v-model="script.version">
						<SelectTrigger class="h-6 w-16 text-[11px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem v-for="version in ['V1', 'V2', 'V3']" :key="version" :value="version" class="text-xs">{{ version }}</SelectItem>
						</SelectContent>
					</Select>
					<button
						type="button"
						class="rounded p-0.5 text-muted-foreground hover:cursor-pointer hover:text-destructive"
						aria-label="Remove script input"
						@click="txStore.removeById(draft.scriptInputs, script.id)"
					>
						<Icon name="lucide:x" size="13" />
					</button>
				</div>
				<Input v-model="script.address" placeholder="script address" class="h-6 font-mono !text-[11px]" />
				<Input v-model="script.amount[0].quantity" placeholder="lovelace at the script UTxO" inputmode="numeric" class="h-6 font-mono !text-[11px]" />
				<Textarea v-model="script.scriptCborHex" rows="2" placeholder="validator CBOR hex" class="font-mono !text-[11px]" />

				<div class="flex items-center gap-1.5">
					<Select v-model="script.datumMode">
						<SelectTrigger class="h-6 w-[120px] text-[11px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none" class="text-xs">no datum</SelectItem>
							<SelectItem value="datumhash" class="text-xs">datum hash</SelectItem>
							<SelectItem value="inlinedatum" class="text-xs">inline datum</SelectItem>
						</SelectContent>
					</Select>
					<Input v-if="script.datumMode !== 'none'" v-model="script.datumCborHex" placeholder="datum CBOR hex" class="h-6 flex-1 font-mono !text-[11px]" />
				</div>

				<div class="flex items-center gap-1.5">
					<Select v-model="script.redeemerMode">
						<SelectTrigger class="h-6 w-[120px] text-[11px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none" class="text-xs">no redeemer</SelectItem>
							<SelectItem value="unit" class="text-xs">unit redeemer</SelectItem>
							<SelectItem value="custom" class="text-xs">custom</SelectItem>
						</SelectContent>
					</Select>
					<Input v-if="script.redeemerMode === 'custom'" v-model="script.redeemerCborHex" placeholder="redeemer CBOR hex" class="h-6 flex-1 font-mono !text-[11px]" />
				</div>

				<div v-if="script.redeemerMode !== 'none'" class="flex items-center gap-1.5">
					<span class="w-[120px] shrink-0 font-mono text-[11px] text-muted-foreground">exUnits</span>
					<Input v-model="script.exUnits.mem" placeholder="mem" class="h-6 font-mono !text-[11px]" />
					<Input v-model="script.exUnits.steps" placeholder="steps" class="h-6 font-mono !text-[11px]" />
				</div>
			</div>
			<p v-if="!draft.scriptInputs.length" class="text-[11px] text-muted-foreground">No script inputs — this is a plain payment transaction.</p>
		</section>

		<!-- Reference inputs -->
		<section>
			<div class="mb-1.5 flex items-center gap-2">
				<span class="eyebrow">Reference inputs</span>
				<Button variant="ghost" size="sm" class="ml-auto h-6 px-1.5 text-[11px]" @click="txStore.addReferenceInput()">
					<Icon name="lucide:plus" size="13" />
					Reference
				</Button>
			</div>
			<div v-for="ref in draft.referenceInputs" :key="ref.id" class="mb-1 flex items-center gap-1.5">
				<Input v-model="ref.txHash" placeholder="txHash" class="h-6 flex-1 font-mono !text-[11px]" />
				<Input v-model.number="ref.outputIndex" placeholder="idx" inputmode="numeric" class="h-6 w-14 font-mono !text-[11px]" />
				<button
					type="button"
					class="rounded p-0.5 text-muted-foreground hover:cursor-pointer hover:text-destructive"
					aria-label="Remove reference input"
					@click="txStore.removeById(draft.referenceInputs, ref.id)"
				>
					<Icon name="lucide:x" size="13" />
				</button>
			</div>
			<p v-if="!draft.referenceInputs.length" class="text-[11px] text-muted-foreground">None.</p>
		</section>

		<!-- Certificates -->
		<section>
			<div class="mb-1.5 flex items-center gap-2">
				<span class="eyebrow">Certificates</span>
				<Button variant="ghost" size="sm" class="ml-auto h-6 px-1.5 text-[11px]" @click="txStore.addCertificate()">
					<Icon name="lucide:plus" size="13" />
					Certificate
				</Button>
			</div>
			<div v-for="cert in draft.certificates" :key="cert.id" class="mb-1.5 space-y-1 rounded-md border p-2">
				<div class="flex items-center gap-1.5">
					<Select v-model="cert.kind">
						<SelectTrigger class="h-6 flex-1 text-[11px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="StakeRegistration" class="text-xs">Register stake</SelectItem>
							<SelectItem value="StakeDeregistration" class="text-xs">Deregister stake</SelectItem>
							<SelectItem value="StakeDelegation" class="text-xs">Delegate stake</SelectItem>
						</SelectContent>
					</Select>
					<button
						type="button"
						class="rounded p-0.5 text-muted-foreground hover:cursor-pointer hover:text-destructive"
						aria-label="Remove certificate"
						@click="txStore.removeById(draft.certificates, cert.id)"
					>
						<Icon name="lucide:x" size="13" />
					</button>
				</div>
				<Input v-model="cert.rewardAddress" placeholder="stake address (stake_test1…)" class="h-6 font-mono !text-[11px]" />
				<Input v-if="cert.kind === 'StakeDelegation'" v-model="cert.poolKeyHash" placeholder="pool key hash" class="h-6 font-mono !text-[11px]" />
			</div>
			<p v-if="!draft.certificates.length" class="text-[11px] text-muted-foreground">None.</p>
		</section>

		<!-- Withdrawals -->
		<section>
			<div class="mb-1.5 flex items-center gap-2">
				<span class="eyebrow">Withdrawals</span>
				<Button variant="ghost" size="sm" class="ml-auto h-6 px-1.5 text-[11px]" @click="txStore.addWithdrawal()">
					<Icon name="lucide:plus" size="13" />
					Withdrawal
				</Button>
			</div>
			<div v-for="withdrawal in draft.withdrawals" :key="withdrawal.id" class="mb-1 flex items-center gap-1.5">
				<Input v-model="withdrawal.rewardAddress" placeholder="stake address" class="h-6 flex-1 font-mono !text-[11px]" />
				<Input v-model="withdrawal.amount" placeholder="lovelace" inputmode="numeric" class="h-6 w-28 font-mono !text-[11px]" />
				<button
					type="button"
					class="rounded p-0.5 text-muted-foreground hover:cursor-pointer hover:text-destructive"
					aria-label="Remove withdrawal"
					@click="txStore.removeById(draft.withdrawals, withdrawal.id)"
				>
					<Icon name="lucide:x" size="13" />
				</button>
			</div>
			<p v-if="!draft.withdrawals.length" class="text-[11px] text-muted-foreground">None.</p>
		</section>

		<!-- Evaluator + debug -->
		<section class="space-y-2">
			<div class="flex items-start gap-2">
				<Checkbox id="exp-evaluator" v-model="draft.useEvaluator" :disabled="evaluatorUnavailable" class="mt-0.5" />
				<label for="exp-evaluator" class="text-xs font-medium hover:cursor-pointer">
					Evaluate script exUnits
					<span class="block text-[11px] font-normal text-muted-foreground">
						Runs the draft through Blockfrost to get real execution budgets, then rebuilds so the fee is right.
					</span>
				</label>
			</div>
			<p v-if="evaluatorUnavailable" class="pl-6 text-[11px] text-warning-600 dark:text-warning-400">Needs a Blockfrost API key.</p>
			<div v-if="draft.useEvaluator" class="flex items-center gap-2 pl-6">
				<label for="exp-multiplier" class="font-mono text-[11px] text-muted-foreground">safety multiplier</label>
				<Input id="exp-multiplier" v-model="draft.evaluatorMultiplier" class="h-6 w-20 font-mono !text-[11px]" />
			</div>

			<div class="flex items-center gap-2">
				<Checkbox id="exp-verbose" v-model="draft.verbose" />
				<label for="exp-verbose" class="text-xs font-medium hover:cursor-pointer">Verbose builder logs (console)</label>
			</div>
		</section>
	</div>
</template>
