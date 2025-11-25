# @hydra-sdk/bridge

Thư viện bridge toàn diện để kết nối và tương tác với Hydra Node trong hệ sinh thái Cardano. Package này cung cấp các công cụ cần thiết để quản lý Hydra Head, thực hiện giao dịch và theo dõi trạng thái của Hydra network với xử lý sự kiện real-time.

## 🚀 Tính năng chính

- **Nhiều loại kết nối**: Hỗ trợ kết nối qua WebSocket và Socket.IO
- **Vòng đời Hydra Head**: Quản lý hoàn chỉnh các trạng thái Hydra Head (Init, Open, Close, Abort, Fanout)
- **Xử lý giao dịch**: Gửi, theo dõi và xác thực giao dịch trong Hydra Head
- **Sự kiện real-time**: Hệ thống event toàn diện để theo dõi trạng thái Hydra network
- **Quản lý UTxO**: Truy vấn và quản lý UTxO trong snapshot với lọc theo địa chỉ
- **Protocol Parameters**: Tự động lấy và quản lý protocol parameters của Cardano
- **Commit/Decommit**: Hỗ trợ chuyển tiền vào và ra khỏi Hydra Head
- **Xác thực**: Hỗ trợ sẵn xác thực dựa trên JWT

## 📦 Cài đặt

```bash
npm install @hydra-sdk/bridge
# hoặc
pnpm add @hydra-sdk/bridge
# hoặc
yarn add @hydra-sdk/bridge
```

## 🏗️ Kiến trúc

### Core Components

#### 1. **HydraBridge**
Class chính để tương tác với Hydra Node:
- Quản lý kết nối và trạng thái
- Thực thi lệnh (Init, Close, Abort, Fanout, Contest, Recover)
- Gửi và theo dõi giao dịch
- Xử lý sự kiện và theo dõi trạng thái
- Truy vấn và quản lý UTxO

#### 2. **Connectors**
Nhiều loại connector cho các trường hợp sử dụng khác nhau:
- **WebsocketConnector**: Kết nối WebSocket trực tiếp đến Hydra Node
- **HexcoreConnector**: Kết nối qua Hexcore API với Socket.IO và xác thực

#### 3. **Hệ thống sự kiện**
Xử lý sự kiện toàn diện:
- **Sự kiện kết nối**: onConnected, onDisconnected, onConnectError
- **Sự kiện Hydra**: Cập nhật real-time từ Hydra Node
- **Loại thông điệp**: Hơn 20 loại thông điệp khác nhau để theo dõi trạng thái hoàn chỉnh

#### 4. **Types & Interfaces**
- **HydraPayload**: Hơn 20 định nghĩa loại thông điệp
- **HydraCommand**: Tất cả lệnh có sẵn (Init, Close, Abort, v.v.)
- **HydraHeadStatus**: Enum trạng thái Head (Idle, Initializing, Open, v.v.)
- **Transaction**: Cấu trúc giao dịch hoàn chỉnh với hỗ trợ CBOR
- **Protocol Parameters**: Các loại tham số protocol của Cardano

## 🚀 Sử dụng cơ bản

### Khởi tạo HydraBridge

```typescript
import { HydraBridge, HexcoreConnector } from '@hydra-sdk/bridge'

// Sử dụng WebSocket connector (kết nối trực tiếp)
const bridge = new HydraBridge({
  url: 'ws://localhost:4001',
  verbose: true
})

// Sử dụng HexcoreConnector với authentication
const hexcoreConnector = new HexcoreConnector({
  socketIoUrl: 'wss://rps-api.hexcore.io.vn/hydra',
  socketIoOptions: {
    auth: {
      token: 'your_jwt_token_here'
    }
  }
})

const bridge = new HydraBridge({
  connector: hexcoreConnector,
  verbose: true
})
```

### Kết nối và lắng nghe events

