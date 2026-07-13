<script setup lang="ts">
type LandingCollection = 'landing_en' | 'landing_vi' | 'landing_ja'

const { locale } = useI18n()

const { data: page } = await useAsyncData(
  () => `index-${locale.value}`,
  async () => {
    // Each `landing_<locale>` collection holds a single index document, so
    // `.first()` returns it without depending on how the path is generated.
    const collection = ('landing_' + locale.value) as LandingCollection
    const content = await queryCollection(collection).first()
    if (!content && locale.value !== 'en') {
      return queryCollection('landing_en').first()
    }
    return content
  },
  { watch: [locale] }
)
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.seo?.title || page.value.title
const description = page.value.seo?.description || page.value.description

useSeoMeta({
  titleTemplate: '',
  title,
  ogTitle: title,
  description,
  ogDescription: description,
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/docs-light.png'
})
</script>

<template>
  <ContentRenderer
    v-if="page"
    :value="page"
    :prose="false"
  />
</template>
