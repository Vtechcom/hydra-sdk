# Làm Việc với Utilities

Hướng dẫn sử dụng utilities từ actual patterns trong `nodejs-playground`.

## Bắt Đầu

```typescript
import { 
  DatumUtils,
  ParserUtils,
  PolicyUtils,
  TimeUtils,
  SLOT_CONFIG_NETWORK,
  Serializer,
  Deserializer
} from '@hydra-sdk/core'
```

## Patterns Cốt Lõiities

Các pattern utility thực tế dựa trên implementation từ `nodejs-playground/src`.

## Bắt Đầu

```typescript
import { 
  DatumUtils,
  ParserUtils,
  PolicyUtils,
  TimeUtils,
  SLOT_CONFIG_NETWORK,
  Serializer,
  Deserializer
} from '@hydra-sdk/core'
```

## Patterns Cốt Lõi

### 1. Tạo Token (Từ mint-burn-token.ts)

```typescript
import { PolicyUtils, ParserUtils } from '@hydra-sdk/core'

// Tạo policy từ wallet address
const walletAddress = wallet.getAccount().baseAddressBech32
const scriptCborHex = PolicyUtils.buildMintingPolicyScriptFromAddress(walletAddress)
const policyId = PolicyUtils.policyIdFromNativeScript(scriptCborHex)

// Chuyển đổi tên token
const assetNameHex = ParserUtils.stringToHex('MyToken')
const assetUnit = serializeAssetUnit(policyId, assetNameHex)

console.log('Policy ID:', policyId)
console.log('Asset Unit:', assetUnit)
```

### 2. Xây Dựng Datum Phức Tạp (Implementation Thực Tế)

```typescript
import { DatumUtils } from '@hydra-sdk/core'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

// Pattern datum builder từ production
const buildDatum = (key: string, l1Vkh: string, l2Vkh: string, amount: string) => {
  const bKey = DatumUtils.mkBytes(key)
  const cL1Vkh = DatumUtils.mkConstr(0, [DatumUtils.mkBytes(l1Vkh)])
  const cL2Vkh = DatumUtils.mkConstr(0, [DatumUtils.mkBytes(l2Vkh)])

  const constrKey = DatumUtils.mkConstr(0, [bKey, cL1Vkh, cL2Vkh])
  const wrap1 = DatumUtils.mkConstr(0, [constrKey])

  // Nested map: { "" => { "" => amount } }
  const emptyBytes = DatumUtils.mkBytes('')
  const mapVal = CardanoWASM.PlutusMapValues.new()
  mapVal.add(DatumUtils.mkInt(amount))
  const innerMap = DatumUtils.mkMap([[emptyBytes, mapVal]])

  const outerMapVal = CardanoWASM.PlutusMapValues.new()
  outerMapVal.add(innerMap)
  const outerMap = DatumUtils.mkMap([[emptyBytes, outerMapVal]])

  return DatumUtils.mkConstr(0, [wrap1, outerMap])
}

// Sử dụng
const datum = buildDatum(
  'ee91e90e791e4cd983d1b1f331d1e8eb',
  '326cd6bff6114c4d14ebf2385883aac43c4e64476e6a47314f9b2003',
  'f602ad4b16ec2e1a96989dc140eacf546359695cfece8510c8d1c0ac',
  '4000000'
)
```

### 3. Time Utilities (Patterns Thực Tế)

```typescript
import { TimeUtils, SLOT_CONFIG_NETWORK } from '@hydra-sdk/core'

// Tính toán slot hiện tại
const currentSlot = TimeUtils.unixTimeToEnclosingSlot(
  Date.now(), 
  SLOT_CONFIG_NETWORK.PREPROD
)

// Tính deadline (24 giờ từ bây giờ)
const deadline = TimeUtils.unixTimeToEnclosingSlot(
  Date.now() + (24 * 60 * 60 * 1000),
  SLOT_CONFIG_NETWORK.PREPROD
)

// Chuyển về thời gian đọc được
const readableTime = TimeUtils.slotToBeginUnixTime(
  currentSlot, 
  SLOT_CONFIG_NETWORK.PREPROD
)

console.log('Slot hiện tại:', currentSlot)
console.log('Deadline slot:', deadline)
console.log('Thời gian đọc được:', new Date(readableTime))
```

