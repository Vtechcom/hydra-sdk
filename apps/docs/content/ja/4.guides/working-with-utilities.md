---
title: Utilities を使いこなす
description: nodejs-playground の実装をベースに Hydra SDK の Utilities を活用する方法
---

# Utilities を使いこなす

このガイドでは、`nodejs-playground/src` の実コードをベースに、`@hydra-sdk/core` が提供する **Utilities** 群（`DatumUtils`, `ParserUtils`, `PolicyUtils`, `TimeUtils`, `Serializer`, `Deserializer`, `KeysUtils`, `MetadataUtils`, `ProviderUtils` など）の代表的な使い方をまとめます。

## 基本インポート

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

## コアパターン

### 1. Key Generation（`gen-fund-key.ts` パターン）

```typescript
import { KeysUtils } from '@hydra-sdk/core'

// Cardano CLI 互換の ed25519 キーペア
const cardanoKeys = KeysUtils.cardanoCliKeygen()
console.log('Cardano keys:', cardanoKeys)

// Hydra 互換の ed25519 キーペア
const hydraKeys = KeysUtils.hydraCliKeygen()
console.log('Hydra keys:', hydraKeys)

// signing key から verification key を生成
const vkey = KeysUtils.genVkey(cardanoKeys.sk)
console.log('Derived vkey:', vkey)
```

### 2. Token 作成ユーティリティ（`mint-burn-token.ts` パターン）

```typescript
import { PolicyUtils, ParserUtils, Serializer } from '@hydra-sdk/core'

const walletAddress = wallet.getAccount().baseAddressBech32
const scriptCborHex =
	PolicyUtils.buildMintingPolicyScriptFromAddress(walletAddress)
const policyId = PolicyUtils.policyIdFromNativeScript(scriptCborHex)

const assetNameHex = ParserUtils.stringToHex('MyToken')
const assetUnit = Serializer.serializeAssetUnit(policyId, assetNameHex)

console.log('Policy ID:', policyId)
console.log('Asset Unit:', assetUnit)
```

### 3. 複雑な Datum 構築（実運用パターン）

```typescript
import { DatumUtils } from '@hydra-sdk/core'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

const buildDatum = (
	key: string,
	l1Vkh: string,
	l2Vkh: string,
	amount: string
) => {
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

const datum = buildDatum(
	'ee91e90e791e4cd983d1b1f331d1e8eb',
	'326cd6bff6114c4d14ebf2385883aac43c4e64476e6a47314f9b2003',
	'f602ad4b16ec2e1a96989dc140eacf546359695cfece8510c8d1c0ac',
	'4000000'
)
```

### 4. Metadata Utilities（`metadata.test.ts` パターン）

```typescript
import { MetadataUtils, ParserUtils } from '@hydra-sdk/core'

const vkeyHash = '34f37700b10586c0662e42fcbdf3339c4c52d10e4b13fdef22ecd9b2'

const metadata = MetadataUtils.metadataObjToMetadatum({
	toHeadId: ParserUtils.toBytes(
		'4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
	),
	toAddress: ParserUtils.toBytes(vkeyHash)
})

console.log('Metadata CBOR:', metadata.to_hex())
```

### 5. TimeUtils と SLOT_CONFIG_NETWORK

```typescript
import { TimeUtils, SLOT_CONFIG_NETWORK } from '@hydra-sdk/core'

const currentSlot = TimeUtils.unixTimeToEnclosingSlot(
	Date.now(),
	SLOT_CONFIG_NETWORK.PREPROD
)

const deadline = TimeUtils.unixTimeToEnclosingSlot(
	Date.now() + 24 * 60 * 60 * 1000,
	SLOT_CONFIG_NETWORK.PREPROD
)

const readableTime = TimeUtils.slotToBeginUnixTime(
	currentSlot,
	SLOT_CONFIG_NETWORK.PREPROD
)

console.log('Current slot:', currentSlot)
console.log('Deadline slot:', deadline)
console.log('Readable time:', new Date(readableTime))
```

### 6. ProviderUtils での Provider 設定

```typescript
import { ProviderUtils } from '@hydra-sdk/core'

const blockfrostProvider = new ProviderUtils.BlockfrostProvider({
	apiKey: process.env.BLOCKFROST_PROJECT_ID || '',
	network: 'preprod'
})

const ogmiosProvider = new ProviderUtils.OgmiosProvider({
	network: 'preprod',
	apiEndpoint: 'http://localhost:1337'
})

// provider の fetcher を通じてアドレスの UTxO を取得
const utxos = await blockfrostProvider.fetcher.fetchAddressUTxOs(address)

// 注意: provider は protocol parameters を公開していません。Hydra Head 内では
// 代わりに bridge から読み取ってください: await bridge.getProtocolParameters()
```

## v1.4.0 の新機能

### 7. Redeemer の構築（RedeemerUtils）

