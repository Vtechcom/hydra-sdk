import { describe, it, expect, afterEach, vi } from 'vitest'
import { createGameAuth, type GameAuthEndpoints } from '../../src/auth'
import { WalletBridgeClient } from '../../src/client'
import { DualStorage } from '../../src/storage'
import { WalletBridgeUserRejectedError } from '../../src/errors'
import { connectMockHost, jwt } from '../helpers/fake-window'

const ADDRESS = 'addr_test1qz2fxv2um5tjaq62synchronized'
const VALID = jwt({ sub: 'user_1', exp: Math.floor(Date.now() / 1000) + 3600 })
const EXPIRED = jwt({ sub: 'user_1', exp: 1700000000 }) // Nov 2023

let client: WalletBridgeClient | undefined

afterEach(() => {
	client?.destroy()
	client = undefined
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

const endpoints = (overrides: Partial<GameAuthEndpoints> = {}): GameAuthEndpoints => ({
	getChallenge: vi.fn().mockResolvedValue('challenge-123'),
	verifySignature: vi.fn().mockResolvedValue({ token: VALID, user: { id: 'user_1' } }),
	...overrides
})

/** A real client talking to a real MockBridgeHost through the fake iframe boundary. */
const hostedClient = (hostOptions = {}) => {
	const pair = connectMockHost({ address: ADDRESS, ...hostOptions })
	client = new WalletBridgeClient({ autoProbe: false })
	return { ...pair, client }
}

/** Client double for the branches a MockBridgeHost cannot produce (null results). */
const stubClient = (overrides: Record<string, unknown> = {}) =>
	({
		currentAddress: ADDRESS,
		storage: new DualStorage(false),
		getChangeAddress: vi.fn().mockResolvedValue(null),
		requestConnect: vi.fn().mockResolvedValue(null),
		signData: vi.fn().mockResolvedValue({ signature: 'sig', key: 'key' }),
		on: vi.fn(),
		off: vi.fn(),
		...overrides
	}) as unknown as WalletBridgeClient

const signRequests = (toParent: { data: any }[]) =>
	toParent.filter(p => p.data.type === 'WALLET_SIGN_DATA').map(p => p.data)

describe('GameAuthManager.login — through a MockBridgeHost', () => {
	it('signs the hex-encoded challenge, verifies it, and stores the token locally and on the host', async () => {
		const { client, toParent } = hostedClient()
		const api = endpoints()
		const auth = createGameAuth({ client, endpoints: api, tokenStorageKey: 'game_token' })
		const changes: unknown[] = []
		auth.onAuthChange((ok, token) => changes.push([ok, token]))

		const res = await auth.login()

		expect(api.getChallenge).toHaveBeenCalledWith(ADDRESS)
		// 'challenge-123' as UTF-8 hex — CIP-30 signData takes a hex payload.
		expect(signRequests(toParent)).toEqual([
			{
				type: 'WALLET_SIGN_DATA',
				address: ADDRESS,
				hexPayload: '6368616c6c656e67652d313233',
				requestId: expect.any(String)
			}
		])
		expect(api.verifySignature).toHaveBeenCalledWith({
			address: ADDRESS,
			signature: expect.stringMatching(/^mock_cbor_signature_/),
			key: 'mock_cbor_public_key'
		})
		expect(res).toEqual({ token: VALID, user: { id: 'user_1' }, address: ADDRESS })
		expect(auth.getToken()).toBe(VALID)
		expect(auth.isAuthenticated()).toBe(true)
		await expect(client.hostStorageGet('hydra:game_token')).resolves.toBe(VALID)
		expect(changes).toEqual([[true, VALID]])
	})

	it('passes an already-hex challenge through without double encoding', async () => {
		const { client, toParent } = hostedClient()
		await createGameAuth({
			client,
			endpoints: endpoints({ getChallenge: vi.fn().mockResolvedValue('0x616263') })
		}).login()
		expect(signRequests(toParent)[0].hexPayload).toBe('616263')
	})

	it('falls back to requestConnect when the host reports no address', async () => {
		const { client, host, toParent } = hostedClient()
		host.address = ''
		await expect(createGameAuth({ client, endpoints: endpoints() }).login()).rejects.toThrow(
			/\[GameAuth\] Không tìm thấy địa chỉ ví đang kết nối để đăng nhập/
		)
		expect(toParent.map(p => p.data.type)).toEqual(['WALLET_GET_ADDRESS', 'WALLET_CONNECT'])
	})

	it('propagates a user rejection from the host and stores nothing', async () => {
		const { client } = hostedClient({ autoApprove: false })
		const auth = createGameAuth({ client, endpoints: endpoints() })
		const pending = auth.login()
		await expect(pending).rejects.toBeInstanceOf(WalletBridgeUserRejectedError)
		await expect(pending).rejects.toThrow(/User declined or cancelled the transaction/)
		expect(auth.getToken()).toBeNull()
	})
})

describe('GameAuthManager.login — error branches', () => {
	it.each([
		{
			name: 'no address from currentAddress, getChangeAddress or requestConnect',
			client: () => stubClient({ currentAddress: null }),
			api: endpoints(),
			error: /Không tìm thấy địa chỉ ví đang kết nối/
		},
		{
			name: 'an empty challenge',
			client: () => stubClient(),
			api: endpoints({ getChallenge: vi.fn().mockResolvedValue('') }),
			error: /Lấy challenge từ backend thất bại/
		},
		{
			name: 'signData resolving null',
			client: () => stubClient({ signData: vi.fn().mockResolvedValue(null) }),
			api: endpoints(),
			error: /Ký challenge thất bại hoặc bị người dùng từ chối/
		},
		{
			name: 'verifySignature without a token',
			client: () => stubClient(),
			api: endpoints({ verifySignature: vi.fn().mockResolvedValue({ user: { id: 'x' } }) }),
			error: /Xác thực chữ ký với backend thất bại/
		}
	])('rejects on $name, stores nothing and emits no auth change', async ({ client, api, error }) => {
		const c = client()
		const auth = createGameAuth({ client: c, endpoints: api })
		const listener = vi.fn()
		auth.onAuthChange(listener)
		await expect(auth.login()).rejects.toThrow(error)
		expect(c.storage.getItem('game_access_token')).toBeNull()
		expect(listener).not.toHaveBeenCalled()
	})
})

describe('GameAuthManager — JWT expiry', () => {
	it('an expired stored token reads as null, and is logged out on the next microtask', async () => {
		const c = stubClient()
		c.storage.setItem('game_access_token', EXPIRED)
		const auth = createGameAuth({ client: c, endpoints: endpoints() })
		const listener = vi.fn()
		auth.onAuthChange(listener)

		expect(auth.getToken()).toBeNull()
		expect(auth.isAuthenticated()).toBe(false)
		expect(auth.isAuthenticated(false)).toBe(true) // expiry check skipped: the token is still there
		await Promise.resolve()
		expect(c.storage.getItem('game_access_token')).toBeNull()
		expect(listener).toHaveBeenCalledWith(false, null)
	})

	it('does not log out a token that was replaced before the microtask ran', async () => {
		const c = stubClient()
		c.storage.setItem('game_access_token', EXPIRED)
		const auth = createGameAuth({ client: c, endpoints: endpoints() })
		expect(auth.getToken()).toBeNull()
		c.storage.setItem('game_access_token', VALID)
		await Promise.resolve()
		expect(auth.getToken()).toBe(VALID)
	})

	it('with checkJwtExpiry: false, an expired token is returned as-is', () => {
		const c = stubClient()
		c.storage.setItem('game_access_token', EXPIRED)
		const auth = createGameAuth({ client: c, endpoints: endpoints(), checkJwtExpiry: false })
		expect(auth.getToken()).toBe(EXPIRED)
		expect(auth.isAuthenticated()).toBe(true)
	})

	it('getTokenAsync falls back to the host relay and rejects an expired relayed token', async () => {
		const { client } = hostedClient()
		const auth = createGameAuth({ client, endpoints: endpoints() })

		await client.hostStorageSet('hydra:game_access_token', VALID)
		await expect(auth.getTokenAsync()).resolves.toBe(VALID)
		expect(auth.getToken()).toBe(VALID) // cached locally after the relay read

		client.storage.removeItem('game_access_token')
		await client.hostStorageSet('hydra:game_access_token', EXPIRED)
		await expect(auth.getTokenAsync()).resolves.toBeNull()
	})

	it('getJwtPayload decodes the current token, or null when there is none', () => {
		const c = stubClient()
		const auth = createGameAuth({ client: c, endpoints: endpoints() })
		expect(auth.getJwtPayload()).toBeNull()
		c.storage.setItem('game_access_token', VALID)
		expect(auth.getJwtPayload()).toMatchObject({ sub: 'user_1' })
	})
})

describe('GameAuthManager — logout on wallet events', () => {
	it.each([
		{ event: 'accountChanged', trigger: (host: any) => host.switchAccount('addr_test1_other') },
		{ event: 'disconnected', trigger: (host: any) => host.disconnect() }
	])('$event clears the token and notifies listeners', async ({ trigger }) => {
		const { client, host } = hostedClient()
		const auth = createGameAuth({ client, endpoints: endpoints() })
		await auth.login()
		const listener = vi.fn()
		auth.onAuthChange(listener)

		trigger(host)

		expect(auth.getToken()).toBeNull()
		expect(listener).toHaveBeenCalledWith(false, null)
	})

	it('keeps the token when autoResetOnAccountChange is false', async () => {
		const { client, host } = hostedClient()
		const auth = createGameAuth({ client, endpoints: endpoints(), autoResetOnAccountChange: false })
		await auth.login()
		host.switchAccount('addr_test1_other')
		expect(auth.getToken()).toBe(VALID)
	})

	it('after destroy(), wallet events no longer touch the token and listeners are dropped', async () => {
		const { client, host } = hostedClient()
		const auth = createGameAuth({ client, endpoints: endpoints() })
		await auth.login()
		const listener = vi.fn()
		auth.onAuthChange(listener)
		auth.destroy()
		host.disconnect()
		expect(auth.getToken()).toBe(VALID)
		auth.logout()
		expect(listener).not.toHaveBeenCalled()
	})
})

describe('GameAuthManager — listeners', () => {
	it('logout without a token notifies nobody', () => {
		const auth = createGameAuth({ client: stubClient(), endpoints: endpoints() })
		const listener = vi.fn()
		auth.onAuthChange(listener)
		auth.logout()
		expect(listener).not.toHaveBeenCalled()
	})

	it('a throwing listener is logged and does not stop the others; unsubscribe works', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {})
		const auth = createGameAuth({ client: stubClient(), endpoints: endpoints() })
		const after = vi.fn()
		const removed = vi.fn()
		auth.onAuthChange(() => {
			throw new Error('ui crashed')
		})
		auth.onAuthChange(after)
		auth.onAuthChange(removed)()

		await auth.login()
		expect(after).toHaveBeenCalledWith(true, VALID)
		expect(removed).not.toHaveBeenCalled()
		expect(error).toHaveBeenCalledWith(
			'[GameAuth] Lỗi trong auth listener:',
			expect.objectContaining({ message: 'ui crashed' })
		)
	})
})
