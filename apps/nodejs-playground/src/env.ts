import * as dotenv from 'dotenv'
dotenv.config()

// Utility function to get environment variables with a default value

export const getEnvVar = (key: string, defaultValue?: string): string => {
	const value = process.env[key] || defaultValue
	if (!value) {
		throw new Error(`Environment variable ${key} is not set`)
	}
	return value
}