### 4. Cấu Hình Provider (Sử Dụng Thực Tế)

```typescript
import { ProviderUtils } from '@hydra-sdk/core'

// Blockfrost provider (từ playground examples)
const blockfrostProvider = new ProviderUtils.BlockfrostProvider({
  apiKey: process.env.BLOCKFROST_API_KEY || '',
  network: 'preprod'
})

// Ogmios provider
const ogmiosProvider = new ProviderUtils.OgmiosProvider({
  apiEndpoint: 'https://preprod.cardano-rpc.hydrawallet.app',
  network: 'preprod'
})

// Sử dụng trong transaction flow
const fetchUtxos = async (address: string) => {
  try {
    const utxos = await blockfrostProvider.fetcher.fetchAddressUTxOs(address)
    return utxos
  } catch (error) {
    console.error('Lỗi fetch UTxOs:', error)
    throw error
  }
}
```

## Patterns Nâng Cao

### Pipeline Chuyển Đổi Dữ Liệu

```typescript
import { ParserUtils } from '@hydra-sdk/core'

// Workflow chuyển đổi hoàn chỉnh
const processTokenData = (tokenName: string, metadata: Record<string, any>) => {
  // Chuyển tên token sang hex
  const nameHex = ParserUtils.stringToHex(tokenName)
  
  // Xử lý metadata
  const metadataEntries = Object.entries(metadata).map(([key, value]) => ({
    key: ParserUtils.stringToHex(key),
    value: ParserUtils.stringToHex(String(value))
  }))
  
  return { nameHex, metadataEntries }
}

// Sử dụng
const tokenData = processTokenData('MyNFT', {
  name: 'NFT Đặc Biệt',
  creator: 'Hydra Team',
  rarity: 'Huyền Thoại'
})
```

### Xử Lý Lỗi

```typescript
import { ParserUtils, DatumUtils } from '@hydra-sdk/core'

const safeConversion = (input: string, type: 'hex' | 'datum') => {
  try {
    switch (type) {
      case 'hex':
        return ParserUtils.stringToHex(input)
      case 'datum':
        return DatumUtils.mkBytes(ParserUtils.stringToHex(input))
      default:
        throw new Error('Loại chuyển đổi không được hỗ trợ')
    }
  } catch (error) {
    console.error(`Chuyển đổi ${type} thất bại:`, error)
    return null
  }
}

// Sử dụng với fallback
const result = safeConversion('test data', 'hex') || 'default_hex_value'
```

```typescript
import { DatumUtils } from '@hydra-sdk/core'

// Tạo datum đơn giản với thông tin người dùng
const createUserDatum = (userId: number, name: string, active: boolean) => {
  return DatumUtils.mkConstr(0, [
    DatumUtils.mkInt(userId),
    DatumUtils.mkBytes(ParserUtils.stringToHex(name)),
    DatumUtils.mkConstr(active ? 1 : 0, [])
  ])
}

// Tạo marketplace listing datum
const createListingDatum = (price: bigint, seller: string, nftTokenName: string) => {
  return DatumUtils.mkMap([
    [DatumUtils.mkBytes(ParserUtils.stringToHex("price")), DatumUtils.mkInt(price)],
    [DatumUtils.mkBytes(ParserUtils.stringToHex("seller")), DatumUtils.mkBytes(seller)],
    [DatumUtils.mkBytes(ParserUtils.stringToHex("token")), DatumUtils.mkBytes(nftTokenName)]
  ])
}

// Sử dụng
const userDatum = createUserDatum(123, "Alice", true)
const listingDatum = createListingDatum(100_000_000n, "addr1...", "MyNFT001")
```

