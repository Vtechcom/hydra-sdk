// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: true },
	compatibilityDate: '2025-08-09',

	modules: [
		'@nuxt/eslint',
		'@nuxtjs/sitemap',
		'@nuxt/content',
		'@nuxt/ui', //
		'@vueuse/nuxt',
		'@nuxtjs/google-fonts',
		'@nuxtjs/tailwindcss',
		'@nuxtjs/i18n',
		'nuxt-og-image',
		'nuxt-shiki',
		'@nuxtjs/color-mode',
		'nuxt-gtag'
	],
	shiki: {
		bundledLangs: [
			'typescript',
			'javascript',
			'bash',
			'json',
			'markdown',
			'yaml',
			'vue',
			'yml',
			'ts',
			'jsx',
			'tsx',
			'powershell',
			'shell',
			'sh',
			'dotenv',
			'mermaid',
			'svelte'
		],
		bundledThemes: ['github-light', 'github-dark', 'material-theme-palenight'],
		defaultTheme: 'github-light'
	},
	colorMode: {
		classSuffix: '',
		storage: 'localStorage',
		storageKey: 'color-mode',
		fallback: 'light'
	},

	// Content configuration
	content: {
		build: {
			markdown: {
				highlight: {
					theme: {
						default: 'github-light', // theme khi light mode
						dark: 'github-dark' // theme khi dark mode
					},
					preload: ['typescript', 'javascript', 'bash', 'json', 'markdown', 'yaml', 'vue']
				},
				toc: {
					depth: 4,
					searchDepth: 4
				}
			}
		},
		experimental: {
			sqliteConnector: 'native'
		}
	},

	// UI configuration
	ui: {
		// global: true,
		// icons: ['heroicons', 'simple-icons']
		colorMode: false
	},
	icon: {
		serverBundle: {
			collections: ['heroicons', 'lucide', 'mdi', 'ic', 'simple-icons', 'twemoji']
		}
	},

	// Google Fonts
	googleFonts: {
		families: {
			Inter: [400, 500, 600, 700, 800],
			'JetBrains Mono': [400, 500]
		}
	},

	// CSS configuration
	css: ['~/assets/scss/main.scss'],
	tailwindcss: {
		cssPath: '~/assets/css/tailwind.css'
	},

	postcss: {
		plugins: {
			tailwindcss: {},
			autoprefixer: {}
		}
	},

	vite: {
		plugins: []
	},

	// TypeScript configuration
	typescript: {
		typeCheck: true
	},

	// App configuration
	app: {
		head: {
			title: 'Hydra SDK Documentation',
			meta: [
				{ charset: 'utf-8' },
				{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
				{
					name: 'description',
					content: 'Complete documentation for Hydra SDK - Build Cardano wallet applications with Hydra Layer 2 integration'
				},
				{ name: 'theme-color', content: '#3b82f6' },

				{ property: 'og:title', content: 'Hydra SDK Documentation' },
				{
					property: 'og:description',
					content: 'Complete documentation for Hydra SDK - Build Cardano wallet applications with Hydra Layer 2 integration'
				},
				{ property: 'og:image', content: '/images/og-image.webp' },
				{ property: 'og:url', content: 'https://hydrasdk.com' },
				{ property: 'og:type', content: 'website' },
				{ property: 'og:site_name', content: 'Hydra SDK Documentation' },
				{ property: 'og:locale', content: 'vi_VN' },

				{ name: 'twitter:card', content: 'summary' },
				{ name: 'twitter:site', content: '@hydra-sdk' },
				{ name: 'twitter:creator', content: '@hydra-sdk' },
				{ name: 'twitter:title', content: 'Hydra SDK Documentation' },
				{
					name: 'twitter:description',
					content: 'Complete documentation for Hydra SDK - Build Cardano wallet applications with Hydra Layer 2 integration'
				},
				{ name: 'twitter:image', content: '/images/og-image.webp' },
				{ name: 'twitter:url', content: 'https://hydrasdk.com' }
			],
			link: [
				{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
				{ rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
				{ rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
				{ rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' }
			]
		}
	},

	// @nuxtjs/sitemap configuration
	// @ts-ignore
	site: {
		url: 'https://hydrasdk.com', // URL gốc của site
		siteName: 'Hydra SDK Documentation'
	},
	runtimeConfig: {
		public: {
			askAiApiBaseUrl: process.env.NUXT_PUBLIC_ASK_AI_API_BASE_URL || ''
		}
	},
	// Nitro configuration for static generation
	ssr: true,
	nitro: {
		preset: 'static',
		prerender: {
			routes: ['/sitemap.xml', '/robots.txt'],
			crawlLinks: true,
			failOnError: false // Không fail nếu có lỗi prerender
		}
	},

	// Build configuration
	build: {
		transpile: ['@headlessui/vue']
	},

	// i18n configuration
	i18n: {
		locales: [
			{ code: 'en', name: 'English', file: 'en.json' },
			{ code: 'vi', name: 'Tiếng Việt', file: 'vi.json' },
			{ code: 'ja', name: '日本語', file: 'ja.json' }
		],
		defaultLocale: 'en',
		strategy: 'prefix_except_default', // /en/page hoặc /vi/page
		langDir: 'locales/',
		detectBrowserLanguage: {
			useCookie: true,
			cookieKey: 'i18n_redirected',
			redirectOn: 'root'
		}
	},

	gtag: {
		// Lấy ID từ biến môi trường
		id: process.env.NUXT_PUBLIC_GTAG_ID,

		// Cấu hình nâng cao (optional)
		config: {
			// Tắt tracking khi dev
			send_page_view: true,

			// Cookie options
			cookie_domain: 'auto',
			cookie_flags: 'SameSite=None;Secure'
		},

		// Chỉ load gtag khi có ID (production)
		enabled: !!process.env.NUXT_PUBLIC_GTAG_ID,

		// Load gtag script
		loadingStrategy: 'defer' // hoặc 'async'
	},

	// Development configuration
	devServer: {
		port: 3002
	}
})
