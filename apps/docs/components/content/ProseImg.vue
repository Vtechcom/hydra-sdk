<script lang="ts" setup>
	const props = defineProps<{
		src: string
		alt?: string
	}>()

	const { showModal, openImageModal } = useViewImage()
</script>

<template>
	<div class="my-2 text-center">
		<img
			:src="props.src"
			:alt="props.alt"
			class="my-0 w-full cursor-zoom-in rounded-md will-change-transform"
			type="button"
			aria-haspopup="dialog"
			aria-expanded="false"
			:data-state="showModal ? 'opened' : 'closed'"
			style="transform: none; transform-origin: 50% 50% 0px"
			@click="openImageModal(props.src, props.alt)"
		/>
		<span class="text-sm text-gray-500 dark:text-gray-400">{{ props.alt }}</span>
	</div>
</template>

<style lang="scss" scoped></style>
