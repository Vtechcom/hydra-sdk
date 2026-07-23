/**
 * End-to-end tests for @hydra-sdk/bridge against a real hydra-node 2.3.0
 * running in offline mode.
 *
 * These exist because the v2 payload types were derived by reading the hydra
 * Haskell source; only a live node proves the wire format matches. It already
 * caught one bug — `Greetings.env` has no `signingKey` (the node's ToJSON
 * deliberately omits it).
 *
 * Requires the node on :4002 — see e2e/README.md. Excluded from `pnpm test`;
 * run with `pnpm test:e2e`.
 *
 * Offline mode has no L1, so commit/decommit/fanout/contest cannot be
 * exercised here. Those need a devnet with a cardano-node.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { AppWallet, Deserializer, NETWORK_ID, Resolver } from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'
import { HydraBridge, HydraCommand, HydraHeadTag, WebsocketConnector } from '@hydra-sdk/bridge'
import type { Greetings, HydraPayload, SnapshotConfirmed } from '@hydra-sdk/bridge'
import { E2E_MNEMONIC } from '../../../infra/hydra-offline/seed-utxo.mjs'

const API_PORT = Number(process.env.HYDRA_API_PORT ?? 4002)
const WS_URL = `ws://localhost:${API_PORT}`
const HTTP_URL = `http://localhost:${API_PORT}`

const wallet = new AppWallet({
	networkId: NETWORK_ID.PREPROD,
	key: { type: 'mnemonic', words: E2E_MNEMONIC.split(' ') }
})
const walletAddress = wallet.getAccount().baseAddressBech32

/** Wait for the first payload matching `predicate`, or reject on timeout. */
const nextMessage = <T extends HydraPayload>(
	bridge: HydraBridge,
	predicate: (p: HydraPayload) => boolean,
	timeout = 15_000
): Promise<T> =>
	new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			bridge.events.off('onMessage', handler)
			reject(new Error('timed out waiting for message'))
		}, timeout)
		const handler = (payload: HydraPayload) => {
			if (!predicate(payload)) return
			clearTimeout(timer)
			bridge.events.off('onMessage', handler)
			resolve(payload as T)
		}
		bridge.events.on('onMessage', handler)
	})

