// Default ports that should be omitted from the URL string (browsers and servers assume them)
const DEFAULT_PORTS: Record<string, string> = {
	'http': '80',
	'https': '443',
	'ws': '80',
	'wss': '443'
}

export function buildUrl({
	protocol = 'https',
	host,
	port,
	path = '',
	queryParams = {}
}: {
	protocol: 'http' | 'https' | 'ws' | 'wss'
	host: string
	port?: number | string
	path?: string
	queryParams?: Record<string, string>
}) {
	const url = new URL(`${protocol}://${host}`)

	// Only set port when it differs from the protocol default.
	// Avoids ugly URLs like https://host:443/path that can break proxies.
	if (port && String(port) !== DEFAULT_PORTS[protocol]) {
		url.port = String(port)
	}

	if (path) {
		url.pathname = path.startsWith('/') ? path : `/${path}`
	}

	Object.entries(queryParams).forEach(([key, value]) => {
		url.searchParams.append(key, value)
	})

	return url.toString()
}
