import type {
	WalletRequest,
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
	private targetWindow: Window
	private isRunning = false
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
						networkId: this.networkId
					}
				}
				break

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

			default:
				response = {
					type: (type + '_RESULT') as any,
					requestId,
					result: null,
					error: 'Unsupported request type in mock host'
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
