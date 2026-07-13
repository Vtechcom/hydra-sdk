---
title: ガイド
description: Hydra SDK を使った Cardano ウォレットアプリ構築と Hydra 連携のステップバイステップガイド
---

# ガイド

このセクションでは、Hydra SDK を使って Cardano ウォレットアプリケーションを構築し、Hydra Layer 2 と連携するためのステップバイステップガイドとベストプラクティスをまとめています。

## 概要

ガイドは、次のようなカテゴリに整理されています。

1. **[Building Wallet Apps](/ja/4.guides/building-wallet-app)** – Cardano ウォレットの作成と管理
2. **[Working with Utilities](/ja/4.guides/working-with-utilities)** – SDK の Utility 関数を使いこなす
3. **[Mint / Burn Tokens](/ja/4.guides/mint-burn-tokens)** – Native token の mint / burn 操作
4. **Hydra Head Management** – Hydra Layer 2 への接続と Hydra Head の管理
5. **Testing Strategies** – アプリケーションのテスト戦略

## v1.4.0 での更新ポイント

- **RedeemerUtils** – スクリプトの redeemer を構築するための新しい名前空間（`mkRedeemer`、`mkSpendRedeemer`、`mkMintRedeemer`、`mkUnitRedeemer`）
- **新しい DatumUtils エンコーダー** – `mkList`、`mkBool`、`mkOption`、`mkBytesList`、`mkIntList`、`mkOutputRef`、`mkAddress`、`parseAddress`
- **ValidationUtils と AddressUtils** – `ValidationUtils.isValidTxOutput`、および移設された `AddressUtils.isValidAddress` と `getPubkeyHashFromAddress`
- **Deserializer.deserializeAmountsFromTx** – トランザクションから統合された出力金額を読み取ります。Resolver のメモリリーク修正と protocol v11 のデフォルト値も含みます

> 参照: [はじめに](/ja/getting-started/), [API](/ja/api/), [例](/ja/examples/)
