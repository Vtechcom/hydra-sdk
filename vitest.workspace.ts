import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
	{
		extends: './vitest.config.ts'
	},
	{
		test: {
			include: ['packages/*/src/**/*.{test,spec}.ts'],
			name: 'packages',
			environment: 'node',
			globals: true
		}
	}
])
