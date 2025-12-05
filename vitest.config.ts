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

		alias: {
			'@hydra-sdk/cardano-wasm': path.resolve(__dirname, 'packages/cardano-wasm/src/index.node.ts'),
			'@hydra-sdk': path.resolve(__dirname, 'packages')
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
				// '**/index.ts',
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
