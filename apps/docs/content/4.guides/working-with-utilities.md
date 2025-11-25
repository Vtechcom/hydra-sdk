# Working with Utilities

Real-world utility patterns based on `nodejs-playground/src` implementations.

## Getting Started

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

## Core Patterns

### 1. Token Creation (From mint-burn-token.ts)

```typescript
import { PolicyUtils, ParserUtils, Serializer } from '@hydra-sdk/core'

// Create policy from wallet address
const walletAddress = wallet.getAccount().baseAddressBech32
const scriptCborHex = PolicyUtils.buildMintingPolicyScriptFromAddress(walletAddress)
const policyId = PolicyUtils.policyIdFromNativeScript(scriptCborHex)

// Token name conversion
const assetNameHex = ParserUtils.stringToHex('MyToken')
const assetUnit = Serializer.serializeAssetUnit(policyId, assetNameHex)

console.log('Policy ID:', policyId)
console.log('Asset Unit:', assetUnit)
```

### 2. Complex Datum Building (Real Implementation)

```typescript
import { DatumUtils } from '@hydra-sdk/core'
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

// Usage
const datum = buildDatum(
  'ee91e90e791e4cd983d1b1f331d1e8eb',
  '326cd6bff6114c4d14ebf2385883aac43c4e64476e6a47314f9b2003',
  'f602ad4b16ec2e1a96989dc140eacf546359695cfece8510c8d1c0ac',
  '4000000'
)
```

### 3. Time Utilities (Real Patterns)

```typescript
import { TimeUtils, SLOT_CONFIG_NETWORK } from '@hydra-sdk/core'

// Current slot calculation
const currentSlot = TimeUtils.unixTimeToEnclosingSlot(
  Date.now(), 
  SLOT_CONFIG_NETWORK.PREPROD
)

// Deadline calculation (24 hours from now)
const deadline = TimeUtils.unixTimeToEnclosingSlot(
  Date.now() + (24 * 60 * 60 * 1000),
  SLOT_CONFIG_NETWORK.PREPROD
)

// Convert back to readable time
const readableTime = TimeUtils.slotToBeginUnixTime(
  currentSlot, 
  SLOT_CONFIG_NETWORK.PREPROD
)

console.log('Current slot:', currentSlot)
console.log('Deadline slot:', deadline)
console.log('Readable time:', new Date(readableTime))
```

### 4. Provider Setup (Real Usage)

```typescript
import { ProviderUtils } from '@hydra-sdk/core'

// Blockfrost provider (from playground examples)
const blockfrostProvider = new ProviderUtils.BlockfrostProvider({
  apiKey: process.env.BLOCKFROST_API_KEY || '',
  network: 'preprod'
})

// Ogmios provider
const ogmiosProvider = new ProviderUtils.OgmiosProvider({
  apiEndpoint: 'https://preprod.cardano-rpc.hydrawallet.app',
  network: 'preprod'
})

// Usage in transaction flow
const fetchUtxos = async (address: string) => {
  try {
    const utxos = await blockfrostProvider.fetcher.fetchAddressUTxOs(address)
    return utxos
  } catch (error) {
    console.error('Failed to fetch UTxOs:', error)
    throw error
  }
}
```

## Advanced Patterns

### Data Conversion Pipeline

```typescript
import { ParserUtils, Serializer, Deserializer } from '@hydra-sdk/core'

// Complete conversion workflow
const processTokenData = (tokenName: string, metadata: Record<string, any>) => {
  // Convert token name to hex
  const nameHex = ParserUtils.stringToHex(tokenName)
  
  // Process metadata
  const metadataEntries = Object.entries(metadata).map(([key, value]) => ({
    key: ParserUtils.stringToHex(key),
    value: ParserUtils.stringToHex(String(value))
  }))
  
  return { nameHex, metadataEntries }
}

// Asset unit serialization/deserialization
const processAssetUnit = (policyId: string, assetName: string) => {
  // Serialize asset unit
  const assetNameHex = ParserUtils.stringToHex(assetName)
  const assetUnit = Serializer.serializeAssetUnit(policyId, assetNameHex)
  
  // Deserialize back
  const { policyId: deserializedPolicy, assetName: deserializedName } = 
    Deserializer.deserializeAssetUnit(assetUnit)
  
  return {
    original: { policyId, assetName },
    serialized: assetUnit,
    deserialized: { 
      policyId: deserializedPolicy, 
      assetName: ParserUtils.hexToBytes(deserializedName).toString('utf8')
    }
  }
}

// Usage
const tokenData = processTokenData('MyNFT', {
  name: 'Special NFT',
  creator: 'Hydra Team',
  rarity: 'Legendary'
})

const assetData = processAssetUnit('abc123...', 'MyToken')
```

### Error Handling

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
    console.error(`Conversion failed for ${type}:`, error)
    return null
  }
}

// Usage with fallback
const result = safeConversion('test data', 'hex') || 'default_hex_value'
```
