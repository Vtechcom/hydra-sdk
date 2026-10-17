/**
 * Shared fixtures for `@hydra-sdk/bridge` unit tests.
 *
 * Written to move into `@hydra-sdk/testkit/fixtures` later: the builders only
 * depend on the public bridge types, and the mock connector only on `vitest`
 * and `mitt`. Keep it free of test-file specifics.
 */
import { vi, type Mock } from 'vitest'
import mitt from 'mitt'
import type { UTxOObject, UTxOObjectValue } from '@hydra-sdk/core'
import type { HydraBridgeFetcher } from '../../src/types/fetcher.type'
import type { HydraBridgeSubmitter } from '../../src/types/submitter.type'
import type { HydraBridgeEvents, HydraConnector } from '../../src/types/hydra-connector.type'
import type { RawProtocolParameters } from '../../src/types/protocol-parameters.type'
import type { Transaction } from '../../src/types/transaction.type'
import {
	HydraCommand,
	HydraHeadStatus,
	HydraHeadTag,
	type Greetings,
	type HydraHeadState,
	type HydraPayload,
	type SnapshotConfirmed
} from '../../src/types/payload.type'

export const ADDR_A = 'addr_test1vqaliceaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
export const ADDR_B = 'addr_test1vqbobbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
export const POLICY = 'aa'.repeat(28)
export const HEAD_ID = 'cafe'.repeat(7)

const txId = (n: number) => n.toString(16).padStart(64, '0')

/** One UTxO entry. `value` is lovelace, or a full multi-asset value. */
export const utxo = (n: number, address: string, value: number | UTxOObjectValue['value'] = 1_000_000): UTxOObject => ({
	[`${txId(n)}#0`]: {
		address,
		datum: null,
		datumhash: null,
		inlineDatum: null,
		referenceScript: null,
		value: typeof value === 'number' ? { lovelace: value } : value
	}
})

/** Merge several {@link utxo} entries into one snapshot. */
export const utxoSet = (...entries: UTxOObject[]): UTxOObject => Object.assign({}, ...entries)

/** Protocol parameters as `GET /protocol-parameters` returns them inside a head (utxoCostPerByte = 0). */
export const pp = (overrides: Partial<RawProtocolParameters> = {}): RawProtocolParameters =>
	({
		txFeeFixed: 0,
		txFeePerByte: 0,
		maxTxSize: 16384,
		maxBlockBodySize: 90112,
		maxBlockHeaderSize: 1100,
		stakeAddressDeposit: 2_000_000,
		stakePoolDeposit: 500_000_000,
		minPoolCost: 170_000_000,
		maxValueSize: 5000,
		collateralPercentage: 150,
		maxCollateralInputs: 3,
		utxoCostPerByte: 0,
		minFeeRefScriptCostPerByte: 15,
		executionUnitPrices: { priceMemory: 0.0577, priceSteps: 0.0000721 },
		maxTxExecutionUnits: { memory: 14_000_000, steps: 10_000_000_000 },
		maxBlockExecutionUnits: { memory: 62_000_000, steps: 20_000_000_000 },
		costModels: { PlutusV1: [1], PlutusV2: [2], PlutusV3: [3] },
		protocolVersion: { major: 11, minor: 0 },
		...overrides
	}) as RawProtocolParameters

export const greetings = (overrides: Partial<Greetings> = {}): Greetings => ({
	tag: HydraHeadTag.Greetings,
	me: { vkey: 'me-vkey' },
	headStatus: HydraHeadStatus.Open,
	hydraHeadId: HEAD_ID,
	hydraNodeVersion: '2.3.0',
	currentSlot: 1000,
	chainSyncedStatus: 'InSync',
	env: {
		party: { vkey: 'me-vkey' },
		otherParties: [],
		participants: [],
		contestationPeriod: 60,
		depositPeriod: 120,
		unsyncedPeriod: 300,
		configuredPeers: ''
	},
	networkInfo: { networkConnected: true, peersInfo: {} },
	...overrides
})

export const tx = (id = 'ab'.repeat(32)): Transaction => ({
	type: 'Witnessed Tx ConwayEra',
	description: '',
	cborHex: '84a400',
	txId: id
})

