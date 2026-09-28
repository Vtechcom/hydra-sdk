# HydraOne Game SDK — Kiến Trúc & Tài Liệu Triển Khai Toàn Diện

> **Package:** `@hydra-sdk/app-bridge`  
> **Phiên bản:** `0.1.0`  
> **Tác giả:** Hydra SDK Core Team  
> **Cập nhật:** 2026-09-25

---

## 1. Tổng Quan & Định Vị Hệ Sinh Thái

### 1.1 Bối cảnh kiến trúc Micro-frontend

Hệ sinh thái **HydraOne** áp dụng kiến trúc Micro-frontend:

- **App Center Shell (`hydraone.app`)**: Quản lý xác thực ví Web3 người dùng qua Browser Extension (Eternl, Lace, Nami, Flint) theo chuẩn CIP-30.
- **Game dApps (`*.hydraone.app` hoặc 3rd-Party Domains)**: Các ứng dụng trò chơi (HTML5, Phaser, PixiJS, Unity WebGL, React, Vue/Nuxt) chạy độc lập bên trong thẻ `<iframe>` cross-origin.

### 1.2 Rào cản kỹ thuật

Theo **Same-Origin Policy** của trình duyệt:

1. Browser Extension **không thể trực tiếp inject** đối tượng `window.cardano` vào trong các cross-origin iframe.
2. Trình duyệt Safari (iOS / macOS) với cơ chế **ITP (Intelligent Tracking Prevention)** và Storage Partitioning thường xuyên **chặn hoặc xóa `localStorage`** bên trong iframe.
3. Nhà phát triển game bên thứ ba (3rd-party developers) **không có quyền truy cập mã nguồn App Center**, do đó cần một bộ công cụ giả lập (Simulator) để phát triển và kiểm thử game độc lập trên máy local (`localhost`).

### 1.3 Vai trò của `@hydra-sdk/app-bridge`

Package `@hydra-sdk/app-bridge` là **bộ SDK chính thức duy nhất** kết nối toàn diện giữa Game dApp và App Center Shell, chịu trách nhiệm:

- Cầu nối giao tiếp hai chiều bảo mật qua **`window.postMessage` RPC Protocol**.
- Cơ chế lưu trữ **DualStorage** chống Safari ITP.
- Quản lý vòng đời trò chơi (**Game Lifecycle**: `GAME_READY`, `REQUEST_FULLSCREEN`, `EXIT_GAME`).
- Cung cấp **In-Page DevTools & Simulator** giúp lập trình viên dev game không cần App Center.

---

## 2. Kiến Trúc Đóng Gói (Package Architecture)

Package được tổ chức theo chuẩn **Subpath Exports** hiện đại để tối ưu kích thước bundle và hỗ trợ đa nền tảng:

```
@hydra-sdk/app-bridge
├── . (Root Export) ───────── Core TypeScript thuần, Zero-dependency (React, Phaser, PixiJS, Unity WebGL, Node)
├── ./vue ─────────────────── Composable chuyên biệt cho Vue 3 & Nuxt 3 (useWalletBridgeClient / useGameBridge)
└── ./simulator ───────────── In-Page Floating DevTools & MockBridgeHost (cho Local Dev & Automated Testing)
```

### 2.1 Ma trận Entrypoint trong `package.json`

```json
{
	"name": "@hydra-sdk/app-bridge",
	"exports": {
		".": {
			"types": "./dist/index.d.ts",
			"import": "./dist/index.mjs",
			"require": "./dist/index.js"
		},
		"./vue": {
			"types": "./dist/vue.d.ts",
			"import": "./dist/vue.mjs",
			"require": "./dist/vue.js"
		},
		"./package.json": "./package.json"
	}
}
```

> **Nguyên tắc bảo vệ Bundle:** Entrypoint root `.` tuyệt đối **không import Vue**. Lập trình viên React, Phaser hoặc Vanilla TS khi cài đặt package sẽ không bị lỗi thiếu module `vue`, giữ dung lượng client siêu nhẹ (< 20KB).

---

## 3. Đặc Tả Giao Thức (Protocol Specification)

### 3.1 Ma trận Request / Response Types (Game ↔ App Center)

