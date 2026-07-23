import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

/**
 * E2E suite — runs against a real hydra-node, so it is kept out of the default
 * `pnpm test` run. See packages/hydra-bridge/e2e/README.md.
 */
export default defineConfig({
	plugins: [tsconfigPaths()],

	test: {
		environment: 'node',
		globals: true,
		root: '.',
		watch: false,

		include: ['packages/**/*.e2e.test.ts'],

		// A single offline head is shared state — parallel files would race on
		// the snapshot number and on each other's UTxO.
		fileParallelism: false,
		testTimeout: 30_000,
		hookTimeout: 30_000,

		alias: {
			'@hydra-sdk/cardano-wasm': path.resolve(__dirname, 'packages/cardano-wasm/src/index.node.ts'),
			'@hydra-sdk/core': path.resolve(__dirname, 'packages/core/src/index.ts'),
			'@hydra-sdk/transaction': path.resolve(__dirname, 'packages/hydra-transaction/src/index.ts'),
			'@hydra-sdk/bridge': path.resolve(__dirname, 'packages/hydra-bridge/src/index.ts')
		}
	},

	optimizeDeps: {
		esbuildOptions: {
			supported: { wasm: true }
		}
	}
})