```typescript
import { RedeemerUtils, DatumUtils } from '@hydra-sdk/core'

// PlutusData を Redeemer にラップする（tag はデフォルトで 'spend'、index は 0）
const data = DatumUtils.mkConstr(1, [])
const redeemer = RedeemerUtils.mkRedeemer(data, { tag: 'spend', index: 0 })

// tag をあらかじめ設定したヘルパー
const spendRedeemer = RedeemerUtils.mkSpendRedeemer(data)
const mintRedeemer = RedeemerUtils.mkMintRedeemer(data)

// 「引数なし」の Unit redeemer: Constr(0, [])
const unitRedeemer = RedeemerUtils.mkUnitRedeemer()

// 実行ユニット（プレースホルダーの予算 — 本番ではスクリプトを評価してください）
const exUnits = RedeemerUtils.mkExUnits(RedeemerUtils.DEFAULT_EX_UNITS)
```

### 8. 新しい Datum エンコーダー（DatumUtils）

```typescript
import { DatumUtils, NETWORK_ID } from '@hydra-sdk/core'

// リスト
const list = DatumUtils.mkList([DatumUtils.mkInt(1), DatumUtils.mkInt(2)])
const bytesList = DatumUtils.mkBytesList(['deadbeef', 'cafe'])
const intList = DatumUtils.mkIntList([1, 2, 3])

// 真偽値: False = Constr(0, [])、True = Constr(1, [])
const flag = DatumUtils.mkBool(true)

// Option: Some = Constr(0, [v])、None = Constr(1, [])
const some = DatumUtils.mkOption(DatumUtils.mkInt(42))
const none = DatumUtils.mkOption()

// Output reference: Constr(0, [Bytes(txHash), Int(index)])
const outRef = DatumUtils.mkOutputRef({ txHash: 'abc123...', index: 0 })

// Address <-> PlutusData
const addrDatum = DatumUtils.mkAddress('addr_test1...')
const bech32 = DatumUtils.parseAddress(addrDatum, NETWORK_ID.PREPROD)
```

### 9. 検証 Utilities（ValidationUtils / AddressUtils）

```typescript
import { ValidationUtils, AddressUtils } from '@hydra-sdk/core'

// トランザクション出力の形式を検証
const okOutput = ValidationUtils.isValidTxOutput({
	address: 'addr_test1...',
	amount: [{ unit: 'lovelace', quantity: '2000000' }]
})

// アドレスを検証（type: 'bech32' | 'hex' | 'bytes'、デフォルトは 'bech32'）
const okAddress = AddressUtils.isValidAddress('addr_test1...')

// payment key hash を抽出（導出できない場合は null を返す）
const pubKeyHash = AddressUtils.getPubkeyHashFromAddress('addr_test1...')
```

### 10. トランザクションからすべての金額を読み取る（Deserializer）

```typescript
import { Deserializer } from '@hydra-sdk/core'

// すべての出力の金額を unit ごとに統合して合計
const amounts = Deserializer.deserializeAmountsFromTx(signedTxCbor)
console.log('Total amounts:', amounts)
```

### 11. Demeter Provider（ProviderUtils.DemeterProvider）

```typescript
import { ProviderUtils } from '@hydra-sdk/core'

// Demeter は BlockfrostProvider を継承し、同じ .fetcher / .submitter を持ちます
const demeterProvider = new ProviderUtils.DemeterProvider({
	authToken: process.env.DEMETER_AUTH_TOKEN || '',
	network: 'preprod'
})

const utxos = await demeterProvider.fetcher.fetchAddressUTxOs(address)
```

## データ変換パイプライン

`ParserUtils` / `Serializer` / `Deserializer` を組み合わせた end-to-end 変換パターンです。

```typescript
import { ParserUtils, Serializer, Deserializer } from '@hydra-sdk/core'

const processTokenData = (tokenName: string, metadata: Record<string, any>) => {
	const nameHex = ParserUtils.stringToHex(tokenName)

	const metadataEntries = Object.entries(metadata).map(([key, value]) => ({
		key: ParserUtils.stringToHex(key),
		value: ParserUtils.stringToHex(String(value))
	}))

	return { nameHex, metadataEntries }
}

const processAssetUnit = (policyId: string, assetName: string) => {
	const assetNameHex = ParserUtils.stringToHex(assetName)
	const assetUnit = Serializer.serializeAssetUnit(policyId, assetNameHex)

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

// 使用例
const tokenData = processTokenData('MyNFT', {
	name: 'Special NFT',
	creator: 'Hydra Team',
	rarity: 'Legendary'
})

const assetData = processAssetUnit('abc123...', 'MyToken')
```

## エラーハンドリングパターン

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

// フォールバック付きで使用
const result = safeConversion('test data', 'hex') || 'default_hex_value'
```

## まとめ

- Utilities は **低レベル処理（CBOR / PlutusData / asset unit / time）** を安全に扱うためのレイヤー
- 基本的には nodejs-playground にある実コードをそのままパターンとして再利用できる
- 型と変換の流れ（string → bytes → hex → datum / metadata）を意識すると、複雑なロジックも整理しやすくなります。