| Request Type (Game → Host)    | Payload                                                        | Response Type (Host → Game)          | Ý nghĩa / Ứng dụng trong Game                     |
| :---------------------------- | :------------------------------------------------------------- | :----------------------------------- | :------------------------------------------------ |
| `WALLET_CONNECT`              | `{ type: 'WALLET_CONNECT', requestId }`                        | `WALLET_CONNECT_RESULT`              | Game chủ động yêu cầu Host bật modal kết nối ví   |
| `WALLET_GET_ADDRESS`          | `{ type: 'WALLET_GET_ADDRESS', requestId }`                    | `WALLET_ADDRESS_RESULT`              | Lấy địa chỉ ví Bech32 active (`addr1...`)         |
| `WALLET_GET_USED_ADDRESSES`   | `{ type: 'WALLET_GET_USED_ADDRESSES', requestId }`             | `WALLET_GET_USED_ADDRESSES_RESULT`   | Lấy danh sách địa chỉ đã sử dụng (CIP-30)         |
| `WALLET_GET_REWARD_ADDRESSES` | `{ type: 'WALLET_GET_REWARD_ADDRESSES', requestId }`           | `WALLET_GET_REWARD_ADDRESSES_RESULT` | Lấy Stake Address (`stake1...`) định danh user    |
| `WALLET_GET_BALANCE`          | `{ type: 'WALLET_GET_BALANCE', requestId }`                    | `WALLET_GET_BALANCE_RESULT`          | Lấy tổng số dư CBOR Value hex (Lovelace + Token)  |
| `WALLET_GET_COLLATERAL`       | `{ type: 'WALLET_GET_COLLATERAL', requestId, amount? }`        | `WALLET_GET_COLLATERAL_RESULT`       | Lấy UTxO ký quỹ Plutus / Hydra Head Commit        |
| `WALLET_GET_UTXOS`            | `{ type: 'WALLET_GET_UTXOS', requestId, amount? }`             | `WALLET_GET_UTXOS_RESULT`            | Lấy danh sách UTxOs của ví                        |
| `WALLET_SIGN_DATA`            | `{ type: 'WALLET_SIGN_DATA', requestId, address, hexPayload }` | `WALLET_SIGN_DATA_RESULT`            | Ký challenge CIP-8 / CIP-30 để lấy JWT Token      |
| `WALLET_SIGN_TX`              | `{ type: 'WALLET_SIGN_TX', requestId, txHex, partialSign? }`   | `WALLET_SIGN_TX_RESULT`              | Ký transaction Cardano CBOR                       |
| `WALLET_SUBMIT_TX`            | `{ type: 'WALLET_SUBMIT_TX', requestId, txHex }`               | `WALLET_SUBMIT_TX_RESULT`            | Broadcast transaction đã ký lên L1 Cardano        |
| `WALLET_GET_NETWORK`          | `{ type: 'WALLET_GET_NETWORK', requestId }`                    | `WALLET_NETWORK_RESULT`              | Lấy Network ID (0 = Preprod, 1 = Mainnet)         |
| `WALLET_PING`                 | `{ type: 'WALLET_PING', requestId }`                           | `WALLET_PONG`                        | Handshake kiểm tra trạng thái và version của Host |

### 3.2 Push Events (App Center → Game, Không có `requestId`)

- `WALLET_CONNECTED`: `{ type: 'WALLET_CONNECTED', address: string, networkId: number }`
- `WALLET_ACCOUNT_CHANGED`: `{ type: 'WALLET_ACCOUNT_CHANGED', address: string }`
- `WALLET_NETWORK_CHANGED`: `{ type: 'WALLET_NETWORK_CHANGED', networkId: number }`
- `WALLET_DISCONNECTED`: `{ type: 'WALLET_DISCONNECTED' }`

### 3.3 Game Lifecycle Protocol (Mở rộng cho 3rd-Party)

- `GAME_READY`: Game thông báo đã load xong tài nguyên, App Center ẩn skeleton loader.
- `GET_CONTEXT`: Nhận theme (`dark`/`light`), locale (`vi`/`en`), thiết bị (`mobile`/`desktop`).
- `REQUEST_FULLSCREEN`: Yêu cầu App Center phóng to iframe toàn màn hình.
- `EXIT_GAME`: Người chơi chọn thoát game, App Center chuyển hướng về `/games` sảnh chính.

---

## 4. Luồng Nghiệp Vụ Chuẩn (Sequence Diagrams)

### 4.1 Luồng Khởi tạo & Xác thực Đăng nhập (Web3 Auth Flow)

