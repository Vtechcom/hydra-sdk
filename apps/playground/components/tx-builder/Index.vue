<script lang="ts" setup>
	import { type TxOutput, type UTxO, Converter, DEFAULT_PROTOCOL_PARAMETERS, Deserializer, Resolver } from '@hydra-sdk/core'
	import { cn } from '~/lib/utils'
	import { Checkbox } from '../ui/checkbox'
	import { toast } from 'vue-sonner'
	import { TxBuilder } from '@hydra-sdk/transaction'
	import BigNumber from 'bignumber.js'
	import type { TxOutputJson } from './interface'
	import { formatId } from '~/composables/useFormat'

	const mainStore = useMainStore()
	const { networkInfo, inputUTxOs } = storeToRefs(mainStore)
	const totalLovelace = computed(() => {
		return inputUTxOs.value.reduce((acc, utxo) => acc + Number(utxo.output.amount.at(0)?.quantity || 0), 0)
	})
	const totalAssets = computed(() => {
		return inputUTxOs.value.reduce((acc, utxo) => acc + (utxo.output.amount.length - 1), 0)
	})

	const txConfig = reactive({
		useCustomPParams: false,
		customPParams: DEFAULT_PROTOCOL_PARAMETERS,

		withChangeAddress: true,
		changeAddress: '',

		isHydraTx: false,

		withCustomFee: false,
		customFee: ''
	})

	const outputs = ref<TxOutputJson[]>([
		{
			address: '',
			amount: [
				{
					unit: 'lovelace',
					quantity: ''
				}
			]
		}
	])

	// Convert to decoded JSON
	const highlighter = await getShikiHighlighter()

	const buildResult = reactive({
		error: '',
		message: '',
		cborHex: '',
		txId: '',
		txDecodedJson: '' // JSON representation of the transaction
	})

	const buildTx = async () => {
		// Build transaction logic here

		try {
			if (inputUTxOs.value.length === 0) {
				buildResult.error = 'No UTxOs in inputs. Please add at least one UTxO.'
				return
			}

			// Validate outputs
			if (outputs.value.length === 0) {
				buildResult.error = 'No outputs defined. Please add at least one output.'
				return
			}
			for (const output of outputs.value) {
				if (!output.address || output.address.trim() === '') {
					throw new Error('Output address is empty. Please provide a valid address. Index: ' + outputs.value.indexOf(output))
				}
				if (!output.amount || output.amount.length === 0) {
					throw new Error(`Output to '${formatId(output.address, 12, 8)}' has no amount defined. Please add at least one amount.`)
				}
				for (const amt of output.amount) {
					if (!amt.quantity || amt.quantity.trim() === '' || isNaN(Number(amt.quantity)) || BigInt(amt.quantity) <= 0n) {
						throw new Error(`Output to '${formatId(output.address, 12, 8)}' has an invalid amount quantity. Please provide a valid number.`)
					}
					if (!amt.unit || amt.unit.trim() === '') {
						throw new Error(`Output to '${formatId(output.address, 12, 8)}' has an empty asset unit. Please provide a valid unit.`)
					}
				}
			}

			const txBuilder = new TxBuilder({
				params: txConfig.useCustomPParams ? txConfig.customPParams : undefined,
				isHydra: txConfig.isHydraTx
			})

			// Convert outputs json to Wasm objects
			const txOutputs: TxOutput[] = outputs.value.map(output => {
				const datum = output.datum ? Deserializer.deserializePlutusData(output.datum) : undefined
				const inlineDatum = output.inlineDatum ? Deserializer.deserializePlutusData(output.inlineDatum) : undefined
				return {
					...output,
					inlineDatum,
					datum
				}
			})
			console.log('>>> Outputs for building:', txOutputs)

			txBuilder.setInputs(inputUTxOs.value) // Add UTxO inputs
			// Add outputs
			for (const output of outputs.value) {
				const datum = output.datum ? Deserializer.deserializePlutusData(output.datum) : undefined
				const inlineDatum = output.inlineDatum ? Deserializer.deserializePlutusData(output.inlineDatum) : undefined
				txBuilder.addOutput({
					...output,
					inlineDatum: undefined,
					datum: undefined
				})
				if (datum) txBuilder.txOutDatumHashValue(datum)
				if (inlineDatum) txBuilder.txOutInlineDatumValue(inlineDatum)
			}

			if (txConfig.withChangeAddress) {
				if (!txConfig.changeAddress) {
					buildResult.error = 'Change address is enabled but not provided.'
					return
				}
				txBuilder.setChangeAddress(txConfig.changeAddress)
			}
			if (txConfig.withCustomFee) {
				if (!txConfig.customFee) {
					buildResult.error = 'Custom fee is enabled but not provided.'
					return
				}
				let fee = 0n
				try {
					fee = BigInt(txConfig.customFee)
				} catch (error) {
					buildResult.error = 'Invalid custom fee format. Please enter a valid number.'
					return
				}
				txBuilder.setFee(fee.toString())
			}
			const tx = await txBuilder.complete()
			console.log('>>> Built transaction:', tx.to_json())
			buildResult.message = `Transaction built successfully!`
			buildResult.error = ''
			buildResult.cborHex = tx.to_hex()
			buildResult.txId = Resolver.resolveTxHash(tx.to_hex())
			buildResult.txDecodedJson = highlighter.highlight(tx.to_json(), {
				lang: 'json',
				theme: 'github-light'
			})
			toast.success(buildResult.message)
		} catch (error) {
			console.error('Error building transaction:', error)
			buildResult.error = `Error building transaction: ${error instanceof Error ? error.message : String(error)}`
			buildResult.message = ''
			buildResult.cborHex = ''
			buildResult.txId = ''
			buildResult.txDecodedJson = ''
			toast.error(buildResult.error)
		}
	}
