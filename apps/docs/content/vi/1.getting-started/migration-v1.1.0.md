# Hướng Dẫn Nâng Cấp Lên v1.1.x

Hướng dẫn này sẽ giúp bạn nâng cấp từ các phiên bản trước của Hydra SDK lên v1.1.0, với hệ thống utilities mới và trải nghiệm developer được cải thiện.

## Có Gì Thay Đổi

### Hệ Thống Utilities Mới

Version 1.1.0 giới thiệu một hệ thống utilities hoàn toàn mới với các namespace được tổ chức:

**Trước đây (v1.0.x):**
```typescript
// Import utilities riêng lẻ (nếu có)
import { someUtility } from '@hydra-sdk/core/utils/some-utility'
```

**Sau này (v1.1.x):**
```typescript
// Import theo namespace có tổ chức
import { 
  ParserUtils,
  TimeUtils,
  DatumUtils,
  PolicyUtils,
  Serializer,
  Deserializer 
} from '@hydra-sdk/core'
```

## Breaking Changes

### 1. Tổ Chức Lại Utility Functions

**Trước đây:**
```typescript
// Import trực tiếp từ utils (nếu tồn tại)
import { hexToBytes, bytesToHex } from '@hydra-sdk/core/utils'
```

**Sau này:**
```typescript
// Import utilities theo namespace
import { ParserUtils } from '@hydra-sdk/core'

const hex = ParserUtils.bytesToHex(bytes)
const bytes = ParserUtils.hexToBytes(hex)
```

### 2. Time/Slot Utilities

**Trước đây:**
```typescript
// Tính toán slot thủ công hoặc dùng thư viện bên ngoài
const currentSlot = calculateSlot(Date.now())
```

**Sau này:**
```typescript
import { TimeUtils } from '@hydra-sdk/core'

const currentSlot = TimeUtils.resolveSlotNo('preprod')
const futureSlot = TimeUtils.resolveSlotNo('preprod', Date.now() + 3600000)
```

### 3. Tạo Datum

**Trước đây:**
```typescript
// Thao tác WASM thủ công
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

const datum = CardanoWASM.PlutusData.new_integer(
  CardanoWASM.BigInt.from_str('42')
)
```

**Sau này:**
```typescript
import { DatumUtils } from '@hydra-sdk/core'

const datum = DatumUtils.mkInt(42)
const bytesDatum = DatumUtils.mkBytes('deadbeef')
const constrDatum = DatumUtils.mkConstr(0, [datum, bytesDatum])
```

## Các Bước Nâng Cấp

### Bước 1: Cập Nhật Dependencies

```bash
# Cập nhật lên phiên bản mới nhất
npm update @hydra-sdk/core @hydra-sdk/bridge @hydra-sdk/transaction

# Hoặc với phiên bản cụ thể
npm install @hydra-sdk/core@^1.1.0
```

### Bước 2: Cập Nhật Imports

Thay thế các import utilities riêng lẻ bằng namespace imports:

```typescript
// CŨ - Xóa những cái này
import { someUtility } from '@hydra-sdk/core/utils/some-utility'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

// MỚI - Dùng những cái này thay thế
import { 
  ParserUtils,
  TimeUtils,
  DatumUtils,
  PolicyUtils,
  Serializer,
  Deserializer,
  Resolver,
  Converter,
  BuildKeys,
  ProviderUtils,
  CostModels 
} from '@hydra-sdk/core'
```

### Bước 3: Thay Thế Các Thao Tác Thủ Công

#### Chuyển Đổi Dữ Liệu
```typescript
// CŨ
const hex = Buffer.from(bytes).toString('hex')
const bytes = Buffer.from(hex, 'hex')

// MỚI
import { ParserUtils } from '@hydra-sdk/core'
const hex = ParserUtils.bytesToHex(bytes)
const bytes = ParserUtils.hexToBytes(hex)
```

