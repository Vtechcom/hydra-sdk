---
title: 例
description: nodejs-playgroundの実装に基づいた実際の例
---

# 例

`nodejs-playground/src`からの実際の実装に基づいた包括的な例。

## コアの例

### [ウォレット作成](/examples/wallet-creation)
ウォレットの作成と復元の実際のパターン：
- 新しいニーモニックからのウォレット作成
- 既存のニーモニックからのウォレット復元
- アカウント管理とアドレス生成
- **ベース**: `nodejs-playground/src/index.ts` パターン

### [トランザクション構築](/examples/transaction-building)  
完全なトランザクション構築ワークフロー：
- Blockfrost/Ogmiosを使用した単純なADA送金
- メタデータ付きトークンミント (`mint-burn-token.ts`から)
- トークンバーン操作
- Plutusスクリプトのコラテラル管理
- **ベース**: `examples/wallet-with-*.ts`, `mint-burn-token.ts`

### [トランザクション署名](/examples/transaction-signing)
高度な署名パターンとエラー処理：
- 基本的なトランザクション署名 (`sign-tx.ts`から)
- マルチシグネチャワークフロー
- 分析を伴う条件付き署名
- バッチ署名操作
- **ベース**: `sign-tx.ts`, 実際のエラー処理パターン

### [Hydra統合](/examples/hydra-integration)
Hydraネットワーク固有の実装：
- Socket.IOを使用したHydraブリッジ接続
- Hydra固有のトランザクション構築
- カスタムAPI統合 (HexcoreApiパターン)
- リアルタイムイベント処理
- **ベース**: 本番環境のHydra統合パターン

## 高度な例

### [ユーティリティの例](/examples/utilities-examples)
本番環境のユーティリティ使用パターン：
- 複雑なデータム作成 (`buildDatum`関数から)
- 出力用の資産ユニットシリアライズ
- プロバイダー統合 (Blockfrost/Ogmios)
- カスタムAPI実装
- **ベース**: すべての `nodejs-playground/src` ユーティリティ使用法

### [完全なアプリケーションの例](/examples/full-application)
完全なアプリケーションアーキテクチャ：
- Node.jsバックエンド統合
- 環境設定管理
- エラー処理とリトライロジック
- **ベース**: 実際のアプリケーションパターン

### [React統合](/examples/full-react-app)
React固有の実装：
- Reactコンポーネントでのウォレット管理
- トランザクション状態管理
- プロバイダー統合パターン
- **更新**: 実際のReactパターン

### [Vue.js統合](/examples/full-vuejs-app)
Vue.jsエコシステム統合：
- Vue 3 Composition APIパターン
- Piniaによる状態管理
- コンポーネントライフサイクル管理
- **更新**: 本番環境のVueパターン

## 実証された主な機能

### 実際の実装パターン
- ✅ **実際のコード**: すべての例は `nodejs-playground` からの実際のパターンを使用しています
- ✅ **本番対応**: エラー処理、リトライロジック、パフォーマンス監視
- ✅ **ベストプラクティス**: TypeScript型、適切なインポート、メモリクリーンアップ

### プロバイダー統合
- **Blockfrostプロバイダー**: `new ProviderUtils.BlockfrostProvider()`
- **Ogmiosプロバイダー**: `new ProviderUtils.OgmiosProvider()`
- **カスタムAPI**: HexcoreApi, OgmiosApi実装

### ユーティリティ使用法
- **ParserUtils**: 文字列/16進数変換、バイナリデータ処理
- **DatumUtils**: 複雑なネストされたデータム、コンストラクタパターン
- **PolicyUtils**: ポリシースクリプト生成、資産管理
- **実際のパターン**: ミント/バーン操作、複雑なデータム構築から

### トランザクションタイプ
- 単純なADA送金
- メタデータ付きトークンミント/バーン
- マルチシグネチャトランザクション
- Hydra固有のトランザクション (手数料ゼロ)

## はじめに

1. **統合の選択**: React, Vue.js, または Node.js
2. **プロバイダーの選択**: Blockfrost, Ogmios, またはカスタムAPI
3. **実際のパターンのコピー**: すべてのコードは動作する実装からのものです
4. **ニーズに合わせた調整**: 環境変数とエンドポイントを変更します

## 環境設定

実際の `.env` パターンに基づく：

```bash
# Blockfrost (preprod用)
BLOCKFROST_PROVIDER_API_KEY=your_blockfrost_key

# Ogmios (RPCアクセス用) 
OGMIOS_PROVIDER_HTTP_URL=https://preprod.cardano-rpc.hydrawallet.app

# Hydra (L2操作用)
HEXCORE_API_TOKEN=your_hexcore_token
```

すべての例には、プレイグラウンドの実装に示されているように、適切な環境変数処理が含まれています。
