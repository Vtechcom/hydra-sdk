import { describe, it, expect } from 'vitest'
import { parseUrl, ParsedUrl } from '../../../src/utils/url-parser'

describe('parseUrl', () => {
	describe('valid URLs', () => {
		it('should parse HTTP URL correctly', () => {
			const result = parseUrl('http://localhost:4001')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.protocol).toBe('http:')
				expect(result.host).toBe('localhost')
				expect(result.port).toBe('4001')
				expect(result.ssl).toBe(false)
			}
		})

		it('should parse HTTPS URL correctly', () => {
			const result = parseUrl('https://api.example.com')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.protocol).toBe('https:')
				expect(result.host).toBe('api.example.com')
				expect(result.port).toBe('443')
				expect(result.ssl).toBe(true)
			}
		})

		it('should parse WS URL correctly', () => {
			const result = parseUrl('ws://localhost:4001')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.protocol).toBe('ws:')
				expect(result.host).toBe('localhost')
				expect(result.port).toBe('4001')
				expect(result.ssl).toBe(false)
			}
		})

		it('should parse WSS URL correctly', () => {
			const result = parseUrl('wss://secure.example.com:443')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.protocol).toBe('wss:')
				expect(result.host).toBe('secure.example.com')
				expect(result.port).toBe('443')
				expect(result.ssl).toBe(true)
			}
		})

		it('should parse URL with path', () => {
			const result = parseUrl('https://api.example.com/v1/hydra')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.path).toBe('/v1/hydra')
			}
		})

		it('should parse URL with query parameters', () => {
			const result = parseUrl('http://localhost:4001?history=no&address=addr_test1')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.params).toEqual({
					history: 'no',
					address: 'addr_test1'
				})
			}
		})

		it('should default to port 80 for HTTP without port', () => {
			const result = parseUrl('http://example.com')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.port).toBe('80')
			}
		})

		it('should default to port 443 for HTTPS without port', () => {
			const result = parseUrl('https://example.com')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.port).toBe('443')
			}
		})

		it('should default to port 80 for WS without port', () => {
			const result = parseUrl('ws://example.com')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.port).toBe('80')
			}
		})

		it('should default to port 443 for WSS without port', () => {
			const result = parseUrl('wss://example.com')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.port).toBe('443')
			}
		})

		it('should parse URL with custom port', () => {
			const result = parseUrl('http://localhost:8080')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.port).toBe('8080')
			}
		})

		it('should handle empty path', () => {
			const result = parseUrl('http://localhost:4001')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.path).toBe('/')
			}
		})

		it('should handle URL with IP address', () => {
			const result = parseUrl('http://192.168.1.100:4001')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.host).toBe('192.168.1.100')
				expect(result.port).toBe('4001')
			}
		})

		it('should handle URL with subdomain', () => {
			const result = parseUrl('https://api.hydra.example.com')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.host).toBe('api.hydra.example.com')
			}
		})

		it('should handle multiple query parameters', () => {
			const result = parseUrl('http://localhost:4001?a=1&b=2&c=3')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.params).toEqual({
					a: '1',
					b: '2',
					c: '3'
				})
			}
		})
	})

	describe('URL without protocol (auto-add http://)', () => {
		it('should add http:// to URL without protocol', () => {
			const result = parseUrl('localhost:4001')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.protocol).toBe('http:')
				expect(result.host).toBe('localhost')
				expect(result.port).toBe('4001')
			}
		})

		it('should add http:// to domain without protocol', () => {
			const result = parseUrl('example.com')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.protocol).toBe('http:')
				expect(result.host).toBe('example.com')
				expect(result.port).toBe('80')
			}
		})

		it('should add http:// to IP address without protocol', () => {
			const result = parseUrl('192.168.1.100:8080')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.protocol).toBe('http:')
				expect(result.host).toBe('192.168.1.100')
				expect(result.port).toBe('8080')
			}
		})

		it('should handle URL without protocol but with path', () => {
			const result = parseUrl('localhost:4001/api/v1')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.protocol).toBe('http:')
				expect(result.host).toBe('localhost')
				expect(result.port).toBe('4001')
				expect(result.path).toBe('/api/v1')
			}
		})

		it('should handle URL without protocol but with query params', () => {
			const result = parseUrl('localhost:4001?key=value')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.protocol).toBe('http:')
				expect(result.host).toBe('localhost')
				expect(result.params).toEqual({ key: 'value' })
			}
		})
	})

	describe('whitespace handling', () => {
		it('should trim leading whitespace', () => {
			const result = parseUrl('  http://localhost:4001')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.host).toBe('localhost')
			}
		})

		it('should trim trailing whitespace', () => {
			const result = parseUrl('http://localhost:4001  ')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.host).toBe('localhost')
			}
		})

		it('should trim both leading and trailing whitespace', () => {
			const result = parseUrl('  http://localhost:4001  ')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.host).toBe('localhost')
			}
		})
	})

	describe('invalid URLs', () => {
		it('should return invalid for empty string', () => {
			const result = parseUrl('')

			expect(result.valid).toBe(false)
			expect((result as { valid: false; error?: string }).error).toBe('Empty URL')
		})

		it('should return invalid for whitespace-only string', () => {
			const result = parseUrl('   ')

			expect(result.valid).toBe(false)
			expect((result as { valid: false; error?: string }).error).toBe('Empty URL')
		})

		it('should return invalid for unsupported protocol', () => {
			const result = parseUrl('ftp://files.example.com')

			expect(result.valid).toBe(false)
			expect((result as { valid: false; error?: string }).error).toBe('Unsupported protocol: ftp:')
		})

		it('should return invalid for file protocol', () => {
			const result = parseUrl('file:///path/to/file')

			expect(result.valid).toBe(false)
			expect((result as { valid: false; error?: string }).error).toBe('Unsupported protocol: file:')
		})

		it('should return invalid for URL with only protocol', () => {
			const result = parseUrl('http://')

			expect(result.valid).toBe(false)
			expect((result as { valid: false; error?: string }).error).toBe('Invalid URL format')
		})

		it('should return invalid for URL with spaces in hostname', () => {
			const result = parseUrl('http://local host:4001')

			expect(result.valid).toBe(false)
			expect((result as { valid: false; error?: string }).error).toBe('Invalid URL format')
		})

		it('should return invalid for malformed URL', () => {
			const result = parseUrl('http://[invalid')

			expect(result.valid).toBe(false)
			expect((result as { valid: false; error?: string }).error).toBe('Invalid URL format')
		})
	})

	describe('edge cases', () => {
		it('should handle URL with trailing slash', () => {
			const result = parseUrl('http://localhost:4001/')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.path).toBe('/')
			}
		})

		it('should handle URL with hash fragment', () => {
			const result = parseUrl('http://localhost:4001/page#section')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.path).toBe('/page')
			}
		})

		it('should handle URL with encoded characters', () => {
			const result = parseUrl('http://localhost:4001/path%20with%20spaces')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.path).toBe('/path%20with%20spaces')
			}
		})

		it('should handle URL with username and password', () => {
			const result = parseUrl('http://user:pass@localhost:4001')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.host).toBe('localhost')
				expect(result.port).toBe('4001')
			}
		})

		it('should handle IPv6 address', () => {
			const result = parseUrl('http://[::1]:4001')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.host).toBe('[::1]')
				expect(result.port).toBe('4001')
			}
		})

		it('should handle very long URL', () => {
			const longPath = '/a'.repeat(1000)
			const result = parseUrl(`http://localhost:4001${longPath}`)

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.path).toBe(longPath)
			}
		})

		it('should handle URL with empty query parameter value', () => {
			const result = parseUrl('http://localhost:4001?key=')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.params).toEqual({ key: '' })
			}
		})

		it('should handle URL with special characters in query', () => {
			const result = parseUrl('http://localhost:4001?addr=addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer')

			expect(result.valid).toBe(true)
			if (result.valid) {
				expect(result.params.addr).toBe('addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer')
			}
		})
	})

	describe('ParsedUrl type', () => {
		it('should have correct type for valid URL', () => {
			const result: ParsedUrl = parseUrl('http://localhost:4001')

			expect(result.valid).toBe(true)
			if (result.valid) {
				// Type guard ensures these properties exist
				const _protocol: string = result.protocol
				const _host: string = result.host
				const _port: string = result.port
				const _path: string = result.path
				const _params: Record<string, string> = result.params
				const _ssl: boolean = result.ssl

				expect(_protocol).toBeDefined()
				expect(_host).toBeDefined()
				expect(_port).toBeDefined()
				expect(_path).toBeDefined()
				expect(_params).toBeDefined()
				expect(_ssl).toBeDefined()
			}
		})

		it('should have correct type for invalid URL', () => {
			const result: ParsedUrl = parseUrl('')

			expect(result.valid).toBe(false)
			const invalidResult = result as { valid: false; error?: string }
			expect(invalidResult.error).toBeDefined()
		})
	})
})
