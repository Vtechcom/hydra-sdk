import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm'],
	splitting: false,
	sourcemap: true,
	clean: true,
	target: 'es2020',
	outDir: 'dist',
	dts: true,
	// External dependencies that should not be bundled
	external: ['@emurgo/cardano-serialization-lib-browser', '@emurgo/cardano-serialization-lib-nodejs'],
	// Bundle workspace dependencies
	noExternal: ['@hydra-sdk/cardano-wasm']
})
