import { defineConfig } from 'vite'

// vite.config.ts
export default defineConfig({
	optimizeDeps: {
		exclude: ['@emurgo/cardano-serialization-lib-browser']
	}
})
