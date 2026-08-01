<script lang="ts" setup>
	import { DEFAULT_PROTOCOL_PARAMETERS } from '@hydra-sdk/core'

	const txStore = useTxBuilderStore()
	const { draft } = storeToRefs(txStore)

	/** The handful of parameters that actually change what a build produces. */
	const editableParams = [
		{ key: 'minFeeA', label: 'minFeeA' },
		{ key: 'minFeeB', label: 'minFeeB' },
		{ key: 'coinsPerUtxoSize', label: 'coinsPerUtxoSize' },
		{ key: 'maxTxSize', label: 'maxTxSize' },
		{ key: 'priceMem', label: 'priceMem' },
		{ key: 'priceStep', label: 'priceStep' },
		{ key: 'collateralPercent', label: 'collateralPercent' },
		{ key: 'minFeeRefScriptCostPerByte', label: 'minFeeRefScriptCostPerByte' }
	] as const

	const resetParams = () => (draft.value.customPParams = { ...DEFAULT_PROTOCOL_PARAMETERS })
</script>

<template>
	<div class="space-y-4">
		<!-- Protocol parameters -->
		<section>
			<div class="mb-1.5 flex items-center gap-2">
				<Checkbox id="adv-pparams" v-model="draft.useCustomPParams" />
				<label for="adv-pparams" class="text-xs font-medium hover:cursor-pointer">Custom protocol parameters</label>
				<Badge variant="muted" class="ml-auto">PV11 defaults</Badge>
			</div>
			<div v-if="draft.useCustomPParams" class="space-y-1 pl-6">
				<div v-for="param in editableParams" :key="param.key" class="flex items-center gap-2">
					<label :for="`pp-${param.key}`" class="w-[190px] shrink-0 font-mono text-[11px] text-muted-foreground">{{ param.label }}</label>
					<Input :id="`pp-${param.key}`" v-model="draft.customPParams[param.key]" class="h-6 font-mono !text-[11px]" />
				</div>
				<Button variant="ghost" size="sm" class="h-6 text-[11px]" @click="resetParams()">Reset to PV11 defaults</Button>
			</div>
		</section>

		<!-- Metadata -->
		<section>
			<div class="mb-1.5 flex items-center gap-2">
				<span class="eyebrow">Metadata</span>
				<Button variant="ghost" size="sm" class="ml-auto h-6 px-1.5 text-[11px]" @click="txStore.addMetadata()">
					<Icon name="lucide:plus" size="13" />
					Label
				</Button>
			</div>
			<div v-for="entry in draft.metadata" :key="entry.id" class="mb-1.5 rounded-md border p-2">
				<div class="mb-1 flex items-center gap-1.5">
					<Input v-model="entry.label" placeholder="674" class="h-6 w-24 font-mono !text-[11px]" />
					<span class="text-[11px] text-muted-foreground">label</span>
					<button
						type="button"
						class="ml-auto rounded p-0.5 text-muted-foreground hover:cursor-pointer hover:text-destructive"
						aria-label="Remove metadata"
						@click="txStore.removeById(draft.metadata, entry.id)"
					>
						<Icon name="lucide:x" size="13" />
					</button>
				</div>
				<Textarea v-model="entry.json" rows="3" class="font-mono !text-[11px]" placeholder='{ "msg": ["hello"] }' />
				<p v-if="txStore.metadataError(entry)" class="mt-0.5 text-[11px] text-destructive">{{ txStore.metadataError(entry) }}</p>
			</div>
			<p v-if="!draft.metadata.length" class="text-[11px] text-muted-foreground">No metadata attached.</p>
		</section>

		<!-- Mint / burn -->
		<section>
			<div class="mb-1.5 flex items-center gap-2">
				<span class="eyebrow">Mint / burn</span>
				<Button variant="ghost" size="sm" class="ml-auto h-6 px-1.5 text-[11px]" @click="txStore.addMint()">
					<Icon name="lucide:plus" size="13" />
					Asset
				</Button>
			</div>
			<div v-for="mint in draft.mints" :key="mint.id" class="mb-1.5 space-y-1 rounded-md border p-2">
				<div class="flex items-center gap-1.5">
					<Select v-model="mint.scriptType">
						<SelectTrigger class="h-6 w-[110px] text-[11px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem v-for="type in ['Native', 'PlutusV1', 'PlutusV2', 'PlutusV3']" :key="type" :value="type" class="text-xs">{{ type }}</SelectItem>
						</SelectContent>
					</Select>
					<Input v-model="mint.quantity" placeholder="quantity (negative = burn)" class="h-6 flex-1 font-mono !text-[11px]" />
					<button
						type="button"
						class="rounded p-0.5 text-muted-foreground hover:cursor-pointer hover:text-destructive"
						aria-label="Remove mint"
						@click="txStore.removeById(draft.mints, mint.id)"
					>
						<Icon name="lucide:x" size="13" />
					</button>
				</div>
				<Input v-model="mint.policyId" placeholder="policyId (hex)" class="h-6 font-mono !text-[11px]" />
				<Input v-model="mint.assetName" placeholder="assetName (hex)" class="h-6 font-mono !text-[11px]" />
				<Input v-model="mint.scriptCborHex" placeholder="policy script CBOR hex" class="h-6 font-mono !text-[11px]" />
				<div v-if="mint.scriptType !== 'Native'" class="flex items-center gap-1.5">
					<Select v-model="mint.redeemerMode">
						<SelectTrigger class="h-6 w-[110px] text-[11px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none" class="text-xs">no redeemer</SelectItem>
							<SelectItem value="unit" class="text-xs">unit redeemer</SelectItem>
							<SelectItem value="custom" class="text-xs">custom</SelectItem>
						</SelectContent>
					</Select>
					<Input v-if="mint.redeemerMode === 'custom'" v-model="mint.redeemerCborHex" placeholder="redeemer CBOR hex" class="h-6 flex-1 font-mono !text-[11px]" />
				</div>
			</div>
			<p v-if="!draft.mints.length" class="text-[11px] text-muted-foreground">Nothing minted or burned.</p>
		</section>

		<!-- Validity range -->
		<section>
			<div class="mb-1.5 flex items-center gap-2">
				<Checkbox id="adv-validity" v-model="draft.withValidity" />
				<label for="adv-validity" class="text-xs font-medium hover:cursor-pointer">Validity range</label>
			</div>
			<div v-if="draft.withValidity" class="flex gap-1.5 pl-6">
				<Input v-model="draft.invalidBefore" placeholder="invalidBefore (slot)" inputmode="numeric" class="h-6 font-mono !text-[11px]" />
				<Input v-model="draft.invalidAfter" placeholder="invalidAfter (slot)" inputmode="numeric" class="h-6 font-mono !text-[11px]" />
			</div>
		</section>

		<!-- Required signers -->
		<section>
			<div class="mb-1.5 flex items-center gap-2">
				<span class="eyebrow">Required signers</span>
				<Button variant="ghost" size="sm" class="ml-auto h-6 px-1.5 text-[11px]" @click="txStore.addRequiredSigner()">
					<Icon name="lucide:plus" size="13" />
					Key hash
				</Button>
			</div>
			<div v-for="(_, index) in draft.requiredSigners" :key="`signer-${index}`" class="mb-1 flex items-center gap-1">
				<Input v-model="draft.requiredSigners[index]" placeholder="pubKeyHash (hex)" class="h-6 font-mono !text-[11px]" />
				<button
					type="button"
					class="rounded p-0.5 text-muted-foreground hover:cursor-pointer hover:text-destructive"
					aria-label="Remove signer"
					@click="draft.requiredSigners.splice(index, 1)"
				>
					<Icon name="lucide:x" size="13" />
				</button>
			</div>
			<p v-if="!draft.requiredSigners.length" class="text-[11px] text-muted-foreground">None — only the input owners must sign.</p>
		</section>

		<!-- Collateral -->
		<section>
			<div class="mb-1.5 flex items-center gap-2">
				<span class="eyebrow">Collateral</span>
				<Button variant="ghost" size="sm" class="ml-auto h-6 px-1.5 text-[11px]" @click="txStore.addCollateral()">
					<Icon name="lucide:plus" size="13" />
					UTxO
				</Button>
			</div>
			<p class="mb-1 text-[11px] text-muted-foreground">Required on L1 whenever the transaction runs a Plutus script.</p>
			<div v-for="entry in draft.collateral" :key="entry.id" class="mb-1.5 space-y-1 rounded-md border p-2">
				<div class="flex items-center gap-1.5">
					<Input v-model="entry.txHash" placeholder="txHash" class="h-6 flex-1 font-mono !text-[11px]" />
					<Input v-model.number="entry.outputIndex" placeholder="idx" inputmode="numeric" class="h-6 w-14 font-mono !text-[11px]" />
					<button
						type="button"
						class="rounded p-0.5 text-muted-foreground hover:cursor-pointer hover:text-destructive"
						aria-label="Remove collateral"
						@click="txStore.removeById(draft.collateral, entry.id)"
					>
						<Icon name="lucide:x" size="13" />
					</button>
				</div>
				<Input v-model="entry.address" placeholder="addr…" class="h-6 font-mono !text-[11px]" />
				<Input v-model="entry.lovelace" placeholder="lovelace" inputmode="numeric" class="h-6 font-mono !text-[11px]" />
			</div>
			<div v-if="draft.collateral.length" class="space-y-1">
				<Input v-model="draft.totalCollateral" placeholder="totalCollateral (lovelace)" class="h-6 font-mono !text-[11px]" />
				<div class="flex gap-1.5">
					<Input v-model="draft.collateralReturnAddress" placeholder="collateral return addr" class="h-6 flex-1 font-mono !text-[11px]" />
					<Input v-model="draft.collateralReturnLovelace" placeholder="lovelace" class="h-6 w-28 font-mono !text-[11px]" />
				</div>
			</div>
		</section>
	</div>
</template>