#### Tính Toán Thời Gian
```typescript
// CŨ
const slot = Math.floor((Date.now() - SHELLEY_START) / SLOT_LENGTH) + SHELLEY_SLOT_START

// MỚI
import { TimeUtils, SLOT_CONFIG_NETWORK } from '@hydra-sdk/core'
const slot = TimeUtils.unixTimeToEnclosingSlot(Date.now(), SLOT_CONFIG_NETWORK.PREPROD)
```

#### Tạo Datum
```typescript
// CŨ - Thao tác WASM phức tạp
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
const datum = CardanoWASM.PlutusData.new_constr_plutus_data(
  CardanoWASM.ConstrPlutusData.new(
    CardanoWASM.BigNum.from_str('0'),
    list
  )
)

// MỚI - Hàm utility đơn giản
import { DatumUtils } from '@hydra-sdk/core'
const datum = DatumUtils.mkConstr(0, [field1, field2])
```

### Bước 4: Cập Nhật Sử Dụng Provider

Nếu bạn đang dùng custom provider implementations:

```typescript
// CŨ - Thiết lập provider tùy chỉnh
class MyProvider {
  async getUtxos(address) {
    // Implementation tùy chỉnh
  }
}

// MỚI - Dùng provider có sẵn hoặc kế thừa base
import { ProviderUtils } from '@hydra-sdk/core'

const provider = new ProviderUtils.BlockfrostProvider({
  apiKey: 'your-blockfrost-api-key',
  network: 'preprod'
})

// Hoặc kế thừa một provider có sẵn để tùy chỉnh hành vi
class MyProvider extends ProviderUtils.BlockfrostProvider {
  constructor() {
    super({ apiKey: 'your-blockfrost-api-key', network: 'preprod' })
  }

  // Các `.fetcher` / `.submitter` được thừa kế vẫn hoạt động
  async getUtxos(address: string) {
    return this.fetcher.fetchAddressUTxOs(address)
  }
}
```

## Các Pattern Nâng Cấp Thường Gặp

### Pattern 1: Tạo Metadata

**Trước đây:**
```typescript
const metadata = {
  721: {
    [policyId]: {
      [tokenName]: {
        name: Buffer.from(name).toString('hex'),
        image: Buffer.from(image).toString('hex')
      }
    }
  }
}
```

**Sau này:**
```typescript
import { ParserUtils, DatumUtils } from '@hydra-sdk/core'

const metadata = {
  721: {
    [policyId]: {
      [tokenName]: {
        name: ParserUtils.stringToHex(name),
        image: ParserUtils.stringToHex(image)
      }
    }
  }
}

// Hoặc tạo dưới dạng datum
const metadataDatum = DatumUtils.mkMap([
  [DatumUtils.mkBytes(ParserUtils.stringToHex("name")), 
   DatumUtils.mkBytes(ParserUtils.stringToHex(name))],
  [DatumUtils.mkBytes(ParserUtils.stringToHex("image")), 
   DatumUtils.mkBytes(ParserUtils.stringToHex(image))]
])
```

### Pattern 2: Timing Giao Dịch

**Trước đây:**
```typescript
// Tính toán slot thủ công
const validFrom = getCurrentSlot()
const validUntil = validFrom + 7200 // 1 giờ tính bằng slot
```

**Sau này:**
```typescript
import { TimeUtils, SLOT_CONFIG_NETWORK } from '@hydra-sdk/core'

const validFrom = TimeUtils.unixTimeToEnclosingSlot(Date.now(), SLOT_CONFIG_NETWORK.PREPROD)
const validUntil = TimeUtils.unixTimeToEnclosingSlot(Date.now() + 3600000, SLOT_CONFIG_NETWORK.PREPROD)
```

### Pattern 3: Tạo Policy Script

**Trước đây:**
```typescript
// Thao tác WASM thủ công cho policy
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

const keyHash = CardanoWASM.Ed25519KeyHash.from_hex(publicKeyHash)
const scriptPubkey = CardanoWASM.ScriptPubkey.new(keyHash)
const policy = CardanoWASM.NativeScript.new_script_pubkey(scriptPubkey)
```

