import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm', 'cjs'],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	target: 'es2020',
	outDir: 'dist',
	shims: false,
	skipNodeModulesBundle: true,
	external: ['@hydra-sdk/cardano-wasm']
})
