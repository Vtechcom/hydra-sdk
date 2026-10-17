import { defineConfig } from 'vitest/config'
import { alias, tsconfigPathsPlugin } from './vitest.config'

/**
 * E2E suite — runs against a real hydra-node, so it is kept out of the default
 * `pnpm test` run. See packages/hydra-bridge/e2e/README.md.
 */
export default defineConfig({
	plugins: [tsconfigPathsPlugin()],

	test: {
		environment: 'node',
		globals: true,
		root: '.',
		watch: false,

		// Covers packages/<pkg>/e2e/**/*.e2e.test.ts (e.g. core/e2e/providers) as well as loose *.e2e.test.ts files.
		include: ['packages/**/*.e2e.test.ts'],
		exclude: ['**/node_modules/**', '**/dist/**'],

		// A single offline head is shared state — parallel files would race on
		// the snapshot number and on each other's UTxO.
		fileParallelism: false,
		testTimeout: 30_000,
		hookTimeout: 30_000,

		alias
	},

	optimizeDeps: {
		esbuildOptions: {
			supported: { wasm: true }
		}
	}
})
