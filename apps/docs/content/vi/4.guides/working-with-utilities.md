# Làm việc với Utilities

Các pattern utility thực tế dựa trên implementation từ `nodejs-playground/src`.

## Bắt đầu

```typescript
import { 
  DatumUtils,
  ParserUtils,
  PolicyUtils,
  TimeUtils,
  SLOT_CONFIG_NETWORK,
  Serializer,
  Deserializer,
  KeysUtils,
  MetadataUtils,
  ProviderUtils
} from '@hydra-sdk/core'
```

## Các Pattern Cốt Lõi

### 1. Tạo Khóa (Từ gen-fund-key.ts)

```typescript
import { KeysUtils } from '@hydra-sdk/core'

// Tạo cặp khóa ed25519 tương thích Cardano CLI
const cardanoKeys = KeysUtils.cardanoCliKeygen()
console.log('Cardano keys:', cardanoKeys)

// Tạo cặp khóa ed25519 tương thích Hydra
const hydraKeys = KeysUtils.hydraCliKeygen()
console.log('Hydra keys:', hydraKeys)

// Tạo verification key từ signing key
const vkey = KeysUtils.genVkey(cardanoKeys.sk)
console.log('Derived vkey:', vkey)
```

### 2. Tạo Token (Từ mint-burn-token.ts)

```typescript
import { PolicyUtils, ParserUtils, Serializer } from '@hydra-sdk/core'

// Tạo policy từ địa chỉ ví
const walletAddress = wallet.getAccount().baseAddressBech32
const scriptCborHex = PolicyUtils.buildMintingPolicyScriptFromAddress(walletAddress)
const policyId = PolicyUtils.policyIdFromNativeScript(scriptCborHex)

// Chuyển đổi tên token
const assetNameHex = ParserUtils.stringToHex('MyToken')
const assetUnit = Serializer.serializeAssetUnit(policyId, assetNameHex)

console.log('Policy ID:', policyId)
console.log('Asset Unit:', assetUnit)
```

### 3. Xây Dựng Datum Phức Tạp (Implementation Thực Tế)

```typescript
import { DatumUtils, ParserUtils } from '@hydra-sdk/core'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

// Production datum builder pattern
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

### 4. Tạo Metadata (Từ metadata.test.ts)

```typescript
import { MetadataUtils, ParserUtils } from '@hydra-sdk/core'

const vkeyHash = '34f37700b10586c0662e42fcbdf3339c4c52d10e4b13fdef22ecd9b2'

// Chuyển object sang metadata
const metadata = MetadataUtils.metadataObjToMetadatum({
  toHeadId: ParserUtils.toBytes('4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'),
  toAddress: ParserUtils.toBytes(vkeyHash)
})

console.log('Metadata CBOR:', metadata.to_hex())
```

### 5. Tiện Ích Thời Gian (Patterns Thực Tế)

```typescript
import { TimeUtils, SLOT_CONFIG_NETWORK } from '@hydra-sdk/core'

// Chuyển Unix timestamp sang slot
const currentSlot = TimeUtils.unixTimeToEnclosingSlot(
  Date.now(), 
  SLOT_CONFIG_NETWORK.PREPROD
)

// Tính deadline (24 giờ từ bây giờ)
const deadline = TimeUtils.unixTimeToEnclosingSlot(
  Date.now() + (24 * 60 * 60 * 1000),
  SLOT_CONFIG_NETWORK.PREPROD
)

// Chuyển slot về Unix timestamp
const readableTime = TimeUtils.slotToBeginUnixTime(
  currentSlot, 
  SLOT_CONFIG_NETWORK.PREPROD
)

console.log('Current slot:', currentSlot)
console.log('Deadline slot:', deadline)
console.log('Readable time:', new Date(readableTime))
```

### 6. Cài Đặt Provider (Sử Dụng Thực Tế)

```typescript
import { ProviderUtils } from '@hydra-sdk/core'

// Tạo Blockfrost provider
const blockfrostProvider = new ProviderUtils.BlockfrostProvider({
  apiKey: process.env.BLOCKFROST_PROJECT_ID || '',
  network: 'preprod'
})

// Tạo Ogmios provider
const ogmiosProvider = new ProviderUtils.OgmiosProvider({
  network: 'preprod',
  apiEndpoint: 'http://localhost:1337'
})

// Lấy UTxOs cho một địa chỉ thông qua fetcher của provider
const utxos = await blockfrostProvider.fetcher.fetchAddressUTxOs(address)

// Lưu ý: providers không cung cấp protocol parameters. Bên trong Hydra Head,
// hãy đọc chúng từ bridge: await bridge.getProtocolParameters()
```

## Mới trong v1.4.0

### 7. Xây dựng redeemer (RedeemerUtils)

```typescript
import { RedeemerUtils, DatumUtils } from '@hydra-sdk/core'