describe('e2e: bridge ↔ hydra-node 2.3.0 (offline head)', () => {
	let bridge: HydraBridge

	beforeAll(async () => {
		const res = await fetch(`${HTTP_URL}/protocol-parameters`).catch(() => null)
		if (!res?.ok) {
			throw new Error(
				`No hydra-node on ${HTTP_URL}. Start it with:\n` +
					`  packages/hydra-bridge/e2e/infra/run-offline.sh`
			)
		}

		bridge = new HydraBridge({ url: WS_URL, history: false })
		await bridge.connect()
		// Greetings arrives right after the socket opens and seeds bridge state.
		await nextMessage(bridge, p => p.tag === HydraHeadTag.Greetings)
	}, 30_000)

	describe('Greetings', () => {
		it('matches the declared shape and carries no seq/timestamp', async () => {
			const fresh = new HydraBridge({ url: WS_URL, history: false })
			await fresh.connect()
			const greetings = await nextMessage<Greetings>(fresh, p => p.tag === HydraHeadTag.Greetings)

			expect(greetings.me.vkey).toEqual(expect.any(String))
			expect(greetings.headStatus).toBe('Open')
			expect(greetings.hydraNodeVersion).toMatch(/^2\./)
			expect(greetings.chainSyncedStatus).toBe('InSync')
			expect(typeof greetings.currentSlot).toBe('number')
			expect(greetings.networkInfo).toEqual({ networkConnected: true, peersInfo: {} })

			// ServerOutput messages are wrapped in TimedServerOutput; Greetings is not.
			expect(greetings).not.toHaveProperty('seq')
			expect(greetings).not.toHaveProperty('timestamp')

			// The node's Environment holds a signingKey but its ToJSON omits it.
			expect(greetings.env).not.toHaveProperty('signingKey')
			expect(Object.keys(greetings.env).sort()).toEqual([
				'configuredPeers',
				'contestationPeriod',
				'depositPeriod',
				'otherParties',
				'participants',
				'party',
				'unsyncedPeriod'
			])

			await fresh.disconnect()
		})

		it('populates bridge state from Greetings', () => {
			expect(bridge.nodeVersion).toMatch(/^2\./)
			expect(bridge.syncedStatus).toBe('InSync')
			expect(bridge.slotZeroTimestamp).toEqual(expect.any(Number))
		})
	})

	describe('REST endpoints', () => {
		it('GET /head returns a HeadState, not a HeadStatus', async () => {
			const info = await bridge.connector.fetcher.queryHeadInfo()

			// HeadState tags are Idle|Open|Closed — FanoutPossible/Final never appear here.
			expect(info.tag).toBe('Open')
			if (info.tag !== 'Open') throw new Error('unreachable')

			expect(Object.keys(info.contents).sort()).toEqual([
				'chainState',
				'coordinatedHeadState',
				'headId',
				'headSeed',
				'parameters'
			])
			expect(Object.keys(info.contents.coordinatedHeadState).sort()).toEqual([
				'allTxs',
				'confirmedSnapshot',
				'currentDepositTxId',
				'decommitTx',
				'localTxs',
				'localUTxO',
				'seenSnapshot',
				'version'
			])
			expect(info.contents.parameters.parties).toHaveLength(1)
		})

		it('GET /snapshot returns a tagged ConfirmedSnapshot with an accumulator', async () => {
			const snapshot = await bridge.connector.fetcher.queryConfirmedSnapshot!()

			expect(snapshot?.tag).toBe('ConfirmedSnapshot')
			if (snapshot?.tag !== 'ConfirmedSnapshot') throw new Error('unreachable')

			expect(snapshot.signatures.multiSignature.length).toBeGreaterThan(0)
			// v2 snapshots commit to the UTxO set through a BLS accumulator.
			expect(snapshot.snapshot.accumulator).toMatch(/^[0-9a-f]{64}$/)
			expect(snapshot.snapshot.utxoToDecommit).toBeNull()
		})

		it('GET /snapshot/last-seen returns a discriminated SeenSnapshot', async () => {
			const seen = await bridge.connector.fetcher.queryLastSeenSnapshot!()

			expect(['NoSeenSnapshot', 'LastSeenSnapshot', 'RequestedSnapshot', 'SeenSnapshot']).toContain(seen.tag)
		})

		it('GET /commits returns pending deposit ids', async () => {
			// Offline heads have no L1 deposits, so this is empty — but the route
			// and response shape are what we are pinning.
			await expect(bridge.pendingDeposits()).resolves.toEqual([])
		})

		it('GET /config is available on 2.3.0', async () => {
			const config = await bridge.connector.fetcher.queryNodeConfig!()

			expect(config).toMatchObject({ 'api-port': API_PORT })
			expect(config.chain).toMatchObject({ mode: 'offline' })
		})

		it('GET /protocol-parameters exposes PV11 cost models', async () => {
			const raw = await bridge.getRawProtocolParameters()

			expect(raw.protocolVersion.major).toBe(11)
			expect(raw.costModels.PlutusV3.length).toBe(350)

			// toProtocol narrows to core's Protocol and drops costModels.
			const protocol = await bridge.getProtocolParameters()
			expect(protocol.minFeeA).toBe(raw.txFeePerByte)
			expect(protocol).not.toHaveProperty('costModels')
		})
	})

	describe('snapshot cache', () => {
		it('seeds the address index from Greetings without an extra HTTP call', async () => {
			const utxos = await bridge.queryAddressUTxO(walletAddress)

			expect(utxos.length).toBeGreaterThan(0)
			expect(utxos[0].output.address).toBe(walletAddress)
		})

		it('computes balances from the cache', () => {
			const balance = bridge.getAddressBalance(walletAddress)

			expect(balance?.get('lovelace')).toBeGreaterThan(0n)
		})

		it('returns an empty list for an address not in the head', async () => {
			await expect(bridge.queryAddressUTxO('addr_test1_not_in_head')).resolves.toEqual([])
		})
	})

	describe('L2 transactions', () => {
		/**
		 * These tests share one head, so each must leave the UTxO cache current
		 * before the next builds on it — otherwise the next tx spends an input
		 * that is already consumed and the node answers `TxInvalid`.
		 */
		const awaitConfirmation = (txId: string) =>
			nextMessage<SnapshotConfirmed>(
				bridge,
				p => p.tag === HydraHeadTag.SnapshotConfirmed && p.snapshot.confirmed.some(tx => tx.txId === txId)
			)

		const buildSignedTx = async (lovelace: number) => {
			const inputs = await bridge.queryAddressUTxO(walletAddress)
			const builder = new TxBuilder({ isHydra: true, params: { minFeeA: 0, minFeeB: 0 } })
			const tx = await builder
				.setInputs(inputs)
				.addOutput({ address: walletAddress, amount: [{ unit: 'lovelace', quantity: String(lovelace) }] })
				.changeAddress(walletAddress)
				.complete()

			const cborHex = await wallet.signTx(tx.to_hex())
			return { cborHex, txId: Resolver.resolveTxHash(cborHex) }
		}

		it('submitTxSync reaches SnapshotConfirmed', async () => {
			const { cborHex, txId } = await buildSignedTx(2_000_000)

			const result = await bridge.submitTxSync(
				{ cborHex, txId, type: 'Witnessed Tx ConwayEra', description: 'e2e submitTxSync' },
				{ timeout: 20_000 }
			)

			expect(result).toMatchObject({ txId, isValid: true, isConfirmed: true })
			expect(result.result?.tag).toBe(HydraHeadTag.SnapshotConfirmed)

			const confirmed = result.result as SnapshotConfirmed
			// ServerOutput messages DO carry the timed envelope.
			expect(confirmed.seq).toEqual(expect.any(Number))
			expect(confirmed.timestamp).toEqual(expect.any(String))
			expect(confirmed.signatures.multiSignature.length).toBeGreaterThan(0)
			expect(confirmed.snapshot.confirmed.some(tx => tx.txId === txId)).toBe(true)
		}, 30_000)

		it('submitL2Tx gets a verdict from the node instead of racing messages', async () => {
			const { cborHex, txId } = await buildSignedTx(3_000_000)

			// Subscribe before submitting — the snapshot can confirm before the
			// HTTP response lands.
			const confirmed = awaitConfirmation(txId)

			const res = await bridge.submitL2Tx(
				{ cborHex, txId, type: 'Witnessed Tx ConwayEra', description: 'e2e submitL2Tx' },
				{ timeout: 20_000 }
			)

			expect(['SubmitTxConfirmed', 'SubmitTxSubmitted']).toContain(res.tag)
			if (res.tag === 'SubmitTxConfirmed') {
				expect(res.snapshotNumber).toEqual(expect.any(Number))
			}

			// Leave the shared head settled for the next test.
			await confirmed
		}, 30_000)

		it('advances lastSnapshotNumber and refreshes the cache', async () => {
			const before = bridge.lastSnapshotNumber
			const { cborHex, txId } = await buildSignedTx(4_000_000)

			await bridge.submitTxSync(
				{ cborHex, txId, type: 'Witnessed Tx ConwayEra', description: 'e2e cache' },
				{ timeout: 20_000 }
			)

			expect(bridge.lastSnapshotNumber).toBeGreaterThan(before)
			const utxos = await bridge.queryAddressUTxO(walletAddress)
			expect(utxos.some(u => u.input.txHash === txId)).toBe(true)
		}, 30_000)

		it('rejects an invalid transaction via TxInvalid', async () => {
			// Spend an input that does not exist in the head's UTxO set.
			const builder = new TxBuilder({ isHydra: true, params: { minFeeA: 0, minFeeB: 0 } })
			const tx = await builder
				.setInputs([
					{
						input: { txHash: 'ff'.repeat(32), outputIndex: 0 },
						output: { address: walletAddress, amount: [{ unit: 'lovelace', quantity: '10000000' }] }
					}
				])
				.addOutput({ address: walletAddress, amount: [{ unit: 'lovelace', quantity: '2000000' }] })
				.changeAddress(walletAddress)
				.complete()

			const cborHex = await wallet.signTx(tx.to_hex())
			const txId = Resolver.resolveTxHash(cborHex)

			await expect(
				bridge.submitTxSync(
					{ cborHex, txId, type: 'Witnessed Tx ConwayEra', description: 'e2e invalid' },
					{ timeout: 15_000 }
				)
			).rejects.toMatchObject({ txId, tag: HydraHeadTag.TxInvalid })
		}, 30_000)
	})

	describe('commands removed in v2', () => {
		it('rejects Abort with InvalidInput', async () => {
			// `Abort` no longer exists in hydra-node v2's ClientInput, so the node
			// cannot even decode it. This pins the reason we dropped commands.abort().
			const invalidInput = nextMessage(bridge, p => p.tag === HydraHeadTag.InvalidInput)
			bridge.sendCommand({ command: 'Abort' as HydraCommand })

			const payload = await invalidInput
			expect(payload.tag).toBe(HydraHeadTag.InvalidInput)
		}, 20_000)
	})

	describe('connector', () => {
		it('builds the websocket url with query params', () => {
			const connector = new WebsocketConnector({
				websocketUrl: WS_URL,
				history: false,
				noSnapshotUtxo: true,
				address: walletAddress
			})

			expect(connector.networkInfo.socketUrl).toContain('snapshot-utxo=no')
			expect(connector.networkInfo.socketUrl).toContain(`address=${walletAddress}`)
			expect(connector.networkInfo.httpUrl).toBe(`${HTTP_URL}/`)
		})

		it('omits snapshot utxo when asked', async () => {
			const lean = new HydraBridge({ url: WS_URL, history: false, noSnapshotUtxo: true })
			await lean.connect()
			const greetings = await nextMessage<Greetings>(lean, p => p.tag === HydraHeadTag.Greetings)

			expect(greetings.snapshotUtxo).toBeUndefined()
			await lean.disconnect()
		}, 20_000)
	})
})
