import { MockBridgeHost, type MockBridgeHostOptions } from './host'

export interface GameDevtoolsOptions extends MockBridgeHostOptions {
	position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
	initialOpen?: boolean
}

let _activeDevtoolsContainer: HTMLElement | null = null
let _activeHostInstance: MockBridgeHost | null = null

/**
 * Gắn widget floating DevTools vào trang web của Game để giả lập App Center và điều khiển ví trực quan
 */
export function mountGameDevtools(options: GameDevtoolsOptions = {}): {
	host: MockBridgeHost
	unmount: () => void
} {
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		return {
			host: new MockBridgeHost(options),
			unmount: () => {}
		}
	}

	// Đảm bảo không tạo duplicate container
	if (_activeDevtoolsContainer) {
		unmountGameDevtools()
	}

	const logs: Array<{ type: string; timestamp: string; success: boolean }> = []

	const host = new MockBridgeHost({
		...options,
		onRpcLog: log => {
			const timeStr = new Date(log.timestamp).toLocaleTimeString()
			logs.unshift({ type: log.type, timestamp: timeStr, success: log.success })
			if (logs.length > 20) logs.pop()
			renderLogs()
		}
	})
	host.start()
	_activeHostInstance = host

	const container = document.createElement('div')
	container.id = 'hydra-game-devtools-root'
	_activeDevtoolsContainer = container

	// Styling container
	const pos = options.position ?? 'bottom-right'
	const posStyles = {
		'bottom-right': 'bottom: 20px; right: 20px;',
		'bottom-left': 'bottom: 20px; left: 20px;',
		'top-right': 'top: 20px; right: 20px;',
		'top-left': 'top: 20px; left: 20px;'
	}[pos]

	container.style.cssText = `
		position: fixed;
		${posStyles}
		z-index: 999999;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		font-size: 13px;
		color: #f1f5f9;
	`

	let isOpen = options.initialOpen ?? false

	function updateUI() {
		if (!isOpen) {
			container.innerHTML = `
				<button id="hydra-devtools-toggle" style="
					background: #0ea5e9;
					color: white;
					border: none;
					border-radius: 9999px;
					padding: 10px 16px;
					font-weight: 600;
					cursor: pointer;
					box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
					display: flex;
					align-items: center;
					gap: 8px;
					transition: all 0.2s;
				">
					<span>⚡ Hydra Game DevTools</span>
				</button>
			`
			container.querySelector('#hydra-devtools-toggle')?.addEventListener('click', () => {
				isOpen = true
				updateUI()
			})
			return
		}

		container.innerHTML = `
			<div style="
				background: #0f172a;
				border: 1px solid #334155;
				border-radius: 12px;
				width: 340px;
				max-height: 520px;
				box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
				display: flex;
				flex-direction: column;
				overflow: hidden;
			">
				<!-- Header -->
				<div style="
					padding: 12px 16px;
					background: #1e293b;
					border-bottom: 1px solid #334155;
					display: flex;
					align-items: center;
					justify-content: space-between;
				">
					<div style="font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
						<span>⚡ Hydra Dev Simulator</span>
					</div>
					<button id="hydra-close-btn" style="
						background: transparent;
						border: none;
						color: #94a3b8;
						font-size: 18px;
						cursor: pointer;
					">&times;</button>
				</div>

				<!-- Body Controls -->
				<div style="padding: 14px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto;">
					<!-- Wallet Info -->
					<div style="background: #1e293b; padding: 10px; border-radius: 8px; border: 1px solid #334155;">
						<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
							<span style="color: #94a3b8; font-size: 11px;">MẠNG:</span>
							<span style="font-weight: 600; color: ${host.networkId === 1 ? '#10b981' : '#f59e0b'};">
								${host.networkId === 1 ? 'Mainnet (1)' : 'Preprod (0)'}
							</span>
						</div>
						<div style="display: flex; justify-content: space-between; align-items: center;">
							<span style="color: #94a3b8; font-size: 11px;">ĐỊA CHỈ:</span>
							<span style="font-family: monospace; font-size: 11px; color: #cbd5e1;">
								${host.address.slice(0, 10)}...${host.address.slice(-6)}
							</span>
						</div>
					</div>

					<!-- Action Buttons -->
					<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
						<button id="hydra-btn-connect" style="
							background: #10b981; color: white; border: none; padding: 7px; border-radius: 6px; font-weight: 600; cursor: pointer;
						">Connect Ví</button>
						<button id="hydra-btn-disconnect" style="
							background: #ef4444; color: white; border: none; padding: 7px; border-radius: 6px; font-weight: 600; cursor: pointer;
						">Disconnect</button>
						<button id="hydra-btn-switch-net" style="
							background: #334155; color: #f8fafc; border: 1px solid #475569; padding: 7px; border-radius: 6px; cursor: pointer;
						">Đổi Mạng</button>
						<button id="hydra-btn-switch-acc" style="
							background: #334155; color: #f8fafc; border: 1px solid #475569; padding: 7px; border-radius: 6px; cursor: pointer;
						">Đổi Ví</button>
						<button id="hydra-btn-toggle-audio" style="
							background: #334155; color: #f8fafc; border: 1px solid #475569; padding: 7px; border-radius: 6px; cursor: pointer;
						">${host.isAudioMuted ? '🔊 Bật Âm' : '🔇 Mute Âm'}</button>
						<button id="hydra-btn-toggle-theme" style="
							background: #334155; color: #f8fafc; border: 1px solid #475569; padding: 7px; border-radius: 6px; cursor: pointer;
						">Đổi Theme (${host.context.theme})</button>
					</div>

					<!-- Options -->
					<label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; color: #cbd5e1;">
						<input type="checkbox" id="hydra-chk-approve" ${host.autoApprove ? 'checked' : ''} />
						<span>Auto-approve Transactions & Sign</span>
					</label>

					<!-- RPC Log Inspector -->
					<div style="margin-top: 6px;">
						<div style="font-size: 11px; font-weight: 700; color: #94a3b8; margin-bottom: 6px;">
							RPC MESSAGE LOGS
						</div>
						<div id="hydra-logs-list" style="
							background: #020617;
							border: 1px solid #1e293b;
							border-radius: 6px;
							max-height: 120px;
							overflow-y: auto;
							padding: 6px;
							font-family: monospace;
							font-size: 11px;
						">
							<!-- Rendered logs -->
						</div>
					</div>
				</div>
			</div>
		`

		// Attach event listeners
		container.querySelector('#hydra-close-btn')?.addEventListener('click', () => {
			isOpen = false
			updateUI()
		})

		container.querySelector('#hydra-btn-connect')?.addEventListener('click', () => {
			host.connect()
		})

		container.querySelector('#hydra-btn-disconnect')?.addEventListener('click', () => {
			host.disconnect()
		})

		container.querySelector('#hydra-btn-switch-net')?.addEventListener('click', () => {
			const newNet = host.networkId === 0 ? 1 : 0
			host.switchNetwork(newNet)
			updateUI()
		})

		container.querySelector('#hydra-btn-switch-acc')?.addEventListener('click', () => {
			const randomSuffix = Math.random().toString(36).slice(2, 6)
			host.switchAccount(`addr_test1qz2fxv2um5tjaq62new${randomSuffix}`)
			updateUI()
		})

		container.querySelector('#hydra-btn-toggle-audio')?.addEventListener('click', () => {
			host.setAudioMuted(!host.isAudioMuted)
			updateUI()
		})

		container.querySelector('#hydra-btn-toggle-theme')?.addEventListener('click', () => {
			const nextTheme = host.context.theme === 'dark' ? 'light' : 'dark'
			host.setTheme(nextTheme)
			updateUI()
		})

		const chkApprove = container.querySelector('#hydra-chk-approve') as HTMLInputElement | null
		chkApprove?.addEventListener('change', () => {
			host.autoApprove = !!chkApprove.checked
		})

		renderLogs()
	}

	function renderLogs() {
		const listEl = container.querySelector('#hydra-logs-list')
		if (!listEl) return
		if (logs.length === 0) {
			listEl.innerHTML = '<div style="color: #64748b; text-align: center; padding: 4px;">Chưa có message</div>'
			return
		}
		listEl.innerHTML = logs
			.map(
				l => `
			<div style="display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px solid #0f172a;">
				<span style="color: ${l.success ? '#38bdf8' : '#f87171'};">${l.type}</span>
				<span style="color: #64748b;">${l.timestamp}</span>
			</div>
		`
			)
			.join('')
	}

	document.body.appendChild(container)
	updateUI()

	return {
		host,
		unmount: unmountGameDevtools
	}
}

/**
 * Gỡ bỏ DevTools widget khỏi màn hình
 */
export function unmountGameDevtools(): void {
	if (_activeDevtoolsContainer && _activeDevtoolsContainer.parentNode) {
		_activeDevtoolsContainer.parentNode.removeChild(_activeDevtoolsContainer)
		_activeDevtoolsContainer = null
	}
	if (_activeHostInstance) {
		_activeHostInstance.stop()
		_activeHostInstance = null
	}
}