```typescript
// Kết nối đến Hydra Node
bridge.connect()

// Lắng nghe sự kiện
bridge.events.on('onConnected', async () => {
  console.log('Đã kết nối đến Hydra Node')

  // Lấy protocol parameters sau khi kết nối
  const protocolParams = await bridge.getProtocolParameters()
  console.log('Protocol Parameters:', protocolParams)
})

bridge.events.on('onMessage', (payload) => {
  console.log('Nhận thông điệp:', payload)

  switch (payload.tag) {
    case 'HeadIsOpen':
      console.log('Hydra Head đã mở')
      break
    case 'TxValid':
      console.log('Giao dịch hợp lệ:', payload.transactionId)
      break
    case 'SnapshotConfirmed':
      console.log('Snapshot đã được xác nhận')
      break
  }
})

bridge.events.on('onDisconnected', () => {
  console.log('Đã ngắt kết nối')
})

// Xử lý lỗi kết nối
bridge.events.on('onConnectError', (error) => {
  console.error('Lỗi kết nối:', error)
})
```

### Quản lý Hydra Head

```typescript
// Khởi tạo Hydra Head
bridge.commands.init()

// Đóng Hydra Head
bridge.commands.close()

// Abort Hydra Head
bridge.commands.abort()

// Fanout (rút tiền từ Head)
bridge.commands.fanout()

// Contest (tranh chấp)
bridge.commands.contest()

// Recover
bridge.commands.recover('tx_hash_here')
```

### Ví dụ hoàn chỉnh với tích hợp Wallet

```typescript
import { AppWallet, deserializeTx } from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'

// Khởi tạo HydraBridge với HexcoreConnector
const hexcoreConnector = new HexcoreConnector({
  socketIoUrl: 'wss://rps-api.hexcore.io.vn/hydra',
  socketIoOptions: {
    auth: {
      token: 'your_jwt_token_here'
    }
  }
})

const bridge = new HydraBridge({
  connector: hexcoreConnector,
  verbose: true
})

// Tạo wallet
const wallet = new AppWallet({
  networkId: 0, // 0 = testnet, 1 = mainnet
  key: {
    type: 'mnemonic',
    words: 'your mnemonic words here'.split(' ')
  }
})

// Lấy account
const account = wallet.getAccount(0, 0)

// Kết nối và xử lý sự kiện
bridge.connect()

bridge.events.on('onConnected', async () => {
  console.log('Đã kết nối đến Hydra Node')

  // Truy vấn UTxO cho địa chỉ cụ thể
  const addressUtxos = await bridge.queryAddressUTxO(account.baseAddressBech32)
  console.log('UTxO của địa chỉ:', addressUtxos)

  // Lấy tất cả địa chỉ trong head
  const addresses = bridge.addressesInHead()
  console.log('Địa chỉ trong Head:', addresses)

  // Lấy protocol parameters
  const protocolParams = await bridge.getProtocolParameters()

  // Tạo transaction builder cho Hydra
  const txBuilder = new TxBuilder({
    isHydra: true,
    params: protocolParams
  })

  // Xây dựng giao dịch
  const tx = await txBuilder
    .setInputs(addressUtxos)
    .addLovelaceOutput(account.baseAddressBech32, '1000000') // 1 ADA
    .setChangeAddress(account.baseAddressBech32)
    .complete()

  // Lấy transaction ID
  const txId = deserializeTx(tx.to_hex()).transaction_hash().to_hex()

  // Ký giao dịch
  const signedTx = await wallet.signTx(tx.to_hex(), false, 0, 0)

  // Gửi đến Hydra Head sử dụng submitTxSync
  try {
    const result = await bridge.submitTxSync({
      type: 'Witnessed Tx ConwayEra',
      description: 'Ledger Cddl Format',
      cborHex: signedTx,
      txId
    }, { timeout: 30000 })

    console.log('Giao dịch thành công:', result)
  } catch (error) {
    console.error('Giao dịch thất bại:', error)
  }
})

bridge.events.on('onMessage', (payload) => {
  console.log('Nhận thông điệp:', payload)
})

// Dọn dẹp khi unmount
bridge.events.on('onDisconnected', () => {
  console.log('Đã ngắt kết nối khỏi Hydra Node')
})
```

