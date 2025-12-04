---
title: v1.1.x へのマイグレーションガイド
description: 旧バージョンの Hydra SDK から v1.1.x へ移行するためのステップと主な変更点を解説します
---

# v1.1.x へのマイグレーションガイド

このガイドでは、Hydra SDK の旧バージョン (v1.0.x 系) から **v1.1.x** へアップグレードする際に必要な変更点と、代表的なマイグレーションパターンを紹介します。

## 何が変わったのか

### 新しい Utilities System

v1.1.0 では、ユーティリティ群が **namespace ベース** に再編され、より整理された API 構造になりました。

**Before (v1.0.x):**

```ts
// 個別ユーティリティを直接 import（存在する場合）
import { someUtility } from '@hydra-sdk/core/utils/some-utility'
```

**After (v1.1.x):**

```ts
// namespace import を利用
import {
  ParserUtils,
  TimeUtils,
  DatumUtils,
  PolicyUtils,
  Serializer,
  Deserializer,
} from '@hydra-sdk/core'
```

これにより、**API の見通しが良くなり、型補完も向上** します。

---

## Breaking Changes

### 1. ユーティリティ関数の整理

**Before:**

```ts
// utils 直下からの import
import { hexToBytes, bytesToHex } from '@hydra-sdk/core/utils'
```

**After:**

```ts
// ParserUtils に集約
import { ParserUtils } from '@hydra-sdk/core'

const hex = ParserUtils.bytesToHex(bytes)
const bytes = ParserUtils.hexToBytes(hex)
```

**対応方針:**

- `@hydra-sdk/core/utils/...` からの深い import はすべて `ParserUtils` / `TimeUtils` / `DatumUtils` などの namespace import に置き換えてください。

### 2. Time / Slot Utilities

以前は、独自関数や外部ライブラリで slot 計算を行っていたケースが多くありました。

**Before:**

```ts
// 独自の slot 計算ロジック
const currentSlot = calculateSlot(Date.now())
```

**After:**

```ts
import { TimeUtils, SLOT_CONFIG_NETWORK } from '@hydra-sdk/core'

const currentSlot = TimeUtils.unixTimeToEnclosingSlot(
  Date.now(),
  SLOT_CONFIG_NETWORK.PREPROD,
)
const futureSlot = TimeUtils.unixTimeToEnclosingSlot(
  Date.now() + 3600000,
  SLOT_CONFIG_NETWORK.PREPROD,
)
```

**対応方針:**

- すべての slot 計算を `TimeUtils.unixTimeToEnclosingSlot()` に統一し、ネットワークには `SLOT_CONFIG_NETWORK` を使用してください。

### 3. Datum 作成フロー

**Before:**

```ts
// CardanoWASM を直接操作
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

const datum = CardanoWASM.PlutusData.new_integer(
  CardanoWASM.BigInt.from_str('42'),
)
```

**After:**

```ts
import { DatumUtils } from '@hydra-sdk/core'

const datum = DatumUtils.mkInt(42)
const bytesDatum = DatumUtils.mkBytes('deadbeef')
const constrDatum = DatumUtils.mkConstr(0, [datum, bytesDatum])
```

**対応方針:**

- 低レベルな WASM API を直接扱う代わりに、`DatumUtils` を利用して datum を構築します。

---

## マイグレーション手順

### Step 1: 依存関係の更新

```bash
# 最新版へ更新
npm update @hydra-sdk/core @hydra-sdk/bridge @hydra-sdk/transaction

# またはバージョンを指定
npm install @hydra-sdk/core@^1.1.0
```

### Step 2: import 文の整理

深いパスからの import をすべて namespace import に置き換えます。

```ts
// ❌ 旧スタイル – 削除対象
import { someUtility } from '@hydra-sdk/core/utils/some-utility'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

// ✅ 新スタイル – 推奨
import {
  ParserUtils,
  TimeUtils,
  DatumUtils,
  PolicyUtils,
  Serializer,
  Deserializer,
  Resolver,
  Converter,
  BuildKeys,
  ProviderUtils,
  CostModels,
} from '@hydra-sdk/core'
```