### 3. Quản Lý Time và Slot

Làm việc với time slots của Cardano:

```typescript
import { TimeUtils, NETWORK_ID } from '@hydra-sdk/core'

// Lấy slot hiện tại cho transactions
const getCurrentSlot = (network: 'mainnet' | 'preprod' | 'preview') => {
  return TimeUtils.resolveSlotNo(network)
}

// Tính deadline slots (ví dụ: 24 giờ từ bây giờ)
const getDeadlineSlot = (network: 'mainnet' | 'preprod' | 'preview', hoursFromNow: number) => {
  const futureTime = Date.now() + (hoursFromNow * 60 * 60 * 1000)
  return TimeUtils.resolveSlotNo(network, futureTime)
}

// Chuyển đổi slot về human-readable time
const slotToDateTime = (slot: number, network: 'mainnet' | 'preprod' | 'preview') => {
  const slotConfig = SLOT_CONFIG_NETWORK[network]
  const timestamp = TimeUtils.slotToBeginUnixTime(slot, slotConfig)
  return new Date(timestamp)
}

// Sử dụng trong transaction building
const currentSlot = parseInt(getCurrentSlot('preprod'))
const deadline = parseInt(getDeadlineSlot('preprod', 24)) // 24 giờ từ bây giờ
```

### 4. Tạo Minting Policy

Tạo minting policies cho native tokens:

```typescript
import { PolicyUtils, AppWallet } from '@hydra-sdk/core'

// Tạo policy từ wallet address (cách đơn giản)
const createSimplePolicy = (wallet: AppWallet, accountIndex = 0, addressIndex = 0) => {
  const account = wallet.getAccount(accountIndex, addressIndex)
  return PolicyUtils.buildMintingPolicyScriptFromAddress(account.baseAddressBech32)
}

// Tạo policy từ public key cụ thể
const createPolicyFromPubkey = (keyHash: string) => {
  return PolicyUtils.buildPolicyScriptFromPubkey({
    type: 'sig',
    keyHash
  })
}

// Sử dụng cho NFT minting
const wallet = new AppWallet({
  networkId: NETWORK_ID.PREPROD,
  key: { type: 'mnemonic', words: AppWallet.brew() }
})

const mintingPolicy = createSimplePolicy(wallet)
console.log('Minting policy:', mintingPolicy)
```

## Patterns Nâng Cao

### 1. Provider Abstraction

Sử dụng các providers khác nhau một cách liền mạch:

```typescript
import { ProviderUtils } from '@hydra-sdk/core'

// Tạo provider factory
const createProvider = (type: 'blockfrost' | 'ogmios', config: any) => {
  switch (type) {
    case 'blockfrost':
      return new ProviderUtils.BlockfrostProvider(config)
    case 'ogmios':
      return new ProviderUtils.OgmiosProvider(config)
    default:
      throw new Error('Loại provider không được hỗ trợ')
  }
}

// Sử dụng với fallback
const getUtxosWithFallback = async (address: string) => {
  const providers = [
    createProvider('blockfrost', { projectId: 'main-id', network: 'preprod' }),
    createProvider('blockfrost', { projectId: 'backup-id', network: 'preprod' })
  ]

  for (const provider of providers) {
    try {
      return await provider.getUtxos(address)
    } catch (error) {
      console.warn('Provider thất bại, thử provider tiếp theo...', error)
    }
  }
  throw new Error('Tất cả providers đều thất bại')
}
```

### 2. Data Serialization Pipeline

Tạo một serialization pipeline hoàn chỉnh:

