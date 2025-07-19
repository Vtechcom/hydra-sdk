<script setup lang="ts">
	import { Toaster } from '@/components/ui/sonner'
	import 'vue-sonner/style.css'
	import 'animate.css'
	import { APP_NAME, APP_URL, APP_VERSION } from './constants/appVersion'

	useHead({
		meta: [
			{ property: 'og:title', content: `${APP_NAME} - v${APP_VERSION}` },
			{ property: 'og:description', content: `${APP_NAME} - v${APP_VERSION}` },
			{ property: 'og:image', content: '/images/og-image.jpg' },
			{ property: 'og:url', content: APP_URL },
			{ property: 'og:type', content: 'website' },
			{ property: 'og:site_name', content: `${APP_NAME} - v${APP_VERSION}` },
			{ property: 'og:locale', content: 'vi_VN' },
			//
			{ name: 'twitter:card', content: 'summary' },
			{ name: 'twitter:site', content: '@hydra-wallet-app' },
			{ name: 'twitter:creator', content: '@hydra-wallet-app' },
			{ name: 'twitter:title', content: `${APP_NAME} - v${APP_VERSION}` },
			{ name: 'twitter:description', content: `${APP_NAME} - v${APP_VERSION}` },
			{ name: 'twitter:image', content: '/images/og-image.jpg' },
			{ name: 'twitter:url', content: APP_URL },
			//
			{ name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' }
		],
		title: `${APP_NAME} - v${APP_VERSION}`,
		link: [
			// { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
			// { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
			{ rel: 'icon', type: 'image/svg', sizes: '32x32', href: '/logo-36x36.svg' },
			{ rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' }
		]
	})
</script>

<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
	<Toaster />
</template>

<style lang="scss">
	@use '~/assets/scss/index.scss';
</style>
