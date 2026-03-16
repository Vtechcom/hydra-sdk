import type { Emitter } from 'mitt'
import type { HydraBridgeEvents } from '../types/hydra-connector.type'
import type { HydraPayload } from '../types/payload.type'

/**
 * Waits for a Hydra message that satisfies the predicate, then resolves or
 * rejects accordingly. Automatically unregisters the listener and clears the
 * timeout regardless of which outcome fires first — no manual cleanup needed.
 *
 * @param emitter      - The mitt event emitter to listen on
 * @param predicate    - Called on every onMessage event.
 *                       Return `{ resolve: T }` to resolve the promise,
 *                       `{ reject: unknown }` to reject it,
 *                       or `null` to keep waiting.
 * @param timeoutMs    - Auto-reject after this many milliseconds. Default 30 000.
 * @param timeoutError - Value passed to reject on timeout.
 */
export function awaitHydraMessage<T>(
	emitter: Emitter<HydraBridgeEvents>,
	predicate: (payload: HydraPayload) => { resolve: T } | { reject: unknown } | null,
	timeoutMs = 30_000,
	timeoutError: unknown = { reason: 'Timeout', tag: 'Timeout' }
): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		// Single cleanup point — every exit path goes through here.
		const cleanup = (outcome: () => void) => {
			clearTimeout(timer)
			emitter.off('onMessage', handler)
			outcome()
		}

		const handler = (payload: HydraPayload) => {
			const result = predicate(payload)
			if (result === null) return
			if ('resolve' in result) {
				cleanup(() => resolve(result.resolve))
			} else {
				cleanup(() => reject(result.reject))
			}
		}

		const timer = setTimeout(
			() => cleanup(() => reject(timeoutError)),
			timeoutMs
		)

		emitter.on('onMessage', handler)
	})
}
