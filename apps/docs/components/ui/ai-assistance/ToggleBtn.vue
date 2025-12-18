<script lang="ts" setup>
	const { visiblePanel } = useHydraAssistance()
</script>

<template>
	<div v-if="!visiblePanel" class="" @click="visiblePanel = !visiblePanel">SHOW</div>
</template>

<style lang="scss" scoped></style>
