// Supported protocols for Hydra SDK
const SUPPORTED_PROTOCOLS = ['http:', 'https:', 'ws:', 'wss:']
const SSL_PROTOCOLS = ['https:', 'wss:']
const DEFAULT_PORTS: Record<string, string> = {
	'http:': '80',
	'https:': '443',
	'ws:': '80',
	'wss:': '443'
}

export type ParsedUrl =
	| {
			valid: true
			protocol: string
			host: string
			port: string
			path: string
			params: Record<string, string>
			ssl: boolean
	  }
	| {
			valid: false
			error?: string
	  }

export function parseUrl(input: string): ParsedUrl {
	// Handle empty or whitespace-only input
	if (!input || !input.trim()) {
		return { valid: false, error: 'Empty URL' }
	}

	const trimmedInput = input.trim()

	// Check for URLs without protocol - add default http://
	let urlString = trimmedInput
	if (!trimmedInput.includes('://')) {
		// If no protocol, assume http
		urlString = `http://${trimmedInput}`
	}

	try {
		const url = new URL(urlString)

		// Validate protocol is supported
		if (!SUPPORTED_PROTOCOLS.includes(url.protocol)) {
			return { valid: false, error: `Unsupported protocol: ${url.protocol}` }
		}

		// Validate hostname exists
		if (!url.hostname) {
			return { valid: false, error: 'Missing hostname' }
		}

		// Get default port based on protocol
		const defaultPort = DEFAULT_PORTS[url.protocol] || '80'

		return {
			valid: true,
			protocol: url.protocol,
			host: url.hostname,
			port: url.port || defaultPort,
			path: url.pathname,
			params: Object.fromEntries(url.searchParams.entries()),
			ssl: SSL_PROTOCOLS.includes(url.protocol)
		}
	} catch {
		return { valid: false, error: 'Invalid URL format' }
	}
}
