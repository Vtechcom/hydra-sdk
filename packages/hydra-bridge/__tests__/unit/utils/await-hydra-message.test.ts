import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import mitt, { Emitter } from 'mitt'
import { awaitHydraMessage } from '../../../src/utils/await-hydra-message'
import { HydraBridgeEvents } from '../../../src/types/hydra-connector.type'
import { HydraHeadTag, HydraPayload } from '../../../src/types/payload.type'

const makeEmitter = () => mitt<HydraBridgeEvents>()

const greetingsPayload = (overrides?: Partial<HydraPayload>): HydraPayload =>
	({
		tag: HydraHeadTag.Greetings,
		timestamp: new Date().toISOString(),
		me: { vkey: 'vkey' },
		headStatus: 'Open',
		hydraHeadId: 'head-id',
		snapshotUtxo: {},
		hydraNodeVersion: '1.3.0',
		...overrides
	}) as HydraPayload

describe('awaitHydraMessage', () => {
	let emitter: Emitter<HydraBridgeEvents>

	beforeEach(() => {
		vi.useFakeTimers()
		emitter = makeEmitter()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('resolves when predicate returns { resolve: value }', async () => {
		const promise = awaitHydraMessage<string>(
			emitter,
			(p) => (p.tag === HydraHeadTag.Greetings ? { resolve: 'ok' } : null),
			1000
		)

		emitter.emit('onMessage', greetingsPayload())

		await expect(promise).resolves.toBe('ok')
	})

	it('rejects when predicate returns { reject: reason }', async () => {
		const promise = awaitHydraMessage<string>(
			emitter,
			(p) => (p.tag === HydraHeadTag.Greetings ? { reject: new Error('bad') } : null),
			1000
		)

		emitter.emit('onMessage', greetingsPayload())

		await expect(promise).rejects.toThrow('bad')
	})

	it('rejects with timeoutError after timeoutMs', async () => {
		const promise = awaitHydraMessage<string>(
			emitter,
			() => null,
			500,
			new Error('timed out')
		)

		vi.advanceTimersByTime(500)

		await expect(promise).rejects.toThrow('timed out')
	})

	it('uses default timeout error object when no timeoutError is provided', async () => {
		const promise = awaitHydraMessage<string>(emitter, () => null, 100)

		vi.advanceTimersByTime(100)

		await expect(promise).rejects.toMatchObject({ reason: 'Timeout', tag: 'Timeout' })
	})

	it('ignores null returns and keeps waiting', async () => {
		const predicate = vi.fn()
			.mockReturnValueOnce(null)
			.mockReturnValueOnce(null)
			.mockReturnValueOnce({ resolve: 'third' })

		const promise = awaitHydraMessage<string>(emitter, predicate, 1000)

		emitter.emit('onMessage', greetingsPayload())
		emitter.emit('onMessage', greetingsPayload())
		emitter.emit('onMessage', greetingsPayload())

		await expect(promise).resolves.toBe('third')
		expect(predicate).toHaveBeenCalledTimes(3)
	})

	it('removes the listener after resolve (no ghost listener)', async () => {
		const promise = awaitHydraMessage<string>(
			emitter,
			(p) => (p.tag === HydraHeadTag.Greetings ? { resolve: 'done' } : null),
			1000
		)

		emitter.emit('onMessage', greetingsPayload())
		await promise

		// Listener must be gone — subsequent messages must not throw
		const handlers = emitter.all.get('onMessage') ?? []
		expect(handlers).toHaveLength(0)
	})

	it('removes the listener after reject (no ghost listener)', async () => {
		const promise = awaitHydraMessage<string>(
			emitter,
			(p) => (p.tag === HydraHeadTag.Greetings ? { reject: new Error('fail') } : null),
			1000
		)

		emitter.emit('onMessage', greetingsPayload())
		await promise.catch(() => {})

		const handlers = emitter.all.get('onMessage') ?? []
		expect(handlers).toHaveLength(0)
	})

	it('removes the listener after timeout (no ghost listener)', async () => {
		const promise = awaitHydraMessage<string>(emitter, () => null, 200, new Error('t/o'))

		vi.advanceTimersByTime(200)
		await promise.catch(() => {})

		const handlers = emitter.all.get('onMessage') ?? []
		expect(handlers).toHaveLength(0)
	})

	it('clears the timer after resolve (no dangling timeout)', async () => {
		const clearSpy = vi.spyOn(globalThis, 'clearTimeout')

		const promise = awaitHydraMessage<string>(
			emitter,
			(p) => (p.tag === HydraHeadTag.Greetings ? { resolve: 'x' } : null),
			5000
		)

		emitter.emit('onMessage', greetingsPayload())
		await promise

		expect(clearSpy).toHaveBeenCalled()
	})

	it('only settles once even if multiple matching messages arrive', async () => {
		const results: string[] = []

		const promise = awaitHydraMessage<string>(
			emitter,
			() => ({ resolve: 'match' }),
			1000
		).then((v) => results.push(v))

		emitter.emit('onMessage', greetingsPayload())
		emitter.emit('onMessage', greetingsPayload())
		emitter.emit('onMessage', greetingsPayload())

		await promise

		expect(results).toHaveLength(1)
	})

	it('supports multiple concurrent waiters on the same emitter', async () => {
		const p1 = awaitHydraMessage<string>(
			emitter,
			(p) => (p.tag === HydraHeadTag.Greetings ? { resolve: 'p1' } : null),
			1000
		)
		const p2 = awaitHydraMessage<string>(
			emitter,
			(p) => (p.tag === HydraHeadTag.TxValid ? { resolve: 'p2' } : null),
			1000
		)

		emitter.emit('onMessage', greetingsPayload())
		emitter.emit('onMessage', {
			tag: HydraHeadTag.TxValid,
			transactionId: 'tx-1',
			headId: 'head-1',
			seq: 1,
			timestamp: new Date().toISOString()
		} as HydraPayload)

		const [r1, r2] = await Promise.all([p1, p2])
		expect(r1).toBe('p1')
		expect(r2).toBe('p2')
	})
})
