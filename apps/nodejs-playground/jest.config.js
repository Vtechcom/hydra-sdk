module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
	verbose: true,
	collectCoverage: true,
	collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
	transform: {
		'^.+\\.(ts|tsx)$': [
			'ts-jest',
			{
				tsconfig: {
					resolveJsonModule: true
				}
			}
		]
	},
	reporters: [
		'default',
		[
			'jest-junit',
			{
				outputDirectory: '.',
				outputName: 'junit.xml',
				classNameTemplate: '{classname}',
				titleTemplate: '{title}',
				ancestorSeparator: ' › ',
				usePathForSuiteName: true
			}
		]
	]
}
