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
  Deserializer,
  KeysUtils,
  MetadataUtils,
  ProviderUtils
} from '@hydra-sdk/core'
```

## Core Patterns

### 1. Key Generation (From gen-fund-key.ts)

```typescript
import { KeysUtils } from '@hydra-sdk/core'

// Generate Cardano CLI compatible ed25519 key pair
const cardanoKeys = KeysUtils.cardanoCliKeygen()
console.log('Cardano keys:', cardanoKeys)

// Generate Hydra compatible ed25519 key pair
const hydraKeys = KeysUtils.hydraCliKeygen()
console.log('Hydra keys:', hydraKeys)

// Generate verification key from signing key
const vkey = KeysUtils.genVkey(cardanoKeys.sk)
console.log('Derived vkey:', vkey)
```

### 2. Token Creation (From mint-burn-token.ts)

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

### 3. Complex Datum Building (Real Implementation)

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

// Usage
const datum = buildDatum(
  'ee91e90e791e4cd983d1b1f331d1e8eb',
  '326cd6bff6114c4d14ebf2385883aac43c4e64476e6a47314f9b2003',
  'f602ad4b16ec2e1a96989dc140eacf546359695cfece8510c8d1c0ac',
  '4000000'
)
```

### 4. Metadata Creation (From metadata.test.ts)

```typescript
import { MetadataUtils, ParserUtils } from '@hydra-sdk/core'

const vkeyHash = '34f37700b10586c0662e42fcbdf3339c4c52d10e4b13fdef22ecd9b2'

// Convert object to metadata
const metadata = MetadataUtils.metadataObjToMetadatum({
  toHeadId: ParserUtils.toBytes('4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'),
  toAddress: ParserUtils.toBytes(vkeyHash)
})

console.log('Metadata CBOR:', metadata.to_hex())
```

### 5. Time Utilities (Real Patterns)

```typescript
import { TimeUtils, SLOT_CONFIG_NETWORK } from '@hydra-sdk/core'

// Convert Unix timestamp to slot
const currentSlot = TimeUtils.unixTimeToEnclosingSlot(
  Date.now(), 
  SLOT_CONFIG_NETWORK.PREPROD
)

// Deadline calculation (24 hours from now)
const deadline = TimeUtils.unixTimeToEnclosingSlot(
  Date.now() + (24 * 60 * 60 * 1000),
  SLOT_CONFIG_NETWORK.PREPROD
)

// Convert slot back to Unix timestamp
const readableTime = TimeUtils.slotToBeginUnixTime(
  currentSlot, 
  SLOT_CONFIG_NETWORK.PREPROD
)

console.log('Current slot:', currentSlot)
console.log('Deadline slot:', deadline)
console.log('Readable time:', new Date(readableTime))
```

### 6. Provider Setup (Real Usage)

```typescript
import { ProviderUtils } from '@hydra-sdk/core'

// Create Blockfrost provider
const blockfrostProvider = new ProviderUtils.BlockfrostProvider({
  apiKey: process.env.BLOCKFROST_PROJECT_ID || '',
  network: 'preprod'
})

// Create Ogmios provider
const ogmiosProvider = new ProviderUtils.OgmiosProvider({
  network: 'preprod',
  apiEndpoint: 'http://localhost:1337'
})

// Fetch UTxOs for an address through the provider's fetcher
const utxos = await blockfrostProvider.fetcher.fetchAddressUTxOs(address)

// Note: providers do not expose protocol parameters. Inside a Hydra Head,
// read them from the bridge instead: await bridge.getProtocolParameters()
```

## New in v1.4.0

### 7. Redeemer Building (RedeemerUtils)

```typescript
import { RedeemerUtils, DatumUtils } from '@hydra-sdk/core'

// Wrap PlutusData into a Redeemer (tag defaults to 'spend', index to 0)
const data = DatumUtils.mkConstr(1, [])
const redeemer = RedeemerUtils.mkRedeemer(data, { tag: 'spend', index: 0 })

// Tag-preset helpers
const spendRedeemer = RedeemerUtils.mkSpendRedeemer(data)
const mintRedeemer = RedeemerUtils.mkMintRedeemer(data)

// The "no argument" Unit redeemer: Constr(0, [])
const unitRedeemer = RedeemerUtils.mkUnitRedeemer()

// Execution units (placeholder budget — evaluate scripts for production)
const exUnits = RedeemerUtils.mkExUnits(RedeemerUtils.DEFAULT_EX_UNITS)
```

### 8. New Datum Encoders (DatumUtils)

```typescript
import { DatumUtils, NETWORK_ID } from '@hydra-sdk/core'

// Lists
const list = DatumUtils.mkList([DatumUtils.mkInt(1), DatumUtils.mkInt(2)])
const bytesList = DatumUtils.mkBytesList(['deadbeef', 'cafe'])
const intList = DatumUtils.mkIntList([1, 2, 3])

// Booleans: False = Constr(0, []), True = Constr(1, [])
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

### 9. Validation Utilities (ValidationUtils / AddressUtils)

```typescript
import { ValidationUtils, AddressUtils } from '@hydra-sdk/core'

// Validate a transaction output shape
const okOutput = ValidationUtils.isValidTxOutput({
  address: 'addr_test1...',
  amount: [{ unit: 'lovelace', quantity: '2000000' }]
})

// Validate an address (type: 'bech32' | 'hex' | 'bytes', default 'bech32')
const okAddress = AddressUtils.isValidAddress('addr_test1...')

// Extract the payment key hash (returns null if not derivable)
const pubKeyHash = AddressUtils.getPubkeyHashFromAddress('addr_test1...')
```

### 10. Read All Amounts From a Transaction (Deserializer)

```typescript
import { Deserializer } from '@hydra-sdk/core'

// Sum every output's amounts, merged by unit
const amounts = Deserializer.deserializeAmountsFromTx(signedTxCbor)
console.log('Total amounts:', amounts)
```

### 11. Demeter Provider (ProviderUtils.DemeterProvider)

```typescript
import { ProviderUtils } from '@hydra-sdk/core'

// Demeter extends BlockfrostProvider; same .fetcher / .submitter surface
const demeterProvider = new ProviderUtils.DemeterProvider({
  authToken: process.env.DEMETER_AUTH_TOKEN || '',
  network: 'preprod'
})

const utxos = await demeterProvider.fetcher.fetchAddressUTxOs(address)
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
      assetName: ParserUtils.hexToString(deserializedName)
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
