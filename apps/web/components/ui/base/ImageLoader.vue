<script lang="ts" setup>
	const props = defineProps<{
		imageHash?: string | null
	}>()
	const imageUrl = ref('')
	const ipfs = useIpfs()
	const loadingUrl = ref(false)
	const ipfsCache = useIpfsCache()

	watch(
		() => props.imageHash,
		() => fetchImageData()
	)
	onMounted(() => {
		fetchImageData()
	})

	async function fetchImageData() {
		if (!props.imageHash) {
			console.warn('Image hash is not provided')
			imageUrl.value = '/images/wallet-logo.png'
			return
		}
		loadingUrl.value = true
		try {
			const cachedData = await ipfsCache.get(props.imageHash)
			if (cachedData) {
				const blobStr = Buffer.from(cachedData, 'base64')
				const blob = new Blob([blobStr])
				imageUrl.value = URL.createObjectURL(blob)
				return
			}
			const { blobUrl, blob } = await ipfs.fetchImage(props.imageHash)
			imageUrl.value = blobUrl

			const arrayBuffer = await blob.arrayBuffer()
			ipfsCache.set(props.imageHash, Buffer.from(arrayBuffer).toString('base64'))
		} catch (error) {
			console.error(error)
		} finally {
			loadingUrl.value = false
		}
	}
</script>

<template>
	<span v-if="loadingUrl" class="inline-block p-2 shadow">
		<span class="block h-full w-full animate-spin rounded-full border-2 border-t-transparent"></span>
	</span>
	<img v-else :src="imageUrl" alt="icon" />
</template>

<style lang="scss" scoped></style>
