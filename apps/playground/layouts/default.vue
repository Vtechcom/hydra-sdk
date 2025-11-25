<script lang="ts" setup>
	import MainHeader from '~/components/layout/MainHeader.vue'
</script>

<template>
	<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
		<MainHeader></MainHeader>
		<!-- Main Content -->
		<main class="flex-1">
			<slot />
		</main>
	</div>
</template>

<style lang="scss" scoped></style>
