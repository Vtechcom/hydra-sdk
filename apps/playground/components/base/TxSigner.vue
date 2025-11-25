<script lang="ts" setup>
	import { cn } from '~/lib/utils'
	import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
	import { AppWallet, EmbeddedWallet } from '@hydra-sdk/core'
	const mainStore = useMainStore()
	const { networkInfo, walletPrvKeyHex } = storeToRefs(mainStore)

	const unsignedCborHex = ref('')
	const signedCborHex = ref('')
	const partialSign = ref(false)

	const error = ref('')
	const signedSuccess = ref(false)
	const signTx = async () => {
		// Sign transaction logic here
		try {
			error.value = ''
			signedSuccess.value = false
			if (!unsignedCborHex.value) {
				error.value = 'Please provide an unsigned transaction Cbor hex.'
				return
			}
			const wallet = new AppWallet({
				networkId: networkInfo.value?.networkId!,
				key: { type: 'root', bech32: EmbeddedWallet.privateKeyHexToBech32(walletPrvKeyHex.value) }
			})
			signedCborHex.value = await wallet.signTx(unsignedCborHex.value, partialSign.value)
			error.value = ''
			signedSuccess.value = true
		} catch (err) {
			console.error(err)
			signedSuccess.value = false
			signedCborHex.value = ''
			error.value = (err as Error).message
		}
	}

	const onReset = () => {
		unsignedCborHex.value = ''
		signedCborHex.value = ''
		partialSign.value = false
		error.value = ''
		signedSuccess.value = false
	}
</script>

<template>
	<Card :class="cn('rounded-none w-full h-full')">
		<CardContent class="w-full h-full p-4 space-y-2 flex flex-col">
			<div class="shrink-0 flex items-center justify-between">
				<div class="text-lg font-semibold flex items-center">
					<Icon name="tabler:circle-key-filled" size="20" class="mr-1" />
					Tx Signer
				</div>
				<Button variant="outline" size="sm" @click="onReset()" class="h-6"> Reset </Button>
			</div>
			<div class="flex flex-col overflow-y-auto scroll-bar-primary">
				<InputGroup>
					<InputGroupAddon align="block-start">
						<InputGroupText>Unsigned Tx Cbor</InputGroupText>
					</InputGroupAddon>
					<InputGroupTextarea rows="4" autocomplete="off" type="text" placeholder="84a400d90..." v-model="unsignedCborHex" />
					<InputGroupAddon align="block-end">
						<div class="flex justify-between w-full">
							<div class="flex items-center space-x-2">
								<Checkbox id="partialSign" v-model="partialSign" />
								<label for="partialSign" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"> Partial sign </label>
							</div>
							<InputGroupButton variant="secondary" @click="signTx()" :disabled="false"> Sign Tx </InputGroupButton>
						</div>
					</InputGroupAddon>
				</InputGroup>
				<Alert variant="destructive" v-if="error" class="mt-2">
					<AlertTitle> <Icon name="tabler:alert-circle" size="16" class="-mb-0.5" /> Error</AlertTitle>
					<AlertDescription> {{ error }} </AlertDescription>
				</Alert>
				<Alert variant="default" v-if="signedSuccess" class="mt-2 text-success-500 border-success-200 bg-success-50">
					<AlertTitle> <Icon name="tabler:alert-circle" size="16" class="-mb-0.5" /> Success</AlertTitle>
					<AlertDescription> Transaction signed successfully! </AlertDescription>
				</Alert>
				<InputGroup class="mt-2">
					<InputGroupAddon align="block-start">
						<InputGroupText>Signed Tx Cbor</InputGroupText>
					</InputGroupAddon>
					<InputGroupTextarea rows="2" autocomplete="off" type="text" placeholder="84a400d90..." readonly v-model="signedCborHex" />
					<InputGroupAddon align="block-end">
						<div class="flex justify-end w-full">
							<InputGroupButton variant="outline" :disabled="!signedCborHex" @click="useCopy(signedCborHex)"> Copy </InputGroupButton>
						</div>
					</InputGroupAddon>
				</InputGroup>
			</div>
		</CardContent>
	</Card>
</template>

<style lang="scss" scoped></style>
