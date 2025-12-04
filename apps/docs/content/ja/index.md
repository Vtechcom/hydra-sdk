# Hydra SDK ドキュメント v1.1.0

Hydra SDKの包括的なドキュメントへようこそ。Hydra Layer 2統合を備えた完全なCardano ウォレットアプリケーション開発ツールキットです。

## Hydra SDKとは？

Hydra SDKは、Cardanoウォレット機能とHydra Head管理をアプリケーションに統合するための重要なライブラリとツールを提供する包括的なソフトウェア開発キットです。Turborepoを使用したモノレポアーキテクチャで構築され、Cardano開発への モジュール化した拡張可能なアプローチを提供します。

**最新リリース: v1.1.0** - 強力なユーティリティ関数と改善された開発者体験で強化されています。

## 主な機能

- **🏦 Cardanoウォレット管理**: アカウント/アドレス派生に対応した完全なHDウォレットサポート
- **⚡ Hydra Layer 2統合**: 完全なHydra Head ライフサイクル管理とリアルタイム処理
- **🔧 トランザクションビルダー**: Hydraサポート付きの高度なトランザクション構築
- **🌐 リアルタイムイベント**: WebSocketおよびSocket.IOサポートでライブ更新を実現
- **📦 モジュラーアーキテクチャ**: カスタマイズが容易なパッケージベースのアーキテクチャ
- **🔒 TypeScript優先**: 包括的な型定義と型安全性
- **🛠️ 強力なユーティリティ**: Cardano開発用の豊富なユーティリティ関数コレクション
- **📊 データ変換**: 高度なシリアル化、デシリアル化、データ解析ユーティリティ

## クイックスタート

数分でHydra SDKを使い始めましょう:

```bash
# コアパッケージのインストール
npm install @hydra-sdk/core @hydra-sdk/bridge @hydra-sdk/transaction

# シンプルなウォレットをユーティリティで作成
import { 
  AppWallet, 
  NETWORK_ID, 
  ParserUtils, 
  TimeUtils, 
  DatumUtils 
} from '@hydra-sdk/core'

const wallet = new AppWallet({
  networkId: NETWORK_ID.PREPROD,
  key: { type: 'mnemonic', words: AppWallet.brew() }
})

const account = wallet.getAccount(0, 0)
console.log('Address:', account.baseAddressBech32)

// ユーティリティを使用した一般的なタスク
const currentSlot = TimeUtils.resolveSlotNo('preprod')
const datum = DatumUtils.mkInt(42)
const hexData = ParserUtils.stringToHex('Hello Hydra SDK v1.1.0!')

console.log('Current slot:', currentSlot)
console.log('Datum hex:', datum.to_hex())
console.log('Message as hex:', hexData)
```

## コアパッケージ

### [@hydra-sdk/core](/ja/2.api/1.core)
HDウォレットサポート、トランザクション署名、ネットワーク統合を含むコアCardanoウォレット機能。

### [@hydra-sdk/bridge](/ja/2.api/2.bridge)
完全なHeadライフサイクル管理、リアルタイムイベント、トランザクション処理を備えたHydra Layer 2統合。

### [@hydra-sdk/transaction](/ja/2.api/3.transaction)
Hydraサポート、UTxO管理、手数料最適化を備えた高度なトランザクション構築ユーティリティ。

### [@hydra-sdk/cardano-wasm](/ja/2.api/cardano-wasm)
ブラウザアプリケーション用Cardano WASMバインディング、シリアル化と暗号化操作対応。

## アーキテクチャ概要

```mermaid
graph TD
    A[Your Application] --> B[@hydra-sdk/core]
    A --> C[@hydra-sdk/bridge]
    A --> D[@hydra-sdk/transaction]
    
    B --> E[@hydra-sdk/cardano-wasm]
    C --> B
    C --> E
    D --> B
    D --> E
    
    E --> F[Cardano Serialization Lib]
    C --> G[Socket.IO Client]
    
    H[Hydra Node] -.-> C
    I[Cardano Network] -.-> B
```

## ユースケース

### DApp開発
シームレスなCardanoウォレット統合とHydra Layer 2スケーリングを備えた分散型アプリケーションを構築します。

### ウォレットアプリケーション
HDウォレットサポート、トランザクション管理、リアルタイム更新を備えた機能豊富なウォレットアプリケーションを作成します。

### 支払いソリューション
Hydra Headsを使用した高速で低コストな支払いソリューションを実装して、即座のトランザクションを実現します。

### DeFiプロトコル
高度なトランザクション構築とリアルタイム状態管理を使用してDeFiプロトコルと統合します。

## はじめに

構築を始める準備ができたら、ガイドをチェックしてください:

- [インストールガイド](/ja/1.getting-started/installation) - 開発環境をセットアップします
- [クイックスタートチュートリアル](/ja/1.getting-started/quick-start) - 初めてのアプリケーションを構築します
- [設定ガイド](/ja/1.getting-started/configuration) - プロジェクトを設定します

## 例

実践的な例を探索してください:

- [ウォレット作成](/ja/3.examples/wallet-creation) - ウォレットの作成と管理
- [Hydra統合](/ja/3.examples/hydra-integration) - Hydra Headsへの接続
- [トランザクション構築](/ja/3.examples/transaction-building) - トランザクションの構築と送信
- [完全なアプリケーション](/ja/3.examples/full-application) - 完全なアプリケーション例

## コミュニティ & サポート

- **GitHub**: [hydra-sdk](https://github.com/Vtechcom/hydra-sdk)
- **ドキュメント**: [hydra-sdk.dev](https://hydra-sdk.dev)
- **Issues**: [バグ報告と機能リクエスト](https://github.com/Vtechcom/hydra-sdk/issues)
- **Discussions**: [コミュニティディスカッション](https://github.com/Vtechcom/hydra-sdk/discussions)

## ライセンス

Hydra SDKはオープンソースソフトウェアで、[MITライセンス](https://github.com/Vtechcom/hydra-sdk/blob/dev/LICENSE)の下でライセンスされています。