### Commit và Decommit

```typescript
// Commit UTxO vào Hydra Head
const commitData = {
  cborHex: '84a400818258...',
  description: 'Commit transaction'
}

try {
  const commitResult = await bridge.commit(commitData)
  console.log('Commit thành công:', commitResult)
} catch (error) {
  console.error('Commit thất bại:', error)
}

// Decommit UTxO từ Hydra Head
try {
  const decommitResult = await bridge.commands.decommit({
    cborHex: '84a400818258...',
    txHash: 'transaction_hash',
    timeout: 30000
  })
  console.log('Decommit thành công:', decommitResult)
} catch (error) {
  console.error('Decommit thất bại:', error)
}
```

## 📊 Truy vấn dữ liệu

### Protocol Parameters

```typescript
// Lấy protocol parameters
const protocolParams = await bridge.getProtocolParameters()
console.log('Protocol Parameters:', protocolParams)
```

### UTxO Management

```typescript
// Truy vấn snapshot UTxO
const utxoObject = await bridge.querySnapshotUtxo()
console.log('Snapshot UTxO:', utxoObject)

// Lấy UTxO array
const utxoArray = bridge.snapshotUtxoArray()
console.log('UTxO Array:', utxoArray)

// Truy vấn UTxO theo địa chỉ
const address = 'addr1...'
const addressUtxos = await bridge.queryAddressUTxO(address)
console.log('UTxOs của địa chỉ:', addressUtxos)

// Lấy danh sách địa chỉ trong Head
const addresses = bridge.addressesInHead()
console.log('Địa chỉ trong Head:', addresses)
```

### Trạng thái Head

```typescript
// Kiểm tra trạng thái kết nối
console.log('Đã kết nối:', bridge.connected())

// Lấy thông tin Head (phương thức async)
const headInfo = await bridge.headInfo()
console.log('Head Info:', headInfo)
console.log('Head Status:', headInfo.headStatus)
console.log('Head ID:', headInfo.headId)
console.log('VKey:', headInfo.vkey)

// Các trạng thái Head có sẵn:
// - Idle: Head chưa được khởi tạo
// - Initializing: Head đang được thiết lập
// - Open: Head đang hoạt động và sẵn sàng cho giao dịch
// - Closed: Head đã đóng nhưng chưa hoàn tất
// - FanoutPossible: Sẵn sàng cho fanout
// - Final: Head đã hoàn tất hoàn toàn
```

## 🔧 Cấu hình nâng cao

### Custom Connector

```typescript
import { HydraConnector, HydraBridgeFetcher, HydraBridgeSubmitter } from '@hydra-sdk/bridge'

class CustomConnector implements HydraConnector {
  // Implement interface methods
  connect() { /* custom logic */ }
  disconnect() { /* custom logic */ }
  connected() { /* custom logic */ }
  sendCommand(data) { /* custom logic */ }
  // ... other methods
}

const bridge = new HydraBridge({
  connector: new CustomConnector(),
  verbose: true
})
```

### Custom Fetcher và Submitter

```typescript
import { HexcoreConnector } from '@hydra-sdk/bridge'

const customFetcher = {
  queryRawProtocolParameters: async () => {
    // Custom implementation
    return await fetch('/api/protocol-parameters').then(r => r.json())
  },
  querySnapshotUtxo: async () => {
    // Custom implementation
    return await fetch('/api/snapshot/utxo').then(r => r.json())
  }
}

const customSubmitter = {
  commit: async (data) => {
    // Custom implementation
    return await fetch('/api/commit', {
      method: 'POST',
      body: JSON.stringify(data)
    }).then(r => r.json())
  },
  submitCardanoTx: async (data) => {
    // Custom implementation
    return await fetch('/api/submit-tx', {
      method: 'POST',
      body: JSON.stringify(data)
    }).then(r => r.json())
  }
}

const connector = new HexcoreConnector({
  socketIoUrl: 'wss://your-hydra-api.com/hydra',
  fetcher: customFetcher,
  submitter: customSubmitter,
  socketIoOptions: {
    auth: {
      token: 'your_auth_token'
    }
  }
})
```

