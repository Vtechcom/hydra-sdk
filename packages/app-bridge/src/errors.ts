/**
 * Custom Error classes cho Wallet Bridge Protocol
 */

export class WalletBridgeError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'WalletBridgeError'
		Object.setPrototypeOf(this, new.target.prototype)
	}
}

export class WalletBridgeTimeoutError extends WalletBridgeError {
	constructor(
		public readonly requestType: string,
		public readonly timeoutMs: number
	) {
		super(`[WalletBridgeClient] Request ${requestType} timeout sau ${timeoutMs}ms.`)
		this.name = 'WalletBridgeTimeoutError'
	}
}

export class WalletBridgeUserRejectedError extends WalletBridgeError {
	constructor(message = 'User declined or cancelled the wallet request') {
		super(`[WalletBridgeClient] Người dùng đã từ chối thao tác ví: ${message}`)
		this.name = 'WalletBridgeUserRejectedError'
	}
}

export class WalletBridgeNotInIframeError extends WalletBridgeError {
	constructor() {
		super('[WalletBridgeClient] dApp không chạy bên trong iframe hợp lệ và không có Mock/Fallback.')
		this.name = 'WalletBridgeNotInIframeError'
	}
}

export class WalletBridgeSecurityError extends WalletBridgeError {
	constructor(message: string) {
		super(`[WalletBridgeClient] Bảo mật: ${message}`)
		this.name = 'WalletBridgeSecurityError'
	}
}

export class WalletBridgeRpcError extends WalletBridgeError {
	constructor(
		public readonly requestType: string,
		public readonly rpcError: string
	) {
		super(`[WalletBridgeClient] RPC Error trên Host (${requestType}): ${rpcError}`)
		this.name = 'WalletBridgeRpcError'
	}
}

export function isWalletBridgeError(err: unknown): err is WalletBridgeError {
	return err instanceof WalletBridgeError
}
