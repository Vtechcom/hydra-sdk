import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
	plugins: [tsconfigPaths()],

	test: {
		environment: 'node',
		globals: true,
		root: '.', // monorepo root
		watch: false,

		include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts', 'packages/**/*.test.ts', 'packages/**/*.spec.ts'],

		// e2e needs a live hydra-node — run it with `pnpm test:e2e`.
		exclude: ['**/node_modules/**', '**/dist/**', '**/*.e2e.test.ts'],

		alias: {
			'@hydra-sdk/cardano-wasm': path.resolve(__dirname, 'packages/cardano-wasm/src/index.node.ts'),
			'@hydra-sdk/core': path.resolve(__dirname, 'packages/core/src/index.ts'),
			'@hydra-sdk/transaction': path.resolve(__dirname, 'packages/hydra-transaction/src/index.ts'),
			'@hydra-sdk/bridge': path.resolve(__dirname, 'packages/hydra-bridge/src/index.ts')
		},

		coverage: {
			provider: 'v8',
			include: ['packages/**/src/**/*.ts'],
			exclude: [
				'**/node_modules/**',
				'**/dist/**',
				'packages/cardano-wasm/**', // exclude cardano-wasm due to wasm files
				'apps/**', // exclude apps
				'**/types/**',
				'**/__tests__/**',
				'**/mocks/**',
				'**/constants/**',
				'**/index.ts',
				'**/*.d.ts'
			],
			reportsDirectory: 'coverage',
			reporter: ['text', 'lcov', 'html', 'json-summary']
		}
	},

	optimizeDeps: {
		esbuildOptions: {
			supported: {
				wasm: true
			}
		}
	}
})
