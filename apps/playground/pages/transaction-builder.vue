<script lang="ts" setup>
	import { GridLayout, GridItem } from 'vue3-grid-layout-next'
	useSeoMeta({
		title: 'Transaction Builder - Hydra Wallet SDK Playground',
		description: 'Build and simulate Cardano transactions with ease using the Hydra Wallet SDK Transaction Builder in our interactive playground.'
	})

	const uiStore = useUiStore()
	const { layout, draggable, resizable } = storeToRefs(uiStore)
</script>

<template>
	<grid-layout
		v-model:layout="layout"
		:margin="[2, 2]"
		:col-num="12"
		:row-height="24"
		:is-draggable="draggable"
		:is-resizable="resizable"
		:vertical-compact="true"
		is-bounded
		auto-size
		:use-css-transforms="true"
	>
		<grid-item v-bind="uiStore.getLayoutConfig('BaseWalletConfig')" class="bg-amber-100" drag-allow-from=".vue-draggable-handle" drag-ignore-from=".no-drag">
			<BaseDragSticky class="right-6 top-[3px]" />
			<BaseWalletConfig class="w-full h-full no-drag" />
		</grid-item>
		<grid-item v-bind="uiStore.getLayoutConfig('BaseProviderConfig')" class="bg-amber-100" drag-allow-from=".vue-draggable-handle" drag-ignore-from=".no-drag">
			<BaseDragSticky class="right-6 top-[3px]" />
			<BaseProviderConfig class="w-full h-full no-drag" />
		</grid-item>
		<grid-item v-bind="uiStore.getLayoutConfig('TxSigner')" class="bg-amber-100" drag-allow-from=".vue-draggable-handle" drag-ignore-from=".no-drag">
			<BaseDragSticky />
			<BaseTxSigner class="no-drag" />
		</grid-item>
		<grid-item v-bind="uiStore.getLayoutConfig('UtxoManager')" class="bg-amber-100" drag-allow-from=".vue-draggable-handle" drag-ignore-from=".no-drag">
			<BaseDragSticky />
			<BaseUtxoManager class="no-drag" />
		</grid-item>
		<grid-item v-bind="uiStore.getLayoutConfig('TxBuilder')" drag-allow-from=".vue-draggable-handle" drag-ignore-from=".no-drag">
			<BaseDragSticky />
			<TxBuilder class="no-drag" />
		</grid-item>
		<grid-item v-bind="uiStore.getLayoutConfig('TxSubmit')" drag-allow-from=".vue-draggable-handle" drag-ignore-from=".no-drag">
			<BaseDragSticky />
			<BaseTxSubmit class="no-drag" />
		</grid-item>
	</grid-layout>
</template>

<style lang="scss" scoped></style>