```
Game (iframe)              App Center Host (Shell)         Game Backend
     │                                │                          │
     │── WALLET_PING ────────────────▶│                          │
     │◀── WALLET_PONG { ok } ─────────│                          │
     │                                │                          │
     │── WALLET_GET_ADDRESS ─────────▶│                          │
     │◀── WALLET_ADDRESS_RESULT ──────│                          │
     │                                │                          │
     │── POST /api/auth/challenge ──────────────────────────────▶│
     │◀── { nonce: "0x123..." } ─────────────────────────────────│
     │                                │                          │
     │── WALLET_SIGN_DATA (nonce) ───▶│                          │
     │                                │── CIP-30 popup (Eternl)  │
     │                                │◀── { signature, key }    │
     │◀── WALLET_SIGN_DATA_RESULT ────│                          │
     │                                │                          │
     │── POST /api/auth/verify (sig, key) ──────────────────────▶│
     │◀── { token: "JWT..." } ───────────────────────────────────│
     │                                │                          │
     │  [DualStorage.setItem(JWT)]    │                          │
     │  [Game bắt đầu chơi độc lập]   │                          │
```

---

## 5. Cơ Chế Lưu Trữ DualStorage (Khắc Phục Safari ITP)

### 5.1 Vấn đề của Safari ITP

Trong các iframe cross-origin, Safari trên iOS/iPadOS chặn quyền truy cập `window.localStorage` (ném `SecurityError: The operation is insecure`). Nếu code gọi trực tiếp `localStorage.getItem()`, dApp sẽ crash toàn bộ.

### 5.2 Giải pháp cải tiến trong `@hydra-sdk/app-bridge`

1. **In-Memory Fallback Tự Động**: Khi `localStorage` bị chặn, tự động chuyển sang lưu trên RAM (`Map<string, string>`) trong suốt session chơi mà không ném lỗi.
2. **Key Prefix Isolation (`hydra:`)**:
   Mọi key lưu vào storage đều có tiền tố (ví dụ `hydra:game_token`).
3. **An toàn tuyệt đối khi `clear()`**:
   ```typescript
   // Chỉ quét và xóa các key có tiền tố 'hydra:'
   // Tuyệt đối không xóa nhầm setting âm thanh, high score... của Game origin
   storage.clear()
   ```
4. **Chống khóa vĩnh viễn khi `QuotaExceeded`**:
   Nếu một lần ghi bị đầy bộ nhớ, SDK ghi giá trị vào RAM nhưng **vẫn duy trì quyền đọc** cho các key đã lưu trước đó.

---

## 6. Hướng Dẫn Tích Hợp Cho Nhà Phát Triển Game

### 6.1 Sử dụng trong Vue 3 / Nuxt 3

```typescript
// composables/useWalletExtension.ts
import { useWalletBridgeClient } from '@hydra-sdk/app-bridge/vue'

export const useWalletExtension = () => {
	const config = useRuntimeConfig()
	const appCenterOrigin = config.public.APP_CENTER_ORIGIN || '*'

	return useWalletBridgeClient({
		appCenterOrigin,
		timeoutMs: 60000,
		debug: process.env.NODE_ENV !== 'production'
	})
}
```

```vue
<!-- components/GameHeader.vue -->
<script setup lang="ts">
	import { useWalletBridgeClient } from '@hydra-sdk/app-bridge/vue'

	const {
		isConnected,
		shortAddress,
		isMainnet,
		balanceADA,
		requestConnect,
		getUtxos,
		parseUtxoAssets
	} = useWalletBridgeClient()

	async function checkBalance() {
		const utxos = await getUtxos()
		const { balanceADA, assets } = parseUtxoAssets(utxos)
		console.log('ADA:', balanceADA, 'Tokens:', assets)
	}
</script>

<template>
	<div class="game-header">
		<div v-if="isConnected">
			<span>Ví: {{ shortAddress }}</span>
			<span class="badge">{{ isMainnet ? 'Mainnet' : 'Preprod' }}</span>
			<button @click="checkBalance">Kiểm tra số dư</button>
		</div>
		<div v-else>
			<button @click="requestConnect">Kết nối ví App Center</button>
		</div>
	</div>
</template>
```

### 6.2 Sử dụng trong TypeScript thuần / React / Phaser / PixiJS

```typescript
import {
	WalletBridgeClient,
	WalletBridgeUserRejectedError,
	WalletBridgeTimeoutError
} from '@hydra-sdk/app-bridge'

const client = new WalletBridgeClient({
	appCenterOrigin: 'https://hydraone.app',
	timeoutMs: 60000,
	debug: true
})

// Lắng nghe trạng thái
client.on('connected', ({ address, networkId }) => {
	console.log('Ví kết nối:', address, networkId)
})

client.on('accountChanged', newAddress => {
	console.log('Đổi tài khoản:', newAddress)
	client.storage.removeItem('game_jwt')
})

// Ký giao dịch với Typed Error Handling
try {
	const signedTx = await client.signTx(txHex)
} catch (err) {
	if (err instanceof WalletBridgeUserRejectedError) {
		alert('Người dùng đã bấm hủy trên popup ví!')
	} else if (err instanceof WalletBridgeTimeoutError) {
		alert('Hết thời gian chờ xác nhận!')
	}
}
```

