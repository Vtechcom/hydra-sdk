<script lang="ts" setup>
	import MainHeader from '~/components/layout/MainHeader.vue'
</script>

<template>
	<div class="min-h-screen bg-background text-foreground">
		<MainHeader></MainHeader>
		<!-- Main Content -->
		<main class="flex-1">
			<slot />
		</main>
	</div>
</template>

<style lang="scss" scoped></style>
