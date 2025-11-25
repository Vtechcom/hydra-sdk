---
title: Mint and Burn Tokens Guide
description: Learn how to mint and burn native tokens on Cardano using Hydra SDK
---

# Mint and Burn Tokens Guide

This comprehensive guide teaches you how to mint (create) and burn (destroy) native tokens on the Cardano blockchain using Hydra SDK. You'll learn to create custom tokens with metadata, manage minting policies, and properly burn tokens when needed.

## 📚 Prerequisites

Before starting, ensure you have:
- Basic understanding of Cardano blockchain concepts
- Node.js and TypeScript development environment
- Hydra SDK installed and configured
- Access to Cardano testnet (Preprod) for testing

## 🏗️ Project Setup

### Install Dependencies

```bash
npm install @hydra-sdk/core @hydra-sdk/transaction @hydra-sdk/cardano-wasm
```

### Import Required Modules

```typescript
import {
  AppWallet,
  DatumUtils,
  deserializeTx,
  NETWORK_ID,
  PolicyUtils,
  serializeAssetUnit,
  stringToHex
} from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
```

## 💰 Wallet Setup

First, create a wallet instance for signing transactions:

```typescript
const wallet = new AppWallet({
  key: {
    type: 'mnemonic',
    words: 'your twelve word mnemonic phrase goes here like this example'.split(' ')
  },
  networkId: NETWORK_ID.PREPROD // Use PREPROD for testing
})

const walletAddress = wallet.getAccount().baseAddressBech32
console.log('Wallet Address:', walletAddress)
```

::alert{type="warning"}
**Security Note**: Never use real mnemonic phrases in production code. Use environment variables or secure key management.
::

## 🔨 Minting Tokens

### Step 1: Query UTxOs and Setup Collateral

```typescript
async function mintToken() {
  // Query available UTxOs
  console.log('>>> Querying UTxO...', walletAddress)
  const utxos = await HexcoreApi.queryAddressUTxO(walletAddress)
  console.log(`>>> Found ${utxos.length} UTxOs`)

  // Find suitable collateral UTxO (>= 5 ADA)
  const collateralUTxOs = utxos.filter(u =>
    u.output.amount.find(a => 
      a.unit === 'lovelace' && Number(a.quantity) >= 5_000_000
    )
  )

  if (!collateralUTxOs.length) {
    throw new Error('No collateral UTxOs found')
  }
  
  const collateralUTxO = collateralUTxOs[0]
  // ...continued below
}
```

### Step 2: Create Minting Policy and Token Details

```typescript
// Create minting policy from wallet address
const scriptCborHex = PolicyUtils.buildMintingPolicyScriptFromAddress(walletAddress)
const policyId = PolicyUtils.policyIdFromNativeScript(scriptCborHex)
const assetNameHex = stringToHex('AniaToken')

// Define token metadata (CIP-25 standard)
const assetMetadata = {
  name: 'Ada Binary Option Token',
  description: 'Utility token for Cardano Binary Option demo project',
  ticker: 'tABO',
  url: 'https://preprod.ada-defi.io.vn',
  logo: 'ipfs://Qmaqj4Lg51s9gL654zwFfcimHNcX4GLno7okEdyCGPor2i',
  image: 'ipfs://Qmaqj4Lg51s9gL654zwFfcimHNcX4GLno7okEdyCGPor2i'
}

console.log('Policy ID:', policyId)
console.log('Asset Name (hex):', assetNameHex)
```

### Step 3: Build and Submit Minting Transaction

```typescript
const txBuilder = new TxBuilder()

const tx = await txBuilder
  // Set inputs (exclude collateral UTxO)
  .setInputs(
    utxos.filter(u =>
      `${u.input.txHash}#${u.input.outputIndex}` !== 
      `${collateralUTxO.input.txHash}#${collateralUTxO.input.outputIndex}`
    )
  )
  // Mint 1,000,000 tokens (6 decimal places = 1 token)
  .mint('1000000', policyId, assetNameHex)
  // Attach minting script
  .mintingScript({
    type: 'Native',
    scriptCborHex: scriptCborHex
  })
  // Add metadata (CIP-25 for NFTs/tokens)
  .metadataValue(721, { 
    [policyId]: { 
      [assetNameHex]: { ...assetMetadata } 
    } 
  })
  // Set collateral for script execution
  .txInCollateral(
    collateralUTxO.input.txHash,
    collateralUTxO.input.outputIndex,
    collateralUTxO.output.amount,
    collateralUTxO.output.address
  )
  // Output: send minted tokens to wallet
  .addOutput({
    address: walletAddress,
    amount: [
      { unit: 'lovelace', quantity: String(2_000_000) },
      { 
        unit: serializeAssetUnit(policyId, assetNameHex), 
        quantity: '1000000' 
      }
    ]
  })
  .changeAddress(walletAddress)
  .complete()

