<script lang="ts" setup>
	import { cn } from '~/lib/utils'

	const providerStore = useProviderStore()
	const { blockfrostConfigInvalid } = storeToRefs(providerStore)

	const scrollContainer = ref<HTMLElement | null>(null)
	const cborHex = ref('')
	const result = ref({
		txId: '',
		type: '' as '' | 'submitted' | 'pending' | 'error',
		message: ''
	})

	const isSubmitting = ref(false)
	const submitTx = async () => {
		try {
			result.value = { txId: '', type: 'pending', message: '' }
			isSubmitting.value = true
			if (!cborHex.value) {
				return
			}
			const blockfrostProvider = providerStore.getBlockfrostProvider()
			const rs = await blockfrostProvider.submitter.submitTx(cborHex.value)
			if (rs) {
				result.value = { txId: rs, type: 'submitted', message: 'Transaction submitted successfully' }
			} else {
				throw new Error('Failed to submit transaction')
			}
		} catch (err) {
			console.error(err)
			result.value = { txId: '', type: 'error', message: (err as Error).message }
		} finally {
			isSubmitting.value = false
			// Scroll to bottom
			if (scrollContainer.value) {
				scrollContainer.value.scrollTo({
					top: 0,
					behavior: 'smooth'
				})
			}
		}
	}

	const onClear = () => {
		cborHex.value = ''
		result.value = { txId: '', type: '', message: '' }
	}
</script>

<template>
	<Card :class="cn('rounded-none w-full h-full')">
		<CardContent class="w-full h-full p-4 space-y-2 flex flex-col">
			<div class="shrink-0">
				<div class="text-lg font-semibold flex items-center">
					<Icon name="ic:round-cloud-upload" size="20" class="mr-1" />
					Tx Submitter
				</div>
			</div>
			<div class="flex flex-col overflow-y-auto scroll-bar-primary pr-1" ref="scrollContainer">
				<Alert v-if="result.type === ''" class="mb-2">
					<AlertTitle>
						<Icon name="ic:outline-info" size="16" class="-mb-0.5" />
						Notice
					</AlertTitle>
					<AlertDescription class="text-sm">
						<p class="">Requiring Blockfrost API access</p>
						<p class="">
							<span class="font-semibold">Confirmation time:</span>
							<span class="font-mono text-xs text-warning-400"> ~10-30 seconds</span>
						</p>
						<p class="">
							<span class="font-semibold">Status: </span>
							<span v-if="!blockfrostConfigInvalid" class="text-success-500 font-semibold font-mono text-xs">Connected</span>
							<span v-else class="text-error-500 font-semibold font-mono text-xs">Not Connected</span>
						</p>
					</AlertDescription>
				</Alert>
				<Alert v-if="result.type === 'error'" class="mb-2" variant="destructive">
					<AlertTitle>
						<Icon name="tabler:alert-circle" size="16" class="-mb-0.5" v-if="result.type === 'error'" />
						Error
					</AlertTitle>
					<AlertDescription> {{ result.message }} </AlertDescription>
				</Alert>
				<Alert v-else-if="result.type === 'submitted'" class="mb-2 text-success-500">
					<AlertTitle>
						<Icon name="tabler:cloud-check" size="16" class="-mb-0.5" />
						Success
					</AlertTitle>
					<AlertDescription> {{ result.message }} </AlertDescription>
				</Alert>
				<InputGroup>
					<InputGroupAddon align="block-start">
						<InputGroupText>Tx cbor hex</InputGroupText>
					</InputGroupAddon>
					<InputGroupTextarea rows="4" autocomplete="off" type="text" placeholder="84a400d90..." v-model="cborHex" />
					<InputGroupAddon align="block-end">
						<div class="flex justify-between w-full">
							<!-- <div class="flex items-center space-x-2">
								<Checkbox id="partialSign" v-model="partialSign" />
								<label for="partialSign" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"> Partial sign </label>
							</div> -->
							<InputGroupButton variant="outline" @click="onClear()" :disabled="!cborHex"> Clear </InputGroupButton>
							<InputGroupButton variant="secondary" @click="submitTx()" :disabled="!cborHex" class="flex items-center space-x-1">
								<Icon name="mdi:loading" size="16" class="animate-spin" v-show="isSubmitting" />
								Submit Tx
							</InputGroupButton>
						</div>
					</InputGroupAddon>
				</InputGroup>
			</div>
		</CardContent>
	</Card>
</template>

<style lang="scss" scoped></style>
