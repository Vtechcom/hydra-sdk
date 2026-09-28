# @hydra-sdk/app-bridge

Package Client giao tiếp ví Web3 qua giao thức **Wallet Bridge Protocol (postMessage RPC)** dành cho các Game dApp chạy trong cross-origin `<iframe>` của hệ sinh thái HydraOne.

---

## 1. Tổng quan & Động lực

Trong kiến trúc **Micro-frontend Iframe Game Hub** của HydraOne:

- **App Center Host (`hydraone.app`)**: Quản lý kết nối CIP-30 với browser extension (Eternl, Lace, Nami, Flint...) và đóng vai trò Host Bridge.
- **Game dApps (`*.hydraone.app`)**: Chạy độc lập trong `<iframe>`, có domain/subdomain riêng biệt, CI/CD riêng và deploy độc lập.

Do rào cản **Same-Origin Policy**, browser extension không thể trực tiếp inject API `window.cardano` vào trong các cross-origin iframe. Package `@hydra-sdk/app-bridge` giải quyết vấn đề này bằng cách thiết lập kênh RPC 2 chiều bảo mật qua `window.postMessage`, ủy quyền các thao tác ví (lấy địa chỉ, ký challenge JWT CIP-8, ký transaction CBOR CIP-30, lấy UTxO, collateral, balance, submit tx) lên Host.

---

## 2. Tính năng chính

- 🚀 **Framework Agnostic Core**: Core class `WalletBridgeClient` thuần TypeScript, không phụ thuộc vào Vue, hoạt động với mọi framework (Vanilla JS, React, Vue, Phaser, PixiJS, Svelte...).
- 💚 **Dedicated Vue 3 / Nuxt 3 Subpath (`@hydra-sdk/app-bridge/vue`)**: Cung cấp `useWalletBridgeClient` và `useGameAuth` với reactive state (`ref`), computed helpers (`shortAddress`, `isMainnet`, `isTestnet`), và asset parser `parseUtxoAssets`.
- ⏱️ **Phân tầng Timeout thông minh (Tiered Timeouts)**: Tự động phân bổ timeout tối ưu theo loại tác vụ (3s cho ping/ready/context, 15s cho UTxO/balance, 120s cho ký ví) và cho phép override per-request.
- 🤝 **Capability Discovery & Handshake**: Client tự động nhận diện các methods mà App Center Host hỗ trợ thông qua `ping()` và cung cấp helper `isMethodSupported(type)`.
- 🔐 **Web3 Auth 1-Click chuẩn hóa (`GameAuthManager`)**: Tự động mã hóa Hex Payload theo chuẩn CIP-8/CIP-30, lưu token an toàn và kiểm tra hạn sử dụng JWT token (`isJwtExpired`).
- 🔄 **Dual Storage Pattern & Host Storage Relay**:
  - Tự động fallback sang bộ nhớ RAM (In-Memory Map) khi `localStorage` bị chặn bởi **Safari ITP** hoặc Storage Partitioning trong cross-origin iframe.
  - Hỗ trợ **Host Storage Relay** (`getItemAsync`, `setItemAsync`, `removeItemAsync`): Nhờ App Center Shell lưu hộ session token và game state, giữ vững phiên đăng nhập ngay cả khi người chơi F5 / reload iframe trên iOS Safari.
  - Hỗ trợ prefix (mặc định `'hydra:'`), khi gọi `storage.clear()` chỉ xóa dữ liệu của SDK, **bảo toàn tuyệt đối dữ liệu khác của Game origin** (âm thanh, high score, v.v.).
- 🎮 **Game Lifecycle & UX Events**: Đồng bộ âm thanh (`AUDIO_MUTED_CHANGED`), đổi giao diện (`THEME_CHANGED`), khóa hướng xoay màn hình (`setOrientation`), rung phản hồi xúc giác (`triggerHaptic`).
- 🔌 **Standalone Fallback to CIP-30 Extension**: Hỗ trợ chạy game độc lập ngoài iframe với tùy chọn `fallbackToExtension: true` (tự động kết nối với Eternl, Lace, Nami...).
- 🧪 **Chế độ Mock Standalone Dev & DevTools**: Widget DevTools floating và `MockBridgeHost` giúp game developer phát triển độc lập trên `localhost:3000` ngoài iframe.
- 📦 **Modular Tree-shakable Subpath Exports**: Hỗ trợ import linh hoạt `@hydra-sdk/app-bridge`, `@hydra-sdk/app-bridge/vue`, `@hydra-sdk/app-bridge/auth`, `@hydra-sdk/app-bridge/storage`, `@hydra-sdk/app-bridge/lifecycle`, `@hydra-sdk/app-bridge/simulator`.
- ⚠️ **Typed Custom Errors**: Phân loại chi tiết lỗi `WalletBridgeUserRejectedError`, `WalletBridgeTimeoutError`, `WalletBridgeNotInIframeError`, `WalletBridgeRpcError`.