**Sau này:**
```typescript
import { PolicyUtils } from '@hydra-sdk/core'

const policy = PolicyUtils.buildPolicyScriptFromPubkey({
  type: 'sig',
  keyHash: publicKeyHash
})

// Hoặc từ address
const policy = PolicyUtils.buildMintingPolicyScriptFromAddress(address)
```

## Kiểm Tra Nâng Cấp

### 1. Test Chức Năng Cơ Bản

```typescript
import { 
  AppWallet, 
  NETWORK_ID,
  ParserUtils,
  TimeUtils,
  DatumUtils,
  SLOT_CONFIG_NETWORK
} from '@hydra-sdk/core'

// Test tạo wallet (hoạt động như trước)
const wallet = new AppWallet({
  networkId: NETWORK_ID.PREPROD,
  key: { type: 'mnemonic', words: AppWallet.brew() }
})

// Test utilities mới
const hex = ParserUtils.stringToHex('test')
const slot = TimeUtils.unixTimeToEnclosingSlot(Date.now(), SLOT_CONFIG_NETWORK.PREPROD)
const datum = DatumUtils.mkInt(42)

console.log('Test nâng cấp thành công:', {
  address: wallet.getAccount(0, 0).baseAddressBech32,
  hex,
  slot,
  datumHex: datum.to_hex()
})
```

### 2. Test Chuyển Đổi Dữ Liệu

```typescript
import { ParserUtils } from '@hydra-sdk/core'

const testData = [
  'Xin chào Thế giới',
  '🚀 Hydra SDK',
  'Ký tự đặc biệt: àáạảã'
]

testData.forEach(str => {
  const hex = ParserUtils.stringToHex(str)
  const back = Buffer.from(hex, 'hex').toString('utf8')
  
  console.assert(str === back, `Chuyển đổi thất bại cho: ${str}`)
})

console.log('Test chuyển đổi dữ liệu thành công')
```

### 3. Test Time Utilities

```typescript
import { TimeUtils, SLOT_CONFIG_NETWORK } from '@hydra-sdk/core'

const networks = ['MAINNET', 'PREPROD', 'PREVIEW'] as const

networks.forEach(network => {
  const slot = TimeUtils.unixTimeToEnclosingSlot(Date.now(), SLOT_CONFIG_NETWORK[network])
  console.assert(typeof slot === 'number' && slot > 0, `Slot không hợp lệ cho network: ${network}`)
})

console.log('Test time utilities thành công')
```

## Khắc Phục Sự Cố

### Lỗi Thường Gặp

1. **Lỗi Import**
   ```
   Error: Module not found: @hydra-sdk/core/utils/...
   ```
   **Giải pháp**: Dùng namespace imports thay vì deep imports.

2. **Lỗi Type với Utilities**
   ```
   Error: Property 'stringToHex' does not exist on type...
   ```
   **Giải pháp**: Import đúng namespace: `ParserUtils.stringToHex`

3. **Lỗi Tính Toán Slot**
   ```
   Error: Invalid network parameter
   ```
   **Giải pháp**: Dùng đúng network strings: `'mainnet'`, `'preprod'`, hoặc `'preview'`

### Nhận Trợ Giúp

Nếu bạn gặp vấn đề trong quá trình nâng cấp:

1. Xem [Tài Liệu API Utilities](/api/utilities)
2. Đọc [Hướng Dẫn Làm Việc với Utilities](/guides/working-with-utilities)
3. Tham khảo [Ví Dụ Utilities](/examples/utilities-examples)
4. Tham gia Discord community để được hỗ trợ

## Lợi Ích của v1.1.0

Sau khi nâng cấp, bạn sẽ có:

- **Trải Nghiệm Developer Tốt Hơn**: Các hàm utility có tổ chức, dễ dự đoán
- **Type Safety**: Định nghĩa TypeScript toàn diện
- **Hiệu Năng**: Các implementation utility được tối ưu
- **Dễ Bảo Trì**: Code sạch hơn, dễ đọc hơn
- **Tương Lai**: Nền tảng cho các tính năng sắp tới

Nỗ lực nâng cấp sẽ được đền đáp bằng trải nghiệm phát triển và chất lượng code được cải thiện đáng kể.