// Sign and submit transaction
const signedCbor = await wallet.signTx(tx.to_hex())
console.log('Signed Transaction:', signedCbor)
console.log('Transaction ID:', deserializeTx(signedCbor).transaction_hash().to_hex())
```

## 🔥 Burning Tokens

Burning tokens permanently removes them from circulation. This is useful for deflationary mechanisms or removing unwanted tokens.

### Complete Burn Implementation

```typescript
async function burnToken() {
  // Query UTxOs (same as minting)
  const utxos = await HexcoreApi.queryAddressUTxO(walletAddress)
  const collateralUTxOs = utxos.filter(u =>
    u.output.amount.find(a => 
      a.unit === 'lovelace' && Number(a.quantity) >= 5_000_000
    )
  )
  
  if (!collateralUTxOs.length) {
    throw new Error('No collateral UTxOs found')
  }
  
  const collateralUTxO = collateralUTxOs[0]
  
  // Same policy and asset details
  const scriptCborHex = PolicyUtils.buildMintingPolicyScriptFromAddress(walletAddress)
  const policyId = PolicyUtils.policyIdFromNativeScript(scriptCborHex)
  const assetNameHex = stringToHex('AniaToken')
  
  const txBuilder = new TxBuilder()
  
  const tx = await txBuilder
    .setInputs(
      utxos.filter(u =>
        `${u.input.txHash}#${u.input.outputIndex}` !== 
        `${collateralUTxO.input.txHash}#${collateralUTxO.input.outputIndex}`
      )
    )
    // Negative amount = burn tokens
    .mint('-1000000', policyId, assetNameHex)
    .mintingScript({
      type: 'Native',
      scriptCborHex: scriptCborHex
    })
    .changeAddress(walletAddress)
    .complete()
    
  const signedCbor = await wallet.signTx(tx.to_hex())
  console.log('Burn Transaction ID:', deserializeTx(signedCbor).transaction_hash().to_hex())
}
```

## 📊 Advanced: Working with Datum

For more complex scenarios, you might need to work with Plutus data structures:

```typescript
import { DatumUtils } from '@hydra-sdk/core'

const buildDatum = (
  key: string, 
  l1Vkh: string, 
  l2Vkh: string, 
  amount: string
): CardanoWASM.PlutusData => {
  // Create nested constructor with key and verification key hashes
  const bKey = DatumUtils.mkBytes(key)
  const cL1Vkh = DatumUtils.mkConstr(0, [DatumUtils.mkBytes(l1Vkh)])
  const cL2Vkh = DatumUtils.mkConstr(0, [DatumUtils.mkBytes(l2Vkh)])
  
  const constrKey = DatumUtils.mkConstr(0, [bKey, cL1Vkh, cL2Vkh])
  const wrap1 = DatumUtils.mkConstr(0, [constrKey])
  
  // Create nested map structure: { "" => { "" => amount } }
  const emptyBytes = DatumUtils.mkBytes('')
  const mapVal = CardanoWASM.PlutusMapValues.new()
  mapVal.add(DatumUtils.mkInt(amount))
  const innerMap = DatumUtils.mkMap([[emptyBytes, mapVal]])
  
  const outerMapVal = CardanoWASM.PlutusMapValues.new()
  outerMapVal.add(innerMap)
  const outerMap = DatumUtils.mkMap([[emptyBytes, outerMapVal]])
  
  return DatumUtils.mkConstr(0, [wrap1, outerMap])
}

// Usage in transaction
const datum = buildDatum(
  'ee91e90e791e4cd983d1b1f331d1e8eb',
  '326cd6bff6114c4d14ebf2385883aac43c4e64476e6a47314f9b2003',
  'f602ad4b16ec2e1a96989dc140eacf546359695cfece8510c8d1c0ac',
  '4000000'
)


// Debug:
console.log('Datum (json):', datum.to_json(DatumUtils.DatumSchema.Detailed))
```

## ⚠️ Important Considerations

### Security Best Practices

1. **Test on Preprod First**: Always test your minting/burning logic on testnet
2. **Validate Inputs**: Check UTxO availability and amounts before building transactions
3. **Handle Errors**: Implement proper error handling for network and transaction failures
4. **Secure Key Management**: Use hardware wallets or secure key storage in production

### Common Pitfalls

1. **Insufficient Collateral**: Ensure you have enough ADA for collateral (≥5 ADA)
2. **Policy ID Consistency**: Use the same policy for minting and burning the same token
3. **Asset Name Encoding**: Remember to convert asset names to hex format
4. **UTxO Selection**: Properly exclude collateral UTxOs from transaction inputs

### Gas and Fees

- Minting transactions require higher fees due to script execution
- Collateral UTxOs are returned if transaction succeeds
- Consider network congestion when setting fees

## 🎯 Complete Example

Here's the complete working example:

```typescript
import {
  AppWallet,
  DatumUtils,
  deserializeTx,
  NETWORK_ID,
  PolicyUtils,
  serializeAssetUnit,
  stringToHex
} from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

// Initialize wallet
const wallet = new AppWallet({
  key: {
    type: 'mnemonic',
    words: 'enable away depend exist mad february table onion census praise spawn pipe again angle grant'.split(' ')
  },
  networkId: NETWORK_ID.PREPROD
})

const walletAddress = wallet.getAccount().baseAddressBech32

// Execute minting or burning
async function main() {
  console.log('Wallet Address:', walletAddress)
  
  // Uncomment the operation you want to perform
  await mintToken()
  // await burnToken()
}

main().catch(console.error)
```

## 🔗 Next Steps

After mastering token minting and burning, explore:
- **NFT Creation**: Learn to create unique non-fungible tokens
- **Multi-signature Policies**: Implement policies requiring multiple signatures
- **Time-locked Policies**: Create tokens with time-based minting restrictions
- **Plutus Scripts**: Advanced scripting for complex minting logic

---

*This guide provides a foundation for token operations on Cardano. Always test thoroughly and follow security best practices in production environments.*
