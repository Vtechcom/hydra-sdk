---
title: API リファレンス
description: Hydra SDK の完全な API 仕様
---

# API リファレンス

Hydra SDK ドキュメントの API リファレンスセクションへようこそ。ここでは、すべての SDK パッケージとメソッドの詳細なドキュメントを提供しています。

## 概要

Hydra SDK は、4つの主要パッケージと包括的なユーティリティコレクションで構成されています：

1. [**@hydra-sdk/core**](/ja/2.api/1.core) - コアウォレット機能
2. [**@hydra-sdk/bridge**](/ja/2.api/2.bridge) - Hydra Layer 2 統合
3. [**@hydra-sdk/transaction**](/ja/2.api/3.transaction) - トランザクション構築ユーティリティ
4. [**@hydra-sdk/cardano-wasm**](/ja/2.api/4.cardano-wasm) - 高度なブロックチェーン操作のための Cardano WASM バインディング
5. [**Utilities**](/ja/2.api/5.utilities) - Cardano 開発用の包括的なユーティリティ関数コレクション

## v1.1.0 の新機能

- **Enhanced Utilities**: データ解析、datum 処理、ポリシー管理、時間計算のための新しいユーティリティ関数
- **Improved Type Safety**: より優れた TypeScript 定義と型チェック
- **Provider Abstractions**: 異なるブロックチェーンデータソース用の統一プロバイダーインターフェース
- **Advanced WASM Operations**: シリアライズとデシリアライズのための拡張 WASM ユーティリティ
