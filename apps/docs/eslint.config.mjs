// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
	// Your custom configs here
	{
		plugins: {
			prettier: {}
		},

		rules: {
			'vue/multi-word-component-names': 'off', // Disable multi-word component name rule
			'@typescript-eslint/no-explicit-any': 'off', // Allow 'any' type
			'@typescript-eslint/no-unused-vars': 'warn', // Warn on unused variables
			'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off', // Warn on console logs in production
			'prettier/prettier': ['warn', { endOfLine: 'auto' }] // Prettier formatting settings
		}
	}
)