---

## 3. Cài đặt

Trong repo game dApp:

```bash
pnpm add @hydra-sdk/app-bridge
# hoặc
npm install @hydra-sdk/app-bridge
# hoặc
yarn add @hydra-sdk/app-bridge
```

---

## 4. Hướng dẫn sử dụng

### 4.1 Trong Vue 3 / Nuxt 3 (Khuyến nghị cho Nuxt Game)

Sử dụng subpath import `@hydra-sdk/app-bridge/vue`:

```typescript
// composables/useWalletExtension.ts
import { useWalletBridgeClient } from '@hydra-sdk/app-bridge/vue'

export const useWalletExtension = () => {
	const config = useRuntimeConfig()
	const appCenterOrigin = config.public.APP_CENTER_ORIGIN || '*'

	const bridge = useWalletBridgeClient({
		appCenterOrigin,
		timeoutMs: 60000,
		debug: process.env.NODE_ENV !== 'production'
	})

	return {
		...bridge
	}
}
```

Trong component Vue:

```vue
<script setup lang="ts">
	import { useWalletBridgeClient } from '@hydra-sdk/app-bridge/vue'

	const {
		isConnected,
		walletAddressBech32,
		shortAddress,
		isMainnet,
		isTestnet,
		requestConnect,
		getChangeAddress,
		getBalance,
		getCollateral,
		getRewardAddresses,
		signData,
		signTx,
		getUtxos,
		submitTx,
		parseUtxoAssets,
		storage
	} = useWalletBridgeClient()

	async function handleLogin() {
		const address = await getChangeAddress()
		if (!address) return

		// Lấy challenge từ Game Backend
		const { challenge } = await $fetch('/api/auth/challenge', { method: 'POST' })

		// Ký challenge qua Bridge Host (App Center gọi CIP-30 extension popup)
		const signResult = await signData(address, challenge)
		if (!signResult) return

		// Xác thực và nhận JWT
		const { token } = await $fetch('/api/auth/verify', {
			method: 'POST',
			body: {
				address,
				signature: signResult.signature,
				key: signResult.key
			}
		})

		// Lưu token an toàn bằng DualStorage (chống Safari ITP xóa session)
		storage.setItem('game_access_token', token)
	}

	async function handleCheckAssets() {
		const utxos = await getUtxos()
		const { balanceADA, assets } = parseUtxoAssets(utxos)
		console.log(`Số dư: ${balanceADA} ADA`, assets)
	}
</script>

<template>
	<div>
		<div v-if="isConnected">
			<p>Địa chỉ ví: {{ shortAddress }} ({{ walletAddressBech32 }})</p>
			<p>Mạng: {{ isMainnet ? 'Mainnet' : 'Preprod/Testnet' }}</p>
			<button @click="handleLogin">Đăng nhập Game</button>
			<button @click="handleCheckAssets">Kiểm tra tài sản</button>
		</div>
		<div v-else>
			<p>Ví chưa kết nối.</p>
			<!-- Chủ động yêu cầu App Center Host mở modal kết nối ví -->
			<button @click="requestConnect">Kết nối Ví</button>
		</div>
	</div>
</template>
```

---

### 4.2 Trong TypeScript thuần / React / Phaser Game

Import từ root package `@hydra-sdk/app-bridge` (không kéo theo dependency Vue):

```typescript
import {
	WalletBridgeClient,
	WalletBridgeUserRejectedError,
	WalletBridgeTimeoutError
} from '@hydra-sdk/app-bridge'

const client = new WalletBridgeClient({
	appCenterOrigin: 'https://hydraone.app',
	timeoutMs: 60000,
	debug: true,
	// Tùy chọn mock cho dev standalone ngoài iframe:
	mock:
		process.env.NODE_ENV === 'development' && !window.parent
			? {
					address: 'addr_test1qz2fxv2um5tjaq62synchronized',
					networkId: 0
				}
			: undefined
})

// Lắng nghe sự kiện từ App Center Host
client.on('connected', ({ address, networkId }) => {
	console.log('Ví đã kết nối:', address, networkId)
})

client.on('accountChanged', newAddress => {
	console.log('User đổi tài khoản ví:', newAddress)
	client.storage.removeItem('game_access_token')
})

client.on('networkChanged', newNetworkId => {
	console.log('User đổi mạng:', newNetworkId)
})

client.on('disconnected', () => {
	console.log('Ví đã ngắt kết nối')
})

// Thực hiện ký Transaction với typed error handling
try {
	const txHash = await client.signTx(txCborHex)
} catch (err) {
	if (err instanceof WalletBridgeUserRejectedError) {
		console.log('Người dùng đã hủy ký trên popup ví')
	} else if (err instanceof WalletBridgeTimeoutError) {
		console.warn('Thời gian ký đã hết hạn')
	}
}
```

