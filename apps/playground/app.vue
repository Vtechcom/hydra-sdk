<script lang="ts" setup>
	import { Toaster } from '@/components/ui/sonner'
	import 'vue-sonner/style.css'

	useSeoMeta({
		description: 'A playground for experimenting with Hydra SDK features and capabilities',
		ogTitle: 'Hydra SDK Playground',
		ogDescription: 'A playground for experimenting with Hydra SDK features and capabilities',
		ogImage: '/images/og-image.webp',
		ogUrl: 'https://play.hydrasdk.com',
		twitterTitle: 'Hydra SDK Playground',
		twitterDescription: 'A playground for experimenting with Hydra SDK features and capabilities',
		twitterImage: '/images/og-image.webp',
		twitterCard: 'summary'
	})

</script>

<template>
	<NuxtLoadingIndicator color="#00dc82" :height="2" />
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
	<Toaster rich-colors />
</template>

<style lang="scss" scoped></style>
