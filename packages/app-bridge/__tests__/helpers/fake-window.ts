import { vi } from 'vitest'
import { MockBridgeHost, type MockBridgeHostOptions } from '../../src/simulator/host'

type Listener = (event: { data: unknown; origin: string; source: unknown }) => void

export const HOST_ORIGIN = 'https://host.example'
export const GAME_ORIGIN = 'https://game.example'

/** A message one window posted: payload plus the targetOrigin it was posted with. */
export interface Posted<T = any> {
	data: T
	targetOrigin: string
}

/** Minimal `window` with a working `message` event bus. */
const fakeWindow = () => {
	const listeners: Listener[] = []
	const win: any = {
		addEventListener: (type: string, handler: Listener) => {
			if (type === 'message') listeners.push(handler)
		},
		removeEventListener: (type: string, handler: Listener) => {
			const i = listeners.indexOf(handler)
			if (type === 'message' && i >= 0) listeners.splice(i, 1)
		}
	}
	return { win, listeners }
}

/**
 * Stub the global `window` as a game iframe whose parent records every
 * postMessage. `deliver` simulates the parent (or anyone else) posting into the
 * iframe; by default the message comes from the parent at {@link HOST_ORIGIN}.
 */
export const installIframe = () => {
	const frame = fakeWindow()
	const toParent: Posted[] = []
	const parent = {
		postMessage: (data: unknown, targetOrigin: string) => {
			toParent.push({ data, targetOrigin })
		}
	}
	frame.win.parent = parent
	vi.stubGlobal('window', frame.win)

	const deliver = (data: unknown, { origin = HOST_ORIGIN, source = parent as unknown } = {}) => {
		for (const l of [...frame.listeners]) l({ data, origin, source })
	}
	/** Answer the last request of `requestType` with `{ type, requestId, result, error }`. */
	const reply = (requestType: string, response: { type: string; result?: unknown; error?: string }, origin?: string) => {
		const request = [...toParent].reverse().find(p => (p.data as any).type === requestType)
		if (!request) throw new Error(`no ${requestType} request was posted`)
		deliver({ result: null, ...response, requestId: (request.data as any).requestId }, { origin })
	}
	return { window: frame.win, parent, toParent, listeners: frame.listeners, deliver, reply }
}

/** Stub the global `window` as a top-level page (`window.parent === window`). */
export const installTopWindow = (extra: Record<string, unknown> = {}) => {
	const top = fakeWindow()
	top.win.parent = top.win
	top.win.location = { origin: GAME_ORIGIN }
	Object.assign(top.win, extra)
	vi.stubGlobal('window', top.win)
	return top.win
}

/**
 * Wire a game iframe to a real {@link MockBridgeHost} running in its parent.
 * Both windows get their own message bus; the global `window` is the iframe, so
 * a `WalletBridgeClient` created afterwards talks to the host for real.
 * `toParent` / `toIframe` record every message crossing the boundary.
 */
export const connectMockHost = (options: MockBridgeHostOptions = {}) => {
	const frame = fakeWindow()
	const parentBus = fakeWindow()
	const toParent: Posted[] = []
	const toIframe: Posted[] = []

	parentBus.win.postMessage = (data: unknown, targetOrigin: string) => {
		toParent.push({ data, targetOrigin })
		for (const l of [...parentBus.listeners]) l({ data, origin: GAME_ORIGIN, source: frame.win })
	}
	frame.win.parent = parentBus.win
	frame.win.postMessage = (data: unknown, targetOrigin: string) => {
		toIframe.push({ data, targetOrigin })
		for (const l of [...frame.listeners]) l({ data, origin: HOST_ORIGIN, source: parentBus.win })
	}

	// MockBridgeHost.start()/stop() bind to the global window — the parent's here.
	const asParent = <T>(fn: () => T): T => {
		vi.stubGlobal('window', parentBus.win)
		try {
			return fn()
		} finally {
			vi.stubGlobal('window', frame.win)
		}
	}
	const host = new MockBridgeHost({ latencyMs: 0, targetWindow: frame.win, ...options })
	asParent(() => host.start())

	return {
		host,
		toParent,
		toIframe,
		parentListeners: parentBus.listeners,
		stopHost: () => asParent(() => host.stop())
	}
}

/** Let MockBridgeHost's `setTimeout(…, latencyMs)` replies land. */
export const flushHost = () => new Promise(resolve => setTimeout(resolve, 0))

/** Unsigned JWT with the given payload (signature is never checked client-side). */
export const jwt = (payload: Record<string, unknown>) =>
	`eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.sig`
