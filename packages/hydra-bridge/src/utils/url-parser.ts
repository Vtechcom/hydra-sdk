export function parseUrl(input: string) {
	try {
		const url = new URL(input)

		// Xác định SSL với https hoặc wss
		const sslProtocols = ['https:', 'wss:']

		return {
			valid: true,
			protocol: url.protocol, // http:, https:, ws:, wss:
			host: url.hostname,
			port: url.port || (url.protocol === 'https:' || url.protocol === 'wss:' ? '443' : '80'),
			path: url.pathname,
			params: Object.fromEntries(url.searchParams.entries()),
			ssl: sslProtocols.includes(url.protocol)
		}
	} catch {
		return { valid: false }
	}
}
