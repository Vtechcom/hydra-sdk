import { defineConfig } from 'tsup'

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		vue: 'src/vue.ts',
		auth: 'src/auth.ts',
		storage: 'src/storage.ts',
		lifecycle: 'src/lifecycle.ts',
		simulator: 'src/simulator/index.ts'
	},
	format: ['esm', 'cjs'],
	dts: true,
	// Bật splitting để các subpath (vue, auth, ...) dùng chung chunk runtime: nếu mỗi entry
	// bundle riêng thì class lỗi bị nhân bản và `instanceof` giữa các subpath luôn false.
	splitting: true,
	sourcemap: true,
	clean: true,
	target: 'es2020',
	outDir: 'dist',
	shims: false,
	skipNodeModulesBundle: true,
	external: ['vue']
})