## 🔄 Quản lý Lifecycle

### Quản lý kết nối đúng cách

```typescript
// Ví dụ Vue.js
import { ref, onMounted, onBeforeUnmount } from 'vue'

export default {
  setup() {
    const bridge = ref<HydraBridge | null>(null)

    onMounted(async () => {
      // Dọn dẹp kết nối hiện tại
      if (bridge.value) {
        bridge.value.disconnect()
        bridge.value = null
      }

      // Tạo kết nối mới
      const connector = new HexcoreConnector({
        socketIoUrl: 'wss://your-api.com/hydra',
        socketIoOptions: {
          auth: { token: 'your_token' }
        }
      })

      bridge.value = new HydraBridge({ connector })
      bridge.value.connect()
    })

    onBeforeUnmount(() => {
      // Luôn dọn dẹp khi component unmount
      if (bridge.value) {
        bridge.value.disconnect()
        bridge.value = null
      }
    })

    return { bridge }
  }
}
```

### Ví dụ React.js

```typescript
import { useEffect, useState } from 'react'

function useHydraBridge() {
  const [bridge, setBridge] = useState<HydraBridge | null>(null)

  useEffect(() => {
    const connector = new HexcoreConnector({
      socketIoUrl: 'wss://your-api.com/hydra',
      socketIoOptions: {
        auth: { token: 'your_token' }
      }
    })

    const newBridge = new HydraBridge({ connector })
    newBridge.connect()
    setBridge(newBridge)

    // Cleanup function
    return () => {
      newBridge.disconnect()
      setBridge(null)
    }
  }, [])

  return bridge
}
```

## 📝 Event Types

### Connection Events
- `onConnected`: Khi kết nối thành công
- `onDisconnected`: Khi ngắt kết nối
- `onConnectError`: Khi có lỗi kết nối

### Hydra Events
- `onMessage`: Nhận thông điệp từ Hydra Node với payload có kiểu dữ liệu

### Các loại thông điệp đầy đủ (HydraHeadTag)

#### Sự kiện Head chính
- `Greetings`: Chào hỏi ban đầu với thông tin head và snapshot
- `HeadIsInitializing`: Bắt đầu khởi tạo Head
- `HeadIsOpen`: Head đã mở và sẵn sàng cho giao dịch
- `HeadIsClosed`: Head đã được đóng
- `HeadIsContested`: Trạng thái Head đang bị tranh chấp
- `HeadIsAborted`: Khởi tạo Head đã bị hủy bỏ
- `HeadIsFinalized`: Head đã hoàn tất hoàn toàn
- `ReadyToFanout`: Head sẵn sàng cho quá trình fanout

#### Sự kiện giao dịch
- `TxValid`: Giao dịch hợp lệ và được chấp nhận
- `TxInvalid`: Giao dịch không hợp lệ với lỗi xác thực
- `SnapshotConfirmed`: Snapshot mới đã được xác nhận
- `InvalidInput`: Input không hợp lệ được nhận
- `PostTxOnChainFailed`: Gửi giao dịch on-chain thất bại

#### Sự kiện Peer
- `PeerConnected`: Peer mới kết nối đến head
- `PeerDisconnected`: Peer ngắt kết nối khỏi head
- `PeerHandshakeFailure`: Handshake với peer thất bại

