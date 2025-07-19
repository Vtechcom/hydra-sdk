import tailwindcss from '@tailwindcss/vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-05-15',
	devtools: { enabled: true },
	modules: [
		'@nuxt/eslint',
		'@nuxt/fonts',
		'@nuxt/icon',
		'@nuxt/image',
		'@nuxt/scripts',
		'@nuxt/test-utils',
		'shadcn-nuxt',
		'@pinia/nuxt',
		'nuxt-lodash',
		'nuxt-mongoose'
	],
	css: ['~/assets/css/tailwind.css'],
	ssr: false,
	routeRules: {
		// '/auth/**': { ssr: false },
		// '/games/**': { ssr: false },
		// '/transfer/**': { ssr: false },
		// '/': { ssr: false },
		// '/playground/**': { ssr: true }
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
					global: true,
					process: true
				},
				// Whether to polyfill `node:` protocol imports.
				protocolImports: true
			})
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
			esbuildOptions: {
				supported: {
					'top-level-await': true
				}
			}
		}
	},
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
	fonts: {
		families: [
			{
				name: 'Inter',
				provider: 'google',
				weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
				subsets: ['latin', 'latin-ext'],
				display: 'swap'
			}
		],
		defaults: {
			weights: [400, 500, 600, 700],
			styles: ['normal'],
			subsets: ['latin']
		}
	},
	icon: {
		componentName: 'NuxtIcon',
		customCollections: [
			{
				prefix: 'svg-icon',
				dir: './assets/svgs',
				provider: 'server'
			}
		]
	},
	pinia: {
		storesDirs: ['./stores/**']
	},
	lodash: {
		prefix: '_',
		upperAfterPrefix: false
	},
	mongoose: {
		uri: process.env.MONGODB_URI,
		options: {},
		modelsDir: 'models',
		devtools: true
	},
	runtimeConfig: {
		public: {
			blockfrostApiKey: process.env.NUXT_PUBLIC_BLOCKFROST_IPFS_API_KEY
		},
		blockfrostApiKey: process.env.NUXT_BLOCKFROST_API_KEY,
		mongoUri: process.env.MONGODB_URI
	}
})
