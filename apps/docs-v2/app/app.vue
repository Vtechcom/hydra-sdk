<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const { locale } = useI18n()
const { seo } = useAppConfig()

const { data: navigation } = await useAsyncData(
  'navigation',
  () => queryCollectionNavigation(('docs_' + locale.value) as keyof Collections),
  { watch: [locale] }
)
const { data: files } = useLazyAsyncData(
  'search',
  () => queryCollectionSearchSections(('docs_' + locale.value) as keyof Collections),
  { server: false, watch: [locale] }
)

useHead(() => ({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: locale.value
  }
}))

useSeoMeta({
  titleTemplate: `%s - ${seo?.siteName}`,
  ogSiteName: seo?.siteName,
  twitterCard: 'summary_large_image'
})

provide('navigation', navigation)
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <AppHeader />

    <UMain>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>

    <AppFooter />

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        :navigation="navigation"
      />
    </ClientOnly>
  </UApp>
</template>