export const snapshotConfirmed = (
	number: number,
	snapshotUtxo: UTxOObject = {},
	confirmed: Transaction[] = []
): SnapshotConfirmed =>
	({
		tag: HydraHeadTag.SnapshotConfirmed,
		seq: number,
		timestamp: '2026-10-17T00:00:00Z',
		headId: HEAD_ID,
		snapshot: {
			headId: HEAD_ID,
			number,
			version: 0,
			confirmed,
			utxo: snapshotUtxo,
			utxoToCommit: {},
			utxoToDecommit: {}
		},
		signatures: { multiSignature: [] }
	}) as unknown as SnapshotConfirmed

/** `CommandFailed` / `RejectedInputBecauseUnsynced` echo the client input back, txId included. */
export const echoedNewTx = (t: Transaction) => ({
	tag: HydraCommand.NewTx,
	transaction: { type: t.type, description: t.description, cborHex: t.cborHex, txId: t.txId }
})

export const headState = {
	idle: (): HydraHeadState => ({ tag: 'Idle', contents: { chainState: {} } }),
	open: (vkeys: string[] = ['first-party', 'second-party']): HydraHeadState =>
		({
			tag: 'Open',
			contents: {
				headId: HEAD_ID,
				headSeed: 'seed',
				chainState: {},
				parameters: { contestationPeriod: 60, parties: vkeys.map(vkey => ({ vkey })) },
				coordinatedHeadState: {} as never
			}
		}) as HydraHeadState
}

export type MockConnector = HydraConnector & {
	fetcher: { [K in keyof Required<HydraBridgeFetcher>]: Mock }
	submitter: { [K in keyof Required<HydraBridgeSubmitter>]: Mock }
	apiFetch: { get: Mock; post: Mock; delete: Mock }
	connect: Mock
	disconnect: Mock
	connected: Mock
	sendCommand: Mock
	/** Emit a node message as if it came over the wire. */
	emit: (payload: unknown) => void
}

/**
 * A connector with every fetcher/submitter method mocked, including the
 * optional REST v2 ones. Defaults describe an open head holding `ADDR_A`.
 */
export const mockConnector = (): MockConnector => {
	const eventEmitter = mitt<HydraBridgeEvents>()
	return {
		conn: { ssl: false, host: 'localhost', port: 4001, path: '/' },
		eventEmitter,
		apiFetch: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
		fetcher: {
			queryRawProtocolParameters: vi.fn().mockResolvedValue(pp()),
			querySnapshotUtxo: vi.fn().mockResolvedValue(utxo(1, ADDR_A)),
			queryHeadInfo: vi.fn().mockResolvedValue(headState.open()),
			queryConfirmedSnapshot: vi.fn().mockResolvedValue(null),
			queryLastSeenSnapshot: vi.fn().mockResolvedValue({ tag: 'NoSeenSnapshot' }),
			queryPendingDeposits: vi.fn().mockResolvedValue([]),
			queryNodeConfig: vi.fn().mockResolvedValue({})
		},
		submitter: {
			commit: vi.fn().mockResolvedValue(null),
			submitCardanoTx: vi.fn().mockResolvedValue({ tag: 'TransactionSubmitted' }),
			submitTxSync: vi.fn(),
			submitTx: vi.fn(),
			submitL2Tx: vi.fn().mockResolvedValue({ tag: 'SubmitTxConfirmed', snapshotNumber: 1 }),
			recoverDeposit: vi.fn().mockResolvedValue('OK'),
			decommit: vi.fn().mockResolvedValue('OK'),
			sideLoadSnapshot: vi.fn().mockResolvedValue('OK')
		},
		connect: vi.fn(),
		disconnect: vi.fn(),
		connected: vi.fn().mockReturnValue(true),
		sendCommand: vi.fn(),
		emit: payload => eventEmitter.emit('onMessage', payload as HydraPayload)
	} as unknown as MockConnector
}

/** A promise settled from outside — for ordering HTTP responses against WS messages. */
export const deferred = <T>() => {
	let resolve!: (value: T) => void
	let reject!: (reason: unknown) => void
	const promise = new Promise<T>((res, rej) => {
		resolve = res
		reject = rej
	})
	return { promise, resolve, reject }
}

/** An axios-shaped HTTP error carrying a status and optional body. */
export const httpError = (status: number, data?: unknown) =>
	Object.assign(new Error(`Request failed with status code ${status}`), { response: { status, data } })
