import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import mitt, { Emitter } from 'mitt'
import { awaitHydraMessage } from '../../../src/utils/await-hydra-message'
import { HydraBridgeEvents } from '../../../src/types/hydra-connector.type'
import { HydraHeadTag, HydraPayload } from '../../../src/types/payload.type'
import { greetings } from '../../helpers/fixtures'

const txValid = { tag: HydraHeadTag.TxValid, transactionId: 'tx-1', seq: 1, timestamp: '' } as HydraPayload
const isGreetings = (p: HydraPayload) => p.tag === HydraHeadTag.Greetings

describe('awaitHydraMessage', () => {
	let emitter: Emitter<HydraBridgeEvents>
	const listeners = () => emitter.all.get('onMessage')?.length ?? 0

	beforeEach(() => {
		vi.useFakeTimers()
		emitter = mitt<HydraBridgeEvents>()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('resolves with the predicate value and cleans up listener and timer', async () => {
		const p = awaitHydraMessage<string>(emitter, m => (isGreetings(m) ? { resolve: 'ok' } : null), 1000)
		expect(listeners()).toBe(1)
		expect(vi.getTimerCount()).toBe(1)

		emitter.emit('onMessage', txValid)
		emitter.emit('onMessage', greetings())

		await expect(p).resolves.toBe('ok')
		expect(listeners()).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
	})

	it('rejects with the predicate reason and cleans up listener and timer', async () => {
		const p = awaitHydraMessage(emitter, m => (isGreetings(m) ? { reject: new Error('bad') } : null), 1000)

		emitter.emit('onMessage', greetings())

		await expect(p).rejects.toThrow(/bad/)
		expect(listeners()).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
	})

	it('rejects with timeoutError exactly at timeoutMs and stops listening', async () => {
		const predicate = vi.fn(() => null)
		let error: unknown
		awaitHydraMessage(emitter, predicate, 500, new Error('timed out')).catch(e => (error = e))

		await vi.advanceTimersByTimeAsync(499)
		expect(error).toBeUndefined()
		await vi.advanceTimersByTimeAsync(1)

		expect(error).toEqual(new Error('timed out'))
		expect(listeners()).toBe(0)
		emitter.emit('onMessage', greetings())
		expect(predicate).not.toHaveBeenCalled()
	})

	it('defaults to a 30s timeout with a { reason, tag } error', async () => {
		let error: unknown
		awaitHydraMessage(emitter, () => null).catch(e => (error = e))

		await vi.advanceTimersByTimeAsync(29_999)
		expect(error).toBeUndefined()
		await vi.advanceTimersByTimeAsync(1)
		expect(error).toEqual({ reason: 'Timeout', tag: 'Timeout' })
	})

	it('settles once even if more matching messages arrive', async () => {
		const predicate = vi.fn(() => ({ resolve: 'match' }))
		const p = awaitHydraMessage(emitter, predicate, 1000)

		emitter.emit('onMessage', greetings())
		emitter.emit('onMessage', greetings())

		await expect(p).resolves.toBe('match')
		expect(predicate).toHaveBeenCalledOnce()
	})

	it('supports concurrent waiters on the same emitter', async () => {
		const p1 = awaitHydraMessage(emitter, m => (isGreetings(m) ? { resolve: 'p1' } : null), 1000)
		const p2 = awaitHydraMessage(emitter, m => (m.tag === HydraHeadTag.TxValid ? { resolve: 'p2' } : null), 1000)

		emitter.emit('onMessage', txValid)
		expect(listeners()).toBe(1)
		emitter.emit('onMessage', greetings())

		await expect(Promise.all([p1, p2])).resolves.toEqual(['p1', 'p2'])
		expect(vi.getTimerCount()).toBe(0)
	})
})
