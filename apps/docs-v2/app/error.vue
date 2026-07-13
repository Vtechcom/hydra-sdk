<script setup lang="ts">
import type { NuxtError } from '#app'
import type { Collections } from '@nuxt/content'

defineProps<{
  error: NuxtError
}>()

const { locale } = useI18n()

useHead(() => ({
  htmlAttrs: {
    lang: locale.value
  }
}))

useSeoMeta({
  title: 'Page not found',
  description: 'We are sorry but this page could not be found.'
})

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

provide('navigation', navigation)
</script>

<template>
  <UApp>
    <AppHeader />

    <UError :error="error" />

    <AppFooter />

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        :navigation="navigation"
      />
    </ClientOnly>
  </UApp>
</template>
