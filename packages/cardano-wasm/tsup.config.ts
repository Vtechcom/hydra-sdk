import { defineConfig } from 'tsup'

export default defineConfig([
	// Browser build
	{
		entry: { index: 'src/index.ts' },
		format: ['esm', 'cjs'],
		splitting: false,
		sourcemap: true,
		clean: true,
		target: 'es2020',
		outDir: 'dist',
		dts: true,
		outExtension({ format }) {
			return {
				js: format === 'esm' ? '.mjs' : '.js'
			}
		},
		external: ['@emurgo/cardano-serialization-lib-browser']
	},
	// Node.js build
	{
		entry: { 'index.node': 'src/index.node.ts' },
		format: ['esm', 'cjs'],
		splitting: false,
		sourcemap: true,
		clean: false, // Don't clean for the second build
		target: 'es2020',
		outDir: 'dist',
		dts: true,
		outExtension({ format }) {
			return {
				js: format === 'esm' ? '.mjs' : '.js'
			}
		},
		external: ['@emurgo/cardano-serialization-lib-nodejs']
	}
])