#### Sự kiện Commit/Decommit
- `CommitRecorded`: Giao dịch commit đã được ghi nhận
- `CommitApproved`: Commit đã được phê duyệt
- `CommitFinalized`: Quá trình commit hoàn tất
- `CommitRecovered`: Commit được khôi phục sau lỗi
- `CommitIgnored`: Commit bị bỏ qua
- `DecommitInvalid`: Giao dịch decommit không hợp lệ
- `DecommitRequested`: Decommit đã được yêu cầu
- `DecommitApproved`: Decommit đã được phê duyệt
- `DecommitFinalized`: Quá trình decommit hoàn tất

#### Sự kiện hệ thống
- `CommandFailed`: Thực thi lệnh thất bại
- `IgnoredHeadInitializing`: Khởi tạo Head bị bỏ qua
- `GetUTxOResponse`: Phản hồi truy vấn UTxO (deprecated)

## 📚 Tài liệu API

### Class HydraBridge

#### Constructor
```typescript
new HydraBridge(options: InitHydraBridgeOptions)
```

#### Phương thức
- `connect()`: Thiết lập kết nối đến Hydra Node
- `disconnect()`: Đóng kết nối
- `connected()`: Kiểm tra trạng thái kết nối
- `headInfo()`: Lấy thông tin head hiện tại (async)
- `getProtocolParameters()`: Lấy protocol parameters
- `querySnapshotUtxo()`: Lấy UTxO snapshot hiện tại (tự động gọi khi kết nối)
- `queryAddressUTxO(address: string)`: Lấy UTxO cho địa chỉ cụ thể
- `snapshotUtxoArray()`: Chuyển đổi snapshot thành mảng UTxO
- `addressesInHead()`: Lấy tất cả địa chỉ trong head hiện tại
- `commit(data: CommitBody)`: Commit UTxO vào head
- `submitCardanoTransaction(data: SubmitTxBody)`: Gửi giao dịch đến Cardano
- `submitTxSync(tx: Transaction, options?)`: Gửi và đợi xác nhận

#### Thuộc tính
- `events`: Event emitter để lắng nghe sự kiện Hydra
- `commands`: Object chứa tất cả lệnh Hydra

#### Lệnh
- `commands.init()`: Khởi tạo Hydra Head mới
- `commands.close()`: Đóng Hydra Head hiện tại
- `commands.abort()`: Hủy bỏ khởi tạo Hydra Head
- `commands.fanout()`: Thực hiện quá trình fanout
- `commands.contest()`: Tranh chấp trạng thái head hiện tại
- `commands.recover(txId: string)`: Khôi phục từ trạng thái lỗi
- `commands.newTx(cborHex: string, description?: string)`: Gửi giao dịch mới
- `commands.decommit(payload)`: Decommit UTxO từ head

### Types

#### InitHydraBridgeOptions
```typescript
type InitHydraBridgeOptions = {
  verbose?: boolean
} & (
  | { url: string } // WebSocket URL
  | { connector: HydraConnector } // Custom connector
)
```

#### Transaction
```typescript
interface Transaction {
  txId: string
  cborHex: string
  description: string
  type: 'Witnessed Tx ConwayEra'
}
```

## 🧪 Testing

```bash
# Chạy tests
pnpm test

# Chạy tests với watch mode
pnpm test:watch

# Update snapshots
pnpm test:u
```

## 🔗 Dependencies

- `@hydra-sdk/core`: Core wallet functionality
- `@hydra-sdk/cardano-wasm`: Cardano WASM bindings
- `socket.io-client`: Socket.IO client
- `axios`: HTTP client
- `mitt`: Event emitter
- `lodash-es`: Utility functions
- `bip39`: BIP39 mnemonic

## 📄 License

Apache 2.0 License - xem file [LICENSE](../../LICENSE) để biết thêm chi tiết.

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Tạo Pull Request

## 🔗 Links

- [Hydra Documentation](https://hydra.family/head-protocol/)
- [Cardano Developer Portal](https://developers.cardano.org/)
- [Hydra Node API](https://hydra.family/head-protocol/api-reference/)

---

**@hydra-sdk/bridge** - Kết nối và tương tác với Hydra Node một cách dễ dàng và hiệu quả.
