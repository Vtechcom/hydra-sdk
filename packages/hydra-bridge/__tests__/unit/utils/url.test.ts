import { describe, it, expect } from 'vitest'
import { parseUrl } from '../../../src/utils/url-parser'
import { buildUrl } from '../../../src/utils/url-builder'

const GATEWAY_PATH = '/head/010d3f2c-0c7b-4b41-af73-20618f11622c'
const API_KEY = 'proj_54446da5307a4a01aa8e738e49ba8f79'

describe('parseUrl', () => {
	it.each([
		['http://localhost:4001', 'http:', 'localhost', '4001', '/', {}, false],
		['https://api.example.com', 'https:', 'api.example.com', '443', '/', {}, true],
		['ws://localhost', 'ws:', 'localhost', '80', '/', {}, false],
		['wss://secure.example.com', 'wss:', 'secure.example.com', '443', '/', {}, true],
		[
			`wss://gw.example.com${GATEWAY_PATH}?X-Api-Key=${API_KEY}`,
			'wss:',
			'gw.example.com',
			'443',
			GATEWAY_PATH,
			{ 'X-Api-Key': API_KEY },
			true
		],
		['http://localhost:4001?a=1&b=&c=x%3Dy', 'http:', 'localhost', '4001', '/', { a: '1', b: '', c: 'x=y' }, false],
		// no scheme → http
		['localhost:4001/api', 'http:', 'localhost', '4001', '/api', {}, false],
		['192.168.1.1:4001', 'http:', '192.168.1.1', '4001', '/', {}, false],
		['  http://localhost:4001  ', 'http:', 'localhost', '4001', '/', {}, false],
		['http://[::1]:4001', 'http:', '[::1]', '4001', '/', {}, false],
		['http://user:pass@localhost:4001/page#section', 'http:', 'localhost', '4001', '/page', {}, false],
		['http://localhost:4001/path%20with%20spaces', 'http:', 'localhost', '4001', '/path%20with%20spaces', {}, false]
	])('%s', (input, protocol, host, port, path, params, ssl) => {
		expect(parseUrl(input)).toEqual({ valid: true, protocol, host, port, path, params, ssl })
	})

	it.each([
		['', 'Empty URL'],
		['   ', 'Empty URL'],
		['ftp://example.com', 'Unsupported protocol: ftp:'],
		['file:///etc/passwd', 'Unsupported protocol: file:'],
		['http://', 'Invalid URL format'],
		['http://local host:4001', 'Invalid URL format'],
		['http://[invalid', 'Invalid URL format']
	])('rejects %j: %s', (input, error) => {
		expect(parseUrl(input)).toEqual({ valid: false, error })
	})
})

describe('buildUrl', () => {
	it.each([
		[{ protocol: 'http', host: 'localhost' }, 'http://localhost/'],
		[{ protocol: 'ws', host: 'localhost', port: 4001 }, 'ws://localhost:4001/'],
		[{ protocol: 'https', host: 'api.example.com', port: '8443' }, 'https://api.example.com:8443/'],
		// default ports are dropped
		[{ protocol: 'http', host: 'example.com', port: '80' }, 'http://example.com/'],
		[{ protocol: 'https', host: 'example.com', port: 443 }, 'https://example.com/'],
		[{ protocol: 'ws', host: 'example.com', port: '80' }, 'ws://example.com/'],
		[{ protocol: 'wss', host: 'example.com', port: '443' }, 'wss://example.com/'],
		// ws on 443 is not a default port
		[{ protocol: 'ws', host: 'example.com', port: '443' }, 'ws://example.com:443/'],
		[{ protocol: 'https', host: 'api.hexcore.dev', path: 'hydra/v1' }, 'https://api.hexcore.dev/hydra/v1'],
		[{ protocol: 'https', host: 'api.hexcore.dev', path: '/hydra' }, 'https://api.hexcore.dev/hydra'],
		[
			{ protocol: 'ws', host: 'localhost', port: 4001, queryParams: { history: 'no', address: 'addr=1' } },
			'ws://localhost:4001/?history=no&address=addr%3D1'
		],
		[
			{ protocol: 'wss', host: 'gw.example.com', port: '443', path: GATEWAY_PATH, queryParams: { 'X-Api-Key': API_KEY } },
			`wss://gw.example.com${GATEWAY_PATH}?X-Api-Key=${API_KEY}`
		]
	] as const)('%j → %s', (input, expected) => {
		expect(buildUrl(input)).toBe(expected)
	})
})

describe('parseUrl → buildUrl round trip', () => {
	it.each([
		'http://localhost:4001/',
		'https://api.example.com/',
		'ws://127.0.0.1:4001/?history=yes&snapshot-utxo=no',
		`wss://gw.example.com${GATEWAY_PATH}?X-Api-Key=${API_KEY}`,
		'http://[::1]:8080/a/b?k=v%26w'
	])('%s', url => {
		const parsed = parseUrl(url)
		if (!parsed.valid) throw new Error(`expected ${url} to parse`)

		const rebuilt = buildUrl({
			protocol: parsed.protocol.replace(':', '') as 'http' | 'https' | 'ws' | 'wss',
			host: parsed.host,
			port: parsed.port,
			path: parsed.path,
			queryParams: parsed.params
		})

		expect(rebuilt).toBe(url)
	})
})
