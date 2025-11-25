<script setup lang="ts">
	import 'animate.css'
</script>
<template>
	<NuxtLoadingIndicator color="#a855f7" :height="2" />
	<NuxtLayout>
		<NuxtPage />
		<UiModalViewImage />
	</NuxtLayout>
</template>

<style lang="scss">
	html {
		scroll-behavior: smooth;
	}
</style>
