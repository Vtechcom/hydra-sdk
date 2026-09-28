import type {
	WalletRequest,
	WalletRequestPayload,
	WalletResponse,
	WalletEvent,
	GameContext
} from '../types'

export interface MockBridgeHostOptions {
	address?: string
	networkId?: number
	balance?: string
	autoApprove?: boolean
	latencyMs?: number
	targetWindow?: Window
	context?: Partial<GameContext>
	onRpcLog?: (log: { type: string; payload: any; timestamp: number; success: boolean }) => void
}

/**
 * MockBridgeHost — Giả lập App Center Host cho môi trường Local Dev và Automated Testing
 * Lắng nghe postMessage từ game và phản hồi RPC chính xác theo chuẩn Wallet Bridge Protocol.
 */
export class MockBridgeHost {
	public address: string
	public networkId: number
	public balance: string
	public autoApprove: boolean
	public latencyMs: number
	public context: GameContext
	public isAudioMuted = false
	private targetWindow: Window
	private isRunning = false
	private mockStorage = new Map<string, string>()
	private onRpcLog?: (log: { type: string; payload: any; timestamp: number; success: boolean }) => void

	constructor(options: MockBridgeHostOptions = {}) {
		this.address = options.address ?? 'addr_test1qz2fxv2um5tjaq62synchronized'
		this.networkId = options.networkId ?? 0
		this.balance = options.balance ?? '100000000' // 100 ADA
		this.autoApprove = options.autoApprove ?? true
		this.latencyMs = options.latencyMs ?? 20
		this.targetWindow = options.targetWindow ?? (typeof window !== 'undefined' ? window : ({} as any))
		this.onRpcLog = options.onRpcLog

		this.context = {
			theme: 'dark',
			locale: 'vi',
			device: 'desktop',
			appCenterOrigin: 'http://localhost:3000',
			user: {
				username: 'HydraTester',
				avatar: ''
			},
			...options.context
		}
	}

	public start(): void {
		if (this.isRunning || typeof window === 'undefined') return
		this.isRunning = true
		window.addEventListener('message', this.handleMessage)
	}

	public stop(): void {
		if (!this.isRunning || typeof window === 'undefined') return
		this.isRunning = false
		window.removeEventListener('message', this.handleMessage)
	}

	private handleMessage = (event: MessageEvent) => {
		const data = event.data
		if (!data || typeof data !== 'object' || !('type' in data) || !('requestId' in data)) {
			return
		}

		const request = data as WalletRequest
		const sourceWin = (event.source as Window) || this.targetWindow

		setTimeout(() => {
			this.processRequest(request, sourceWin)
		}, this.latencyMs)
	}

