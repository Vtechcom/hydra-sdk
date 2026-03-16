import { describe, it, expect } from 'vitest'
import { buildUrl } from '../../../src/utils/url-builder'

describe('buildUrl', () => {
	describe('basic URL building', () => {
		it('should build HTTP URL with host', () => {
			const url = buildUrl({
				protocol: 'http',
				host: 'localhost'
			})

			expect(url).toBe('http://localhost/')
		})

		it('should build HTTPS URL with host', () => {
			const url = buildUrl({
				protocol: 'https',
				host: 'api.example.com'
			})

			expect(url).toBe('https://api.example.com/')
		})

		it('should build WS URL with host', () => {
			const url = buildUrl({
				protocol: 'ws',
				host: 'localhost'
			})

			expect(url).toBe('ws://localhost/')
		})

		it('should build WSS URL with host', () => {
			const url = buildUrl({
				protocol: 'wss',
				host: 'secure.example.com'
			})

			expect(url).toBe('wss://secure.example.com/')
		})
	})

	describe('with port', () => {
		it('should include port number', () => {
			const url = buildUrl({
				protocol: 'http',
				host: 'localhost',
				port: 4001
			})

			expect(url).toBe('http://localhost:4001/')
		})

		it('should include port as string', () => {
			const url = buildUrl({
				protocol: 'http',
				host: 'localhost',
				port: '8080'
			})

			expect(url).toBe('http://localhost:8080/')
		})

		it('should handle standard HTTPS port', () => {
			const url = buildUrl({
				protocol: 'https',
				host: 'api.example.com',
				port: 443
			})

			expect(url).toContain('https://api.example.com')
		})
	})

	describe('with path', () => {
		it('should include path with leading slash', () => {
			const url = buildUrl({
				protocol: 'https',
				host: 'api.example.com',
				path: '/v1/hydra'
			})

			expect(url).toBe('https://api.example.com/v1/hydra')
		})

		it('should add leading slash if missing', () => {
			const url = buildUrl({
				protocol: 'https',
				host: 'api.example.com',
				path: 'v1/hydra'
			})

			expect(url).toBe('https://api.example.com/v1/hydra')
		})

		it('should handle empty path', () => {
			const url = buildUrl({
				protocol: 'http',
				host: 'localhost',
				path: ''
			})

			expect(url).toBe('http://localhost/')
		})

		it('should handle nested paths', () => {
			const url = buildUrl({
				protocol: 'https',
				host: 'api.example.com',
				path: '/api/v1/hydra/head'
			})

			expect(url).toBe('https://api.example.com/api/v1/hydra/head')
		})
	})

	describe('with query parameters', () => {
		it('should include single query parameter', () => {
			const url = buildUrl({
				protocol: 'http',
				host: 'localhost',
				port: 4001,
				queryParams: {
					history: 'no'
				}
			})

			expect(url).toContain('history=no')
		})

		it('should include multiple query parameters', () => {
			const url = buildUrl({
				protocol: 'http',
				host: 'localhost',
				port: 4001,
				queryParams: {
					history: 'no',
					'snapshot-utxo': 'no',
					address: 'addr_test1'
				}
			})

			expect(url).toContain('history=no')
			expect(url).toContain('snapshot-utxo=no')
			expect(url).toContain('address=addr_test1')
		})

		it('should handle empty query parameters', () => {
			const url = buildUrl({
				protocol: 'http',
				host: 'localhost',
				queryParams: {}
			})

			expect(url).toBe('http://localhost/')
		})

		it('should encode special characters in query parameters', () => {
			const url = buildUrl({
				protocol: 'http',
				host: 'localhost',
				queryParams: {
					address: 'addr_test1qz123=abc'
				}
			})

			expect(url).toContain('address=addr_test1qz123')
		})
	})

	describe('full URL construction', () => {
		it('should build complete URL with all components', () => {
			const url = buildUrl({
				protocol: 'wss',
				host: 'api.hydra.example.com',
				port: 4001,
				path: '/hydra',
				queryParams: {
					history: 'no',
					'snapshot-utxo': 'no'
				}
			})

			expect(url).toContain('wss://')
			expect(url).toContain('api.hydra.example.com')
			expect(url).toContain(':4001')
			expect(url).toContain('/hydra')
			expect(url).toContain('history=no')
			expect(url).toContain('snapshot-utxo=no')
		})

		it('should build URL for WebSocket connector', () => {
			const url = buildUrl({
				protocol: 'ws',
				host: 'localhost',
				port: 4001,
				queryParams: {
					history: 'no'
				}
			})

			expect(url).toMatch(/^ws:\/\/localhost:4001\/\?history=no$/)
		})

		it('should build URL for Hexcore connector', () => {
			const url = buildUrl({
				protocol: 'https',
				host: 'api.hexcore.dev',
				path: '/hydra'
			})

			expect(url).toBe('https://api.hexcore.dev/hydra')
		})
	})

	describe('default port stripping', () => {
		it('should omit port 80 for http', () => {
			const url = buildUrl({ protocol: 'http', host: 'example.com', port: '80' })
			expect(url).toBe('http://example.com/')
		})

		it('should omit port 443 for https', () => {
			const url = buildUrl({ protocol: 'https', host: 'api.example.com', port: '443' })
			expect(url).toBe('https://api.example.com/')
		})

		it('should omit port 80 for ws', () => {
			const url = buildUrl({ protocol: 'ws', host: 'localhost', port: '80' })
			expect(url).toBe('ws://localhost/')
		})

		it('should omit port 443 for wss', () => {
			const url = buildUrl({ protocol: 'wss', host: 'secure.example.com', port: '443' })
			expect(url).toBe('wss://secure.example.com/')
		})

		it('should keep non-default port for https', () => {
			const url = buildUrl({ protocol: 'https', host: 'api.example.com', port: '8443' })
			expect(url).toBe('https://api.example.com:8443/')
		})

		it('should build correct httpUrl from gateway URL with path and api-key', () => {
			// Simulates: https://dev-kong.hydrahub.io.vn/head/010d3f2c-...?X-Api-Key=proj_...
			const url = buildUrl({
				protocol: 'https',
				host: 'dev-kong.hydrahub.io.vn',
				port: '443',
				path: '/head/010d3f2c-0c7b-4b41-af73-20618f11622c'
			})
			expect(url).toBe('https://dev-kong.hydrahub.io.vn/head/010d3f2c-0c7b-4b41-af73-20618f11622c')
		})

		it('should build correct wsUrl from gateway URL with path and api-key', () => {
			const url = buildUrl({
				protocol: 'wss',
				host: 'dev-kong.hydrahub.io.vn',
				port: '443',
				path: '/head/010d3f2c-0c7b-4b41-af73-20618f11622c',
				queryParams: { 'X-Api-Key': 'proj_54446da5307a4a01aa8e738e49ba8f79' }
			})
			expect(url).toBe(
				'wss://dev-kong.hydrahub.io.vn/head/010d3f2c-0c7b-4b41-af73-20618f11622c?X-Api-Key=proj_54446da5307a4a01aa8e738e49ba8f79'
			)
		})
	})

	describe('edge cases', () => {
		it('should handle IP address as host', () => {
			const url = buildUrl({
				protocol: 'http',
				host: '192.168.1.100',
				port: 4001
			})

			expect(url).toBe('http://192.168.1.100:4001/')
		})

		it('should handle localhost', () => {
			const url = buildUrl({
				protocol: 'http',
				host: 'localhost'
			})

			expect(url).toBe('http://localhost/')
		})

		it('should handle subdomain', () => {
			const url = buildUrl({
				protocol: 'https',
				host: 'api.v1.hydra.example.com'
			})

			expect(url).toBe('https://api.v1.hydra.example.com/')
		})
	})
})
