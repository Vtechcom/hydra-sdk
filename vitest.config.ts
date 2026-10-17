import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

// Only the root tsconfig — auto-discovery would also parse apps/* (Nuxt tsconfigs extend a
// generated .nuxt/tsconfig.json) and .claude/worktrees/*, printing TSConfckParseError.
export const tsconfigPathsPlugin = () => tsconfigPaths({ projects: [path.resolve(__dirname, 'tsconfig.json')] })

// Tests run against src, so no package has to be built first.
export const alias = {
	'@hydra-sdk/cardano-wasm': path.resolve(__dirname, 'packages/cardano-wasm/src/index.node.ts'),
	'@hydra-sdk/core': path.resolve(__dirname, 'packages/core/src/index.ts'),
	'@hydra-sdk/transaction': path.resolve(__dirname, 'packages/hydra-transaction/src/index.ts'),
	'@hydra-sdk/bridge': path.resolve(__dirname, 'packages/hydra-bridge/src/index.ts'),
	'@hydra-sdk/evaluator': path.resolve(__dirname, 'packages/evaluator/src/index.ts'),
	'@hydra-sdk/app-bridge': path.resolve(__dirname, 'packages/app-bridge/src/index.ts')
}

// One project per package, named after its directory: `pnpm vitest run --project core`.
// Each project sets its own root, since `extends: true` would concatenate a root-level include.
const PACKAGES = ['app-bridge', 'cardano-wasm', 'core', 'evaluator', 'hydra-bridge', 'hydra-transaction']

export default defineConfig({
	plugins: [tsconfigPathsPlugin()],

	test: {
		environment: 'node',
		globals: true,
		root: '.', // monorepo root
		watch: false,

		// e2e needs a live hydra-node — run it with `pnpm test:e2e`.
		exclude: ['**/node_modules/**', '**/dist/**', '**/*.e2e.test.ts'],

		alias,

		projects: PACKAGES.map(name => ({
			extends: true,
			test: {
				name,
				root: path.resolve(__dirname, 'packages', name),
				include: ['**/*.test.ts', '**/*.spec.ts']
			}
		})),

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
				// Package entry barrels only — nested index.ts files hold real code (e.g. tx-builder/index.ts).
				'packages/*/src/index.ts',
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