	private processRequest(request: WalletRequest, source: Window) {
		const { type, requestId } = request

		if (!this.autoApprove && (type === 'WALLET_SIGN_DATA' || type === 'WALLET_SIGN_TX')) {
			this.sendResponse(source, {
				type: (type + '_RESULT') as any,
				requestId,
				result: null,
				error: 'User declined or cancelled the transaction'
			} as WalletResponse)
			this.logRpc(type, request, false)
			return
		}

		let response: WalletResponse

		switch (type) {
			case 'WALLET_GET_ADDRESS':
				response = {
					type: 'WALLET_ADDRESS_RESULT',
					requestId,
					result: this.address
				}
				break

			case 'WALLET_CONNECT':
				response = {
					type: 'WALLET_CONNECT_RESULT',
					requestId,
					result: { address: this.address, networkId: this.networkId }
				}
				break

			case 'WALLET_GET_NETWORK':
				response = {
					type: 'WALLET_NETWORK_RESULT',
					requestId,
					result: this.networkId
				}
				break

			case 'WALLET_GET_BALANCE':
				response = {
					type: 'WALLET_GET_BALANCE_RESULT',
					requestId,
					result: this.balance
				}
				break

			case 'WALLET_GET_UTXOS':
				response = {
					type: 'WALLET_GET_UTXOS_RESULT',
					requestId,
					result: [
						{
							txHash: '0000000000000000000000000000000000000000000000000000000000000001',
							index: 0,
							output: {
								amount: [
									{ unit: 'lovelace', quantity: this.balance },
									{ unit: 'testTokenPolicyId1234567890abcdef', quantity: '50' }
								]
							}
						}
					]
				}
				break

			case 'WALLET_GET_COLLATERAL':
				response = {
					type: 'WALLET_GET_COLLATERAL_RESULT',
					requestId,
					result: [
						{
							txHash: '0000000000000000000000000000000000000000000000000000000000000002',
							index: 0,
							output: {
								amount: [{ unit: 'lovelace', quantity: '5000000' }]
							}
						}
					]
				}
				break

			case 'WALLET_GET_REWARD_ADDRESSES':
				response = {
					type: 'WALLET_GET_REWARD_ADDRESSES_RESULT',
					requestId,
					result: ['stake_test1uqz2fxv2um5tjaq62synchronizedstake123']
				}
				break

			case 'WALLET_GET_USED_ADDRESSES':
				response = {
					type: 'WALLET_GET_USED_ADDRESSES_RESULT',
					requestId,
					result: [this.address]
				}
				break

			case 'WALLET_SIGN_DATA':
				response = {
					type: 'WALLET_SIGN_DATA_RESULT',
					requestId,
					result: {
						signature: 'mock_cbor_signature_' + Date.now(),
						key: 'mock_cbor_public_key'
					}
				}
				break

			case 'WALLET_SIGN_TX':
				response = {
					type: 'WALLET_SIGN_TX_RESULT',
					requestId,
					result: 'mock_signed_tx_cbor_' + Date.now()
				}
				break

			case 'WALLET_SUBMIT_TX':
				response = {
					type: 'WALLET_SUBMIT_TX_RESULT',
					requestId,
					result: 'mock_tx_hash_' + Math.random().toString(16).slice(2)
				}
				break

			case 'WALLET_PING':
				response = {
					type: 'WALLET_PONG',
					requestId,
					result: {
						version: '0.1.0-mock',
						isConnected: true,
						address: this.address,
						networkId: this.networkId,
						supportedMethods: [
							'WALLET_GET_ADDRESS',
							'WALLET_GET_NETWORK',
							'WALLET_GET_BALANCE',
							'WALLET_GET_UTXOS',
							'WALLET_GET_COLLATERAL',
							'WALLET_GET_REWARD_ADDRESSES',
							'WALLET_GET_USED_ADDRESSES',
							'WALLET_SIGN_DATA',
							'WALLET_SIGN_TX',
							'WALLET_SUBMIT_TX',
							'WALLET_CONNECT',
							'WALLET_PING',
							'WALLET_BATCH_REQUEST',
							'HOST_STORAGE_GET',
							'HOST_STORAGE_SET',
							'HOST_STORAGE_REMOVE',
							'GAME_READY',
							'GET_CONTEXT',
							'REQUEST_FULLSCREEN',
							'EXIT_GAME',
							'SET_ORIENTATION',
							'TRIGGER_HAPTIC'
						]
					}
				}
				break

			case 'HOST_STORAGE_GET':
				response = {
					type: 'HOST_STORAGE_GET_RESULT',
					requestId,
					result: this.mockStorage.get((request as any).key) ?? null
				}
				break

			case 'HOST_STORAGE_SET':
				this.mockStorage.set((request as any).key, (request as any).value)
				response = {
					type: 'HOST_STORAGE_SET_RESULT',
					requestId,
					result: true
				}
				break

			case 'HOST_STORAGE_REMOVE':
				this.mockStorage.delete((request as any).key)
				response = {
					type: 'HOST_STORAGE_REMOVE_RESULT',
					requestId,
					result: true
				}
				break

			case 'WALLET_BATCH_REQUEST': {
				const requests = ((request as any).requests ?? []) as WalletRequestPayload[]
				const batchResults = requests.map(req => {
					switch (req.type) {
						case 'WALLET_GET_ADDRESS':
							return this.address
						case 'WALLET_GET_NETWORK':
							return this.networkId
						case 'WALLET_GET_BALANCE':
							return '1a002dc6c0'
						case 'WALLET_GET_REWARD_ADDRESSES':
							return ['stake_test1uqz2fxv2um5tjaq62synchronizedstake123']
						case 'WALLET_GET_USED_ADDRESSES':
							return [this.address]
						case 'HOST_STORAGE_GET':
							return this.mockStorage.get((req as any).key) ?? null
						case 'HOST_STORAGE_SET':
							this.mockStorage.set((req as any).key, (req as any).value)
							return true
						case 'HOST_STORAGE_REMOVE':
							this.mockStorage.delete((req as any).key)
							return true
						default:
							return null
					}
				})
				response = {
					type: 'WALLET_BATCH_RESULT',
					requestId,
					result: batchResults
				}
				break
			}

			case 'GAME_READY':
				response = {
					type: 'GAME_READY_RESULT',
					requestId,
					result: true
				}
				break

			case 'GET_CONTEXT':
				response = {
					type: 'GET_CONTEXT_RESULT',
					requestId,
					result: this.context
				}
				break

			case 'REQUEST_FULLSCREEN':
				response = {
					type: 'REQUEST_FULLSCREEN_RESULT',
					requestId,
					result: true
				}
				break

			case 'EXIT_GAME':
				response = {
					type: 'EXIT_GAME_RESULT',
					requestId,
					result: true
				}
				break

			case 'SET_ORIENTATION':
				response = {
					type: 'SET_ORIENTATION_RESULT',
					requestId,
					result: true
				}
				break

			case 'TRIGGER_HAPTIC':
				response = {
					type: 'TRIGGER_HAPTIC_RESULT',
					requestId,
					result: true
				}
				break

			default:
				response = {
					type: (type + '_RESULT') as any,
					requestId,
					result: null,
					error: `Unsupported request type in mock host: ${type}`
				} as WalletResponse
		}

		this.sendResponse(source, response)
		this.logRpc(type, request, !response.error)
	}