```typescript
import { Serializer, Deserializer, ParserUtils } from '@hydra-sdk/core'

// Tạo utility class serialization
class DataSerializer {
  static serialize(data: any): string {
    // Chuyển sang Cardano format
    const cardanoData = Serializer.toCardanoFormat(data)
    // Chuyển sang hex để lưu trữ/truyền tải
    return ParserUtils.bytesToHex(cardanoData)
  }

  static deserialize<T>(hex: string): T {
    // Chuyển hex về bytes
    const bytes = ParserUtils.hexToBytes(hex)
    // Deserialize từ Cardano format
    return Deserializer.fromCardanoFormat(bytes) as T
  }
}

// Sử dụng
const originalData = { userId: 123, balance: 1000000 }
const serialized = DataSerializer.serialize(originalData)
const deserialized = DataSerializer.deserialize(serialized)
```

### 3. Batch Operations

Xử lý nhiều thao tác một cách hiệu quả:

```typescript
import { DatumUtils, ParserUtils } from '@hydra-sdk/core'

// Batch tạo user datums
const createUserBatch = (users: Array<{id: number, name: string, active: boolean}>) => {
  return users.map(user => ({
    userId: user.id,
    datum: DatumUtils.mkConstr(0, [
      DatumUtils.mkInt(user.id),
      DatumUtils.mkBytes(ParserUtils.stringToHex(user.name)),
      DatumUtils.mkConstr(user.active ? 1 : 0, [])
    ])
  }))
}

### 5. Data Conversion Pipeline

```typescript
import { Serializer, Deserializer } from '@hydra-sdk/core'

// Round-trip serialization/deserialization workflow
const processTokenData = async (tokenName: string, txCbor: string) => {
  // Serialize asset name
  const serializedName = Serializer.serializeAssetUnit(tokenName)
  console.log('Serialized token name:', serializedName)
  
  // Deserialize transaction
  const txData = Deserializer.deserializeTx(txCbor)
  console.log('Transaction outputs:', txData.outputs.length)
  
  // Deserialize asset unit back to readable form
  const deserializedName = Deserializer.deserializeAssetUnit(serializedName)
  console.log('Deserialized token name:', deserializedName)
  
  return { serializedName, txData, deserializedName }
}

// Batch xử lý hex data
const processHexBatch = (hexStrings: string[]) => {
  return hexStrings
    .map(hex => ParserUtils.hexToBytes(hex))
    .map(bytes => ParserUtils.bytesToHex(bytes)) // Xử lý và chuyển về
}
```

## Error Handling

Best practices cho error handling với utilities:

```typescript
import { ParserUtils, DatumUtils } from '@hydra-sdk/core'

const safeHexToBytes = (hex: string): Buffer | null => {
  try {
    // Validate hex format
    if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length % 2 !== 0) {
      throw new Error('Định dạng hex không hợp lệ')
    }
    return ParserUtils.hexToBytes(hex)
  } catch (error) {
    console.error('Thất bại chuyển hex sang bytes:', error)
    return null
  }
}

const safeDatumCreation = (value: any) => {
  try {
    if (typeof value === 'number' || typeof value === 'bigint') {
      return DatumUtils.mkInt(value)
    } else if (typeof value === 'string') {
      return DatumUtils.mkBytes(ParserUtils.stringToHex(value))
    } else {
      throw new Error('Loại datum không được hỗ trợ')
    }
  } catch (error) {
    console.error('Thất bại tạo datum:', error)
    return null
  }
}
```

## Tips Hiệu Năng

1. **Cache Providers**: Tái sử dụng provider instances thay vì tạo mới
2. **Batch Operations**: Nhóm nhiều thao tác khi có thể
3. **Validate Input**: Kiểm tra định dạng dữ liệu trước khi chuyển đổi để tránh exceptions
4. **Use TypeScript**: Tận dụng type checking để phát hiện lỗi sớm

## Bước Tiếp Theo

- Khám phá [Tài Liệu API Utilities](/api/utilities) hoàn chỉnh
- Học về [Xây Dựng Ứng Dụng Ví](/guides/building-wallet-app)
- Xem [Mint và Burn Tokens](/guides/mint-burn-tokens)
