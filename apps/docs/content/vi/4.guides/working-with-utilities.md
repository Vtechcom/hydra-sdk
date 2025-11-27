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
  projectId: process.env.BLOCKFROST_PROJECT_ID || '',
  network: 'preprod'
})

// Tạo Ogmios provider
const ogmiosProvider = new ProviderUtils.OgmiosProvider({
  url: 'ws://localhost:1337'
})

// Sử dụng phương thức provider
const utxos = await blockfrostProvider.getUtxos(address)
const protocolParams = await blockfrostProvider.getProtocolParameters()
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