	private sendResponse(target: Window, response: WalletResponse) {
		try {
			target.postMessage(response, '*')
		} catch (err) {
			console.error('[MockBridgeHost] Gửi response thất bại:', err)
		}
	}

	public sendPushEvent(event: WalletEvent, target = this.targetWindow): void {
		try {
			target.postMessage(event, '*')
		} catch (err) {
			console.error('[MockBridgeHost] Gửi push event thất bại:', err)
		}
	}

	public connect(address = this.address, networkId = this.networkId): void {
		this.address = address
		this.networkId = networkId
		this.sendPushEvent({
			type: 'WALLET_CONNECTED',
			address,
			networkId
		})
	}

	public disconnect(): void {
		this.sendPushEvent({
			type: 'WALLET_DISCONNECTED'
		})
	}

	public switchAccount(newAddress: string): void {
		this.address = newAddress
		this.sendPushEvent({
			type: 'WALLET_ACCOUNT_CHANGED',
			address: newAddress
		})
	}

	public switchNetwork(newNetworkId: number): void {
		this.networkId = newNetworkId
		this.sendPushEvent({
			type: 'WALLET_NETWORK_CHANGED',
			networkId: newNetworkId
		})
	}

	public setContext(newContext: Partial<GameContext>): void {
		this.context = { ...this.context, ...newContext }
		this.sendPushEvent({
			type: 'CONTEXT_CHANGED',
			context: newContext
		})
	}

	public setAudioMuted(muted: boolean): void {
		this.isAudioMuted = muted
		this.sendPushEvent({
			type: 'AUDIO_MUTED_CHANGED',
			muted
		})
	}

	public setTheme(theme: 'dark' | 'light'): void {
		this.context.theme = theme
		this.sendPushEvent({
			type: 'THEME_CHANGED',
			theme
		})
	}

	private logRpc(type: string, payload: any, success: boolean) {
		if (this.onRpcLog) {
			this.onRpcLog({
				type,
				payload,
				timestamp: Date.now(),
				success
			})
		}
	}
}