// Bọc PlutusData vào một Redeemer (tag mặc định là 'spend', index là 0)
const data = DatumUtils.mkConstr(1, [])
const redeemer = RedeemerUtils.mkRedeemer(data, { tag: 'spend', index: 0 })

// Các helper đã đặt sẵn tag
const spendRedeemer = RedeemerUtils.mkSpendRedeemer(data)
const mintRedeemer = RedeemerUtils.mkMintRedeemer(data)

// Unit redeemer "không tham số": Constr(0, [])
const unitRedeemer = RedeemerUtils.mkUnitRedeemer()

// Execution units (ngân sách tạm — hãy evaluate scripts cho production)
const exUnits = RedeemerUtils.mkExUnits(RedeemerUtils.DEFAULT_EX_UNITS)
```

### 8. Các encoder datum mới (DatumUtils)

```typescript
import { DatumUtils, NETWORK_ID } from '@hydra-sdk/core'

// Danh sách (list)
const list = DatumUtils.mkList([DatumUtils.mkInt(1), DatumUtils.mkInt(2)])
const bytesList = DatumUtils.mkBytesList(['deadbeef', 'cafe'])
const intList = DatumUtils.mkIntList([1, 2, 3])

// Boolean: False = Constr(0, []), True = Constr(1, [])
const flag = DatumUtils.mkBool(true)

// Option: Some = Constr(0, [v]), None = Constr(1, [])
const some = DatumUtils.mkOption(DatumUtils.mkInt(42))
const none = DatumUtils.mkOption()

// Output reference: Constr(0, [Bytes(txHash), Int(index)])
const outRef = DatumUtils.mkOutputRef({ txHash: 'abc123...', index: 0 })

// Address <-> PlutusData
const addrDatum = DatumUtils.mkAddress('addr_test1...')
const bech32 = DatumUtils.parseAddress(addrDatum, NETWORK_ID.PREPROD)
```

### 9. Tiện ích validation (ValidationUtils / AddressUtils)

```typescript
import { ValidationUtils, AddressUtils } from '@hydra-sdk/core'

// Kiểm tra cấu trúc của một transaction output
const okOutput = ValidationUtils.isValidTxOutput({
  address: 'addr_test1...',
  amount: [{ unit: 'lovelace', quantity: '2000000' }]
})

// Kiểm tra một address (type: 'bech32' | 'hex' | 'bytes', mặc định 'bech32')
const okAddress = AddressUtils.isValidAddress('addr_test1...')

// Trích xuất payment key hash (trả về null nếu không suy ra được)
const pubKeyHash = AddressUtils.getPubkeyHashFromAddress('addr_test1...')
```

### 10. Đọc toàn bộ amounts từ một transaction (Deserializer)

```typescript
import { Deserializer } from '@hydra-sdk/core'

// Cộng amounts của mọi output, gộp theo unit
const amounts = Deserializer.deserializeAmountsFromTx(signedTxCbor)
console.log('Total amounts:', amounts)
```

### 11. Demeter provider (ProviderUtils.DemeterProvider)

```typescript
import { ProviderUtils } from '@hydra-sdk/core'

// Demeter kế thừa BlockfrostProvider; cùng surface .fetcher / .submitter
const demeterProvider = new ProviderUtils.DemeterProvider({
  authToken: process.env.DEMETER_AUTH_TOKEN || '',
  network: 'preprod'
})

const utxos = await demeterProvider.fetcher.fetchAddressUTxOs(address)
```

## Các Pattern Nâng Cao

### Pipeline Chuyển Đổi Dữ Liệu

```typescript
import { ParserUtils, Serializer, Deserializer } from '@hydra-sdk/core'

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

// Serialize/deserialize asset unit
const processAssetUnit = (policyId: string, assetName: string) => {
  // Serialize asset unit
  const assetNameHex = ParserUtils.stringToHex(assetName)
  const assetUnit = Serializer.serializeAssetUnit(policyId, assetNameHex)
  
  // Deserialize lại
  const { policyId: deserializedPolicy, assetName: deserializedName } = 
    Deserializer.deserializeAssetUnit(assetUnit)
  
  return {
    original: { policyId, assetName },
    serialized: assetUnit,
    deserialized: { 
      policyId: deserializedPolicy, 
      assetName: ParserUtils.hexToString(deserializedName)
    }
  }
}

// Sử dụng
const tokenData = processTokenData('MyNFT', {
  name: 'Special NFT',
  creator: 'Hydra Team',
  rarity: 'Legendary'
})

const assetData = processAssetUnit('abc123...', 'MyToken')
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
        throw new Error('Unsupported conversion type')
    }
  } catch (error) {
    console.error(`Chuyển đổi thất bại cho ${type}:`, error)
    return null
  }
}

// Sử dụng với fallback
const result = safeConversion('test data', 'hex') || 'default_hex_value'
```
