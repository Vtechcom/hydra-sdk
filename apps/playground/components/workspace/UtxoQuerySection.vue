<script lang="ts" setup>
	import { Deserializer, type UTxO } from '@hydra-sdk/core'
	import BigNumber from 'bignumber.js'
	import { toast } from 'vue-sonner'
	import { SAMPLE_ADDRESS, SAMPLE_UTXOS } from '~/lib/tx-fixtures'

	const providerStore = useProviderStore()
	const txStore = useTxBuilderStore()

	const address = useLocalStorage('hydra-playground.utxo-address', '')
	const utxos = shallowRef<UTxO[]>([])
	const fetching = ref(false)
	const isSample = ref(false)

	const totalLovelace = computed(() =>
		utxos.value.reduce((acc, utxo) => acc + BigInt(utxo.output.amount.find(a => a.unit === 'lovelace')?.quantity || 0), 0n)
	)

	const fetchUtxos = async () => {
		if (!address.value.trim()) return
		try {
			Deserializer.deserializeAddress(address.value.trim())
		} catch {
			toast.error('That does not look like a valid Cardano address.')
			return
		}

		fetching.value = true
		try {
			const provider = providerStore.getBlockfrostProvider()
			utxos.value = await provider.fetcher.fetchAddressUTxOs(address.value.trim())
			isSample.value = false
			if (!utxos.value.length) toast.info('No UTxO found at this address.')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to query UTxOs.')
		} finally {
			fetching.value = false
		}
	}

	/** Lets the builder be explored end-to-end without a Blockfrost key. */
	const loadSample = () => {
		utxos.value = SAMPLE_UTXOS.map(utxo => structuredClone(utxo))
		address.value = SAMPLE_ADDRESS
		isSample.value = true
		toast.success('Loaded sample UTxOs (offline, not submittable)')
	}

	const selectAll = () => {
		utxos.value.forEach(utxo => {
			if (!txStore.hasInput(utxo)) txStore.addInput(utxo)
		})
	}
</script>

<template>
	<div class="flex min-h-0 flex-col gap-2">
		<div class="flex gap-1">
			<Input v-model="address" placeholder="addr…" autocomplete="off" class="h-8 font-mono text-xs" @keydown.enter="fetchUtxos()" />
			<Button size="sm" variant="secondary" class="h-8 shrink-0 px-2" :disabled="fetching || !address" @click="fetchUtxos()">
				<Icon :name="fetching ? 'lucide:loader-circle' : 'lucide:search'" size="14" :class="fetching ? 'animate-spin' : ''" />
			</Button>
		</div>

		<div class="flex items-center gap-1">
			<Button size="sm" variant="ghost" class="h-6 px-1.5 text-[11px]" @click="loadSample()">
				<Icon name="lucide:flask-conical" size="13" />
				Sample data
			</Button>
			<Button v-if="utxos.length" size="sm" variant="ghost" class="h-6 px-1.5 text-[11px]" @click="selectAll()">Select all</Button>
			<Button v-if="utxos.length" size="sm" variant="ghost" class="ml-auto h-6 px-1.5 text-[11px]" @click="utxos = []">Clear</Button>
		</div>

		<Alert v-if="isSample" class="border-warning-300/60 bg-warning-50/50 py-2 dark:bg-warning-900/10">
			<AlertDescription class="text-[11px] text-warning-700 dark:text-warning-300">
				Sample UTxOs are synthetic — build and inspect freely, but they will not submit on-chain.
			</AlertDescription>
		</Alert>

		<div v-if="utxos.length" class="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
			<span>{{ utxos.length }} UTxO</span>
			<Separator orientation="vertical" class="h-3" />
			<span>{{ BigNumber(totalLovelace.toString()).dividedBy(1_000_000).toFormat() }} ADA</span>
		</div>

		<div class="min-h-0 flex-1 space-y-1 overflow-y-auto scroll-bar-primary">
			<WorkspaceUtxoRow
				v-for="utxo in utxos"
				:key="`${utxo.input.txHash}#${utxo.input.outputIndex}`"
				:utxo="utxo"
				selectable
				:selected="txStore.hasInput(utxo)"
				@toggle="txStore.toggleInput"
			/>
			<p v-if="!utxos.length" class="py-3 text-center text-[11px] text-muted-foreground">
				Query an address or load sample data to pick inputs.
			</p>
		</div>
	</div>
</template>
