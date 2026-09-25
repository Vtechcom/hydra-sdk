import type { GameContext, WalletRequestPayload } from './types'

export interface GameLifecycleClient {
	sendRequest<T>(request: WalletRequestPayload): Promise<T>
}

/**
 * Quản lý vòng đời trò chơi và các tương tác với Shell App Center
 * (Báo sẵn sàng, lấy ngữ cảnh Theme/Locale, phóng to toàn màn hình, thoát game về sảnh)
 */
export class GameLifecycleManager {
	constructor(private client: GameLifecycleClient) {}

	/**
	 * Báo cho App Center biết Game đã tải xong tài nguyên (giúp App Center tắt màn hình loading skeleton)
	 */
	public async ready(payload?: { version?: string; gameSlug?: string }): Promise<boolean> {
		return this.client.sendRequest<boolean>({
			type: 'GAME_READY',
			version: payload?.version,
			gameSlug: payload?.gameSlug
		})
	}

	/**
	 * Lấy ngữ cảnh hiện tại từ App Center (Theme dark/light, ngôn ngữ vi/en, thiết bị mobile/desktop)
	 */
	public async getContext(): Promise<GameContext | null> {
		return this.client.sendRequest<GameContext | null>({
			type: 'GET_CONTEXT'
		})
	}

	/**
	 * Yêu cầu App Center chuyển sang chế độ toàn màn hình cho Game Canvas
	 */
	public async requestFullscreen(enabled = true): Promise<boolean> {
		return this.client.sendRequest<boolean>({
			type: 'REQUEST_FULLSCREEN',
			enabled
		})
	}

	/**
	 * Người chơi bấm nút "Thoát Game" trong giao diện game, yêu cầu App Center điều hướng quay lại `/games`
	 */
	public async exitGame(): Promise<boolean> {
		return this.client.sendRequest<boolean>({
			type: 'EXIT_GAME'
		})
	}
}
