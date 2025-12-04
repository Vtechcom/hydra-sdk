---
title: Wallet アプリケーション構築ガイド
description: Hydra SDK を使ってモダンな Cardano ウォレットアプリケーションを構築する手順
---

# Wallet アプリケーション構築ガイド

このガイドでは、Hydra SDK を使ってモダンな Cardano ウォレットアプリケーションを構築するための全体像と実装パターンをまとめます。具体的なコード例は `examples` セクション（React / Vue / Node.js）と nodejs-playground を参照しつつ、ここでは設計とワークフローの観点から整理します。

> **前提**: コード、型名、モジュール名（`AppWallet`, `HydraBridge`, `TxBuilder`, `ProviderUtils` など）は、すべて英語のまま利用します。

## アーキテクチャ概要

典型的な Wallet アプリケーションは、次のレイヤーで構成されます。

- **UI レイヤー** – React / Vue などのフロントエンド
- **Wallet レイヤー** – `@hydra-sdk/core` の `AppWallet` を中心としたウォレット操作
- **Transaction レイヤー** – `@hydra-sdk/transaction` の `TxBuilder` によるトランザクション構築
- **Provider レイヤー** – `ProviderUtils`（Blockfrost / Ogmios / Hexcore など）によるネットワークアクセス
- **Hydra レイヤー（任意）** – `@hydra-sdk/bridge` の `HydraBridge` / `HexcoreConnector` による Hydra Head 連携

## 基本ワークフロー

1. **SDK のインストール** – Getting Started / Installation に従って core / bridge / transaction / cardano-wasm を追加
2. **Wallet 初期化** – `AppWallet` で mnemonic からウォレットを構築
3. **Provider 設定** – Blockfrost / Ogmios / Hexcore のいずれか、または組み合わせで Provider を設定
4. **UTxO 取得** – `wallet.queryUTxOs()` または専用 API で UTxO を取得
5. **トランザクション構築** – `TxBuilder` で ADA / token 送金、script UTxO、mint/burn などを構築
6. **署名 / 送信** – `wallet.signTx()` と Provider の `submitter` でネットワークに送信
7. **Hydra 連携（任意）** – `HydraBridge` 経由で Head に接続し、L2 トランザクションに切り替え

## コアコードパターン（ダイジェスト）

### Wallet の作成

```typescript
import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'

const mnemonic = AppWallet.brew(128)
const wallet = new AppWallet({
  networkId: NETWORK_ID.PREPROD,
  key: { type: 'mnemonic', words: mnemonic }
})

const account = wallet.getAccount(0, 0)
console.log('Base address:', account.baseAddressBech32)
```

### Provider の統合（Blockfrost 例）

```typescript
import { ProviderUtils } from '@hydra-sdk/core'

const blockfrostProvider = new ProviderUtils.BlockfrostProvider({
  apiKey: process.env.BLOCKFROST_PROVIDER_API_KEY || '',
  network: 'preprod'
})

const wallet = new AppWallet({
  networkId: NETWORK_ID.PREPROD,
  key: { type: 'mnemonic', words: mnemonic },
  fetcher: blockfrostProvider.fetcher,
  submitter: blockfrostProvider.submitter
})
```

### トランザクション構築（シンプルな ADA 送金）

```typescript
import { TxBuilder } from '@hydra-sdk/transaction'

const utxos = await wallet.queryUTxOs(account.baseAddressBech32)

const txBuilder = new TxBuilder()
const tx = await txBuilder
  .setInputs(utxos)
  .addOutput({
    address: 'addr_test1...',
    amount: [{ unit: 'lovelace', quantity: '1000000' }]
  })
  .changeAddress(account.baseAddressBech32)
  .complete()

const signed = await wallet.signTx(tx.to_hex())
const txHash = await wallet.submitTx(signed)
console.log('Tx hash:', txHash)
```

### Hydra Head への接続（任意）

```typescript
import { HydraBridge, HexcoreConnector } from '@hydra-sdk/bridge'

const hexcoreConnector = new HexcoreConnector({
  socketIoUrl: 'wss://example.hexcore.io.vn/hydra',
  socketIoOptions: {
    auth: { token: 'your_auth_token' }
  }
})

const bridge = new HydraBridge({ connector: hexcoreConnector })

bridge.events.on('onConnected', () => {
  console.log('Connected to Hydra Head!')
})

await bridge.connect()
```

## UI レイヤーの統合

React や Vue では、上記のロジックを以下のように分離するのがおすすめです。

- **hooks / composables** – `useWallet`, `useHydra`, `useTransactions` のようなフックにロジックを集約
- **状態管理** – React なら `useState` / `useReducer`、Vue なら Pinia などを利用
- **非同期処理** – すべてのネットワーク呼び出しにローディング / エラー状態を付与

具体的な UI 実装は、以下の example を参照してください。

- React: `apps/docs/content/3.examples/5.full-react-app.md`
- Vue: `apps/docs/content/3.examples/6.full-vuejs-app.md`

## テストと検証

- 単体テスト: Utilities / TxBuilder / 独立ロジックを Jest などでテスト
- 結合テスト: testnet / Preprod 上で E2E パターンを検証
- Hydra 統合テスト: ローカル Hydra node or Hexcore 環境で commit / decommit / L2 tx をテスト

## 次のステップ

- **[Working with Utilities](/ja/4.guides/working-with-utilities)** で低レベルユーティリティを押さえる
- **[Mint / Burn Tokens](/ja/4.guides/mint-burn-tokens)** で token/NFT を扱う
- **[Commit / Decommit](/ja/6.hydra-concept/2.commit-to-hydra)** で Hydra Head への入出金フローを学ぶ