### Step 3: 手動処理の置き換え

#### データ変換

**Before:**

```ts
const hex = Buffer.from(bytes).toString('hex')
const bytes = Buffer.from(hex, 'hex')
```

**After:**

```ts
import { ParserUtils } from '@hydra-sdk/core'

const hex = ParserUtils.bytesToHex(bytes)
const bytes = ParserUtils.hexToBytes(hex)
```

#### 時刻計算

**Before:**

```ts
const slot = Math.floor((Date.now() - SHELLEY_START) / SLOT_LENGTH) + SHELLEY_SLOT_START
```

**After:**

```ts
import { TimeUtils, SLOT_CONFIG_NETWORK } from '@hydra-sdk/core'

const slot = TimeUtils.unixTimeToEnclosingSlot(
  Date.now(),
  SLOT_CONFIG_NETWORK.PREPROD,
)
```

#### Datum 作成

**Before:**

```ts
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

const datum = CardanoWASM.PlutusData.new_constr_plutus_data(
  CardanoWASM.ConstrPlutusData.new(
    CardanoWASM.BigNum.from_str('0'),
    list,
  ),
)
```

**After:**

```ts
import { DatumUtils } from '@hydra-sdk/core'

const datum = DatumUtils.mkConstr(0, [field1, field2])
```

### Step 4: Provider 利用の更新

独自実装の Provider を使っていた場合は、`ProviderUtils` ベースの実装へ移行することを検討してください。

```ts
// ❌ 旧スタイル – カスタム Provider
class MyProvider {
  async getUtxos(address: string) {
    // カスタム実装
  }
}

// ✅ 新スタイル – 組み込み Provider の利用
import { ProviderUtils } from '@hydra-sdk/core'

const provider = new ProviderUtils.BlockfrostProvider({
  projectId: 'your-project-id',
  network: 'preprod',
})

// ✅ 必要に応じて BaseProvider を継承
class MyProvider extends ProviderUtils.BaseProvider {
  async getUtxos(address: string) {
    // BaseProvider のメソッドを活用した実装
  }
}
```

---

## 代表的なマイグレーションパターン

### パターン 1: Metadata 作成

**Before:**

```ts
const metadata = {
  721: {
    [policyId]: {
      [tokenName]: {
        name: Buffer.from(name).toString('hex'),
        image: Buffer.from(image).toString('hex'),
      },
    },
  },
}
```

**After:**

```ts
import { ParserUtils, DatumUtils } from '@hydra-sdk/core'

const metadata = {
  721: {
    [policyId]: {
      [tokenName]: {
        name: ParserUtils.stringToHex(name),
        image: ParserUtils.stringToHex(image),
      },
    },
  },
}

// または datum として表現
const metadataDatum = DatumUtils.mkMap([
  [
    DatumUtils.mkBytes(ParserUtils.stringToHex('name')),
    DatumUtils.mkBytes(ParserUtils.stringToHex(name)),
  ],
  [
    DatumUtils.mkBytes(ParserUtils.stringToHex('image')),
    DatumUtils.mkBytes(ParserUtils.stringToHex(image)),
  ],
])
```

### パターン 2: トランザクションの有効期限

**Before:**

```ts
const validFrom = getCurrentSlot()
const validUntil = validFrom + 7200 // 1 hour in slots
```

**After:**

```ts
import { TimeUtils, SLOT_CONFIG_NETWORK } from '@hydra-sdk/core'

const validFrom = TimeUtils.unixTimeToEnclosingSlot(
  Date.now(),
  SLOT_CONFIG_NETWORK.PREPROD,
)
const validUntil = TimeUtils.unixTimeToEnclosingSlot(
  Date.now() + 3600000,
  SLOT_CONFIG_NETWORK.PREPROD,
)
```

### パターン 3: Policy Script の作成

**Before:**

```ts
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

const keyHash = CardanoWASM.Ed25519KeyHash.from_hex(publicKeyHash)
const scriptPubkey = CardanoWASM.ScriptPubkey.new(keyHash)
const policy = CardanoWASM.NativeScript.new_script_pubkey(scriptPubkey)
```

