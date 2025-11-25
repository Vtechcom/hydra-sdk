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

	if (port) {
		url.port = `${port}`
	}

	if (path) {
		url.pathname = path.startsWith('/') ? path : `/${path}`
	}

	Object.entries(queryParams).forEach(([key, value]) => {
		url.searchParams.append(key, value)
	})

	return url.toString()
}
