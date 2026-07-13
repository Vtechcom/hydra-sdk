// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxtjs/i18n',
    'nuxt-og-image',
    'nuxt-llms',
    '@nuxtjs/mcp-toolkit'
  ],

  // Keep locale codes in sync with the collections in content.config.ts
  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', language: 'en-US' },
      { code: 'vi', name: 'Tiếng Việt', language: 'vi-VN' },
      { code: 'ja', name: '日本語', language: 'ja-JP' }
    ],
    // Explicit, deterministic routing for now: `/` always serves the default
    // locale. Enable browser detection later once translations land.
    detectBrowserLanguage: false
  },

  devtools: {
    enabled: true
  },

  // Run in parallel with apps/docs (port 3002)
  devServer: {
    port: 3003
  },

  // Dark-first, matching the strikefinance-inspired canvas (toggle still works)
  colorMode: {
    preference: 'dark'
  },

  css: ['~/assets/css/main.css'],

  content: {
    build: {
      markdown: {
        toc: {
          searchDepth: 1
        }
      }
    },
    experimental: {
      sqliteConnector: 'native'
    }
  },

  experimental: {
    asyncContext: true
  },

  compatibilityDate: '2026-06-30',

  nitro: {
    prerender: {
      routes: [
        '/'
      ],
      crawlLinks: true
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  llms: {
    domain: 'https://docs-template.nuxt.dev/',
    title: 'Nuxt Docs Template',
    description: 'A template for building documentation with Nuxt UI and Nuxt Content.',
    // nuxt-llms ships its own `/raw/**.md` route that is locale-unaware (it
    // queries the raw path, which never includes the stripped locale prefix).
    // Disable it so our locale-aware handler in server/routes/raw/ serves
    // `/raw/<locale>/...md` correctly.
    contentRawMarkdown: false,
    full: {
      title: 'Nuxt Docs Template - Full Documentation',
      description: 'This is the full documentation for the Nuxt Docs Template.'
    },
    sections: [
      {
        title: 'Getting Started',
        contentCollection: 'docs_en',
        contentFilters: [
          { field: 'path', operator: 'LIKE', value: '/getting-started%' }
        ]
      },
      {
        title: 'Essentials',
        contentCollection: 'docs_en',
        contentFilters: [
          { field: 'path', operator: 'LIKE', value: '/essentials%' }
        ]
      }
    ]
  },

  mcp: {
    name: 'Docs template'
  },

  ogImage: {
    zeroRuntime: true
  }
})
