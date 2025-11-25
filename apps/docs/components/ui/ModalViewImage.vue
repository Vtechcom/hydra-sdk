<script lang="ts" setup>
	const { showModal, imageProps, openImageModal, closeImageModal } = useViewImage()
</script>

<template>
	<UModal v-model="showModal" :closeable="true" :ui="{ base: 'sm:!max-w-[90vw] max-h-[90vh] ' }">
		<div class="flex h-full w-full items-center justify-center p-4">
			<img
				:src="imageProps.src"
				:alt="imageProps.alt"
				class="w-full cursor-zoom-out rounded-md object-contain will-change-transform"
				type="button"
				aria-haspopup="dialog"
				aria-expanded="false"
				:data-state="showModal ? 'opened' : 'closed'"
				style="transform: none; transform-origin: 50% 50% 0px"
				@click="showModal = false"
			/>
		</div>
	</UModal>
</template>

<style lang="scss" scoped></style>
