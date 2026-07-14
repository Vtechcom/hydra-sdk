import { defineContentConfig, defineCollection, z } from '@nuxt/content'

// Keep in sync with the `i18n.locales` codes in nuxt.config.ts
const locales = ['en', 'vi', 'ja'] as const

const docsSchema = z.object({
  links: z.array(z.object({
    label: z.string(),
    icon: z.string(),
    to: z.string(),
    target: z.string().optional()
  })).optional()
})

// One `landing_<locale>` + `docs_<locale>` collection per language.
// `source.include: '<locale>/**'` with `prefix: ''` strips the locale folder
// from the content path, so `content/vi/1.getting-started/1.index.md` and
// `content/en/1.getting-started/1.index.md` both resolve to `/getting-started`.
function localizedCollections() {
  return Object.fromEntries(
    locales.flatMap(locale => [
      [`landing_${locale}`, defineCollection({
        type: 'page',
        source: { include: `${locale}/index.md`, prefix: '' }
      })],
      [`docs_${locale}`, defineCollection({
        type: 'page',
        source: { include: `${locale}/**`, exclude: [`${locale}/index.md`], prefix: '' },
        schema: docsSchema
      })]
    ])
  )
}

export default defineContentConfig({
  collections: localizedCollections()
})
