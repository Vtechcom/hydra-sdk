<script lang="ts" setup>
	import { toast } from 'vue-sonner'
	import { cn } from '~/lib/utils'

	const mainStore = useMainStore()
	const { network } = storeToRefs(mainStore)
	const providerStore = useProviderStore()
	const { blockfrostConfig, blockfrostFormError } = storeToRefs(providerStore)

	const blockfrostNetwork = computed(() => providerStore.blockfrostNetworkMap[network.value])
	const defaultEndpoint = computed(() => `https://cardano-${blockfrostNetwork.value}.blockfrost.io/api/v0`)

	const apiEndpoint = ref(blockfrostConfig.value.apiEndpoint || defaultEndpoint.value)
	const apiKey = ref(blockfrostConfig.value.apiKey)

	// The endpoint follows the selected network unless the user has typed their own.
	watch(defaultEndpoint, (next, previous) => {
		if (!apiEndpoint.value || apiEndpoint.value === previous) apiEndpoint.value = next
	})

	const endpointError = computed(() => {
		if (!apiEndpoint.value.trim()) return 'API URL is required'
		if (!/^https?:\/\//.test(apiEndpoint.value)) return 'Must be a valid URL'
		if (!apiEndpoint.value.includes(blockfrostNetwork.value)) return `URL should target ${blockfrostNetwork.value}`
		return ''
	})

	const keyError = computed(() => {
		if (!apiKey.value.trim()) return 'API key is required'
		if (!apiKey.value.startsWith(blockfrostNetwork.value)) return `Key should start with "${blockfrostNetwork.value}"`
		return ''
	})

	const connected = computed(() => !!blockfrostConfig.value.apiKey && !blockfrostFormError.value.blockfrostApiKey)

	const apply = () => {
		if (endpointError.value || keyError.value) {
			blockfrostFormError.value = { blockfrostApiEndpoint: endpointError.value, blockfrostApiKey: keyError.value }
			toast.error(endpointError.value || keyError.value)
			return
		}
		providerStore.setBlockfrostConfig({ apiKey: apiKey.value.trim(), apiEndpoint: apiEndpoint.value.trim() })
		blockfrostFormError.value = {}
		toast.success('Blockfrost provider connected')
	}
</script>

<template>
	<div class="space-y-2">
		<div class="flex items-center gap-1.5">
			<span :class="cn('size-1.5 shrink-0 rounded-full', connected ? 'bg-primary' : 'bg-muted-foreground/40')" />
			<span class="text-xs">{{ connected ? 'Blockfrost connected' : 'Blockfrost not configured' }}</span>
			<Badge variant="muted" class="ml-auto">{{ blockfrostNetwork }}</Badge>
		</div>

		<div class="space-y-1.5">
			<div>
				<label class="eyebrow mb-1 block" for="bf-endpoint">API URL</label>
				<Input id="bf-endpoint" v-model="apiEndpoint" autocomplete="off" class="h-8 font-mono text-xs" :class="endpointError ? 'border-destructive' : ''" />
				<p v-if="endpointError" class="mt-0.5 text-[11px] text-destructive">{{ endpointError }}</p>
			</div>
			<div>
				<label class="eyebrow mb-1 block" for="bf-key">API key</label>
				<Input
					id="bf-key"
					v-model="apiKey"
					type="password"
					autocomplete="off"
					:placeholder="`${blockfrostNetwork}…`"
					class="h-8 font-mono text-xs"
					:class="keyError && apiKey ? 'border-destructive' : ''"
				/>
				<p v-if="keyError && apiKey" class="mt-0.5 text-[11px] text-destructive">{{ keyError }}</p>
			</div>
		</div>

		<Button size="sm" variant="secondary" class="h-7 w-full text-xs" @click="apply()">Connect</Button>
	</div>
</template>
