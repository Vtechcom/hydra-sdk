import { withLeadingSlash } from 'ufo'
import { stringify } from 'minimark/stringify'
import { queryCollection } from '@nuxt/content/server'
import type { Collections } from '@nuxt/content'

// Keep in sync with `i18n.locales` in nuxt.config.ts
const LOCALES = ['en', 'vi', 'ja']
const DEFAULT_LOCALE = 'en'

export default eventHandler(async (event) => {
  const slug = getRouterParams(event)['slug.md']
  if (!slug?.endsWith('.md')) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
  }

  // A localized URL like `/raw/vi/getting-started.md` carries the locale as the
  // first path segment; strip it and query the matching `docs_<locale>`
  // collection (whose paths are locale-stripped).
  const segments = slug.replace('.md', '').split('/').filter(Boolean)
  let locale = DEFAULT_LOCALE
  if (segments[0] && LOCALES.includes(segments[0]) && segments[0] !== DEFAULT_LOCALE) {
    locale = segments.shift()!
  }
  const path = withLeadingSlash(segments.join('/'))
  const collection = (`docs_${locale}`) as keyof Collections

  let page = await queryCollection(event, collection).path(path).first()
  if (!page && locale !== DEFAULT_LOCALE) {
    page = await queryCollection(event, 'docs_en').path(path).first()
  }
  if (!page) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
  }

  // Add title and description to the top of the page if missing
  if (page.body.value[0]?.[0] !== 'h1') {
    page.body.value.unshift(['blockquote', {}, page.description])
    page.body.value.unshift(['h1', {}, page.title])
  }

  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  return stringify({ ...page.body, type: 'minimark' }, { format: 'markdown/html' })
})
