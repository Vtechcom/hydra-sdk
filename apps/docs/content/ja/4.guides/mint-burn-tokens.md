---
title: Mint / Burn Tokens ガイド
description: Hydra SDK を使って Cardano 上で native token を mint / burn する方法
---

# Mint / Burn Tokens ガイド

このガイドでは、Hydra SDK を使って Cardano ブロックチェーン上で native token を **mint（発行）** および **burn（焼却）** する手順を説明します。token のメタデータ、minting policy、burn の実装まで一連の流れをカバーします。

コード、型名、モジュール名（`AppWallet`, `TxBuilder`, `DatumUtils`, `PolicyUtils`, `CardanoWASM` など）は、英語のままそのまま利用します。

## 前提条件

以下の前提を満たしていることを想定します。

- Cardano の基本概念（UTxO / トランザクション / policy / metadata など）を理解している
- Node.js + TypeScript の開発環境がある
- Hydra SDK がインストール済みで、Preprod testnet に接続可能

## プロジェクトセットアップ

### 依存パッケージのインストール

```bash
npm install @hydra-sdk/core @hydra-sdk/transaction @hydra-sdk/cardano-wasm
```

### 必要なモジュールのインポート

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

## ウォレットセットアップ

まず、トランザクションに署名するための `AppWallet` を作成します。

```typescript
const wallet = new AppWallet({
  key: {
    type: 'mnemonic',
    words: 'your twelve word mnemonic phrase goes here like this example'.split(' ')
  },
  networkId: NETWORK_ID.PREPROD
})

const walletAddress = wallet.getAccount().baseAddressBech32
console.log('Wallet Address:', walletAddress)
```

> セキュリティ上、本番環境では `.env` や安全な key 管理を使い、mnemonic をコードに直書きしないようにしてください。

## トークンの Mint

### 1. UTxO / Collateral の準備

```typescript
async function mintToken() {
  console.log('>>> Querying UTxO...', walletAddress)
  const utxos = await HexcoreApi.queryAddressUTxO(walletAddress)
  console.log(`>>> Found ${utxos.length} UTxOs`)

  const collateralUTxOs = utxos.filter(u =>
    u.output.amount.find(a => 
      a.unit === 'lovelace' && Number(a.quantity) >= 5_000_000
    )
  )

  if (!collateralUTxOs.length) {
    throw new Error('No collateral UTxOs found')
  }

  const collateralUTxO = collateralUTxOs[0]
  // ... 後続の mint ロジックに続く
}
```

### 2. Minting Policy と Token 情報

```typescript
const scriptCborHex = PolicyUtils.buildMintingPolicyScriptFromAddress(walletAddress)
const policyId = PolicyUtils.policyIdFromNativeScript(scriptCborHex)
const assetNameHex = stringToHex('AniaToken')

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

### 3. Mint トランザクションの構築と送信

```typescript
const txBuilder = new TxBuilder()

const tx = await txBuilder
  .setInputs(
    utxos.filter(u =>
      `${u.input.txHash}#${u.input.outputIndex}` !== 
      `${collateralUTxO.input.txHash}#${collateralUTxO.input.outputIndex}`
    )
  )
  .mint('1000000', policyId, assetNameHex)
  .mintingScript({
    type: 'Native',
    scriptCborHex
  })
  .metadataValue(721, { 
    [policyId]: { 
      [assetNameHex]: { ...assetMetadata } 
    } 
  })
  .txInCollateral(
    collateralUTxO.input.txHash,
    collateralUTxO.input.outputIndex,
    collateralUTxO.output.amount,
    collateralUTxO.output.address
  )
  .addOutput({
    address: walletAddress,
    amount: [
      { unit: 'lovelace', quantity: String(2_000_000) },
      { unit: serializeAssetUnit(policyId, assetNameHex), quantity: '1000000' }
    ]
  })
  .changeAddress(walletAddress)
  .complete()

const signedCbor = await wallet.signTx(tx.to_hex())
console.log('Signed Transaction:', signedCbor)
console.log('Transaction ID:', deserializeTx(signedCbor).transaction_hash().to_hex())
```

## トークンの Burn

Burn は、流通中の token を永続的に削除する操作です。数量調整や deflation 設計などに利用されます。

```typescript
async function burnToken() {
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
    .mint('-1000000', policyId, assetNameHex)
    .mintingScript({
      type: 'Native',
      scriptCborHex
    })
    .changeAddress(walletAddress)
    .complete()
    
  const signedCbor = await wallet.signTx(tx.to_hex())
  console.log('Burn Transaction ID:', deserializeTx(signedCbor).transaction_hash().to_hex())
}
```

## Datum / Plutus Data を使った高度な例

`DatumUtils` と `CardanoWASM` を使って、実際の playground と同じ複雑な `PlutusData` を構築できます。

```typescript
const buildDatum = (
  key: string, 
  l1Vkh: string, 
  l2Vkh: string, 
  amount: string
): CardanoWASM.PlutusData => {
  const bKey = DatumUtils.mkBytes(key)
  const cL1Vkh = DatumUtils.mkConstr(0, [DatumUtils.mkBytes(l1Vkh)])
  const cL2Vkh = DatumUtils.mkConstr(0, [DatumUtils.mkBytes(l2Vkh)])
  
  const constrKey = DatumUtils.mkConstr(0, [bKey, cL1Vkh, cL2Vkh])
  const wrap1 = DatumUtils.mkConstr(0, [constrKey])
  
  const emptyBytes = DatumUtils.mkBytes('')
  const mapVal = CardanoWASM.PlutusMapValues.new()
  mapVal.add(DatumUtils.mkInt(amount))
  const innerMap = DatumUtils.mkMap([[emptyBytes, mapVal]])
  
  const outerMapVal = CardanoWASM.PlutusMapValues.new()
  outerMapVal.add(innerMap)
  const outerMap = DatumUtils.mkMap([[emptyBytes, outerMapVal]])
  
  return DatumUtils.mkConstr(0, [wrap1, outerMap])
}
```

## ベストプラクティスと注意点

- 本番運用前に必ず **Preprod** でテストする
- Collateral UTxO の ADA 残高（5 ADA 以上など）を事前に確認
- 同じ token を mint / burn する場合は常に同じ `policyId` を使用
- asset name は常に hex 変換（`stringToHex`）して扱う
- エラー処理（UTxO なし、残高不足、policy 不整合など）を丁寧に実装

## 次のステップ

- **NFT 作成パターン** – 単一の token（1 supply）の mint 例
- **Multi-signature policy** – 複数署名が必要な minting policy
- **Time-locked policy** – 期限付き mint / burn ポリシー
- **Plutus script と連携** – より複雑な minting ロジック

英語版のガイドと同様、より詳細なコード例は nodejs playground の実装を参照してください。
