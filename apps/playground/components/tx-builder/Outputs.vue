<script lang="ts" setup>
	import type { CardanoWASM } from '@hydra-sdk/cardano-wasm'
	import { Deserializer, ParserUtils, ValidationUtils, type TxOutput } from '@hydra-sdk/core'
	import type { TxOutputJson } from './interface'

	const outputs = defineModel<TxOutputJson[]>('outputs', {
		type: Array as PropType<TxOutputJson[]>,
		required: true
	})

	const isJsonMode = ref(false)

	const jsonOutputPlaceholder = `[
  {
	"address": "addr1...",
	"amount": [
	  {
		"unit": "lovelace",
		"quantity": "1000000"
	  },
	  {
		"unit": "asset1...",
		"quantity": "1"
	  }
	],
	"datumHash": "optional datum hash",
	"inlineDatum": "optional inline datum in cbor hex format"
  }
]`
	const jsonValid = ref(true)
	const jsonParseError = ref('')
	const checkValidOutputJson = useDebounceFn((str: string) => {
		try {
			jsonParseError.value = ''
			const outputObj = JSON.parse(str) as TxOutputJson[]
			// Validate structure
			if (!Array.isArray(outputObj)) throw new Error('JSON must be an array of outputs')

			outputObj.forEach((output, index) => {
				// Convert json to TxOutput and validate
				// Convert inlineDatum from string to WASM
				let inlineDatum: CardanoWASM.PlutusData | undefined
				let datum: CardanoWASM.PlutusData | undefined
				if (output.inlineDatum) {
					try {
						inlineDatum = Deserializer.deserializePlutusData(output.inlineDatum)
					} catch (e) {
						jsonParseError.value = 'Invalid inlineDatum format: at output index ' + index
					}
				}
				if (output.datum) {
					try {
						datum = Deserializer.deserializePlutusData(output.datum)
					} catch (e) {
						jsonParseError.value = 'Invalid datum format: at output index ' + index
					}
				}
				const isValid = ValidationUtils.isValidTxOutput({ ...output, inlineDatum, datum })
				if (!isValid) {
					jsonValid.value = false
					jsonParseError.value = 'Invalid output structure: at output index ' + index
				}
			})
			jsonValid.value = true
		} catch (e) {
			jsonValid.value = false
			jsonParseError.value = (e as Error).message ? (e as Error).message : 'Invalid JSON'
		}
	}, 1000)
	const jsonOutputs = ref('')
	watch(
		outputs,
		newOutputs => {
			jsonOutputs.value = JSON.stringify(newOutputs, null, 2)
		},
		{
			deep: true
		}
	)

	watch(jsonOutputs, newJson => {
		checkValidOutputJson(newJson)
	})

	const onClear = () => {
		outputs.value = []
	}

	const onAddRecipient = () => {
		outputs.value.push({
			address: '',
			amount: [
				{
					unit: 'lovelace',
					quantity: ''
				}
			]
		})
	}
</script>

<template>
	<div class="flex h-full bg-secondary-100/20 flex-col p-1">
		<h2 class="text-lg font-medium">Tx Outputs</h2>
		<div class="flex flex-col overflow-hidden">
			<div class="flex justify-between items-center space-x-1 mb-2 shrink-0 pr-1">
				<Button variant="outline" class="h-7" size="sm" @click="isJsonMode = !isJsonMode" :class="{ 'bg-secondary-200/50 border-primary-300': isJsonMode }">
					<Icon name="ic:sharp-edit-note" size="16" />
					<span class="text-xs">Customize</span>
				</Button>
				<Button variant="outline" class="h-7" size="sm" @click="onClear()">
					<Icon name="ic:sharp-clear-all" size="16" />
					<span class="text-xs">Clear</span>
				</Button>
			</div>
			<div v-show="!isJsonMode" class="flex flex-col space-y-1 font-mono mb-2 overflow-y-auto grow scroll-bar-primary pr-1">
				<TxBuilderOutput v-for="(output, index) in outputs" :output="output" :index="index" :key="`output-${index}`" @remove="outputs.splice(index, 1)" />

				<div class="flex justify-center">
					<Button variant="ghost" class="" size="sm" @click="onAddRecipient()">
						<Icon name="mdi:plus" size="16" />
						<span class="text-xs">Recipient</span>
					</Button>
				</div>
			</div>
			<div v-show="isJsonMode" class="flex grow flex-col font-mono mb-2 overflow-y-auto scroll-bar-primary">
				<InputGroup>
					<InputGroupAddon align="block-start">
						<InputGroupText class="text-xs">JSON outputs</InputGroupText>
					</InputGroupAddon>
					<InputGroupTextarea class="!text-xs" autocomplete="off" type="text" name="json-outputs" :placeholder="jsonOutputPlaceholder" v-model="jsonOutputs" />
					<InputGroupAddon align="block-end" class="space-y-0.5 flex flex-col">
						<div class="text-red-500 text-[10px]">{{ jsonParseError }}</div>
						<div class="flex justify-between w-full">
							<InputGroupButton variant="outline" @click="onClear()" class="text-xs" :disabled="!jsonOutputs"> Clear </InputGroupButton>
							<InputGroupButton variant="secondary" @click="null" class="text-xs" :disabled="!jsonOutputs"> Set </InputGroupButton>
						</div>
					</InputGroupAddon>
				</InputGroup>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped></style>
