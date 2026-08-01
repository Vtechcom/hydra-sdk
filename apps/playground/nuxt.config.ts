// https://nuxt.com/docs/api/configuration/nuxt-config

import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },
	modules: [
		'@nuxt/eslint',
		'nuxt-lodash', //
		'@vueuse/nuxt',
		'@nuxtjs/google-fonts',
		'@element-plus/nuxt',
		'shadcn-nuxt',
		'@nuxt/icon',
		'@pinia/nuxt',
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
			'mermaid'
		],
		bundledThemes: ['github-light', 'github-dark'],
		defaultTheme: 'github-light'
	},
	colorMode: {
		classSuffix: '',
		storage: 'localStorage',
		storageKey: 'color-mode',
		preference: 'system',
		fallback: 'dark'
	},

	icon: {
		serverBundle: {
			collections: ['heroicons', 'lucide', 'mdi', 'ic', 'simple-icons', 'twemoji']
		}
	},

	// Google Fonts — same pairing as apps/docs-v2 (Public Sans body, Space Grotesk
	// display), plus JetBrains Mono which the playground needs for CBOR/hashes.
	googleFonts: {
		families: {
			'Public Sans': [400, 500, 600, 700],
			'Space Grotesk': [500, 600, 700],
			'JetBrains Mono': [400, 500]
		}
	},
	vite: {
		plugins: [
			tailwindcss(),
			wasm(),
			topLevelAwait(),
			nodePolyfills({
				// Specific modules that should not be polyfilled.
				exclude: [],
				// Whether to polyfill specific globals.
				globals: {
					Buffer: true, // can also be 'build', 'dev', or false
					global: false,
					process: false
				},
				// Whether to polyfill `node:` protocol imports.
				protocolImports: true
			}),
			tsconfigPaths()
		],
		esbuild: {
			// drop: ['console', 'debugger'] // drop hết console.* và debugger
		},
		build: {
			rollupOptions: {
				output: {}
			}
		},
		optimizeDeps: {
			exclude: ['@hydra-sdk/cardano-wasm'],
			include: ['reka-ui'],
			esbuildOptions: {
				supported: {
					'top-level-await': true
				}
			}
		},
		server: {
			watch: {
				usePolling: true // optional nếu bạn dùng Docker hoặc không thấy reload
			},
			hmr: {
				overlay: true
			}
		}
	},
	lodash: {
		prefix: '_',
		upperAfterPrefix: false
	},
	// Element Plus is only used by the legacy pages (/, /hydra-tx-trace, the two
	// test pages) — the transaction builder no longer touches it. Its theme is
	// pointed at the brand green so those pages don't clash while they wait to be
	// migrated off it.
	elementPlus: {
		importStyle: 'scss',
		themeChalk: {
			$colors: {
				primary: { base: '#007f45' }
			},
			dark: {
				$colors: {
					primary: { base: '#00dc82' }
				}
			}
		}
	},

	// CSS configuration
	css: ['~/assets/scss/main.scss', '~/assets/css/tailwind.css'],
	shadcn: {
		/**
		 * Prefix for all the imported component
		 */
		prefix: '',
		/**
		 * Directory that the component lives in.
		 * @default "./components/ui"
		 */
		componentDir: './components/ui'
	},

	// Build
	app: {
		head: {
			title: 'Hydra SDK Playground',
			meta: [
				{ charset: 'utf-8' },
				{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
				{
					name: 'description',
					content: 'Hydra SDK Playground - A playground for experimenting with Hydra SDK features and capabilities'
				},
				{ name: 'theme-color', content: '#00dc82' },

				{ property: 'og:title', content: 'Hydra SDK Playground' },
				{ property: 'og:description', content: 'Hydra SDK Playground' },
				{ property: 'og:image', content: '/images/og-image.webp' },
				{ property: 'og:url', content: 'https://play.hydrasdk.com' },
				{ property: 'og:type', content: 'website' },
				{ property: 'og:site_name', content: 'Hydra SDK Playground' },
				{ property: 'og:locale', content: 'en_US' },

				{ name: 'twitter:card', content: 'summary' },
				{ name: 'twitter:site', content: '@hydra-sdk' },
				{ name: 'twitter:creator', content: '@hydra-sdk' },
				{ name: 'twitter:title', content: 'Hydra SDK Playground' },
				{ name: 'twitter:description', content: 'Hydra SDK Playground' },
				{ name: 'twitter:image', content: '/images/og-image.webp' },
				{ name: 'twitter:url', content: 'https://play.hydrasdk.com' }
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
		url: 'https://play.hydrasdk.com', // URL gốc của site
		siteName: 'Hydra SDK Playground'
	},
	// Nitro configuration for static generation
	ssr: false,
	nitro: {
		preset: 'static',
		prerender: {
			routes: ['/sitemap.xml', '/robots.txt'],
			crawlLinks: true,
			failOnError: false, // Không fail nếu có lỗi prerender
			ignore: [
				'/api' // Bỏ qua các route API nếu có
			]
		}
	},

	// Google Analytics (gtag) configuration
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
	}
})