</script>

<template>
	<Card :class="cn('rounded-none w-full h-full')">
		<CardContent class="w-full h-full p-0">
			<div class="bg-amber-50/20 w-full h-full flex items-center space-x-2">
				<div class="flex max-w-[320px] flex-1 h-full bg-secondary-100/20 flex-col p-1 shrink-0">
					<h2 class="text-lg font-medium">Tx Inputs</h2>
					<div class="">
						<div class="shrink-0 flex items-center justify-between mb-2">
							<div class="font-mono text-xs flex items-center h-4 space-x-2">
								<span>
									<span class="font-semibold">{{ inputUTxOs.length }}</span> UTxO
								</span>
								<Separator orientation="vertical" />
								<span>
									<span class="font-semibold">{{ BigNumber(totalLovelace / 1_000_000).toFormat() }}</span> ADA
								</span>
								<Separator orientation="vertical" />
								<span>
									<span class="font-semibold">{{ totalAssets }}</span> Assets
								</span>
							</div>
							<div class="flex items-center">
								<Button variant="outline" class="h-7" size="sm" @click="inputUTxOs = []" :disabled="inputUTxOs.length === 0">
									<Icon name="ic:sharp-clear-all" size="16" />
									<span class="text-xs">Clear</span>
								</Button>
							</div>
						</div>
						<div class="flex flex-col space-y-1 font-mono mb-2 overflow-y-auto h-full scroll-bar-primary">
							<TooltipProvider>
								<Tooltip :delay-duration="100" v-for="utxo in inputUTxOs" :key="`${utxo.input.txHash}#${utxo.input.outputIndex}`">
									<TooltipTrigger>
										<BaseUtxoItem :tx-id-formatter="txId => formatId(txId, 8, 8)" :utxo="utxo" :hideAmount="true" :showAddButton="false"> </BaseUtxoItem>
									</TooltipTrigger>
									<TooltipContent class="bg-primary-100 font-mono">
										<pre><code>{{ JSON.stringify(Converter.convertUTxOToUTxOObject([utxo]), null, 2) }}</code></pre>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
					</div>
				</div>
				<TxBuilderOutputs v-model:outputs="outputs" class="shrink-0 min-w-[320px] flex-1" />
				<div class="w-[320px] flex-1 p-1 flex flex-col h-full shrink-0 bg-secondary-100/10">
					<h2 class="text-lg font-medium">Tx additions</h2>
					<div class="grow space-y-2 mt-2">
						<div class="flex items-center space-x-2">
							<Checkbox id="isHydraTx" v-model="txConfig.isHydraTx" />
							<label for="isHydraTx" class="text-sm flex items-center gap-1 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
								<img src="/images/hydra-protocol.png" alt="Hydra Logo" class="inline-block h-4 w-4" />
								Use Hydra
								<TooltipProvider>
									<Tooltip :delay-duration="100">
										<TooltipTrigger class="flex">
											<Icon name="ic:baseline-info" size="18" class="inline-block text-primary-200 hover:cursor-help" />
										</TooltipTrigger>
										<TooltipContent class="bg-primary-100">
											<p>Allow to create unbalanced transaction</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</label>
						</div>
						<div class="flex items-center space-x-2">
							<Checkbox id="useCustomPParams" v-model="txConfig.useCustomPParams" disabled />
							<label for="useCustomPParams" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"> Custom protocol parameters </label>
						</div>
						<div class="">
							<div class="flex items-center space-x-2">
								<Checkbox id="withChangeAddress" v-model="txConfig.withChangeAddress" />
								<label for="withChangeAddress" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"> Change address </label>
							</div>
							<div class="pl-6 mt-1" v-if="txConfig.withChangeAddress">
								<Input v-model="txConfig.changeAddress" placeholder="addr..." class="h-7 text-sm font-mono" />
							</div>
						</div>
						<div class="">
							<div class="flex items-center space-x-2">
								<Checkbox id="withCustomFee" v-model="txConfig.withCustomFee" />
								<label for="withCustomFee" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"> Custom fee </label>
							</div>
							<div class="pl-6 mt-1" v-if="txConfig.withCustomFee">
								<Input v-model="txConfig.customFee" placeholder="lovelace" class="h-7 text-sm font-mono" />
							</div>
						</div>
					</div>
					<Button size="lg" class="h-12" variant="secondary" @click="buildTx()">
						Build
						<Icon name="ic:round-offline-bolt" size="24" class="" />
					</Button>
				</div>
				<div class="min-w-[320px] flex-1 h-full bg-primary-100/30 p-1 shrink-0 flex flex-col">
					<h2 class="text-lg font-medium">Tx result</h2>
					<div class="overflow-y-auto grow">
						<p class="text-sm text-success-500">{{ buildResult.message }}</p>
						<p class="text-sm text-red-500">{{ buildResult.error }}</p>
						<p class="">
							<span class="font-mono text-xs font-medium underline">Tx ID:</span>
							<br />
							<span class="font-mono text-xs break-all">{{ buildResult.txId }}</span>
						</p>
						<p class="">
							<span class="font-mono text-xs font-medium underline">Cbor Hex:</span>
							<br />
							<span class="font-mono text-xs break-all">{{ buildResult.cborHex }}</span>
						</p>
					</div>
				</div>
				<div class="grow h-full flex-3 bg-white p-1 overflow-hidden flex flex-col">
					<h2 class="text-lg font-medium">Tx decoded</h2>
					<div class="overflow-auto grow scroll-bar-primary text-xs">
						<span v-html="buildResult.txDecodedJson" class=""></span>
					</div>
				</div>
			</div>
		</CardContent>
	</Card>
</template>

<style lang="scss" scoped></style>