---

## 5. Đặc tả Wallet Bridge Protocol

### 5.1 Request Types (Game dApp → App Center)

| Request Type                  | Payload                                                        | Mô tả                                     |
| :---------------------------- | :------------------------------------------------------------- | :---------------------------------------- |
| `WALLET_CONNECT`              | `{ type: 'WALLET_CONNECT', requestId }`                        | Yêu cầu Host mở modal kết nối ví          |
| `WALLET_GET_ADDRESS`          | `{ type: 'WALLET_GET_ADDRESS', requestId: string }`            | Lấy địa chỉ Bech32 đang active            |
| `WALLET_GET_USED_ADDRESSES`   | `{ type: 'WALLET_GET_USED_ADDRESSES', requestId }`             | Lấy danh sách địa chỉ đã sử dụng (CIP-30) |
| `WALLET_GET_REWARD_ADDRESSES` | `{ type: 'WALLET_GET_REWARD_ADDRESSES', requestId }`           | Lấy Stake Address (`stake1...`)           |
| `WALLET_GET_BALANCE`          | `{ type: 'WALLET_GET_BALANCE', requestId }`                    | Lấy tổng số dư Value CBOR hex             |
| `WALLET_GET_COLLATERAL`       | `{ type: 'WALLET_GET_COLLATERAL', requestId, amount? }`        | Lấy UTxO collateral cho Plutus/Hydra      |
| `WALLET_SIGN_DATA`            | `{ type: 'WALLET_SIGN_DATA', requestId, address, hexPayload }` | Ký CIP-8 / CIP-30 challenge payload       |
| `WALLET_SIGN_TX`              | `{ type: 'WALLET_SIGN_TX', requestId, txHex, partialSign? }`   | Ký Cardano Transaction CBOR               |
| `WALLET_GET_UTXOS`            | `{ type: 'WALLET_GET_UTXOS', requestId, amount? }`             | Lấy danh sách UTxOs                       |
| `WALLET_GET_NETWORK`          | `{ type: 'WALLET_GET_NETWORK', requestId }`                    | Lấy Network ID (0 = Testnet, 1 = Mainnet) |
| `WALLET_SUBMIT_TX`            | `{ type: 'WALLET_SUBMIT_TX', requestId, txHex }`               | Submit transaction lên chain L1           |
| `WALLET_PING`                 | `{ type: 'WALLET_PING', requestId }`                           | Ping kiểm tra Host bridge readiness       |

### 5.2 Response Types (App Center → Game dApp)

Mọi phản hồi đều chứa `requestId` tương ứng để client khớp `Promise`:

- `WALLET_CONNECT_RESULT`: `{ result: { address: string; networkId: number } | null, error?: string }`
- `WALLET_ADDRESS_RESULT`: `{ result: string | null, error?: string }`
- `WALLET_GET_USED_ADDRESSES_RESULT`: `{ result: string[] | null, error?: string }`
- `WALLET_GET_REWARD_ADDRESSES_RESULT`: `{ result: string[] | null, error?: string }`
- `WALLET_GET_BALANCE_RESULT`: `{ result: string | null, error?: string }`
- `WALLET_GET_COLLATERAL_RESULT`: `{ result: unknown[] | null, error?: string }`
- `WALLET_SIGN_DATA_RESULT`: `{ result: { signature: string; key: string } | null, error?: string }`
- `WALLET_SIGN_TX_RESULT`: `{ result: string | null, error?: string }`
- `WALLET_GET_UTXOS_RESULT`: `{ result: unknown[] | null, error?: string }`
- `WALLET_NETWORK_RESULT`: `{ result: number | null, error?: string }`
- `WALLET_SUBMIT_TX_RESULT`: `{ result: string | null, error?: string }`
- `WALLET_PONG`: `{ result: { version: string; isConnected: boolean; address?: string; networkId?: number }, error?: string }`

### 5.3 Push Events (App Center → Game dApp)

Không có `requestId`, gửi tự động khi trạng thái ví ở Host thay đổi:

- `WALLET_CONNECTED`: `{ address: string, networkId: number }`
- `WALLET_ACCOUNT_CHANGED`: `{ address: string }`
- `WALLET_NETWORK_CHANGED`: `{ networkId: number }`
- `WALLET_DISCONNECTED`: `{}`

---

## 6. License

Apache-2.0