---

## 7. Chế Độ Dev Standalone & Simulator

### 7.1 Mock Mode (Không cần iframe)

Lập trình viên game có thể chạy `http://localhost:5173` độc lập mà không cần mở App Center:

```typescript
const client = new WalletBridgeClient({
	mock:
		process.env.NODE_ENV === 'development' && !window.parent
			? {
					address: 'addr_test1qz2fxv2um5tjaq62synchronized',
					networkId: 0,
					balance: '150000000', // 150 ADA
					rewardAddresses: ['stake_test1uqz2fxv2um5tjaq62']
				}
			: undefined
})
```

---

## 8. Hướng Dẫn Đồng Bộ Phía App Center Host (`hydraone-web-client`)

Để hỗ trợ đầy đủ các tính năng mới của Game SDK, file `composables/useWalletBridgeHost.ts` trên Host cần bổ sung các case xử lý sau vào khối `switch (type)`:

```typescript
// Trong handleWalletRequest(request, source, origin) của useWalletBridgeHost.ts:

case 'WALLET_SUBMIT_TX': {
  try {
    const txHash = await wallet.submitTx(request.txHex)
    sendResponse(source, origin, {
      type: 'WALLET_SUBMIT_TX_RESULT',
      requestId,
      result: txHash
    })
  } catch (err) {
    sendResponse(source, origin, {
      type: 'WALLET_SUBMIT_TX_RESULT',
      requestId,
      result: null,
      error: err instanceof Error ? err.message : 'Submit failed'
    })
  }
  break
}

case 'WALLET_CONNECT': {
  try {
    // Mở modal kết nối ví trên Shell
    await wallet.connectToExtension()
    sendResponse(source, origin, {
      type: 'WALLET_CONNECT_RESULT',
      requestId,
      result: {
        address: wallet.walletAddressBech32.value!,
        networkId: (await wallet.getNetworkId()) ?? 0
      }
    })
  } catch (err) {
    sendResponse(source, origin, {
      type: 'WALLET_CONNECT_RESULT',
      requestId,
      result: null,
      error: 'User cancelled wallet connection'
    })
  }
  break
}

case 'WALLET_GET_BALANCE': {
  try {
    // Lấy balance CBOR từ extension
    const balance = await wallet.activeWalletExtension.value?.getBalance()
    sendResponse(source, origin, {
      type: 'WALLET_GET_BALANCE_RESULT',
      requestId,
      result: balance ?? null
    })
  } catch (err) {
    sendResponse(source, origin, {
      type: 'WALLET_GET_BALANCE_RESULT',
      requestId,
      result: null,
      error: 'Failed to get balance'
    })
  }
  break
}

case 'WALLET_GET_COLLATERAL': {
  try {
    const collateral = await wallet.activeWalletExtension.value?.getCollateral(request.amount ? { amount: request.amount } : undefined)
    sendResponse(source, origin, {
      type: 'WALLET_GET_COLLATERAL_RESULT',
      requestId,
      result: collateral ?? null
    })
  } catch (err) {
    sendResponse(source, origin, {
      type: 'WALLET_GET_COLLATERAL_RESULT',
      requestId,
      result: null,
      error: 'Failed to get collateral'
    })
  }
  break
}

case 'WALLET_PING': {
  sendResponse(source, origin, {
    type: 'WALLET_PONG',
    requestId,
    result: {
      version: '0.1.0',
      isConnected: wallet.isConnected.value,
      address: wallet.walletAddressBech32.value,
      networkId: wallet.networkId
    }
  })
  break
}
```

---

## 9. Lộ Trình Phát Triển Tiếp Theo (Roadmap)

1. **v0.2.0**: Bổ sung export subpath `@hydra-sdk/app-bridge/simulator` với giao diện Floating DevTools widget.
2. **v0.3.0**: Cung cấp plugin `HydraBridge.jslib` chính thức cho các tựa game xây dựng bằng **Unity WebGL** và **Godot Engine**.
3. **v0.4.0**: Xây dựng CLI scaffolding `npx @hydra-sdk/create-game` với các starter templates: Vue 3, React, Phaser 3, Unity.
4. **v1.0.0**: Ra mắt **Developer Portal** chính thức tại `dev.hydraone.app`, hỗ trợ đăng ký `appId` và xác thực domain game tự động qua DNS TXT record.
