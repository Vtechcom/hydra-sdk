<script lang="ts" setup>
	import { Toaster } from '@/components/ui/sonner'
	import 'vue-sonner/style.css'

	const SITE_URL = 'https://playground.hydrasdk.com'
	const DESCRIPTION = 'Build, inspect, sign and submit Cardano and Hydra transactions in the browser — with the matching TypeScript generated as you go.'
	// Crawlers do not resolve relative image paths reliably, so the card URL is absolute.
	const OG_IMAGE = `${SITE_URL}/images/og-image.png`
	const OG_ALT = 'Hydra SDK Playground — build Cardano and Hydra transactions in the browser'

	useSeoMeta({
		description: DESCRIPTION,

		ogTitle: 'Hydra SDK Playground',
		ogDescription: DESCRIPTION,
		ogType: 'website',
		ogSiteName: 'Hydra SDK Playground',
		ogLocale: 'en_US',
		ogUrl: SITE_URL,
		ogImage: OG_IMAGE,
		// Dimensions let a crawler lay the card out before the image arrives.
		ogImageWidth: 1200,
		ogImageHeight: 630,
		ogImageType: 'image/png',
		ogImageAlt: OG_ALT,

		// `summary` crops a 1200×630 card to a small square — this one is wide.
		twitterCard: 'summary_large_image',
		twitterSite: '@VtechcomLabs',
		twitterCreator: '@VtechcomLabs',
		twitterTitle: 'Hydra SDK Playground',
		twitterDescription: DESCRIPTION,
		twitterImage: OG_IMAGE,
		twitterImageAlt: OG_ALT
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
