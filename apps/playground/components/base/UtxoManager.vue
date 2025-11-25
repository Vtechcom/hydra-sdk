<script lang="ts" setup>
	import { Deserializer, type UTxO, type UTxOObject } from '@hydra-sdk/core'
	import BigNumber from 'bignumber.js'
	import { toast } from 'vue-sonner'
	import { cn } from '~/lib/utils'

	const mainStore = useMainStore()
	const { networkInfo } = storeToRefs(mainStore)
	const providerStore = useProviderStore()

	const utxoObj: UTxOObject = {
		'c2e3452de098d13ae536c3fb9df599d119631d618aaa2738522aeced2d2a1ac2#0': {
			address: 'addr_test1qpxsf0x8xypuhq5k408f9kh0meyy6jv2lxgqw2fefvjlte0u06dugtmxuhhw8hschdn4q59g64q5s9z42ax6qyg7ewsqt6e548',
			datum: null,
			datumhash: null,
			inlineDatum: null,
			inlineDatumRaw: null,
			referenceScript: null,
			value: {
				lovelace: 1327480,
				e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed72: {
					'4d494e': 2000000000
				},
				fef67460342d081cb7881318b1f33b87626d1a1042b4c2acbbc0725d: {
					'7441424f': 1000000
				},
				'9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c4': {
					'55444f': 1_000_000_000
				}
			}
		},
		'd2e3452de098d13ae536c3fb9df599d119631d618aaa2738522aeced2d2a1ac3#1': {
			address: 'addr_test1qpxsf0x8xypuhq5k408f9kh0meyy6jv2lxgqw2fefvjlte0u06dugtmxuhhw8hschdn4q59g64q5s9z42ax6qyg7ewsqt6e548',
			datum: null,
			datumhash: null,
			inlineDatum: null,
			inlineDatumRaw: null,
			referenceScript: null,
			value: {
				lovelace: 5000000000
			}
		}
	}

	const utxos = shallowRef<UTxO[]>([])
	const totalLovelace = computed(() => {
		return utxos.value.reduce((acc, utxo) => acc + Number(utxo.output.amount.at(0)?.quantity || 0), 0)
	})
	const totalAssets = computed(() => {
		return utxos.value.reduce((acc, utxo) => acc + (utxo.output.amount.length - 1), 0)
	})

	const address = ref('')
	const fetchingUtxo = ref(false)
	const fetchUtxo = async () => {
		if (!address.value) return

		try {
			try {
				const { kind } = Deserializer.deserializeAddress(address.value) // Validate address
				console.log('>>> / deserializeAddress / kind:', kind)
			} catch (error) {
				toast.error('Invalid address format.')
				return
			}

			const provider = providerStore.getBlockfrostProvider()
			fetchingUtxo.value = true
			utxos.value = await provider.fetcher.fetchAddressUTxOs(address.value)
			triggerRef(utxos)
		} catch (error: any) {
			console.log('Error fetching UTxO:', error?.message)
			toast.error('Error fetching UTxO. Please check the address and try again.')
		} finally {
			fetchingUtxo.value = false
		}
	}
	const addToInput = (utxo: UTxO) => {
		mainStore.addUTxOToInput(utxo)
	}
</script>

<template>
	<Card :class="cn('rounded-none w-full h-full')">
		<CardContent class="w-full h-full p-4 space-y-2 flex flex-col">
			<div class="shrink-0">
				<div class="text-lg font-semibold flex items-center">
					<Icon name="mdi:format-list-checkbox" size="20" class="mr-1" />
					UTxO Manager
				</div>
				<InputGroup>
					<InputGroupAddon>
						<InputGroupText>{{ networkInfo.label }}</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput autocomplete="off" type="text" placeholder="addr..." v-model="address" />
					<InputGroupAddon align="inline-end">
						<InputGroupButton variant="secondary" @click="fetchUtxo()" :disabled="fetchingUtxo || !address">
							<Icon name="tabler:search" size="16" class="-mb-0.5 inline-block mr-1" v-if="!fetchingUtxo" />
							<Icon name="mdi:loading" size="16" class="-mb-0.5 inline-block mr-1 animate-spin" v-else />
							Query UTxO
						</InputGroupButton>
					</InputGroupAddon>
				</InputGroup>
			</div>
			<div class="shrink-0 flex items-center justify-between">
				<div class="font-mono text-xs flex items-center h-4 space-x-2">
					<span>
						<span class="font-semibold">{{ utxos.length }}</span> UTxO on address
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
					<Button size="sm" class="h-7" variant="outline" @click="utxos = []" :disabled="utxos.length === 0">Clear</Button>
				</div>
			</div>
			<div class="grow overflow-hidden">
				<div class="flex flex-col space-y-1 font-mono mb-2 overflow-y-auto h-full scroll-bar-primary">
					<BaseUtxoItem @add="addToInput" :utxo="utxo" v-for="utxo in utxos" :key="`${utxo.input.txHash}#${utxo.input.outputIndex}`"> </BaseUtxoItem>
				</div>
			</div>
		</CardContent>
	</Card>
</template>

<style lang="scss" scoped></style>
