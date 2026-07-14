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
    domain: 'https://hydrasdk.com',
    title: 'Hydra SDK',
    description: 'A TypeScript toolkit for building Cardano wallet applications with Hydra Layer 2 integration.',
    // nuxt-llms ships its own `/raw/**.md` route that is locale-unaware (it
    // queries the raw path, which never includes the stripped locale prefix).
    // Disable it so our locale-aware handler in server/routes/raw/ serves
    // `/raw/<locale>/...md` correctly.
    contentRawMarkdown: false,
    full: {
      title: 'Hydra SDK - Full Documentation',
      description: 'The complete documentation for Hydra SDK.'
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
        title: 'Guides',
        contentCollection: 'docs_en',
        contentFilters: [
          { field: 'path', operator: 'LIKE', value: '/guides%' }
        ]
      },
      {
        title: 'Concepts',
        contentCollection: 'docs_en',
        contentFilters: [
          { field: 'path', operator: 'LIKE', value: '/concepts%' }
        ]
      },
      {
        title: 'API Reference',
        contentCollection: 'docs_en',
        contentFilters: [
          { field: 'path', operator: 'LIKE', value: '/api%' }
        ]
      },
      {
        title: 'Resources',
        contentCollection: 'docs_en',
        contentFilters: [
          { field: 'path', operator: 'LIKE', value: '/resources%' }
        ]
      },
      {
        title: 'AI',
        contentCollection: 'docs_en',
        contentFilters: [
          { field: 'path', operator: 'LIKE', value: '/ai%' }
        ]
      }
    ]
  },

  mcp: {
    name: 'Hydra SDK'
  },

  ogImage: {
    zeroRuntime: true
  },

  // Pre-bundle animejs (dynamically imported for the header brand animation)
  // so dev doesn't trigger a page reload on first use.
  vite: {
    optimizeDeps: {
      include: ['animejs']
    }
  }
})