**After:**

```ts
import { PolicyUtils } from '@hydra-sdk/core'

const policy = PolicyUtils.buildPolicyScriptFromPubkey({
  type: 'sig',
  keyHash: publicKeyHash,
})

// またはアドレスから生成
const policyFromAddress = PolicyUtils.buildMintingPolicyScriptFromAddress(address)
```

---

## マイグレーションの検証

### 1. 基本機能テスト

```ts
import {
  AppWallet,
  NETWORK_ID,
  ParserUtils,
  TimeUtils,
  DatumUtils,
} from '@hydra-sdk/core'

// ウォレット作成テスト
const wallet = new AppWallet({
  networkId: NETWORK_ID.PREPROD,
  key: { type: 'mnemonic', words: AppWallet.brew() },
})

// ユーティリティテスト
const hex = ParserUtils.stringToHex('test')
const slot = TimeUtils.unixTimeToEnclosingSlot(Date.now(), 'preprod')
const datum = DatumUtils.mkInt(42)

console.log('Migration test passed:', {
  address: wallet.getAccount(0, 0).baseAddressBech32,
  hex,
  slot,
  datumHex: datum.to_hex(),
})
```

### 2. データ変換テスト

```ts
import { ParserUtils } from '@hydra-sdk/core'

const testData = ['Hello World', '🚀 Hydra SDK', 'Special chars: åøæ']

testData.forEach((str) => {
  const hex = ParserUtils.stringToHex(str)
  const back = Buffer.from(hex, 'hex').toString('utf8')

  console.assert(str === back, `Conversion failed for: ${str}`)
})

console.log('Data conversion tests passed')
```

### 3. Time Utilities テスト

```ts
import { TimeUtils } from '@hydra-sdk/core'

const networks = ['mainnet', 'preprod', 'preview'] as const

networks.forEach((network) => {
  const slot = TimeUtils.unixTimeToEnclosingSlot(Date.now(), network)
  console.assert(
    typeof slot === 'number' && slot > 0,
    `Invalid slot for network: ${network}`,
  )
})

console.log('Time utilities tests passed')
```

---

## トラブルシューティング

### よくある問題と対処

1. **Import Error**

   ```text
   Error: Module not found: @hydra-sdk/core/utils/...
   ```

   **原因:** 旧来の深いパスからの import が残っている可能性があります。

   **対処:** すべての import を namespace ベース (`ParserUtils`, `TimeUtils` など) に変更してください。

2. **型エラー (Utilities)**

   ```text
   Error: Property 'stringToHex' does not exist on type...
   ```

   **原因:** 誤った名前空間、または import していないユーティリティを参照している可能性があります。

   **対処:** `ParserUtils.stringToHex` のように、正しい namespace とメソッド名を使用しているか確認してください。

3. **Slot 計算のエラー**

   ```text
   Error: Invalid network parameter
   ```

   **対処:** `'mainnet'` / `'preprod'` / `'preview'` のいずれかを使用しているか確認してください。

---

## さらに詳しく知りたい場合

マイグレーション後は、次のドキュメントを併せて参照することをおすすめします。

- [Working with Utilities Guide](/guides/working-with-utilities)
- [Utilities Examples](/examples/utilities-examples)
- [API Reference – Utilities](/api/utilities)

これらを活用することで、v1.1.x の新しいユーティリティ API を最大限に活かした実装パターンを習得できます。

---

## まとめ

v1.1.x へのマイグレーションは、主に **import パターンの更新** と **ユーティリティ API の置き換え** が中心です。

- コードベース全体で namespace import を利用することで、構造が明確になり、型補完も強化されます。
- TimeUtils / DatumUtils / PolicyUtils などの高レベルユーティリティを使うことで、低レベルな WASM 操作から解放され、より安全かつ読みやすいコードになります。

多少の移行コストは発生しますが、その分 **開発体験 (DX)** と **保守性** が大きく向上し、今後の機能追加にも対応しやすいコードベースになります。
